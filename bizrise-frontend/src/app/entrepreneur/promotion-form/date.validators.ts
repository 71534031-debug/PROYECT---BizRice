import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function todayString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function toDateMidnight(value: string | Date): Date {
  const d = typeof value === 'string' ? new Date(value) : value;
  d.setHours(0, 0, 0, 0);
  return d;
}

export function noPassedDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const selected = toDateMidnight(control.value);
    const today = toDateMidnight(new Date());
    return selected < today ? { pastDate: true } : null;
  };
}

export function endDateAfterStartValidator(startControlName: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const parent = control.parent;
    if (!parent) return null;
    const startVal = parent.get(startControlName)?.value;
    const endVal = control.value;
    if (!startVal || !endVal) return null;
    const start = toDateMidnight(startVal);
    const end = toDateMidnight(endVal);
    return end <= start ? { endBeforeStart: true } : null;
  };
}
