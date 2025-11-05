# KNN Disease Prediction FastAPI


Project structure (files to save):
- train.py
- app.py
- utils.py
- requirements.txt
- models/ (directory created by training)


Overview:
- Train multiple KNN models with different distance metrics (euclidean, manhattan, cosine).
- Run FastAPI app to query predictions and explanations showing nearest neighbors and contributions.


Quick start:
1. Ensure `dataset.csv` (you already uploaded) is in the same folder as these files.
Optional: add `symptom_severity.csv`, `symptom_description.csv`, `symptom_precaution.csv` if available.
2. Create a Python virtualenv and install requirements:
```bash
python -m venv venv
source venv/bin/activate # on Windows: venv\Scripts\activate
pip install -r requirements.txt
```
3. Train models (this creates `models/` and saves files):
```bash
python train.py
```
4. Run the API:
```bash
uvicorn app:app --reload
```


Endpoints:
- GET /metrics -> returns available metrics (model names)
- GET /symptoms -> returns available symptoms the model was trained on
- POST /predict -> JSON body: {"metrics": "euclidean", "symptoms": ["fever","cough"]}
Returns predicted disease, top-k neighbors, distances, matching symptoms per neighbor, and explanation scores.


Notes:
- If description/precaution files are missing, the app will return default placeholders.