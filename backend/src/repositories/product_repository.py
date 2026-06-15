from src.repositories.base_repository import BaseRepository


class ProductRepository(BaseRepository):

    def get_by_business(self, id_emprendimiento: int, page: int = 1, size: int = 20,
                        busqueda: str | None = None) -> dict:
        rows = self.execute_sp("sp_GetProductsByBusiness", {
            "id_emprendimiento": id_emprendimiento,
            "page": page,
            "size": size,
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
        return self.execute_sp_single("sp_CreateProduct", {
            "id_emprendimiento": id_emprendimiento,
            "nombre": data.get("nombre"),
            "descripcion": data.get("descripcion"),
            "precio": data.get("precio"),
            "imagen_url": data.get("imagen_url"),
            "stock": data.get("stock", 0),
            "estado_stock": data.get("estado_stock", "disponible"),
        })

    def update(self, id_producto: int, id_emprendimiento: int, data: dict) -> dict | None:
        return self.execute_sp_single("sp_UpdateProduct", {
            "id_producto": id_producto,
            "id_emprendimiento": id_emprendimiento,
            "nombre": data.get("nombre"),
            "descripcion": data.get("descripcion"),
            "precio": data.get("precio"),
            "imagen_url": data.get("imagen_url"),
            "stock": data.get("stock"),
            "estado_stock": data.get("estado_stock"),
        })

    def delete(self, id_producto: int, id_emprendimiento: int) -> dict | None:
        return self.execute_sp_single("sp_DeleteProduct", {
            "id_producto": id_producto,
            "id_emprendimiento": id_emprendimiento,
        })
