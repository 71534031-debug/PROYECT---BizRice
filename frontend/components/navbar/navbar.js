/**
 * BIZRISE — Navbar Component
 * Maneja el estado de autenticación en la barra de navegación
 * Llamar renderAuthSection() después de cargar el HTML del navbar
 */

/* ─── Mega menú categorías ──────────────────────────────── */
const MEGA_CATEGORIES = [
  { nombre: 'Gastronomía',     icono: 'bi-cup-hot',      img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80' },
  { nombre: 'Textilería y Moda', icono: 'bi-scissors',    img: 'https://images.unsplash.com/photo-1604681630513-69474a4e253f?w=400&q=80' },
  { nombre: 'Artesanía',       icono: 'bi-palette',       img: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&q=80' },
  { nombre: 'Servicios',       icono: 'bi-briefcase',     img: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&q=80' },
  { nombre: 'Turismo',         icono: 'bi-airplane',      img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80' },
  { nombre: 'Tecnología',      icono: 'bi-laptop',        img: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&q=80' },
  { nombre: 'Belleza',         icono: 'bi-stars',         img: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&q=80' },
  { nombre: 'Agricultura',     icono: 'bi-tree',          img: 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=400&q=80' },
  { nombre: 'Hogar',           icono: 'bi-house-heart',   img: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80' },
];

function initMegaMenu() {
  const container = document.querySelector('.mega-menu-links');
  const preview = document.getElementById('mega-preview-img');
  if (!container || !preview) return;

  container.innerHTML = MEGA_CATEGORIES.map(c =>
    `<a class="mega-link" href="/pages/categories/categories.html" data-img="${c.img}">
      <i class="bi ${c.icono} me-2"></i>${c.nombre}
    </a>`
  ).join('');

  const firstImg = container.querySelector('.mega-link')?.dataset?.img;
  if (firstImg) preview.src = firstImg;

  container.querySelectorAll('.mega-link').forEach(link => {
    link.addEventListener('mouseenter', () => {
      preview.src = link.dataset.img;
    });
  });
}

function renderAuthSection() {
  const section = document.getElementById('auth-nav-section');
  if (!section) return;

  const user = getCurrentUser();
  const token = localStorage.getItem('bizrise_access_token');

  if (token && user) {
    const panelUrl = user.rol === 'administrador'
      ? '/pages/admin/dashboard.html'
      : '/pages/entrepreneur/dashboard.html';

    section.innerHTML = `
      <div class="dropdown">
        <button class="btn btn-outline-primary btn-sm dropdown-toggle d-flex align-items-center gap-1"
                type="button" data-bs-toggle="dropdown" aria-expanded="false">
          <i class="bi bi-person-circle"></i>
          <span>${user.nombre}</span>
        </button>
        <ul class="dropdown-menu dropdown-menu-end shadow-sm">
          <li>
            <a class="dropdown-item" href="${panelUrl}">
              <i class="bi bi-speedometer2"></i> Mi Panel
            </a>
          </li>
          <li><hr class="dropdown-divider"></li>
          <li>
            <a class="dropdown-item text-danger" href="#" onclick="handleLogout()">
              <i class="bi bi-box-arrow-right"></i> Cerrar Sesión
            </a>
          </li>
        </ul>
      </div>
    `;
  } else {
    section.innerHTML = `
      <a href="/pages/auth/login.html" class="btn btn-primary btn-sm">
        <i class="bi bi-box-arrow-in-right"></i> Ingresar
      </a>
    `;
  }
  initMegaMenu();
}

function handleLogout() {
  logout();
}

document.addEventListener('DOMContentLoaded', () => {
  const navSearch = document.getElementById('nav-search-input');
  if (navSearch) {
    navSearch.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = encodeURIComponent(navSearch.value.trim());
        window.location.href = '/pages/directory/directory.html' + (q ? '?busqueda=' + q : '');
      }
    });
  }
});
