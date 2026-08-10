
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface NotificacionCuota {
  matricula_id: number;
  alumno_id: number;

  alumno_dni: string;
  alumno_nombres: string;
  alumno_apellidos: string;

  cuota_id: number;
  numero_cuota: number | null;

  concepto_codigo: string;
  concepto_nombre: string;

  fecha_vencimiento: string;

  monto_programado: number;
  monto_pagado: number;
  saldo_pendiente: number;

  tipo: 'VENCIDA' | 'POR_VENCER';

  /**
   * VENCIDA:
   * cantidad de días que lleva vencida.
   *
   * POR_VENCER:
   * cantidad de días que faltan para vencer.
   */
  dias: number;
}

export interface ResumenNotificaciones {
  vencidas: number;
  por_vencer: number;
  total: number;

  notificaciones: NotificacionCuota[];
}

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {

  private http = inject(HttpClient);

  private apiUrl =
    'https://proedso-back-wtdl.onrender.com/api/notificaciones/pagos';

  /**
   * Obtiene las notificaciones de cuotas:
   *
   * - Cuotas vencidas con saldo pendiente.
   * - Cuotas que vencen dentro de los próximos 5 días.
   * - Que todavía tienen saldo pendiente.
   */
  obtenerNotificaciones(): Observable<ResumenNotificaciones> {

    return this.http.get<ResumenNotificaciones>(
      this.apiUrl
    );
  }
}
