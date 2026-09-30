// ==========================================================
// MATRÍCULA
// ==========================================================

export interface Matricula {
  id: number;

  alumno_id: number;

  /**
   * NULL para matrículas ACELERADAS,
   * porque no dependen de un plan_curso.
   */
  plan_curso_id: number | null;

  estado_alumno_id: number;

  fecha_matricula: string;

  fecha_inicio?: string | null;

  fecha_fin_estimada?: string | null;

  cronograma_url?: string | null;

  notas?: string | null;

  activo: boolean;

  fecha_creacion: string;

  // ========================================================
  // TIPO DE MATRÍCULA
  // ========================================================

  /**
   * ORDINARIA:
   * Matrícula asociada a un plan de curso existente.
   *
   * ACELERADA:
   * Matrícula creada manualmente, sin plan_curso.
   */
  tipo_matricula?: 'ORDINARIA' | 'ACELERADA';

  /**
   * Nombre manual del curso.
   * Se utiliza principalmente para matrículas ACELERADAS.
   */
  nombre_curso_manual?: string | null;

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
// La matrícula acelerada NO utiliza:
// - plan_curso_id
// - plan_precio_id
// - generación automática de cuotas
//
// Todo el cronograma económico se registra manualmente.
// ==========================================================


// ==========================================================
// MÁQUINA DE MATRÍCULA ACELERADA
// ==========================================================

export interface MaquinaMatriculaAceleradaPayload {

  /**
   * ID real de la máquina existente en la tabla maquinas.
   */
  maquina_id: number;

  /**
   * Orden de la máquina dentro de la matrícula.
   */
  orden: number;

  /**
   * Indica si la máquina fue entregada como regalo.
   */
  es_regalo: boolean;

  /**
   * Cantidad de horas asignadas a esta máquina.
   */
  horas_asignadas: number;

  /**
   * Cantidad total de sesiones prácticas.
   */
  sesiones_totales: number;
}


// ==========================================================
// CUOTA DE MATRÍCULA ACELERADA
// ==========================================================

export interface CuotaMatriculaAceleradaPayload {

  /**
   * Número consecutivo de cuota.
   * Ejemplo: 1, 2, 3...
   */
  numero_cuota: number;

  /**
   * Fecha en la que se programa el pago.
   */
  fecha_programada: string;

  /**
   * Fecha límite de pago.
   */
  fecha_vencimiento: string;

  /**
   * Importe de la cuota.
   */
  monto: number;
}


// ==========================================================
// INFORMACIÓN DE PAGO - MATRÍCULA ACELERADA
// ==========================================================

export interface PagoMatriculaAceleradaPayload {

  // ========================================================
  // MATRÍCULA
  // ========================================================

  monto_matricula: number;

  /**
   * Puede ser null mientras el formulario está vacío.
   */
  fecha_matricula: string | null;

  // ========================================================
  // CERTIFICACIÓN
  // ========================================================

  monto_certificacion: number;

  /**
   * Puede ser null si todavía no se registra certificación.
   */
  fecha_certificacion: string | null;

  // ========================================================
  // CUOTAS
  // ========================================================

  cuotas: CuotaMatriculaAceleradaPayload[];
}


// ==========================================================
// PAYLOAD MATRÍCULA ACELERADA
// ==========================================================

export interface MatriculaAceleradaPayload {

  /**
   * Puede ser null mientras el administrador
   * todavía no selecciona al alumno.
   */
  alumno_id: number | null;

  /**
   * Nombre manual del curso acelerado.
   */
  nombre_curso_manual: string;

  /**
   * Puede ser null mientras el administrador
   * todavía no selecciona el estado.
   */
  estado_alumno_id: number | null;

  // ========================================================
  // FECHAS
  // ========================================================

  fecha_matricula: string;

  fecha_inicio: string | null;

  fecha_fin_estimada: string | null;

  // ========================================================
  // INFORMACIÓN ADICIONAL
  // ========================================================

  notas?: string | null;

  // ========================================================
  // MÁQUINAS
  // ========================================================

  maquinas: MaquinaMatriculaAceleradaPayload[];

  // ========================================================
  // PAGOS
  // ========================================================

  pago: PagoMatriculaAceleradaPayload;
}
