import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Adjunto } from '../models/adjunto.model';

@Injectable({
  providedIn: 'root'
})
export class AdjuntosService {
  private http = inject(HttpClient);
  private apiUrl = '/api/adjuntos';

  listar(modulo: string, registroId: number): Observable<ApiResponse<Adjunto[]>> {
    const params = new HttpParams()
      .set('modulo', modulo)
      .set('registro_id', registroId);

    return this.http.get<ApiResponse<Adjunto[]>>(this.apiUrl, { params });
  }

  eliminar(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }
  subir(formData: FormData): Observable<ApiResponse<Adjunto>> {
    return this.http.post<ApiResponse<Adjunto>>(this.apiUrl, formData);
  }
}