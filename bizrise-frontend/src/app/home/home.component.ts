import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, AfterViewInit, NgZone, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../services/category.service';
import { BusinessService } from '../services/business.service';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Swiper from 'swiper';
import { Autoplay, Pagination } from 'swiper/modules';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="marquee-banner">
      <div class="marquee-track">
        <span class="marquee-text">Apoya el comercio local de Huancayo &nbsp;·&nbsp; Nuevos negocios cada semana &nbsp;·&nbsp; Encuentra emprendedores cerca de ti &nbsp;·&nbsp;</span>
        <span class="marquee-text">Apoya el comercio local de Huancayo &nbsp;·&nbsp; Nuevos negocios cada semana &nbsp;·&nbsp; Encuentra emprendedores cerca de ti &nbsp;·&nbsp;</span>
      </div>
    </div>
    <section #heroSection class="hero-section text-white position-relative overflow-hidden">
      <div class="hero-bg" aria-hidden="true"></div>
      <div class="hero-gradient-overlay"></div>
      <div class="container position-relative z-1 text-center text-white py-5">
        <h1 class="display-4 fw-black mb-4">
          @for (w of heroWords; track w; let i = $index) {
            <span class="word-reveal" [style.--i]="i">{{ w }}&nbsp;</span>
          }
        </h1>
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
                  <button class="magnetic-btn btn btn-primary px-4 py-2 rounded-3 w-100 fw-semibold" (click)="search()">
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

    <section #comoFuncionaSection class="py-5 bg-light position-relative overflow-hidden" id="como-funciona">
      <div class="container">
        <h3 class="fw-bold mb-4 text-center como-funciona-title">¿Cómo funciona?</h3>
        <div class="row g-4 como-funciona-row">
          <div class="col-md-4">
            <div class="card border-0 shadow-sm text-center h-100 como-funciona-card">
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
            <div class="card border-0 shadow-sm text-center h-100 como-funciona-card">
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
            <div class="card border-0 shadow-sm text-center h-100 como-funciona-card">
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
                      <span class="badge bg-primary text-white mb-2">{{ biz.categoria }}</span>
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

    <section class="py-5 bg-light testimonials-section">
      <div class="container">
        <h3 class="fw-bold mb-4 text-center">Lo que dicen nuestros usuarios</h3>
        <div class="swiper testimonials-swiper">
          <div class="swiper-wrapper">
            <div class="swiper-slide">
              <div class="card border-0 shadow-sm text-center p-4 h-100">
                <i class="bi bi-star-fill text-warning fs-5 mb-2"></i>
                <p class="text-muted small mb-3">&quot;Gracias a BizRise mi negocio ahora es conocido en todo Huancayo. ¡Recomendado!&quot;</p>
                <h6 class="fw-bold mb-0">&mdash; Carlos M.</h6>
                <small class="text-muted">Artesano textil, El Tambo</small>
              </div>
            </div>
            <div class="swiper-slide">
              <div class="card border-0 shadow-sm text-center p-4 h-100">
                <i class="bi bi-star-fill text-warning fs-5 mb-2"></i>
                <p class="text-muted small mb-3">&quot;Encontré al emprendedor perfecto para mis proyectos. La plataforma es muy fácil de usar.&quot;</p>
                <h6 class="fw-bold mb-0">&mdash; Lucía R.</h6>
                <small class="text-muted">Diseñadora, Huancayo</small>
              </div>
            </div>
            <div class="swiper-slide">
              <div class="card border-0 shadow-sm text-center p-4 h-100">
                <i class="bi bi-star-fill text-warning fs-5 mb-2"></i>
                <p class="text-muted small mb-3">&quot;Excelente iniciativa para impulsar la economía local. Descubrir nuevos emprendedores cada semana es genial.&quot;</p>
                <h6 class="fw-bold mb-0">&mdash; Pedro G.</h6>
                <small class="text-muted">Cliente recurrente, Chilca</small>
              </div>
            </div>
          </div>
          <div class="swiper-pagination"></div>
        </div>
      </div>
    </section>

    <section class="py-5" style="background:linear-gradient(135deg,#6f42c1 0%,#4f0baa 100%)">
      <div class="container text-center text-white py-4">
        <h3 class="fw-bold mb-3">¿Eres emprendedor?</h3>
        <p class="lead mb-4 opacity-90">Regístrate y lleva tu negocio al mundo digital</p>
        <a routerLink="/auth/register" class="magnetic-btn btn btn-light btn-lg rounded-pill px-5 fw-semibold">Comenzar ahora</a>
      </div>
    </section>

    <button id="scroll-top-btn" class="btn btn-primary rounded-circle position-fixed bottom-0 end-0 m-4 d-none" style="width:44px;height:44px;z-index:1030" (click)="scrollToTop()">
      <i class="bi bi-arrow-up"></i>
    </button>
  `
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  private router = inject(Router);
  private categoryService = inject(CategoryService);
  private businessService = inject(BusinessService);
  private ngZone = inject(NgZone);

  searchTerm = '';
  distrito = '';
  categoryIcons = ['bi-cup-hot', 'bi-palette', 'bi-handbag', 'bi-heart-pulse', 'bi-tools', 'bi-laptop', 'bi-book', 'bi-house', 'bi-compass'];

  categories = signal<any[]>([]);
  businesses = signal<any[]>([]);
  loadingBiz = signal(true);
  stats = signal({ negocios: 0, productos: 0, categorias: 0, valoraciones: 0 });

  heroWords = 'Descubre emprendedores locales en Huancayo'.split(' ');
  private statTargets = { negocios: 0, productos: 12, categorias: 8, valoraciones: 45 };
  private scrollTriggers: any[] = [];
  private observers: IntersectionObserver[] = [];
  private swiperInstance: any;
  private counted = false;

  ngOnInit(): void {
    this.loadCategories();
    this.loadFeatured();
    this.setupScrollListener();
  }

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);
    this.ngZone.runOutsideAngular(() => {
      this.initHeroAnimations();
      this.initTiltCards();
      this.initMaskReveal();
      this.initScrollCounters();
      this.initMagneticButtons();
      this.initComoFunciona();
      this.initTestimonialsSwiper();
    });
  }

  ngOnDestroy(): void {
    this.scrollTriggers.forEach(t => t.kill?.());
    this.observers.forEach(o => o.disconnect());
    this.swiperInstance?.destroy?.();
  }

  private initHeroAnimations(): void {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    this.heroParallax();
    this.heroSplitText();
  }

  private heroParallax(): void {
    const bg = document.querySelector('.hero-bg');
    if (!bg) return;
    const st = gsap.to(bg, {
      y: '12%',
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero-section',
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
      },
    });
    this.scrollTriggers.push(st?.scrollTrigger);
  }

  private heroSplitText(): void {
    const words = document.querySelectorAll<HTMLElement>('.word-reveal');
    if (!words.length) return;
    gsap.from(words, {
      opacity: 0,
      y: 30,
      rotateX: -50,
      stagger: 0.04,
      duration: 0.7,
      ease: 'power3.out',
    });
  }

  /* Feature 5 — Tilt 3D */
  private initTiltCards(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cards = document.querySelectorAll<HTMLElement>('.card-hover');
    cards.forEach(card => {
      card.addEventListener('mousemove', (e: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        gsap.to(card, {
          rotationX: ((y - centerY) / centerY) * -6,
          rotationY: ((x - centerX) / centerX) * 6,
          transformPerspective: 1000,
          duration: 0.3,
          ease: 'power2.out',
        });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, { rotationX: 0, rotationY: 0, duration: 0.4, ease: 'power2.out' });
      });
    });
  }

  /* Feature 6 — Mask reveal */
  private initMaskReveal(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const images = document.querySelectorAll<HTMLElement>('.card-img-top');
    if (!images.length) return;
    gsap.set(images, { clipPath: 'inset(0 0 0 100%)' });
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          gsap.to(entry.target, { clipPath: 'inset(0 0 0 0%)', duration: 0.8, ease: 'power3.out' });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    images.forEach(img => observer.observe(img));
    this.observers.push(observer);
  }

  /* Feature 7 — Scroll-triggered counters */
  private initScrollCounters(): void {
    const el = document.getElementById('hero-stats');
    if (!el) return;
    this.stats.set({ negocios: 0, productos: 0, categorias: 0, valoraciones: 0 });
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !this.counted) {
        this.counted = true;
        this.ngZone.run(() => this.animateAllCounters());
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    observer.observe(el);
    this.observers.push(observer);
  }

  private animateAllCounters(): void {
    const t = this.statTargets;
    const values = { negocios: 0, productos: 0, categorias: 0, valoraciones: 0 };
    const steps = {
      negocios: Math.max(1, Math.floor(t.negocios / 30)),
      productos: Math.max(1, Math.floor(t.productos / 30)),
      categorias: Math.max(1, Math.floor(t.categorias / 30)),
      valoraciones: Math.max(1, Math.floor(t.valoraciones / 30)),
    };
    const iv = setInterval(() => {
      let done = 0;
      (['negocios', 'productos', 'categorias', 'valoraciones'] as const).forEach(k => {
        if (values[k] >= t[k]) { values[k] = t[k]; done++; return; }
        values[k] = Math.min(values[k] + steps[k], t[k]);
      });
      this.stats.set({ ...values });
      if (done === 4) clearInterval(iv);
    }, 50);
  }

  /* Feature 8 — Magnetic buttons */
  private initMagneticButtons(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const btns = document.querySelectorAll<HTMLElement>('.magnetic-btn');
    btns.forEach(btn => {
      btn.addEventListener('mousemove', (e: MouseEvent) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(btn, { x: x * 0.3, y: y * 0.3, duration: 0.4, ease: 'power2.out' });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'power2.out' });
      });
    });
  }

  /* Feature 9 — Testimonials Swiper */
  private initTestimonialsSwiper(): void {
    const el = document.querySelector('.testimonials-swiper');
    if (!el) return;
    this.swiperInstance = new Swiper(el as HTMLElement, {
      modules: [Autoplay, Pagination],
      loop: true,
      autoplay: { delay: 4000, disableOnInteraction: false },
      pagination: { el: '.swiper-pagination', clickable: true },
      grabCursor: true,
      breakpoints: {
        0: { slidesPerView: 1, spaceBetween: 16 },
        768: { slidesPerView: 2, spaceBetween: 20 },
        992: { slidesPerView: 3, spaceBetween: 24 },
      },
    });
  }

  /* Feature 10 — Cómo funciona pin + reveal */
  private initComoFunciona(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cards = document.querySelectorAll<HTMLElement>('.como-funciona-card');
    if (!cards.length) return;
    const title = document.querySelector<HTMLElement>('.como-funciona-title');
    if (title) {
      gsap.from(title, {
        opacity: 0,
        y: 30,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '#como-funciona',
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      });
    }
    gsap.from(cards, {
      opacity: 0,
      y: 50,
      stagger: 0.15,
      duration: 0.6,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '#como-funciona',
        start: 'top 75%',
        toggleActions: 'play none none none',
      },
    });
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
        const items = res.items || res || [];
        this.categories.set(items);
        this.statTargets.categorias = items.length || 8;
      }
    });
  }

  private loadFeatured(): void {
    this.businessService.loadBusinesses({ size: 50, orden: 'reciente' }).subscribe({
      next: (res: any) => {
        const items = res.items || [];
        this.businesses.set(items);
        this.loadingBiz.set(false);
        const total = res.total || items.length;
        this.statTargets.negocios = total;
        this.statTargets.productos = Math.round(total * 3.2);
        this.statTargets.valoraciones = Math.round(total * 4.5);
      },
      error: () => this.loadingBiz.set(false)
    });
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
