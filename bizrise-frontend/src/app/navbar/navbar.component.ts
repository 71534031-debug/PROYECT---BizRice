import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar navbar-expand-lg navbar-light bg-white/80 backdrop-blur-md sticky-top border-bottom border-slate-200 shadow-sm">
      <div class="container">
        <a class="navbar-brand d-flex align-items-center gap-2 fw-black fs-4" routerLink="/">
          <span class="text-primary">BizRise</span>
        </a>

        <button class="navbar-toggler" type="button" data-bs-toggle="collapse"
                data-bs-target="#navbarMain" aria-controls="navbarMain"
                aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarMain">
          <ul class="navbar-nav mx-auto mb-2 mb-lg-0 gap-1">
            <li class="nav-item">
              <a class="nav-link" routerLink="/" routerLinkActive="active-nav" [routerLinkActiveOptions]="{exact:true}">
                <i class="bi bi-house-door"></i> Inicio
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/directory" routerLinkActive="active-nav">
                <i class="bi bi-grid"></i> Directorio
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/categories" routerLinkActive="active-nav">
                <i class="bi bi-tags"></i> Categorías
              </a>
            </li>
          </ul>

          <div class="d-flex align-items-center gap-3">
            <div class="d-none d-sm-flex align-items-center bg-surface rounded-pill px-3 py-1.5 border border-transparent search-nav-wrapper">
              <i class="bi bi-search text-muted me-2"></i>
              <input class="form-control border-0 bg-transparent shadow-none px-0" style="font-size:0.875rem;width:160px" placeholder="Buscar negocios..." type="text" #navSearch (keydown.enter)="search(navSearch.value)">
            </div>
            @if (authService.isLoggedIn) {
              <div class="dropdown">
                <button class="btn btn-outline-secondary rounded-pill px-3 btn-sm dropdown-toggle" data-bs-toggle="dropdown">
                  <i class="bi bi-person-circle"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                  <li><span class="dropdown-item-text small text-muted">{{ authService.user()?.nombre }}</span></li>
                  <li><hr class="dropdown-divider"></li>
                  <li><a class="dropdown-item" routerLink="/entrepreneur"><i class="bi bi-grid"></i> Panel</a></li>
                  <li><a class="dropdown-item" routerLink="/admin"><i class="bi bi-shield"></i> Admin</a></li>
                  <li><hr class="dropdown-divider"></li>
                  <li><button class="dropdown-item text-danger" (click)="logout()"><i class="bi bi-box-arrow-right"></i> Cerrar Sesión</button></li>
                </ul>
              </div>
            } @else {
              <a routerLink="/auth/login" class="btn btn-primary rounded-pill px-4 btn-sm">
                Ingresar
              </a>
            }
          </div>
        </div>
      </div>
    </nav>
  `
})
export class NavbarComponent {
  authService = inject(AuthService);

  search(query: string): void {
    if (query.trim()) {
      window.location.href = `/directory?busqueda=${encodeURIComponent(query.trim())}`;
    }
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/';
  }
}
