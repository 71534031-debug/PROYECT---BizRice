/**
 * BIZRISE — Página de Inicio
 */

const CATEGORY_ICONS = [
  'bi-cup-hot', 'bi-tools', 'bi-palette', 'bi-briefcase', 'bi-airplane', 'bi-laptop'
];

document.addEventListener('DOMContentLoaded', async () => {
  await loadComponent('navbar-container', '../../components/navbar/navbar.html');
  renderAuthSection();
  await loadComponent('footer-container', '../../components/footer/footer.html');

  await Promise.all([
    cargarCategorias(),
    cargarNegocios()
  ]);

  document.getElementById('hero-search-btn').addEventListener('click', buscarDesdeHero);
  document.getElementById('hero-search').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') buscarDesdeHero();
  });
});

async function cargarCategorias() {
  try {
    const data = await apiGet('/categories');
    const grid = document.getElementById('categories-grid');

    data.items.forEach((cat, index) => {
      const icono = CATEGORY_ICONS[index % CATEGORY_ICONS.length];
      const col = document.createElement('div');
      col.className = 'col-4 col-md-2';
      const card = document.createElement('div');
      card.className = 'category-card';
      card.dataset.id = cat.id_categoria;
      const count = cat.total_negocios || cat.business_count || 0;
      card.innerHTML = `
        <i class="bi ${icono}"></i>
        <span>${cat.nombre}</span>
        ${count > 0 ? `<small class="text-muted mt-1">${count} negocios</small>` : ''}
      `;
      card.addEventListener('click', () => irADirectorio('categoria', cat.id_categoria));
      col.appendChild(card);
      grid.appendChild(col);
    });
  } catch (e) {
    console.error('Error cargando categorías:', e);
  }
}

async function cargarNegocios() {
  try {
    const data = await apiGet('/businesses?size=6&orden=reciente');
    const grid = document.getElementById('negocios-grid');

    if (!data.items || data.items.length === 0) {
      grid.innerHTML = '<div class="col-12"><p class="text-muted text-center">No hay negocios destacados aún</p></div>';
      return;
    }

    data.items.forEach(negocio => {
      const col = document.createElement('div');
      col.className = 'col-12 col-md-6 col-lg-4';
      col.innerHTML = `
        <div class="card business-card shadow-sm">
          <img src="${imgSrc(negocio.imagen_portada_url, negocio.nombre)}"
               class="card-img-top" alt="${negocio.nombre}">
          <div class="card-body d-flex flex-column">
            <span class="badge bg-primary mb-2 align-self-start">${negocio.categoria}</span>
            <h5 class="card-title">${negocio.nombre}</h5>
            <p class="card-text text-muted flex-grow-1">${truncate(negocio.descripcion, 80)}</p>
            <div class="d-flex align-items-center gap-2 mb-2">
              <div class="stars">${renderStars(negocio.puntuacion_promedio)}</div>
              <span class="fw-semibold" style="font-size:0.9rem">${negocio.puntuacion_promedio}</span>
              <span class="text-muted small">(${negocio.total_valoraciones})</span>
            </div>
            <small class="text-muted">
              <i class="bi bi-geo-alt"></i> ${negocio.distrito || 'Huancayo'}
            </small>
            <a href="/pages/business-profile/business-profile.html?id=${negocio.id_emprendimiento}"
               class="btn btn-outline-primary btn-sm w-100 mt-2">Ver Perfil</a>
          </div>
        </div>
      `;
      grid.appendChild(col);
    });
  } catch (e) {
    console.error('Error cargando negocios:', e);
  }
}

function buscarDesdeHero() {
  const busqueda = document.getElementById('hero-search').value.trim();
  const distrito = document.getElementById('hero-distrito').value;
  const params = new URLSearchParams();
  if (busqueda) params.set('busqueda', busqueda);
  if (distrito) params.set('distrito', distrito);
  window.location.href = `/pages/directory/directory.html?${params.toString()}`;
}

function irADirectorio(tipo, valor) {
  const params = new URLSearchParams();
  if (tipo === 'categoria') params.set('categoria', valor);
  window.location.href = `/pages/directory/directory.html?${params.toString()}`;
}
