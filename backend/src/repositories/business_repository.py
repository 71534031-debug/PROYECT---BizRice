from src.repositories.base_repository import BaseRepository


class BusinessRepository(BaseRepository):

    def get_all(self, busqueda: str | None = None, id_categoria: int | None = None,
                distrito: str | None = None, orden: str | None = None,
                page: int = 1, size: int = 12) -> dict:
        offset = (page - 1) * size
        order_clause = "e.fecha_registro DESC"
        if orden == "valoracion":
            order_clause = "puntuacion_promedio DESC, total_valoraciones DESC"
        elif orden == "nombre":
            order_clause = "e.nombre ASC"

        sql = f"""WITH resultados AS (
            SELECT
                e.id_emprendimiento, e.nombre, e.descripcion, e.telefono, e.direccion, e.distrito,
                e.horario_apertura, e.horario_cierre, e.imagen_portada_url, e.estado_verificacion,
                e.fecha_registro, e.id_categoria, c.nombre AS nombre_categoria,
                u.nombre AS nombre_propietario, u.apellido AS apellido_propietario,
                COALESCE(ROUND(AVG(v.puntuacion::decimal(3,1)), 1), 0) AS puntuacion_promedio,
                COUNT(v.id_valoracion) AS total_valoraciones
            FROM Emprendimientos e
            INNER JOIN Categorias c ON e.id_categoria = c.id_categoria
            INNER JOIN Usuarios u ON e.id_usuario = u.id_usuario
            LEFT JOIN Valoraciones v ON e.id_emprendimiento = v.id_emprendimiento
            WHERE e.estado_verificacion = 'aprobado'
              AND (%(busqueda)s IS NULL OR %(busqueda)s = ''
                   OR e.nombre ILIKE CONCAT('%%', %(busqueda)s, '%%')
                   OR e.descripcion ILIKE CONCAT('%%', %(busqueda)s, '%%'))
              AND (%(id_categoria)s IS NULL OR e.id_categoria = %(id_categoria)s)
              AND (%(distrito)s IS NULL OR %(distrito)s = '' OR e.distrito = %(distrito)s)
            GROUP BY e.id_emprendimiento, e.nombre, e.descripcion, e.telefono, e.direccion, e.distrito,
                     e.horario_apertura, e.horario_cierre, e.imagen_portada_url, e.estado_verificacion,
                     e.fecha_registro, e.id_categoria, c.nombre, u.nombre, u.apellido
        )
        SELECT *, (SELECT COUNT(*) FROM resultados) AS total,
               %(size)s AS size, %(page)s AS page,
               CEIL((SELECT COUNT(*)::decimal FROM resultados) / NULLIF(%(size)s, 0)) AS pages
        FROM resultados
        ORDER BY {order_clause}
        LIMIT %(size)s OFFSET %(offset)s"""

        rows = self.execute_sp(sql, {
            "busqueda": busqueda, "id_categoria": id_categoria,
            "distrito": distrito, "page": page, "size": size, "offset": offset,
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
        sql_biz = """SELECT
            e.id_emprendimiento, e.nombre, e.descripcion, e.telefono, e.direccion, e.distrito,
            e.horario_apertura, e.horario_cierre, e.imagen_portada_url, e.estado_verificacion,
            e.fecha_registro, e.id_categoria, c.nombre AS nombre_categoria,
            u.id_usuario, u.nombre AS nombre_propietario, u.apellido AS apellido_propietario,
            COALESCE(ROUND(AVG(v.puntuacion::decimal(3,1)), 1), 0) AS puntuacion_promedio,
            COUNT(v.id_valoracion) AS total_valoraciones
        FROM Emprendimientos e
        INNER JOIN Categorias c ON e.id_categoria = c.id_categoria
        INNER JOIN Usuarios u ON e.id_usuario = u.id_usuario
        LEFT JOIN Valoraciones v ON e.id_emprendimiento = v.id_emprendimiento
        WHERE e.id_emprendimiento = %(id_emprendimiento)s
          AND e.estado_verificacion = 'aprobado'
        GROUP BY e.id_emprendimiento, e.nombre, e.descripcion, e.telefono, e.direccion, e.distrito,
                 e.horario_apertura, e.horario_cierre, e.imagen_portada_url, e.estado_verificacion,
                 e.fecha_registro, e.id_categoria, c.nombre, u.id_usuario, u.nombre, u.apellido"""

        sql_redes = """SELECT id_red, plataforma, url
                       FROM RedesSociales
                       WHERE id_emprendimiento = %(id_emprendimiento)s"""

        sql_promos = """SELECT id_promocion, titulo, descripcion, fecha_inicio, fecha_fin, estado
                        FROM Promociones
                        WHERE id_emprendimiento = %(id_emprendimiento)s
                          AND estado = 'activa'
                        ORDER BY fecha_inicio DESC"""

        params = {"id_emprendimiento": id_emprendimiento}
        negocio = self.execute_sp_single(sql_biz, params)
        if not negocio:
            return None

        redes = self.execute_sp(sql_redes, params)
        promos = self.execute_sp(sql_promos, params)

        negocio["redes_sociales"] = redes
        negocio["promociones_activas"] = promos
        return negocio

    def get_by_user(self, id_usuario: int) -> dict | None:
        sql_biz = """SELECT
            e.id_emprendimiento, e.nombre, e.descripcion, e.telefono, e.direccion, e.distrito,
            e.horario_apertura, e.horario_cierre, e.imagen_portada_url, e.estado_verificacion, e.fecha_registro,
            e.id_categoria, c.nombre AS nombre_categoria,
            COALESCE(ROUND(AVG(v.puntuacion::decimal(3,1)), 1), 0) AS puntuacion_promedio,
            COUNT(v.id_valoracion) AS total_valoraciones
        FROM Emprendimientos e
        INNER JOIN Categorias c ON e.id_categoria = c.id_categoria
        LEFT JOIN Valoraciones v ON e.id_emprendimiento = v.id_emprendimiento
        WHERE e.id_usuario = %(id_usuario)s
        GROUP BY e.id_emprendimiento, e.nombre, e.descripcion, e.telefono, e.direccion, e.distrito,
                 e.horario_apertura, e.horario_cierre, e.imagen_portada_url, e.estado_verificacion,
                 e.fecha_registro, e.id_categoria, c.nombre"""

        sql_redes = """SELECT id_red, plataforma, url
                       FROM RedesSociales
                       WHERE id_emprendimiento IN (
                           SELECT id_emprendimiento FROM Emprendimientos WHERE id_usuario = %(id_usuario)s
                       )"""

        params = {"id_usuario": id_usuario}
        negocio = self.execute_sp_single(sql_biz, params)
        if not negocio:
            return None

        redes = self.execute_sp(sql_redes, params)
        negocio["redes_sociales"] = redes
        return negocio

    def create(self, data: dict) -> dict | None:
        sql = """INSERT INTO Emprendimientos (id_usuario, id_categoria, nombre, descripcion, telefono, direccion, distrito)
                 VALUES (%(id_usuario)s, %(id_categoria)s, %(nombre)s, %(descripcion)s, %(telefono)s, %(direccion)s, %(distrito)s)
                 RETURNING id_emprendimiento"""
        result = self.execute_sp_single(sql, {
            "id_usuario": data.get("id_usuario"),
            "id_categoria": data.get("id_categoria"),
            "nombre": data.get("nombre"),
            "descripcion": data.get("descripcion"),
            "telefono": data.get("telefono"),
            "direccion": data.get("direccion"),
            "distrito": data.get("distrito"),
        })
        if not result:
            return None
        return self.get_by_user(data["id_usuario"])

    def update(self, id_emprendimiento: int, id_usuario: int, data: dict) -> dict:
        sets = []
        params = {"id_emprendimiento": id_emprendimiento, "id_usuario": id_usuario}
        for key in ("nombre", "id_categoria", "descripcion", "telefono", "direccion",
                     "distrito", "horario_apertura", "horario_cierre", "imagen_portada_url"):
            if key in data:
                sets.append(f"{key} = %({key})s")
                params[key] = data[key]
        if not sets:
            return {"mensaje": "Sin cambios"}
        set_clause = ", ".join(sets)
        sql = f"UPDATE Emprendimientos SET {set_clause} WHERE id_emprendimiento = %(id_emprendimiento)s AND id_usuario = %(id_usuario)s"
        self.execute_sp(sql, params)
        return {"mensaje": "Negocio actualizado correctamente"}

    def update_status(self, id_emprendimiento: int, estado: str, motivo: str | None = None) -> dict | None:
        sql = """UPDATE Emprendimientos
                 SET estado_verificacion = %(estado)s
                 WHERE id_emprendimiento = %(id_emprendimiento)s
                 RETURNING id_emprendimiento, nombre, estado_verificacion"""
        result = self.execute_sp_single(sql, {
            "id_emprendimiento": id_emprendimiento,
            "estado": estado,
        })
        if result:
            result["motivo_rechazo"] = motivo
        return result

    def get_all_admin(self, page: int = 1, size: int = 20,
                      busqueda: str | None = None, estado: str | None = None,
                      id_categoria: int | None = None) -> dict:
        offset = (page - 1) * size
        sql = """WITH resultados AS (
            SELECT
                e.id_emprendimiento, e.nombre, e.descripcion, e.telefono, e.direccion, e.distrito,
                e.imagen_portada_url, e.estado_verificacion, e.fecha_registro,
                e.id_categoria, c.nombre AS nombre_categoria,
                u.id_usuario, u.nombre AS propietario_nombre, u.apellido AS propietario_apellido, u.correo AS propietario_correo,
                COALESCE(ROUND(AVG(v.puntuacion::decimal(3,1)), 1), 0) AS puntuacion_promedio,
                COUNT(v.id_valoracion) AS total_valoraciones
            FROM Emprendimientos e
            INNER JOIN Categorias c ON e.id_categoria = c.id_categoria
            INNER JOIN Usuarios u ON e.id_usuario = u.id_usuario
            LEFT JOIN Valoraciones v ON e.id_emprendimiento = v.id_emprendimiento
            WHERE (%(busqueda)s IS NULL OR e.nombre ILIKE CONCAT('%%', %(busqueda)s, '%%')
                   OR u.nombre ILIKE CONCAT('%%', %(busqueda)s, '%%')
                   OR u.correo ILIKE CONCAT('%%', %(busqueda)s, '%%'))
              AND (%(estado)s IS NULL OR e.estado_verificacion = %(estado)s)
              AND (%(id_categoria)s IS NULL OR e.id_categoria = %(id_categoria)s)
            GROUP BY e.id_emprendimiento, e.nombre, e.descripcion, e.telefono, e.direccion, e.distrito,
                     e.imagen_portada_url, e.estado_verificacion, e.fecha_registro,
                     e.id_categoria, c.nombre, u.id_usuario, u.nombre, u.apellido, u.correo
        )
        SELECT *, (SELECT COUNT(*) FROM resultados) AS total,
               %(size)s AS size, %(page)s AS page,
               CEIL((SELECT COUNT(*)::decimal FROM resultados) / NULLIF(%(size)s, 0)) AS pages
        FROM resultados
        ORDER BY fecha_registro DESC
        LIMIT %(size)s OFFSET %(offset)s"""

        rows = self.execute_sp(sql, {
            "page": page, "size": size, "offset": offset,
            "busqueda": busqueda, "estado": estado, "id_categoria": id_categoria,
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
