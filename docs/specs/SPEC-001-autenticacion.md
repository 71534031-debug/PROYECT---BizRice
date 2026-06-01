# SPEC-001 — Autenticación y Gestión de Sesión

## Descripción
Sistema de registro, inicio de sesión y gestión de sesión mediante JWT para los usuarios de BizRise.

## Usuarios involucrados
- Visitante (se registra como emprendedor o cliente)
- Emprendedor (accede a su panel)
- Administrador (accede al panel de administración)

## Casos de uso

### CU-001: Registro de usuario
**Actor:** Visitante  
**Flujo principal:**
1. Usuario completa el formulario: nombre, apellido, correo, contraseña, confirmar contraseña
2. Sistema valida que el correo no esté registrado
3. Sistema hashea la contraseña con bcrypt
4. Sistema crea el usuario con rol `emprendedor` por defecto
5. Sistema retorna access token y refresh token
6. Frontend redirige al panel del emprendedor

**Validaciones:**
- Correo: formato válido, único en BD
- Contraseña: mínimo 8 caracteres, al menos 1 número
- Confirmar contraseña: debe coincidir

**Errores:**
- 400: Correo ya registrado → "Este correo ya tiene una cuenta"
- 422: Datos inválidos → mostrar errores por campo

### CU-002: Inicio de sesión
**Actor:** Emprendedor, Administrador  
**Flujo principal:**
1. Usuario ingresa correo y contraseña
2. Sistema verifica que el usuario exista y esté activo
3. Sistema verifica la contraseña contra el hash bcrypt
4. Sistema genera access token (30 min) y refresh token (7 días)
5. Frontend guarda tokens y redirige según rol:
   - `emprendedor` → `/entrepreneur/dashboard`
   - `administrador` → `/admin/dashboard`

**Errores:**
- 401: Credenciales incorrectas → "Correo o contraseña incorrectos"
- 403: Cuenta suspendida → "Tu cuenta está suspendida. Contacta al administrador"

### CU-003: Renovar token
**Actor:** Sistema (automático)  
**Flujo:** El interceptor Angular detecta error 401, llama a `/auth/refresh` con el refresh token, obtiene nuevo access token y reintenta la petición original.

### CU-004: Cerrar sesión
**Actor:** Emprendedor, Administrador  
**Flujo:** Frontend elimina los tokens del localStorage y redirige a `/`

## Endpoints API

```
POST /api/v1/auth/register
  Body: { nombre, apellido, correo, contrasena, confirmar_contrasena }
  Response 201: { access_token, refresh_token, token_type, user }

POST /api/v1/auth/login
  Body: { correo, contrasena }
  Response 200: { access_token, refresh_token, token_type, user }

POST /api/v1/auth/refresh
  Body: { refresh_token }
  Response 200: { access_token, token_type }

GET /api/v1/auth/me
  Header: Authorization: Bearer <token>
  Response 200: { id_usuario, nombre, apellido, correo, rol, avatar_url }
```

## Frontend — Componentes

### LoginComponent
- Formulario Bootstrap con Reactive Forms
- Campos: correo (email input), contraseña (password input)
- Botón "Ingresar" con Bootstrap primary button (color morado via $primary)
- Link "Olvidé mi contraseña" (flujo pendiente, mostrar como deshabilitado)
- Botones OAuth: Google, Facebook (solo UI por ahora, no funcional)
- Switch a formulario de registro mediante tabs Bootstrap

### RegisterComponent
- Formulario Bootstrap
- Campos: nombre, apellido, correo, contraseña, confirmar contraseña
- Validación en tiempo real con Bootstrap validation classes (is-valid / is-invalid)
- Feedback de error con Bootstrap invalid-feedback

## Criterios de aceptación
- [ ] Un visitante puede registrarse y recibir tokens JWT
- [ ] Un emprendedor puede iniciar sesión y ser redirigido a su panel
- [ ] Un administrador puede iniciar sesión y ser redirigido al panel admin
- [ ] Una cuenta suspendida no puede iniciar sesión
- [ ] El token se renueva automáticamente cuando expira
- [ ] El guard protege las rutas `/entrepreneur/*` y `/admin/*`
