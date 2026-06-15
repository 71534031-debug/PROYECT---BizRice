import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-entrepreneur-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <button class="sidebar-toggle" type="button" data-bs-toggle="offcanvas" data-bs-target="#entOffcanvas">
      <i class="bi bi-list"></i>
    </button>

    <div class="offcanvas offcanvas-start offcanvas-sidebar" tabindex="-1" id="entOffcanvas">
      <div class="offcanvas-header border-bottom">
        <a routerLink="/entrepreneur" class="text-decoration-none">
          <span class="fw-bold fs-5 text-primary">
            <i class="bi bi-buildings"></i> BizRise
          </span>
        </a>
        <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
      </div>
      <div class="offcanvas-body d-flex flex-column px-3 py-3">
        <ul class="nav flex-column gap-1">
          <li class="nav-item">
            <a class="nav-link" routerLink="/entrepreneur" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" (click)="closeOffcanvas()">
              <i class="bi bi-grid"></i> Panel Control
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" routerLink="/entrepreneur/my-business" routerLinkActive="active" (click)="closeOffcanvas()">
              <i class="bi bi-shop"></i> Mi Negocio
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" routerLink="/entrepreneur/products" routerLinkActive="active" (click)="closeOffcanvas()">
              <i class="bi bi-box-seam"></i> Productos
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" routerLink="/entrepreneur/promotions" routerLinkActive="active" (click)="closeOffcanvas()">
              <i class="bi bi-megaphone"></i> Promociones
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" routerLink="/entrepreneur/settings" routerLinkActive="active" (click)="closeOffcanvas()">
              <i class="bi bi-gear"></i> Configuración
            </a>
          </li>
        </ul>
        <div class="mt-auto border-top pt-3">
          <button class="btn btn-outline-danger btn-sm w-100 d-flex align-items-center justify-content-center gap-2" (click)="logout()">
            <i class="bi bi-box-arrow-right"></i> Cerrar Sesión
          </button>
        </div>
      </div>
    </div>

    <div class="d-flex">
      <nav class="sidebar bg-white border-end d-flex flex-column">
        <div class="p-3 border-bottom">
          <a routerLink="/entrepreneur" class="text-decoration-none">
            <span class="fw-bold fs-5 text-primary">
              <i class="bi bi-buildings"></i> BizRise
            </span>
          </a>
          <small class="d-block text-muted">Panel Emprendedor</small>
        </div>
        <ul class="nav flex-column p-2 flex-grow-1">
          <li class="nav-item">
            <a class="nav-link" routerLink="/entrepreneur" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
              <i class="bi bi-grid"></i> Panel Control
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" routerLink="/entrepreneur/my-business" routerLinkActive="active">
              <i class="bi bi-shop"></i> Mi Negocio
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" routerLink="/entrepreneur/products" routerLinkActive="active">
              <i class="bi bi-box-seam"></i> Productos
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" routerLink="/entrepreneur/promotions" routerLinkActive="active">
              <i class="bi bi-megaphone"></i> Promociones
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" routerLink="/entrepreneur/settings" routerLinkActive="active">
              <i class="bi bi-gear"></i> Configuración
            </a>
          </li>
        </ul>
        <div class="p-3 border-top">
          <button class="btn btn-outline-danger btn-sm w-100" (click)="logout()">
            <i class="bi bi-box-arrow-right"></i> Cerrar Sesión
          </button>
        </div>
      </nav>
      <main class="flex-grow-1 p-4 bg-light min-vh-100">
        <router-outlet />
      </main>
    </div>
  `
})
export class EntrepreneurLayout {
  private authService = inject(AuthService);
  private router = inject(Router);

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  closeOffcanvas(): void {
    const el = document.getElementById('entOffcanvas');
    if (el) {
      const offcanvas = (window as any).bootstrap?.Offcanvas;
      if (offcanvas) offcanvas.getInstance(el)?.hide();
    }
  }
}
