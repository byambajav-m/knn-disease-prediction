# Disease Prediction using KNN (FastAPI + React)

A simple full-stack demo app that predicts diseases based on symptoms using the **K-Nearest Neighbors (KNN)** algorithm.


---

## Backend Setup (FastAPI)

### 1️⃣ Create and Activate Virtual Environment
cd app/backend  
python3 -m venv .venv  
source .venv/bin/activate        # macOS / Linux  
# or  
.venv\Scripts\activate           # Windows  

### 2️⃣ Install Dependencies
pip install -r requirements.txt  

If you don’t have a `requirements.txt`, create one with:  
fastapi  
uvicorn  
pandas  
numpy  
scikit-learn  

### 3️⃣ Run Backend Server
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload  

Backend available at: http://localhost:8080  
API docs: http://localhost:8080/docs  

---

## Frontend Setup (React + Tailwind + Recharts)

### 1️⃣ Install Dependencies
cd app/frontend  
npm install  

### 2️⃣ Run Dev Server
npm run dev  

Frontend available at: http://localhost:5173  

If needed, create `.env` in `frontend/` with:  
VITE_API_BASE=http://localhost:8080  

---

## API Endpoints

| Method | Endpoint | Description |
|--------|-----------|-------------|
| GET | /symptoms | List all available symptoms |
| POST | /predict | Predict disease based on given symptoms |
| GET | /dataset/paginated | Paginated dataset for frontend table view |

---

## Example Predict Request
curl -X POST http://localhost:8080/predict \
  -H "Content-Type: application/json" \
  -d '{
        "symptoms": ["itching", "skin_rash", "nodal_skin_eruptions"],
        "k": 5,
        "metric": "cosine"
      }'

Response:
{
  "predicted_disease": "Fungal infection",
  "neighbors": [...],
  "metric": "cosine"
}

---

## Dataset Source

All CSV files (`dataset.csv`, `description.csv`, `precaution.csv`, `symptom-severity.csv`) used in this project are from the Kaggle dataset:  
 **[Disease Symptom Description Dataset – Kaggle](https://www.kaggle.com/datasets/itachi9604/disease-symptom-description-dataset?resource=download&select=symptom_precaution.csv)**  

Ensure these files are located in:  
`app/backend/data/`

---

##  Notes
- Backend runs on **http://localhost:8080**  
- Frontend runs on **http://localhost:5173**  
- CORS is open for local development.  
- Dataset loaded from `app/backend/data/` directory.  

---

## 📜 License
MIT License — free to modify and use for demos or presentations.
