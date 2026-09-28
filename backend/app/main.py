from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router
from app.core.config import settings


def create_app() -> FastAPI:
    app = FastAPI(
        title="Crime Network Analysis API",
        description="AI-powered crime network analysis: entity extraction, relationship mapping, and suspicious pattern detection",
        version="1.0.0",
        debug=settings.DEBUG,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Configure appropriately for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    app.include_router(api_router)

    @app.get("/")
    async def root():
        return {
            "service": "Crime Network Analysis API",
            "version": "1.0.0",
            "status": "running",
            "docs": "/docs"
        }

    return app


app = create_app()