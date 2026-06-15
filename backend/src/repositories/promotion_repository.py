from src.repositories.base_repository import BaseRepository


class PromotionRepository(BaseRepository):

    def get_by_business(self, id_emprendimiento: int) -> list[dict]:
        return self.execute_sp("sp_GetPromotionsByBusiness", {
            "id_emprendimiento": id_emprendimiento,
        })

    def create(self, id_emprendimiento: int, data: dict) -> dict | None:
        return self.execute_sp_single("sp_CreatePromotion", {
            "id_emprendimiento": id_emprendimiento,
            "titulo": data.get("titulo"),
            "descripcion": data.get("descripcion"),
            "fecha_inicio": data.get("fecha_inicio"),
            "fecha_fin": data.get("fecha_fin"),
            "estado": data.get("estado", "activa"),
        })

    def update(self, id_promocion: int, id_emprendimiento: int, data: dict) -> dict | None:
        return self.execute_sp_single("sp_UpdatePromotion", {
            "id_promocion": id_promocion,
            "id_emprendimiento": id_emprendimiento,
            "titulo": data.get("titulo"),
            "descripcion": data.get("descripcion"),
            "fecha_inicio": data.get("fecha_inicio"),
            "fecha_fin": data.get("fecha_fin"),
            "estado": data.get("estado"),
        })

    def delete(self, id_promocion: int, id_emprendimiento: int) -> dict | None:
        return self.execute_sp_single("sp_DeletePromotion", {
            "id_promocion": id_promocion,
            "id_emprendimiento": id_emprendimiento,
        })
