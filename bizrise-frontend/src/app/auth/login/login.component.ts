import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div class="col-11 col-sm-8 col-md-5 col-lg-4">
        <div class="text-center mb-4">
          <a routerLink="/" class="text-decoration-none">
            <h1 class="display-6 fw-bold text-primary">
              <i class="bi bi-buildings"></i> BizRise
            </h1>
          </a>
          <p class="text-muted">Directorio de emprendedores locales en Huancayo</p>
        </div>
        <div class="card shadow-sm border-0">
          <div class="card-body p-4">
            <ul class="nav nav-tabs nav-fill mb-4">
              <li class="nav-item">
                <a class="nav-link active fw-semibold" routerLink="/auth/login">
                  <i class="bi bi-box-arrow-in-right"></i> Iniciar Sesión
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link text-muted" routerLink="/auth/register">
                  <i class="bi bi-person-plus"></i> Registrarse
                </a>
              </li>
            </ul>

            @if (errorMessage) {
              <div class="alert alert-danger" role="alert">{{ errorMessage }}</div>
            }

            <form (ngSubmit)="onSubmit()">
              <div class="mb-3">
                <label for="correo" class="form-label small fw-semibold">Correo electrónico</label>
                <input type="email" class="form-control" id="correo" name="correo" [(ngModel)]="correo" required placeholder="tu@correo.com"
                       [class.is-invalid]="submitted && !correo" [class.is-valid]="submitted && correo">
                @if (submitted && !correo) {
                  <div class="invalid-feedback">El correo es obligatorio</div>
                }
              </div>
              <div class="mb-3">
                <label for="contrasena" class="form-label small fw-semibold">Contraseña</label>
                <input type="password" class="form-control" id="contrasena" name="contrasena" [(ngModel)]="contrasena" required placeholder="Tu contraseña"
                       [class.is-invalid]="submitted && !contrasena" [class.is-valid]="submitted && contrasena">
                @if (submitted && !contrasena) {
                  <div class="invalid-feedback">La contraseña es obligatoria</div>
                }
              </div>
              <button type="submit" class="btn btn-primary w-100 mb-3" [disabled]="loading">
                @if (loading) {
                  <span class="btn-spinner"></span>
                }
                <i class="bi bi-box-arrow-in-right"></i> Ingresar
              </button>
            </form>
          </div>
        </div>
        <p class="text-center mt-3 small text-muted">
          ¿No tienes cuenta?
          <a routerLink="/auth/register" class="text-decoration-none fw-semibold">Regístrate aquí</a>
        </p>
      </div>
    </div>
  `
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  correo = '';
  contrasena = '';
  loading = false;
  errorMessage = '';
  submitted = false;

  onSubmit(): void {
    this.submitted = true;
    if (!this.correo || !this.contrasena) return;
    this.loading = true;
    this.errorMessage = '';
    this.authService.login(this.correo, this.contrasena).subscribe({
      next: () => {
        this.loading = false;
        const role = this.authService.userRole;
        if (role === 'administrador') this.router.navigate(['/admin']);
        else if (role === 'emprendedor') this.router.navigate(['/entrepreneur']);
        else this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.detail || 'Error al iniciar sesión';
      }
    });
  }
}
