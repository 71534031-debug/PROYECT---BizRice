from src.repositories.base_repository import BaseRepository


class UserRepository(BaseRepository):

    def get_by_email(self, correo: str) -> dict | None:
        sql = "SELECT id_usuario, nombre, apellido, correo, contrasena_hash, rol, estado, avatar_url, fecha_registro FROM Usuarios WHERE correo = %(correo)s"
        return self.execute_sp_single(sql, {"correo": correo})

    def get_by_id(self, id_usuario: int) -> dict | None:
        sql = "SELECT id_usuario, nombre, apellido, correo, rol, estado, avatar_url, fecha_registro FROM Usuarios WHERE id_usuario = %(id_usuario)s"
        return self.execute_sp_single(sql, {"id_usuario": id_usuario})

    def create(self, data: dict) -> dict | None:
        sql = """INSERT INTO Usuarios (nombre, apellido, correo, contrasena_hash, rol)
                 VALUES (%(nombre)s, %(apellido)s, %(correo)s, %(contrasena_hash)s, %(rol)s)
                 RETURNING id_usuario, nombre, apellido, correo, rol, estado, avatar_url, fecha_registro"""
        return self.execute_sp_single(sql, {
            "nombre": data.get("nombre"),
            "apellido": data.get("apellido"),
            "correo": data.get("correo"),
            "contrasena_hash": data.get("contrasena_hash"),
            "rol": data.get("rol", "emprendedor"),
        })

    def update_status(self, id_usuario: int, estado: str) -> dict | None:
        sql = """UPDATE Usuarios SET estado = %(estado)s
                 WHERE id_usuario = %(id_usuario)s
                 RETURNING id_usuario, nombre, apellido, correo, rol, estado, avatar_url, fecha_registro"""
        return self.execute_sp_single(sql, {
            "id_usuario": id_usuario,
            "estado": estado,
        })

    def change_password(self, id_usuario: int, contrasena_hash_nueva: str) -> dict | None:
        sql = "UPDATE Usuarios SET contrasena_hash = %(contrasena_hash_nueva)s WHERE id_usuario = %(id_usuario)s RETURNING 'Contraseña actualizada exitosamente' AS mensaje"
        return self.execute_sp_single(sql, {
            "id_usuario": id_usuario,
            "contrasena_hash_nueva": contrasena_hash_nueva,
        })

    def get_all(self, page: int = 1, size: int = 20, busqueda: str = None,
                rol: str = None, estado: str = None) -> list:
        sql = """WITH filtered AS (
            SELECT id_usuario, nombre, apellido, correo, rol, estado, avatar_url, fecha_registro
            FROM Usuarios
            WHERE (%(busqueda)s IS NULL OR nombre ILIKE CONCAT('%%', %(busqueda)s, '%%')
                   OR apellido ILIKE CONCAT('%%', %(busqueda)s, '%%')
                   OR correo ILIKE CONCAT('%%', %(busqueda)s, '%%'))
              AND (%(rol)s IS NULL OR rol = %(rol)s)
              AND (%(estado)s IS NULL OR estado = %(estado)s)
        )
        SELECT *, (SELECT COUNT(*) FROM filtered) AS total,
               %(size)s AS size, %(page)s AS page,
               CEIL((SELECT COUNT(*)::decimal FROM filtered) / NULLIF(%(size)s, 0)) AS pages
        FROM filtered
        ORDER BY fecha_registro DESC
        LIMIT %(size)s OFFSET %(offset)s"""
        offset = (page - 1) * size
        return self.execute_sp(sql, {
            "page": page, "size": size, "offset": offset,
            "busqueda": busqueda, "rol": rol, "estado": estado,
        })

    def update_profile(self, id_usuario: int, nombre: str = None, apellido: str = None,
                       correo: str = None, avatar_url: str = None) -> None:
        sql = """UPDATE Usuarios SET
            nombre = COALESCE(%(nombre)s, nombre),
            apellido = COALESCE(%(apellido)s, apellido),
            correo = COALESCE(%(correo)s, correo),
            avatar_url = COALESCE(%(avatar_url)s, avatar_url)
        WHERE id_usuario = %(id_usuario)s"""
        self.execute_sp(sql, {
            "id_usuario": id_usuario,
            "nombre": nombre,
            "apellido": apellido,
            "correo": correo,
            "avatar_url": avatar_url,
        })
