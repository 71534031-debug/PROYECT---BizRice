import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { BusinessService } from '../services/business.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-business-profile',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    @if (loading()) {
      <div class="container py-4">
        <div class="skeleton" style="height:300px;border-radius:12px;margin-bottom:1.5rem"></div>
        <div class="row g-4">
          <div class="col-lg-8">
            <div class="skeleton" style="height:200px;border-radius:12px;margin-bottom:1rem"></div>
            <div class="skeleton" style="height:300px;border-radius:12px"></div>
          </div>
          <div class="col-lg-4">
            <div class="skeleton" style="height:250px;border-radius:12px;margin-bottom:1rem"></div>
            <div class="skeleton" style="height:200px;border-radius:12px"></div>
          </div>
        </div>
      </div>
    }

    @if (errorMsg()) {
      <div class="container py-4"><div class="alert alert-danger">{{ errorMsg() }}</div></div>
    }

    @if (biz(); as b) {
      <div class="hero-profile position-relative" style="height:300px;overflow:hidden">
        @if (b.imagen_portada_url) {
          <img [src]="b.imagen_portada_url" class="w-100 h-100 object-cover" [alt]="b.nombre" [attr.loading]="'lazy'">
        } @else {
          <div class="img-placeholder w-100 h-100 d-flex align-items-center justify-content-center"><i class="bi bi-shop fs-1"></i></div>
        }
        <div class="position-absolute bottom-0 start-0 w-100 text-white p-4" style="background:linear-gradient(transparent,rgba(0,0,0,0.7))">
          <div class="container">
            <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
              <span class="badge" [class.bg-primary]="true" style="background:var(--bizrise-primary)">{{ b.categoria?.nombre || b.categoria }}</span>
              @if (b.estado_verificacion === 'aprobado') {
                <span class="badge bg-success"><i class="bi bi-check-circle"></i> Verificado</span>
              }
              @if (b.esta_abierto) {
                <span class="badge-abierto"><span class="dot"></span> Abierto ahora</span>
              } @else {
                <span class="badge-cerrado"><i class="bi bi-lock"></i> Cerrado</span>
              }
            </div>
            <h2 class="fw-bold mb-0 mt-1">{{ b.nombre }}</h2>
            <div class="d-flex align-items-center gap-2">
              <span class="stars">
                @for (s of [1,2,3,4,5]; track s) {
                  <i class="bi" [class.bi-star-fill]="s <= (b.puntuacion_promedio || 0)" [class.bi-star]="s > (b.puntuacion_promedio || 0)" style="color:#ffc107"></i>
                }
              </span>
              <small>{{ b.puntuacion_promedio?.toFixed(1) }} ({{ b.total_valoraciones }} reseñas)</small>
            </div>
          </div>
        </div>
      </div>

      <div class="container py-4">
        <div class="row g-4">
          <div class="col-lg-8">
            <div class="card border-0 shadow-sm mb-4">
              <div class="card-body">
                <h5 class="fw-bold mb-3"><i class="bi bi-info-circle"></i> Nuestra Historia</h5>
                <p class="text-muted mb-0">{{ b.descripcion || 'Sin descripción' }}</p>
              </div>
            </div>

            <div class="card border-0 shadow-sm mb-4">
              <div class="card-body">
                <h5 class="fw-bold mb-3"><i class="bi bi-box-seam"></i> Productos</h5>
                @if (products().length === 0) {
                  <p class="text-muted small">No hay productos disponibles.</p>
                }
                <div class="row g-3">
                  @for (p of products(); track p.id_producto) {
                    <div class="col-6 col-md-4">
                      <div class="card border-0 shadow-sm h-100">
                        @if (p.imagen_url) {
                          <img [src]="p.imagen_url" class="card-img-top product-img" [alt]="p.nombre" style="height:120px;object-fit:cover" [attr.loading]="'lazy'">
                        } @else {
                          <div class="img-placeholder" style="height:120px"><i class="bi bi-box"></i></div>
                        }
                        <div class="card-body p-2">
                          <small class="fw-semibold d-block">{{ p.nombre }}</small>
                          <small class="text-muted">{{ p.precio ? ('S/ ' + p.precio.toFixed(2)) : 'Consultar precio' }}</small>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>

            <div class="card border-0 shadow-sm mb-4">
              <div class="card-body">
                <h5 class="fw-bold mb-3"><i class="bi bi-star"></i> Reseñas</h5>
                @if (reviewData(); as rd) {
                  <div class="d-flex align-items-start gap-4 mb-4 p-3 bg-light rounded flex-wrap">
                    <div class="text-center">
                      <h2 class="fw-bold mb-0 text-warning">{{ rd.puntuacion_promedio?.toFixed(1) }}</h2>
                      <div>
                        @for (s of [1,2,3,4,5]; track s) {
                          <i class="bi" [class.bi-star-fill]="s <= (rd.puntuacion_promedio || 0)" [class.bi-star]="s > (rd.puntuacion_promedio || 0)" style="color:#ffc107;font-size:0.8rem"></i>
                        }
                      </div>
                      <small class="d-block text-muted">{{ rd.total }} reseñas</small>
                    </div>
                    <div class="flex-grow-1" style="min-width:180px">
                      @for (star of [5,4,3,2,1]; track star) {
                        <div class="star-bar-track">
                          <span class="star-bar-label">{{ star }} <i class="bi bi-star-fill" style="color:#ffc107;font-size:0.6rem"></i></span>
                          <div class="star-bar">
                            <div class="star-bar-fill" [style.width.%]="getStarPercent(rd, star)"></div>
                          </div>
                          <small class="text-muted" style="min-width:24px;font-size:0.7rem">{{ rd.distribucion_estrellas?.[star] || 0 }}</small>
                        </div>
                      }
                    </div>
                  </div>

                  <div id="resenas-lista">
                    @for (r of rd.items; track r.id_comentario) {
                      <div class="border-bottom pb-3 mb-3">
                        <div class="d-flex align-items-center gap-2 mb-1">
                          <strong class="small">{{ r.usuario?.nombre || 'Anónimo' }}</strong>
                          <span class="text-warning small">
                            @for (s of [1,2,3,4,5]; track s) {
                              <i class="bi" [class.bi-star-fill]="s <= r.puntuacion" [class.bi-star]="s > r.puntuacion" style="font-size:0.7rem"></i>
                            }
                          </span>
                        </div>
                        <p class="small text-muted mb-0">{{ r.contenido }}</p>
                      </div>
                    } @empty {
                      <p class="text-muted small">No hay reseñas aún. ¡Sé el primero!</p>
                    }
                  </div>
                }

                @if (authService.isLoggedIn) {
                  <div id="review-form-section" class="mt-4">
                    <h6 class="fw-bold mb-2">Deja tu reseña</h6>
                    <div class="mb-2 star-rating" style="cursor:pointer">
                      @for (s of [1,2,3,4,5]; track s) {
                        <i class="bi fs-4" [class.bi-star-fill]="s <= newRating" [class.bi-star]="s > newRating" style="color:#ffc107" (click)="newRating = s"></i>
                      }
                    </div>
                    <textarea class="form-control mb-2" rows="3" placeholder="Cuéntanos tu experiencia (mín. 10 caracteres)" [(ngModel)]="reviewContent"></textarea>
                    @if (reviewError()) {
                      <div class="alert alert-danger py-2 small">{{ reviewError() }}</div>
                    }
                    <button class="btn btn-primary btn-sm" (click)="submitReview()" [disabled]="submittingReview() || newRating < 1 || reviewContent.trim().length < 10">
                      @if (submittingReview()) {
                        <span class="btn-spinner"></span>
                      }
                      <i class="bi bi-send"></i> Publicar Reseña
                    </button>
                  </div>
                } @else {
                  <div id="review-login-msg" class="mt-4 p-3 bg-light rounded text-center">
                    <p class="small text-muted mb-2">Inicia sesión para dejar una reseña</p>
                    <a routerLink="/auth/login" class="btn btn-primary btn-sm rounded-pill px-4">
                      <i class="bi bi-box-arrow-in-right"></i> Iniciar Sesión
                    </a>
                  </div>
                }
              </div>
            </div>
          </div>

          <div class="col-lg-4">
            <div class="card border-0 shadow-sm mb-4">
              <div class="card-body">
                <h6 class="fw-bold mb-3"><i class="bi bi-telephone"></i> Contacto</h6>
                @if (b.telefono) {
                  <a [href]="'https://wa.me/51' + b.telefono.replace(/[^0-9]/g,'')" target="_blank" class="btn btn-success btn-sm w-100 mb-2">
                    <i class="bi bi-whatsapp"></i> WhatsApp
                  </a>
                  <p class="small text-muted mb-1"><i class="bi bi-telephone"></i> {{ b.telefono }}</p>
                }
                @if (b.horario_apertura) {
                  <p class="small text-muted mb-1"><i class="bi bi-clock"></i> {{ b.horario_apertura }} - {{ b.horario_cierre || '?' }}</p>
                }
                <div id="redes-container">
                  @for (r of (b.redes_sociales || []); track r.plataforma) {
                    <a [href]="r.url" target="_blank" class="btn btn-outline-secondary btn-sm w-100 mb-1 d-flex align-items-center gap-2">
                      <i class="bi" [class.bi-facebook]="r.plataforma=='facebook'" [class.bi-instagram]="r.plataforma=='instagram'"
                         [class.bi-whatsapp]="r.plataforma=='whatsapp'" [class.bi-tiktok]="r.plataforma=='tiktok'"
                         [class.bi-globe]="!['facebook','instagram','whatsapp','tiktok'].includes(r.plataforma)"></i>
                      {{ r.plataforma }}
                    </a>
                  }
                </div>
              </div>
            </div>

            <div class="card border-0 shadow-sm mb-4">
              <div class="card-body">
                <h6 class="fw-bold mb-3"><i class="bi bi-geo-alt"></i> Ubicación</h6>
                <p class="small text-muted mb-1">{{ b.direccion || 'Dirección no especificada' }}</p>
                <p class="small text-muted mb-2"><i class="bi bi-geo-alt"></i> {{ b.distrito || 'Huancayo' }}</p>
                @if (b.direccion) {
                  <a [href]="'https://maps.google.com/?q=' + encodeURI(b.direccion + ', ' + (b.distrito || 'Huancayo'))" target="_blank" class="btn btn-outline-primary btn-sm w-100">
                    <i class="bi bi-map"></i> Ver en Google Maps
                  </a>
                }
              </div>
            </div>

            @if (b.promociones_activas && b.promociones_activas.length > 0) {
              <div class="card border-0 shadow-sm mb-4" style="background:linear-gradient(135deg,#6f42c1,#4f0baa);color:#fff">
                <div class="card-body">
                  <h6 class="fw-bold mb-3"><i class="bi bi-megaphone"></i> Promociones</h6>
                  @for (p of b.promociones_activas; track p.id_promocion) {
                    <div class="mb-2">
                      <strong class="small">{{ p.titulo }}</strong>
                      @if (p.descripcion) { <p class="small opacity-75 mb-0">{{ p.descripcion }}</p> }
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      @if (b.telefono) {
        <a [href]="'https://wa.me/51' + b.telefono.replace(/[^0-9]/g,'')" target="_blank" class="whatsapp-float" title="Contactar por WhatsApp">
          <i class="bi bi-whatsapp"></i>
        </a>
      }
    }
  `
})
export class BusinessProfileComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private businessService = inject(BusinessService);
  authService = inject(AuthService);
  private toast = inject(ToastService);

  private sub?: Subscription;

  biz = this.businessService.selectedBusiness;
  loading = this.businessService.businessLoading;
  errorMsg = signal<string | null>(null);
  products = this.businessService.products;
  reviewData = this.businessService.reviews;

  newRating = 0;
  reviewContent = '';
  submittingReview = signal(false);
  reviewError = signal<string | null>(null);

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (!id) { this.errorMsg.set('ID de negocio inválido'); return; }
      this.businessService.loadBusinessById(id).subscribe({
        error: (err) => this.errorMsg.set(err.error?.detail || 'Error al cargar')
      });
      this.businessService.loadBusinessProducts(id).subscribe();
      this.businessService.loadReviews(id).subscribe();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.businessService.clearSelectedBusiness();
  }

  encodeURI(v: string): string {
    return encodeURIComponent(v);
  }

  getStarPercent(rd: any, star: number): number {
    const total = rd.total || 1;
    const count = rd.distribucion_estrellas?.[star] || 0;
    return (count / total) * 100;
  }

  submitReview(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.reviewError.set(null);
    if (this.newRating < 1) { this.reviewError.set('Selecciona una puntuación'); return; }
    if (this.reviewContent.trim().length < 10) { this.reviewError.set('La reseña debe tener al menos 10 caracteres'); return; }
    this.submittingReview.set(true);
    this.businessService.createReview(id, this.reviewContent.trim(), this.newRating).subscribe({
      next: () => {
        this.submittingReview.set(false);
        this.newRating = 0;
        this.reviewContent = '';
        this.toast.success('Reseña publicada con éxito');
        this.businessService.loadReviews(id).subscribe();
      },
      error: (err) => {
        this.submittingReview.set(false);
        this.reviewError.set(err.error?.detail || 'Error al publicar reseña');
      }
    });
  }
}
