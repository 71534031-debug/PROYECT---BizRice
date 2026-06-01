# BizRise — Diseño completo de la API REST

## Base URL
- Desarrollo: `http://localhost:8000/api/v1`
- Producción: `https://api.bizrise.pe/api/v1`

## Autenticación
Todos los endpoints protegidos requieren:
```
Header: Authorization: Bearer <access_token>
```

## Formato de errores estándar
```json
{ "detail": "Mensaje de error legible para el usuario" }
```

## Códigos HTTP usados
| Código | Significado |
|---|---|
| 200 | OK — operación exitosa |
| 201 | Created — recurso creado |
| 400 | Bad Request — datos inválidos o regla de negocio |
| 401 | Unauthorized — sin token o token inválido |
| 403 | Forbidden — sin permisos para esa acción |
| 404 | Not Found — recurso no encontrado |
| 422 | Unprocessable Entity — validación de Pydantic fallida |
| 500 | Internal Server Error — error del servidor |

---

## MÓDULO: Autenticación

### POST /auth/register
```json
// Request Body
{
  "nombre": "Jorge",
  "apellido": "Anccasi",
  "correo": "jorge@email.com",
  "contrasena": "MiPass123",
  "confirmar_contrasena": "MiPass123"
}

// Response 201
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id_usuario": 5,
    "nombre": "Jorge",
    "apellido": "Anccasi",
    "correo": "jorge@email.com",
    "rol": "emprendedor"
  }
}
```

### POST /auth/login
```json
// Request Body
{ "correo": "jorge@email.com", "contrasena": "MiPass123" }

// Response 200
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id_usuario": 5,
    "nombre": "Jorge",
    "apellido": "Anccasi",
    "correo": "jorge@email.com",
    "rol": "emprendedor",
    "avatar_url": null
  }
}
```

### POST /auth/refresh
```json
// Request Body
{ "refresh_token": "eyJ..." }

// Response 200
{ "access_token": "eyJ...", "token_type": "bearer" }
```

### GET /auth/me
```json
// Response 200
{
  "id_usuario": 5,
  "nombre": "Jorge",
  "apellido": "Anccasi",
  "correo": "jorge@email.com",
  "rol": "emprendedor",
  "estado": "activo",
  "avatar_url": null,
  "fecha_registro": "2026-01-15T10:30:00"
}
```

---

## MÓDULO: Público — Directorio

### GET /categories
```json
// Response 200
{
  "items": [
    {
      "id_categoria": 1,
      "nombre": "Gastronomía",
      "descripcion": "Restaurantes, cafeterías y comida típica",
      "icono_url": null,
      "total_negocios": 42
    },
    { "id_categoria": 2, "nombre": "Textilería y Moda", "total_negocios": 18 },
    { "id_categoria": 3, "nombre": "Artesanía", "total_negocios": 25 },
    { "id_categoria": 4, "nombre": "Servicios Profesionales", "total_negocios": 31 },
    { "id_categoria": 5, "nombre": "Turismo", "total_negocios": 12 },
    { "id_categoria": 6, "nombre": "Tecnología", "total_negocios": 8 }
  ]
}
```

### GET /businesses
```
Query params:
  page=1          (default: 1)
  size=12         (default: 12, max: 50)
  busqueda=cafe   (busca en nombre y descripcion)
  categoria=1     (id_categoria)
  distrito=Huancayo
  orden=valoracion (valoracion|reciente|nombre)
```
```json
// Response 200
{
  "items": [
    {
      "id_emprendimiento": 3,
      "nombre": "Café del Valle",
      "descripcion": "Especialidad en granos de altura...",
      "categoria": "Gastronomía",
      "id_categoria": 1,
      "distrito": "El Tambo",
      "imagen_portada_url": "/uploads/negocios/cafe-valle.jpg",
      "estado_verificacion": "aprobado",
      "puntuacion_promedio": 4.5,
      "total_valoraciones": 23,
      "horario_apertura": "08:00:00",
      "horario_cierre": "20:00:00",
      "esta_abierto": true
    }
  ],
  "total": 136,
  "page": 1,
  "size": 12,
  "pages": 12
}
```

### GET /businesses/{id}
```json
// Response 200
{
  "id_emprendimiento": 3,
  "nombre": "Café Central Huancayo",
  "descripcion": "Espresso de café de altura...",
  "telefono": "+51 964 123 456",
  "direccion": "Calle Real 450",
  "distrito": "Huancayo",
  "horario_apertura": "08:00:00",
  "horario_cierre": "21:00:00",
  "esta_abierto": true,
  "imagen_portada_url": "/uploads/negocios/cafe-central.jpg",
  "estado_verificacion": "aprobado",
  "fecha_registro": "2024-01-15T...",
  "categoria": { "id_categoria": 1, "nombre": "Gastronomía" },
  "propietario": { "nombre": "Marco", "apellido": "Solís" },
  "puntuacion_promedio": 4.8,
  "total_valoraciones": 116,
  "redes_sociales": [
    { "plataforma": "facebook", "url": "https://facebook.com/cafecentralhuancayo" },
    { "plataforma": "instagram", "url": "https://instagram.com/cafecentralhyo" },
    { "plataforma": "whatsapp", "url": "https://wa.me/51964123456" }
  ],
  "promociones_activas": [
    {
      "id_promocion": 1,
      "titulo": "2x1 en Americanos",
      "descripcion": "Todos los martes y jueves hasta las 11am",
      "fecha_fin": "2024-12-31",
      "estado": "activa"
    }
  ]
}

// Response 404
{ "detail": "Emprendimiento no encontrado" }
```

### GET /businesses/{id}/products
```json
// Response 200
{
  "items": [
    {
      "id_producto": 1,
      "nombre": "Latte de la Casa",
      "descripcion": "Espresso doble con leche cremosa de altura",
      "precio": 12.00,
      "imagen_url": "/uploads/productos/latte.jpg",
      "estado_stock": "disponible"
    },
    {
      "id_producto": 2,
      "nombre": "Tostado Especial",
      "precio": 16.50,
      "imagen_url": null,
      "estado_stock": "bajo_stock"
    }
  ],
  "total": 8, "page": 1, "size": 9, "pages": 1
}
```

### GET /businesses/{id}/reviews
```json
// Response 200
{
  "items": [
    {
      "id_comentario": 12,
      "usuario": {
        "nombre": "Ricardo",
        "apellido": "Mendoza",
        "avatar_url": null
      },
      "contenido": "El mejor café de Huancayo para trabajar. El WiFi es rápido...",
      "puntuacion": 5,
      "util_count": 12,
      "fecha": "2024-10-27T10:30:00"
    }
  ],
  "total": 116,
  "page": 1,
  "size": 5,
  "pages": 24,
  "puntuacion_promedio": 4.8,
  "distribucion_estrellas": {
    "5": 80, "4": 20, "3": 10, "2": 4, "1": 2
  }
}
```

### POST /businesses/{id}/reviews
```json
// Request (Authorization requerido)
{ "contenido": "Excelente servicio y ambiente.", "puntuacion": 5 }

// Response 201
{ "message": "Reseña publicada exitosamente" }

// Response 400 (ya valoró)
{ "detail": "Ya dejaste una reseña en este emprendimiento" }
```

---

## MÓDULO: Emprendedor (Authorization requerido, rol: emprendedor)

### GET /entrepreneur/business
```json
// Response 200 — datos completos del negocio del usuario autenticado
{ ...mismo formato que GET /businesses/{id} pero incluye datos privados... }

// Response 404 — si el emprendedor aún no tiene negocio registrado
{ "detail": "No tienes un negocio registrado aún" }
```

### POST /entrepreneur/business
```json
// Request Body (primera vez que registra negocio)
{
  "nombre": "Mi Cafetería",
  "id_categoria": 1,
  "descripcion": "Descripción del negocio",
  "telefono": "+51 964 000 000",
  "direccion": "Jr. Ayacucho 123",
  "distrito": "Huancayo"
}
// Response 201: negocio creado con estado_verificacion = "pendiente"
```

### PUT /entrepreneur/business
```json
// Request Body
{ "nombre": "...", "id_categoria": 1, "descripcion": "...", "telefono": "...", "direccion": "...", "distrito": "..." }
// Response 200
{ "message": "Negocio actualizado correctamente" }
```

### PUT /entrepreneur/business/schedule
```json
// Request Body
{
  "horarios": [
    { "dia": "lunes",    "abierto": true,  "apertura": "08:00", "cierre": "20:00" },
    { "dia": "martes",   "abierto": true,  "apertura": "08:00", "cierre": "20:00" },
    { "dia": "miercoles","abierto": true,  "apertura": "08:00", "cierre": "20:00" },
    { "dia": "jueves",   "abierto": true,  "apertura": "08:00", "cierre": "20:00" },
    { "dia": "viernes",  "abierto": true,  "apertura": "08:00", "cierre": "20:00" },
    { "dia": "sabado",   "abierto": true,  "apertura": "09:00", "cierre": "18:00" },
    { "dia": "domingo",  "abierto": false }
  ]
}
// Response 200: { "message": "Horarios actualizados" }
```

### POST /entrepreneur/business/image
```
// multipart/form-data: campo "imagen" (File JPG/PNG/WebP, max 2MB)
// Response 200: { "imagen_url": "/uploads/negocios/cafe-abc123.jpg" }
```

### GET /entrepreneur/products
```
Query: ?page=1&size=20&busqueda=latte
Response: { items, total, page, size, pages }
```

### POST /entrepreneur/products
```
// multipart/form-data:
//   nombre (str, required)
//   descripcion (str, optional)
//   precio (float, required)
//   estado_stock (str, required)
//   imagen (File, optional)
// Response 201: { producto creado }
```

### PUT /entrepreneur/products/{id}
```
// multipart/form-data (mismos campos que POST, todos opcionales)
// Response 200: { producto actualizado }
```

### DELETE /entrepreneur/products/{id}
```
// Response 200: { "message": "Producto eliminado" }
// Response 403: { "detail": "No tienes permiso para eliminar este producto" }
```

### GET/POST/PUT/DELETE /entrepreneur/promotions
```json
// POST Body:
{
  "titulo": "2x1 en Americanos",
  "descripcion": "Válido martes y jueves hasta las 11am",
  "fecha_inicio": "2024-10-01",
  "fecha_fin": "2024-12-31",
  "estado": "activa"
}
```

### GET /entrepreneur/stats
```json
// Response 200
{
  "visitas_totales": 1482,
  "visitas_incremento": 12,
  "clics_perfil": 324,
  "clics_incremento": 5,
  "productos_activos": 48,
  "estado_negocio": "aprobado",
  "actividad_reciente": [
    { "tipo": "resena", "mensaje": "Nueva reseña de Ricardo M.", "fecha": "..." },
    { "tipo": "verificacion", "mensaje": "Perfil verificado", "fecha": "..." }
  ]
}
```

### PUT /entrepreneur/settings/password
```json
// Body: { "contrasena_actual": "...", "nueva_contrasena": "...", "confirmar_contrasena": "..." }
// Response 200: { "message": "Contraseña actualizada exitosamente" }
// Response 400: { "detail": "La contraseña actual es incorrecta" }
```

---

## MÓDULO: Administrador (Authorization requerido, rol: administrador)

### GET /admin/stats
```json
// Response 200
{
  "total_negocios": 1284,
  "pendientes": 24,
  "nuevos_usuarios_mes": 342,
  "crecimiento_porcentaje": 12,
  "solicitudes_recientes": [...],
  "crecimiento_mensual": [
    { "mes": "May", "negocios": 45 },
    { "mes": "Jun", "negocios": 52 }
  ]
}
```

### GET /admin/businesses
```
Query: ?page=1&size=10&estado=pendiente&categoria=1&busqueda=cafe
Response: { items, total, page, size, pages }
```

### PUT /admin/businesses/{id}/approve
```json
// Response 200: { "message": "Emprendimiento aprobado exitosamente" }
```

### PUT /admin/businesses/{id}/reject
```json
// Body: { "motivo": "La información proporcionada está incompleta..." }
// Response 200: { "message": "Emprendimiento rechazado" }
```

### GET /admin/users
```
Query: ?page=1&size=10&rol=emprendedor&estado=activo&busqueda=jorge
Response: { items, total, page, size, pages }
```

### PUT /admin/users/{id}/suspend
```json
// Response 200: { "message": "Usuario suspendido correctamente" }
// Response 400: { "detail": "No puedes suspenderte a ti mismo" }
```

### PUT /admin/users/{id}/activate
```json
// Response 200: { "message": "Usuario activado correctamente" }
```
