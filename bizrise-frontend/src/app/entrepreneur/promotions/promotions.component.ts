import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EntrepreneurService } from '../../services/entrepreneur.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-entrepreneur-promotions',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="fw-bold mb-0"><i class="bi bi-megaphone"></i> Promociones</h4>
      <button class="btn btn-primary btn-sm" (click)="openCreate()"><i class="bi bi-plus-lg"></i> Nueva Promoción</button>
    </div>

    @if (loading()) { <div class="text-center py-4"><div class="spinner-border text-primary"></div></div> }

    <div class="row g-3" id="promotions-list">
      @for (p of promotions(); track p.id_promocion) {
        <div class="col-md-6 col-lg-4">
          <div class="card border-0 shadow-sm h-100 promo-card">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <h6 class="fw-bold mb-0">{{ p.titulo }}</h6>
                <span class="badge" [class.bg-success]="p.estado==='activa'" [class.bg-secondary]="p.estado==='vencida'" [class.bg-warning]="p.estado==='borrador'">
                  {{ p.estado }}
                </span>
              </div>
              @if (p.descripcion) { <p class="small text-muted mb-2">{{ p.descripcion }}</p> }
              @if (p.fecha_inicio) { <small class="d-block text-muted"><i class="bi bi-calendar"></i> {{ formatDate(p.fecha_inicio) }} → {{ formatDate(p.fecha_fin) || '—' }}</small> }
              <div class="d-flex gap-1 mt-3">
                <button class="btn btn-outline-primary btn-sm flex-grow-1" (click)="openEdit(p)"><i class="bi bi-pencil"></i> Editar</button>
                <button class="btn btn-outline-danger btn-sm" (click)="openDelete(p)"><i class="bi bi-trash"></i></button>
              </div>
            </div>
          </div>
        </div>
      } @empty {
        @if (!loading()) {
          <div class="col-12 text-center py-5 text-muted">
            <i class="bi bi-megaphone fs-1 d-block mb-2"></i>
            <p>No hay promociones aún. ¡Crea tu primera promoción!</p>
          </div>
        }
      }
    </div>

    @if (showModal()) {
      <div class="modal d-block" tabindex="-1" style="background:rgba(0,0,0,0.5)">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h6 class="modal-title fw-bold">{{ editingId() ? 'Editar' : 'Nueva' }} Promoción</h6>
              <button type="button" class="btn-close" (click)="showModal.set(false)"></button>
            </div>
            <div class="modal-body">
              <div class="mb-2">
                <label class="form-label small fw-semibold">Título <span class="text-danger">*</span></label>
                <input class="form-control form-control-sm" [(ngModel)]="formTitulo"
                       [class.is-invalid]="submitted && !formTitulo.trim()" [class.is-valid]="submitted && formTitulo.trim()">
                @if (submitted && !formTitulo.trim()) {
                  <div class="invalid-feedback">El título es obligatorio</div>
                }
              </div>
              <div class="mb-2">
                <label class="form-label small fw-semibold">Descripción</label>
                <textarea class="form-control form-control-sm" rows="2" [(ngModel)]="formDescripcion"></textarea>
              </div>
              <div class="row g-2 mb-2">
                <div class="col-6">
                  <label class="form-label small fw-semibold">Fecha Inicio</label>
                  <input type="date" class="form-control form-control-sm" [(ngModel)]="formFechaInicio" [min]="today()">
                </div>
                <div class="col-6">
                  <label class="form-label small fw-semibold">Fecha Fin</label>
                  <input type="date" class="form-control form-control-sm" [(ngModel)]="formFechaFin" [min]="formFechaInicio || today()">
                </div>
              </div>
              <div class="mb-2">
                <label class="form-label small fw-semibold">Estado</label>
                <select class="form-select form-select-sm" [(ngModel)]="formEstado">
                  <option value="activa">Activa</option>
                  <option value="borrador">Borrador</option>
                </select>
              </div>
              @if (formError()) { <div class="text-danger small mt-1">{{ formError() }}</div> }
              @if (dateError()) { <div class="text-danger small mt-1">{{ dateError() }}</div> }
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary btn-sm" (click)="showModal.set(false)">Cancelar</button>
              <button class="btn btn-primary btn-sm" (click)="save()" [disabled]="submitting()">
                @if (submitting()) { <span class="btn-spinner"></span> }
                {{ editingId() ? 'Actualizar' : 'Crear' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    @if (showDeleteModal()) {
      <div class="modal d-block" tabindex="-1" style="background:rgba(0,0,0,0.5)">
        <div class="modal-dialog modal-sm">
          <div class="modal-content">
            <div class="modal-header"><h6 class="modal-title fw-bold text-danger">Confirmar</h6><button type="button" class="btn-close" (click)="showDeleteModal.set(false)"></button></div>
            <div class="modal-body"><p class="small mb-0">¿Eliminar promoción <strong>{{ deleteName }}</strong>?</p></div>
            <div class="modal-footer">
              <button class="btn btn-secondary btn-sm" (click)="showDeleteModal.set(false)">Cancelar</button>
              <button class="btn btn-danger btn-sm" (click)="confirmDelete()" [disabled]="submitting()">
                @if (submitting()) { <span class="btn-spinner"></span> }
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class EntrepreneurPromotionsComponent implements OnInit {
  private ent = inject(EntrepreneurService);
  private toast = inject(ToastService);

  promotions = this.ent.promotions;
  submitted = false;
  loading = this.ent.promotionsLoading;

  showModal = signal(false);
  editingId = signal<number | null>(null);
  formTitulo = '';
  formDescripcion = '';
  formFechaInicio = '';
  formFechaFin = '';
  formEstado = 'activa';
  formError = signal<string | null>(null);
  dateError = signal<string | null>(null);
  submitting = signal(false);

  showDeleteModal = signal(false);
  deleteId: number | null = null;
  deleteName = '';

  today = () => new Date().toISOString().split('T')[0];

  ngOnInit(): void {
    this.ent.loadPromotions().subscribe();
  }

  openCreate(): void {
    this.editingId.set(null); this.formTitulo = ''; this.formDescripcion = '';
    this.formFechaInicio = ''; this.formFechaFin = ''; this.formEstado = 'activa';
    this.formError.set(null); this.dateError.set(null); this.showModal.set(true);
  }

  openEdit(p: any): void {
    this.editingId.set(p.id_promocion); this.formTitulo = p.titulo; this.formDescripcion = p.descripcion || '';
    this.formFechaInicio = p.fecha_inicio ? p.fecha_inicio.substring(0, 10) : '';
    this.formFechaFin = p.fecha_fin ? p.fecha_fin.substring(0, 10) : '';
    this.formEstado = p.estado || 'activa';
    this.formError.set(null); this.dateError.set(null); this.showModal.set(true);
  }

  openDelete(p: any): void { this.deleteId = p.id_promocion; this.deleteName = p.titulo; this.showDeleteModal.set(true); }

  formatDate(d: any): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  save(): void {
    this.submitted = true; this.formError.set(null); this.dateError.set(null);
    if (!this.formTitulo.trim()) { this.formError.set('El título es obligatorio'); return; }

    const todayStr = this.today();

    if (this.formFechaInicio && this.formFechaInicio < todayStr) {
      this.dateError.set('La fecha de inicio no puede ser pasada');
      return;
    }
    if (this.formFechaInicio && this.formFechaFin && this.formFechaFin <= this.formFechaInicio) {
      this.dateError.set('La fecha de fin debe ser posterior a la de inicio');
      return;
    }

    this.submitting.set(true);
    const data: any = { titulo: this.formTitulo.trim() };
    if (this.formDescripcion.trim()) data.descripcion = this.formDescripcion.trim();
    if (this.formFechaInicio) data.fecha_inicio = this.formFechaInicio;
    if (this.formFechaFin) data.fecha_fin = this.formFechaFin;
    if (this.formEstado) data.estado = this.formEstado;

    const obs = this.editingId() ? this.ent.updatePromotion(this.editingId()!, data) : this.ent.createPromotion(data);
    obs.subscribe({
      next: () => { this.submitting.set(false); this.showModal.set(false); this.toast.success(this.editingId() ? 'Promoción actualizada' : 'Promoción creada'); this.ent.loadPromotions().subscribe(); },
      error: (err) => { this.submitting.set(false); this.formError.set(err.error?.detail || 'Error'); }
    });
  }

  confirmDelete(): void {
    this.submitting.set(true);
    this.ent.deletePromotion(this.deleteId!).subscribe({
      next: () => { this.submitting.set(false); this.showDeleteModal.set(false); this.toast.success('Promoción eliminada'); },
      error: (err) => { this.submitting.set(false); this.toast.error(err.error?.detail || 'Error'); }
    });
  }
}
