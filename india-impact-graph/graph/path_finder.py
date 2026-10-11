from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Set
import copy

class PathFinderError(Exception):
    pass

class InvalidGraphError(PathFinderError):
    pass

class NodeNotFoundError(PathFinderError):
    pass

class InvalidParameterError(PathFinderError):
    pass

@dataclass
class PathResult:
    nodes: List[str]
    edges: List[str]
    length: int
    min_confidence_score: int
    observed_ratio: float
    edge_metadata: List[Dict[str, Any]]

    def get_sort_key(self):
        """
        Ranking criteria:
        1. Higher minimum confidence (3=high, 2=medium, 1=low, 0=none)
        2. Higher observed edge proportion
        3. Shorter path (so negative length)
        4. Stable lexicographical order of node and edge IDs
        """
        id_str = ",".join(self.nodes) + "|" + ",".join(self.edges)
        return (
            self.min_confidence_score,
            self.observed_ratio,
            -self.length,
            id_str
        )

class ImpactPathFinder:
    CONFIDENCE_MAP = {
        "high": 3,
        "medium": 2,
        "low": 1
    }

    def __init__(self, graph_data: Dict[str, Any]):
        if not isinstance(graph_data, dict) or "nodes" not in graph_data or "edges" not in graph_data:
            raise InvalidGraphError("Invalid graph representation.")

        self.nodes = {node["id"]: node for node in graph_data["nodes"]}

        # Build adjacency list
        self.adjacency: Dict[str, List[Dict[str, Any]]] = {n: [] for n in self.nodes}
        self.edges = {}
        for edge in graph_data["edges"]:
            src = edge.get("source_node")
            tgt = edge.get("target_node")
            if not src or not tgt:
                raise InvalidGraphError(f"Edge '{edge.get('id')}' is missing source or target node.")
            if src not in self.nodes:
                raise InvalidGraphError(f"Edge '{edge.get('id')}' references unknown source node '{src}'.")
            if tgt not in self.nodes:
                raise InvalidGraphError(f"Edge '{edge.get('id')}' references unknown target node '{tgt}'.")

            self.adjacency[src].append(edge)
            self.edges[edge.get("id")] = edge

    def find_paths(
        self,
        source_id: str,
        target_id: Optional[str] = None,
        max_depth: int = 5,
        limit: int = 3
    ) -> List[PathResult]:

        if source_id not in self.nodes:
            raise NodeNotFoundError(f"Source node '{source_id}' not found.")
        if target_id is not None and target_id not in self.nodes:
            raise NodeNotFoundError(f"Target node '{target_id}' not found.")
        if not isinstance(max_depth, int) or max_depth <= 0:
            raise InvalidParameterError("max_depth must be a positive integer.")
        if not isinstance(limit, int) or limit <= 0:
            raise InvalidParameterError("limit must be a positive integer.")

        all_paths = []

        def dfs(current_node: str, current_path_nodes: List[str], current_path_edges: List[Dict[str, Any]]):
            if len(current_path_edges) > max_depth:
                return

            # If we found target (or if target is None and we want all paths? The prompt says "find paths to a specified target or eligible downstream outcomes".
            # If target is None, we could yield all valid paths, but we will just yield paths that don't go any further (leaf paths) or any path.
            # Let's yield any valid path > 0 length if no target is specified, or paths ending at target if specified.
            is_valid_path = False
            if target_id is not None:
                if current_node == target_id and len(current_path_edges) > 0:
                    is_valid_path = True
            else:
                if len(current_path_edges) > 0:
                    is_valid_path = True

            if is_valid_path:
                all_paths.append(self._build_path_result(current_path_nodes, current_path_edges))

            # Continue traversal
            if len(current_path_edges) < max_depth:
                for edge in self.adjacency[current_node]:
                    tgt = edge["target_node"]
                    # Prevent cycles
                    if tgt not in current_path_nodes:
                        current_path_nodes.append(tgt)
                        current_path_edges.append(edge)
                        dfs(tgt, current_path_nodes, current_path_edges)
                        current_path_edges.pop()
                        current_path_nodes.pop()

        dfs(source_id, [source_id], [])

        # If no target specified, we might have sub-paths of longer paths.
        # But we only want to rank all of them.

        # Deduplicate paths (since graph could technically have multiple edges between same nodes, our ids will differentiate)
        # Sort and limit
        # Reverse=True for descending sort on the first three items, but the 4th item (id_str) we want alphabetical (ascending).
        # We can implement a custom sort by manipulating the tuple.
        # Actually, Python sorts tuples element by element. To sort id_str ascending while others descending,
        # we can sort ascending first, then sort by the descending criteria.

        all_paths.sort(key=lambda x: x.nodes + x.edges) # Base sort for stable ID
        all_paths.sort(
            key=lambda x: (x.min_confidence_score, x.observed_ratio, -x.length),
            reverse=True
        )

        return all_paths[:limit]

    def _build_path_result(self, nodes: List[str], edges: List[Dict[str, Any]]) -> PathResult:
        edge_ids = [e["id"] for e in edges]

        # Calculate minimum confidence
        min_conf = 3 # Start at high
        observed_count = 0

        edge_meta = []
        for e in edges:
            conf_val = self.CONFIDENCE_MAP.get(e.get("confidence"), 0)
            if conf_val < min_conf:
                min_conf = conf_val

            if e.get("kind") == "observed":
                observed_count += 1

            meta = {
                "id": e["id"],
                "kind": e.get("kind"),
                "confidence": e.get("confidence"),
                "receipt": copy.deepcopy(e.get("receipt"))
            }
            edge_meta.append(meta)

        obs_ratio = observed_count / len(edges) if edges else 0.0

        return PathResult(
            nodes=list(nodes),
            edges=edge_ids,
            length=len(edges),
            min_confidence_score=min_conf,
            observed_ratio=obs_ratio,
            edge_metadata=edge_meta
        )
