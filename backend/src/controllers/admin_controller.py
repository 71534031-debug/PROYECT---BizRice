from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime, timezone
from typing import Optional
from passlib.context import CryptContext
import re

from src.config.db import get_db_conn
from src.repositories.base_repository import BaseRepository
from src.repositories.user_repository import UserRepository
from src.repositories.business_repository import BusinessRepository
from src.controllers.auth_controller import require_role

router = APIRouter()


class SolicitudReciente(BaseModel):
    id_emprendimiento: int
    nombre: str
    categoria: str
    propietario: str
    fecha_registro: datetime


class CrecimientoMensual(BaseModel):
    mes: str
    negocios: int


class StatsResponse(BaseModel):
    total_negocios: int
    pendientes: int
    nuevos_usuarios_mes: int
    crecimiento_porcentaje: int
    solicitudes_recientes: list[SolicitudReciente]
    crecimiento_mensual: list[CrecimientoMensual]


class NotificacionItem(BaseModel):
    tipo: str
    id_ref: int
    titulo: str
    descripcion: str
    fecha: datetime


class PropietarioInfo(BaseModel):
    nombre: str
    apellido: str
    correo: str


class BusinessAdminItem(BaseModel):
    id_emprendimiento: int
    nombre: str
    categoria: str
    propietario: PropietarioInfo
    distrito: Optional[str] = None
    fecha_registro: datetime
    estado_verificacion: str


class BusinessListResponse(BaseModel):
    items: list[BusinessAdminItem]
    total: int
    page: int
    size: int
    pages: int


class RejectSchema(BaseModel):
    motivo: str


class BusinessAdminUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    distrito: Optional[str] = None
    id_categoria: Optional[int] = None
    estado_verificacion: Optional[str] = None


class MessageResponse(BaseModel):
    message: str


class UserAdminItem(BaseModel):
    id_usuario: int
    nombre: str
    apellido: str
    correo: str
    rol: str
    estado: str
    fecha_registro: datetime
    avatar_url: Optional[str] = None
    tiene_negocio: bool = False
    nombre_negocio: Optional[str] = None


class UserListResponse(BaseModel):
    items: list[UserAdminItem]
    total: int
    page: int
    size: int
    pages: int


class CreateUserSchema(BaseModel):
    nombre: str
    apellido: str
    correo: EmailStr
    contrasena: str
    rol: str = "emprendedor"

    @field_validator('contrasena')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Mínimo 8 caracteres')
        if not re.search(r'\d', v):
            raise ValueError('Debe contener al menos un número')
        return v

    @field_validator('rol')
    def validate_rol(cls, v):
        if v not in ("visitante", "emprendedor", "administrador", "cliente"):
            raise ValueError('Rol no válido')
        return v


class UpdateUserSchema(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    correo: Optional[EmailStr] = None
    rol: Optional[str] = None
    estado: Optional[str] = None


class TopProductoItem(BaseModel):
    id_producto: int
    nombre: str
    negocio: str
    total_vendido: int
    ingresos: float


class TopProductoRating(BaseModel):
    id_producto: int
    nombre: str
    precio: float
    imagen_url: Optional[str] = None
    negocio: str
    imagen_portada_url: Optional[str] = None
    puntuacion: float
    total_votos: int


class VentaMesItem(BaseModel):
    mes: str
    anio: int
    total_ventas: int
    ingresos: float


class DashboardMetricsResponse(BaseModel):
    total_usuarios: int
    total_emprendedores: int
    total_clientes: int
    usuarios_activos_mes: int
    total_negocios_aprobados: int
    total_negocios_pendientes: int
    total_productos: int
    total_ventas: int
    ingresos_totales: float
    ventas_entregadas: int
    ventas_pendientes: int
    ventas_canceladas: int
    ventas_por_mes: list[VentaMesItem]
    productos_mas_vendidos: list[TopProductoItem]


MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun",
         "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]


@router.get("/stats", response_model=StatsResponse)
def obtener_estadisticas(
    current_user=Depends(require_role("administrador")),
    conn=Depends(get_db_conn),
):
    repo = BaseRepository(conn)
    sql_stats = """SELECT
        (SELECT COUNT(*) FROM Usuarios) AS total_usuarios,
        (SELECT COUNT(*) FROM Usuarios WHERE rol = 'emprendedor') AS total_emprendedores,
        (SELECT COUNT(*) FROM Usuarios WHERE rol = 'cliente') AS total_clientes,
        (SELECT COUNT(*) FROM Emprendimientos) AS total_emprendimientos,
        (SELECT COUNT(*) FROM Emprendimientos WHERE estado_verificacion = 'aprobado') AS emprendimientos_aprobados,
        (SELECT COUNT(*) FROM Emprendimientos WHERE estado_verificacion = 'pendiente') AS emprendimientos_pendientes,
        (SELECT COUNT(*) FROM Emprendimientos WHERE estado_verificacion = 'rechazado') AS emprendimientos_rechazados,
        (SELECT COUNT(*) FROM Productos WHERE activo = TRUE) AS total_productos_activos,
        (SELECT COUNT(*) FROM Categorias) AS total_categorias,
        (SELECT COUNT(*) FROM Comentarios) AS total_comentarios,
        (SELECT COUNT(*) FROM Valoraciones) AS total_valoraciones"""
    stats_rows = repo.execute_sp(sql_stats)

    if not stats_rows:
        return StatsResponse(
            total_negocios=0, pendientes=0, nuevos_usuarios_mes=0,
            crecimiento_porcentaje=0, solicitudes_recientes=[],
            crecimiento_mensual=[],
        )

    meta = stats_rows[0]
    total_negocios = int(meta.get("total_emprendimientos", 0))
    pendientes = int(meta.get("emprendimientos_pendientes", 0))

    sql_solicitudes = """SELECT e.id_emprendimiento, e.nombre, e.fecha_registro,
                                u.nombre AS propietario_nombre, u.apellido AS propietario_apellido, u.correo
                         FROM Emprendimientos e
                         INNER JOIN Usuarios u ON e.id_usuario = u.id_usuario
                         WHERE e.estado_verificacion = 'pendiente'
                         ORDER BY e.fecha_registro ASC
                         LIMIT 10"""
    solicitudes_raw = repo.execute_sp(sql_solicitudes)

    solicitudes_recientes = [
        SolicitudReciente(
            id_emprendimiento=s.get("id_emprendimiento"),
            nombre=s.get("nombre", ""),
            categoria="",
            propietario=f"{s.get('propietario_nombre', '')} {s.get('propietario_apellido', '')}".strip(),
            fecha_registro=s.get("fecha_registro") or datetime.now(timezone.utc),
        )
        for s in solicitudes_raw[:5]
    ]

    crecimiento_mensual = [
        CrecimientoMensual(mes=MESES[datetime.now(timezone.utc).month - 1], negocios=total_negocios),
    ]

    nuevos_usuarios_mes = int(meta.get("total_usuarios", 0))
    crecimiento_porcentaje = 0

    return StatsResponse(
        total_negocios=total_negocios,
        pendientes=pendientes,
        nuevos_usuarios_mes=nuevos_usuarios_mes,
        crecimiento_porcentaje=crecimiento_porcentaje,
        solicitudes_recientes=solicitudes_recientes,
        crecimiento_mensual=crecimiento_mensual,
    )


@router.get("/dashboard/metrics", response_model=DashboardMetricsResponse)
def obtener_metricas_dashboard(
    current_user=Depends(require_role("administrador")),
    conn=Depends(get_db_conn),
):
    repo = BaseRepository(conn)
    sql = """SELECT
        (SELECT COUNT(*) FROM Usuarios) AS total_usuarios,
        (SELECT COUNT(*) FROM Usuarios WHERE rol = 'emprendedor') AS total_emprendedores,
        (SELECT COUNT(*) FROM Usuarios WHERE rol = 'cliente') AS total_clientes,
        (SELECT COUNT(*) FROM Emprendimientos WHERE estado_verificacion = 'aprobado') AS emprendimientos_aprobados,
        (SELECT COUNT(*) FROM Emprendimientos WHERE estado_verificacion = 'pendiente') AS emprendimientos_pendientes,
        (SELECT COUNT(*) FROM Productos WHERE activo = TRUE) AS total_productos_activos"""
    stats = repo.execute_sp(sql)
    meta = stats[0] if stats else {}

    return DashboardMetricsResponse(
        total_usuarios=int(meta.get("total_usuarios", 0)),
        total_emprendedores=int(meta.get("total_emprendedores", 0)),
        total_clientes=int(meta.get("total_clientes", 0)),
        usuarios_activos_mes=int(meta.get("total_usuarios", 0)),
        total_negocios_aprobados=int(meta.get("emprendimientos_aprobados", 0)),
        total_negocios_pendientes=int(meta.get("emprendimientos_pendientes", 0)),
        total_productos=int(meta.get("total_productos_activos", 0)),
        total_ventas=0,
        ingresos_totales=0.0,
        ventas_entregadas=0,
        ventas_pendientes=0,
        ventas_canceladas=0,
        ventas_por_mes=[],
        productos_mas_vendidos=[],
    )


@router.get("/top-products", response_model=list[TopProductoRating])
def obtener_top_productos(
    current_user=Depends(require_role("administrador")),
    conn=Depends(get_db_conn),
):
    repo = BaseRepository(conn)
    sql = """SELECT p.id_producto, p.nombre, p.precio, p.imagen_url,
                    e.nombre AS negocio, e.imagen_portada_url,
                    COALESCE(AVG(v.puntuacion::float), 0) AS puntuacion,
                    COUNT(v.id_valoracion) AS total_votos
             FROM Productos p
             INNER JOIN Emprendimientos e ON e.id_emprendimiento = p.id_emprendimiento
             LEFT JOIN Valoraciones v ON v.id_emprendimiento = e.id_emprendimiento
             WHERE p.activo = TRUE AND e.estado_verificacion = 'aprobado'
             GROUP BY p.id_producto, p.nombre, p.precio, p.imagen_url, e.nombre, e.imagen_portada_url
             ORDER BY puntuacion DESC, total_votos DESC
             LIMIT 5"""
    rows = repo.execute_sp(sql)
    return [
        TopProductoRating(
            id_producto=r["id_producto"],
            nombre=r["nombre"],
            precio=float(r.get("precio", 0)),
            imagen_url=r.get("imagen_url"),
            negocio=r["negocio"],
            imagen_portada_url=r.get("imagen_portada_url"),
            puntuacion=round(float(r.get("puntuacion", 0)), 1),
            total_votos=int(r.get("total_votos", 0)),
        )
        for r in rows
    ]


@router.get("/notifications", response_model=list[NotificacionItem])
def obtener_notificaciones(
    current_user=Depends(require_role("administrador")),
    conn=Depends(get_db_conn),
):
    repo = BaseRepository(conn)
    sql = """SELECT 'pendiente' AS tipo, e.id_emprendimiento AS id_ref,
                    e.nombre AS titulo,
                    CONCAT(u.nombre, ' ', u.apellido) AS descripcion,
                    e.fecha_registro AS fecha
             FROM Emprendimientos e
             INNER JOIN Usuarios u ON e.id_usuario = u.id_usuario
             WHERE e.estado_verificacion = 'pendiente'
             UNION ALL
             SELECT 'nuevo_usuario' AS tipo, u.id_usuario AS id_ref,
                    CONCAT(u.nombre, ' ', u.apellido) AS titulo,
                    'Nuevo usuario registrado' AS descripcion,
                    u.fecha_registro AS fecha
             FROM Usuarios u
             WHERE u.fecha_registro::date = CURRENT_DATE
             UNION ALL
             SELECT 'promocion_vencida' AS tipo, p.id_promocion AS id_ref,
                    p.titulo AS titulo, e.nombre AS descripcion,
                    p.fecha_fin AS fecha
             FROM Promociones p
             INNER JOIN Emprendimientos e ON p.id_emprendimiento = e.id_emprendimiento
             WHERE p.fecha_fin < NOW() AND p.estado = 'activa'
             ORDER BY fecha DESC"""
    rows = repo.execute_sp(sql)
    return [
        NotificacionItem(
            tipo=r["tipo"],
            id_ref=r["id_ref"],
            titulo=r["titulo"],
            descripcion=r["descripcion"],
            fecha=r["fecha"],
        )
        for r in rows
    ]


@router.get("/businesses", response_model=BusinessListResponse)
def listar_emprendimientos(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=10000),
    estado: Optional[str] = None,
    categoria: Optional[int] = None,
    busqueda: Optional[str] = None,
    current_user=Depends(require_role("administrador")),
    conn=Depends(get_db_conn),
):
    repo = BusinessRepository(conn)
    result = repo.get_all_admin(page=page, size=size, busqueda=busqueda, estado=estado, id_categoria=categoria)
    items = [
        BusinessAdminItem(
            id_emprendimiento=r["id_emprendimiento"],
            nombre=r["nombre"],
            categoria=r.get("nombre_categoria") or "",
            propietario=PropietarioInfo(
                nombre=r.get("propietario_nombre") or "",
                apellido=r.get("propietario_apellido") or "",
                correo=r.get("propietario_correo") or "",
            ),
            distrito=r.get("distrito"),
            fecha_registro=r["fecha_registro"],
            estado_verificacion=r["estado_verificacion"],
        )
        for r in result["items"]
    ]
    return BusinessListResponse(
        items=items, total=result["total"],
        page=result["page"], size=result["size"], pages=result["pages"],
    )


@router.put("/businesses/{id_emprendimiento}/approve", response_model=MessageResponse)
def aprobar_emprendimiento(
    id_emprendimiento: int,
    current_user=Depends(require_role("administrador")),
    conn=Depends(get_db_conn),
):
    repo = BusinessRepository(conn)
    result = repo.update_status(id_emprendimiento, "aprobado")
    if not result:
        raise HTTPException(404, "Emprendimiento no encontrado")
    conn.commit()
    return MessageResponse(message="Emprendimiento aprobado exitosamente")


@router.put("/businesses/{id_emprendimiento}/reject", response_model=MessageResponse)
def rechazar_emprendimiento(
    id_emprendimiento: int,
    data: RejectSchema,
    current_user=Depends(require_role("administrador")),
    conn=Depends(get_db_conn),
):
    if not data.motivo or len(data.motivo.strip()) < 20:
        raise HTTPException(400, "El motivo del rechazo debe tener al menos 20 caracteres")
    repo = BusinessRepository(conn)
    result = repo.update_status(id_emprendimiento, "rechazado", data.motivo.strip())
    if not result:
        raise HTTPException(404, "Emprendimiento no encontrado")
    conn.commit()
    return MessageResponse(message="Emprendimiento rechazado")


@router.put("/businesses/{id_emprendimiento}", response_model=MessageResponse)
def admin_actualizar_emprendimiento(
    id_emprendimiento: int,
    data: BusinessAdminUpdate,
    current_user=Depends(require_role("administrador")),
    conn=Depends(get_db_conn),
):
    repo = BusinessRepository(conn)
    update_data = data.model_dump(exclude_none=True)
    estado = update_data.pop("estado_verificacion", None)

    if estado:
        result = repo.update_status(id_emprendimiento, estado)
        if not result:
            raise HTTPException(404, "Emprendimiento no encontrado")

    if update_data:
        biz = repo.execute_sp_single(
            "SELECT id_usuario FROM Emprendimientos WHERE id_emprendimiento = %(id)s",
            {"id": id_emprendimiento},
        )
        if biz:
            id_usuario = biz.get("id_usuario") or 0
            repo.update(id_emprendimiento, id_usuario, update_data)

    conn.commit()
    return MessageResponse(message="Emprendimiento actualizado correctamente")


@router.delete("/businesses/{id_emprendimiento}", response_model=MessageResponse)
def admin_eliminar_emprendimiento(
    id_emprendimiento: int,
    current_user=Depends(require_role("administrador")),
    conn=Depends(get_db_conn),
):
    repo = BusinessRepository(conn)
    result = repo.update_status(id_emprendimiento, "rechazado", "Eliminado por administrador")
    if not result:
        raise HTTPException(404, "Emprendimiento no encontrado")
    conn.commit()
    return MessageResponse(message="Emprendimiento eliminado correctamente")


@router.get("/users", response_model=UserListResponse)
def listar_usuarios(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=10000),
    rol: Optional[str] = None,
    estado: Optional[str] = None,
    busqueda: Optional[str] = None,
    current_user=Depends(require_role("administrador")),
    conn=Depends(get_db_conn),
):
    user_repo = UserRepository(conn)
    rows = user_repo.get_all(page=page, size=size, busqueda=busqueda, rol=rol, estado=estado)

    if not rows:
        return UserListResponse(items=[], total=0, page=page, size=size, pages=0)

    meta = rows[0]
    items = []
    for r in rows:
        biz_repo = BusinessRepository(conn)
        negocio = biz_repo.get_by_user(r["id_usuario"])
        items.append(UserAdminItem(
            id_usuario=r["id_usuario"],
            nombre=r["nombre"],
            apellido=r["apellido"],
            correo=r["correo"],
            rol=r["rol"],
            estado=r["estado"],
            fecha_registro=r["fecha_registro"],
            avatar_url=r.get("avatar_url"),
            tiene_negocio=negocio is not None,
            nombre_negocio=negocio.get("nombre") if negocio else None,
        ))

    return UserListResponse(
        items=items, total=meta.get("total", 0),
        page=meta.get("page", page), size=meta.get("size", size),
        pages=meta.get("pages", 0),
    )


@router.put("/users/{id_usuario}/suspend", response_model=MessageResponse)
def suspender_usuario(
    id_usuario: int,
    current_user=Depends(require_role("administrador")),
    conn=Depends(get_db_conn),
):
    if current_user["id_usuario"] == id_usuario:
        raise HTTPException(400, "No puedes suspenderte a ti mismo")

    user_repo = UserRepository(conn)
    user = user_repo.get_by_id(id_usuario)
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
    if user.get("estado") == "suspendido":
        raise HTTPException(400, "El usuario ya está suspendido")

    user_repo.update_status(id_usuario, "suspendido")
    conn.commit()
    return MessageResponse(message="Usuario suspendido correctamente")


@router.put("/users/{id_usuario}/activate", response_model=MessageResponse)
def activar_usuario(
    id_usuario: int,
    current_user=Depends(require_role("administrador")),
    conn=Depends(get_db_conn),
):
    user_repo = UserRepository(conn)
    user = user_repo.get_by_id(id_usuario)
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
    if user.get("estado") == "activo":
        raise HTTPException(400, "El usuario ya está activo")

    user_repo.update_status(id_usuario, "activo")
    conn.commit()
    return MessageResponse(message="Usuario activado correctamente")


@router.delete("/reviews/{id_comentario}", response_model=MessageResponse)
def eliminar_resena(
    id_comentario: int,
    current_user=Depends(require_role("administrador")),
    conn=Depends(get_db_conn),
):
    conn.commit()
    return MessageResponse(message="Reseña eliminada por el administrador")


@router.post("/users", status_code=201, response_model=MessageResponse)
def crear_usuario(
    data: CreateUserSchema,
    current_user=Depends(require_role("administrador")),
    conn=Depends(get_db_conn),
):
    user_repo = UserRepository(conn)
    existe = user_repo.get_by_email(data.correo)
    if existe:
        raise HTTPException(400, "Este correo ya tiene una cuenta registrada")

    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    user_repo.create({
        "nombre": data.nombre.strip(),
        "apellido": data.apellido.strip(),
        "correo": data.correo,
        "contrasena_hash": pwd_context.hash(data.contrasena),
        "rol": data.rol,
    })
    conn.commit()
    return MessageResponse(message=f"Usuario {data.rol} creado exitosamente")


@router.put("/users/{id_usuario}", response_model=MessageResponse)
def admin_actualizar_usuario(
    id_usuario: int,
    data: UpdateUserSchema,
    current_user=Depends(require_role("administrador")),
    conn=Depends(get_db_conn),
):
    user_repo = UserRepository(conn)
    user = user_repo.get_by_id(id_usuario)
    if not user:
        raise HTTPException(404, "Usuario no encontrado")

    cursor = conn.cursor()
    if data.nombre is not None:
        cursor.execute("UPDATE Usuarios SET nombre = %s WHERE id_usuario = %s", (data.nombre.strip(), id_usuario))
    if data.apellido is not None:
        cursor.execute("UPDATE Usuarios SET apellido = %s WHERE id_usuario = %s", (data.apellido.strip(), id_usuario))
    cursor.close()
    if data.correo is not None:
        existe = user_repo.get_by_email(data.correo)
        if existe and existe.get("id_usuario") != id_usuario:
            raise HTTPException(400, "Este correo ya está en uso")
        cursor = conn.cursor()
        cursor.execute("UPDATE Usuarios SET correo = %s WHERE id_usuario = %s", (data.correo, id_usuario))
        cursor.close()
    if data.rol is not None:
        if data.rol not in ("visitante", "emprendedor", "administrador", "cliente"):
            raise HTTPException(400, "Rol no válido")
        cursor = conn.cursor()
        cursor.execute("UPDATE Usuarios SET rol = %s WHERE id_usuario = %s", (data.rol, id_usuario))
        cursor.close()
    if data.estado is not None:
        if data.estado not in ("activo", "inactivo", "suspendido"):
            raise HTTPException(400, "Estado no válido")
        user_repo.update_status(id_usuario, data.estado)

    conn.commit()
    return MessageResponse(message="Usuario actualizado correctamente")


@router.delete("/users/{id_usuario}", response_model=MessageResponse)
def admin_eliminar_usuario(
    id_usuario: int,
    current_user=Depends(require_role("administrador")),
    conn=Depends(get_db_conn),
):
    if current_user["id_usuario"] == id_usuario:
        raise HTTPException(400, "No puedes eliminarte a ti mismo")

    user_repo = UserRepository(conn)
    user = user_repo.get_by_id(id_usuario)
    if not user:
        raise HTTPException(404, "Usuario no encontrado")

    user_repo.update_status(id_usuario, "inactivo")
    conn.commit()
    return MessageResponse(message="Usuario desactivado correctamente")
