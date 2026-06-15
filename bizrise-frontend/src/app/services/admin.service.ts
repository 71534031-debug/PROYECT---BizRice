import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AdminStats, AdminUserList, AdminBusinessList, UsuarioDetalle,
  PaginatedResponse, MessageResponse, Venta
} from '../models';

export interface AdminMetrics {
  total_usuarios: number;
  total_emprendedores: number;
  total_clientes: number;
  usuarios_activos_mes: number;
  total_negocios_aprobados: number;
  total_negocios_pendientes: number;
  total_productos: number;
  total_ventas: number;
  ingresos_totales: number;
  ventas_entregadas: number;
  ventas_pendientes: number;
  ventas_canceladas: number;
  ventas_por_mes: { mes: string; anio: number; total_ventas: number; ingresos: number }[];
  productos_mas_vendidos: { id_producto: number; nombre: string; negocio: string; total_vendido: number; ingresos: number }[];
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly API = `${environment.apiUrl}/admin`;

  private statsSignal = signal<AdminStats | null>(null);
  private statsLoadingSignal = signal(false);

  private metricsSignal = signal<AdminMetrics | null>(null);

  private usersSignal = signal<UsuarioDetalle[]>([]);
  private usersTotalSignal = signal(0);
  private usersPagesSignal = signal(0);
  private usersLoadingSignal = signal(false);

  private businessesSignal = signal<AdminBusinessList['items']>([]);
  private businessesTotalSignal = signal(0);
  private businessesPagesSignal = signal(0);
  private businessesLoadingSignal = signal(false);

  private loadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);

  readonly stats = this.statsSignal.asReadonly();
  readonly statsLoading = this.statsLoadingSignal.asReadonly();

  readonly metrics = this.metricsSignal.asReadonly();

  readonly users = this.usersSignal.asReadonly();
  readonly usersTotal = this.usersTotalSignal.asReadonly();
  readonly usersPages = this.usersPagesSignal.asReadonly();
  readonly usersLoading = this.usersLoadingSignal.asReadonly();

  readonly businesses = this.businessesSignal.asReadonly();
  readonly businessesTotal = this.businessesTotalSignal.asReadonly();
  readonly businessesPages = this.businessesPagesSignal.asReadonly();
  readonly businessesLoading = this.businessesLoadingSignal.asReadonly();

  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  constructor(private http: HttpClient) {}

  loadStats(): Observable<AdminStats> {
    this.statsLoadingSignal.set(true);
    return this.http.get<AdminStats>(`${this.API}/stats`).pipe(
      tap({
        next: (data) => {
          this.statsSignal.set(data);
          this.statsLoadingSignal.set(false);
        },
        error: () => this.statsLoadingSignal.set(false)
      })
    );
  }

  loadMetrics(): Observable<AdminMetrics> {
    return this.http.get<AdminMetrics>(`${this.API}/dashboard/metrics`).pipe(
      tap((data) => this.metricsSignal.set(data))
    );
  }

  loadUsers(params?: {
    page?: number; size?: number; rol?: string; estado?: string; busqueda?: string
  }): Observable<AdminUserList> {
    this.usersLoadingSignal.set(true);
    this.errorSignal.set(null);
    let httpParams = new HttpParams();
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page);
      if (params.size) httpParams = httpParams.set('size', params.size);
      if (params.rol) httpParams = httpParams.set('rol', params.rol);
      if (params.estado) httpParams = httpParams.set('estado', params.estado);
      if (params.busqueda) httpParams = httpParams.set('busqueda', params.busqueda);
    }
    return this.http.get<AdminUserList>(`${this.API}/users`, { params: httpParams }).pipe(
      tap({
        next: (data) => {
          this.usersSignal.set(data.items);
          this.usersTotalSignal.set(data.total);
          this.usersPagesSignal.set(data.pages);
          this.usersLoadingSignal.set(false);
        },
        error: (err) => {
          this.errorSignal.set(err.error?.detail || err.message);
          this.usersLoadingSignal.set(false);
        }
      })
    );
  }

  createUser(data: {
    nombre: string; apellido: string; correo: string;
    contrasena: string; rol?: string
  }): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.API}/users`, data);
  }

  updateUser(id: number, data: {
    nombre?: string; apellido?: string; correo?: string;
    rol?: string; estado?: string
  }): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(`${this.API}/users/${id}`, data).pipe(
      tap(() => this.loadUsers().subscribe())
    );
  }

  suspendUser(id: number): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(`${this.API}/users/${id}/suspend`, {});
  }

  activateUser(id: number): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(`${this.API}/users/${id}/activate`, {});
  }

  deleteUser(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.API}/users/${id}`);
  }

  loadBusinesses(params?: {
    page?: number; size?: number; estado?: string; categoria?: number; busqueda?: string
  }): Observable<AdminBusinessList> {
    this.businessesLoadingSignal.set(true);
    this.errorSignal.set(null);
    let httpParams = new HttpParams();
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page);
      if (params.size) httpParams = httpParams.set('size', params.size);
      if (params.estado) httpParams = httpParams.set('estado', params.estado);
      if (params.categoria) httpParams = httpParams.set('categoria', params.categoria);
      if (params.busqueda) httpParams = httpParams.set('busqueda', params.busqueda);
    }
    return this.http.get<AdminBusinessList>(`${this.API}/businesses`, { params: httpParams }).pipe(
      tap({
        next: (data) => {
          this.businessesSignal.set(data.items);
          this.businessesTotalSignal.set(data.total);
          this.businessesPagesSignal.set(data.pages);
          this.businessesLoadingSignal.set(false);
        },
        error: (err) => {
          this.errorSignal.set(err.error?.detail || err.message);
          this.businessesLoadingSignal.set(false);
        }
      })
    );
  }

  approveBusiness(id: number): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(`${this.API}/businesses/${id}/approve`, {});
  }

  rejectBusiness(id: number, motivo: string): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(`${this.API}/businesses/${id}/reject`, { motivo });
  }

  updateBusiness(id: number, data: any): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(`${this.API}/businesses/${id}`, data);
  }

  deleteBusiness(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.API}/businesses/${id}`);
  }

  deleteReview(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.API}/reviews/${id}`);
  }

  clearError(): void {
    this.errorSignal.set(null);
  }
}
