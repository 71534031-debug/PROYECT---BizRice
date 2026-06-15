import pyodbc
from typing import Any


class BaseRepository:
    """Repositorio base que ejecuta procedimientos almacenados.

    Recibe una conexión pyodbc directa (no SQLAlchemy session)
    y ejecuta EXEC sp_name @param1=?, @param2=? retornando listas de dicts.
    """

    def __init__(self, db: pyodbc.Connection):
        self.db = db

    def execute_sp(self, sp_name: str, params: dict[str, Any] | None = None) -> list[dict[str, Any]]:
        """Ejecuta un procedimiento almacenado y retorna lista de dicts.

        Cada dict representa una fila del primer resultset.
        Si el SP retorna múltiples resultsets, usar execute_sp_multi().
        """
        if params is None:
            params = {}

        cursor = self.db.cursor()
        param_str = ", ".join([f"@{k}=?" for k in params.keys()])
        query = f"EXEC {sp_name} {param_str}" if param_str else f"EXEC {sp_name}"
        cursor.execute(query, list(params.values()))

        if cursor.description is None:
            cursor.close()
            return []

        columns = [col[0] for col in cursor.description]
        rows = [dict(zip(columns, row)) for row in cursor.fetchall()]
        cursor.close()
        return rows

    def execute_sp_multi(self, sp_name: str, params: dict[str, Any] | None = None) -> list[list[dict[str, Any]]]:
        """Ejecuta SP y retorna TODOS los resultsets como listas de dicts.

        Útil para SPs que devuelven múltiples tablas (ej: detalle + redes + promos).
        """
        if params is None:
            params = {}

        cursor = self.db.cursor()
        param_str = ", ".join([f"@{k}=?" for k in params.keys()])
        query = f"EXEC {sp_name} {param_str}" if param_str else f"EXEC {sp_name}"
        cursor.execute(query, list(params.values()))

        results = []
        while True:
            if cursor.description:
                columns = [col[0] for col in cursor.description]
                rows = [dict(zip(columns, row)) for row in cursor.fetchall()]
                results.append(rows)
            else:
                results.append([])
            if not cursor.nextset():
                break

        cursor.close()
        return results

    def execute_sp_single(self, sp_name: str, params: dict[str, Any] | None = None) -> dict[str, Any] | None:
        """Ejecuta SP y retorna la primera fila del primer resultset, o None."""
        rows = self.execute_sp(sp_name, params)
        return rows[0] if rows else None
