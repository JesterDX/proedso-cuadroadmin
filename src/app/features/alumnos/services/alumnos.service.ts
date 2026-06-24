import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Alumno } from '../models/alumno.model';

interface ApiResponse<T> {
  ok: boolean;
  message?: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class AlumnosService {
  private http = inject(HttpClient);
  private apiUrl = 'https://proedso-back-wtdl.onrender.com/api/alumnos';
  
  listar(
    search: string = '',
    activos: boolean = true,
    anio: number | null = null,
    mes: string = ''
  ): Observable<ApiResponse<Alumno[]>> {
    let params = new HttpParams().set('activos', activos.toString());

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    if (anio !== null && anio !== undefined) {
      params = params.set('anio', String(anio));
    }

    if (mes.trim()) {
      params = params.set('mes', mes.trim());
    }

    return this.http.get<ApiResponse<Alumno[]>>(this.apiUrl, { params });
  }

  reactivar(id: number): Observable<ApiResponse<Alumno>> {
    return this.http.patch<ApiResponse<Alumno>>(`${this.apiUrl}/${id}/reactivar`, {});
  }

  obtenerPorId(id: number): Observable<ApiResponse<Alumno>> {
    return this.http.get<ApiResponse<Alumno>>(`${this.apiUrl}/${id}`);
  }

  crear(payload: FormData): Observable<ApiResponse<Alumno>> {
    return this.http.post<ApiResponse<Alumno>>(this.apiUrl, payload);
  }

  actualizarConFoto(id: number, payload: FormData): Observable<ApiResponse<Alumno>> {
    return this.http.put<ApiResponse<Alumno>>(`${this.apiUrl}/${id}`, payload);
  }

  eliminar(id: number): Observable<ApiResponse<{ id: number; activo: boolean }>> {
    return this.http.delete<ApiResponse<{ id: number; activo: boolean }>>(`${this.apiUrl}/${id}`);
  }
}
