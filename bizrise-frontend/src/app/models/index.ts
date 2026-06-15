export interface Usuario {
  id_usuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  rol: string;
  estado: string;
  avatar_url: string | null;
  fecha_registro?: string;
}

export interface UsuarioDetalle extends Usuario {
  tiene_negocio?: boolean;
  nombre_negocio?: string | null;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: Usuario;
}

export interface RefreshResponse {
  access_token: string;
  token_type: string;
}

export interface Categoria {
  id_categoria: number;
  nombre: string;
  descripcion: string | null;
  icono_url: string | null;
  total_negocios: number;
}

export interface BusinessListItem {
  id_emprendimiento: number;
  nombre: string;
  descripcion: string | null;
  categoria: string;
  id_categoria: number;
  distrito: string | null;
  imagen_portada_url: string | null;
  estado_verificacion: string;
  puntuacion_promedio: number;
  total_valoraciones: number;
  horario_apertura: string | null;
  horario_cierre: string | null;
  esta_abierto: boolean;
}

export interface RedSocial {
  id_red?: number;
  plataforma: string;
  url: string;
}

export interface Promocion {
  id_promocion: number;
  titulo: string;
  descripcion: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  estado: string;
}

export interface BusinessDetail {
  id_emprendimiento: number;
  nombre: string;
  descripcion: string | null;
  telefono: string | null;
  direccion: string | null;
  distrito: string | null;
  horario_apertura: string | null;
  horario_cierre: string | null;
  esta_abierto: boolean;
  imagen_portada_url: string | null;
  estado_verificacion: string;
  fecha_registro: string | null;
  categoria: { id_categoria: number; nombre: string };
  propietario: { nombre: string; apellido: string };
  puntuacion_promedio: number;
  total_valoraciones: number;
  redes_sociales: RedSocial[];
  promociones_activas: Promocion[];
}

export interface Producto {
  id_producto: number;
  nombre: string;
  descripcion: string | null;
  precio: number | null;
  imagen_url: string | null;
  estado_stock: string;
  activo?: boolean;
  fecha_creacion?: string | null;
  negocio?: { id_emprendimiento: number; nombre: string; distrito: string | null };
}

export interface Review {
  id_comentario: number;
  usuario: { nombre: string; apellido: string; avatar_url: string | null };
  contenido: string;
  puntuacion: number;
  util_count: number;
  fecha: string;
}

export interface BusinessReviewData {
  items: Review[];
  total: number;
  page: number;
  size: number;
  pages: number;
  puntuacion_promedio: number;
  distribucion_estrellas: Record<number, number>;
}

export interface NegocioPropio {
  id_emprendimiento: number;
  nombre: string;
  descripcion: string | null;
  telefono: string | null;
  direccion: string | null;
  distrito: string | null;
  horario_apertura: string | null;
  horario_cierre: string | null;
  imagen_portada_url: string | null;
  estado_verificacion: string;
  fecha_registro: string | null;
  categoria: { id_categoria: number; nombre: string };
  puntuacion_promedio: number;
  total_valoraciones: number;
  redes_sociales: RedSocial[];
}

export interface EntrepreneurStats {
  visitas_totales: number;
  visitas_incremento: number;
  clics_perfil: number;
  clics_incremento: number;
  productos_activos: number;
  estado_negocio: string | null;
  actividad_reciente: { tipo: string; mensaje: string; fecha: string }[];
}

export interface AdminStats {
  total_negocios: number;
  pendientes: number;
  nuevos_usuarios_mes: number;
  crecimiento_porcentaje: number;
  solicitudes_recientes: {
    id_emprendimiento: number;
    nombre: string;
    categoria: string;
    propietario: string;
    fecha_registro: string;
  }[];
  crecimiento_mensual: { mes: string; negocios: number }[];
}

export interface AdminUserList {
  items: UsuarioDetalle[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface AdminBusinessList {
  items: {
    id_emprendimiento: number;
    nombre: string;
    categoria: string;
    propietario: { nombre: string; apellido: string; correo: string };
    distrito: string | null;
    fecha_registro: string;
    estado_verificacion: string;
    motivo_rechazo?: string | null;
  }[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface Venta {
  id_venta: number;
  id_usuario: number;
  id_emprendimiento: number;
  negocio_nombre: string;
  total: number;
  estado: string;
  fecha_creacion: string;
  detalles: any[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface MessageResponse {
  message: string;
}
