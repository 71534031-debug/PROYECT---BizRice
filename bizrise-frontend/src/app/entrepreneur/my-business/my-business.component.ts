import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EntrepreneurService } from '../../services/entrepreneur.service';
import { CategoryService } from '../../services/category.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-entrepreneur-my-business',
  standalone: true,
  imports: [FormsModule],
  template: `
    <h4 class="fw-bold mb-4"><i class="bi bi-shop"></i> Mi Negocio</h4>

    @if (!hasBusiness() && !busLoading()) {
      <div class="alert alert-info" id="no-business-alert">
        <i class="bi bi-info-circle"></i> Aún no tienes un negocio registrado. ¡Completa el formulario para registrarlo!
      </div>
    }

    @if (busLoading()) {
      <div class="text-center py-5"><div class="spinner-border text-primary"></div></div>
    }

    <div class="row g-4">
      <div class="col-lg-8">
        <div class="card border-0 shadow-sm mb-4">
          <div class="card-body">
            <h6 class="fw-bold mb-3">Información General</h6>
            <form #businessForm="ngForm" (ngSubmit)="saveBusiness()">
              <div class="mb-3">
                <label class="form-label small fw-semibold">Nombre del Negocio <span class="text-danger">*</span></label>
                <input class="form-control" [(ngModel)]="formNombre" name="nombre" required>
              </div>
              <div class="mb-3">
                <label class="form-label small fw-semibold">Categoría <span class="text-danger">*</span></label>
                <select class="form-select" [(ngModel)]="formCategoria" name="categoria" required>
                  <option value="">Seleccionar...</option>
                  @for (cat of categories(); track cat.id_categoria) {
                    <option [value]="cat.id_categoria">{{ cat.nombre }}</option>
                  }
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label small fw-semibold">Descripción</label>
                <textarea class="form-control" rows="3" [(ngModel)]="formDescripcion" name="descripcion"></textarea>
              </div>
              <div class="row g-2 mb-3">
                <div class="col-md-6">
                  <label class="form-label small fw-semibold">Teléfono</label>
                  <input class="form-control" [(ngModel)]="formTelefono" name="telefono" placeholder="999888777">
                </div>
                <div class="col-md-6">
                  <label class="form-label small fw-semibold">Distrito</label>
                  <select class="form-select" [(ngModel)]="formDistrito" name="distrito">
                    <option value="">Seleccionar...</option>
                    <option>Huancayo</option><option>El Tambo</option><option>Chilca</option>
                    <option>San Agustín</option><option>Pilcomayo</option>
                  </select>
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label small fw-semibold">Dirección</label>
                <input class="form-control" [(ngModel)]="formDireccion" name="direccion">
              </div>
              <button type="submit" class="btn btn-primary" [disabled]="saving()">
                @if (saving()) { <span class="spinner-border spinner-border-sm me-1"></span> }
                <i class="bi bi-save"></i> {{ hasBusiness() ? 'Guardar Cambios' : 'Registrar Negocio' }}
              </button>
            </form>
          </div>
        </div>

        @if (hasBusiness()) {
          <div class="card border-0 shadow-sm mb-4">
            <div class="card-body">
              <h6 class="fw-bold mb-3">Horarios de Atención</h6>
              <div class="table-responsive">
                <table class="table table-sm">
                  <thead><tr><th>Día</th><th>Abierto</th><th>Apertura</th><th>Cierre</th></tr></thead>
                  <tbody id="horarios-body">
                    @for (h of horarios; track h.dia; let i = $index) {
                      <tr>
                        <td class="fw-semibold small">{{ h.dia }}</td>
                        <td><input type="checkbox" class="form-check-input" [(ngModel)]="h.abierto" [name]="'abierto-' + i"></td>
                        <td>
                          <input type="time" class="form-control form-control-sm" [(ngModel)]="h.apertura" [name]="'apertura-' + i"
                                 [disabled]="!h.abierto" style="width:100px">
                        </td>
                        <td>
                          <input type="time" class="form-control form-control-sm" [(ngModel)]="h.cierre" [name]="'cierre-' + i"
                                 [disabled]="!h.abierto" style="width:100px">
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
              @if (scheduleError()) { <div class="text-danger small mb-2">{{ scheduleError() }}</div> }
              <button class="btn btn-primary btn-sm" (click)="saveSchedule()" [disabled]="savingSchedule()">
                @if (savingSchedule()) { <span class="spinner-border spinner-border-sm me-1"></span> }
                <i class="bi bi-save"></i> Guardar Horarios
              </button>
            </div>
          </div>

          <div class="card border-0 shadow-sm mb-4">
            <div class="card-body">
              <h6 class="fw-bold mb-3">Imagen de Portada</h6>
              @if (previewUrl()) {
                <img [src]="previewUrl()" class="d-block mb-2 rounded" style="max-height:200px;object-fit:cover;width:100%" id="portada-preview" [alt]="'Vista previa'" loading="lazy">
              }
              <input type="file" class="form-control form-control-sm" accept="image/jpeg,image/png,image/webp" (change)="onFileSelected($event)">
              @if (uploadError()) { <div class="text-danger small mt-1">{{ uploadError() }}</div> }
            </div>
          </div>
        }
      </div>

      <div class="col-lg-4">
        @if (business(); as b) {
          <div class="card border-0 shadow-sm mb-4">
            <div class="card-body text-center">
              @if (b.imagen_portada_url) {
                <img [src]="b.imagen_portada_url" class="rounded mb-2" style="width:100%;max-height:120px;object-fit:cover" id="preview-thumb" [alt]="b.nombre" loading="lazy">
              } @else {
                <div class="img-placeholder rounded mb-2" style="height:80px"><i class="bi bi-shop"></i></div>
              }
              <h6 class="fw-bold mb-0" id="preview-nombre">{{ b.nombre }}</h6>
              <small class="text-muted" id="preview-categoria">{{ b.categoria || '—' }}</small>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class EntrepreneurMyBusinessComponent implements OnInit {
  private ent = inject(EntrepreneurService);
  private catService = inject(CategoryService);
  private toast = inject(ToastService);

  business = this.ent.business;
  busLoading = this.ent.businessLoading;
  categories = signal<any[]>([]);

  formNombre = '';
  formCategoria = 0;
  formDescripcion = '';
  formTelefono = '';
  formDistrito = '';
  formDireccion = '';
  saving = signal(false);

  horarios = [
    { dia: 'Lunes', abierto: true, apertura: '09:00', cierre: '18:00' },
    { dia: 'Martes', abierto: true, apertura: '09:00', cierre: '18:00' },
    { dia: 'Miércoles', abierto: true, apertura: '09:00', cierre: '18:00' },
    { dia: 'Jueves', abierto: true, apertura: '09:00', cierre: '18:00' },
    { dia: 'Viernes', abierto: true, apertura: '09:00', cierre: '18:00' },
    { dia: 'Sábado', abierto: true, apertura: '10:00', cierre: '16:00' },
    { dia: 'Domingo', abierto: false, apertura: null, cierre: null },
  ];
  scheduleError = signal<string | null>(null);
  savingSchedule = signal(false);

  previewUrl = signal<string | null>(null);
  selectedFile: File | null = null;
  uploadError = signal<string | null>(null);

  hasBusiness = signal(false);

  ngOnInit(): void {
    this.catService.getCategories().subscribe((res: any) => this.categories.set(res.items || res));
    this.ent.loadMyBusiness().subscribe({
      next: (b: any) => {
        if (b && b.id_emprendimiento) {
          this.hasBusiness.set(true);
          this.formNombre = b.nombre || '';
          this.formCategoria = b.id_categoria || 0;
          this.formDescripcion = b.descripcion || '';
          this.formTelefono = b.telefono || '';
          this.formDistrito = b.distrito || '';
          this.formDireccion = b.direccion || '';
          if (b.horarios?.length) this.horarios = b.horarios;
        }
      },
      error: () => this.hasBusiness.set(false)
    });
  }

  saveBusiness(): void {
    if (!this.formNombre.trim() || !this.formCategoria) { this.toast.warning('Nombre y categoría son obligatorios'); return; }
    this.saving.set(true);
    const data = {
      nombre: this.formNombre.trim(), id_categoria: this.formCategoria,
      descripcion: this.formDescripcion.trim(), telefono: this.formTelefono.trim(),
      distrito: this.formDistrito, direccion: this.formDireccion.trim()
    };
    const obs$ = this.hasBusiness() ? this.ent.updateBusiness(data) : this.ent.createBusiness(data);
    (obs$ as any).subscribe({
      next: () => { this.saving.set(false); this.hasBusiness.set(true); this.toast.success(this.hasBusiness() ? 'Negocio actualizado' : 'Negocio registrado'); },
      error: (err: any) => { this.saving.set(false); this.toast.error(err.error?.detail || 'Error'); }
    });
  }

  saveSchedule(): void {
    this.scheduleError.set(null);
    for (const h of this.horarios) {
      if (h.abierto && (!h.apertura || !h.cierre)) { this.scheduleError.set(`"${h.dia}" requiere horario si está abierto`); return; }
    }
    this.savingSchedule.set(true);
    this.ent.updateSchedule(this.horarios).subscribe({
      next: () => { this.savingSchedule.set(false); this.toast.success('Horarios guardados'); },
      error: (err) => { this.savingSchedule.set(false); this.scheduleError.set(err.error?.detail || 'Error'); }
    });
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { this.uploadError.set('Formato no válido. Usa JPG, PNG o WebP'); return; }
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => this.previewUrl.set(reader.result as string);
    reader.readAsDataURL(file);
    this.uploadImage();
  }

  private uploadImage(): void {
    if (!this.selectedFile) return;
    this.uploadError.set(null);
    const fd = new FormData();
    fd.append('imagen', this.selectedFile);
    this.ent.uploadImage(fd).subscribe({
      next: (res) => { this.toast.success('Imagen subida'); this.previewUrl.set(null); this.selectedFile = null; this.ent.loadMyBusiness().subscribe(); },
      error: (err) => { this.uploadError.set(err.error?.detail || 'Error al subir imagen'); }
    });
  }
}
