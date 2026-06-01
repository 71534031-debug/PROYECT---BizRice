# BizRise — Esquema de Base de Datos

## Motor: SQL Server 2019+
## Driver Python: pyodbc
## ORM: SQLAlchemy (mssql+pyodbc)

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
-- Hash generado con bcrypt del password Admin123!
INSERT INTO Usuarios (nombre, apellido, correo, contrasena_hash, rol) VALUES
('Admin', 'BizRise', 'admin@bizrise.pe',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMqJqhg3GPXV1jBKZPMbfMq.oK',
 'administrador');
GO
```

---

## backend/src/config/db.py

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from src.config.settings import settings

class Base(DeclarativeBase):
    pass

engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Dependency FastAPI — inyecta sesión de BD en cada request"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

## backend/src/config/settings.py

```python
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # SQL Server
    DB_SERVER:   str
    DB_NAME:     str = "BizRiseDB"
    DB_USER:     str
    DB_PASSWORD: str
    DB_DRIVER:   str = "ODBC+Driver+17+for+SQL+Server"

    # JWT
    SECRET_KEY:                  str
    ALGORITHM:                   str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS:   int = 7

    # App
    APP_NAME:        str  = "BizRise API"
    DEBUG:           bool = False
    ALLOWED_ORIGINS: str  = "http://localhost:4200,http://127.0.0.1:5500"

    # Uploads
    UPLOAD_DIR:       str = "uploads"
    MAX_FILE_SIZE_MB: int = 2

    @property
    def DATABASE_URL(self) -> str:
        driver = self.DB_DRIVER.replace(" ", "+")
        return (
            f"mssql+pyodbc://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_SERVER}/{self.DB_NAME}?driver={driver}"
        )

    @property
    def ORIGINS_LIST(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"

settings = Settings()
```

---

## backend/.env.example

```env
# SQL Server — completar con tus datos
DB_SERVER=localhost
DB_NAME=BizRiseDB
DB_USER=sa
DB_PASSWORD=TuPassword123!
DB_DRIVER=ODBC Driver 17 for SQL Server

# JWT — cambiar por una clave segura larga
SECRET_KEY=bizrise_clave_secreta_muy_larga_cambiar_en_produccion_2026
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# App
APP_NAME=BizRise API
DEBUG=True
ALLOWED_ORIGINS=http://localhost:5500,http://127.0.0.1:5500

# Uploads
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=2
```

---

## backend/requirements.txt

```
fastapi==0.110.0
uvicorn[standard]==0.27.1
sqlalchemy==2.0.28
pyodbc==5.0.1
pydantic==2.6.3
pydantic-settings==2.2.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-dotenv==1.0.1
python-multipart==0.0.9
```

---

## Modelos SQLAlchemy (backend/src/models/)

### user.py
```python
from sqlalchemy import Column, Integer, String, DateTime, func
from src.config.db import Base

class Usuario(Base):
    __tablename__ = "Usuarios"
    id_usuario      = Column(Integer, primary_key=True, index=True)
    nombre          = Column(String(100), nullable=False)
    apellido        = Column(String(100), nullable=False)
    correo          = Column(String(150), unique=True, nullable=False, index=True)
    contrasena_hash = Column(String(255), nullable=False)
    rol             = Column(String(20),  nullable=False, default="emprendedor")
    estado          = Column(String(20),  nullable=False, default="activo")
    avatar_url      = Column(String(255), nullable=True)
    fecha_registro  = Column(DateTime, server_default=func.getdate())
```

### category.py
```python
from sqlalchemy import Column, Integer, String
from src.config.db import Base

class Categoria(Base):
    __tablename__ = "Categorias"
    id_categoria = Column(Integer, primary_key=True, index=True)
    nombre       = Column(String(100), nullable=False)
    descripcion  = Column(String(255), nullable=True)
    icono_url    = Column(String(255), nullable=True)
```

### business.py
```python
from sqlalchemy import Column, Integer, String, Text, DateTime, Time, ForeignKey, func
from sqlalchemy.orm import relationship
from src.config.db import Base

class Emprendimiento(Base):
    __tablename__ = "Emprendimientos"
    id_emprendimiento   = Column(Integer, primary_key=True, index=True)
    id_usuario          = Column(Integer, ForeignKey("Usuarios.id_usuario"),    nullable=False)
    id_categoria        = Column(Integer, ForeignKey("Categorias.id_categoria"), nullable=False)
    nombre              = Column(String(150), nullable=False)
    descripcion         = Column(Text,        nullable=True)
    telefono            = Column(String(20),  nullable=True)
    direccion           = Column(String(255), nullable=True)
    distrito            = Column(String(100), nullable=True)
    horario_apertura    = Column(Time,        nullable=True)
    horario_cierre      = Column(Time,        nullable=True)
    imagen_portada_url  = Column(String(255), nullable=True)
    estado_verificacion = Column(String(20),  nullable=False, default="pendiente")
    fecha_registro      = Column(DateTime, server_default=func.getdate())

    propietario    = relationship("Usuario",    foreign_keys=[id_usuario])
    categoria      = relationship("Categoria",  foreign_keys=[id_categoria])
    productos      = relationship("Producto",   back_populates="emprendimiento")
    comentarios    = relationship("Comentario", back_populates="emprendimiento")
    valoraciones   = relationship("Valoracion", back_populates="emprendimiento")
    promociones    = relationship("Promocion",  back_populates="emprendimiento")
    redes_sociales = relationship("RedSocial",  back_populates="emprendimiento")
```

### product.py
```python
from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey, Boolean, func
from sqlalchemy.orm import relationship
from src.config.db import Base

class Producto(Base):
    __tablename__ = "Productos"
    id_producto       = Column(Integer, primary_key=True, index=True)
    id_emprendimiento = Column(Integer, ForeignKey("Emprendimientos.id_emprendimiento"), nullable=False)
    nombre            = Column(String(150), nullable=False)
    descripcion       = Column(Text,        nullable=True)
    precio            = Column(Numeric(10,2), nullable=True)
    imagen_url        = Column(String(255), nullable=True)
    estado_stock      = Column(String(20),  nullable=False, default="disponible")
    activo            = Column(Boolean,     nullable=False, default=True)
    fecha_creacion    = Column(DateTime, server_default=func.getdate())

    emprendimiento = relationship("Emprendimiento", back_populates="productos")
```

### review.py
```python
from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from src.config.db import Base

class Comentario(Base):
    __tablename__ = "Comentarios"
    id_comentario     = Column(Integer, primary_key=True, index=True)
    id_usuario        = Column(Integer, ForeignKey("Usuarios.id_usuario"),              nullable=False)
    id_emprendimiento = Column(Integer, ForeignKey("Emprendimientos.id_emprendimiento"), nullable=False)
    contenido         = Column(Text,    nullable=False)
    util_count        = Column(Integer, nullable=False, default=0)
    fecha             = Column(DateTime, server_default=func.getdate())

    usuario        = relationship("Usuario",         foreign_keys=[id_usuario])
    emprendimiento = relationship("Emprendimiento",  back_populates="comentarios")
```

### rating.py
```python
from sqlalchemy import Column, Integer, SmallInteger, DateTime, ForeignKey, func, UniqueConstraint
from sqlalchemy.orm import relationship
from src.config.db import Base

class Valoracion(Base):
    __tablename__ = "Valoraciones"
    __table_args__ = (
        UniqueConstraint("id_usuario", "id_emprendimiento", name="UQ_Val_Usuario_Emp"),
    )
    id_valoracion     = Column(Integer,      primary_key=True, index=True)
    id_usuario        = Column(Integer,      ForeignKey("Usuarios.id_usuario"),              nullable=False)
    id_emprendimiento = Column(Integer,      ForeignKey("Emprendimientos.id_emprendimiento"), nullable=False)
    puntuacion        = Column(SmallInteger, nullable=False)
    fecha             = Column(DateTime,     server_default=func.getdate())

    usuario        = relationship("Usuario")
    emprendimiento = relationship("Emprendimiento", back_populates="valoraciones")
```

### promotion.py
```python
from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey
from sqlalchemy.orm import relationship
from src.config.db import Base

class Promocion(Base):
    __tablename__ = "Promociones"
    id_promocion      = Column(Integer,      primary_key=True, index=True)
    id_emprendimiento = Column(Integer,      ForeignKey("Emprendimientos.id_emprendimiento"), nullable=False)
    titulo            = Column(String(150),  nullable=False)
    descripcion       = Column(Text,         nullable=True)
    fecha_inicio      = Column(Date,         nullable=True)
    fecha_fin         = Column(Date,         nullable=True)
    estado            = Column(String(20),   nullable=False, default="activa")

    emprendimiento = relationship("Emprendimiento", back_populates="promociones")
```

### social_network.py
```python
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from src.config.db import Base

class RedSocial(Base):
    __tablename__ = "RedesSociales"
    id_red            = Column(Integer,     primary_key=True, index=True)
    id_emprendimiento = Column(Integer,     ForeignKey("Emprendimientos.id_emprendimiento"), nullable=False)
    plataforma        = Column(String(30),  nullable=False)
    url               = Column(String(255), nullable=False)

    emprendimiento = relationship("Emprendimiento", back_populates="redes_sociales")
```
