from src.repositories.base_repository import BaseRepository


class ProductRepository(BaseRepository):

    def get_by_business(self, id_emprendimiento: int, page: int = 1, size: int = 20,
                        busqueda: str | None = None) -> dict:
        offset = (page - 1) * size
        sql = """WITH filtered AS (
            SELECT id_producto, nombre, descripcion, precio, imagen_url, stock, estado_stock, activo, fecha_creacion
            FROM Productos
            WHERE id_emprendimiento = %(id_emprendimiento)s
              AND activo = TRUE
              AND (%(busqueda)s IS NULL OR nombre ILIKE CONCAT('%%', %(busqueda)s, '%%'))
        )
        SELECT *, (SELECT COUNT(*) FROM filtered) AS total,
               %(size)s AS size, %(page)s AS page,
               CEIL((SELECT COUNT(*)::decimal FROM filtered) / NULLIF(%(size)s, 0)) AS pages
        FROM filtered
        ORDER BY fecha_creacion DESC
        LIMIT %(size)s OFFSET %(offset)s"""

        rows = self.execute_sp(sql, {
            "id_emprendimiento": id_emprendimiento,
            "page": page, "size": size, "offset": offset,
            "busqueda": busqueda,
        })
        if not rows:
            return {"items": [], "total": 0, "page": page, "size": size, "pages": 0}
        meta = rows[0]
        return {
            "items": rows,
            "total": meta.get("total", 0),
            "page": meta.get("page", page),
            "size": meta.get("size", size),
            "pages": meta.get("pages", 0),
        }

    def create(self, id_emprendimiento: int, data: dict) -> dict | None:
        sql = """INSERT INTO Productos (id_emprendimiento, nombre, descripcion, precio, imagen_url, stock, estado_stock)
                 VALUES (%(id_emprendimiento)s, %(nombre)s, %(descripcion)s, %(precio)s, %(imagen_url)s, %(stock)s, %(estado_stock)s)
                 RETURNING id_producto, nombre, descripcion, precio, imagen_url, estado_stock, activo, fecha_creacion"""
        return self.execute_sp_single(sql, {
            "id_emprendimiento": id_emprendimiento,
            "nombre": data.get("nombre"),
            "descripcion": data.get("descripcion"),
            "precio": data.get("precio"),
            "imagen_url": data.get("imagen_url"),
            "stock": data.get("stock", 0),
            "estado_stock": data.get("estado_stock", "disponible"),
        })

    def update(self, id_producto: int, id_emprendimiento: int, data: dict) -> dict | None:
        sets = []
        params = {"id_producto": id_producto, "id_emprendimiento": id_emprendimiento}
        for key in ("nombre", "descripcion", "precio", "imagen_url", "stock", "estado_stock"):
            if key in data:
                sets.append(f"{key} = %({key})s")
                params[key] = data[key]
        if not sets:
            return self._get_by_id(id_producto)
        set_clause = ", ".join(sets)
        sql = f"""UPDATE Productos SET {set_clause}
                  WHERE id_producto = %(id_producto)s AND id_emprendimiento = %(id_emprendimiento)s
                  RETURNING id_producto, nombre, descripcion, precio, imagen_url, estado_stock, activo, fecha_creacion"""
        return self.execute_sp_single(sql, params)

    def _get_by_id(self, id_producto: int) -> dict | None:
        sql = "SELECT id_producto, nombre, descripcion, precio, imagen_url, estado_stock, activo, fecha_creacion FROM Productos WHERE id_producto = %(id_producto)s"
        return self.execute_sp_single(sql, {"id_producto": id_producto})

    def delete(self, id_producto: int, id_emprendimiento: int) -> dict | None:
        sql = """UPDATE Productos SET activo = FALSE
                 WHERE id_producto = %(id_producto)s AND id_emprendimiento = %(id_emprendimiento)s
                 RETURNING 'Producto eliminado' AS mensaje"""
        return self.execute_sp_single(sql, {
            "id_producto": id_producto,
            "id_emprendimiento": id_emprendimiento,
        })
