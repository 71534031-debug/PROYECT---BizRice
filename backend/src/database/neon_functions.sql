-- =====================================================
-- BIZRISE — STORED PROCEDURES / FUNCTIONS (PostgreSQL)
-- =====================================================
-- Ejecutar DESPUÉS de neon_schema.sql y neon_seeds.sql
-- =====================================================

-- =========================
-- 1. Autenticación
-- =========================

CREATE OR REPLACE FUNCTION sp_login(p_correo VARCHAR, p_contrasena_hash VARCHAR)
RETURNS TABLE(id_usuario INT, nombre VARCHAR, apellido VARCHAR, rol VARCHAR, estado VARCHAR)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT u.id_usuario, u.nombre, u.apellido, u.rol, u.estado
    FROM Usuarios u
    WHERE u.correo = p_correo
      AND u.contrasena_hash = p_contrasena_hash
      AND u.estado = 'activo';
END $$;

-- =========================
-- 2. Listar negocios aprobados (paginado + filtros)
-- =========================

CREATE OR REPLACE FUNCTION sp_listar_negocios(
    p_busqueda VARCHAR DEFAULT NULL,
    p_id_categoria INT DEFAULT NULL,
    p_distrito VARCHAR DEFAULT NULL,
    p_orden VARCHAR DEFAULT 'reciente',
    p_page INT DEFAULT 1,
    p_size INT DEFAULT 12
)
RETURNS TABLE(
    id_emprendimiento INT, nombre VARCHAR, descripcion TEXT,
    telefono VARCHAR, direccion VARCHAR, distrito VARCHAR,
    horario_apertura TIME, horario_cierre TIME,
    imagen_portada_url VARCHAR, estado_verificacion VARCHAR,
    fecha_registro TIMESTAMP, id_categoria INT,
    nombre_categoria VARCHAR, nombre_propietario VARCHAR, apellido_propietario VARCHAR,
    puntuacion_promedio DECIMAL, total_valoraciones BIGINT,
    total BIGINT, size INT, page INT, pages DECIMAL
)
LANGUAGE plpgsql AS $$
DECLARE
    v_offset INT;
    v_order VARCHAR;
BEGIN
    v_offset := (p_page - 1) * p_size;
    v_order := CASE p_orden
        WHEN 'valoracion' THEN 'puntuacion_promedio DESC, total_valoraciones DESC'
        WHEN 'nombre'     THEN 'e.nombre ASC'
        ELSE 'e.fecha_registro DESC'
    END;

    RETURN QUERY EXECUTE format(
        'WITH resultados AS (
            SELECT e.id_emprendimiento, e.nombre, e.descripcion, e.telefono,
                   e.direccion, e.distrito, e.horario_apertura, e.horario_cierre,
                   e.imagen_portada_url, e.estado_verificacion, e.fecha_registro,
                   e.id_categoria, c.nombre AS nombre_categoria,
                   u.nombre AS nombre_propietario, u.apellido AS apellido_propietario,
                   COALESCE(ROUND(AVG(v.puntuacion::decimal(3,1)), 1), 0) AS puntuacion_promedio,
                   COUNT(v.id_valoracion) AS total_valoraciones
            FROM Emprendimientos e
            INNER JOIN Categorias c ON e.id_categoria = c.id_categoria
            INNER JOIN Usuarios u ON e.id_usuario = u.id_usuario
            LEFT JOIN Valoraciones v ON e.id_emprendimiento = v.id_emprendimiento
            WHERE e.estado_verificacion = ''aprobado''
              AND ($1 IS NULL OR $1 = '' OR e.nombre ILIKE CONCAT(''%%'', $1, ''%%'') OR e.descripcion ILIKE CONCAT(''%%'', $1, ''%%''))
              AND ($2 IS NULL OR e.id_categoria = $2)
              AND ($3 IS NULL OR $3 = '' OR e.distrito = $3)
            GROUP BY e.id_emprendimiento, e.nombre, e.descripcion, e.telefono, e.direccion,
                     e.distrito, e.horario_apertura, e.horario_cierre, e.imagen_portada_url,
                     e.estado_verificacion, e.fecha_registro, e.id_categoria, c.nombre, u.nombre, u.apellido
        )
        SELECT *, (SELECT COUNT(*) FROM resultados) AS total,
               $5 AS size, $4 AS page,
               CEIL((SELECT COUNT(*)::decimal FROM resultados) / NULLIF($5, 0)) AS pages
        FROM resultados
        ORDER BY %s
        LIMIT $5 OFFSET $6',
        v_order
    ) USING p_busqueda, p_id_categoria, p_distrito, p_page, p_size, v_offset;
END $$;

-- =========================
-- 3. Obtener detalle de negocio
-- =========================

CREATE OR REPLACE FUNCTION sp_obtener_negocio(p_id_emprendimiento INT)
RETURNS TABLE(
    id_emprendimiento INT, nombre VARCHAR, descripcion TEXT,
    telefono VARCHAR, direccion VARCHAR, distrito VARCHAR,
    horario_apertura TIME, horario_cierre TIME,
    imagen_portada_url VARCHAR, estado_verificacion VARCHAR,
    fecha_registro TIMESTAMP, id_categoria INT,
    nombre_categoria VARCHAR, id_usuario INT,
    nombre_propietario VARCHAR, apellido_propietario VARCHAR,
    puntuacion_promedio DECIMAL, total_valoraciones BIGINT
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT e.id_emprendimiento, e.nombre, e.descripcion, e.telefono,
           e.direccion, e.distrito, e.horario_apertura, e.horario_cierre,
           e.imagen_portada_url, e.estado_verificacion, e.fecha_registro,
           e.id_categoria, c.nombre AS nombre_categoria,
           u.id_usuario, u.nombre AS nombre_propietario, u.apellido AS apellido_propietario,
           COALESCE(ROUND(AVG(v.puntuacion::decimal(3,1)), 1), 0) AS puntuacion_promedio,
           COUNT(v.id_valoracion) AS total_valoraciones
    FROM Emprendimientos e
    INNER JOIN Categorias c ON e.id_categoria = c.id_categoria
    INNER JOIN Usuarios u ON e.id_usuario = u.id_usuario
    LEFT JOIN Valoraciones v ON e.id_emprendimiento = v.id_emprendimiento
    WHERE e.id_emprendimiento = p_id_emprendimiento
      AND e.estado_verificacion = 'aprobado'
    GROUP BY e.id_emprendimiento, e.nombre, e.descripcion, e.telefono, e.direccion,
             e.distrito, e.horario_apertura, e.horario_cierre, e.imagen_portada_url,
             e.estado_verificacion, e.fecha_registro, e.id_categoria, c.nombre, u.id_usuario, u.nombre, u.apellido;
END $$;

-- =========================
-- 4. Registrar nuevo emprendimiento
-- =========================

CREATE OR REPLACE FUNCTION sp_crear_negocio(
    p_id_usuario INT, p_id_categoria INT, p_nombre VARCHAR,
    p_descripcion TEXT, p_telefono VARCHAR, p_direccion VARCHAR, p_distrito VARCHAR
)
RETURNS TABLE(id_emprendimiento INT, nombre VARCHAR, estado_verificacion VARCHAR)
LANGUAGE plpgsql AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Categorias WHERE id_categoria = p_id_categoria) THEN
        RAISE EXCEPTION 'Categoría no encontrada';
    END IF;

    RETURN QUERY
    INSERT INTO Emprendimientos (id_usuario, id_categoria, nombre, descripcion, telefono, direccion, distrito)
    VALUES (p_id_usuario, p_id_categoria, p_nombre, p_descripcion, p_telefono, p_direccion, p_distrito)
    RETURNING id_emprendimiento, nombre, estado_verificacion;
END $$;

-- =========================
-- 5. Crear reseña (comentario + valoración)
-- =========================

CREATE OR REPLACE FUNCTION sp_crear_resena(
    p_id_usuario INT, p_id_emprendimiento INT,
    p_contenido TEXT, p_puntuacion INT
)
RETURNS TEXT
LANGUAGE plpgsql AS $$
BEGIN
    IF p_puntuacion < 1 OR p_puntuacion > 5 THEN
        RAISE EXCEPTION 'La puntuación debe estar entre 1 y 5';
    END IF;
    IF LENGTH(p_contenido) < 10 THEN
        RAISE EXCEPTION 'El comentario debe tener al menos 10 caracteres';
    END IF;
    IF EXISTS (SELECT 1 FROM Valoraciones WHERE id_usuario = p_id_usuario AND id_emprendimiento = p_id_emprendimiento) THEN
        RAISE EXCEPTION 'Ya dejaste una reseña en este emprendimiento';
    END IF;

    INSERT INTO Comentarios (id_usuario, id_emprendimiento, contenido)
    VALUES (p_id_usuario, p_id_emprendimiento, p_contenido);

    INSERT INTO Valoraciones (id_usuario, id_emprendimiento, puntuacion)
    VALUES (p_id_usuario, p_id_emprendimiento, p_puntuacion);

    RETURN 'Reseña creada exitosamente';
END $$;
