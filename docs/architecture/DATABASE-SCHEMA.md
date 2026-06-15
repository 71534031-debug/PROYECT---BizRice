# BizRise — Esquema de Base de Datos

## Motor: SQL Server 2019+
## Driver Python: pyodbc
## ORM: SQLAlchemy (solo para crear tablas al inicio — NUNCA para queries)

---

## backend/src/database/schema.sql

```sql
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
                      CHECK (rol IN ('visitante','emprendedor','administrador','cliente')),
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

-- 4. Productos (con soft delete vía activo)
CREATE TABLE Productos (
    id_producto          INT             IDENTITY(1,1) PRIMARY KEY,
    id_emprendimiento    INT             NOT NULL,
    nombre               VARCHAR(150)    NOT NULL,
    descripcion          TEXT            NULL,
    precio               DECIMAL(10,2)   NULL,
    imagen_url           VARCHAR(255)    NULL,
    stock                INT             NOT NULL DEFAULT 0,
    estado_stock         VARCHAR(20)     NOT NULL DEFAULT 'disponible'
                         CHECK (estado_stock IN ('disponible','bajo_stock','agotado')),
    activo               BIT             NOT NULL DEFAULT 1,  -- soft delete
    fecha_creacion       DATETIME        NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Prod_Emp FOREIGN KEY (id_emprendimiento) REFERENCES Emprendimientos(id_emprendimiento)
);

-- 5. Comentarios (reseñas con contenido)
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

-- 6. Valoraciones (puntuación 1-5, único par usuario+emprendimiento)
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
```

---

## backend/src/database/seeds.sql

```sql
USE BizRiseDB;
GO

-- Categorías iniciales
INSERT INTO Categorias (nombre, descripcion) VALUES
('Gastronomía',             'Restaurantes, cafeterías y comida típica'),
('Textilería y Moda',       'Ropa, telas, confecciones y accesorios'),
('Artesanía',               'Productos artesanales y arte tradicional'),
('Servicios Profesionales', 'Consultoría, diseño y contabilidad'),
('Turismo',                 'Agencias y experiencias turísticas'),
('Tecnología',              'Soluciones digitales y desarrollo');

-- Administrador inicial (contraseña: Admin123! — cambiar en producción)
INSERT INTO Usuarios (nombre, apellido, correo, contrasena_hash, rol) VALUES
('Admin', 'BizRise', 'admin@bizrise.pe',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMqJqhg3GPXV1jBKZPMbfMq.oK',
 'administrador');
GO
```

---

## Stored Procedures

Todas las operaciones CRUD pasan exclusivamente por Stored Procedures.
Los SPs se definen con `CREATE OR ALTER` en `backend/src/database/stored_procedures.sql`.

### Usuarios

| SP | Parámetros | Descripción |
|---|---|---|
| `sp_GetUserByEmail` | `@correo` | Obtener usuario por correo (login) |
| `sp_GetUserById` | `@id_usuario` | Obtener usuario por ID |
| `sp_RegisterUser` | `@nombre, @apellido, @correo, @contrasena_hash, @rol` | Registrar nuevo usuario |
| `sp_UpdateUserStatus` | `@id_usuario, @estado` | Activar/suspender/desactivar usuario |
| `sp_ChangePassword` | `@id_usuario, @contrasena_hash_nueva` | Cambiar contraseña |
| `sp_GetAllUsers` | `@page, @size, @rol, @estado` | Listar usuarios (paginado) |

### Categorías

| SP | Parámetros | Descripción |
|---|---|---|
| `sp_GetCategories` | — | Listar todas las categorías |
| `sp_GetCategoryById` | `@id_categoria` | Obtener categoría por ID |

### Emprendimientos

| SP | Parámetros | Descripción |
|---|---|---|
| `sp_GetBusinesses` | `@busqueda, @id_categoria, @distrito, @orden, @page, @size` | Listar negocios aprobados (directorio público, paginado) |
| `sp_GetBusinessById` | `@id_emprendimiento` | Obtener detalle completo + redes + promos activas |
| `sp_GetBusinessByUserId` | `@id_usuario` | Obtener negocio del usuario actual + redes |
| `sp_CreateBusiness` | `@id_usuario, @id_categoria, @nombre, @descripcion, @telefono, @direccion, @distrito` | Registrar nuevo emprendimiento |
| `sp_UpdateBusiness` | `@id_emprendimiento, @id_usuario, @nombre, @id_categoria, @descripcion, @telefono, @direccion, @distrito, @horario_apertura, @horario_cierre` | Actualizar datos del negocio |
| `sp_UpdateBusinessImage` | `@id_emprendimiento, @imagen_portada_url` | Actualizar imagen de portada |
| `sp_UpdateBusinessStatus` | `@id_emprendimiento, @estado, @motivo` | Aprobar/rechazar negocio (admin) |
| `sp_GetAllBusinessesAdmin` | `@page, @size, @busqueda, @estado, @id_categoria` | Listar todos los negocios (admin, paginado) |
| `sp_CountBusinesses` | — | Contar total de negocios aprobados |
| `sp_CountPendingBusinesses` | — | Contar negocios pendientes de revisión |

### Productos

| SP | Parámetros | Descripción |
|---|---|---|
| `sp_GetProductsByBusiness` | `@id_emprendimiento, @page, @size, @busqueda` | Listar productos de un negocio (paginado) |
| `sp_GetProductById` | `@id_producto` | Obtener producto por ID |
| `sp_CreateProduct` | `@id_emprendimiento, @nombre, @descripcion, @precio, @imagen_url, @stock, @estado_stock` | Crear producto (máx. 50 activos) |
| `sp_UpdateProduct` | `@id_producto, @id_emprendimiento, @nombre, @descripcion, @precio, @imagen_url, @stock, @estado_stock` | Actualizar producto |
| `sp_DeleteProduct` | `@id_producto, @id_emprendimiento` | Soft delete (activo = 0) |
| `sp_CountProductsByBusiness` | `@id_emprendimiento` | Contar productos activos |

### Reseñas y Valoraciones

| SP | Parámetros | Descripción |
|---|---|---|
| `sp_GetReviewsByBusiness` | `@id_emprendimiento, @page, @size` | Listar reseñas de un negocio (paginado) |
| `sp_CreateReview` | `@id_usuario, @id_emprendimiento, @contenido` | Crear comentario/reseña |
| `sp_GetRatingDistribution` | `@id_emprendimiento` | Distribución de estrellas (1-5) + promedio |
| `sp_UserAlreadyReviewed` | `@id_usuario, @id_emprendimiento` | Verificar si el usuario ya valoró |

### Promociones

| SP | Parámetros | Descripción |
|---|---|---|
| `sp_GetPromotionsByBusiness` | `@id_emprendimiento` | Listar promociones de un negocio |
| `sp_GetPromotionById` | `@id_promocion` | Obtener promoción por ID |
| `sp_CreatePromotion` | `@id_emprendimiento, @titulo, @descripcion, @fecha_inicio, @fecha_fin` | Crear promoción (máx. 10 activas) |
| `sp_UpdatePromotion` | `@id_promocion, @id_emprendimiento, @titulo, @descripcion, @fecha_inicio, @fecha_fin` | Actualizar promoción |
| `sp_DeletePromotion` | `@id_promocion, @id_emprendimiento` | Eliminar promoción |
| `sp_AutoExpirePromotions` | — | Marcar como vencidas las promociones con fecha_fin < hoy |

### Admin / Estadísticas

| SP | Parámetros | Descripción |
|---|---|---|
| `sp_GetAdminStats` | — | Estadísticas del panel admin (totales) |

> **Nota**: Cada SP se implementa con `CREATE OR ALTER PROCEDURE`. Todos los SPs retornan `SET NOCOUNT ON;` y usan `RAISERROR` para errores de validación.

---

## backend/src/config/db.py (conexión actual)

```python
import pyodbc
from src.config.settings import settings

def get_db():
    """Retorna una conexión pyodbc DIRECTA, NO una SQLAlchemy Session.

    Los repositories reciben esta conexión y ejecutan los SPs
    con cursor.execute("EXEC sp_name @param1=?, @param2=?", values).
    """
    conn = pyodbc.connect(
        f"DRIVER={{{settings.DB_DRIVER}}};"
        f"SERVER={settings.DB_SERVER};"
        f"DATABASE={settings.DB_NAME};"
        f"UID={settings.DB_USER};"
        f"PWD={settings.DB_PASSWORD};"
        "TrustServerCertificate=yes;"
    )
    try:
        yield conn
    finally:
        conn.close()
```

La función `get_db()` se usa como dependencia de FastAPI en todos los controllers:

```python
from fastapi import Depends
from src.config.db import get_db

@router.get("/businesses")
def listar_negocios(conn=Depends(get_db)):
    repo = BusinessRepository(conn)
    return repo.get_all(...)
```

---

## Modelos SQLAlchemy (backend/src/models/)

Los modelos SQLAlchemy existen únicamente para crear las tablas automáticamente al iniciar la aplicación:

```python
# En main.py o durante startup:
from src.models import user, category, business, product, review, rating, promotion, social_network
from src.config.db import engine, Base

Base.metadata.create_all(bind=engine)
```

**NO se usan para hacer queries en los controllers.** Todas las operaciones de datos pasan por Stored Procedures a través de los repositorios.

### Lista de modelos

| Archivo | Clase | Tabla |
|---|---|---|
| `user.py` | `Usuario` | Usuarios |
| `category.py` | `Categoria` | Categorias |
| `business.py` | `Emprendimiento` | Emprendimientos |
| `product.py` | `Producto` | Productos |
| `review.py` | `Comentario` | Comentarios |
| `rating.py` | `Valoracion` | Valoraciones |
| `promotion.py` | `Promocion` | Promociones |
| `social_network.py` | `RedSocial` | RedesSociales |

---

## Repository pattern (backend/src/repositories/)

Cada repositorio hereda de `BaseRepository` que provee tres métodos:

| Método | Descripción |
|---|---|
| `execute_sp(sp_name, params)` | Ejecuta SP y retorna lista de dicts (primer resultset) |
| `execute_sp_multi(sp_name, params)` | Ejecuta SP y retorna TODOS los resultsets como listas de dicts |
| `execute_sp_single(sp_name, params)` | Ejecuta SP y retorna la primera fila del primer resultset, o None |

### Ejemplo de repositorio

```python
# product_repository.py
from src.repositories.base_repository import BaseRepository

class ProductRepository(BaseRepository):

    def get_by_business(self, id_emprendimiento, page=1, size=20, busqueda=None):
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

    def create(self, id_emprendimiento, data):
        return self.execute_sp_single("sp_CreateProduct", {
            "id_emprendimiento": id_emprendimiento,
            "nombre": data.get("nombre"),
            "descripcion": data.get("descripcion"),
            "precio": data.get("precio"),
            "imagen_url": data.get("imagen_url"),
            "stock": data.get("stock", 0),
            "estado_stock": data.get("estado_stock", "disponible"),
        })
```

---

## Reglas de base de datos (resumen)

1. **TODAS las operaciones CRUD pasan por Stored Procedures** — NUNCA SQL inline en Python.
2. **Los repositorios usan `execute_sp("sp_name", {params})`** que construye `EXEC sp_name @param1=?, @param2=?` con pyodbc.
3. **Los modelos SQLAlchemy solo existen para `Base.metadata.create_all()`** — NUNCA para queries.
4. **`get_db()` retorna una conexión pyodbc directa**, NO una SQLAlchemy Session.
5. **Soft delete** en Productos vía columna `activo BIT NOT NULL DEFAULT 1`.
6. **Promociones** se auto-expiran vía `sp_AutoExpirePromotions`.
7. **Cada usuario solo puede valorar una vez** cada emprendimiento (`UNIQUE(id_usuario, id_emprendimiento)`).
