from src.repositories.base_repository import BaseRepository


class ReviewRepository(BaseRepository):

    def get_by_business(self, id_emprendimiento: int, page: int = 1, size: int = 5) -> dict:
        offset = (page - 1) * size

        sql_distribucion = """SELECT puntuacion AS estrella, COUNT(*) AS cantidad
                              FROM Valoraciones
                              WHERE id_emprendimiento = %(id_emprendimiento)s
                              GROUP BY puntuacion
                              ORDER BY puntuacion DESC"""

        sql_resenas = """WITH filtered AS (
            SELECT c.id_comentario, c.contenido, c.util_count, c.fecha,
                   v.puntuacion,
                   u.id_usuario, u.nombre AS usuario_nombre, u.apellido AS usuario_apellido, u.avatar_url
            FROM Comentarios c
            INNER JOIN Usuarios u ON c.id_usuario = u.id_usuario
            INNER JOIN Valoraciones v ON c.id_usuario = v.id_usuario AND c.id_emprendimiento = v.id_emprendimiento
            WHERE c.id_emprendimiento = %(id_emprendimiento)s
        )
        SELECT *, (SELECT COUNT(*) FROM filtered) AS total,
               %(size)s AS size, %(page)s AS page,
               CEIL((SELECT COUNT(*)::decimal FROM filtered) / NULLIF(%(size)s, 0)) AS pages
        FROM filtered
        ORDER BY fecha DESC
        LIMIT %(size)s OFFSET %(offset)s"""

        sql_promedio = """SELECT COALESCE(ROUND(AVG(puntuacion::decimal(3,1)), 1), 0) AS puntuacion_promedio,
                                 COUNT(*) AS total_valoraciones
                          FROM Valoraciones
                          WHERE id_emprendimiento = %(id_emprendimiento)s"""

        params = {"id_emprendimiento": id_emprendimiento, "page": page, "size": size, "offset": offset}

        distribucion_rows = self.execute_sp(sql_distribucion, params)
        items = self.execute_sp(sql_resenas, params)
        promedio_rows = self.execute_sp(sql_promedio, params)

        distribucion = {}
        for row in distribucion_rows:
            distribucion[str(row.get("estrella"))] = row.get("cantidad", 0)
        for i in range(1, 6):
            distribucion.setdefault(str(i), 0)

        promedio_data = promedio_rows[0] if promedio_rows else {}
        puntuacion_promedio = float(promedio_data.get("puntuacion_promedio", 0))
        total_valoraciones = int(promedio_data.get("total_valoraciones", 0))

        meta = items[0] if items else {}
        return {
            "items": items,
            "total": meta.get("total", total_valoraciones),
            "page": meta.get("page", page),
            "size": meta.get("size", size),
            "pages": meta.get("pages", 0),
            "puntuacion_promedio": puntuacion_promedio,
            "distribucion_estrellas": distribucion,
        }

    def create(self, id_usuario: int, id_emprendimiento: int, contenido: str, puntuacion: int) -> dict | None:
        sql_comentario = """INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido)
                            VALUES (%(id_usuario)s, %(id_emprendimiento)s, %(contenido)s)"""
        sql_valoracion = """INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion)
                            VALUES (%(id_usuario)s, %(id_emprendimiento)s, %(puntuacion)s)"""
        params = {
            "id_usuario": id_usuario,
            "id_emprendimiento": id_emprendimiento,
            "contenido": contenido,
            "puntuacion": puntuacion,
        }
        self.execute_sp(sql_comentario, params)
        self.execute_sp(sql_valoracion, params)
        return {"mensaje": "Reseña publicada exitosamente"}

    def get_distribution(self, id_emprendimiento: int) -> dict:
        sql_promedio = """SELECT COALESCE(ROUND(AVG(puntuacion::decimal(3,1)), 1), 0) AS puntuacion_promedio,
                                 COUNT(*) AS total_valoraciones
                          FROM Valoraciones
                          WHERE id_emprendimiento = %(id_emprendimiento)s"""
        sql_estrellas = """SELECT puntuacion AS estrella, COUNT(*) AS cantidad
                           FROM Valoraciones
                           WHERE id_emprendimiento = %(id_emprendimiento)s
                           GROUP BY puntuacion
                           ORDER BY puntuacion DESC"""

        params = {"id_emprendimiento": id_emprendimiento}
        promedio_rows = self.execute_sp(sql_promedio, params)
        estrella_rows = self.execute_sp(sql_estrellas, params)

        promedio_data = promedio_rows[0] if promedio_rows else {}
        distribucion = {}
        for row in estrella_rows:
            distribucion[str(row.get("estrella"))] = row.get("cantidad", 0)
        for i in range(1, 6):
            distribucion.setdefault(str(i), 0)

        return {
            "puntuacion_promedio": float(promedio_data.get("puntuacion_promedio", 0)),
            "total_valoraciones": int(promedio_data.get("total_valoraciones", 0)),
            "distribucion_estrellas": distribucion,
        }
