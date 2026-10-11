/**
 * BharatImpact — Domain-Specific Economic Impact Graph Filter
 *
 * Implements deterministic filtering of economic knowledge graphs by domain:
 * 1. All domains ('all'): Complete graph model.
 * 2. Petrol & Diesel ('petrol'): Crude oil, refining, pump fuels, freight logistics, and conveyance budget.
 * 3. LPG / CNG ('lpg'): Natural gas, LNG imports, domestic cylinders, and city gas mobility.
 * 4. Semiconductors ('semiconductors'): Chip fabrication, components, ODM assembly, and consumer electronics.
 * 5. Food & Agriculture ('food'): Mandi arrivals, edible oils, cereals, vegetables, and household food basket.
 * 6. Currency & Markets ('currency'): Forex exchange rates, CPI inflation, RBI repo rate, equities, and bonds.
 *
 * Enforces strict data integrity:
 * - Single derived filtered graph model per selection.
 * - Every edge strictly references nodes present in the filtered graph.
 * - Prevents orphan or disconnected relationships.
 * - Handles sparse or empty domains honestly without falling back to unrelated graphs.
 * - Supports both Transmission Flow (full DAG) and Sector View (sector-centric linkages).
 */

import type {
  KnowledgeGraphData,
  KnowledgeGraphNode,
  KnowledgeGraphEdge,
} from '../../types/contracts';

export type DomainFilterId =
  | 'all'
  | 'petrol'
  | 'lpg'
  | 'semiconductors'
  | 'food'
  | 'currency';

export interface DomainFilterDefinition {
  id: DomainFilterId;
  label: string;
  icon?: string;
  description: string;
}

export const DOMAIN_FILTER_DEFINITIONS: DomainFilterDefinition[] = [
  { id: 'all', label: 'All domains', description: 'Complete macroeconomic transmission graph' },
  { id: 'petrol', label: 'Petrol & Diesel', icon: '⛽', description: 'Crude oil, refining, pump fuels, and conveyance budget' },
  { id: 'lpg', label: 'LPG / CNG', icon: '🔥', description: 'Gas supply, domestic LPG cylinders, and city CNG mobility' },
  { id: 'semiconductors', label: 'Semiconductors', icon: '💻', description: 'Chip supply, electronics components, and manufacturing' },
  { id: 'food', label: 'Food & Agriculture', icon: '🌾', description: 'Agricultural commodities, mandi arrivals, and kitchen food basket' },
  { id: 'currency', label: 'Currency & Markets', icon: '📈', description: 'Forex exchange rates, CPI inflation, repo rates, and equities' },
];

/**
 * Checks if a node is relevant to the given domain based on explicit metadata or domain semantics.
 */
export function isNodeRelevantToDomain(
  node: KnowledgeGraphNode,
  domain: DomainFilterId
): boolean {
  if (domain === 'all') return true;

  // 1. Explicit domain metadata if present
  const nodeAny = node as unknown as Record<string, unknown>;
  const explicitDomain = nodeAny.domain || nodeAny.category;
  if (typeof explicitDomain === 'string') {
    const norm = explicitDomain.toLowerCase();
    if (norm === domain || norm.includes(domain)) return true;
  }
  if (Array.isArray(nodeAny.domains)) {
    if ((nodeAny.domains as string[]).some((d) => d.toLowerCase().includes(domain))) {
      return true;
    }
  }

  const id = node.id.toLowerCase();
  const label = (node.label || '').toLowerCase();
  const desc = (node.description || '').toLowerCase();
  const combined = `${id} ${label} ${desc}`;

  switch (domain) {
    case 'petrol':
      return (
        combined.includes('petrol') ||
        combined.includes('diesel') ||
        combined.includes('crude') ||
        combined.includes('brent') ||
        combined.includes('motor_spirit') ||
        combined.includes('motor spirit') ||
        combined.includes('hsd') ||
        combined.includes('fuel') ||
        combined.includes('freight') ||
        combined.includes('commute') ||
        combined.includes('conveyance') ||
        combined.includes('refin') ||
        combined.includes('omc') ||
        combined.includes('transport')
      );

    case 'lpg':
      return (
        combined.includes('lpg') ||
        combined.includes('cng') ||
        combined.includes('lng') ||
        combined.includes('gas') ||
        combined.includes('cooking fuel') ||
        combined.includes('cylinder') ||
        combined.includes('city gas') ||
        combined.includes('gail') ||
        combined.includes('png') ||
        combined.includes('pipeline')
      );

    case 'semiconductors':
      return (
        combined.includes('semi') ||
        combined.includes('chip') ||
        combined.includes('taiwan') ||
        combined.includes('tsmc') ||
        combined.includes('foundry') ||
        combined.includes('wafer') ||
        combined.includes('electronics') ||
        combined.includes('hardware') ||
        combined.includes('microchip') ||
        combined.includes('laptop') ||
        combined.includes('smartphone')
      );

    case 'food':
      return (
        combined.includes('food') ||
        combined.includes('agri') ||
        combined.includes('mandi') ||
        combined.includes('vegetable') ||
        combined.includes('crop') ||
        combined.includes('wheat') ||
        combined.includes('rice') ||
        combined.includes('atta') ||
        combined.includes('cereal') ||
        combined.includes('oilseed') ||
        combined.includes('edible_oil') ||
        combined.includes('edible oil') ||
        combined.includes('palm') ||
        combined.includes('cpo') ||
        combined.includes('farmgate') ||
        combined.includes('fmcg') ||
        combined.includes('kitchen')
      );

    case 'currency':
      return (
        combined.includes('currency') ||
        combined.includes('forex') ||
        combined.includes('fx') ||
        combined.includes('inr') ||
        combined.includes('usd') ||
        combined.includes('dxy') ||
        combined.includes('exchange rate') ||
        combined.includes('rbi') ||
        combined.includes('repo') ||
        combined.includes('cpi') ||
        combined.includes('inflation') ||
        combined.includes('bond') ||
        combined.includes('equity') ||
        combined.includes('financial') ||
        combined.includes('market') ||
        combined.includes('yield') ||
        combined.includes('fii') ||
        combined.includes('nifty')
      );

    default:
      return false;
  }
}

/**
 * Checks if an edge belongs to a domain via propagation path category, explicit tags, or semantic content.
 */
export function isEdgeRelevantToDomain(
  edge: KnowledgeGraphEdge,
  domain: DomainFilterId
): boolean {
  if (domain === 'all') return true;

  const edgeAny = edge as unknown as Record<string, unknown>;
  const explicitDomain = edgeAny.domain;
  if (typeof explicitDomain === 'string' && explicitDomain.toLowerCase().includes(domain)) {
    return true;
  }

  // Propagation category direct mapping
  if (domain === 'petrol' && edge.pathCategory === 'transport_cost') return true;
  if (domain === 'food' && edge.pathCategory === 'food_cost') return true;
  if (domain === 'currency' && edge.pathCategory === 'financial_market') return true;

  const id = edge.id.toLowerCase();
  const rel = (edge.relationType || '').toLowerCase();
  const quote = (edge.evidenceQuote || '').toLowerCase();
  const combined = `${id} ${rel} ${quote}`;

  switch (domain) {
    case 'petrol':
      return (
        combined.includes('petrol') ||
        combined.includes('diesel') ||
        combined.includes('crude') ||
        combined.includes('fuel') ||
        combined.includes('refin') ||
        combined.includes('freight') ||
        combined.includes('commute') ||
        combined.includes('conveyance') ||
        combined.includes('transport')
      );

    case 'lpg':
      return (
        combined.includes('lpg') ||
        combined.includes('cng') ||
        combined.includes('lng') ||
        combined.includes('gas') ||
        combined.includes('cooking') ||
        combined.includes('cylinder')
      );

    case 'semiconductors':
      return (
        combined.includes('semi') ||
        combined.includes('chip') ||
        combined.includes('foundry') ||
        combined.includes('electronics') ||
        combined.includes('component')
      );

    case 'food':
      return (
        combined.includes('food') ||
        combined.includes('mandi') ||
        combined.includes('vegetable') ||
        combined.includes('agri') ||
        combined.includes('wheat') ||
        combined.includes('edible')
      );

    case 'currency':
      return (
        combined.includes('currency') ||
        combined.includes('fx') ||
        combined.includes('exchange') ||
        combined.includes('repo') ||
        combined.includes('rbi') ||
        combined.includes('cpi') ||
        combined.includes('inflation') ||
        combined.includes('market') ||
        combined.includes('financial')
      );

    default:
      return false;
  }
}

/**
 * Derives a strictly filtered KnowledgeGraphData model based on active domain and view.
 * Guarantees referential integrity between nodes and edges, eliminating dangling references.
 */
export function deriveDomainFilteredGraph(
  data: KnowledgeGraphData | null,
  domain: string,
  view: 'transmission' | 'sector' = 'transmission'
): KnowledgeGraphData {
  if (!data || !data.nodes || data.nodes.length === 0) {
    return { nodes: [], edges: [], availablePaths: [] };
  }

  const validDomain = (domain as DomainFilterId) || 'all';

  // 1. DOMAIN FILTERING
  let domainNodes: KnowledgeGraphNode[];
  let domainEdges: KnowledgeGraphEdge[];

  if (validDomain === 'all') {
    domainNodes = [...data.nodes];
    domainEdges = [...(data.edges || [])];
  } else {
    // A. Collect edges relevant to the domain
    const candidateEdges = (data.edges || []).filter((e) =>
      isEdgeRelevantToDomain(e, validDomain)
    );

    // B. Identify all endpoints involved in candidate edges
    const edgeEndpointIds = new Set<string>();
    for (const e of candidateEdges) {
      edgeEndpointIds.add(e.from);
      edgeEndpointIds.add(e.to);
    }

    // C. Retain nodes that directly match the domain OR participate in domain edges
    domainNodes = data.nodes.filter((n) => {
      const matchesDirectly = isNodeRelevantToDomain(n, validDomain);
      const isEndpoint = edgeEndpointIds.has(n.id);
      return matchesDirectly || isEndpoint;
    });

    const validNodeIdSet = new Set(domainNodes.map((n) => n.id));

    // D. RECONCILE EDGES: Never include an edge if either source or target is missing
    domainEdges = candidateEdges.filter(
      (e) => validNodeIdSet.has(e.from) && validNodeIdSet.has(e.to)
    );

    // E. Eliminate orphan/disconnected nodes if edges exist
    if (domainEdges.length > 0) {
      const connectedNodeIds = new Set<string>();
      for (const e of domainEdges) {
        connectedNodeIds.add(e.from);
        connectedNodeIds.add(e.to);
      }
      domainNodes = domainNodes.filter((n) => connectedNodeIds.has(n.id));
    } else {
      // If no edges exist for this domain, only keep nodes that directly match the domain keywords
      domainNodes = domainNodes.filter((n) => isNodeRelevantToDomain(n, validDomain));
    }
  }

  // 2. VIEW FILTERING (Transmission Flow vs Sector View)
  if (view === 'sector') {
    const isSectorNode = (n: KnowledgeGraphNode) => {
      const nAny = n as unknown as Record<string, unknown>;
      return n.type === 'sector' || nAny.category === 'sector';
    };

    const sectorNodes = domainNodes.filter(isSectorNode);
    if (sectorNodes.length === 0) {
      // Domain has no sector nodes in this dataset -> cleanly return empty graph
      return { nodes: [], edges: [], availablePaths: [] };
    }

    const sectorNodeIds = new Set(sectorNodes.map((n) => n.id));

    // Edges connected to at least one sector node
    const sectorEdges = domainEdges.filter(
      (e) => sectorNodeIds.has(e.from) || sectorNodeIds.has(e.to)
    );

    const sectorConnectedNodeIds = new Set<string>();
    for (const e of sectorEdges) {
      sectorConnectedNodeIds.add(e.from);
      sectorConnectedNodeIds.add(e.to);
    }

    // Include sector nodes plus immediate upstream inputs and downstream impacts
    const sectorViewNodes = domainNodes.filter(
      (n) => sectorConnectedNodeIds.has(n.id) || sectorNodeIds.has(n.id)
    );

    return {
      nodes: sectorViewNodes,
      edges: sectorEdges,
      availablePaths: data.availablePaths || [],
    };
  }

  // Default: Transmission Flow view
  return {
    nodes: domainNodes,
    edges: domainEdges,
    availablePaths: data.availablePaths || [],
  };
}
