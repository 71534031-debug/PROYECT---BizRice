from src.repositories.base_repository import BaseRepository


class PromotionRepository(BaseRepository):

    def get_by_business(self, id_emprendimiento: int) -> list[dict]:
        sql_vencer = """UPDATE Promociones SET estado = 'vencida'
                        WHERE id_emprendimiento = %(id_emprendimiento)s
                          AND estado = 'activa'
                          AND fecha_fin IS NOT NULL
                          AND fecha_fin < CURRENT_DATE"""
        self.execute_sp(sql_vencer, {"id_emprendimiento": id_emprendimiento})

        sql = """SELECT id_promocion, titulo, descripcion, fecha_inicio, fecha_fin, estado
                 FROM Promociones
                 WHERE id_emprendimiento = %(id_emprendimiento)s
                 ORDER BY COALESCE(fecha_inicio, '1900-01-01') DESC"""
        return self.execute_sp(sql, {"id_emprendimiento": id_emprendimiento})

    def create(self, id_emprendimiento: int, data: dict) -> dict | None:
        sql = """INSERT INTO Promociones (id_emprendimiento, titulo, descripcion, fecha_inicio, fecha_fin, estado)
                 VALUES (%(id_emprendimiento)s, %(titulo)s, %(descripcion)s, %(fecha_inicio)s, %(fecha_fin)s, %(estado)s)
                 RETURNING id_promocion, titulo, descripcion, fecha_inicio, fecha_fin, estado"""
        return self.execute_sp_single(sql, {
            "id_emprendimiento": id_emprendimiento,
            "titulo": data.get("titulo"),
            "descripcion": data.get("descripcion"),
            "fecha_inicio": data.get("fecha_inicio"),
            "fecha_fin": data.get("fecha_fin"),
            "estado": data.get("estado", "activa"),
        })

    def update(self, id_promocion: int, id_emprendimiento: int, data: dict) -> dict | None:
        sets = []
        params = {"id_promocion": id_promocion, "id_emprendimiento": id_emprendimiento}
        for key in ("titulo", "descripcion", "fecha_inicio", "fecha_fin", "estado"):
            if key in data:
                sets.append(f"{key} = %({key})s")
                params[key] = data[key]
        if not sets:
            return self._get_by_id(id_promocion)
        set_clause = ", ".join(sets)
        sql = f"""UPDATE Promociones SET {set_clause}
                  WHERE id_promocion = %(id_promocion)s AND id_emprendimiento = %(id_emprendimiento)s
                  RETURNING id_promocion, titulo, descripcion, fecha_inicio, fecha_fin, estado"""
        return self.execute_sp_single(sql, params)

    def _get_by_id(self, id_promocion: int) -> dict | None:
        sql = "SELECT id_promocion, titulo, descripcion, fecha_inicio, fecha_fin, estado FROM Promociones WHERE id_promocion = %(id_promocion)s"
        return self.execute_sp_single(sql, {"id_promocion": id_promocion})

    def delete(self, id_promocion: int, id_emprendimiento: int) -> dict | None:
        sql = """DELETE FROM Promociones
                 WHERE id_promocion = %(id_promocion)s AND id_emprendimiento = %(id_emprendimiento)s
                 RETURNING 'Promoción eliminada' AS mensaje"""
        return self.execute_sp_single(sql, {
            "id_promocion": id_promocion,
            "id_emprendimiento": id_emprendimiento,
        })
