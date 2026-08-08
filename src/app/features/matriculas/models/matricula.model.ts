
export interface Matricula {
  id: number;
  alumno_id: number;
  plan_curso_id: number;
  estado_alumno_id: number;
  fecha_matricula: string;
  fecha_inicio?: string | null;
  fecha_fin_estimada?: string | null;
  cronograma_url?: string | null;
  notas?: string | null;
  activo: boolean;
  fecha_creacion: string;

  modalidad_pago?: 'MENSUAL' | 'QUINCENAL';
  monto_total: number | null;
  cuota_inicial: number | null;
}


// ==========================================================
// CUOTA DEL CRONOGRAMA
// ==========================================================

export interface CuotaCronograma {
  numero_cuota: number;
  monto: number;
  fecha_programada: string;
  fecha_vencimiento: string;
}


// ==========================================================
// PAYLOAD PARA GUARDAR MATRÍCULA
// ==========================================================

export interface CuotaCronogramaPayload {
  numero_cuota: number;
  fecha_vencimiento: string;
  monto: number;
}


export interface MatriculaPayload {
  alumno_id: number | null;
  plan_curso_id: number | null;
  estado_alumno_id: number | null;

  fecha_matricula: string;

  fecha_inicio?: string | null;
  fecha_fin_estimada?: string | null;

  notas?: string | null;

  maquinas_seleccionadas?: number[];

  modalidad_pago?: 'MENSUAL' | 'QUINCENAL';

  monto_total: number | null;
  cuota_inicial: number | null;

  cuotas?: CuotaCronogramaPayload[];
}


// ==========================================================
// RESPUESTA PREVISUALIZACIÓN
// ==========================================================

export interface PrevisualizacionCuotasData {
  plan: any;
  precio: any;
  modalidad_pago: 'MENSUAL' | 'QUINCENAL';
  maquinas: any[];
  cuotas: CuotaCronograma[];
}
