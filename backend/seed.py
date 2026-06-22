"""Seed script — ejecuta neon_seeds.sql contra la BD de Neon.

Uso:
    python seed.py                    # seed directo
    python seed.py --force            # reinicia tablas (DROP + CREATE + seed)
"""

import os, sys, logging
sys.path.insert(0, os.path.dirname(__file__))

import psycopg2
from src.config.settings import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

SEED_FILE = os.path.join(os.path.dirname(__file__), "src", "database", "neon_seeds.sql")
SCHEMA_FILE = os.path.join(os.path.dirname(__file__), "src", "database", "neon_schema.sql")

def run_sql_file(conn, filepath: str, label: str):
    if not os.path.exists(filepath):
        logger.warning(f"Archivo no encontrado: {filepath}")
        return
    with open(filepath, "r", encoding="utf-8") as f:
        sql = f.read()
    cursor = conn.cursor()
    try:
        cursor.execute(sql)
        conn.commit()
        logger.info(f"{label}: OK — ejecutado correctamente")
    except Exception as e:
        conn.rollback()
        logger.error(f"{label}: ERROR — {e}")
        raise
    finally:
        cursor.close()

def seed():
    logger.info(f"Conectando a Neon: {settings.DATABASE_URL.split('@')[-1]}")
    conn = psycopg2.connect(settings.DATABASE_URL)
    conn.autocommit = False
    try:
        if "--force" in sys.argv:
            run_sql_file(conn, SCHEMA_FILE, "Schema")
        run_sql_file(conn, SEED_FILE, "Seed")
        logger.info("Seed completado exitosamente")
    finally:
        conn.close()

if __name__ == "__main__":
    seed()
