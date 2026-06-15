import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CategoryService } from '../services/category.service';
import { FormsModule } from '@angular/forms';

const BADGES = ['Premium', 'Popular', 'Nuevo', 'Top', null, null, null, null, null];

const CATEGORY_IMAGES: Record<string, string> = {
  'Gastronomía': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
  'Textilería y Moda': 'https://images.unsplash.com/photo-1604681630513-69474a4e253f?w=800&q=80',
  'Servicios': 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80',
  'Tecnología': 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80',
  'Artesanía': 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80',
  'Turismo': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
  'Belleza': 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&q=80',
  'Agricultura': 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=800&q=80',
  'Hogar': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
};

const FALLBACK_DESCRIPTIONS: Record<string, string> = {
  'Gastronomía': 'Sabores auténticos del Valle del Mantaro.',
  'Textilería y Moda': 'Calidad de exportación con alma Huanca.',
  'Artesanía': 'Arte tradicional con diseño contemporáneo.',
  'Servicios': 'Expertos locales listos para ayudarte.',
  'Turismo': 'Descubre la magia del centro del Perú.',
  'Tecnología': 'Soluciones digitales de vanguardia.',
  'Belleza': 'Estilo y bienestar para tu día a día.',
  'Agricultura': 'Productos frescos directamente del campo.',
  'Hogar': 'Todo para hacer de tu casa un hogar.',
};

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <section class="py-5 text-center">
      <div class="container" style="max-width:720px">
        <h1 class="display-5 fw-black mb-3">Explora por Categorías</h1>
        <p class="lead text-secondary-emphasis mx-auto" style="max-width:560px">
          Encuentra lo mejor de Huancayo organizado por sectores comerciales. Impulsamos el crecimiento local conectándote con los mejores negocios.
        </p>
      </div>
    </section>

    <section class="pb-4">
      <div class="container" style="max-width:640px">
        <div class="position-relative">
          <i class="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-4 text-secondary-emphasis"></i>
          <input type="text" class="form-control rounded-4 border-outline-variant shadow-lg py-3 ps-5"
                 placeholder="¿Qué estás buscando hoy?" [(ngModel)]="searchTerm" (keydown.enter)="buscar()">
        </div>
      </div>
    </section>

    <section class="pb-5">
      <div class="container">
        <h2 class="fw-bold fs-4 mb-4 d-flex align-items-center gap-2">
          <i class="bi bi-stars text-primary"></i> Colecciones Destacadas
        </h2>
        <div class="row g-3 justify-content-center">
          @for (col of colecciones; track col.label) {
            <a class="col col-4 col-sm-3 col-lg-2 text-decoration-none" [routerLink]="col.link" [queryParams]="col.queryParams">
              <div class="col-item">
                <div class="col-icon-wrap"><i class="bi {{ col.icon }}"></i></div>
                <span>{{ col.label }}</span>
              </div>
            </a>
          }
        </div>
      </div>
    </section>

    @if (loading()) {
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div>
      </div>
    }

    @if (error()) {
      <div class="container pb-5">
        <div class="alert alert-danger">{{ error() }}</div>
      </div>
    }

    <section class="pb-5">
      <div class="container">
        <div class="row g-4">
          @for (cat of categories(); track cat.id_categoria; let idx = $index) {
            <a class="col-12 col-md-6 col-lg-4 cat-card text-decoration-none"
               [class.cat-card-featured]="idx === categories().length - 1"
               [routerLink]="['/directory']" [queryParams]="{ categoria: cat.id_categoria }">
              <div class="cat-card-img-wrap">
                <img [src]="getImage(cat.nombre)" [alt]="cat.nombre" loading="lazy">
              </div>
              <div class="cat-card-gradient"></div>
              <div class="cat-card-circle-img">
                <img [src]="'../../assets/img/categories/' + slugify(cat.nombre) + '.jpg'"
                     [alt]="cat.nombre" loading="lazy">
              </div>
              @if (idx === categories().length - 1) {
                <div class="cat-card-star"><i class="bi bi-star-fill"></i></div>
              }
              <div class="cat-card-content">
                <div class="d-flex align-items-center gap-2 mb-2">
                  @if (getBadge(idx); as badge) {
                    <span class="cat-badge" [class.cat-badge-featured]="badge === 'Top'">{{ badge }}</span>
                  }
                  <small class="cat-count">{{ cat.total_negocios }} negocios</small>
                </div>
                <h3>{{ cat.nombre }}</h3>
                <p>{{ getDescription(cat.nombre, cat.descripcion || null) }}</p>
              </div>
            </a>
          }
        </div>
      </div>
    </section>

    <section class="pb-5">
      <div class="container">
        <div class="rounded-4 p-5 text-center" style="background:#7c3aed">
          <h2 class="fw-bold text-white mb-3">¿Tienes un negocio en Huancayo?</h2>
          <p class="text-white opacity-75 mb-4 mx-auto" style="max-width:520px">
            Únete a la red empresarial más grande de la ciudad y aumenta tu visibilidad digital hoy mismo.
          </p>
          <a routerLink="/auth/register" class="btn btn-light btn-lg px-5 py-3 rounded-3 fw-semibold shadow">
            <i class="bi bi-plus-circle me-2"></i>Registrar mi Negocio
          </a>
        </div>
      </div>
    </section>
  `
})
export class CategoriesComponent implements OnInit, OnDestroy {
  private catService = inject(CategoryService);
  private router = inject(Router);

  categories = this.catService.categories;
  loading = this.catService.loading;
  error = this.catService.error;
  searchTerm = '';

  readonly colecciones = [
    { icon: 'bi-shop', label: 'Picanterías', link: '/directory', queryParams: { busqueda: 'Gastronomía' } },
    { icon: 'bi-palette', label: 'Artesanías', link: '/directory', queryParams: { busqueda: 'Artesanía' } },
    { icon: 'bi-basket', label: 'Mercados', link: '/directory', queryParams: {} },
    { icon: 'bi-cup-hot', label: 'Cafeterías', link: '/directory', queryParams: { busqueda: 'Café' } },
    { icon: 'bi-tools', label: 'Técnicos', link: '/directory', queryParams: { busqueda: 'Servicios' } },
    { icon: 'bi-grid-3x3-gap', label: 'Ver Todo', link: '/directory', queryParams: {} },
  ];

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.catService.getCategories().pipe(takeUntil(this.destroy$)).subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  buscar(): void {
    const q = this.searchTerm.trim();
    if (q) {
      this.router.navigate(['/directory'], { queryParams: { busqueda: q } });
    }
  }

  getImage(nombre: string): string {
    return CATEGORY_IMAGES[nombre] || `https://picsum.photos/seed/${encodeURIComponent(nombre)}/800/600`;
  }

  getBadge(index: number): string | null {
    return BADGES[index % BADGES.length];
  }

  getDescription(nombre: string, descripcion: string | null): string {
    return descripcion || FALLBACK_DESCRIPTIONS[nombre] || 'Descubre los mejores emprendimientos locales.';
  }

  slugify(nombre: string): string {
    const map: Record<string, string> = {
      'Gastronomía': 'gastronomia',
      'Textilería y Moda': 'textileria',
      'Artesanía': 'artesania',
      'Servicios': 'servicios',
      'Turismo': 'turismo',
      'Tecnología': 'tecnologia',
      'Belleza': 'belleza',
      'Agricultura': 'agricultura',
      'Hogar': 'hogar',
    };
    return map[nombre] || nombre.toLowerCase().replace(/[^a-záéíóúñ0-9]+/g, '');
  }
}
