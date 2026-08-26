import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Hazela API Skeleton",
    description="Shared backend skeleton for parallel sprint development",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    """Health check endpoint to verify backend status."""
    return {"status": "ok", "environment": os.getenv("ENVIRONMENT", "development")}

# Register Voice Router
from app.routes.voice import router as voice_router
app.include_router(voice_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
