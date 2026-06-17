import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-vh-100 d-flex align-items-center justify-content-center" style="background: linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%);">
      <div class="bg-white rounded-4 p-5 text-center shadow-lg" style="max-width: 480px;">
        <div class="display-1 fw-bold" style="color: #6f42c1;">404</div>
        <h2 class="fw-bold mb-3">Página no encontrada</h2>
        <p class="text-muted mb-4">La página que buscas no existe o fue movida.</p>
        <a routerLink="/" class="btn btn-primary btn-lg px-4">
          <i class="bi bi-house-door-fill"></i> Volver al inicio
        </a>
      </div>
    </div>
  `
})
export class NotFoundComponent {}
