# app/api/routes.py
import numpy as np
from fastapi import APIRouter, HTTPException, Query
from ..schemas import PredictRequest, PredictResponse, NeighborItem
from ..config import AVAILABLE_METRICS
from ..data import mlb, y, X
from ..model import (
    vectorize, nearest_neighbors, collapse_by_label,
    distance_weighted_vote_from_weights
)
from ..config import DATA_DIR
from pathlib import Path
import pandas as pd

router = APIRouter()

@router.get("/symptoms")
def list_symptoms():
    return {"count": len(mlb.classes_), "symptoms": list(mlb.classes_)}

@router.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    metric = req.metric.lower().strip()
    if metric not in AVAILABLE_METRICS:
        raise HTTPException(status_code=400, detail=f"Unsupported metric '{req.metric}'. Choose one of {sorted(AVAILABLE_METRICS)}")

    try:
        vx, used, ignored = vectorize(req.symptoms)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    k = max(1, min(int(req.k), X.shape[0]))

    # get raw neighbors
    distances, indices = nearest_neighbors(vx, k, metric)

    labels, dists, counts, weights = collapse_by_label(indices, distances)

    # keep only up to k unique diseases
    labels = labels[:k]
    dists = dists[:k]
    counts = counts[:k]
    weights = weights[:k]

    pred = distance_weighted_vote_from_weights(labels, weights)

    neighbors = [
        NeighborItem(label=lab, distance=float(d), count=int(c), agg_weight=float(w))
        for lab, d, c, w in zip(labels, dists, counts, weights)
    ]

    return PredictResponse(
        predicted_disease=str(pred),
        k=k,
        metric=metric,
        neighbors=neighbors,
        used_symptoms=used,
        ignored_symptoms=ignored,
    )


def _csv_path() -> Path:
    base = Path(__file__).resolve().parents[2]  # .../backend/
    p = base / "data" / "dataset.csv"
    if not p.exists():
        # fallback: .../backend/app/data/dataset.csv
        alt = Path(__file__).resolve().parents[1] / "data" / "dataset.csv"
        if alt.exists():
            return alt
        raise HTTPException(status_code=404, detail=f"Missing file: {p}")
    return p

@router.get("/dataset/paginated")
def dataset_paginated(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=1000),
):
    try:
        csv_path = _csv_path()
        df = pd.read_csv(csv_path)

        cols = []
        if "Disease" in df.columns:
            cols.append("Disease")
        cols += [c for c in df.columns if c.startswith("Symptom_")]
        if not cols:
            cols = df.columns.tolist()
        df = df[cols].copy()

        df = df.replace([np.inf, -np.inf], np.nan)

        total = int(df.shape[0])
        start = (page - 1) * page_size
        if start >= total and total > 0:

            last_page = (total - 1) // page_size + 1
            start = (last_page - 1) * page_size
            page = last_page
        end = min(start + page_size, total)

        def s(x):
            try:
                if x is None or (isinstance(x, float) and pd.isna(x)) or pd.isna(x):
                    return ""
            except Exception:
                pass
            return str(x)

        slice_df = df.iloc[start:end]
        rows = [[s(v) for v in t] for t in slice_df.itertuples(index=False, name=None)]

        return {
            "columns": [str(c) for c in df.columns.tolist()],
            "rows": rows,
            "total": total,
            "page": page,
            "page_size": page_size,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"/dataset/paginated failed: {e}")