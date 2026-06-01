/**
 * BIZRISE — Página de Categorías
 */

const CATEGORY_ICONS = [
  'bi-cup-hot', 'bi-tools', 'bi-palette', 'bi-briefcase', 'bi-airplane', 'bi-laptop',
  'bi-shop', 'bi-heart', 'bi-book', 'bi-camera', 'bi-music-note', 'bi-flower1'
];

const CATEGORY_COLORS = [
  '#6f42c1', '#e83e8c', '#fd7e14', '#20c997', '#0d6efd', '#198754',
  '#dc3545', '#ffc107', '#6610f2', '#17a2b8', '#6c757d', '#343a40'
];

document.addEventListener('DOMContentLoaded', async () => {
  await loadComponent('navbar-container', '../../components/navbar/navbar.html');
  renderAuthSection();
  await loadComponent('footer-container', '../../components/footer/footer.html');
  await cargarCategorias();
});

async function cargarCategorias() {
  try {
    const data = await apiGet('/categories');
    const grid = document.getElementById('categories-grid');

    data.items.forEach((cat, index) => {
      const icono = CATEGORY_ICONS[index % CATEGORY_ICONS.length];
      const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
      const col = document.createElement('div');
      col.className = 'col-12 col-md-6 col-lg-4';

      const card = document.createElement('div');
      card.className = 'card category-card shadow-sm';
      card.dataset.id = cat.id_categoria;
      card.addEventListener('click', () => irACategoria(cat.id_categoria));
      card.innerHTML = `
        <div class="card-img-top d-flex align-items-center justify-content-center"
             style="background: linear-gradient(135deg, ${color}22, ${color}44);">
          <i class="bi ${icono}" style="font-size: 3.5rem; color: ${color}; opacity: 0.6;"></i>
        </div>
        <div class="icon-wrapper" style="background: ${color}15;">
          <i class="bi ${icono}" style="color: ${color};"></i>
        </div>
        <div class="card-body text-center">
          <h5 class="card-title">${cat.nombre}</h5>
          <p class="card-text text-muted">${cat.descripcion || ''}</p>
          <span class="badge bg-primary rounded-pill">${cat.total_negocios} negocios</span>
        </div>
      `;

      col.appendChild(card);
      grid.appendChild(col);
    });
  } catch (e) {
    console.error('Error cargando categorías:', e);
  }
}

function irACategoria(id) {
  window.location.href = `/pages/directory/directory.html?categoria=${id}`;
}
