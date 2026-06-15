# BizRise — Backend Controllers & Repository Pattern

## Patrón general

Cada controller de FastAPI sigue esta estructura:

```
Controller
├── APIRouter (prefix="/api/v1/recurso")
├── Schemas Pydantic (request/response)
├── Dependencias: get_db() → conexión pyodbc
└── Endpoints → instancian Repository → llaman execute_sp()
```

### Reglas

- **NUNCA** SQL inline en los controllers
- **NUNCA** SQLAlchemy ORM en los controllers
- **SIEMPRE** llamar a un repository que ejecuta un Stored Procedure
- `get_db()` retorna una conexión pyodbc directa, NO una SQLAlchemy Session

---

## base_repository.py — Clase base

Ubicación: `backend/src/repositories/base_repository.py`

```python
import pyodbc
from typing import Any

class BaseRepository:
    """Repositorio base que ejecuta procedimientos almacenados.

    Recibe una conexión pyodbc directa (no SQLAlchemy session)
    y ejecuta EXEC sp_name @param1=?, @param2=? retornando listas de dicts.
    """

    def __init__(self, db: pyodbc.Connection):
        self.db = db

    def execute_sp(self, sp_name: str, params: dict[str, Any] | None = None) -> list[dict[str, Any]]:
        """Ejecuta SP y retorna lista de dicts del primer resultset."""
        if params is None:
            params = {}

        cursor = self.db.cursor()
        try:
            param_str = ", ".join([f"@{k}=?" for k in params.keys()])
            query = f"EXEC {sp_name} {param_str}" if param_str else f"EXEC {sp_name}"
            cursor.execute(query, list(params.values()))

            if cursor.description is None:
                self.db.commit()
                return []

            columns = [col[0] for col in cursor.description]
            rows = [dict(zip(columns, row)) for row in cursor.fetchall()]
            self.db.commit()
            return rows
        except pyodbc.Error as e:
            self.db.rollback()
            raise e
        finally:
            cursor.close()

    def execute_sp_multi(self, sp_name: str, params: dict[str, Any] | None = None) -> list[list[dict[str, Any]]]:
        """Ejecuta SP y retorna TODOS los resultsets como listas de dicts."""
        if params is None:
            params = {}

        cursor = self.db.cursor()
        try:
            param_str = ", ".join([f"@{k}=?" for k in params.keys()])
            query = f"EXEC {sp_name} {param_str}" if param_str else f"EXEC {sp_name}"
            cursor.execute(query, list(params.values()))

            results = []
            while True:
                if cursor.description:
                    columns = [col[0] for col in cursor.description]
                    rows = [dict(zip(columns, row)) for row in cursor.fetchall()]
                    results.append(rows)
                else:
                    results.append([])
                if not cursor.nextset():
                    break

            self.db.commit()
            return results
        except pyodbc.Error as e:
            self.db.rollback()
            raise e
        finally:
            cursor.close()

    def execute_sp_single(self, sp_name: str, params: dict[str, Any] | None = None) -> dict[str, Any] | None:
        """Ejecuta SP y retorna la primera fila del primer resultset, o None."""
        rows = self.execute_sp(sp_name, params)
        return rows[0] if rows else None
```

### Métodos base

| Método | Retorno | Uso |
|---|---|---|
| `execute_sp(sp_name, params)` | `list[dict]` | SPs que retornan múltiples filas (listados paginados) |
| `execute_sp_multi(sp_name, params)` | `list[list[dict]]` | SPs con múltiples resultsets (ej: detalle + redes + promos) |
| `execute_sp_single(sp_name, params)` | `dict \| None` | SPs que retornan una sola fila (get_by_id, create, update) |

El commit es automático después de cada ejecución exitosa. El rollback ocurre automáticamente si hay un `pyodbc.Error`.

---

## Repositories por entidad

### UserRepository (`backend/src/repositories/user_repository.py`)

| Método | SP | Descripción |
|---|---|---|
| `get_by_email(correo)` | `sp_GetUserByEmail` | Obtener usuario por correo |
| `get_by_id(id_usuario)` | `sp_GetUserById` | Obtener usuario por ID |
| `create(data)` | `sp_RegisterUser` | Registrar nuevo usuario |
| `update_status(id_usuario, estado)` | `sp_UpdateUserStatus` | Activar/suspender/desactivar |
| `change_password(id_usuario, contrasena_hash_nueva)` | `sp_ChangePassword` | Cambiar contraseña |
| `get_all(page, size, rol, estado)` | `sp_GetAllUsers` | Listar usuarios paginados |

### BusinessRepository (`backend/src/repositories/business_repository.py`)

| Método | SP | Descripción |
|---|---|---|
| `get_all(busqueda, id_categoria, distrito, orden, page, size)` | `sp_GetBusinesses` | Listar negocios aprobados (directorio público) |
| `get_by_id(id_emprendimiento)` | `sp_GetBusinessById` | Detalle completo + redes + promos activas |
| `get_by_user(id_usuario)` | `sp_GetBusinessByUserId` | Negocio del usuario actual |
| `create(data)` | `sp_CreateBusiness` | Registrar nuevo emprendimiento |
| `update(id_emprendimiento, id_usuario, data)` | `sp_UpdateBusiness` | Actualizar datos del negocio |
| `update_image(id_emprendimiento, imagen_url)` | `sp_UpdateBusinessImage` | Actualizar imagen de portada |
| `update_status(id_emprendimiento, estado, motivo)` | `sp_UpdateBusinessStatus` | Aprobar/rechazar (admin) |
| `get_all_admin(page, size, busqueda, estado, id_categoria)` | `sp_GetAllBusinessesAdmin` | Listar todos los negocios (admin) |

### ProductRepository (`backend/src/repositories/product_repository.py`)

| Método | SP | Descripción |
|---|---|---|
| `get_by_business(id_emprendimiento, page, size, busqueda)` | `sp_GetProductsByBusiness` | Listar productos de un negocio |
| `get_by_id(id_producto)` | `sp_GetProductById` | Obtener producto por ID |
| `create(id_emprendimiento, data)` | `sp_CreateProduct` | Crear producto (máx. 50 activos) |
| `update(id_producto, id_emprendimiento, data)` | `sp_UpdateProduct` | Actualizar producto |
| `delete(id_producto, id_emprendimiento)` | `sp_DeleteProduct` | Soft delete (activo = 0) |

### ReviewRepository (`backend/src/repositories/review_repository.py`)

| Método | SP | Descripción |
|---|---|---|
| `get_by_business(id_emprendimiento, page, size)` | `sp_GetReviewsByBusiness` | Listar reseñas de un negocio |
| `create(id_usuario, id_emprendimiento, contenido)` | `sp_CreateReview` | Crear comentario |
| `get_distribution(id_emprendimiento)` | `sp_GetRatingDistribution` | Distribución de estrellas + promedio |
| `user_already_reviewed(id_usuario, id_emprendimiento)` | `sp_UserAlreadyReviewed` | Verificar si ya valoró |

### PromotionRepository (`backend/src/repositories/promotion_repository.py`)

| Método | SP | Descripción |
|---|---|---|
| `get_by_business(id_emprendimiento)` | `sp_GetPromotionsByBusiness` | Listar promociones |
| `get_by_id(id_promocion)` | `sp_GetPromotionById` | Obtener promoción por ID |
| `create(id_emprendimiento, data)` | `sp_CreatePromotion` | Crear (máx. 10 activas) |
| `update(id_promocion, id_emprendimiento, data)` | `sp_UpdatePromotion` | Actualizar promoción |
| `delete(id_promocion, id_emprendimiento)` | `sp_DeletePromotion` | Eliminar promoción |
| `auto_expire()` | `sp_AutoExpirePromotions` | Marcar vencidas |

### CategoryRepository (`backend/src/repositories/category_repository.py`)

| Método | SP | Descripción |
|---|---|---|
| `get_all()` | `sp_GetCategories` | Listar todas las categorías |
| `get_by_id(id_categoria)` | `sp_GetCategoryById` | Obtener categoría por ID |

---

## Conexión a base de datos

`backend/src/config/db.py`:

```python
import pyodbc
from src.config.settings import settings

def get_db():
    """Dependency FastAPI — inyecta conexión pyodbc directa."""
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

---

## Ejemplo completo de controller

```python
# backend/src/controllers/entrepreneur_controller.py

from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File
from pydantic import BaseModel
from typing import Optional

from src.config.db import get_db
from src.repositories.business_repository import BusinessRepository
from src.repositories.product_repository import ProductRepository
from src.repositories.promotion_repository import PromotionRepository
from src.controllers.auth_controller import require_role

router = APIRouter()

# ── Schemas Pydantic ──────────────────────────────────────

class ProductResponse(BaseModel):
    id_producto: int
    nombre: str
    descripcion: str | None = None
    precio: float | None = None
    imagen_url: str | None = None
    estado_stock: str = "disponible"
    stock: int = 0
    activo: bool = True
    fecha_creacion: str | None = None

class ProductListResponse(BaseModel):
    items: list[ProductResponse]
    total: int
    page: int
    size: int
    pages: int

# ── Endpoints ──────────────────────────────────────────────

@router.get("/products", response_model=ProductListResponse)
def listar_mis_productos(
    page: int = 1,
    size: int = 20,
    busqueda: str | None = None,
    current_user=Depends(require_role("emprendedor")),
    conn=Depends(get_db),
):
    biz_repo = BusinessRepository(conn)
    emp = biz_repo.get_by_user(current_user["id_usuario"])
    if not emp:
        raise HTTPException(404, "No tienes un negocio registrado aún")

    prod_repo = ProductRepository(conn)
    result = prod_repo.get_by_business(emp["id_emprendimiento"], page=page, size=size, busqueda=busqueda)

    items = [
        ProductResponse(
            id_producto=r["id_producto"],
            nombre=r["nombre"],
            descripcion=r.get("descripcion"),
            precio=float(r["precio"]) if r.get("precio") else None,
            imagen_url=r.get("imagen_url"),
            estado_stock=r["estado_stock"],
            stock=r.get("stock") or 0,
            activo=r.get("activo", True),
            fecha_creacion=r.get("fecha_creacion"),
        )
        for r in result["items"]
    ]
    return ProductListResponse(
        items=items, total=result["total"],
        page=result["page"], size=result["size"], pages=result["pages"],
    )


@router.post("/products", status_code=201, response_model=ProductResponse)
async def crear_producto(
    nombre: str = Form(...),
    descripcion: Optional[str] = Form(None),
    precio: Optional[float] = Form(None),
    stock: int = Form(0),
    estado_stock: str = Form("disponible"),
    imagen: Optional[UploadFile] = File(None),
    current_user=Depends(require_role("emprendedor")),
    conn=Depends(get_db),
):
    biz_repo = BusinessRepository(conn)
    emp = biz_repo.get_by_user(current_user["id_usuario"])
    if not emp:
        raise HTTPException(404, "No tienes un negocio registrado aún")
    if emp.get("estado_verificacion") != "aprobado":
        raise HTTPException(400, "Tu negocio debe estar aprobado para agregar productos")

    imagen_url = None
    if imagen and imagen.filename:
        from src.controllers.entrepreneur_controller import _guardar_imagen
        imagen_url = await _guardar_imagen(imagen, "productos")

    prod_repo = ProductRepository(conn)
    try:
        prod = prod_repo.create(emp["id_emprendimiento"], {
            "nombre": nombre.strip(),
            "descripcion": descripcion.strip() if descripcion else None,
            "precio": precio,
            "imagen_url": imagen_url,
            "stock": stock,
            "estado_stock": estado_stock,
        })
    except Exception as e:
        if "Máximo 50" in str(e):
            raise HTTPException(400, "Máximo 50 productos por emprendimiento")
        raise HTTPException(400, str(e))

    return ProductResponse(
        id_producto=prod["id_producto"],
        nombre=prod["nombre"],
        descripcion=prod.get("descripcion"),
        precio=float(prod["precio"]) if prod.get("precio") else None,
        imagen_url=prod.get("imagen_url"),
        estado_stock=prod["estado_stock"],
        stock=prod.get("stock") or 0,
        activo=prod.get("activo", True),
        fecha_creacion=prod.get("fecha_creacion"),
    )
```

---

## Flujo de una petición

```
HTTP Request
    │
    ▼
FastAPI Router → valida path params, query params, body
    │
    ▼
Controller function → recibe conn=Depends(get_db)
    │
    ▼
Instancia Repository(conn)
    │
    ▼
Repository.execute_sp("sp_name", {params})
    │  construye: EXEC sp_name @param1=?, @param2=?
    │  cursor.execute(query, list(params.values()))
    ▼
pyodbc → SQL Server → ejecuta SP
    │
    ▼
ResultSet → cursor.fetchall() → list[dict]
    │
    ▼
Repository.commit() → retorna list[dict]
    │
    ▼
Controller serializa con response_model Pydantic
    │
    ▼
HTTP Response JSON
```

## Errores y validaciones

- Los SPs lanzan `RAISERROR` para validaciones de negocio (duplicados, límites, estados inválidos)
- `pyodbc.Error` capturado en `BaseRepository.execute_sp()` → rollback automático
- El controller captura excepciones y las convierte en `HTTPException` con mensaje descriptivo
- Los schemas Pydantic tienen validadores `field_validator` para reglas de negocio (fechas, rangos)
