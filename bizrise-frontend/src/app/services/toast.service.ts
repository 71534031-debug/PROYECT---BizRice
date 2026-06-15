import { Injectable, Injector, inject, ApplicationRef, createComponent } from '@angular/core';

export type ToastType = 'success' | 'danger' | 'warning' | 'info';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private appRef = inject(ApplicationRef);
  private container: HTMLElement | null = null;

  private ensureContainer(): HTMLElement {
    if (!this.container) {
      this.container = document.getElementById('toast-container');
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.style.cssText = 'position:fixed;top:1rem;right:1rem;z-index:9999;display:flex;flex-direction:column;gap:0.5rem';
        document.body.appendChild(this.container);
      }
    }
    return this.container;
  }

  show(message: string, type: ToastType = 'info', duration = 3500): void {
    const container = this.ensureContainer();
    const toast = document.createElement('div');
    const bgClass: Record<ToastType, string> = {
      success: 'bg-success text-white',
      danger: 'bg-danger text-white',
      warning: 'bg-warning text-dark',
      info: 'bg-primary text-white',
    };
    const iconMap: Record<ToastType, string> = {
      success: 'bi-check-circle-fill',
      danger: 'bi-exclamation-triangle-fill',
      warning: 'bi-exclamation-circle-fill',
      info: 'bi-info-circle-fill',
    };
    toast.className = `toast show align-items-center border-0 ${bgClass[type]}`;
    toast.role = 'alert';
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center gap-2">
          <i class="bi ${iconMap[type]}"></i>
          <span>${message}</span>
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>`;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, duration);
  }

  success(msg: string): void { this.show(msg, 'success'); }
  error(msg: string): void { this.show(msg, 'danger'); }
  warning(msg: string): void { this.show(msg, 'warning'); }
  info(msg: string): void { this.show(msg, 'info'); }
}
