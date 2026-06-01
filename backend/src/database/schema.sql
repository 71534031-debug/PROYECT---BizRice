-- Ejecutar este script en SQL Server para crear la base de datos completa

CREATE DATABASE BizRiseDB;
GO
USE BizRiseDB;
GO

-- 1. Usuarios
CREATE TABLE Usuarios (
    id_usuario        INT           IDENTITY(1,1) PRIMARY KEY,
    nombre            VARCHAR(100)  NOT NULL,
    apellido          VARCHAR(100)  NOT NULL,
    correo            VARCHAR(150)  NOT NULL UNIQUE,
    contrasena_hash   VARCHAR(255)  NOT NULL,
    rol               VARCHAR(20)   NOT NULL DEFAULT 'emprendedor'
                      CHECK (rol IN ('visitante','emprendedor','administrador')),
    estado            VARCHAR(20)   NOT NULL DEFAULT 'activo'
                      CHECK (estado IN ('activo','inactivo','suspendido')),
    avatar_url        VARCHAR(255)  NULL,
    fecha_registro    DATETIME      NOT NULL DEFAULT GETDATE()
);

-- 2. Categorias
CREATE TABLE Categorias (
    id_categoria  INT           IDENTITY(1,1) PRIMARY KEY,
    nombre        VARCHAR(100)  NOT NULL,
    descripcion   VARCHAR(255)  NULL,
    icono_url     VARCHAR(255)  NULL
);

-- 3. Emprendimientos
CREATE TABLE Emprendimientos (
    id_emprendimiento    INT           IDENTITY(1,1) PRIMARY KEY,
    id_usuario           INT           NOT NULL,
    id_categoria         INT           NOT NULL,
    nombre               VARCHAR(150)  NOT NULL,
    descripcion          TEXT          NULL,
    telefono             VARCHAR(20)   NULL,
    direccion            VARCHAR(255)  NULL,
    distrito             VARCHAR(100)  NULL,
    horario_apertura     TIME          NULL,
    horario_cierre       TIME          NULL,
    imagen_portada_url   VARCHAR(255)  NULL,
    estado_verificacion  VARCHAR(20)   NOT NULL DEFAULT 'pendiente'
                         CHECK (estado_verificacion IN ('pendiente','aprobado','rechazado')),
    fecha_registro       DATETIME      NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Emp_Usuario   FOREIGN KEY (id_usuario)   REFERENCES Usuarios(id_usuario),
    CONSTRAINT FK_Emp_Categoria FOREIGN KEY (id_categoria) REFERENCES Categorias(id_categoria)
);

-- 4. Productos
CREATE TABLE Productos (
    id_producto          INT             IDENTITY(1,1) PRIMARY KEY,
    id_emprendimiento    INT             NOT NULL,
    nombre               VARCHAR(150)    NOT NULL,
    descripcion          TEXT            NULL,
    precio               DECIMAL(10,2)   NULL,
    imagen_url           VARCHAR(255)    NULL,
    estado_stock         VARCHAR(20)     NOT NULL DEFAULT 'disponible'
                         CHECK (estado_stock IN ('disponible','bajo_stock','agotado')),
    activo               BIT             NOT NULL DEFAULT 1,
    fecha_creacion       DATETIME        NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Prod_Emp FOREIGN KEY (id_emprendimiento) REFERENCES Emprendimientos(id_emprendimiento)
);

-- 5. Comentarios
CREATE TABLE Comentarios (
    id_comentario        INT       IDENTITY(1,1) PRIMARY KEY,
    id_usuario           INT       NOT NULL,
    id_emprendimiento    INT       NOT NULL,
    contenido            TEXT      NOT NULL,
    util_count           INT       NOT NULL DEFAULT 0,
    fecha                DATETIME  NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Com_Usuario FOREIGN KEY (id_usuario)        REFERENCES Usuarios(id_usuario),
    CONSTRAINT FK_Com_Emp     FOREIGN KEY (id_emprendimiento) REFERENCES Emprendimientos(id_emprendimiento)
);

-- 6. Valoraciones
CREATE TABLE Valoraciones (
    id_valoracion        INT       IDENTITY(1,1) PRIMARY KEY,
    id_usuario           INT       NOT NULL,
    id_emprendimiento    INT       NOT NULL,
    puntuacion           TINYINT   NOT NULL CHECK (puntuacion BETWEEN 1 AND 5),
    fecha                DATETIME  NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Val_Usuario FOREIGN KEY (id_usuario)        REFERENCES Usuarios(id_usuario),
    CONSTRAINT FK_Val_Emp     FOREIGN KEY (id_emprendimiento) REFERENCES Emprendimientos(id_emprendimiento),
    CONSTRAINT UQ_Val_Usuario_Emp UNIQUE (id_usuario, id_emprendimiento)
);

-- 7. Promociones
CREATE TABLE Promociones (
    id_promocion         INT           IDENTITY(1,1) PRIMARY KEY,
    id_emprendimiento    INT           NOT NULL,
    titulo               VARCHAR(150)  NOT NULL,
    descripcion          TEXT          NULL,
    fecha_inicio         DATE          NULL,
    fecha_fin            DATE          NULL,
    estado               VARCHAR(20)   NOT NULL DEFAULT 'activa'
                         CHECK (estado IN ('activa','vencida','borrador')),
    CONSTRAINT FK_Prom_Emp FOREIGN KEY (id_emprendimiento) REFERENCES Emprendimientos(id_emprendimiento)
);

-- 8. RedesSociales
CREATE TABLE RedesSociales (
    id_red               INT           IDENTITY(1,1) PRIMARY KEY,
    id_emprendimiento    INT           NOT NULL,
    plataforma           VARCHAR(30)   NOT NULL
                         CHECK (plataforma IN ('facebook','instagram','whatsapp','web','tiktok')),
    url                  VARCHAR(255)  NOT NULL,
    CONSTRAINT FK_RS_Emp FOREIGN KEY (id_emprendimiento) REFERENCES Emprendimientos(id_emprendimiento)
);
GO
