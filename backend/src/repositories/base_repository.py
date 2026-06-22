import psycopg2
import psycopg2.extras
from typing import Any


class BaseRepository:
    """Repositorio base que ejecuta consultas SQL directas sobre PostgreSQL.

    Recibe una conexión psycopg2 directa (no SQLAlchemy session)
    y ejecuta consultas SQL con parámetros nombrados %(name)s,
    retornando listas de dicts.
    """

    def __init__(self, db: psycopg2.extensions.connection):
        self.db = db

    def execute_sp(self, sql: str, params: dict[str, Any] | None = None) -> list[dict[str, Any]]:
        """Ejecuta una consulta SQL y retorna lista de dicts."""
        if params is None:
            params = {}

        cursor = self.db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute(sql, params)

        if cursor.description is None:
            cursor.close()
            return []

        rows = cursor.fetchall()
        result = [dict(row) for row in rows]
        cursor.close()
        return result

    def execute_sp_multi(self, sql: str, params: dict[str, Any] | None = None) -> list[list[dict[str, Any]]]:
        """Ejecuta múltiples consultas separadas por ; y retorna lista de resultsets."""
        if params is None:
            params = {}

        cursor = self.db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute(sql, params)

        results = []
        while True:
            if cursor.description:
                rows = cursor.fetchall()
                results.append([dict(row) for row in rows])
            else:
                results.append([])
            if not cursor.nextset():
                break

        cursor.close()
        return results

    def execute_sp_single(self, sql: str, params: dict[str, Any] | None = None) -> dict[str, Any] | None:
        """Ejecuta una consulta SQL y retorna la primera fila, o None."""
        rows = self.execute_sp(sql, params)
        return rows[0] if rows else None
