import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { CategoryService } from '../../services/category.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-admin-requests',
  standalone: true,
  imports: [FormsModule],
  template: `
    <header class="admin-topbar sticky-top px-4 py-3 d-flex align-items-center justify-content-between">
      <div class="d-flex align-items-center gap-3 flex-grow-1 search-wrapper">
        <i class="bi bi-search text-muted position-absolute ms-3"></i>
        <input type="text" class="search-input w-100" [(ngModel)]="searchTerm" (keydown.enter)="applyFilters()" placeholder="Buscar negocios...">
      </div>
    </header>
    <div class="p-4 flex-grow-1">
      <h4 class="fw-bold mb-4"><i class="bi bi-clipboard-data"></i> Solicitudes</h4>

      <div class="row g-3 mb-4">
        <div class="col-md-2 col-6"><div class="card border-0 shadow-sm p-3 text-center">
          <small class="text-muted">Total</small><h5 class="fw-bold mb-0">{{ counterTotal() }}</h5>
        </div></div>
        <div class="col-md-2 col-6"><div class="card border-0 shadow-sm p-3 text-center">
          <small class="text-muted">Pendientes</small><h5 class="fw-bold mb-0 text-warning">{{ counters()?.pendientes ?? 0 }}</h5>
        </div></div>
        <div class="col-md-2 col-6"><div class="card border-0 shadow-sm p-3 text-center">
          <small class="text-muted">Aprobadas</small><h5 class="fw-bold mb-0 text-success">{{ counters()?.aprobadas ?? 0 }}</h5>
        </div></div>
      </div>

      <form class="row g-2 mb-4" (ngSubmit)="applyFilters()">
        <div class="col-md-4">
          <select class="form-select form-select-sm" [(ngModel)]="filterEstado" name="estado">
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="aprobado">Aprobado</option>
            <option value="rechazado">Rechazado</option>
          </select>
        </div>
        <div class="col-md-3">
          <select class="form-select form-select-sm" [(ngModel)]="filterCategoria" name="categoria">
            <option value="">Todas las categorías</option>
            @for (cat of categories(); track cat.id_categoria) {
              <option [value]="cat.id_categoria">{{ cat.nombre }}</option>
            }
          </select>
        </div>
        <div class="col-md-2">
          <button class="btn btn-primary btn-sm w-100" type="submit"><i class="bi bi-funnel"></i> Filtrar</button>
        </div>
      </form>

      @if (loading()) {
        <div class="text-center py-4"><div class="spinner-border text-primary"></div></div>
      }

      <div class="table-responsive">
        <table class="table admin-table">
          <thead><tr><th>Negocio</th><th>Categoría</th><th>Propietario</th><th>Fecha</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            @for (b of businesses(); track b.id_emprendimiento) {
              <tr>
                <td class="fw-semibold small">{{ b.nombre }}</td>
                <td><span class="badge bg-primary bg-opacity-10 text-primary">{{ b.categoria }}</span></td>
                <td class="small">{{ b.propietario?.nombre + ' ' + b.propietario?.apellido || '—' }}</td>
                <td class="small text-muted">{{ formatDate(b.fecha_registro) }}</td>
                <td>
                  <span class="badge" [class.bg-warning]="b.estado_verificacion==='pendiente'" [class.bg-success]="b.estado_verificacion==='aprobado'" [class.bg-danger]="b.estado_verificacion==='rechazado'">
                    {{ b.estado_verificacion }}
                  </span>
                </td>
                <td>
                  @if (b.estado_verificacion === 'pendiente') {
                    <div class="d-flex gap-1">
                      <button class="btn btn-success btn-sm" (click)="approve(b.id_emprendimiento, b.nombre)"><i class="bi bi-check-lg"></i></button>
                      <button class="btn btn-danger btn-sm" (click)="openReject(b.id_emprendimiento, b.nombre)"><i class="bi bi-x-lg"></i></button>
                    </div>
                  } @else if (b.estado_verificacion === 'rechazado' && b.motivo_rechazo) {
                    <button class="btn btn-outline-info btn-sm" (click)="showInfo(b.motivo_rechazo)"><i class="bi bi-info-circle"></i></button>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="text-center text-muted py-4">No se encontraron solicitudes</td></tr>
            }
          </tbody>
        </table>
      </div>

      @if (pages() > 1) {
        <ul class="pagination pagination-custom justify-content-center mt-3">
          <li class="page-item" [class.disabled]="page() <= 1"><button class="page-link" (click)="goTo(page() - 1)">Anterior</button></li>
          @for (p of [].constructor(pages()); track $index) {
            <li class="page-item" [class.active]="page() === $index + 1"><button class="page-link" (click)="goTo($index + 1)">{{ $index + 1 }}</button></li>
          }
          <li class="page-item" [class.disabled]="page() >= pages()"><button class="page-link" (click)="goTo(page() + 1)">Siguiente</button></li>
        </ul>
      }
    </div>

    @if (showRejectModal()) {
      <div class="modal d-block" tabindex="-1" style="background:rgba(0,0,0,0.5)">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h6 class="modal-title fw-bold">Rechazar: {{ rejectName() }}</h6>
              <button type="button" class="btn-close" (click)="showRejectModal.set(false)"></button>
            </div>
            <div class="modal-body">
              <label class="form-label small fw-semibold">Motivo <span class="text-danger">*</span></label>
              <textarea class="form-control" rows="3" [(ngModel)]="rejectMotivo" placeholder="Mín. 20 caracteres"></textarea>
              @if (rejectError()) { <div class="text-danger small mt-1">{{ rejectError() }}</div> }
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary btn-sm" (click)="showRejectModal.set(false)">Cancelar</button>
              <button class="btn btn-danger btn-sm" (click)="confirmReject()" [disabled]="rejecting()">
                @if (rejecting()) { <span class="spinner-border spinner-border-sm me-1"></span> }
                Confirmar
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class AdminRequestsComponent implements OnInit {
  private admin = inject(AdminService);
  private catService = inject(CategoryService);
  private toast = inject(ToastService);

  searchTerm = '';
  filterEstado = '';
  filterCategoria = '';
  categories = signal<any[]>([]);
  page = signal(1);
  pages = signal(0);
  counterTotal = signal(0);
  counters = signal<any>(null);

  businesses = this.admin.businesses;
  loading = this.admin.businessesLoading;

  showRejectModal = signal(false);
  rejectId = signal<number | null>(null);
  rejectName = signal('');
  rejectMotivo = '';
  rejectError = signal<string | null>(null);
  rejecting = signal(false);

  ngOnInit(): void {
    this.catService.getCategories().subscribe((res: any) => this.categories.set(res.items || res));
    this.loadData();
  }

  private loadData(): void {
    const params: any = { page: this.page(), size: 10 };
    if (this.filterEstado) params.estado = this.filterEstado;
    if (this.filterCategoria) params.categoria = Number(this.filterCategoria);
    if (this.searchTerm.trim()) params.busqueda = this.searchTerm.trim();
    this.admin.loadBusinesses(params).subscribe((res) => this.pages.set(res.pages));

    this.admin.loadStats().subscribe((res: any) => {
      this.counters.set({ pendientes: res.pendientes, aprobadas: res.total_negocios - res.pendientes });
      this.counterTotal.set(res.total_negocios);
    });
  }

  applyFilters(): void { this.page.set(1); this.loadData(); }
  goTo(p: number): void { if (p >= 1 && p <= this.pages()) { this.page.set(p); this.loadData(); } }

  formatDate(d: any): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  approve(id: number, name: string): void {
    this.admin.approveBusiness(id).subscribe({
      next: () => { this.toast.success(`"${name}" aprobado`); this.loadData(); },
      error: (err) => this.toast.error(err.error?.detail || 'Error')
    });
  }

  openReject(id: number, name: string): void {
    this.rejectId.set(id); this.rejectName.set(name); this.rejectMotivo = ''; this.rejectError.set(null); this.showRejectModal.set(true);
  }

  confirmReject(): void {
    this.rejectError.set(null);
    if (this.rejectMotivo.trim().length < 20) { this.rejectError.set('Mínimo 20 caracteres'); return; }
    this.rejecting.set(true);
    this.admin.rejectBusiness(this.rejectId()!, this.rejectMotivo.trim()).subscribe({
      next: () => { this.rejecting.set(false); this.showRejectModal.set(false); this.toast.success(`"${this.rejectName()}" rechazado`); this.loadData(); },
      error: (err) => { this.rejecting.set(false); this.rejectError.set(err.error?.detail || 'Error'); }
    });
  }

  showInfo(msg: string): void { this.toast.info(msg); }
}
