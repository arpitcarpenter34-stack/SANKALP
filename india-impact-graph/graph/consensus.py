from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class ArticleClaim(BaseModel):
    article_id: str
    source_url: str
    publisher: str
    publication_date: str
    extracted_event: Optional[Dict[str, Any]]

class ConsensusResult(BaseModel):
    event_id: str
    status: str  # AGREEMENT, DISAGREEMENT, UNIQUE_CLAIM, INSUFFICIENT_EVIDENCE
    source_count: int
    publisher_count: int
    root_source_count: int
    source_lineage_status: str
    consensus_scope: str
    comparable_claims: List[Dict[str, Any]]
    explanation: str
    limitations: str

class NewsConsensusService:
    def __init__(self):
        pass

    def compare_claims(self, event_id: str, claims: List[ArticleClaim]) -> ConsensusResult:
        # Filter claims that actually have the event
        valid_claims = [c for c in claims if c.extracted_event is not None and c.extracted_event.get("event_id") == event_id]
        
        # Deduplicate by publisher/source to avoid derivative coverage counting as independent
        publishers = set()
        roots = set()
        independent_claims = []
        unknown_root = False
        
        for c in valid_claims:
            pub = c.publisher.lower().strip()
            # Extract root source if available, otherwise mark unknown
            root = c.extracted_event.get("root_source")
            if root:
                roots.add(root.lower().strip())
            else:
                unknown_root = True
                
            if pub not in publishers:
                publishers.add(pub)
                independent_claims.append(c)
        
        publisher_count = len(publishers)
        root_source_count = len(roots) if not unknown_root else len(roots) # Just the known ones
        
        if unknown_root:
            source_lineage_status = "UNKNOWN"
        elif root_source_count == 1 and publisher_count > 1:
            source_lineage_status = "MULTI_PUBLISHER_SINGLE_ROOT"
        elif root_source_count > 1:
            source_lineage_status = "INDEPENDENT_ROOTS"
        else:
            source_lineage_status = "SINGLE_PUBLISHER"

        consensus_scope = "Agreement among published reports, not proof of the underlying event."
        limitations = "Consensus describes source reporting; it does not predict market outcomes."
        
        independent_count = publisher_count
        
        if independent_count < 2:
            if independent_count == 1:
                return ConsensusResult(
                    event_id=event_id,
                    status="UNIQUE_CLAIM",
                    source_count=independent_count,
                    publisher_count=publisher_count,
                    root_source_count=root_source_count,
                    source_lineage_status=source_lineage_status,
                    consensus_scope=consensus_scope,
                    comparable_claims=[self._format_claim(independent_claims[0])],
                    explanation="Only one independent source reported this claim.",
                    limitations=limitations
                )
            else:
                return ConsensusResult(
                    event_id=event_id,
                    status="INSUFFICIENT_EVIDENCE",
                    source_count=0,
                    publisher_count=0,
                    root_source_count=0,
                    source_lineage_status="UNKNOWN",
                    consensus_scope=consensus_scope,
                    comparable_claims=[],
                    explanation="No valid independent sources found for this event.",
                    limitations=limitations
                )
                
        # We have >= 2 independent claims. Let's check for agreement.
        directions = set()
        values = []
        
        for c in independent_claims:
            mag = c.extracted_event.get("magnitude", {})
            dir = mag.get("direction")
            val = mag.get("value")
            if dir:
                directions.add(dir)
            if val is not None:
                values.append(val)
                
        if len(directions) > 1:
            return ConsensusResult(
                event_id=event_id,
                status="DISAGREEMENT",
                source_count=independent_count,
                publisher_count=publisher_count,
                root_source_count=root_source_count,
                source_lineage_status=source_lineage_status,
                consensus_scope=consensus_scope,
                comparable_claims=[self._format_claim(c) for c in independent_claims],
                explanation="Sources report conflicting directions for the event magnitude.",
                limitations=limitations
            )
            
        if values:
            max_val = max(values)
            min_val = min(values)
            if max_val > 0 and (max_val - min_val) / max_val > 0.2:
                return ConsensusResult(
                    event_id=event_id,
                    status="DISAGREEMENT",
                    source_count=independent_count,
                    publisher_count=publisher_count,
                    root_source_count=root_source_count,
                    source_lineage_status=source_lineage_status,
                    consensus_scope=consensus_scope,
                    comparable_claims=[self._format_claim(c) for c in independent_claims],
                    explanation="Sources report materially different magnitude values.",
                    limitations=limitations
                )
                
        return ConsensusResult(
            event_id=event_id,
            status="AGREEMENT",
            source_count=independent_count,
            publisher_count=publisher_count,
            root_source_count=root_source_count,
            source_lineage_status=source_lineage_status,
            consensus_scope=consensus_scope,
            comparable_claims=[self._format_claim(c) for c in independent_claims],
            explanation="Sources agree on the direction and approximate magnitude of the event.",
            limitations=limitations
        )
        
    def _format_claim(self, claim: ArticleClaim) -> Dict[str, Any]:
        return {
            "source": claim.publisher,
            "url": claim.source_url,
            "date": claim.publication_date,
            "magnitude": claim.extracted_event.get("magnitude"),
            "evidence": claim.extracted_event.get("evidence_snippets"),
            "root_source": claim.extracted_event.get("root_source")
        }
