import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  PlanCurso,
  PlanCursoPayload
} from '../models/plan-curso.model';


// ============================================================
// RESPUESTA API
// ============================================================

interface ApiResponse<T> {
  ok: boolean;
  message?: string;
  data: T;
}


// ============================================================
// SERVICE
// ============================================================

@Injectable({
  providedIn: 'root'
})
export class PlanesCursoService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    '/api/planes-curso';


  // ==========================================================
  // LISTAR PLANES
  // ==========================================================

  listar(): Observable<ApiResponse<PlanCurso[]>> {

    return this.http.get<
      ApiResponse<PlanCurso[]>
    >(this.apiUrl);

  }


  // ==========================================================
  // OBTENER PLAN POR ID
  // ==========================================================

  obtenerPorId(
    id: number
  ): Observable<ApiResponse<PlanCurso>> {

    return this.http.get<
      ApiResponse<PlanCurso>
    >(
      `${this.apiUrl}/${id}`
    );

  }


  // ==========================================================
  // CREAR PLAN
  // ==========================================================

  crear(
    payload: PlanCursoPayload
  ): Observable<ApiResponse<PlanCurso>> {

    return this.http.post<
      ApiResponse<PlanCurso>
    >(
      this.apiUrl,
      payload
    );

  }


  // ==========================================================
  // ACTUALIZAR PLAN
  // ==========================================================

  actualizar(
    id: number,
    payload: PlanCursoPayload
  ): Observable<ApiResponse<PlanCurso>> {

    return this.http.put<
      ApiResponse<PlanCurso>
    >(
      `${this.apiUrl}/${id}`,
      payload
    );

  }


  // ==========================================================
  // CAMBIAR ESTADO
  // ==========================================================

  cambiarEstado(
    id: number,
    activo: boolean
  ): Observable<ApiResponse<PlanCurso>> {

    return this.http.patch<
      ApiResponse<PlanCurso>
    >(
      `${this.apiUrl}/${id}/estado`,
      { activo }
    );

  }

}
