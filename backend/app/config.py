import os

# Data files live inside the /data directory next to /app
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

DATASET_CSV = os.getenv("DATASET_CSV", os.path.join(DATA_DIR, "dataset.csv"))
SYMPTOM_SEVERITY_CSV = os.getenv("SYMPTOM_SEVERITY_CSV", os.path.join(DATA_DIR, "symptom-severity.csv"))
DESCRIPTION_CSV = os.getenv("DESCRIPTION_CSV", os.path.join(DATA_DIR, "description.csv"))
PRECAUTION_CSV = os.getenv("PRECAUTION_CSV", os.path.join(DATA_DIR, "precaution.csv"))

DEFAULT_K = int(os.getenv("KNN_K", "7"))
AVAILABLE_METRICS = {"hamming", "jaccard", "cosine", "euclidean"}
