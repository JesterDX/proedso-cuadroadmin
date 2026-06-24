import { Injectable, inject } from '@angular/core';

import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PracticasService {

  private http = inject(HttpClient);

  private apiUrl =
    'https://proedso-back-wtdl.onrender.com/api/practicas';

  listarPracticasOrdenadas(
    filtros?: any
  ): Observable<any> {

    let params =
      new HttpParams();

    if (filtros?.mes) {
      params =
        params.set(
          'mes',
          filtros.mes
        );
    }

    if (filtros?.anio) {
      params =
        params.set(
          'anio',
          filtros.anio
        );
    }

    if (filtros?.tipoCurso) {
      params =
        params.set(
          'tipoCurso',
          filtros.tipoCurso
        );
    }

    return this.http.get(
      `${this.apiUrl}/ordenadas`,
      { params }
    );

  }

  validarPracticas(
    matriculaId: number
  ): Observable<any> {

    return this.http.get(
      `${this.apiUrl}/validar/${matriculaId}`
    );

  }

  crearAsignacion(
    matriculaId: number
  ): Observable<any> {

    return this.http.post(
      `${this.apiUrl}/asignaciones`,
      {
        matriculaId
      }
    );

  }

  listarAsignaciones(): Observable<any> {

    return this.http.get(
      `${this.apiUrl}/asignaciones`
    );

  }

  listarSesiones(
    asignacionId: number
  ): Observable<any> {

    return this.http.get(
      `${this.apiUrl}/sesiones/${asignacionId}`
    );

  }
  obtenerDetallePracticas(
    matriculaId: number
  ): Observable<any> {

    return this.http.get<any>(
      `${this.apiUrl}/detalle/${matriculaId}`
    );

  }

  registrarAsistencia(
    sesionId: number,
    payload: any
  ): Observable<any> {

    return this.http.put(
      `${this.apiUrl}/sesiones/${sesionId}/asistencia`,
      payload
    );

  }

}
