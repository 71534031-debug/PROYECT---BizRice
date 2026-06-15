from src.repositories.base_repository import BaseRepository


class ReviewRepository(BaseRepository):

    def get_by_business(self, id_emprendimiento: int, page: int = 1, size: int = 5) -> dict:
        """Retorna dict con items, distribucion_estrellas, puntuacion_promedio, total, page, size, pages.

        El SP devuelve 3 resultsets:
        1. Distribución de estrellas
        2. Reseñas paginadas (con metadatos de paginación)
        3. Puntuación promedio
        """
        results = self.execute_sp_multi("sp_GetReviewsByBusiness", {
            "id_emprendimiento": id_emprendimiento,
            "page": page,
            "size": size,
        })

        distribucion = {}
        if results and len(results) > 0:
            for row in results[0]:
                distribucion[str(row.get("estrella"))] = row.get("cantidad", 0)
        for i in range(1, 6):
            distribucion.setdefault(str(i), 0)

        items = results[1] if len(results) > 1 else []

        promedio_data = results[2][0] if len(results) > 2 and results[2] else {}
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
        return self.execute_sp_single("sp_CreateReview", {
            "id_usuario": id_usuario,
            "id_emprendimiento": id_emprendimiento,
            "contenido": contenido,
            "puntuacion": puntuacion,
        })

    def get_distribution(self, id_emprendimiento: int) -> dict:
        results = self.execute_sp_multi("sp_GetRatingDistribution", {
            "id_emprendimiento": id_emprendimiento,
        })

        promedio_data = results[0][0] if results and results[0] else {}
        distribucion = {}
        if len(results) > 1:
            for row in results[1]:
                distribucion[str(row.get("estrella"))] = row.get("cantidad", 0)
        for i in range(1, 6):
            distribucion.setdefault(str(i), 0)

        return {
            "puntuacion_promedio": float(promedio_data.get("puntuacion_promedio", 0)),
            "total_valoraciones": int(promedio_data.get("total_valoraciones", 0)),
            "distribucion_estrellas": distribucion,
        }
