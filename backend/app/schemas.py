# app/schemas.py
from pydantic import BaseModel, Field
from typing import List, Dict, Any
from .config import DEFAULT_K

class PredictRequest(BaseModel):
    symptoms: List[str]
    k: int = Field(DEFAULT_K, ge=1, le=50)
    metric: str = Field("hamming", description="hamming | jaccard | cosine | euclidean")

class NeighborItem(BaseModel):
    label: str
    distance: float
    count: int | None = None         # number of collapsed hits for this label
    agg_weight: float | None = None  # sum of 1/(d+eps) across collapsed hits

class PredictResponse(BaseModel):
    predicted_disease: str
    k: int
    metric: str
    neighbors: List[NeighborItem]
    used_symptoms: List[str]
    ignored_symptoms: List[str]
