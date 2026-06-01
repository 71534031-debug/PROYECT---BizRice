# SPEC-003 — Perfil Público de Negocio

## Descripción
Vista pública y detallada de un emprendimiento. Accesible sin login.
Muestra toda la información del negocio, productos, reseñas y datos de contacto.

## Ruta
`/negocio/:id`

## Usuarios involucrados
- Visitante (puede ver todo, pero no puede comentar ni valorar)
- Usuario autenticado (puede comentar y valorar)

---

## Casos de uso

### CU-001: Ver perfil completo del negocio
**Flujo:**
1. Usuario hace clic en "Ver Perfil" desde el directorio
2. Sistema carga datos del emprendimiento por `id_emprendimiento`
3. Se muestra la página con todas las secciones
4. Si el negocio no existe o no está aprobado → redirigir a `/directorio` con Alert error

### CU-002: Ver productos del negocio
**Flujo:**
1. Sección "Nuestros Favoritos / Catálogo" carga productos del negocio
2. Se muestran en tarjetas Bootstrap con imagen, nombre y precio en Soles (S/)
3. Estado de stock visible: Badge verde (disponible), amarillo (bajo stock), rojo (agotado)

### CU-003: Ver y escribir reseñas
**Flujo visitante (sin login):**
1. Ve las reseñas existentes con nombre de usuario, estrellas y comentario
2. Si intenta escribir reseña → Bootstrap Toast: "Inicia sesión para dejar una reseña"
3. Botón "Escribir reseña" redirige a `/auth/login`

**Flujo usuario autenticado:**
1. Aparece formulario de reseña con selector de estrellas y textarea Bootstrap
2. Validación: mínimo 10 caracteres en el comentario
3. Si ya valoró → no puede volver a valorar (constraint BD), muestra su reseña anterior
4. Al enviar → actualiza la puntuación promedio en tiempo real

### CU-004: Contactar al negocio
**Flujo:**
1. Sección lateral con datos de contacto
2. Teléfono: enlace `tel:` con ícono Bootstrap Icons `bi-telephone`
3. WhatsApp: enlace `https://wa.me/51XXXXXXXXX` con ícono `bi-whatsapp`
4. Redes sociales: íconos `bi-facebook`, `bi-instagram`, `bi-globe` con enlace externo

### CU-005: Ver ubicación (estática)
**Flujo:**
1. Sección con dirección del negocio
2. Enlace "Cómo llegar" que abre Google Maps con la dirección
3. Formato URL: `https://maps.google.com/?q=DIRECCION+DISTRITO+Huancayo`
4. (El mapa embebido es futuro — por ahora solo el enlace)

---

## UI — Layout de la página

```
NAVBAR
│
├── HERO del negocio
│   ├── Imagen de portada (w-100, height: 300px, object-fit: cover)
│   ├── Badge estado verificado (bi-patch-check-fill text-primary)
│   ├── Nombre del negocio (h1)
│   ├── Badge categoría + Estrellas promedio + total reseñas
│   └── Estado: Abierto/Cerrado según horario actual

├── ROW PRINCIPAL (col-lg-8 + col-lg-4)
│   │
│   ├── COLUMNA IZQUIERDA (col-lg-8)
│   │   ├── Sección "Nuestra Historia" (descripción)
│   │   ├── Sección "Horarios de Atención"
│   │   │   └── Tabla Bootstrap con días y horas
│   │   ├── Sección "Nuestros Productos" (tabs Bootstrap)
│   │   │   └── Grid de Cards producto (col-6 col-md-4)
│   │   └── Sección "Reseñas" (Comunidad)
│   │       ├── Rating promedio grande + barra de progreso Bootstrap por estrella
│   │       ├── Lista de comentarios con avatar, nombre, estrellas, texto
│   │       └── Formulario escribir reseña (si está autenticado)
│   │
│   └── COLUMNA DERECHA (col-lg-4) — Sticky
│       ├── Card "Contactar negocio"
│       │   ├── btn-primary w-100 "Contactar negocio"
│       │   ├── Teléfono con bi-telephone
│       │   ├── Horarios resumidos
│       │   └── Redes sociales (íconos grandes)
│       └── Card "Ubicación"
│           ├── Dirección con bi-geo-alt
│           └── Enlace "Cómo llegar en Google Maps"
│
└── FOOTER
```

---

## Componentes Angular necesarios

```
business-profile/
├── business-profile.component.ts         # Componente principal, carga datos
├── business-hero/
│   └── business-hero.component.ts        # Imagen portada + info básica
├── business-products/
│   └── business-products.component.ts    # Grid de productos del negocio
├── business-reviews/
│   ├── business-reviews.component.ts     # Lista de reseñas
│   └── review-form/
│       └── review-form.component.ts      # Formulario nueva reseña
└── business-contact/
    └── business-contact.component.ts     # Sidebar contacto y ubicación
```

---

## Endpoints API requeridos

```
GET /api/v1/businesses/{id}
  Response 200:
  {
    "id_emprendimiento": 1,
    "nombre": "Café Central Huancayo",
    "descripcion": "Somos una cafetería comprometida...",
    "telefono": "+51 964 123 456",
    "direccion": "Calle Real 450",
    "distrito": "Huancayo",
    "horario_apertura": "08:00",
    "horario_cierre": "21:00",
    "imagen_portada_url": "/uploads/negocios/cafe-central.jpg",
    "estado_verificacion": "aprobado",
    "categoria": { "id_categoria": 1, "nombre": "Gastronomía" },
    "propietario": { "nombre": "Marco", "apellido": "Solís" },
    "puntuacion_promedio": 4.8,
    "total_valoraciones": 116,
    "redes_sociales": [
      { "plataforma": "facebook", "url": "https://facebook.com/..." },
      { "plataforma": "instagram", "url": "https://instagram.com/..." }
    ]
  }

GET /api/v1/businesses/{id}/products
  Query: ?page=1&size=9
  Response 200:
  {
    "items": [
      {
        "id_producto": 1,
        "nombre": "Latte de la Casa",
        "descripcion": "Espresso doble con leche cremosa",
        "precio": 12.00,
        "imagen_url": "/uploads/productos/latte.jpg",
        "estado_stock": "disponible"
      }
    ],
    "total": 5, "page": 1, "size": 9, "pages": 1
  }

GET /api/v1/businesses/{id}/reviews
  Query: ?page=1&size=5
  Response 200:
  {
    "items": [
      {
        "id_comentario": 1,
        "usuario": { "nombre": "Ricardo", "apellido": "Mendoza", "avatar_url": null },
        "contenido": "El mejor café de Huancayo...",
        "puntuacion": 5,
        "util_count": 12,
        "fecha": "2024-10-27T10:30:00"
      }
    ],
    "total": 116, "page": 1, "size": 5, "pages": 24,
    "distribucion_estrellas": { "5": 80, "4": 20, "3": 10, "2": 4, "1": 2 }
  }

POST /api/v1/businesses/{id}/reviews
  Header: Authorization: Bearer <token>
  Body: { "contenido": "Excelente servicio...", "puntuacion": 5 }
  Response 201: { "message": "Reseña publicada exitosamente" }
  Response 400: { "detail": "Ya valoraste este emprendimiento" }
```

---

## Reglas de negocio
- Calcular si el negocio está "Abierto" o "Cerrado" comparando hora actual del servidor con `horario_apertura` y `horario_cierre`
- Un usuario puede tener solo 1 valoración por emprendimiento (constraint UNIQUE en BD)
- El comentario y la valoración se guardan juntos en la misma operación
- Los comentarios se muestran del más reciente al más antiguo

---

## Criterios de aceptación
- [ ] La página carga todos los datos del negocio correctamente
- [ ] Productos se muestran con precio en S/ y estado de stock
- [ ] Reseñas muestran nombre de usuario, estrellas y texto
- [ ] Usuario no autenticado no puede enviar reseña
- [ ] Usuario autenticado puede enviar una sola reseña
- [ ] Estado Abierto/Cerrado se calcula correctamente
- [ ] Enlace de WhatsApp abre la app con número correcto
- [ ] Enlace de Google Maps abre con la dirección del negocio
- [ ] En móvil la columna lateral se mueve debajo del contenido principal
