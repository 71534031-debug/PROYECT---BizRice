import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminMetrics } from '../../services/admin.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [FormsModule],
  template: `
    <header class="admin-topbar sticky-top px-4 py-3 d-flex align-items-center justify-content-between">
      <div class="d-flex align-items-center gap-3 flex-grow-1 search-wrapper">
        <i class="bi bi-search text-muted position-absolute ms-3"></i>
        <input type="text" class="search-input w-100" [(ngModel)]="searchTerm" (keydown.enter)="applyFilters()" placeholder="Buscar usuarios...">
      </div>
    </header>
    <div class="p-4 flex-grow-1">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="fw-bold mb-0"><i class="bi bi-people"></i> Usuarios</h4>
        <button class="btn btn-primary btn-sm" (click)="openCreate()"><i class="bi bi-plus-lg"></i> Nuevo Usuario</button>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-md-2 col-6"><div class="card border-0 shadow-sm p-3 text-center">
          <small class="text-muted">Total</small><h5 class="fw-bold mb-0">{{ counterTotal() }}</h5>
        </div></div>
        <div class="col-md-2 col-6"><div class="card border-0 shadow-sm p-3 text-center">
          <small class="text-muted">Emprendedores</small><h5 class="fw-bold mb-0">{{ m()?.total_emprendedores ?? '—' }}</h5>
        </div></div>
        <div class="col-md-2 col-6"><div class="card border-0 shadow-sm p-3 text-center">
          <small class="text-muted">Clientes</small><h5 class="fw-bold mb-0">{{ m()?.total_clientes ?? '—' }}</h5>
        </div></div>
      </div>

      <form class="row g-2 mb-4" (ngSubmit)="applyFilters()">
        <div class="col-md-3">
          <select class="form-select form-select-sm" [(ngModel)]="filterRol" name="rol">
            <option value="">Todos los roles</option>
            <option value="emprendedor">Emprendedor</option>
            <option value="cliente">Cliente</option>
            <option value="administrador">Administrador</option>
          </select>
        </div>
        <div class="col-md-3">
          <select class="form-select form-select-sm" [(ngModel)]="filterEstado" name="estado">
            <option value="">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="suspendido">Suspendido</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>
        <div class="col-md-2">
          <button class="btn btn-primary btn-sm w-100" type="submit"><i class="bi bi-funnel"></i> Filtrar</button>
        </div>
      </form>

      @if (loading()) { <div class="text-center py-4"><div class="spinner-border text-primary"></div></div> }

      <div class="table-responsive">
        <table class="table admin-table">
          <thead><tr><th>Usuario</th><th>Rol</th><th>Registro</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody id="users-tbody">
            @for (u of users(); track u.id_usuario) {
              <tr>
                <td>
                  <div class="user-info">
                    <div class="avatar-placeholder" [class]="'avatar-' + avatarColor(u.id_usuario)">
                      {{ (u.nombre?.[0] || '?') + (u.apellido?.[0] || '') }}
                    </div>
                    <div>
                      <span class="user-name">{{ u.nombre + ' ' + u.apellido }}</span>
                      <span class="user-email d-block">{{ u.correo }}</span>
                    </div>
                  </div>
                </td>
                <td><span class="badge" [class.bg-primary]="u.rol==='emprendedor'" [class.bg-info]="u.rol==='cliente'" [class.bg-dark]="u.rol==='administrador'">{{ u.rol }}</span></td>
                <td class="small text-muted">{{ formatDate(u.fecha_registro) }}</td>
                <td>
                  <span class="badge" [class.bg-success]="u.estado==='activo'" [class.bg-warning]="u.estado==='suspendido'" [class.bg-secondary]="u.estado==='inactivo'">{{ u.estado || 'activo' }}</span>
                </td>
                <td>
                  <div class="action-btn-group d-flex gap-1">
                    <button class="btn btn-outline-primary btn-sm" (click)="openEdit(u)"><i class="bi bi-pencil"></i></button>
                    @if (u.estado === 'activo') {
                      <button class="btn btn-outline-warning btn-sm" (click)="suspend(u)"><i class="bi bi-pause-circle"></i></button>
                    } @else if (u.estado === 'suspendido' || u.estado === 'inactivo') {
                      <button class="btn btn-outline-success btn-sm" (click)="activate(u)"><i class="bi bi-play-circle"></i></button>
                    }
                    <button class="btn btn-outline-danger btn-sm" (click)="openDelete(u)"><i class="bi bi-trash"></i></button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="text-center text-muted py-4">No se encontraron usuarios</td></tr>
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

    <footer class="admin-footer">
      <div class="d-flex justify-content-between align-items-center">
        <small class="text-muted">&copy; 2026 BizRise Huancayo</small>
      </div>
    </footer>

    @if (showCreateModal()) {
      <div class="modal d-block" tabindex="-1" style="background:rgba(0,0,0,0.5)">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header"><h6 class="modal-title fw-bold">Nuevo Usuario</h6><button type="button" class="btn-close" (click)="showCreateModal.set(false)"></button></div>
            <div class="modal-body">
              <div class="row g-2">
                <div class="col-6">
                  <label class="form-label small">Nombre</label>
                  <input class="form-control form-control-sm" [(ngModel)]="formNombre"
                         [class.is-invalid]="submitted && !formNombre.trim()" [class.is-valid]="submitted && formNombre.trim()">
                  @if (submitted && !formNombre.trim()) { <div class="invalid-feedback">Campo obligatorio</div> }
                </div>
                <div class="col-6">
                  <label class="form-label small">Apellido</label>
                  <input class="form-control form-control-sm" [(ngModel)]="formApellido"
                         [class.is-invalid]="submitted && !formApellido.trim()" [class.is-valid]="submitted && formApellido.trim()">
                  @if (submitted && !formApellido.trim()) { <div class="invalid-feedback">Campo obligatorio</div> }
                </div>
              </div>
              <div class="mb-2">
                <label class="form-label small">Correo</label>
                <input type="email" class="form-control form-control-sm" [(ngModel)]="formCorreo"
                       [class.is-invalid]="submitted && !formCorreo.trim()" [class.is-valid]="submitted && formCorreo.trim()">
                @if (submitted && !formCorreo.trim()) { <div class="invalid-feedback">Campo obligatorio</div> }
              </div>
              <div class="mb-2">
                <label class="form-label small">Contraseña</label>
                <input type="password" class="form-control form-control-sm" [(ngModel)]="formContrasena"
                       [class.is-invalid]="submitted && !formContrasena.trim()" [class.is-valid]="submitted && formContrasena.trim()">
                @if (submitted && !formContrasena.trim()) { <div class="invalid-feedback">Campo obligatorio</div> }
              </div>
              <div class="mb-2"><label class="form-label small">Rol</label>
                <select class="form-select form-select-sm" [(ngModel)]="formRol">
                  <option value="emprendedor">Emprendedor</option>
                  <option value="cliente">Cliente</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>
              @if (formError()) { <div class="text-danger small mt-1">{{ formError() }}</div> }
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary btn-sm" (click)="showCreateModal.set(false)">Cancelar</button>
              <button class="btn btn-primary btn-sm" (click)="confirmCreate()" [disabled]="formSubmitting()">
                @if (formSubmitting()) { <span class="btn-spinner"></span> }
                Crear
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    @if (showEditModal()) {
      <div class="modal d-block" tabindex="-1" style="background:rgba(0,0,0,0.5)">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header"><h6 class="modal-title fw-bold">Editar Usuario</h6><button type="button" class="btn-close" (click)="showEditModal.set(false)"></button></div>
            <div class="modal-body">
              <div class="row g-2">
                <div class="col-6">
                  <label class="form-label small">Nombre</label>
                  <input class="form-control form-control-sm" [(ngModel)]="formNombre"
                         [class.is-invalid]="submitted && !formNombre.trim()" [class.is-valid]="submitted && formNombre.trim()">
                  @if (submitted && !formNombre.trim()) { <div class="invalid-feedback">Campo obligatorio</div> }
                </div>
                <div class="col-6">
                  <label class="form-label small">Apellido</label>
                  <input class="form-control form-control-sm" [(ngModel)]="formApellido"
                         [class.is-invalid]="submitted && !formApellido.trim()" [class.is-valid]="submitted && formApellido.trim()">
                  @if (submitted && !formApellido.trim()) { <div class="invalid-feedback">Campo obligatorio</div> }
                </div>
              </div>
              <div class="mb-2">
                <label class="form-label small">Correo</label>
                <input type="email" class="form-control form-control-sm" [(ngModel)]="formCorreo"
                       [class.is-invalid]="submitted && !formCorreo.trim()" [class.is-valid]="submitted && formCorreo.trim()">
                @if (submitted && !formCorreo.trim()) { <div class="invalid-feedback">Campo obligatorio</div> }
              </div>
              <div class="mb-2"><label class="form-label small">Rol</label>
                <select class="form-select form-select-sm" [(ngModel)]="formRol">
                  <option value="emprendedor">Emprendedor</option>
                  <option value="cliente">Cliente</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>
              <div class="mb-2"><label class="form-label small">Estado</label>
                <select class="form-select form-select-sm" [(ngModel)]="formEstado">
                  <option value="activo">Activo</option>
                  <option value="suspendido">Suspendido</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
              @if (formError()) { <div class="text-danger small mt-1">{{ formError() }}</div> }
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary btn-sm" (click)="showEditModal.set(false)">Cancelar</button>
              <button class="btn btn-primary btn-sm" (click)="confirmEdit()" [disabled]="formSubmitting()">
                @if (formSubmitting()) { <span class="btn-spinner"></span> }
                Guardar
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
            <div class="modal-body">
              <p class="small mb-0">¿Desactivar usuario <strong>{{ formNombre }} {{ formApellido }}</strong>?</p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary btn-sm" (click)="showDeleteModal.set(false)">Cancelar</button>
              <button class="btn btn-danger btn-sm" (click)="confirmDelete()" [disabled]="formSubmitting()">
                @if (formSubmitting()) { <span class="btn-spinner"></span> }
                Desactivar
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class AdminUsersComponent implements OnInit {
  private admin = inject(AdminService);
  private toast = inject(ToastService);

  searchTerm = '';
  filterRol = '';
  filterEstado = '';
  page = signal(1);
  pages = signal(0);
  counterTotal = signal(0);
  m = signal<any>(null);
  submitted = false;

  users = this.admin.users;
  loading = this.admin.usersLoading;

  showCreateModal = signal(false);
  showEditModal = signal(false);
  showDeleteModal = signal(false);
  formNombre = '';
  formApellido = '';
  formCorreo = '';
  formContrasena = '';
  formRol = 'emprendedor';
  formEstado = 'activo';
  formError = signal<string | null>(null);
  formSubmitting = signal(false);
  editUserId: number | null = null;
  deleteUserId: number | null = null;
  avatarColors = ['avatar-purple', 'avatar-blue', 'avatar-green', 'avatar-red', 'avatar-orange', 'avatar-teal'];

  ngOnInit(): void {
    this.loadData();
    this.admin.loadMetrics().subscribe((res: any) => this.m.set(res));
  }

  private loadData(): void {
    const params: any = { page: this.page(), size: 10 };
    if (this.filterRol) params.rol = this.filterRol;
    if (this.filterEstado) params.estado = this.filterEstado;
    if (this.searchTerm.trim()) params.busqueda = this.searchTerm.trim();
    this.admin.loadUsers(params).subscribe((res) => { this.pages.set(res.pages); this.counterTotal.set(res.total); });
  }

  avatarColor(id: number): string { return this.avatarColors[id % this.avatarColors.length]; }
  applyFilters(): void { this.page.set(1); this.loadData(); }
  goTo(p: number): void { if (p >= 1 && p <= this.pages()) { this.page.set(p); this.loadData(); } }
  formatDate(d: any): string { if (!d) return '—'; return new Date(d).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' }); }

  openCreate(): void {
    this.formNombre = ''; this.formApellido = ''; this.formCorreo = ''; this.formContrasena = ''; this.formRol = 'emprendedor';
    this.formError.set(null); this.showCreateModal.set(true);
  }

  openEdit(u: any): void {
    this.editUserId = u.id_usuario; this.formNombre = u.nombre; this.formApellido = u.apellido;
    this.formCorreo = u.correo; this.formRol = u.rol; this.formEstado = u.estado || 'activo';
    this.formError.set(null); this.showEditModal.set(true);
  }

  openDelete(u: any): void {
    this.deleteUserId = u.id_usuario; this.formNombre = u.nombre; this.formApellido = u.apellido;
    this.formError.set(null); this.showDeleteModal.set(true);
  }

  confirmCreate(): void {
    this.submitted = true; this.formError.set(null);
    if (!this.formNombre.trim() || !this.formApellido.trim() || !this.formCorreo.trim() || !this.formContrasena.trim()) {
      this.formError.set('Todos los campos son obligatorios'); return;
    }
    this.formSubmitting.set(true);
    this.admin.createUser({
      nombre: this.formNombre.trim(), apellido: this.formApellido.trim(),
      correo: this.formCorreo.trim(), contrasena: this.formContrasena, rol: this.formRol
    }).subscribe({
      next: () => { this.formSubmitting.set(false); this.showCreateModal.set(false); this.toast.success('Usuario creado'); this.loadData(); },
      error: (err) => { this.formSubmitting.set(false); this.formError.set(err.error?.detail || 'Error'); }
    });
  }

  confirmEdit(): void {
    this.submitted = true; this.formError.set(null);
    this.formSubmitting.set(true);
    this.admin.updateUser(this.editUserId!, {
      nombre: this.formNombre.trim(), apellido: this.formApellido.trim(),
      correo: this.formCorreo.trim(), rol: this.formRol, estado: this.formEstado
    }).subscribe({
      next: () => { this.formSubmitting.set(false); this.showEditModal.set(false); this.toast.success('Usuario actualizado'); this.loadData(); },
      error: (err) => { this.formSubmitting.set(false); this.formError.set(err.error?.detail || 'Error'); }
    });
  }

  suspend(u: any): void {
    this.admin.suspendUser(u.id_usuario).subscribe({
      next: () => { this.toast.success(`"${u.nombre}" suspendido`); this.loadData(); },
      error: (err) => this.toast.error(err.error?.detail || 'Error')
    });
  }

  activate(u: any): void {
    this.admin.activateUser(u.id_usuario).subscribe({
      next: () => { this.toast.success(`"${u.nombre}" activado`); this.loadData(); },
      error: (err) => this.toast.error(err.error?.detail || 'Error')
    });
  }

  confirmDelete(): void {
    this.formSubmitting.set(true);
    this.admin.deleteUser(this.deleteUserId!).subscribe({
      next: () => { this.formSubmitting.set(false); this.showDeleteModal.set(false); this.toast.success('Usuario desactivado'); this.loadData(); },
      error: (err) => { this.formSubmitting.set(false); this.formError.set(err.error?.detail || 'Error'); }
    });
  }
}
