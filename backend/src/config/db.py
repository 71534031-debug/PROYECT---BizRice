import pyodbc
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from src.config.settings import settings


class Base(DeclarativeBase):
    pass


engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Dependency FastAPI — inyecta sesión SQLAlchemy (legacy, para seed/scripts)."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_conn():
    """Dependency FastAPI — inyecta conexión pyodbc directa para SPs.

    Uso en controllers:
        def endpoint(conn = Depends(get_db_conn)):
            repo = UserRepository(conn)
            ...
    """
    driver = settings.DB_DRIVER
    conn_str = (
        f"DRIVER={{{driver}}};"
        f"SERVER={settings.DB_SERVER};"
        f"DATABASE={settings.DB_NAME};"
        f"UID={settings.DB_USER};"
        f"PWD={settings.DB_PASSWORD}"
    )
    conn = pyodbc.connect(conn_str, autocommit=False)
    try:
        yield conn
    finally:
        conn.close()
