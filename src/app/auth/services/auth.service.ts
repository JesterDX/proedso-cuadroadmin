import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ApiResponse } from '../../core/models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'https://proedso-back-wtdl.onrender.com/api/auth';
  
  usuarioActual = signal<any | null>(null);

  constructor() {
    const userJson = localStorage.getItem('proedso_user');
    if (userJson) {
      this.usuarioActual.set(JSON.parse(userJson));
    }
  }

  login(credentials: { email: string; password: string }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/login`, credentials).pipe(
      tap(resp => {
        if (resp.data && resp.data.token) {
          localStorage.setItem('proedso_token', resp.data.token);
          localStorage.setItem('proedso_user', JSON.stringify(resp.data.usuario));
          this.usuarioActual.set(resp.data.usuario);
        }
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem('proedso_token');
  }

  logout(): void {
    localStorage.removeItem('proedso_token');
    localStorage.removeItem('proedso_user');
    this.usuarioActual.set(null);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
