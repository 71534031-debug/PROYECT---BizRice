import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  NegocioPropio, Producto, Promocion, EntrepreneurStats,
  PaginatedResponse, MessageResponse
} from '../models';

@Injectable({ providedIn: 'root' })
export class EntrepreneurService {
  private readonly API = `${environment.apiUrl}/entrepreneur`;

  private businessSignal = signal<NegocioPropio | null>(null);
  private businessLoadingSignal = signal(false);

  private productsSignal = signal<Producto[]>([]);
  private productsTotalSignal = signal(0);
  private productsLoadingSignal = signal(false);

  private promotionsSignal = signal<Promocion[]>([]);
  private promotionsLoadingSignal = signal(false);

  private statsSignal = signal<EntrepreneurStats | null>(null);
  private statsLoadingSignal = signal(false);

  private loadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);

  readonly business = this.businessSignal.asReadonly();
  readonly businessLoading = this.businessLoadingSignal.asReadonly();

  readonly products = this.productsSignal.asReadonly();
  readonly productsTotal = this.productsTotalSignal.asReadonly();
  readonly productsLoading = this.productsLoadingSignal.asReadonly();

  readonly promotions = this.promotionsSignal.asReadonly();
  readonly promotionsLoading = this.promotionsLoadingSignal.asReadonly();

  readonly stats = this.statsSignal.asReadonly();
  readonly statsLoading = this.statsLoadingSignal.asReadonly();

  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  constructor(private http: HttpClient) {}

  loadMyBusiness(): Observable<NegocioPropio> {
    this.businessLoadingSignal.set(true);
    return this.http.get<NegocioPropio>(`${this.API}/business`).pipe(
      tap({
        next: (data) => {
          this.businessSignal.set(data);
          this.businessLoadingSignal.set(false);
        },
        error: (err) => {
          this.errorSignal.set(err.error?.detail || err.message);
          this.businessLoadingSignal.set(false);
        }
      })
    );
  }

  createBusiness(data: {
    nombre: string; id_categoria: number; descripcion?: string;
    telefono?: string; direccion?: string; distrito?: string
  }): Observable<NegocioPropio> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    return this.http.post<NegocioPropio>(`${this.API}/business`, data).pipe(
      tap({
        next: (res) => {
          this.businessSignal.set(res);
          this.loadingSignal.set(false);
        },
        error: (err) => {
          this.errorSignal.set(err.error?.detail || err.message);
          this.loadingSignal.set(false);
        }
      })
    );
  }

  updateBusiness(data: {
    nombre?: string; id_categoria?: number; descripcion?: string;
    telefono?: string; direccion?: string; distrito?: string
  }): Observable<MessageResponse> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    return this.http.put<MessageResponse>(`${this.API}/business`, data).pipe(
      tap({
        next: () => {
          this.businessSignal.update((b) => b ? { ...b, ...data } : b);
          this.loadingSignal.set(false);
        },
        error: (err) => {
          this.errorSignal.set(err.error?.detail || err.message);
          this.loadingSignal.set(false);
        }
      })
    );
  }

  uploadImage(formData: FormData): Observable<{ imagen_url: string }> {
    return this.http.post<{ imagen_url: string }>(`${this.API}/business/image`, formData);
  }

  updateSchedule(horarios: { dia: string; abierto: boolean; apertura: string | null; cierre: string | null }[]): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(`${this.API}/business/schedule`, { horarios });
  }

  loadProducts(page = 1, size = 20, busqueda?: string): Observable<PaginatedResponse<Producto>> {
    this.productsLoadingSignal.set(true);
    let params = new HttpParams().set('page', page).set('size', size);
    if (busqueda) params = params.set('busqueda', busqueda);
    return this.http.get<PaginatedResponse<Producto>>(`${this.API}/products`, { params }).pipe(
      tap({
        next: (data) => {
          this.productsSignal.set(data.items);
          this.productsTotalSignal.set(data.total);
          this.productsLoadingSignal.set(false);
        },
        error: () => this.productsLoadingSignal.set(false)
      })
    );
  }

  createProduct(formData: FormData): Observable<Producto> {
    return this.http.post<Producto>(`${this.API}/products`, formData);
  }

  updateProduct(id: number, formData: FormData): Observable<Producto> {
    return this.http.put<Producto>(`${this.API}/products/${id}`, formData);
  }

  deleteProduct(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.API}/products/${id}`);
  }

  loadPromotions(): Observable<Promocion[]> {
    this.promotionsLoadingSignal.set(true);
    return this.http.get<Promocion[]>(`${this.API}/promotions`).pipe(
      tap({
        next: (data) => {
          this.promotionsSignal.set(data);
          this.promotionsLoadingSignal.set(false);
        },
        error: () => this.promotionsLoadingSignal.set(false)
      })
    );
  }

  createPromotion(data: {
    titulo: string; descripcion?: string; fecha_inicio?: string;
    fecha_fin?: string; estado?: string
  }): Observable<Promocion> {
    return this.http.post<Promocion>(`${this.API}/promotions`, data).pipe(
      tap((promo) => {
        this.promotionsSignal.update((list) => [...list, promo]);
      })
    );
  }

  updatePromotion(id: number, data: {
    titulo?: string; descripcion?: string; fecha_inicio?: string;
    fecha_fin?: string; estado?: string
  }): Observable<Promocion> {
    return this.http.put<Promocion>(`${this.API}/promotions/${id}`, data).pipe(
      tap((updated) => {
        this.promotionsSignal.update((list) =>
          list.map((p) => p.id_promocion === id ? updated : p)
        );
      })
    );
  }

  deletePromotion(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.API}/promotions/${id}`).pipe(
      tap(() => {
        this.promotionsSignal.update((list) =>
          list.filter((p) => p.id_promocion !== id)
        );
      })
    );
  }

  loadStats(): Observable<EntrepreneurStats> {
    this.statsLoadingSignal.set(true);
    return this.http.get<EntrepreneurStats>(`${this.API}/stats`).pipe(
      tap({
        next: (data) => {
          this.statsSignal.set(data);
          this.statsLoadingSignal.set(false);
        },
        error: () => this.statsLoadingSignal.set(false)
      })
    );
  }

  changePassword(data: {
    contrasena_actual: string; nueva_contrasena: string; confirmar_contrasena: string
  }): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(`${this.API}/settings/password`, data);
  }

  clearError(): void {
    this.errorSignal.set(null);
  }
}
