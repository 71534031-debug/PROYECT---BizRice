-- =====================================================
-- BIZRISE — ESQUEMA COMPLETO PARA POSTGRESQL (NEON)
-- =====================================================
-- Modo de uso:
--   1. Ir a https://console.neon.tech → tu proyecto → SQL Editor
--   2. Pegar todo este script y ejecutar
--   3. O desde CLI: psql "$DATABASE_URL" -f neon_schema.sql
-- =====================================================

-- =========================
-- 1. USUARIOS
-- =========================
CREATE TABLE IF NOT EXISTS Usuarios (
    id_usuario      SERIAL       PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    apellido        VARCHAR(100) NOT NULL,
    correo          VARCHAR(150) NOT NULL UNIQUE,
    contrasena_hash VARCHAR(255) NOT NULL,
    rol             VARCHAR(20)  NOT NULL DEFAULT 'emprendedor'
                    CHECK (rol IN ('visitante','emprendedor','administrador','cliente')),
    estado          VARCHAR(20)  NOT NULL DEFAULT 'activo'
                    CHECK (estado IN ('activo','inactivo','suspendido')),
    avatar_url      VARCHAR(255),
    fecha_registro  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- =========================
-- 2. CATEGORIAS
-- =========================
CREATE TABLE IF NOT EXISTS Categorias (
    id_categoria SERIAL       PRIMARY KEY,
    nombre       VARCHAR(100) NOT NULL,
    descripcion  VARCHAR(255),
    icono_url    VARCHAR(255)
);

-- =========================
-- 3. EMPRENDIMIENTOS
-- =========================
CREATE TABLE IF NOT EXISTS Emprendimientos (
    id_emprendimiento    SERIAL       PRIMARY KEY,
    id_usuario           INT          NOT NULL REFERENCES Usuarios(id_usuario),
    id_categoria         INT          NOT NULL REFERENCES Categorias(id_categoria),
    nombre               VARCHAR(150) NOT NULL,
    descripcion          TEXT,
    telefono             VARCHAR(20),
    direccion            VARCHAR(255),
    distrito             VARCHAR(100),
    horario_apertura     TIME,
    horario_cierre       TIME,
    imagen_portada_url   VARCHAR(255),
    estado_verificacion  VARCHAR(20)  NOT NULL DEFAULT 'pendiente'
                         CHECK (estado_verificacion IN ('pendiente','aprobado','rechazado')),
    fecha_registro       TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- =========================
-- 4. PRODUCTOS
-- =========================
CREATE TABLE IF NOT EXISTS Productos (
    id_producto          SERIAL         PRIMARY KEY,
    id_emprendimiento    INT            NOT NULL REFERENCES Emprendimientos(id_emprendimiento),
    nombre               VARCHAR(150)   NOT NULL,
    descripcion          TEXT,
    precio               NUMERIC(10,2),
    imagen_url           VARCHAR(255),
    stock                INT            NOT NULL DEFAULT 0,
    estado_stock         VARCHAR(20)    NOT NULL DEFAULT 'disponible'
                         CHECK (estado_stock IN ('disponible','bajo_stock','agotado')),
    activo               BOOLEAN        NOT NULL DEFAULT TRUE,
    fecha_creacion       TIMESTAMP      NOT NULL DEFAULT NOW()
);

-- =========================
-- 5. COMENTARIOS
-- =========================
CREATE TABLE IF NOT EXISTS Comentarios (
    id_comentario        SERIAL   PRIMARY KEY,
    id_usuario           INT      NOT NULL REFERENCES Usuarios(id_usuario),
    id_emprendimiento    INT      NOT NULL REFERENCES Emprendimientos(id_emprendimiento),
    contenido            TEXT     NOT NULL,
    util_count           INT      NOT NULL DEFAULT 0,
    fecha                TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================
-- 6. VALORACIONES
-- =========================
CREATE TABLE IF NOT EXISTS Valoraciones (
    id_valoracion        SERIAL    PRIMARY KEY,
    id_usuario           INT       NOT NULL REFERENCES Usuarios(id_usuario),
    id_emprendimiento    INT       NOT NULL REFERENCES Emprendimientos(id_emprendimiento),
    puntuacion           SMALLINT  NOT NULL CHECK (puntuacion BETWEEN 1 AND 5),
    fecha                TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (id_usuario, id_emprendimiento)
);

-- =========================
-- 7. PROMOCIONES
-- =========================
CREATE TABLE IF NOT EXISTS Promociones (
    id_promocion         SERIAL       PRIMARY KEY,
    id_emprendimiento    INT          NOT NULL REFERENCES Emprendimientos(id_emprendimiento),
    titulo               VARCHAR(150) NOT NULL,
    descripcion          TEXT,
    fecha_inicio         DATE,
    fecha_fin            DATE,
    estado               VARCHAR(20)  NOT NULL DEFAULT 'activa'
                         CHECK (estado IN ('activa','vencida','borrador'))
);

-- =========================
-- 8. REDES SOCIALES
-- =========================
CREATE TABLE IF NOT EXISTS RedesSociales (
    id_red               SERIAL       PRIMARY KEY,
    id_emprendimiento    INT          NOT NULL REFERENCES Emprendimientos(id_emprendimiento),
    plataforma           VARCHAR(30)  NOT NULL
                         CHECK (plataforma IN ('facebook','instagram','whatsapp','web','tiktok')),
    url                  VARCHAR(255) NOT NULL
);

-- =========================
-- 9. VENTAS
-- =========================
CREATE TABLE IF NOT EXISTS Ventas (
    id_venta             SERIAL        PRIMARY KEY,
    id_usuario           INT           NOT NULL REFERENCES Usuarios(id_usuario),
    id_emprendimiento    INT           NOT NULL REFERENCES Emprendimientos(id_emprendimiento),
    total                NUMERIC(10,2) NOT NULL DEFAULT 0,
    estado               VARCHAR(20)   NOT NULL DEFAULT 'pendiente'
                         CHECK (estado IN ('entregado','pendiente','cancelado')),
    fecha_creacion       TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- =========================
-- 10. DETALLE VENTAS
-- =========================
CREATE TABLE IF NOT EXISTS DetalleVentas (
    id_detalle           SERIAL        PRIMARY KEY,
    id_venta             INT           NOT NULL REFERENCES Ventas(id_venta),
    id_producto          INT           NOT NULL REFERENCES Productos(id_producto),
    cantidad             INT           NOT NULL DEFAULT 1,
    precio_unitario      NUMERIC(10,2) NOT NULL,
    subtotal             NUMERIC(10,2) NOT NULL
);

-- =====================================================
-- ÍNDICES (optimización de consultas frecuentes)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_usuarios_rol         ON Usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_usuarios_estado      ON Usuarios(estado);
CREATE INDEX IF NOT EXISTS idx_emp_verificacion     ON Emprendimientos(estado_verificacion);
CREATE INDEX IF NOT EXISTS idx_emp_categoria        ON Emprendimientos(id_categoria);
CREATE INDEX IF NOT EXISTS idx_emp_distrito         ON Emprendimientos(distrito);
CREATE INDEX IF NOT EXISTS idx_emp_usuario          ON Emprendimientos(id_usuario);
CREATE INDEX IF NOT EXISTS idx_productos_emp        ON Productos(id_emprendimiento);
CREATE INDEX IF NOT EXISTS idx_productos_activo     ON Productos(activo);
CREATE INDEX IF NOT EXISTS idx_comentarios_emp      ON Comentarios(id_emprendimiento);
CREATE INDEX IF NOT EXISTS idx_valoraciones_emp     ON Valoraciones(id_emprendimiento);
CREATE INDEX IF NOT EXISTS idx_promociones_emp      ON Promociones(id_emprendimiento);
CREATE INDEX IF NOT EXISTS idx_ventas_usuario       ON Ventas(id_usuario);
CREATE INDEX IF NOT EXISTS idx_ventas_emprendimiento ON Ventas(id_emprendimiento);
CREATE INDEX IF NOT EXISTS idx_ventas_estado        ON Ventas(estado);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha         ON Ventas(fecha_creacion);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Si ves 10 tablas, todo está correcto:
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
