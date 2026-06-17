import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { noPassedDateValidator, endDateAfterStartValidator, todayString } from './date.validators';
import { Promocion } from '../../models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-promotion-form',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
      <div class="modal-body">
        <input type="hidden" formControlName="id">

        <div class="mb-3">
          <label class="form-label small fw-semibold">Título de la promoción</label>
          <input type="text" class="form-control"
                 [ngClass]="{'is-invalid': form.get('titulo')?.invalid && form.get('titulo')?.touched}"
                 formControlName="titulo" placeholder="Ej: 20% de descuento en todos los productos">
          @if (form.get('titulo')?.errors?.['required'] && form.get('titulo')?.touched) {
            <div class="invalid-feedback">El título es obligatorio</div>
          }
          @if (form.get('titulo')?.errors?.['minlength'] && form.get('titulo')?.touched) {
            <div class="invalid-feedback">Mínimo 5 caracteres</div>
          }
        </div>

        <div class="mb-3">
          <label class="form-label small fw-semibold">Descripción</label>
          <textarea class="form-control" formControlName="descripcion" rows="2"
                    placeholder="Describe los detalles de tu promoción"></textarea>
        </div>

        <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label small fw-semibold">Fecha de inicio</label>
            <input type="date" class="form-control"
                   [ngClass]="{'is-invalid': form.get('fecha_inicio')?.invalid && form.get('fecha_inicio')?.touched}"
                   formControlName="fecha_inicio" [attr.min]="todayString">
            @if (form.get('fecha_inicio')?.errors?.['pastDate'] && form.get('fecha_inicio')?.touched) {
              <div class="invalid-feedback">La fecha de inicio no puede ser anterior a hoy</div>
            }
            @if (form.get('fecha_inicio')?.errors?.['required'] && form.get('fecha_inicio')?.touched) {
              <div class="invalid-feedback">Selecciona una fecha de inicio</div>
            }
          </div>
          <div class="col-md-6 mb-3">
            <label class="form-label small fw-semibold">Fecha de fin</label>
            <input type="date" class="form-control"
                   [ngClass]="{'is-invalid': form.get('fecha_fin')?.invalid && form.get('fecha_fin')?.touched}"
                   formControlName="fecha_fin" [attr.min]="todayString">
            @if (form.get('fecha_fin')?.errors?.['pastDate'] && form.get('fecha_fin')?.touched) {
              <div class="invalid-feedback">La fecha de fin no puede ser anterior a hoy</div>
            }
            @if (form.get('fecha_fin')?.errors?.['endBeforeStart'] && form.get('fecha_fin')?.touched) {
              <div class="invalid-feedback">La fecha fin debe ser posterior a la fecha de inicio</div>
            }
            @if (form.get('fecha_fin')?.errors?.['required'] && form.get('fecha_fin')?.touched) {
              <div class="invalid-feedback">Selecciona una fecha de fin</div>
            }
          </div>
        </div>

        <div class="mb-3">
          <label class="form-label small fw-semibold">Estado</label>
          <select class="form-select" formControlName="estado">
            <option value="activa">Activa</option>
            <option value="borrador">Borrador</option>
            <option value="vencida">Vencida</option>
          </select>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" (click)="onCancel()">Cancelar</button>
        <button type="submit" class="btn btn-primary" [disabled]="form.invalid || submitting">
          @if (submitting) {
            <span class="spinner-border spinner-border-sm me-1"></span>
          }
          <i class="bi bi-check-lg"></i>
          {{ editing ? 'Actualizar Promoción' : 'Guardar Promoción' }}
        </button>
      </div>
    </form>
  `
})
export class PromotionFormComponent implements OnInit {
  @Input() promotion?: Promocion | null = null;
  @Output() saved = new EventEmitter<boolean>();
  @Output() cancelled = new EventEmitter<void>();

  form!: FormGroup;
  editing = false;
  submitting = false;
  todayString = todayString();

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.editing = !!this.promotion;
    this.form = this.fb.group({
      id: [''],
      titulo: ['', [Validators.required, Validators.minLength(5)]],
      descripcion: [''],
      fecha_inicio: ['', [Validators.required, noPassedDateValidator()]],
      fecha_fin: ['', [Validators.required, noPassedDateValidator(), endDateAfterStartValidator('fecha_inicio')]],
      estado: ['activa', Validators.required]
    });

    if (this.promotion) {
      this.form.patchValue({
        id: this.promotion.id_promocion,
        titulo: this.promotion.titulo,
        descripcion: this.promotion.descripcion || '',
        fecha_inicio: this.promotion.fecha_inicio || '',
        fecha_fin: this.promotion.fecha_fin || '',
        estado: this.promotion.estado
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
      return;
    }
    this.submitting = true;
    this.saved.emit(true);
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
