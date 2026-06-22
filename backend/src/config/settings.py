from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str

    SECRET_KEY:                  str
    ALGORITHM:                   str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS:   int = 7

    APP_NAME:        str  = "BizRise API"
    DEBUG:           bool = False
    ALLOWED_ORIGINS: str  = "*"

    UPLOAD_DIR:       str = "uploads"
    MAX_FILE_SIZE_MB: int = 2

    @property
    def ORIGINS_LIST(self) -> List[str]:
        origins = [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]
        if "*" in origins or not origins:
            return ["*"]
        return origins

    class Config:
        env_file = ".env"

settings = Settings()
