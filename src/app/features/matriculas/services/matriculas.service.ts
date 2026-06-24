import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Matricula, MatriculaPayload } from '../models/matricula.model';
import { MatriculaDetail } from '../models/matricula-detail.model';
import { MatriculaMaquina } from '../models/matricula-maquina.model';
import { MatriculaFinanzasData } from '../models/matricula-finanzas.model';

@Injectable({
  providedIn: 'root'
})
export class MatriculasService {
  private http = inject(HttpClient);
  private apiUrl = 'https://proedso-back-wtdl.onrender.com/api/matriculas';

  listar(
    estado?: string,
    search = '',
    anio?: number | null,
    mes?: number | null
  ): Observable<ApiResponse<Matricula[]>> {
    let params = new HttpParams();

    if (estado) params = params.set('estado', estado);
    if (search.trim()) params = params.set('search', search.trim());
    if (anio) params = params.set('anio', anio);
    if (mes) params = params.set('mes', mes);

    return this.http.get<ApiResponse<Matricula[]>>(this.apiUrl, { params });
  }

  actualizar(id: number, payload: MatriculaPayload): Observable<ApiResponse<Matricula>> {
    return this.http.put<ApiResponse<Matricula>>(`/api/matriculas/${id}`, payload);
  }
  obtenerPorId(id: number): Observable<ApiResponse<Matricula>> {
    return this.http.get<ApiResponse<Matricula>>(`${this.apiUrl}/${id}`);
  }

  obtenerDetalle(id: number): Observable<ApiResponse<MatriculaDetail>> {
    return this.http.get<ApiResponse<MatriculaDetail>>(`${this.apiUrl}/${id}/detalle`);
  }

  crear(payload: MatriculaPayload): Observable<ApiResponse<Matricula>> {
    return this.http.post<ApiResponse<Matricula>>(this.apiUrl, payload);
  }

  listarMaquinas(id: number): Observable<ApiResponse<MatriculaMaquina[]>> {
    return this.http.get<ApiResponse<MatriculaMaquina[]>>(`${this.apiUrl}/${id}/maquinas`);
  }

  cambiarEstado(id: number, codigoEstado: string): Observable<ApiResponse<Matricula>> {
    return this.http.patch<ApiResponse<Matricula>>(`${this.apiUrl}/${id}/estado`, {
      codigo_estado: codigoEstado
    });
  }
  obtenerHistorial(id: number) {
    return this.http.get<ApiResponse<any[]>>(`/api/matriculas/${id}/historial`);
  }
  obtenerFinanzas(id: number): Observable<ApiResponse<MatriculaFinanzasData>> {
    return this.http.get<ApiResponse<MatriculaFinanzasData>>(`${this.apiUrl}/${id}/finanzas`);
  }
}
