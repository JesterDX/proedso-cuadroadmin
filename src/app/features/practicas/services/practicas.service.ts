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
  // EN USO — ya vive en el backend nuevo
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

    return this.http.get(
      `${this.apiUrl}/alumnos-disponibles`,
      { params }
    );
  }

  // ==========================================
  // PENDIENTES — se van a redefinir cuando
  // rehagamos service.js/controller.js/routes.js
  // del backend (sesiones grupales, candado,
  // PDF, etc). Se dejan las firmas para no
  // romper los componentes que ya los llaman,
  // pero el endpoint todavía no existe/cambia.
  // ==========================================

  /** @deprecated pendiente de reemplazo por /sesiones-grupales */
  listarPracticasOrdenadas(filtros?: any): Observable<any> {
    let params = new HttpParams();
    if (filtros?.mes) params = params.set('mes', filtros.mes);
    if (filtros?.anio) params = params.set('anio', filtros.anio);
    if (filtros?.tipoCurso) params = params.set('tipoCurso', filtros.tipoCurso);
    return this.http.get(`${this.apiUrl}/ordenadas`, { params });
  }

  /** @deprecated pendiente de reemplazo */
  validarPracticas(matriculaId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/validar/${matriculaId}`);
  }

  /** @deprecated se va a reemplazar por crearSesionGrupal(payload) */
  crearAsignacion(matriculaId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/asignaciones`, { matriculaId });
  }

  /** @deprecated pendiente de reemplazo por listarSesionesGrupales() */
  listarAsignaciones(): Observable<any> {
    return this.http.get(`${this.apiUrl}/asignaciones`);
  }

  /** @deprecated pendiente de reemplazo */
  listarSesiones(asignacionId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/sesiones/${asignacionId}`);
  }

  /** se mantiene, sirve como base de "expedientes" */
  obtenerDetallePracticas(matriculaId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/detalle/${matriculaId}`);
  }

  /** @deprecated pendiente de reemplazo, ahora será por sesión grupal */
  registrarAsistencia(sesionId: number, payload: any): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/sesiones/${sesionId}/asistencia`,
      payload
    );
  }
  crearSesionGrupal(payload:any){

  return this.http.post(

    `${this.apiUrl}/sesion-grupal`,

    payload

  );

}

obtenerSesion(id:number){

  return this.http.get<any>(
    `${this.apiUrl}/sesion-grupal/${id}`
  );

}

guardarSesion(id:number,data:any){

  return this.http.put<any>(
    `${this.apiUrl}/sesion-grupal/${id}`,
    data
  );

}
}
