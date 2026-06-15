import { Component, OnInit, inject, signal } from '@angular/core';
import { EntrepreneurService } from '../../services/entrepreneur.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-entrepreneur-dashboard',
  standalone: true,
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="fw-bold mb-0"><i class="bi bi-grid"></i> Panel de Control</h4>
      <small class="text-muted">Bienvenido, {{ auth.user()?.nombre }}</small>
    </div>

    @if (loading()) {
      <div class="text-center py-5"><div class="spinner-border text-primary"></div></div>
    }

    <div class="row g-3 mb-4">
      <div class="col-md-3">
        <div class="card border-0 shadow-sm"><div class="card-body">
          <small class="text-muted d-block">Productos Activos</small>
          <h4 class="fw-bold mb-0">{{ s()?.productos_activos ?? '—' }}</h4>
        </div></div>
      </div>
      <div class="col-md-3">
        <div class="card border-0 shadow-sm"><div class="card-body">
          <small class="text-muted d-block">Estado del Negocio</small>
          <h4 class="fw-bold mb-0" [class.text-success]="s()?.estado_negocio==='aprobado'" [class.text-warning]="s()?.estado_negocio==='pendiente'">
            {{ s()?.estado_negocio || '—' }}
          </h4>
        </div></div>
      </div>
      <div class="col-md-3">
        <div class="card border-0 shadow-sm"><div class="card-body">
          <small class="text-muted d-block">Visitas</small>
          <h4 class="fw-bold mb-0">{{ s()?.visitas_totales ?? 0 }}</h4>
          @if (s()?.visitas_incremento) {
            <small class="text-success" [class.text-danger]="(s()?.visitas_incremento ?? 0) < 0">
              <i class="bi bi-arrow-up"></i> {{ s()?.visitas_incremento }}%
            </small>
          }
        </div></div>
      </div>
      <div class="col-md-3">
        <div class="card border-0 shadow-sm"><div class="card-body">
          <small class="text-muted d-block">Clics al Perfil</small>
          <h4 class="fw-bold mb-0">{{ s()?.clics_perfil ?? 0 }}</h4>
          @if (s()?.clics_incremento) {
            <small class="text-success" [class.text-danger]="(s()?.clics_incremento ?? 0) < 0">
              <i class="bi bi-arrow-up"></i> {{ s()?.clics_incremento }}%
            </small>
          }
        </div></div>
      </div>
    </div>

    <div class="row g-4">
      <div class="col-lg-8">
        <div class="card border-0 shadow-sm">
          <div class="card-body">
            <h6 class="fw-bold mb-3"><i class="bi bi-activity"></i> Actividad Reciente</h6>
            <div id="actividad-lista">
              @for (act of (s()?.actividad_reciente || []); track act.fecha) {
                <div class="d-flex align-items-center gap-2 mb-2 pb-2 border-bottom">
                  <i class="bi" [class.bi-star]="act.tipo==='resena'" [class.bi-check-circle]="act.tipo==='verificacion'"
                     [class.bi-box]="act.tipo==='producto'" [class.bi-chat]="!['resena','verificacion','producto'].includes(act.tipo)"></i>
                  <span class="small">{{ act.mensaje }}</span>
                  <small class="text-muted ms-auto">{{ act.fecha }}</small>
                </div>
              } @empty {
                <p class="text-muted small mb-0">No hay actividad reciente</p>
              }
            </div>
          </div>
        </div>
      </div>
      <div class="col-lg-4">
        <div class="card border-0 shadow-sm" style="background:linear-gradient(135deg,#6f42c1,#4f0baa)">
          <div class="card-body text-white text-center">
            <h6 class="fw-bold mb-2"><i class="bi bi-rocket-takeoff"></i> Expande tu alcance</h6>
            <p class="small opacity-75 mb-3">Llega a más clientes en Huancayo</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class EntrepreneurDashboardComponent implements OnInit {
  private ent = inject(EntrepreneurService);
  auth = inject(AuthService);
  s = this.ent.stats;
  loading = this.ent.statsLoading;

  ngOnInit(): void {
    this.ent.loadStats().subscribe();
  }
}
