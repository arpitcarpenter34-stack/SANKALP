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
    comparable_claims: List[Dict[str, Any]]
    explanation: str
    limitations: str

class NewsConsensusService:
    def __init__(self):
        pass

    def compare_claims(self, event_id: str, claims: List[ArticleClaim]) -> ConsensusResult:
        # Filter claims that actually have the event
        valid_claims = [c for c in claims if c.extracted_event is not None and c.extracted_event.get("event_id") == event_id]
        source_count = len(valid_claims)
        
        # Deduplicate by publisher/source to avoid derivative coverage counting as independent
        publishers = set()
        independent_claims = []
        for c in valid_claims:
            pub = c.publisher.lower().strip()
            if pub not in publishers:
                publishers.add(pub)
                independent_claims.append(c)
        
        independent_count = len(independent_claims)
        
        limitations = "Consensus describes source reporting; it does not predict market outcomes."
        
        if independent_count < 2:
            if independent_count == 1:
                return ConsensusResult(
                    event_id=event_id,
                    status="UNIQUE_CLAIM",
                    source_count=independent_count,
                    comparable_claims=[self._format_claim(independent_claims[0])],
                    explanation="Only one independent source reported this claim.",
                    limitations=limitations
                )
            else:
                return ConsensusResult(
                    event_id=event_id,
                    status="INSUFFICIENT_EVIDENCE",
                    source_count=0,
                    comparable_claims=[],
                    explanation="No valid independent sources found for this event.",
                    limitations=limitations
                )
                
        # We have >= 2 independent claims. Let's check for agreement.
        # Agreement means same event_type, same magnitude direction, and value within 10%.
        # For simplicity, we check if directions match and values exist.
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
                comparable_claims=[self._format_claim(c) for c in independent_claims],
                explanation="Sources report conflicting directions for the event magnitude.",
                limitations=limitations
            )
            
        if values:
            max_val = max(values)
            min_val = min(values)
            # If max and min differ by more than 20% relative to max, it's disagreement
            if max_val > 0 and (max_val - min_val) / max_val > 0.2:
                return ConsensusResult(
                    event_id=event_id,
                    status="DISAGREEMENT",
                    source_count=independent_count,
                    comparable_claims=[self._format_claim(c) for c in independent_claims],
                    explanation="Sources report materially different magnitude values.",
                    limitations=limitations
                )
                
        return ConsensusResult(
            event_id=event_id,
            status="AGREEMENT",
            source_count=independent_count,
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
            "evidence": claim.extracted_event.get("evidence_snippets")
        }
