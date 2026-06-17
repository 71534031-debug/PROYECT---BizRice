import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EntrepreneurService } from '../../services/entrepreneur.service';
import { ToastService } from '../../services/toast.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-entrepreneur-products',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="fw-bold mb-0"><i class="bi bi-box-seam"></i> Productos</h4>
      <button class="btn btn-primary btn-sm" (click)="openCreate()"><i class="bi bi-plus-lg"></i> Añadir Producto</button>
    </div>

    <div class="mb-3">
      <input type="text" class="form-control" placeholder="Buscar productos..." [(ngModel)]="searchTerm" (keyup)="onSearch()">
    </div>

    @if (loading()) { <div class="text-center py-4"><div class="spinner-border text-primary"></div></div> }

    <div class="row g-3" id="products-grid">
      @for (p of products(); track p.id_producto) {
        <div class="col-6 col-md-4 col-lg-3">
          <div class="card border-0 shadow-sm h-100 producto-card">
            @if (p.imagen_url) {
              <img [src]="p.imagen_url" class="card-img-top product-img" [alt]="p.nombre" [attr.loading]="'lazy'">
            } @else {
              <div class="img-placeholder product-img d-flex align-items-center justify-content-center"><i class="bi bi-box"></i></div>
            }
            <div class="card-body p-2">
              <small class="fw-semibold d-block text-truncate">{{ p.nombre }}</small>
              @if (p.descripcion) { <small class="text-muted d-block text-truncate">{{ p.descripcion }}</small> }
              <span class="fw-bold text-primary precio">S/ {{ (p.precio ?? 0).toFixed(2) }}</span>
              <span class="badge d-block mt-1" [class.bg-success]="p.estado_stock==='disponible'" [class.bg-warning]="p.estado_stock==='bajo_stock'" [class.bg-danger]="p.estado_stock==='agotado'">
                {{ p.estado_stock || 'disponible' }}
              </span>
              <div class="d-flex gap-1 mt-2">
                <button class="btn btn-outline-primary btn-sm flex-grow-1" (click)="openEdit(p)"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-outline-danger btn-sm" (click)="openDelete(p)"><i class="bi bi-trash"></i></button>
              </div>
            </div>
          </div>
        </div>
      } @empty {
        @if (!loading()) {
          <div class="col-12 text-center py-5 text-muted">
            <i class="bi bi-box-seam fs-1 d-block mb-2"></i>
            <p>No hay productos aún. ¡Añade tu primer producto!</p>
          </div>
        }
      }
    </div>

    @if (showModal()) {
      <div class="modal d-block" tabindex="-1" style="background:rgba(0,0,0,0.5)">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h6 class="modal-title fw-bold">{{ editingId() ? 'Editar' : 'Nuevo' }} Producto</h6>
              <button type="button" class="btn-close" (click)="showModal.set(false)"></button>
            </div>
            <div class="modal-body">
              <div class="mb-2">
                <label class="form-label small fw-semibold">Nombre <span class="text-danger">*</span></label>
                <input class="form-control form-control-sm" [(ngModel)]="formNombre"
                       [class.is-invalid]="submitted && !formNombre.trim()" [class.is-valid]="submitted && formNombre.trim()">
                @if (submitted && !formNombre.trim()) {
                  <div class="invalid-feedback">El nombre es obligatorio</div>
                }
              </div>
              <div class="mb-2">
                <label class="form-label small fw-semibold">Descripción</label>
                <textarea class="form-control form-control-sm" rows="2" [(ngModel)]="formDescripcion"></textarea>
              </div>
              <div class="mb-2">
                <label class="form-label small fw-semibold">Precio (S/)</label>
                <input type="number" class="form-control form-control-sm" step="0.01" [(ngModel)]="formPrecio"
                       [class.is-invalid]="submitted && (formPrecio === null || formPrecio === undefined || formPrecio < 0)"
                       [class.is-valid]="submitted && formPrecio !== null && formPrecio >= 0">
                @if (submitted && (formPrecio === null || formPrecio === undefined || formPrecio < 0)) {
                  <div class="invalid-feedback">Ingresa un precio válido</div>
                }
              </div>
              <div class="mb-2">
                <label class="form-label small fw-semibold">Stock</label>
                <input type="number" class="form-control form-control-sm" [(ngModel)]="formStock" (input)="updateStockLabel()">
                <small class="text-muted" id="prod-stock-label">{{ stockLabel() }}</small>
              </div>
              <div class="mb-2">
                <label class="form-label small fw-semibold">Imagen</label>
                <input type="file" class="form-control form-control-sm" accept="image/jpeg,image/png,image/webp" (change)="onFileSelected($event)">
                @if (previewUrl()) {
                  <img [src]="previewUrl()" class="mt-1 rounded" style="max-height:80px" alt="Vista previa del producto" loading="lazy">
                }
              </div>
              @if (formError()) { <div class="text-danger small mt-1">{{ formError() }}</div> }
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
            <div class="modal-body"><p class="small mb-0">¿Eliminar <strong>{{ deleteName }}</strong>?</p></div>
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
export class EntrepreneurProductsComponent implements OnInit {
  private ent = inject(EntrepreneurService);
  private toast = inject(ToastService);

  products = this.ent.products;
  submitted = false;
  loading = this.ent.productsLoading;
  searchTerm = '';
  private searchTimeout: any;

  showModal = signal(false);
  editingId = signal<number | null>(null);
  formNombre = '';
  formDescripcion = '';
  formPrecio: number | null = null;
  formStock = 10;
  formEstadoStock = 'disponible';
  previewUrl = signal<string | null>(null);
  selectedFile: File | null = null;
  formError = signal<string | null>(null);
  submitting = signal(false);

  showDeleteModal = signal(false);
  deleteId: number | null = null;
  deleteName = '';

  stockLabel = signal('Disponible');

  ngOnInit(): void {
    this.loadProducts();
  }

  private loadProducts(): void {
    this.ent.loadProducts(1, 50, this.searchTerm.trim() || undefined).subscribe();
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadProducts(), 400);
  }

  openCreate(): void {
    this.editingId.set(null); this.formNombre = ''; this.formDescripcion = ''; this.formPrecio = null;
    this.formStock = 10; this.formEstadoStock = 'disponible'; this.previewUrl.set(null); this.selectedFile = null;
    this.formError.set(null); this.showModal.set(true);
  }

  openEdit(p: any): void {
    this.editingId.set(p.id_producto); this.formNombre = p.nombre; this.formDescripcion = p.descripcion || '';
    this.formPrecio = p.precio; this.formStock = p.stock ?? 10;
    this.formEstadoStock = p.estado_stock || 'disponible'; this.previewUrl.set(null); this.selectedFile = null;
    this.formError.set(null); this.showModal.set(true);
    this.updateStockLabel();
  }

  openDelete(p: any): void { this.deleteId = p.id_producto; this.deleteName = p.nombre; this.showDeleteModal.set(true); }

  updateStockLabel(): void {
    if (this.formStock <= 0) this.stockLabel.set('Agotado');
    else if (this.formStock <= 10) this.stockLabel.set('Bajo stock');
    else this.stockLabel.set('Disponible');
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => this.previewUrl.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  save(): void {
    this.submitted = true; this.formError.set(null);
    if (!this.formNombre.trim()) { this.formError.set('El nombre es obligatorio'); return; }
    this.submitting.set(true);

    const fd = new FormData();
    fd.append('nombre', this.formNombre.trim());
    if (this.formDescripcion.trim()) fd.append('descripcion', this.formDescripcion.trim());
    if (this.formPrecio != null) fd.append('precio', String(this.formPrecio));
    fd.append('stock', String(this.formStock));
    const stockState = this.formStock <= 0 ? 'agotado' : this.formStock <= 10 ? 'bajo_stock' : 'disponible';
    fd.append('estado_stock', stockState);
    if (this.selectedFile) fd.append('imagen', this.selectedFile);

    const obs = this.editingId() ? this.ent.updateProduct(this.editingId()!, fd) : this.ent.createProduct(fd);
    obs.subscribe({
      next: () => { this.submitting.set(false); this.showModal.set(false); this.toast.success(this.editingId() ? 'Producto actualizado' : 'Producto creado'); this.loadProducts(); },
      error: (err) => { this.submitting.set(false); this.formError.set(err.error?.detail || 'Error'); }
    });
  }

  confirmDelete(): void {
    this.submitting.set(true);
    this.ent.deleteProduct(this.deleteId!).subscribe({
      next: () => { this.submitting.set(false); this.showDeleteModal.set(false); this.toast.success('Producto eliminado'); this.loadProducts(); },
      error: (err) => { this.submitting.set(false); this.toast.error(err.error?.detail || 'Error'); }
    });
  }
}
