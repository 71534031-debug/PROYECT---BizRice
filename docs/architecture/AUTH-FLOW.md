# BizRise — Flujo de Autenticación JWT

## Librerías Python usadas
- `python-jose[cryptography]` — generar y verificar JWT
- `passlib[bcrypt]` — hashear contraseñas

---

## Flujo de Registro

```
Usuario                Angular Frontend              FastAPI Backend           SQL Server
   |                         |                              |                       |
   |-- rellena formulario --> |                              |                       |
   |                         |-- POST /auth/register -----> |                       |
   |                         |   { nombre, apellido,        |                       |
   |                         |     correo, contrasena }     |                       |
   |                         |                              |-- SELECT correo -----> |
   |                         |                              | <-- no existe -------- |
   |                         |                              |                       |
   |                         |                              |-- bcrypt.hash(pass)   |
   |                         |                              |-- INSERT Usuario ----> |
   |                         |                              | <-- id_usuario=5 ----- |
   |                         |                              |                       |
   |                         |                              |-- crear access_token  |
   |                         |                              |-- crear refresh_token |
   |                         |                              |                       |
   |                         | <-- 201 { tokens, user } --- |                       |
   |                         |                              |                       |
   |                         |-- guardar tokens en -------> |                       |
   |                         |   localStorage               |                       |
   |                         |                              |                       |
   |                         |-- redirigir según rol -----  |                       |
   | <-- panel emprendedor --  |                              |                       |
```

---

## Flujo de Login

```
Angular Frontend              FastAPI Backend
       |                              |
       |-- POST /auth/login --------> |
       |   { correo, contrasena }     |
       |                              |-- SELECT * FROM Usuarios WHERE correo=?
       |                              |-- bcrypt.verify(contrasena, hash)
       |                              |-- if estado == 'suspendido' → 403
       |                              |-- generar access_token (30 min)
       |                              |-- generar refresh_token (7 días)
       |                              |
       | <-- 200 { tokens, user } --- |
       |                              |
       |-- localStorage.setItem('access_token', ...)
       |-- localStorage.setItem('refresh_token', ...)
       |-- localStorage.setItem('user', JSON.stringify(user))
       |-- redirigir según user.rol
```

---

## Flujo de Request autenticada

```
Angular Component    AuthInterceptor       FastAPI Backend
       |                   |                      |
       |-- llamar servicio->|                      |
       |                   |-- leer access_token   |
       |                   |   del localStorage    |
       |                   |                      |
       |                   |-- HTTP Request -----> |
       |                   |   Authorization:      |
       |                   |   Bearer eyJ...       |
       |                   |                      |-- verificar JWT
       |                   |                      |-- extraer id_usuario y rol
       |                   |                      |-- procesar request
       |                   | <-- 200 Response ---- |
       | <-- datos --------|                      |
```

---

## Flujo de Renovación de Token (Token Refresh)

```
AuthInterceptor           FastAPI Backend
       |                         |
       |-- HTTP Request -------> |
       |   (con token vencido)   |
       |                         |-- verificar JWT → EXPIRADO
       | <-- 401 Unauthorized -- |
       |                         |
       |-- POST /auth/refresh --> |
       |   { refresh_token }     |
       |                         |-- verificar refresh_token
       |                         |-- generar nuevo access_token
       | <-- 200 { access_token} |
       |                         |
       |-- guardar nuevo token   |
       |-- reintentar request -> |
       | <-- 200 Response ------ |
```

Si el refresh_token también falla (expirado o inválido):
- Limpiar localStorage (tokens + user)
- Redirigir a /auth/login
- Mostrar Bootstrap Toast: "Tu sesión expiró, inicia sesión nuevamente"

---

## Implementación Python — security.py

```python
# backend/app/core/security.py
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
```

---

## Implementación Python — dependencies.py

```python
# backend/app/core/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import verify_token
from app.models.user import Usuario

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Usuario:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido o expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = verify_token(token)
    if payload is None:
        raise credentials_exception

    id_usuario: int = payload.get("sub")
    if id_usuario is None:
        raise credentials_exception

    user = db.query(Usuario).filter(Usuario.id_usuario == id_usuario).first()
    if user is None or user.estado != "activo":
        raise credentials_exception
    return user

def require_entrepreneur(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    if current_user.rol != "emprendedor":
        raise HTTPException(status_code=403, detail="Acceso solo para emprendedores")
    return current_user

def require_admin(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    if current_user.rol != "administrador":
        raise HTTPException(status_code=403, detail="Acceso solo para administradores")
    return current_user
```

---

## Implementación Angular — auth.interceptor.ts

```typescript
// frontend/src/app/core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = localStorage.getItem('access_token');

  const authReq = token
    ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Intentar renovar el token
        return authService.refreshToken().pipe(
          switchMap((tokens) => {
            localStorage.setItem('access_token', tokens.access_token);
            const retryReq = req.clone({
              headers: req.headers.set('Authorization', `Bearer ${tokens.access_token}`)
            });
            return next(retryReq);
          }),
          catchError(() => {
            authService.logout();
            router.navigate(['/auth/login']);
            return throwError(() => error);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
```

---

## Guards Angular

```typescript
// auth.guard.ts — solo usuarios autenticados
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }
  router.navigate(['/auth/login']);
  return false;
};

// role.guard.ts — verificar rol específico
export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const requiredRole = route.data['role'] as string;

  if (authService.hasRole(requiredRole)) {
    return true;
  }
  router.navigate(['/']);
  return false;
};
```

---

## app.routes.ts — Rutas con guards

```typescript
export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/public/home/home.component') },
  { path: 'directorio', loadComponent: () => import('./features/public/directory/directory.component') },
  { path: 'categorias', loadComponent: () => import('./features/public/categories/categories.component') },
  { path: 'negocio/:id', loadComponent: () => import('./features/public/business-profile/business-profile.component') },

  {
    path: 'auth',
    canActivate: [noAuthGuard],
    children: [
      { path: 'login', loadComponent: () => import('./features/auth/login/login.component') },
      { path: 'register', loadComponent: () => import('./features/auth/register/register.component') },
    ]
  },

  {
    path: 'entrepreneur',
    canActivate: [authGuard, roleGuard],
    data: { role: 'emprendedor' },
    loadComponent: () => import('./features/entrepreneur/entrepreneur-layout.component'),
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/entrepreneur/dashboard/entrepreneur-dashboard.component') },
      { path: 'my-business', loadComponent: () => import('./features/entrepreneur/my-business/my-business.component') },
      { path: 'products', loadComponent: () => import('./features/entrepreneur/products/product-list.component') },
      { path: 'promotions', loadComponent: () => import('./features/entrepreneur/promotions/promotions.component') },
      { path: 'settings', loadComponent: () => import('./features/entrepreneur/settings/entrepreneur-settings.component') },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { role: 'administrador' },
    loadComponent: () => import('./features/admin/admin-layout.component'),
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component') },
      { path: 'requests', loadComponent: () => import('./features/admin/requests/requests.component') },
      { path: 'users', loadComponent: () => import('./features/admin/users/users.component') },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: '' }
];
```
