export interface MatriculaFinanzasResumen {
  id: number;
  matricula_id: number;
  plan_precio_id?: number | null;
  monto_total: number;
  monto_matricula: number;
  monto_certificacion: number;
  cantidad_cuotas: number;
  monto_cuota?: number | null;
  nota_pago?: string | null;
  fecha_creacion?: string | null;
}

export interface MatriculaCuota {
  id: number;
  plan_pago_alumno_id: number;
  numero_cuota?: number | null;
  concepto_id: number;
  concepto_codigo?: string | null;
  concepto_nombre?: string | null;
  fecha_programada?: string | null;
  fecha_vencimiento: string;
  monto_programado: number;
  monto_pagado: number;
  saldo_pendiente: number;
  estado: string;
  observaciones?: string | null;
}

export interface MatriculaFinanzasData {
  resumen: MatriculaFinanzasResumen | null;
  cuotas: MatriculaCuota[];
}