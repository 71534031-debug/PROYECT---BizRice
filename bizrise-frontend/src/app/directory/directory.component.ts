import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { BusinessService } from '../services/business.service';
import { CategoryService } from '../services/category.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-directory',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, RouterLink],
  template: `
    <div class="container py-4">
      <div class="row">
        <aside class="col-lg-3 mb-4">
          <div class="card shadow-sm border-0 sticky-top" style="top:80px">
            <div class="card-body">
              <h6 class="fw-bold mb-3"><i class="bi bi-funnel"></i> Filtros</h6>

              <label class="form-label small fw-semibold">Buscar</label>
              <input type="text" class="form-control mb-3" placeholder="¿Qué buscas?" [formControl]="searchControl">

              <label class="form-label small fw-semibold">Categoría</label>
              <div class="mb-3" id="filter-categorias">
                @for (cat of categories(); track cat.id_categoria) {
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" [id]="'cat-' + cat.id_categoria"
                           [checked]="selectedCats.has(cat.id_categoria)"
                           (change)="toggleCategory(cat.id_categoria)">
                    <label class="form-check-label small" [for]="'cat-' + cat.id_categoria">
                      {{ cat.nombre }} <span class="text-muted">({{ cat.total_negocios || 0 }})</span>
                    </label>
                  </div>
                }
              </div>

              <label class="form-label small fw-semibold">Distrito</label>
              <select class="form-select mb-3" [(ngModel)]="selectedDistrito" (change)="onFilterChange()">
                <option value="">Todos</option>
                <option value="Huancayo">Huancayo</option>
                <option value="El Tambo">El Tambo</option>
                <option value="Chilca">Chilca</option>
                <option value="San Agustín">San Agustín</option>
                <option value="Pilcomayo">Pilcomayo</option>
              </select>

              <label class="form-label small fw-semibold">Ordenar por</label>
              <select class="form-select mb-3" [(ngModel)]="selectedOrden" (change)="onFilterChange()">
                <option value="reciente">Más recientes</option>
                <option value="valoracion">Mejor valorados</option>
                <option value="nombre">A - Z</option>
              </select>

              <button class="btn btn-outline-secondary w-100 btn-sm" (click)="clearFilters()">
                <i class="bi bi-eraser"></i> Limpiar filtros
              </button>
            </div>
          </div>
        </aside>

        <main class="col-lg-9">
          <div class="d-flex justify-content-between align-items-center mb-3">
            @if (!loading()) {
              <span class="result-count-badge">
                <i class="bi bi-shop"></i>
                {{ total() }} negocio{{ total() !== 1 ? 's' : '' }} encontrado{{ total() !== 1 ? 's' : '' }}
              </span>
            } @else {
              <span class="result-count-badge placeholder-glow">
                <span class="placeholder col-4"></span>
              </span>
            }
          </div>

          @if (loading()) {
            <div class="row g-3">
              @for (sk of [1,2,3,4,5,6]; track sk) {
                <div class="col-md-6 col-xl-4 fade-in-delay-{{ sk > 3 ? 3 : sk }}">
                  <div class="skeleton-card shadow-sm">
                    <div class="skeleton-img"></div>
                    <div class="p-3">
                      <div class="skeleton-line" style="width:40%"></div>
                      <div class="skeleton-line" style="width:80%"></div>
                      <div class="skeleton-line" style="width:60%"></div>
                      <div class="skeleton-line" style="width:30%"></div>
                    </div>
                  </div>
                </div>
              }
            </div>
          }

          @if (error(); as err) {
            <div class="alert alert-danger">{{ err }}</div>
          }

          @if (!loading() && businesses().length === 0 && !error()) {
            <div class="empty-state">
              <i class="bi bi-search empty-state-icon"></i>
              <h5>No encontramos negocios con esos filtros</h5>
              <p>Intenta cambiar los filtros o limpiar la búsqueda para ver más resultados.</p>
              <button class="btn btn-primary" (click)="clearFilters()">
                <i class="bi bi-eraser"></i> Limpiar búsqueda
              </button>
            </div>
          }

          <div class="row g-3" id="directorio-grid">
            @for (biz of businesses(); track biz.id_emprendimiento) {
              <div class="col-md-6 col-xl-4 fade-in">
                <div class="card h-100 shadow-sm business-card">
                  @if (biz.imagen_portada_url) {
                    <img [src]="biz.imagen_portada_url" class="card-img-top" style="height:140px;object-fit:cover" [alt]="biz.nombre" [attr.loading]="'lazy'">
                  } @else {
                    <div class="img-placeholder" style="height:140px"><i class="bi bi-shop"></i></div>
                  }
                  <div class="card-body d-flex flex-column">
                    <span class="badge bg-primary bg-opacity-10 text-primary mb-1 align-self-start">{{ biz.categoria }}</span>
                    <h6 class="fw-bold mb-1" [innerHTML]="highlightText(biz.nombre)"></h6>
                    @if (biz.descripcion) {
                      <p class="small text-muted mb-2 flex-grow-1" [innerHTML]="highlightText(biz.descripcion.length > 100 ? (biz.descripcion.substring(0,100) + '...') : biz.descripcion)"></p>
                    }
                    <div class="d-flex justify-content-between align-items-center mt-auto">
                      <small class="text-muted"><i class="bi bi-geo-alt"></i> {{ biz.distrito || 'Huancayo' }}</small>
                      @if (biz.puntuacion_promedio > 0) {
                        <small class="text-warning"><i class="bi bi-star-fill"></i> {{ biz.puntuacion_promedio.toFixed(1) }} ({{ biz.total_valoraciones }})</small>
                      }
                    </div>
                    <a [routerLink]="'/business/' + biz.id_emprendimiento" class="btn btn-outline-primary btn-sm mt-2 w-100">Ver Perfil</a>
                  </div>
                </div>
              </div>
            }
          </div>

          @if (pages() > 1) {
            <nav class="mt-4">
              <ul class="pagination justify-content-center">
                <li class="page-item" [class.disabled]="page() <= 1">
                  <button class="page-link" (click)="goToPage(page() - 1)"><i class="bi bi-chevron-left"></i></button>
                </li>
                @for (p of getPageArray(); track p) {
                  <li class="page-item" [class.active]="page() === p">
                    <button class="page-link" (click)="goToPage(p)">{{ p }}</button>
                  </li>
                }
                <li class="page-item" [class.disabled]="page() >= pages()">
                  <button class="page-link" (click)="goToPage(page() + 1)"><i class="bi bi-chevron-right"></i></button>
                </li>
              </ul>
            </nav>
          }
        </main>
      </div>
    </div>
  `
})
export class DirectoryComponent implements OnInit, OnDestroy {
  private businessService = inject(BusinessService);
  private categoryService = inject(CategoryService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  searchControl = new FormControl('');
  private searchSub?: Subscription;
  private querySub?: Subscription;

  businesses = this.businessService.businesses;
  loading = this.businessService.loading;
  error = this.businessService.error;
  total = this.businessService.total;
  pages = this.businessService.pages;

  categories = signal<any[]>([]);
  page = signal(1);
  selectedCats = new Set<number>();
  selectedDistrito = '';
  selectedOrden = 'reciente';
  currentParams: Record<string, string> = {};

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe({
      next: (res: any) => this.categories.set(res.items || res || [])
    });

    this.querySub = this.route.queryParams.subscribe(params => {
      this.currentParams = { ...params };
      if (params['busqueda']) this.searchControl.setValue(params['busqueda'], { emitEvent: false });
      if (params['categoria']) {
        const ids = String(params['categoria']).split(',').map(Number);
        ids.forEach(id => this.selectedCats.add(id));
      }
      if (params['distrito']) this.selectedDistrito = params['distrito'];
      if (params['orden']) this.selectedOrden = params['orden'];
      if (params['page']) this.page.set(Number(params['page']));
      this.loadBusinesses();
    });

    this.searchSub = this.searchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(value => {
      this.page.set(1);
      this.updateUrl({ busqueda: value || '', page: '1' });
    });
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
    this.querySub?.unsubscribe();
  }

  toggleCategory(id: number): void {
    if (this.selectedCats.has(id)) this.selectedCats.delete(id);
    else this.selectedCats.add(id);
    this.page.set(1);
    this.updateUrl({ categoria: [...this.selectedCats].join(','), page: '1' });
  }

  onFilterChange(): void {
    this.page.set(1);
    this.updateUrl({ distrito: this.selectedDistrito, orden: this.selectedOrden, page: '1' });
  }

  clearFilters(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.selectedCats.clear();
    this.selectedDistrito = '';
    this.selectedOrden = 'reciente';
    this.page.set(1);
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.pages()) return;
    this.updateUrl({ page: String(p) });
  }

  getPageArray(): number[] {
    const arr: number[] = [];
    const total = this.pages();
    const cur = this.page();
    const start = Math.max(1, cur - 2);
    const end = Math.min(total, cur + 2);
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }

  private updateUrl(newParams: Record<string, string>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ...this.currentParams, ...newParams },
      queryParamsHandling: 'merge'
    });
  }

  private loadBusinesses(): void {
    const cleanParams: Record<string, string> = {};
    for (const [key, val] of Object.entries(this.currentParams)) {
      if (val !== '' && val !== null && val !== undefined) cleanParams[key] = val;
    }
    this.page.set(Number(cleanParams['page']) || 1);
    this.businessService.loadBusinesses(cleanParams as any).subscribe();
  }

  private escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  highlightText(text: string): string {
    const term = this.currentParams['busqueda'] || this.searchControl.value || '';
    const safe = this.escapeHtml(text);
    if (!term.trim()) return safe;
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return safe.replace(regex, '<span class="search-highlight">$1</span>');
  }
}
