import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  BusinessListItem, BusinessDetail, Producto, PaginatedResponse,
  BusinessReviewData, Review, MessageResponse
} from '../models';

export interface BusinessFilterParams {
  page?: number;
  size?: number;
  busqueda?: string;
  categoria?: number;
  distrito?: string;
  orden?: string;
}

@Injectable({ providedIn: 'root' })
export class BusinessService {
  private readonly API = `${environment.apiUrl}/businesses`;

  private businessesSignal = signal<BusinessListItem[]>([]);
  private totalSignal = signal(0);
  private pagesSignal = signal(0);
  private loadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);

  private selectedBusinessSignal = signal<BusinessDetail | null>(null);
  private businessLoadingSignal = signal(false);

  private productsSignal = signal<Producto[]>([]);
  private productsTotalSignal = signal(0);

  private reviewsSignal = signal<BusinessReviewData | null>(null);
  private reviewsLoadingSignal = signal(false);

  readonly businesses = this.businessesSignal.asReadonly();
  readonly total = this.totalSignal.asReadonly();
  readonly pages = this.pagesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  readonly selectedBusiness = this.selectedBusinessSignal.asReadonly();
  readonly businessLoading = this.businessLoadingSignal.asReadonly();

  readonly products = this.productsSignal.asReadonly();
  readonly productsTotal = this.productsTotalSignal.asReadonly();

  readonly reviews = this.reviewsSignal.asReadonly();
  readonly reviewsLoading = this.reviewsLoadingSignal.asReadonly();

  constructor(private http: HttpClient) {}

  loadBusinesses(params?: BusinessFilterParams): Observable<PaginatedResponse<BusinessListItem>> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    let httpParams = new HttpParams();
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page);
      if (params.size) httpParams = httpParams.set('size', params.size);
      if (params.busqueda) httpParams = httpParams.set('busqueda', params.busqueda);
      if (params.categoria) httpParams = httpParams.set('categoria', params.categoria);
      if (params.distrito) httpParams = httpParams.set('distrito', params.distrito);
      if (params.orden) httpParams = httpParams.set('orden', params.orden);
    }
    return this.http.get<PaginatedResponse<BusinessListItem>>(this.API, { params: httpParams }).pipe(
      tap({
        next: (data) => {
          this.businessesSignal.set(data.items);
          this.totalSignal.set(data.total);
          this.pagesSignal.set(data.pages);
          this.loadingSignal.set(false);
        },
        error: (err) => {
          this.errorSignal.set(err.error?.detail || err.message);
          this.loadingSignal.set(false);
        }
      })
    );
  }

  loadBusinessById(id: number): Observable<BusinessDetail> {
    this.businessLoadingSignal.set(true);
    return this.http.get<BusinessDetail>(`${this.API}/${id}`).pipe(
      tap({
        next: (data) => {
          this.selectedBusinessSignal.set(data);
          this.businessLoadingSignal.set(false);
        },
        error: (err) => {
          this.errorSignal.set(err.error?.detail || err.message);
          this.businessLoadingSignal.set(false);
        }
      })
    );
  }

  loadBusinessProducts(id: number, page = 1, size = 9): Observable<PaginatedResponse<Producto>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PaginatedResponse<Producto>>(`${this.API}/${id}/products`, { params }).pipe(
      tap({
        next: (data) => {
          this.productsSignal.set(data.items);
          this.productsTotalSignal.set(data.total);
        }
      })
    );
  }

  loadReviews(id: number, page = 1, size = 5): Observable<BusinessReviewData> {
    this.reviewsLoadingSignal.set(true);
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<BusinessReviewData>(`${this.API}/${id}/reviews`, { params }).pipe(
      tap({
        next: (data) => {
          this.reviewsSignal.set(data);
          this.reviewsLoadingSignal.set(false);
        },
        error: () => this.reviewsLoadingSignal.set(false)
      })
    );
  }

  createReview(id: number, contenido: string, puntuacion: number): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.API}/${id}/reviews`, { contenido, puntuacion });
  }

  clearSelectedBusiness(): void {
    this.selectedBusinessSignal.set(null);
    this.productsSignal.set([]);
    this.reviewsSignal.set(null);
  }

  clearError(): void {
    this.errorSignal.set(null);
  }
}
