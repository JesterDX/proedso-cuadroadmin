import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpParams
} from '@angular/common/http';
import { Observable } from 'rxjs';

export type EstadoFinanciero = 'AL_DIA' | 'PENDIENTE' | 'MOROSO';

export interface MaquinaAlumno {
  matricula_maquina_id: number;
  maquina_id: number;
  maquina: string;
  sesiones_totales: number;
  sesiones_realizadas: number;
  sesiones_restantes: number;
}

export interface AlumnoDisponible {
  matricula_id: number;
  alumno: string;
  curso_id: number;
  curso: string;
  anio: number;
  mes: number;
  estado_financiero: EstadoFinanciero;
  maquinas: MaquinaAlumno[];
}

export interface FiltrosAlumnosDisponibles {
  anio?: number | null;
  mes?: number | null;
  cursoId?: number | null;
  maquinaId?: number | null;
  nombre?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class PracticasService {

  private http = inject(HttpClient);

  private apiUrl =
    'https://proedso-back-wtdl.onrender.com/api/practicas';

  // ==========================================
  // ALUMNOS DISPONIBLES
  // ==========================================

  listarAlumnosDisponibles(
    filtros?: FiltrosAlumnosDisponibles
  ): Observable<any> {

    let params = new HttpParams();

    if (filtros?.anio) {
      params = params.set('anio', filtros.anio);
    }

    if (filtros?.mes) {
      params = params.set('mes', filtros.mes);
    }

    if (filtros?.cursoId) {
      params = params.set('cursoId', filtros.cursoId);
    }

    if (filtros?.maquinaId) {
      params = params.set('maquinaId', filtros.maquinaId);
    }

    if (filtros?.nombre) {
      params = params.set('nombre', filtros.nombre);
    }

    return this.http.get<any>(
      `${this.apiUrl}/alumnos-disponibles`,
      { params }
    );
  }

  // ==========================================
  // FUNCIONES ANTIGUAS / COMPATIBILIDAD
  // ==========================================

  /** @deprecated pendiente de reemplazo por /sesiones-grupales */
  listarPracticasOrdenadas(
    filtros?: any
  ): Observable<any> {

    let params = new HttpParams();

    if (filtros?.mes) {
      params = params.set('mes', filtros.mes);
    }

    if (filtros?.anio) {
      params = params.set('anio', filtros.anio);
    }

    if (filtros?.tipoCurso) {
      params = params.set('tipoCurso', filtros.tipoCurso);
    }

    return this.http.get<any>(
      `${this.apiUrl}/ordenadas`,
      { params }
    );
  }

  /** @deprecated pendiente de reemplazo */
  validarPracticas(
    matriculaId: number
  ): Observable<any> {

    return this.http.get<any>(
      `${this.apiUrl}/validar/${matriculaId}`
    );
  }

  /** @deprecated se va a reemplazar por crearSesionGrupal(payload) */
  crearAsignacion(
    matriculaId: number
  ): Observable<any> {

    return this.http.post<any>(
      `${this.apiUrl}/asignaciones`,
      {
        matriculaId
      }
    );
  }

  /** @deprecated pendiente de reemplazo por listarSesionesGrupales() */
  listarAsignaciones(): Observable<any> {

    return this.http.get<any>(
      `${this.apiUrl}/asignaciones`
    );
  }

  /** @deprecated pendiente de reemplazo */
  listarSesiones(
    asignacionId: number
  ): Observable<any> {

    return this.http.get<any>(
      `${this.apiUrl}/sesiones/${asignacionId}`
    );
  }

  /** se mantiene, sirve como base de "expedientes" */
  obtenerDetallePracticas(
    matriculaId: number
  ): Observable<any> {

    return this.http.get<any>(
      `${this.apiUrl}/detalle/${matriculaId}`
    );
  }

  /** @deprecated pendiente de reemplazo, ahora será por sesión grupal */
  registrarAsistencia(
    sesionId: number,
    payload: any
  ): Observable<any> {

    return this.http.put<any>(
      `${this.apiUrl}/sesiones/${sesionId}/asistencia`,
      payload
    );
  }

  // ==========================================
  // SESIONES GRUPALES
  // ==========================================

  crearSesionGrupal(
    payload: any
  ): Observable<any> {

    return this.http.post<any>(
      `${this.apiUrl}/sesion-grupal`,
      payload
    );
  }

  obtenerSesion(
    id: number
  ): Observable<any> {

    return this.http.get<any>(
      `${this.apiUrl}/sesion-grupal/${id}`
    );
  }

  guardarSesion(
    id: number,
    data: any
  ): Observable<any> {

    return this.http.put<any>(
      `${this.apiUrl}/sesion-grupal/${id}`,
      data
    );
  }

  obtenerSesionGrupal(
    id: number
  ): Observable<any> {

    return this.http.get<any>(
      `${this.apiUrl}/sesion-grupal/${id}`
    );
  }

  guardarCronograma(
    id: number,
    detalle: any[]
  ): Observable<any> {

    return this.http.put<any>(
      `${this.apiUrl}/sesiones-grupales/${id}/cronograma`,
      {
        detalle
      }
    );
  }

  obtenerUltimaSesionPendiente(): Observable<any> {

    return this.http.get<any>(
      `${this.apiUrl}/sesion-grupal/ultima-pendiente`
    );
  }

  obtenerHistorialSesiones(): Observable<any> {

    return this.http.get<any>(
      `${this.apiUrl}/sesiones-grupales/historial`
    );
  }

  // ==========================================
  // LUGARES DE PRÁCTICA
  // ==========================================

  obtenerLugaresPractica(): Observable<any> {

    return this.http.get<any>(
      `${this.apiUrl}/lugares-practica`
    );
  }

  crearLugarPractica(
    payload: { nombre: string }
  ): Observable<any> {

    return this.http.post<any>(
      `${this.apiUrl}/lugares-practica`,
      payload
    );
  }

  // ==========================================
  // PENDIENTES
  // ==========================================

  obtenerPendientes(): Observable<any> {

    return this.http.get<any>(
      `${this.apiUrl}/pendientes`
    );
  }

}
