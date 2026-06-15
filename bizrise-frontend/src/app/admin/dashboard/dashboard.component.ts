import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [FormsModule],
  template: `
    <header class="admin-topbar sticky-top px-4 py-3 d-flex align-items-center justify-content-between">
      <div class="d-flex align-items-center gap-3 flex-grow-1 search-wrapper">
        <i class="bi bi-search text-muted position-absolute ms-3"></i>
        <input type="text" class="search-input w-100" placeholder="Buscar negocios...">
      </div>
      <div class="d-flex align-items-center gap-3">
        <div class="text-end">
          <span class="d-block small fw-semibold lh-1">Admin BizRise</span>
          <small class="text-success fw-medium">Super Administrador</small>
        </div>
      </div>
    </header>
    <div class="p-4 flex-grow-1">
      <h4 class="fw-bold mb-4"><i class="bi bi-grid-1x2"></i> Resumen</h4>

      @if (loading()) {
        <div class="text-center py-5"><div class="spinner-border text-primary"></div></div>
      }

      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="card stats-card border-0"><div class="card-body">
            <div class="d-flex align-items-center gap-3">
              <div class="stats-icon stats-icon-primary"><i class="bi bi-shop fs-5"></i></div>
              <div><small class="text-muted d-block">Negocios</small><h4 class="fw-bold mb-0">{{ s()?.total_negocios ?? '—' }}</h4></div>
            </div>
          </div></div>
        </div>
        <div class="col-md-3">
          <div class="card stats-card border-0"><div class="card-body">
            <div class="d-flex align-items-center gap-3">
              <div class="stats-icon stats-icon-warning"><i class="bi bi-clock fs-5"></i></div>
              <div><small class="text-muted d-block">Pendientes</small><h4 class="fw-bold mb-0">{{ s()?.pendientes ?? '—' }}</h4></div>
            </div>
          </div></div>
        </div>
        <div class="col-md-3">
          <div class="card stats-card border-0"><div class="card-body">
            <div class="d-flex align-items-center gap-3">
              <div class="stats-icon stats-icon-success"><i class="bi bi-people fs-5"></i></div>
              <div><small class="text-muted d-block">Nuevos Usuarios</small><h4 class="fw-bold mb-0">{{ s()?.nuevos_usuarios_mes ?? '—' }}</h4></div>
            </div>
          </div></div>
        </div>
        <div class="col-md-3">
          <div class="card stats-card border-0"><div class="card-body">
            <div class="d-flex align-items-center gap-3">
              <div class="stats-icon stats-icon-primary"><i class="bi bi-trending-up fs-5"></i></div>
              <div><small class="text-muted d-block">Crecimiento</small>
                <h4 class="fw-bold mb-0" [class.text-success]="(s()?.crecimiento_porcentaje ?? 0) > 0">
                  {{ (s()?.crecimiento_porcentaje ?? 0) > 0 ? '+' : '' }}{{ s()?.crecimiento_porcentaje ?? 0 }}%
                </h4>
              </div>
            </div>
          </div></div>
        </div>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="card stats-card border-0"><div class="card-body">
            <div class="d-flex align-items-center gap-3">
              <div class="stats-icon stats-icon-success"><i class="bi bi-people fs-5"></i></div>
              <div><small class="text-muted d-block">Total Usuarios</small><h4 class="fw-bold mb-0">{{ m()?.total_usuarios ?? '—' }}</h4></div>
            </div>
          </div></div>
        </div>
        <div class="col-md-3">
          <div class="card stats-card border-0"><div class="card-body">
            <div class="d-flex align-items-center gap-3">
              <div class="stats-icon stats-icon-primary"><i class="bi bi-box-seam fs-5"></i></div>
              <div><small class="text-muted d-block">Productos</small><h4 class="fw-bold mb-0">{{ m()?.total_productos ?? '—' }}</h4></div>
            </div>
          </div></div>
        </div>
      </div>

      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white border-0 d-flex justify-content-between align-items-center pt-3">
          <h6 class="fw-bold mb-0"><i class="bi bi-clipboard-data"></i> Solicitudes Recientes</h6>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table admin-table mb-0" id="tabla-pendientes">
              <thead><tr><th>Negocio</th><th>Categoría</th><th>Fecha</th><th>Acciones</th></tr></thead>
              <tbody>
                @for (sol of solicitudes(); track sol.id_emprendimiento) {
                  <tr>
                    <td class="fw-semibold small">{{ sol.nombre }}</td>
                    <td><span class="badge bg-primary bg-opacity-10 text-primary">{{ sol.categoria }}</span></td>
                    <td class="small text-muted">{{ formatDate(sol.fecha_registro) }}</td>
                    <td>
                      <div class="d-flex gap-1 action-btn-group">
                        <button class="btn btn-success btn-sm" (click)="approve(sol.id_emprendimiento, sol.nombre)">
                          <i class="bi bi-check-lg"></i> Aprobar
                        </button>
                        <button class="btn btn-danger btn-sm" (click)="openReject(sol.id_emprendimiento, sol.nombre)">
                          <i class="bi bi-x-lg"></i> Rechazar
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="4" class="text-center text-muted py-4">No hay solicitudes pendientes</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <footer class="admin-footer">
      <div class="d-flex justify-content-between align-items-center">
        <small class="text-muted">&copy; 2026 BizRise Huancayo</small>
        <div class="d-flex gap-3"><a href="#">Privacidad</a><a href="#">Términos</a><a href="#">Soporte</a></div>
      </div>
    </footer>

    @if (showRejectModal()) {
      <div class="modal d-block" tabindex="-1" style="background:rgba(0,0,0,0.5)">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h6 class="modal-title fw-bold">Rechazar: {{ rejectName() }}</h6>
              <button type="button" class="btn-close" (click)="showRejectModal.set(false)"></button>
            </div>
            <div class="modal-body">
              <label class="form-label small fw-semibold">Motivo del rechazo <span class="text-danger">*</span></label>
              <textarea class="form-control" rows="3" [(ngModel)]="rejectMotivo" placeholder="Indica el motivo (mín. 20 caracteres)"></textarea>
              @if (rejectError()) { <div class="text-danger small mt-1">{{ rejectError() }}</div> }
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary btn-sm" (click)="showRejectModal.set(false)">Cancelar</button>
              <button class="btn btn-danger btn-sm" (click)="confirmReject()" [disabled]="rejecting()">
                @if (rejecting()) { <span class="spinner-border spinner-border-sm me-1"></span> }
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class AdminDashboardComponent implements OnInit {
  private admin = inject(AdminService);
  private toast = inject(ToastService);

  loading = signal(true);
  s = signal<any>(null);
  m = signal<any>(null);
  solicitudes = signal<any[]>([]);

  showRejectModal = signal(false);
  rejectId = signal<number | null>(null);
  rejectName = signal('');
  rejectMotivo = '';
  rejectError = signal<string | null>(null);
  rejecting = signal(false);

  ngOnInit(): void {
    this.admin.loadStats().subscribe({
      next: (res: any) => { this.s.set(res); this.solicitudes.set(res?.solicitudes_recientes || []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
    this.admin.loadMetrics().subscribe({ next: (res: any) => this.m.set(res) });
  }

  formatDate(d: any): string {
    if (!d) return '—';
    const date = new Date(d);
    return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  approve(id: number, name: string): void {
    this.admin.approveBusiness(id).subscribe({
      next: () => { this.toast.success(`"${name}" aprobado`); this.admin.loadStats().subscribe(r => { this.s.set(r); this.solicitudes.set(r?.solicitudes_recientes || []); }); },
      error: (err) => this.toast.error(err.error?.detail || 'Error al aprobar')
    });
  }

  openReject(id: number, name: string): void {
    this.rejectId.set(id); this.rejectName.set(name); this.rejectMotivo = ''; this.rejectError.set(null); this.showRejectModal.set(true);
  }

  confirmReject(): void {
    this.rejectError.set(null);
    if (this.rejectMotivo.trim().length < 20) { this.rejectError.set('El motivo debe tener al menos 20 caracteres'); return; }
    this.rejecting.set(true);
    this.admin.rejectBusiness(this.rejectId()!, this.rejectMotivo.trim()).subscribe({
      next: () => { this.rejecting.set(false); this.showRejectModal.set(false); this.toast.success(`"${this.rejectName()}" rechazado`); this.admin.loadStats().subscribe(r => { this.s.set(r); this.solicitudes.set(r?.solicitudes_recientes || []); }); },
      error: (err) => { this.rejecting.set(false); this.rejectError.set(err.error?.detail || 'Error al rechazar'); }
    });
  }
}
