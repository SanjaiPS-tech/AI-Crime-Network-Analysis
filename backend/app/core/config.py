import os
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    DEBUG: bool = True

    # NLP
    SPACY_MODEL: str = "en_core_web_trf"
    USE_TRANSFORMERS: bool = True

    # Graph
    MIN_EDGE_WEIGHT: float = 1.0
    SUSPICIOUS_DEGREE_THRESHOLD: int = 5
    SUSPICIOUS_BETWEENNESS_THRESHOLD: float = 0.3

    # File upload
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: set = {".txt", ".pdf", ".json", ".csv"}

    # Data paths
    DATA_DIR: str = os.path.join(os.path.dirname(__file__), "..", "data")
    RAW_DATA_DIR: str = os.path.join(DATA_DIR, "raw")
    PROCESSED_DATA_DIR: str = os.path.join(DATA_DIR, "processed")

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()