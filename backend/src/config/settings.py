from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # SQL Server
    DB_SERVER:   str
    DB_NAME:     str = "BizRiseDB"
    DB_USER:     str
    DB_PASSWORD: str
    DB_DRIVER:   str = "SQL Server"

    # JWT
    SECRET_KEY:                  str
    ALGORITHM:                   str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS:   int = 7

    # App
    APP_NAME:        str  = "BizRise API"
    DEBUG:           bool = False
    ALLOWED_ORIGINS: str  = "http://localhost:5500,http://127.0.0.1:5500"

    # Uploads
    UPLOAD_DIR:       str = "uploads"
    MAX_FILE_SIZE_MB: int = 2

    @property
    def DATABASE_URL(self) -> str:
        driver = self.DB_DRIVER.replace(" ", "+")
        return (
            f"mssql+pyodbc://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_SERVER}/{self.DB_NAME}?driver={driver}"
        )

    @property
    def ORIGINS_LIST(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"

settings = Settings()
