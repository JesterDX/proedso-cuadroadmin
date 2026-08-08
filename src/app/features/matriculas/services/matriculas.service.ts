
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiResponse } from '../../../core/models/api-response.model';

import {
  Matricula,
  MatriculaPayload
} from '../models/matricula.model';

import { MatriculaDetail } from '../models/matricula-detail.model';
import { MatriculaMaquina } from '../models/matricula-maquina.model';
import { MatriculaFinanzasData } from '../models/matricula-finanzas.model';

@Injectable({
  providedIn: 'root'
})
export class MatriculasService {

  private http = inject(HttpClient);

  private apiUrl =
    'https://proedso-back-wtdl.onrender.com/api/matriculas';

  // ==========================================================
  // LISTAR MATRÍCULAS
  // ==========================================================

  listar(
    estado?: string,
    search = '',
    anio?: number | null,
    mes?: number | null
  ): Observable<ApiResponse<Matricula[]>> {

    let params = new HttpParams();

    if (estado) {
      params = params.set('estado', estado);
    }

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    if (anio) {
      params = params.set('anio', anio);
    }

    if (mes) {
      params = params.set('mes', mes);
    }

    return this.http.get<ApiResponse<Matricula[]>>(
      this.apiUrl,
      { params }
    );
  }

  // ==========================================================
  // CREAR MATRÍCULA
  // ==========================================================

  crear(
    payload: MatriculaPayload
  ): Observable<ApiResponse<Matricula>> {

    return this.http.post<ApiResponse<Matricula>>(
      this.apiUrl,
      payload
    );
  }

  // ==========================================================
  // ACTUALIZAR MATRÍCULA
  // ==========================================================

  actualizar(
    id: number,
    payload: MatriculaPayload
  ): Observable<ApiResponse<Matricula>> {

    return this.http.put<ApiResponse<Matricula>>(
      `${this.apiUrl}/${id}`,
      payload
    );
  }

  // ==========================================================
  // OBTENER MATRÍCULA
  // ==========================================================

  obtenerPorId(
    id: number
  ): Observable<ApiResponse<Matricula>> {

    return this.http.get<ApiResponse<Matricula>>(
      `${this.apiUrl}/${id}`
    );
  }

  // ==========================================================
  // OBTENER DETALLE
  // ==========================================================

  obtenerDetalle(
    id: number
  ): Observable<ApiResponse<MatriculaDetail>> {

    return this.http.get<ApiResponse<MatriculaDetail>>(
      `${this.apiUrl}/${id}/detalle`
    );
  }

  // ==========================================================
  // LISTAR MÁQUINAS DE MATRÍCULA
  // ==========================================================

  listarMaquinas(
    id: number
  ): Observable<ApiResponse<MatriculaMaquina[]>> {

    return this.http.get<ApiResponse<MatriculaMaquina[]>>(
      `${this.apiUrl}/${id}/maquinas`
    );
  }

  // ==========================================================
  // CAMBIAR ESTADO
  // ==========================================================

  cambiarEstado(
    id: number,
    codigoEstado: string
  ): Observable<ApiResponse<Matricula>> {

    return this.http.patch<ApiResponse<Matricula>>(
      `${this.apiUrl}/${id}/estado`,
      {
        codigo_estado: codigoEstado
      }
    );
  }

  // ==========================================================
  // PREVISUALIZAR CUOTAS
  // ==========================================================

  previsualizarCuotas(
    payload: {
      plan_curso_id: number;
      fecha_matricula: string;
      monto_total?: number | null;
      cuota_inicial?: number | null;
      modalidad_pago?: string | null;
    }
  ): Observable<ApiResponse<any[]>> {

    return this.http.post<ApiResponse<any[]>>(
      `${this.apiUrl}/previsualizar-cuotas`,
      payload
    );
  }

  // ==========================================================
  // HISTORIAL
  // ==========================================================

  obtenerHistorial(
    id: number
  ): Observable<ApiResponse<any[]>> {

    return this.http.get<ApiResponse<any[]>>(
      `${this.apiUrl}/${id}/historial`
    );
  }

  // ==========================================================
  // FINANZAS
  // ==========================================================

  obtenerFinanzas(
    id: number
  ): Observable<ApiResponse<MatriculaFinanzasData>> {

    return this.http.get<ApiResponse<MatriculaFinanzasData>>(
      `${this.apiUrl}/${id}/finanzas`
    );
  }

}
