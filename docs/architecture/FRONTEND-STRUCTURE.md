# BizRise — Frontend Structure (Angular)

## Stack

| Tecnología | Uso |
|---|---|
| Angular (última versión) | Framework SPA — Standalone Components |
| TypeScript estricto | Lenguaje |
| Bootstrap 5.3 (NPM) | Framework CSS |
| Bootstrap Icons (NPM) | Íconos |
| Angular Signals | Estado reactivo |
| Reactive Forms | Formularios con validación |
| HttpClient | Llamadas HTTP al backend |

---

## Instalación

```bash
npm install bootstrap@5.3.3 bootstrap-icons@1.11.3
```

### angular.json — styles y scripts

```json
{
  "styles": [
    "node_modules/bootstrap/dist/css/bootstrap.min.css",
    "node_modules/bootstrap-icons/font/bootstrap-icons.css",
    "src/styles/styles.scss"
  ],
  "scripts": [
    "node_modules/bootstrap/dist/js/bootstrap.bundle.min.js"
  ]
}
```

---

## Variables de Bootstrap (src/styles/_variables.scss)

```scss
$primary: #6f42c1;     // color morado BizRise
$primary-rgb: 111, 66, 193;
$border-radius: 0.5rem;
```

Este archivo se importa al inicio de `styles.scss` para sobreescribir los defaults de Bootstrap ANTES de que se compile el framework.

---

## Estructura de carpetas

```
src/
├── app/
│   ├── core/
│   │   ├── guards/
│   │   │   └── auth.guard.ts              ← adminGuard, entrepreneurGuard
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts        ← JWT funcional interceptor
│   │   ├── services/
│   │   │   ├── auth.service.ts            ← login, register, logout, signals
│   │   │   ├── directory.service.ts       ← búsqueda directorio
│   │   │   ├── categories.service.ts
│   │   │   ├── business.service.ts
│   │   │   ├── admin.service.ts           ← admin stats, solicitudes, usuarios
│   │   │   └── toast.service.ts           ← notificaciones toast dinámicas
│   │   └── models/
│   │       ├── user.model.ts
│   │       ├── business.model.ts
│   │       ├── category.model.ts
│   │       ├── product.model.ts
│   │       ├── promotion.model.ts
│   │       └── review.model.ts
│   ├── shared/
│   │   └── components/
│   │       └── loading-spinner/
│   ├── public/                              ← lazy loaded features
│   │   ├── home/
│   │   ├── directory/
│   │   ├── business-profile/
│   │   └── categories/
│   ├── auth/                                ← lazy loaded
│   │   ├── login/
│   │   └── register/
│   ├── entrepreneur/                        ← lazy loaded, entrepreneurGuard
│   │   ├── entrepreneur-layout.ts           ← layout con sidebar + offcanvas
│   │   ├── dashboard/
│   │   ├── my-business/
│   │   ├── products/
│   │   ├── promotions/
│   │   └── settings/
│   ├── admin/                               ← lazy loaded, adminGuard
│   │   ├── admin-layout.ts                  ← layout con sidebar + offcanvas
│   │   ├── dashboard/
│   │   ├── requests/
│   │   └── users/
│   ├── app.routes.ts                        ← lazy loading + guards
│   └── app.config.ts                        ← providers
├── styles/
│   ├── _variables.scss                      ← $primary: #6f42c1
│   └── styles.scss                          ← global CSS
└── environments/
    ├── environment.ts
    └── environment.prod.ts
```

---

## Patrón de componente Angular con Bootstrap

Cada componente tiene 3 archivos: `.ts`, `.html`, `.scss`

### Componente (TypeScript)

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-mi-componente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mi-componente.component.html',
  styleUrls: ['./mi-componente.component.scss'],
})
export class MiComponente {
  // lógica
}
```

### Template (HTML)

- Usa clases Bootstrap directamente
- NUNCA estilos inline
- NUNCA etiquetas <style>

```html
<div class="container py-4">
  <h2 class="text-primary mb-3">Título</h2>
  <div class="row g-4">
    <div class="col-12 col-md-6">
      <div class="card card-hover">
        <div class="card-body">
          <p class="card-text">Contenido</p>
        </div>
      </div>
    </div>
  </div>
</div>
```

### Estilos (SCSS)

- Solo para casos que Bootstrap no cubre
- NUNCA repetir clases de Bootstrap

```scss
.card-hover {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
}
```

---

## Patrón de servicio con Signals

```typescript
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Business } from '../models/business.model';

@Injectable({ providedIn: 'root' })
export class DirectoryService {
  private apiUrl = 'http://localhost:8000/api/v1';

  // Signals de estado
  items = signal<Business[]>([]);
  total = signal(0);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  loadData(params?: any): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<any>(`${this.apiUrl}/businesses`, { params }).subscribe({
      next: (res) => {
        this.items.set(res.items);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }
}
```

### Uso en el template

```html
@if (loading()) {
  <div class="text-center py-5">
    <div class="spinner-border text-primary" role="status"></div>
  </div>
} @else if (error()) {
  <div class="alert alert-danger">{{ error() }}</div>
} @else {
  <div class="result-count-badge">{{ total() }} negocios encontrados</div>
  <div class="row g-4">
    @for (item of items(); track item.id_emprendimiento) {
      <div class="col-12 col-md-6 col-lg-4">
        <div class="card business-card">
          ...
        </div>
      </div>
    }
  </div>
  @if (items().length === 0) {
    <div class="empty-state">...</div>
  }
}
```

---

## Patrón de formulario con validación Bootstrap

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-mi-formulario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mi-formulario.component.html',
})
export class MiFormulario {
  form = this.fb.group({
    nombre: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  loading = signal(false);
  submitted = false;

  constructor(private fb: FormBuilder, private auth: AuthService) {}

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) return;
    this.loading.set(true);
    this.auth.login(this.form.value).subscribe(...);
  }

  get f() { return this.form.controls; }
}
```

### Template del formulario

```html
<form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
  <div class="mb-3">
    <label for="email" class="form-label">Correo</label>
    <input
      id="email" type="email" class="form-control"
      [class.is-invalid]="submitted && f.email.errors"
      formControlName="email">
    @if (submitted && f.email.errors) {
      <div class="invalid-feedback">
        @if (f.email.errors['required']) { El correo es obligatorio }
        @if (f.email.errors['email']) { Ingresa un correo válido }
      </div>
    }
  </div>

  <button type="submit" class="btn btn-primary w-100"
          [disabled]="form.invalid || loading()">
    @if (loading()) {
      <span class="btn-spinner me-2"></span>
    }
    {{ loading() ? 'Cargando...' : 'Iniciar sesión' }}
  </button>
</form>
```

---

## Validadores custom para Promociones

```typescript
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// fecha_inicio no puede ser anterior a hoy
export function noPassedDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(control.value);
    return selected < today ? { datePassed: true } : null;
  };
}

// fecha_fin debe ser posterior a fecha_inicio
export function endDateAfterStartValidator(startKey: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const start = control.parent?.get(startKey)?.value;
    const end = control.value;
    if (!start || !end) return null;
    return new Date(end) <= new Date(start) ? { endBeforeStart: true } : null;
  };
}
```

---

## Buscador del directorio con debounce

```typescript
export class DirectoryComponent implements OnInit, OnDestroy {
  searchControl = new FormControl('');
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((term) => {
        this.updateQueryParams(term || '');
        this.directory.loadData({ busqueda: term || undefined, page: 1 });
      });
  }

  private updateQueryParams(term: string): void {
    this.router.navigate([], {
      queryParams: { busqueda: term || null },
      queryParamsHandling: 'merge',
    });
  }
}
```

---

## Flujo Angular → Backend

```
Componente
    │
    ▼  llama a service.metodo()
Servicio con Signals
    │  loadingSignal.set(true)
    ▼  HTTPClient.get/post/put/delete() con JWT interceptor automático
Interceptor JWT
    │  clona request y agrega Authorization: Bearer <token>
    ▼
FastAPI Backend (http://localhost:8000/api/v1/...)
    │
    ▼  response JSON
Servicio
    │  itemsSignal.set(response.data)
    │  loadingSignal.set(false)
    ▼
Template (reactivo)
    │  @if(loading()) → spinner
    │  @for(item of items()) → renderiza
    │  @if(error()) → alerta
    ▼
DOM actualizado automáticamente
```

---

## Route guards

```typescript
// auth.guard.ts
export const adminGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn() && auth.rol() === 'admin') return true;
  return router.parseUrl(auth.isLoggedIn() ? '/' : '/auth/login');
};

export const entrepreneurGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn() && auth.rol() === 'emprendedor') return true;
  return router.parseUrl(auth.isLoggedIn() ? '/' : '/auth/login');
};
```

### Rutas con lazy loading + guards

```typescript
// app.routes.ts
{
  path: 'entrepreneur',
  loadChildren: () => import('./entrepreneur/entrepreneur.module'),
  canActivate: [entrepreneurGuard],
  canActivateChild: [entrepreneurGuard],
},
{
  path: 'admin',
  loadChildren: () => import('./admin/admin.module'),
  canActivate: [adminGuard],
  canActivateChild: [adminGuard],
},
```

---

## Toast notifications (sin Bootstrap JS)

```typescript
@Injectable({ providedIn: 'root' })
export class ToastService {
  show(message: string, type: 'success' | 'danger' | 'warning' | 'info' = 'success'): void {
    // crea elemento DOM dinámico con clases Bootstrap toast
    // lo inserta en #toast-container
    // lo elimina automáticamente después de 4 segundos
  }
}
```

Los toasts se posicionan con:

```scss
#toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
}
```

---

## Reglas de estilo obligatorias

1. **Bootstrap primero** — usa clases Bootstrap antes de escribir CSS custom
2. **NUNCA estilos inline** en el HTML
3. **Variables en `_variables.scss`** — sobreescribe `$primary` de Bootstrap
4. **`styles.scss`** solo para estilos globales que Bootstrap no cubre (animaciones, skeleton, offcanvas custom, WhatsApp float)
5. **Cada componente** tiene su propio `.scss` para estilos específicos
6. **Color primario**: `#6f42c1` disponible como clase `text-primary`, `bg-primary`, `btn-primary`
