import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AuthResponse, RefreshResponse, Usuario, MessageResponse
} from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = `${environment.apiUrl}/auth`;

  private userSignal = signal<Usuario | null>(this.loadUser());
  private loadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);

  readonly user = this.userSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  get isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  get userRole(): string | null {
    return this.userSignal()?.rol ?? null;
  }

  constructor(private http: HttpClient) {}

  login(correo: string, contrasena: string): Observable<AuthResponse> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    return this.http.post<AuthResponse>(`${this.API}/login`, { correo, contrasena }).pipe(
      tap({
        next: (res) => {
          this.saveTokens(res.access_token, res.refresh_token);
          this.saveUser(res.user);
          this.userSignal.set(res.user);
          this.loadingSignal.set(false);
        },
        error: (err) => {
          this.errorSignal.set(err.error?.detail || err.message);
          this.loadingSignal.set(false);
        }
      })
    );
  }

  register(data: {
    nombre: string; apellido: string; correo: string;
    contrasena: string; confirmar_contrasena: string
  }): Observable<AuthResponse> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    return this.http.post<AuthResponse>(`${this.API}/register`, data).pipe(
      tap({
        next: (res) => {
          this.saveTokens(res.access_token, res.refresh_token);
          this.saveUser(res.user);
          this.userSignal.set(res.user);
          this.loadingSignal.set(false);
        },
        error: (err) => {
          this.errorSignal.set(err.error?.detail || err.message);
          this.loadingSignal.set(false);
        }
      })
    );
  }

  me(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.API}/me`).pipe(
      tap({
        next: (user) => {
          this.saveUser(user);
          this.userSignal.set(user);
        }
      })
    );
  }

  refreshToken(): Observable<RefreshResponse> {
    const refresh = this.getRefreshToken();
    return this.http.post<RefreshResponse>(`${this.API}/refresh`, { refresh_token: refresh }).pipe(
      tap((res) => {
        localStorage.setItem('bizrise_access_token', res.access_token);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('bizrise_access_token');
    localStorage.removeItem('bizrise_refresh_token');
    localStorage.removeItem('bizrise_user');
    this.userSignal.set(null);
    this.errorSignal.set(null);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('bizrise_access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('bizrise_refresh_token');
  }

  private saveTokens(access: string, refresh: string): void {
    localStorage.setItem('bizrise_access_token', access);
    localStorage.setItem('bizrise_refresh_token', refresh);
  }

  private saveUser(user: Usuario): void {
    localStorage.setItem('bizrise_user', JSON.stringify(user));
  }

  private loadUser(): Usuario | null {
    try {
      const raw = localStorage.getItem('bizrise_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
