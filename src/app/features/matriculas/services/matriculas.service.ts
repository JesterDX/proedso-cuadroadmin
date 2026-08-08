import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';

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
  ): Observable<ApiResponse> {

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
  ): Observable<ApiResponse> {

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
  ): Observable<ApiResponse> {

    return this.http.get<ApiResponse<Matricula>>(
      `${this.apiUrl}/${id}`
    );
  }


  // ==========================================================
  // OBTENER DETALLE
  // ==========================================================

  obtenerDetalle(
    id: number
  ): Observable<ApiResponse> {

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
  ): Observable<ApiResponse> {

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
      plan_curso_id: number | string;
      fecha_matricula: string;
      monto_total?: number | null;
      cuota_inicial?: number | null;
      modalidad_pago?: string | null;
      maquinas_seleccionadas?: number[];
    }
  ): Observable<ApiResponse<any[]>> {

    const url = `${this.apiUrl}/previsualizar-cuotas`;

    console.log('');
    console.log('========================================');
    console.log('📤 PREVISUALIZAR CUOTAS - REQUEST');
    console.log('========================================');
    console.log('🌐 URL:', url);
    console.log('📦 PAYLOAD:', payload);
    console.log('📋 PLAN:', payload.plan_curso_id);
    console.log('📅 FECHA MATRÍCULA:', payload.fecha_matricula);
    console.log('💰 MONTO TOTAL:', payload.monto_total);
    console.log('💵 CUOTA INICIAL:', payload.cuota_inicial);
    console.log('📆 MODALIDAD:', payload.modalidad_pago);
    console.log(
      '🚜 MÁQUINAS:',
      payload.maquinas_seleccionadas
    );
    console.log('========================================');
    console.log('⏳ Esperando respuesta del backend...');
    console.log('');

    return this.http
      .post<ApiResponse<any[]>>(
        url,
        payload
      )
      .pipe(

        // ======================================================
        // RESPUESTA EXITOSA
        // ======================================================

        tap((response) => {

          console.log('');
          console.log('========================================');
          console.log('📥 PREVISUALIZAR CUOTAS - RESPONSE');
          console.log('========================================');

          console.log(
            '📊 RESPUESTA COMPLETA:',
            response
          );

          console.log(
            '✅ OK:',
            response?.ok
          );

          console.log(
            '📦 DATA:',
            response?.data
          );

          console.log(
            '📏 CANTIDAD DE CUOTAS:',
            Array.isArray(response?.data)
              ? response.data.length
              : 'NO ES ARRAY'
          );

          console.log('========================================');
          console.log('');

        }),

        // ======================================================
        // ERROR HTTP
        // ======================================================

        catchError((error) => {

          console.error('');
          console.error('========================================');
          console.error('❌ PREVISUALIZAR CUOTAS - ERROR');
          console.error('========================================');

          console.error(
            '🌐 URL:',
            url
          );

          console.error(
            '📦 PAYLOAD ENVIADO:',
            payload
          );

          console.error(
            '🔴 STATUS:',
            error?.status
          );

          console.error(
            '🔴 STATUS TEXT:',
            error?.statusText
          );

          console.error(
            '🔴 ERROR:',
            error?.error
          );

          console.error(
            '🔴 MENSAJE:',
            error?.message
          );

          console.error('========================================');
          console.error('');

          return throwError(() => error);
        })

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
  ): Observable<ApiResponse> {

    return this.http.get<ApiResponse<MatriculaFinanzasData>>(
      `${this.apiUrl}/${id}/finanzas`
    );
  }

}

