import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
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
          <p class="text-muted">Crea tu cuenta como emprendedor</p>
        </div>
        <div class="card shadow-sm border-0">
          <div class="card-body p-4">
            <ul class="nav nav-tabs nav-fill mb-4">
              <li class="nav-item">
                <a class="nav-link text-muted" routerLink="/auth/login">
                  <i class="bi bi-box-arrow-in-right"></i> Iniciar Sesión
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link active fw-semibold" routerLink="/auth/register">
                  <i class="bi bi-person-plus"></i> Registrarse
                </a>
              </li>
            </ul>

            @if (errorMessage) {
              <div class="alert alert-danger" role="alert">{{ errorMessage }}</div>
            }

            <form (ngSubmit)="onSubmit()">
              <div class="mb-3">
                <label for="nombre" class="form-label small fw-semibold">Nombres</label>
                <input type="text" class="form-control" id="nombre" name="nombre" [(ngModel)]="nombre" required placeholder="Tus nombres"
                       [class.is-invalid]="submitted && !nombre" [class.is-valid]="submitted && nombre">
                @if (submitted && !nombre) {
                  <div class="invalid-feedback">El nombre es obligatorio</div>
                }
              </div>
              <div class="mb-3">
                <label for="apellido" class="form-label small fw-semibold">Apellidos</label>
                <input type="text" class="form-control" id="apellido" name="apellido" [(ngModel)]="apellido" required placeholder="Tus apellidos"
                       [class.is-invalid]="submitted && !apellido" [class.is-valid]="submitted && apellido">
                @if (submitted && !apellido) {
                  <div class="invalid-feedback">El apellido es obligatorio</div>
                }
              </div>
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
                <input type="password" class="form-control" id="contrasena" name="contrasena" [(ngModel)]="contrasena" required
                       [class.is-invalid]="submitted && (!contrasena || contrasena.length < 6)" [class.is-valid]="submitted && contrasena.length >= 6">
                @if (submitted && !contrasena) {
                  <div class="invalid-feedback">La contraseña es obligatoria</div>
                } @else if (submitted && contrasena.length < 6) {
                  <div class="invalid-feedback">Mínimo 6 caracteres</div>
                }
              </div>
              <div class="mb-3">
                <label for="confirmar" class="form-label small fw-semibold">Confirmar Contraseña</label>
                <input type="password" class="form-control" id="confirmar" name="confirmar" [(ngModel)]="confirmar" required
                       [class.is-invalid]="submitted && (!confirmar || confirmar !== contrasena)" [class.is-valid]="submitted && confirmar === contrasena">
                @if (submitted && !confirmar) {
                  <div class="invalid-feedback">Confirma tu contraseña</div>
                } @else if (submitted && confirmar !== contrasena) {
                  <div class="invalid-feedback">Las contraseñas no coinciden</div>
                }
              </div>
              <button type="submit" class="btn btn-primary w-100 mb-3" [disabled]="loading">
                @if (loading) {
                  <span class="btn-spinner"></span>
                }
                <i class="bi bi-person-plus"></i> Crear Cuenta
              </button>
            </form>
          </div>
        </div>
        <p class="text-center mt-3 small text-muted">
          ¿Ya tienes cuenta?
          <a routerLink="/auth/login" class="text-decoration-none fw-semibold">Inicia sesión aquí</a>
        </p>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  nombre = '';
  apellido = '';
  correo = '';
  contrasena = '';
  confirmar = '';
  loading = false;
  errorMessage = '';
  submitted = false;

  onSubmit(): void {
    this.submitted = true;
    if (this.contrasena !== this.confirmar) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.authService.register({
      nombre: this.nombre,
      apellido: this.apellido,
      correo: this.correo,
      contrasena: this.contrasena,
      confirmar_contrasena: this.confirmar
    }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/entrepreneur']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.detail || 'Error al registrarse';
      }
    });
  }
}
