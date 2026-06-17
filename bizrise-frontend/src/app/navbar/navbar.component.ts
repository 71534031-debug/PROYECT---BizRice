import { Component, inject, HostListener, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CategoryService } from '../services/category.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar navbar-expand-lg navbar-light sticky-top" [class.navbar-scrolled]="scrolled">
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
            <li class="nav-item mega-menu-parent position-relative">
              <a class="nav-link" routerLink="/categories" routerLinkActive="active-nav" (mouseenter)="loadMegaCategories()">
                <i class="bi bi-tags"></i> Categorías
              </a>
              @if (megaCats.length) {
                <div class="mega-menu" (mouseleave)="megaHoveredCat = null">
                  <div class="mega-menu-inner">
                    <div class="mega-menu-links">
                      @for (cat of megaCats; track cat.id_categoria) {
                        <a class="mega-link" [routerLink]="'/directory'" [queryParams]="{categoria: cat.id_categoria}" (mouseenter)="megaHoveredCat = cat">
                          <i class="bi {{ catIcon($index) }} me-2"></i>{{ cat.nombre }}
                        </a>
                      }
                    </div>
                    @if (megaHoveredCat) {
                      <div class="mega-menu-preview d-none d-lg-block">
                        <img [src]="megaCatImg(megaHoveredCat)" alt="" class="rounded-3 w-100 h-100 object-cover">
                      </div>
                    }
                  </div>
                </div>
              }
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
export class NavbarComponent implements OnInit {
  authService = inject(AuthService);
  private categoryService = inject(CategoryService);
  private router = inject(Router);

  scrolled = false;
  megaCats: any[] = [];
  megaHoveredCat: any = null;
  private megaIcons = ['bi-cup-hot','bi-palette','bi-handbag','bi-heart-pulse','bi-tools','bi-laptop','bi-book','bi-house','bi-compass'];

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe({
      next: (res: any) => { this.megaCats = res.items || []; }
    });
  }

  catIcon(idx: number): string {
    return this.megaIcons[idx % this.megaIcons.length];
  }

  megaCatImg(cat: any): string {
    return cat.imagen_url || `https://picsum.photos/seed/${encodeURIComponent(cat.nombre)}/400/300`;
  }

  loadMegaCategories(): void {
    if (this.megaCats.length) return;
    this.categoryService.getCategories().subscribe({
      next: (res: any) => { this.megaCats = res.items || []; }
    });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled = window.scrollY > 20;
  }

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
