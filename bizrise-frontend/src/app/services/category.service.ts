import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Categoria } from '../models';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly API = `${environment.apiUrl}/categories`;

  private categoriesSignal = signal<Categoria[]>([]);
  private loadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);

  readonly categories = this.categoriesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  constructor(private http: HttpClient) {}

  loadCategories(): Observable<{ items: Categoria[] }> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    return this.http.get<{ items: Categoria[] }>(this.API).pipe(
      tap({
        next: (data) => {
          this.categoriesSignal.set(data.items);
          this.loadingSignal.set(false);
        },
        error: (err) => {
          this.errorSignal.set(err.error?.detail || err.message);
          this.loadingSignal.set(false);
        }
      })
    );
  }

  getCategories(): Observable<{ items: Categoria[] }> {
    return this.http.get<{ items: Categoria[] }>(this.API);
  }

  clearError(): void {
    this.errorSignal.set(null);
  }
}
