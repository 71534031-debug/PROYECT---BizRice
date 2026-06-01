# SPEC-005 — Panel del Administrador

## Descripción
Panel privado para el administrador del sistema. Permite supervisar la plataforma,
aprobar o rechazar registros de emprendimientos y gestionar todos los usuarios.

## Ruta base
`/admin/*` — Protegida por `role.guard.ts` (rol: administrador)

## Usuarios involucrados
- Administrador (único rol con acceso)

---

## Estructura de navegación

```
/admin/dashboard    → Resumen y métricas globales
/admin/requests     → Gestión de solicitudes de nuevos negocios
/admin/users        → Directorio y gestión de usuarios
```

### Layout del panel admin (Bootstrap Sidebar — color diferente al emprendedor)
```html
<nav class="sidebar bg-dark" style="width: 260px; min-height: 100vh">
  <div class="p-3 border-bottom border-secondary">
    <span class="fw-bold text-primary fs-5">BizRise</span>
    <small class="d-block text-light opacity-75">Portal Administrador</small>
  </div>
  <ul class="nav flex-column p-2">
    <li><a routerLink="/admin/dashboard" class="nav-link text-light">
      <i class="bi bi-grid"></i> Resumen
    </a></li>
    <li><a routerLink="/admin/requests" class="nav-link text-light">
      <i class="bi bi-clipboard-check"></i> Solicitudes
      <span class="badge bg-warning ms-auto">24</span>
    </a></li>
    <li><a routerLink="/admin/users" class="nav-link text-light">
      <i class="bi bi-people"></i> Usuarios
    </a></li>
  </ul>
  <div class="p-3 border-top border-secondary mt-auto">
    <button class="btn btn-outline-light btn-sm w-100" (click)="logout()">
      <i class="bi bi-box-arrow-right"></i> Cerrar Sesión
    </button>
  </div>
</nav>
```

---

## CU-001: Dashboard Administrador

**Ruta:** `/admin/dashboard`

**Métricas globales (Bootstrap Cards en Row):**
```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  TOTAL NEGOCIOS  │  │   PENDIENTES     │  │  NUEVOS USUARIOS │
│      1,284       │  │       24         │  │       342        │
│  (aprobados)     │  │  ⚠ Prioridad    │  │  +12% este mes   │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

**Tabla "Solicitudes Pendientes" (últimas 5):**
```
Bootstrap Table striped hover responsive:
| NEGOCIO              | CATEGORÍA    | FECHA        | ACCIONES     |
|----------------------|--------------|--------------|--------------|
| Cafetería El Mantaro | Gastronomía  | Oct 12, 2024 | ✓ ✗          |
| Textiles Wanka       | Artesanía    | Oct 11, 2024 | ✓ ✗          |
```
- Botón ✓ = `btn-success btn-sm` (aprobar directamente desde dashboard)
- Botón ✗ = `btn-danger btn-sm` (rechazar con modal de confirmación)
- Link "Ver todas" → `/admin/requests`

**Gráfico Crecimiento Mensual:**
- Gráfico de barras simple con CSS Bootstrap (no librería externa)
- Mostrar últimos 6 meses con barras proporcionales
- Si se requiere gráfico real, usar Chart.js (importar via CDN)

**Endpoints API:**
```
GET /api/v1/admin/stats
  Response 200:
  {
    "total_negocios": 1284,
    "pendientes": 24,
    "nuevos_usuarios_mes": 342,
    "crecimiento_porcentaje": 12,
    "solicitudes_recientes": [
      {
        "id_emprendimiento": 45,
        "nombre": "Cafetería El Mantaro",
        "categoria": "Gastronomía",
        "propietario": "Marco Antonio Solís",
        "fecha_registro": "2024-10-12T..."
      }
    ],
    "crecimiento_mensual": [
      { "mes": "May", "negocios": 45 },
      { "mes": "Jun", "negocios": 52 },
      { "mes": "Jul", "negocios": 48 },
      { "mes": "Ago", "negocios": 67 },
      { "mes": "Sep", "negocios": 71 },
      { "mes": "Oct", "negocios": 80 }
    ]
  }
```

---

## CU-002: Gestión de Solicitudes

**Ruta:** `/admin/requests`

**Header con contadores Bootstrap:**
```
Row de 3 Cards pequeñas:
├── Total Recibidas: 1,284 (badge +12%)
├── Pendientes: 42 (badge text-warning "Prioridad")
└── Aprobadas: 1,156 (badge text-success "Histórico")
```

**Filtros Bootstrap:**
```
Row con:
├── Input search "Buscar solicitudes, negocios o propietarios..."
├── Select "Todas las categorías"
├── Select "Todos los estados" (pendiente/aprobado/rechazado)
├── Botón "Filtros" btn-outline-secondary
└── Botón "Exportar Reporte" btn-outline-primary (genera CSV)
```

**Tabla principal Bootstrap (table-hover, table-responsive):**
```
| # | NEGOCIO          | CATEGORÍA    | PROPIETARIO      | FECHA        | ESTADO     | ACCIONES          |
|---|------------------|--------------|------------------|--------------|------------|-------------------|
|   | 🍽 Café del Valle | Gastronomía  | Marco A. Solís   | 12 Oct 2024  | ● Pendiente| Aprobar | Rechazar |
|   | 👗 Textiles Mantaro | Textiles   | Elena Poma       | 11 Oct 2024  | ● Pendiente| Aprobar | Rechazar |
|   | 🏠 Ferretería El Sol| Ferretería  | Juan Huamán      | 11 Oct 2024  | ✓ Aprobado | Ver perfil        |
```

**Acciones por fila:**
- Estado `pendiente`: Botón `btn-success btn-sm` "Aprobar" + Botón `btn-danger btn-sm` "Rechazar"
- Estado `aprobado`: Solo botón `btn-outline-secondary btn-sm` "Ver perfil"
- Estado `rechazado`: Badge rojo + botón "Ver detalle"

**Modal de confirmación Aprobar:**
```
Modal Bootstrap:
├── Título: "Aprobar emprendimiento"
├── Cuerpo: "¿Confirmas la aprobación de [nombre negocio]?"
│           "El emprendedor recibirá acceso completo a la plataforma."
└── Footer: Cancelar btn-secondary | Aprobar btn-success
```

**Modal de confirmación Rechazar:**
```
Modal Bootstrap:
├── Título: "Rechazar emprendimiento"
├── Cuerpo: "¿Por qué rechazas este emprendimiento?"
│   └── Textarea: Motivo del rechazo (requerido, mínimo 20 chars)
└── Footer: Cancelar btn-secondary | Rechazar btn-danger
```

**Paginación Bootstrap** al final de la tabla.

**Endpoints API:**
```
GET /api/v1/admin/businesses
  Query: ?page=1&size=10&estado=pendiente&categoria=1&busqueda=cafe
  Response 200:
  {
    "items": [
      {
        "id_emprendimiento": 45,
        "nombre": "Café del Valle",
        "categoria": "Gastronomía",
        "propietario": { "nombre": "Marco", "apellido": "Solís", "correo": "marco@..." },
        "fecha_registro": "2024-10-12T...",
        "estado_verificacion": "pendiente"
      }
    ],
    "total": 42, "page": 1, "size": 10, "pages": 5
  }

PUT /api/v1/admin/businesses/{id}/approve
  Header: Authorization: Bearer <token_admin>
  Response 200: { "message": "Emprendimiento aprobado exitosamente" }

PUT /api/v1/admin/businesses/{id}/reject
  Body: { "motivo": "Información incompleta..." }
  Response 200: { "message": "Emprendimiento rechazado" }

GET /api/v1/admin/businesses/export
  Response: archivo CSV con todos los registros
```

---

## CU-003: Directorio de Usuarios

**Ruta:** `/admin/users`

**Header con contadores:**
```
Row de 3 Cards:
├── Total Usuarios: 1,284 (+12% este mes)
├── Emprendedores: 452 (35 pendientes de validación)
└── Clientes: 832 (Actividad alta hoy)
```

**Filtros y acciones:**
```
Row:
├── Input search "Buscar usuarios, correos o roles..."
├── Select "Todos los roles" (visitante/emprendedor/administrador)
├── Select "Todos los estados" (activo/inactivo/suspendido)
└── Botón "Nuevo Usuario" btn-primary (crear admin o usuario manual)
   └── Botón "Exportar" btn-outline-secondary
```

**Tabla Bootstrap:**
```
| USUARIO (avatar + nombre + email) | ROL          | REGISTRO     | ESTADO    | ACCIONES    |
|-----------------------------------|--------------|--------------|-----------|-------------|
| RA Ricardo Alanya / ralarya@...   | Emprendedor  | 12 Oct 2023  | ● Activo  | Editar Susp.|
| MC María Castro / m.castro@...    | Cliente      | 05 Nov 2023  | ● Activo  | Editar Susp.|
| JH Jorge Huaman / jorge.te@...    | Emprendedor  | 28 Dic 2023  | ○ Inactivo| Editar Activ|
```

**Acciones por fila:**
- Usuario activo: Botón `btn-outline-secondary btn-sm` "Editar" + Botón `btn-outline-danger btn-sm` "Suspender"
- Usuario suspendido: Botón "Editar" + Botón `btn-outline-success btn-sm` "Activar"

**Modal Suspender usuario:**
```
Modal Bootstrap:
├── "¿Suspender a [nombre usuario]?"
├── "El usuario no podrá acceder a la plataforma"
└── Botones: Cancelar | Suspender btn-danger
```

**Endpoints API:**
```
GET /api/v1/admin/users
  Query: ?page=1&size=10&rol=emprendedor&estado=activo&busqueda=marco
  Response 200:
  {
    "items": [
      {
        "id_usuario": 5,
        "nombre": "Ricardo",
        "apellido": "Alanya",
        "correo": "ralarya@pyme.pe",
        "rol": "emprendedor",
        "estado": "activo",
        "fecha_registro": "2023-10-12T...",
        "avatar_url": null,
        "tiene_negocio": true,
        "nombre_negocio": "Café del Valle"
      }
    ],
    "total": 1284, "page": 1, "size": 10, "pages": 129
  }

PUT /api/v1/admin/users/{id}/suspend
  Response 200: { "message": "Usuario suspendido" }

PUT /api/v1/admin/users/{id}/activate
  Response 200: { "message": "Usuario activado" }

POST /api/v1/admin/users
  Body: { nombre, apellido, correo, contrasena, rol }
  Response 201: { usuario creado }
```

---

## Reglas de negocio
- Solo usuarios con `rol = 'administrador'` pueden acceder a estas rutas
- Al aprobar un negocio, el estado cambia a `aprobado` en la BD
- Al rechazar, el estado cambia a `rechazado` y se guarda el motivo
- Al suspender un usuario, su sesión activa debe invalidarse
- El administrador no puede suspenderse a sí mismo
- Los cambios de estado deben quedar registrados con la fecha y el admin que los realizó

---

## Criterios de aceptación
- [ ] Solo el administrador puede acceder al panel (guard redirige a login)
- [ ] Las métricas del dashboard son reales y vienen del backend
- [ ] La tabla de solicitudes filtra y pagina correctamente
- [ ] Aprobar un negocio cambia su badge a "Aprobado" en tiempo real
- [ ] Rechazar un negocio requiere ingresar un motivo obligatorio
- [ ] La tabla de usuarios filtra por rol y estado correctamente
- [ ] Suspender un usuario cambia su estado visualmente en la tabla
- [ ] No se puede suspender al propio administrador logueado
- [ ] Bootstrap Toast confirma cada acción exitosa
