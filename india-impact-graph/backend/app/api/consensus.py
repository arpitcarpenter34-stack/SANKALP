from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any
from pydantic import BaseModel
from graph.consensus import NewsConsensusService, ArticleClaim, ConsensusResult
import csv
import os

router = APIRouter(prefix="/consensus", tags=["Consensus"])

service = NewsConsensusService()

class ConsensusRequest(BaseModel):
    event_id: str
    claims: List[ArticleClaim]

@router.post("", response_model=ConsensusResult, include_in_schema=False)
@router.post("/", response_model=ConsensusResult)
def evaluate_consensus(request: ConsensusRequest):
    """
    Evaluates consensus among multiple reported claims for a specific financial event.
    """
    if not request.claims:
        raise HTTPException(status_code=400, detail="Must provide at least one claim.")

    return service.compare_claims(request.event_id, request.claims)
