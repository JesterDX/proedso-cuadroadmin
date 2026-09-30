
// ==========================================================
// MATRÍCULA
// ==========================================================

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

  // ========================================================
  // MODALIDAD Y PAGOS
  // ========================================================

  modalidad_pago?: 'MENSUAL' | 'QUINCENAL';

  monto_total: number | null;

  cuota_inicial: number | null;

  // ========================================================
  // CERTIFICACIÓN
  // ========================================================

  certificacionIncluida?: boolean;

  costo_certificacion?: number | null;
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
// PAYLOAD DE CUOTA
// ==========================================================

export interface CuotaCronogramaPayload {

  numero_cuota: number;

  fecha_vencimiento: string;

  monto: number;
}

// ==========================================================
// PAYLOAD PARA CREAR / ACTUALIZAR MATRÍCULA
// ==========================================================

export interface MatriculaPayload {

  // ========================================================
  // DATOS PRINCIPALES
  // ========================================================

  alumno_id: number | null;

  plan_curso_id: number | null;

  estado_alumno_id: number | null;

  // ========================================================
  // FECHAS
  // ========================================================

  fecha_matricula: string;

  fecha_inicio?: string | null;

  fecha_fin_estimada?: string | null;

  // ========================================================
  // INFORMACIÓN ADICIONAL
  // ========================================================

  notas?: string | null;

  // ========================================================
  // MÁQUINAS
  // ========================================================

  maquinas_seleccionadas?: number[];

  // ========================================================
  // MODALIDAD DE PAGO
  // ========================================================

  modalidad_pago?: 'MENSUAL' | 'QUINCENAL';

  monto_total: number | null;

  cuota_inicial: number | null;

  // ========================================================
  // CERTIFICACIÓN
  // ========================================================

  certificacionIncluida?: boolean;

  costo_certificacion?: number | null;

  // ========================================================
  // CRONOGRAMA CONFIRMADO
  // ========================================================

  cronograma_confirmado?: CuotaCronogramaPayload[];
}

// ==========================================================
// RESPUESTA DE PREVISUALIZACIÓN DE CUOTAS
// ==========================================================

export interface PrevisualizacionCuotasData {

  plan: any;

  precio: any;

  modalidad_pago: 'MENSUAL' | 'QUINCENAL';

  maquinas: any[];

  cuotas: CuotaCronograma[];
}


// ==========================================================
// MATRÍCULA ACELERADA
// ==========================================================

export interface MaquinaMatriculaAceleradaPayload {
  maquina_id: number;
  orden: number;
  es_regalo: boolean;
  horas_asignadas: number;
  sesiones_totales: number;
}

export interface CuotaMatriculaAceleradaPayload {
  numero_cuota: number;
  fecha_programada: string;
  fecha_vencimiento: string;
  monto: number;
}

export interface PagoMatriculaAceleradaPayload {
  monto_matricula: number;
  fecha_matricula: string | null;

  monto_certificacion: number;
  fecha_certificacion: string | null;

  cuotas: CuotaMatriculaAceleradaPayload[];
}

export interface MatriculaAceleradaPayload {
  alumno_id: number;
  nombre_curso_manual: string;

  estado_alumno_id: number;

  fecha_matricula: string;
  fecha_inicio: string | null;
  fecha_fin_estimada: string | null;

  notas?: string | null;

  maquinas: MaquinaMatriculaAceleradaPayload[];

  pago: PagoMatriculaAceleradaPayload;
}
