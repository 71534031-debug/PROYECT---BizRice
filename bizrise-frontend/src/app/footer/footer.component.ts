import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="bg-white border-top border-outline-variant pt-5 pb-3">
      <div class="container">
        <div class="row g-4 mb-5">
          <div class="col-md-4">
            <h5 class="fw-black text-primary mb-3">BizRise</h5>
            <p class="text-muted small" style="max-width:280px">
              Empoderando al emprendedor huancaíno a través de la visibilidad digital y el crecimiento sostenible en el Valle del Mantaro.
            </p>
            <div class="d-flex gap-2">
              <a href="#" class="btn btn-light btn-sm rounded-circle p-2 d-flex align-items-center justify-content-center" style="width:36px;height:36px">
                <i class="bi bi-globe2"></i>
              </a>
              <a href="#" class="btn btn-light btn-sm rounded-circle p-2 d-flex align-items-center justify-content-center" style="width:36px;height:36px">
                <i class="bi bi-share"></i>
              </a>
            </div>
          </div>

          <div class="col-6 col-md-2">
            <h6 class="fw-bold small text-uppercase tracking-wide mb-3">Explorar</h6>
            <ul class="list-unstyled small">
              <li class="mb-2"><a routerLink="/directory" class="text-muted text-decoration-none">Directorio</a></li>
              <li class="mb-2"><a routerLink="/categories" class="text-muted text-decoration-none">Categorías</a></li>
              <li class="mb-2"><a routerLink="/" class="text-muted text-decoration-none">Inicio</a></li>
            </ul>
          </div>

          <div class="col-6 col-md-3">
            <h6 class="fw-bold small text-uppercase tracking-wide mb-3">Soporte</h6>
            <ul class="list-unstyled small">
              <li class="mb-2"><a href="#" class="text-muted text-decoration-none">Centro de Ayuda</a></li>
              <li class="mb-2"><a href="#" class="text-muted text-decoration-none">Contacto</a></li>
              <li class="mb-2"><a href="#" class="text-muted text-decoration-none">FAQ</a></li>
            </ul>
          </div>

          <div class="col-6 col-md-3">
            <h6 class="fw-bold small text-uppercase tracking-wide mb-3">Legal</h6>
            <ul class="list-unstyled small">
              <li class="mb-2"><a href="#" class="text-muted text-decoration-none">Privacidad</a></li>
              <li class="mb-2"><a href="#" class="text-muted text-decoration-none">Términos</a></li>
              <li class="mb-2"><a href="#" class="text-muted text-decoration-none">Cookies</a></li>
            </ul>
          </div>
        </div>

        <hr class="text-muted opacity-25">

        <div class="text-center text-muted small pt-3">
          &copy; 2026 BizRise Huancayo. Todos los derechos reservados. Impulsando el motor económico local.
        </div>
      </div>
    </footer>
  `
})
export class FooterComponent {}
