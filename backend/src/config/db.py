import psycopg2
from psycopg2 import pool
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


connection_pool = psycopg2.pool.SimpleConnectionPool(
    1,
    10,
    dsn=settings.DATABASE_URL,
)


def get_db_conn():
    """Dependency FastAPI — inyecta conexión psycopg2 directa para queries.

    Uso en controllers:
        def endpoint(conn = Depends(get_db_conn)):
            repo = UserRepository(conn)
            ...
    """
    conn = connection_pool.getconn()
    conn.autocommit = False
    try:
        yield conn
    finally:
        connection_pool.putconn(conn)
