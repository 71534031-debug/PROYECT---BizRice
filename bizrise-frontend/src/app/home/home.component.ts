import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../services/category.service';
import { BusinessService } from '../services/business.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <section class="hero-section bg-primary text-white" style="background:linear-gradient(135deg,#6f42c1 0%,#4f0baa 100%)">
      <div class="container position-relative z-1 text-center text-white py-5">
        <h1 class="display-4 fw-black mb-4">Descubre emprendedores locales en Huancayo</h1>
        <p class="lead mb-5 mx-auto" style="max-width:600px;opacity:0.9">
          Conectamos la tradición del Valle del Mantaro con el futuro digital. Encuentra los mejores negocios locales en un solo lugar.
        </p>
        <div class="row justify-content-center">
          <div class="col-lg-10 col-xl-8">
            <div class="bg-white rounded-4 shadow-lg p-3">
              <div class="row g-0 align-items-center">
                <div class="col-md d-flex align-items-center px-3 py-2">
                  <i class="bi bi-search text-primary me-3 fs-5"></i>
                  <input type="text" class="form-control border-0 shadow-none px-0" placeholder="¿Qué estás buscando hoy?" [(ngModel)]="searchTerm" (keydown.enter)="search()">
                </div>
                <div class="col-md-auto d-flex align-items-center px-3 py-2">
                  <i class="bi bi-geo-alt text-primary me-3 fs-5"></i>
                  <select class="form-select border-0 shadow-none" style="background-color:transparent;background-image:none;padding-left:0;padding-right:1.75rem;min-width:155px" [(ngModel)]="distrito">
                    <option value="">Todo Huancayo</option>
                    <option value="Huancayo">Huancayo</option>
                    <option value="El Tambo">El Tambo</option>
                    <option value="Chilca">Chilca</option>
                    <option value="San Agustín">San Agustín</option>
                    <option value="Pilcomayo">Pilcomayo</option>
                  </select>
                </div>
                <div class="col-md-auto p-2">
                  <button class="btn btn-primary px-4 py-2 rounded-3 w-100 fw-semibold" (click)="search()">
                    Buscar ahora
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="row justify-content-center gap-3 mt-5" id="hero-stats">
          <div class="col-6 col-md-3 col-lg-2">
            <div class="text-white">
              <h3 class="fw-black mb-0 display-6 counter" [textContent]="stats().negocios"></h3>
              <small class="opacity-75">Negocios</small>
            </div>
          </div>
          <div class="col-6 col-md-3 col-lg-2">
            <div class="text-white">
              <h3 class="fw-black mb-0 display-6 counter" [textContent]="stats().productos"></h3>
              <small class="opacity-75">Productos</small>
            </div>
          </div>
          <div class="col-6 col-md-3 col-lg-2">
            <div class="text-white">
              <h3 class="fw-black mb-0 display-6 counter" [textContent]="stats().categorias"></h3>
              <small class="opacity-75">Categorías</small>
            </div>
          </div>
          <div class="col-6 col-md-3 col-lg-2">
            <div class="text-white">
              <h3 class="fw-black mb-0 display-6 counter" [textContent]="stats().valoraciones"></h3>
              <small class="opacity-75">Valoraciones</small>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="py-5">
      <div class="container">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h3 class="fw-bold mb-0">Explora por Categoría</h3>
          <a routerLink="/categories" class="btn btn-outline-primary rounded-pill btn-sm">Ver todas</a>
        </div>
        <div class="row g-3" id="categories-grid">
          @for (cat of categories(); track cat.id_categoria) {
            <div class="col-6 col-md-4 col-lg-2">
              <a [routerLink]="'/directory'" [queryParams]="{categoria: cat.id_categoria}" class="text-decoration-none">
                <div class="card card-hover shadow-sm border-0 text-center py-3">
                  <div class="card-body">
                    <i class="bi {{ categoryIcons[$index % categoryIcons.length] }} fs-2 text-primary"></i>
                    <h6 class="mt-2 fw-semibold small mb-0">{{ cat.nombre }}</h6>
                    <small class="text-muted">{{ cat.business_count || cat.total_negocios || 0 }} negocios</small>
                  </div>
                </div>
              </a>
            </div>
          }
        </div>
      </div>
    </section>

    <section class="py-5 bg-light">
      <div class="container">
        <h3 class="fw-bold mb-4 text-center">¿Cómo funciona?</h3>
        <div class="row g-4">
          <div class="col-md-4">
            <div class="card border-0 shadow-sm text-center h-100">
              <div class="card-body py-4">
                <div class="bg-primary-bg rounded-circle d-inline-flex p-3 mb-3">
                  <i class="bi bi-search fs-3 text-primary"></i>
                </div>
                <h5 class="fw-bold">Explora</h5>
                <p class="text-muted small">Encuentra emprendedores locales por categoría, distrito o palabra clave.</p>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card border-0 shadow-sm text-center h-100">
              <div class="card-body py-4">
                <div class="bg-primary-bg rounded-circle d-inline-flex p-3 mb-3">
                  <i class="bi bi-chat-dots fs-3 text-primary"></i>
                </div>
                <h5 class="fw-bold">Conecta</h5>
                <p class="text-muted small">Conoce su historia, productos y servicios. Lee reseñas de otros clientes.</p>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card border-0 shadow-sm text-center h-100">
              <div class="card-body py-4">
                <div class="bg-primary-bg rounded-circle d-inline-flex p-3 mb-3">
                  <i class="bi bi-handbag fs-3 text-primary"></i>
                </div>
                <h5 class="fw-bold">Compra</h5>
                <p class="text-muted small">Apoya a la economía local contactando directamente con los emprendedores.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="py-5">
      <div class="container">
        <h3 class="fw-bold mb-4">Negocios Destacados</h3>
        @if (loadingBiz()) {
          <div class="row g-3">
            @for (s of [1,2,3]; track s) {
              <div class="col-md-4">
                <div class="card shadow-sm">
                  <div class="placeholder-glow"><div class="placeholder" style="height:160px;width:100%"></div></div>
                  <div class="card-body"><div class="placeholder placeholder-lg w-75"></div></div>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="row g-3">
            @for (biz of businesses(); track biz.id_emprendimiento) {
              <div class="col-md-4">
                <a [routerLink]="'/business/' + biz.id_emprendimiento" class="text-decoration-none">
                  <div class="card card-hover shadow-sm h-100">
                    @if (biz.imagen_portada_url) {
                      <img [src]="biz.imagen_portada_url" class="card-img-top" style="height:160px;object-fit:cover" [alt]="biz.nombre" [attr.loading]="'lazy'">
                    } @else {
                      <div class="img-placeholder" style="height:160px"><i class="bi bi-shop fs-1"></i></div>
                    }
                    <div class="card-body">
                      <span class="badge bg-primary bg-opacity-10 text-primary mb-2">{{ biz.categoria }}</span>
                      <h6 class="fw-bold mb-1">{{ biz.nombre }}</h6>
                      @if (biz.descripcion) {
                        <p class="small text-muted mb-2">{{ biz.descripcion.substring(0,100) }}{{ biz.descripcion.length > 100 ? '...' : '' }}</p>
                      }
                      <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted"><i class="bi bi-geo-alt"></i> {{ biz.distrito }}</small>
                        @if (biz.puntuacion_promedio > 0) {
                          <small class="text-warning"><i class="bi bi-star-fill"></i> {{ biz.puntuacion_promedio }}</small>
                        }
                      </div>
                    </div>
                  </div>
                </a>
              </div>
            }
          </div>
        }
      </div>
    </section>

    <section class="py-5" style="background:linear-gradient(135deg,#6f42c1 0%,#4f0baa 100%)">
      <div class="container text-center text-white py-4">
        <h3 class="fw-bold mb-3">¿Eres emprendedor?</h3>
        <p class="lead mb-4 opacity-90">Regístrate y lleva tu negocio al mundo digital</p>
        <a routerLink="/auth/register" class="btn btn-light btn-lg rounded-pill px-5 fw-semibold">Comenzar ahora</a>
      </div>
    </section>

    <button id="scroll-top-btn" class="btn btn-primary rounded-circle position-fixed bottom-0 end-0 m-4 d-none" style="width:44px;height:44px;z-index:1030" (click)="scrollToTop()">
      <i class="bi bi-arrow-up"></i>
    </button>
  `
})
export class HomeComponent implements OnInit {
  private router = inject(Router);
  private categoryService = inject(CategoryService);
  private businessService = inject(BusinessService);

  searchTerm = '';
  distrito = '';
  categoryIcons = ['bi-cup-hot', 'bi-palette', 'bi-handbag', 'bi-heart-pulse', 'bi-tools', 'bi-laptop', 'bi-book', 'bi-house', 'bi-compass'];

  categories = signal<any[]>([]);
  businesses = signal<any[]>([]);
  loadingBiz = signal(true);
  stats = signal({ negocios: 0, productos: 0, categorias: 0, valoraciones: 0 });

  ngOnInit(): void {
    this.loadCategories();
    this.loadFeatured();
    this.setupScrollListener();
  }

  search(): void {
    const params: any = {};
    if (this.searchTerm.trim()) params.busqueda = this.searchTerm.trim();
    if (this.distrito) params.distrito = this.distrito;
    this.router.navigate(['/directory'], { queryParams: params });
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (res: any) => {
        this.categories.set(res.items || res || []);
        if (res.items) this.stats.update(s => ({ ...s, categorias: res.items.length }));
      }
    });
  }

  private loadFeatured(): void {
    this.businessService.loadBusinesses({ size: 50, orden: 'reciente' }).subscribe({
      next: (res: any) => {
        const items = res.items || [];
        this.businesses.set(items);
        this.loadingBiz.set(false);
        this.stats.update(s => ({ ...s, negocios: res.total || items.length }));
        this.animateCounters(res.total || items.length);
      },
      error: () => this.loadingBiz.set(false)
    });
  }

  private animateCounters(total: number): void {
    let v = 0;
    const step = Math.max(1, Math.floor(total / 30));
    const iv = setInterval(() => {
      v += step;
      if (v >= total) { v = total; clearInterval(iv); }
      this.stats.update(s => ({ ...s, negocios: v }));
    }, 50);
  }

  private setupScrollListener(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', () => {
        const btn = document.getElementById('scroll-top-btn');
        if (btn) btn.classList.toggle('d-none', window.scrollY < 500);
      });
    }
  }
}
