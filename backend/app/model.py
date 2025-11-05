# app/model.py
import numpy as np
from typing import Dict, List, Tuple
from sklearn.neighbors import NearestNeighbors
from .data import X, X_bool, y, mlb, known_symptom_set
from .utils import normalize_symptom

EPS = 1e-9

def vectorize(symptoms: List[str]) -> Tuple[np.ndarray, List[str], List[str]]:
    norm = [normalize_symptom(s) for s in symptoms]
    used = [s for s in norm if s in known_symptom_set]
    ignored = [s for s in norm if s and s not in known_symptom_set]
    if not used:
        raise ValueError("None of the provided symptoms are recognized.")
    vx = mlb.transform([used]).astype(np.float32)
    return vx, used, ignored

def nearest_neighbors(vx: np.ndarray, k: int, metric: str):
    # Use correct space per metric
    if metric in {"hamming", "jaccard"}:
        X_space = X_bool
        q_space = vx.astype(bool)
    else:
        X_space = X
        q_space = vx

    # Ask for more than k so we can dedupe by label cleanly
    ask = min(max(k * 8, k), X_space.shape[0])

    nn = NearestNeighbors(n_neighbors=ask, metric=metric, algorithm="brute")
    nn.fit(X_space)
    distances, indices = nn.kneighbors(q_space, return_distance=True)
    return distances[0], indices[0]

def collapse_by_label(indices: np.ndarray, distances: np.ndarray):
    """
    Collapse multiple hits from the same disease label into one:
    - distance: min distance among its hits
    - count: how many hits collapsed
    - agg_weight: sum of 1/(d+EPS) across hits (for voting)
    Returns lists aligned by label order sorted by increasing min distance.
    """
    best_dist: Dict[str, float] = {}
    count: Dict[str, int] = {}
    agg_weight: Dict[str, float] = {}

    for idx, d in zip(indices.tolist(), distances.tolist()):
        label = str(y[int(idx)])
        if label not in best_dist or d < best_dist[label]:
            best_dist[label] = d
        count[label] = count.get(label, 0) + 1
        agg_weight[label] = agg_weight.get(label, 0.0) + 1.0 / float(d + EPS)

    # Sort by closest (min) distance
    ordered = sorted(best_dist.items(), key=lambda kv: kv[1])
    labels = [lab for lab, _ in ordered]
    dists = [best_dist[lab] for lab in labels]
    counts = [count[lab] for lab in labels]
    weights = [agg_weight[lab] for lab in labels]
    return labels, dists, counts, weights

def distance_weighted_vote_from_weights(labels: List[str], weights: List[float]) -> str:
    # labels/weights already aggregated per disease
    return max(zip(labels, weights), key=lambda t: t[1])[0]
