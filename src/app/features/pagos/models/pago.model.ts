export interface PagoResumen {
  matricula_id: number;
  alumno: string;
  plan_nombre: string;
  total_deuda: number;
  tiene_deuda: boolean;
}

export interface CuotaDetalle {
  id: number;
  concepto_nombre: string;
  concepto_codigo: string;
  fecha_vencimiento: string;
  monto_programado: number;
  saldo_pendiente: number;
  estado: string;
}

export interface HistorialPago {

  id: number;

  monto: number;

  fecha_pago: string;

  metodo_pago: string | null;

  comprobante_url: string | null;

  concepto_nombre: string;

}
export interface CuotaManualPayload {
  numero_cuota: number;
  fecha_vencimiento: string;
  monto: number;
}
export interface CrearPlanPagoManualPayload {
  matricula_id: number;

  modalidad_pago: 'MENSUAL' | 'QUINCENAL';

  monto_total: number;

  monto_matricula: number;

  monto_certificacion: number;

  nota_pago?: string;

  cuotas: CuotaManualPayload[];
}
