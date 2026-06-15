from src.repositories.base_repository import BaseRepository


class BusinessRepository(BaseRepository):

    def get_all(self, busqueda: str | None = None, id_categoria: int | None = None,
                distrito: str | None = None, orden: str | None = None,
                page: int = 1, size: int = 12) -> dict:
        """Retorna dict con items, total, page, size, pages."""
        rows = self.execute_sp("sp_GetBusinesses", {
            "busqueda": busqueda,
            "id_categoria": id_categoria,
            "distrito": distrito,
            "orden": orden or "reciente",
            "page": page,
            "size": size,
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

    def get_by_id(self, id_emprendimiento: int) -> dict | None:
        """Retorna dict con info del negocio y listas de redes_sociales y promociones_activas."""
        results = self.execute_sp_multi("sp_GetBusinessById", {
            "id_emprendimiento": id_emprendimiento,
        })
        if not results or not results[0]:
            return None
        negocio = results[0][0]
        negocio["redes_sociales"] = results[1] if len(results) > 1 else []
        negocio["promociones_activas"] = results[2] if len(results) > 2 else []
        return negocio

    def get_by_user(self, id_usuario: int) -> dict | None:
        results = self.execute_sp_multi("sp_GetBusinessByUserId", {
            "id_usuario": id_usuario,
        })
        if not results or not results[0]:
            return None
        negocio = results[0][0]
        negocio["redes_sociales"] = results[1] if len(results) > 1 else []
        return negocio

    def create(self, data: dict) -> dict | None:
        return self.execute_sp_single("sp_CreateBusiness", {
            "id_usuario": data.get("id_usuario"),
            "id_categoria": data.get("id_categoria"),
            "nombre": data.get("nombre"),
            "descripcion": data.get("descripcion"),
            "telefono": data.get("telefono"),
            "direccion": data.get("direccion"),
            "distrito": data.get("distrito"),
        })

    def update(self, id_emprendimiento: int, id_usuario: int, data: dict) -> dict | None:
        return self.execute_sp_single("sp_UpdateBusiness", {
            "id_emprendimiento": id_emprendimiento,
            "id_usuario": id_usuario,
            "nombre": data.get("nombre"),
            "id_categoria": data.get("id_categoria"),
            "descripcion": data.get("descripcion"),
            "telefono": data.get("telefono"),
            "direccion": data.get("direccion"),
            "distrito": data.get("distrito"),
        })

    def update_status(self, id_emprendimiento: int, estado: str, motivo: str | None = None) -> dict | None:
        return self.execute_sp_single("sp_UpdateBusinessStatus", {
            "id_emprendimiento": id_emprendimiento,
            "estado": estado,
            "motivo": motivo,
        })

    def get_all_admin(self, page: int = 1, size: int = 20,
                      busqueda: str | None = None, estado: str | None = None,
                      id_categoria: int | None = None) -> dict:
        rows = self.execute_sp("sp_GetAllBusinessesAdmin", {
            "page": page,
            "size": size,
            "busqueda": busqueda,
            "estado": estado,
            "id_categoria": id_categoria,
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
