import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <button class="sidebar-toggle" type="button" data-bs-toggle="offcanvas" data-bs-target="#adminOffcanvas">
      <i class="bi bi-list"></i>
    </button>

    <div class="offcanvas offcanvas-start offcanvas-sidebar" tabindex="-1" id="adminOffcanvas">
      <div class="offcanvas-header border-bottom">
        <a routerLink="/admin" class="text-decoration-none d-flex align-items-center gap-3">
          <div class="brand-icon">
            <i class="bi bi-trending-up fs-5"></i>
          </div>
          <div>
            <span class="fw-black fs-6 text-primary d-block lh-1">BizRise</span>
            <small class="text-muted">Huancayo</small>
          </div>
        </a>
        <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
      </div>
      <div class="offcanvas-body d-flex flex-column px-3 py-3">
        <ul class="nav flex-column gap-1">
          <li class="nav-item">
            <a class="nav-link" routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" (click)="closeOffcanvas()">
              <i class="bi bi-grid-1x2"></i>
              <span>Resumen</span>
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" routerLink="/admin/requests" routerLinkActive="active" (click)="closeOffcanvas()">
              <i class="bi bi-clipboard-data"></i>
              <span>Solicitudes</span>
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" routerLink="/admin/users" routerLinkActive="active" (click)="closeOffcanvas()">
              <i class="bi bi-people"></i>
              <span>Usuarios</span>
            </a>
          </li>
        </ul>
        <div class="mt-auto border-top pt-3">
          <button class="btn btn-outline-danger btn-sm w-100 d-flex align-items-center justify-content-center gap-2" (click)="logout()">
            <i class="bi bi-box-arrow-right"></i>
            <span class="small">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>

    <div class="d-flex min-vh-100">
      <nav class="admin-sidebar">
        <div class="px-4 py-4 border-bottom">
          <a routerLink="/admin" class="text-decoration-none d-flex align-items-center gap-3">
            <div class="brand-icon">
              <i class="bi bi-trending-up fs-5"></i>
            </div>
            <div>
              <span class="fw-black fs-6 text-primary d-block lh-1">BizRise</span>
              <small class="text-muted brand-subtitle">Huancayo</small>
            </div>
          </a>
        </div>
        <div class="px-3 py-3 d-flex flex-column flex-grow-1">
          <ul class="nav flex-column gap-1">
            <li class="nav-item">
              <a class="nav-link" routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
                <i class="bi bi-grid-1x2"></i>
                <span>Resumen</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/admin/requests" routerLinkActive="active">
                <i class="bi bi-clipboard-data"></i>
                <span>Solicitudes</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/admin/users" routerLinkActive="active">
                <i class="bi bi-people"></i>
                <span>Usuarios</span>
              </a>
            </li>
          </ul>
          <div class="mt-auto">
            <div class="border-top pt-3">
              <button class="btn btn-outline-danger btn-sm w-100 d-flex align-items-center justify-content-center gap-2" (click)="logout()">
                <i class="bi bi-box-arrow-right"></i>
                <span class="small">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main class="flex-grow-1 d-flex flex-column bg-surface">
        <router-outlet />
      </main>
    </div>
  `
})
export class AdminLayout {
  private authService = inject(AuthService);
  private router = inject(Router);

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  closeOffcanvas(): void {
    const el = document.getElementById('adminOffcanvas');
    if (el) {
      const offcanvas = (window as any).bootstrap?.Offcanvas;
      if (offcanvas) offcanvas.getInstance(el)?.hide();
    }
  }
}
