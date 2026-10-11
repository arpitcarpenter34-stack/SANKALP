from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from .engine import WhatToWatchEngine, WatchNote

router = APIRouter(prefix="/what-to-watch", tags=["monitoring"])

class WhatToWatchRequest(BaseModel):
    event_id: str
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    paths: List[List[str]]
    time_series_metadata: Dict[str, Dict[str, Any]]
    consensus_result: Optional[Dict[str, Any]] = None

class WhatToWatchResponse(BaseModel):
    notes: List[WatchNote]

engine = WhatToWatchEngine()

@router.post("/", response_model=WhatToWatchResponse)
def generate_what_to_watch_notes(request: WhatToWatchRequest):
    try:
        notes = engine.generate_notes(
            event_id=request.event_id,
            nodes=request.nodes,
            edges=request.edges,
            paths=request.paths,
            time_series_metadata=request.time_series_metadata,
            consensus_result=request.consensus_result
        )
        return WhatToWatchResponse(notes=notes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
