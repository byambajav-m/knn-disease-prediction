from __future__ import annotations
import os
import pandas as pd
import numpy as np
from typing import List, Set, Dict
from sklearn.preprocessing import MultiLabelBinarizer
from .config import DATASET_CSV, SYMPTOM_SEVERITY_CSV, DESCRIPTION_CSV, PRECAUTION_CSV
from .utils import normalize_symptom

# Validate files exist
required = [DATASET_CSV, SYMPTOM_SEVERITY_CSV, DESCRIPTION_CSV, PRECAUTION_CSV]
missing = [p for p in required if not os.path.exists(p)]
if missing:
    raise FileNotFoundError(f"Missing expected CSV(s): {missing}")

raw_df = pd.read_csv(DATASET_CSV)
severity_df = pd.read_csv(SYMPTOM_SEVERITY_CSV)
desc_df = pd.read_csv(DESCRIPTION_CSV)
prec_df = pd.read_csv(PRECAUTION_CSV)

# Build vocabulary
severity_df["Symptom"] = severity_df["Symptom"].apply(normalize_symptom)
symptom_vocab: Set[str] = set(severity_df["Symptom"].dropna().tolist())

symptom_cols = [c for c in raw_df.columns if c.lower().startswith("symptom_")]
for c in symptom_cols:
    symptom_vocab.update(raw_df[c].dropna().map(normalize_symptom))
symptom_vocab.discard("")

# Encode dataset
labels: List[str] = raw_df["Disease"].astype(str).tolist()
symptom_sets: List[List[str]] = []
for _, row in raw_df.iterrows():
    present = []
    for c in symptom_cols:
        val = normalize_symptom(row.get(c, ""))
        if val:
            present.append(val)
    symptom_sets.append(present)

mlb = MultiLabelBinarizer(classes=sorted(symptom_vocab))
X = mlb.fit_transform(symptom_sets).astype(np.float32)
y = np.array(labels)
X_bool = X.astype(bool)
known_symptom_set = set(mlb.classes_.tolist())

# Optional disease info maps
_desc_map: Dict[str, str] = {str(r["Disease"]): str(r["Description"]) for _, r in desc_df.iterrows()}
_prec_map: Dict[str, List[str]] = {}
for _, r in prec_df.iterrows():
    disease = str(r["Disease"]) if not pd.isna(r["Disease"]) else ""
    steps = [s for s in [r.get("Precaution_1"), r.get("Precaution_2"),
                         r.get("Precaution_3"), r.get("Precaution_4")]
             if isinstance(s, str) and s.strip()]
    _prec_map[disease] = steps
