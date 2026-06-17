const CATEGORY_ICONS = [
  'bi-cup-hot', 'bi-tools', 'bi-palette', 'bi-briefcase', 'bi-airplane', 'bi-laptop'
];

const CATEGORY_IMAGES = {
  'Gastronomía': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80',
  'Textilería y Moda': 'https://images.unsplash.com/photo-1604681630513-69474a4e253f?w=400&q=80',
  'Artesanía': 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&q=80',
  'Servicios': 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&q=80',
  'Turismo': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80',
  'Tecnología': 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&q=80',
  'Belleza': 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&q=80',
  'Agricultura': 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=400&q=80',
  'Hogar': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80',
};

document.addEventListener('DOMContentLoaded', async () => {
  await loadComponent('navbar-container', '../../components/navbar/navbar.html');
  renderAuthSection();
  await loadComponent('footer-container', '../../components/footer/footer.html');

  const [catData, bizData] = await Promise.all([
    cargarCategorias(),
    cargarNegocios()
  ]);

  animarContadores(catData, bizData);
  initScrollTop();

  document.getElementById('hero-search-btn').addEventListener('click', buscarDesdeHero);
  document.getElementById('hero-search').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') buscarDesdeHero();
  });

  initScrollAnimations();
  initTestimoniosSwiper();
});

async function cargarCategorias() {
  try {
    const data = await apiGet('/categories');
    const grid = document.getElementById('categories-grid');
    if (!grid) return data;

    data.items.forEach((cat, index) => {
      const icono = CATEGORY_ICONS[index % CATEGORY_ICONS.length];
      const imgUrl = CATEGORY_IMAGES[cat.nombre] || `https://picsum.photos/seed/${encodeURIComponent(cat.nombre)}/400/400`;

      const col = document.createElement('div');
      col.className = 'col-4 col-md-2';
      const link = document.createElement('a');
      link.className = 'category-card-wrap';
      link.href = `/pages/directory/directory.html?categoria=${cat.id_categoria}`;
      const count = cat.total_negocios || cat.business_count || 0;
      link.innerHTML = `
        <div class="category-card-img">
          <img src="${imgUrl}" alt="${escHtml(cat.nombre)}" loading="lazy">
          <div class="overlay"></div>
        </div>
        <span>${escHtml(cat.nombre)}</span>
        ${count > 0 ? `<small class="text-muted d-block text-center">${escHtml(count)} negocios</small>` : ''}
      `;
      col.appendChild(link);
      grid.appendChild(col);
    });

    return data;
  } catch (e) {
    console.error('Error cargando categorías:', e);
    return { items: [], total: 0 };
  }
}

async function cargarNegocios() {
  try {
    const data = await apiGet('/businesses?size=50&orden=reciente');

    const skeleton = document.getElementById('skeleton-grid');
    const grid = document.getElementById('negocios-grid');
    if (!grid) return data;

    if (skeleton) skeleton.classList.add('d-none');
    grid.classList.remove('d-none');

    if (!data.items || data.items.length === 0) {
      grid.innerHTML = '<div class="col-12"><p class="text-muted text-center">No hay negocios disponibles aún</p></div>';
      return data;
    }

    data.items.forEach((negocio, index) => {
      const col = document.createElement('div');
      col.className = 'col-md-4';
      const card = document.createElement('div');
      card.className = 'card business-card';
      card.style.transitionDelay = `${index * 0.05}s`;

      const rating = negocio.puntuacion_promedio || 0;
      const ratingDisplay = Number(rating).toFixed(1);

      card.innerHTML = `
        <div class="card-img-wrap">
          <img src="${imgSrc(negocio.imagen_portada_url, negocio.nombre)}" alt="${escHtml(negocio.nombre)}" loading="lazy">
          <div class="rating-badge">
            <i class="bi bi-star-fill"></i>
            <span>${escHtml(ratingDisplay)}</span>
          </div>
        </div>
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h5 class="card-title">${escHtml(negocio.nombre)}</h5>
            <span class="verified-tag">
              <i class="bi bi-patch-check-fill me-1" style="font-size:0.55rem"></i>Verificado
            </span>
          </div>
          <p class="card-text mb-3">${escHtml(truncate(negocio.descripcion, 90))}</p>
          <div class="info-row mb-3">
            <span><i class="bi bi-geo-alt"></i> ${escHtml(negocio.distrito || 'Huancayo')}</span>
            <span><i class="bi bi-clock"></i> ${negocio.esta_abierto ? 'Abierto' : 'Cerrado'}</span>
          </div>
          <div class="mt-auto">
            <a href="/pages/business-profile/business-profile.html?id=${negocio.id_emprendimiento}"
               class="btn btn-outline-primary w-100">Ver Perfil</a>
          </div>
        </div>
      `;
      col.appendChild(card);
      grid.appendChild(col);
    });

    setTimeout(() => {
      grid.querySelectorAll('.business-card').forEach(el => el.classList.add('revealed'));
    }, 200);

    initBizScroll(grid);

    return data;
  } catch (e) {
    console.error('Error cargando negocios:', e);
    const skeleton = document.getElementById('skeleton-grid');
    if (skeleton) skeleton.classList.add('d-none');
    const grid = document.getElementById('negocios-grid');
    if (grid) {
      grid.classList.remove('d-none');
      grid.innerHTML = '<div class="col-12"><p class="text-muted text-center">Error al cargar negocios</p></div>';
    }
    return { items: [], total: 0 };
  }
}

function animarContadores(catData, bizData) {
  const catCount = catData?.items?.length || 0;
  const bizTotal = bizData?.total || 0;

  let ratingCount = 0;
  if (bizData?.items) {
    bizData.items.forEach(b => { ratingCount += b.total_valoraciones || 0; });
  }
  const prodCount = Math.round(bizTotal * 6);

  animarNumero('counter-businesses', bizTotal, 1500);
  animarNumero('counter-products', prodCount, 1500);
  animarNumero('counter-categories', catCount, 1000);
  animarNumero('counter-ratings', ratingCount, 2000);
}

function animarNumero(id, target, duration) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  }
  requestAnimationFrame(step);
}

function initScrollTop() {
  const btn = document.getElementById('scroll-top-btn');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 500);
  });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function initBizScroll(grid) {
  const leftBtn = document.getElementById('biz-scroll-left');
  const rightBtn = document.getElementById('biz-scroll-right');
  if (!leftBtn || !rightBtn) return;

  const scrollAmount = 400;

  const scrollBy = (dir) => {
    const firstCard = grid.querySelector('.col-md-4');
    if (!firstCard) return;
    grid.scrollBy({ left: dir * scrollAmount, behavior: 'smooth' });
  };

  leftBtn.addEventListener('click', () => scrollBy(-1));
  rightBtn.addEventListener('click', () => scrollBy(1));
}

function initTestimoniosSwiper() {
  const el = document.getElementById('testimonios-swiper');
  if (!el || typeof Swiper === 'undefined') return;

  const swiper = new Swiper(el, {
    slidesPerView: 1,
    spaceBetween: 16,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
      pauseOnMouseEnter: true,
    },
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    breakpoints: {
      768: {
        slidesPerView: 3,
        spaceBetween: 20,
      },
    },
  });
}

function initScrollAnimations() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || typeof gsap === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  const mm = gsap.matchMedia();
  mm.add('(min-width: 768px)', () => {
    const heroBg = document.querySelector('.hero-bg');
    if (heroBg) {
      gsap.to(heroBg, {
        y: '15%',
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      });
    }

    const howSection = document.getElementById('how-it-works-pin');
    const steps = document.querySelectorAll('.step-item');
    if (howSection && steps.length) {
      gsap.set(steps, { opacity: 0, y: 40 });
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: howSection,
          pin: '.pin-content',
          start: 'top top',
          end: '+=200%',
          scrub: 1,
          anticipatePin: 1,
        },
      });
      tl.to(steps, {
        opacity: 1,
        y: 0,
        stagger: 0.33,
        ease: 'power2.out',
      });
    }
  });

  mm.add('(max-width: 767px)', () => {
    const steps = document.querySelectorAll('.step-item');
    steps.forEach(s => {
      s.style.opacity = '1';
      s.style.transform = 'none';
    });
  });

  const catGrid = document.querySelector('#categories-grid');
  if (catGrid && catGrid.children.length) {
    const catCards = catGrid.querySelectorAll('.col-4, .col-md-2');
    gsap.from(catCards, {
      opacity: 0,
      y: 30,
      stagger: 0.06,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '#categories-grid',
        start: 'top 85%',
        toggleActions: 'play none none reverse',
      },
    });
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());
}

function buscarDesdeHero() {
  const busqueda = document.getElementById('hero-search').value.trim();
  const distrito = document.getElementById('hero-distrito').value;
  const params = new URLSearchParams();
  if (busqueda) params.set('busqueda', busqueda);
  if (distrito) params.set('distrito', distrito);
  window.location.href = `/pages/directory/directory.html?${params.toString()}`;
}