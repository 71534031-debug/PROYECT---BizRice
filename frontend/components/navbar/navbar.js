/**
 * BIZRISE — Navbar Component
 * Maneja el estado de autenticación en la barra de navegación
 * Llamar renderAuthSection() después de cargar el HTML del navbar
 */

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
}

function handleLogout() {
  logout();
}
