import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EntrepreneurService } from '../../services/entrepreneur.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-entrepreneur-settings',
  standalone: true,
  imports: [FormsModule],
  template: `
    <h4 class="fw-bold mb-4"><i class="bi bi-gear"></i> Configuración</h4>

    <div class="row">
      <div class="col-lg-8">
        <div class="card border-0 shadow-sm mb-4">
          <div class="card-body">
            <h6 class="fw-bold mb-3">Ajustes de Cuenta</h6>
            <div class="mb-3">
              <label class="form-label small fw-semibold">Correo electrónico</label>
              <input class="form-control readonly-bg" [value]="auth.user()?.correo || ''" readonly style="cursor:not-allowed" id="settings-email">
            </div>
          </div>
        </div>

        <div class="card border-0 shadow-sm mb-4">
          <div class="card-body">
            <h6 class="fw-bold mb-3">Cambiar Contraseña</h6>
            <form #passForm="ngForm" (ngSubmit)="changePassword()">
              <div class="mb-3">
                <label class="form-label small fw-semibold">Contraseña Actual</label>
                <input type="password" class="form-control" [(ngModel)]="passActual" name="actual" required
                       [class.is-invalid]="submitted && !passActual" [class.is-valid]="submitted && passActual">
                @if (submitted && !passActual) {
                  <div class="invalid-feedback">Campo obligatorio</div>
                }
              </div>
              <div class="mb-3">
                <label class="form-label small fw-semibold">Nueva Contraseña</label>
                <input type="password" class="form-control" [(ngModel)]="passNueva" name="nueva" required minlength="8"
                       [class.is-invalid]="submitted && (!passNueva || passNueva.length < 8 || !hasNumber(passNueva))"
                       [class.is-valid]="submitted && passNueva.length >= 8 && hasNumber(passNueva)">
                <small class="text-muted">Mín. 8 caracteres y al menos 1 número</small>
                @if (submitted && !passNueva) {
                  <div class="invalid-feedback">Campo obligatorio</div>
                } @else if (submitted && (passNueva.length < 8 || !hasNumber(passNueva))) {
                  <div class="invalid-feedback">Mín. 8 caracteres y al menos 1 número</div>
                }
              </div>
              <div class="mb-3">
                <label class="form-label small fw-semibold">Confirmar Contraseña</label>
                <input type="password" class="form-control" [(ngModel)]="passConfirmar" name="confirmar" required
                       [class.is-invalid]="submitted && (!passConfirmar || passNueva !== passConfirmar)"
                       [class.is-valid]="submitted && passConfirmar && passNueva === passConfirmar">
                @if (submitted && !passConfirmar) {
                  <div class="invalid-feedback">Confirma tu contraseña</div>
                } @else if (submitted && passNueva !== passConfirmar) {
                  <div class="invalid-feedback">Las contraseñas no coinciden</div>
                }
              </div>
              @if (passError()) { <div class="alert alert-danger py-2 small">{{ passError() }}</div> }
              @if (passSuccess()) { <div class="alert alert-success py-2 small">{{ passSuccess() }}</div> }
              <button type="submit" class="btn btn-primary btn-sm" [disabled]="submittingPass()">
                @if (submittingPass()) { <span class="btn-spinner"></span> }
                <i class="bi bi-key"></i> Cambiar Contraseña
              </button>
            </form>
          </div>
        </div>

        <div class="card border-0 shadow-sm mb-4">
          <div class="card-body">
            <h6 class="fw-bold mb-3">Preferencias de Notificaciones</h6>
            <div class="form-check form-switch mb-2">
              <input class="form-check-input" type="checkbox" id="notif-email" [(ngModel)]="notifEmail">
              <label class="form-check-label small" for="notif-email">Notificaciones por correo electrónico</label>
            </div>
            <div class="form-check form-switch mb-3">
              <input class="form-check-input" type="checkbox" id="notif-whatsapp" [(ngModel)]="notifWhatsapp">
              <label class="form-check-label small" for="notif-whatsapp">Notificaciones por WhatsApp</label>
            </div>
            <button class="btn btn-primary btn-sm" (click)="saveNotif()">
              <i class="bi bi-save"></i> Guardar Preferencias
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class EntrepreneurSettingsComponent implements OnInit {
  private ent = inject(EntrepreneurService);
  auth = inject(AuthService);
  private toast = inject(ToastService);

  passActual = '';
  passNueva = '';
  passConfirmar = '';
  passError = signal<string | null>(null);
  passSuccess = signal<string | null>(null);
  submittingPass = signal(false);
  submitted = false;

  notifEmail = true;
  notifWhatsapp = false;

  hasNumber(v: string): boolean { return /\d/.test(v); }

  ngOnInit(): void {
    const saved = localStorage.getItem('bizrise_notif_prefs');
    if (saved) {
      try { const p = JSON.parse(saved); this.notifEmail = p.email_notificaciones ?? true; this.notifWhatsapp = p.whatsapp_notificaciones ?? false; } catch {}
    }
  }

  changePassword(): void {
    this.submitted = true;
    this.passError.set(null); this.passSuccess.set(null);
    if (!this.passActual || !this.passNueva || !this.passConfirmar) { this.passError.set('Todos los campos son obligatorios'); return; }
    if (this.passNueva.length < 8) { this.passError.set('La nueva contraseña debe tener al menos 8 caracteres'); return; }
    if (!/\d/.test(this.passNueva)) { this.passError.set('La nueva contraseña debe contener al menos 1 número'); return; }
    if (this.passNueva !== this.passConfirmar) { this.passError.set('Las contraseñas no coinciden'); return; }
    this.submittingPass.set(true);
    this.ent.changePassword({ contrasena_actual: this.passActual, nueva_contrasena: this.passNueva, confirmar_contrasena: this.passConfirmar }).subscribe({
      next: () => { this.submittingPass.set(false); this.passSuccess.set('Contraseña actualizada correctamente'); this.passActual = ''; this.passNueva = ''; this.passConfirmar = ''; this.toast.success('Contraseña actualizada'); },
      error: (err) => { this.submittingPass.set(false); this.passError.set(err.error?.detail || 'Error al cambiar contraseña'); }
    });
  }

  saveNotif(): void {
    const prefs = { email_notificaciones: this.notifEmail, whatsapp_notificaciones: this.notifWhatsapp };
    localStorage.setItem('bizrise_notif_prefs', JSON.stringify(prefs));
    this.toast.success('Preferencias guardadas');
  }
}
