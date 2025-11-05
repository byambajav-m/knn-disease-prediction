from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router

app = FastAPI(title="KNN Disease Predictor API")

# Allow everything — for local demo only!
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # ✅ allow all origins
    allow_credentials=False,    # must be False when using '*'
    allow_methods=["*"],        # allow GET, POST, OPTIONS, etc.
    allow_headers=["*"],        # allow all headers
)

app.include_router(api_router)

@app.get("/health")
def health():
    return {"status": "ok"}
