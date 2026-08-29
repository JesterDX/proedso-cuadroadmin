import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

// ============================================================
// NOTIFICACIÓN DE CUOTA
// ============================================================

export interface NotificacionCuota {

  // ----------------------------------------------------------
  // MATRÍCULA / ALUMNO
  // ----------------------------------------------------------

  matricula_id: number;
  alumno_id: number;

  // ----------------------------------------------------------
  // DATOS DEL ALUMNO
  // ----------------------------------------------------------

  alumno_dni: string;
  alumno_nombres: string;
  alumno_apellidos: string;

  alumno_telefono?: string | null;
  alumno_correo?: string | null;

  // ----------------------------------------------------------
  // DATOS DE LA CUOTA
  // ----------------------------------------------------------

  cuota_id: number;
  numero_cuota: number | null;

  concepto_codigo: string;
  concepto_nombre: string;

  fecha_vencimiento: string;

  monto_programado: number;
  monto_pagado: number;
  saldo_pendiente: number;

  // ----------------------------------------------------------
  // NOTIFICACIÓN
  // ----------------------------------------------------------

  tipo: 'VENCIDA' | 'POR_VENCER';

  dias: number;
}

// ============================================================
// RESUMEN DE NOTIFICACIONES
// ============================================================

export interface ResumenNotificaciones {

  vencidas: number;

  por_vencer: number;

  total: number;

  // ----------------------------------------------------------
  // CANTIDAD DE ALUMNOS
  // ----------------------------------------------------------

  cantidad_alumnos?: number;

  cantidad_alumnos_vencidos?: number;

  cantidad_alumnos_por_vencer?: number;

  // ----------------------------------------------------------
  // NOTIFICACIONES
  // ----------------------------------------------------------

  notificaciones: NotificacionCuota[];
}

// ============================================================
// RESPUESTA DEL BACKEND
// ============================================================

interface RespuestaNotificaciones {

  ok: boolean;

  data: ResumenNotificaciones;
}

// ============================================================
// SERVICIO
// ============================================================

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {

  private http = inject(HttpClient);

  private apiUrl =
    'https://proedso-back-wtdl.onrender.com/api/notificaciones/pagos';

  // ==========================================================
  // OBTENER NOTIFICACIONES
  // ==========================================================

  obtenerNotificaciones(): Observable<ResumenNotificaciones> {

    return this.http
      .get<RespuestaNotificaciones>(this.apiUrl)
      .pipe(

        map((respuesta) => {

          return respuesta?.data ?? {

            vencidas: 0,

            por_vencer: 0,

            total: 0,

            cantidad_alumnos: 0,

            cantidad_alumnos_vencidos: 0,

            cantidad_alumnos_por_vencer: 0,

            notificaciones: []

          };

        })

      );
  }
}
