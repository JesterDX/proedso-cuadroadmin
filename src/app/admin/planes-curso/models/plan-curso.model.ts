// ============================================================
// TIPO DE CURSO
// ============================================================

export interface TipoCurso {
  id: number;
  codigo: string;
  nombre: string;
  duracion_meses: number;
  cantidad_maquinas: number;
}


// ============================================================
// MÁQUINA DEL PLAN
// ============================================================

export interface PlanMaquina {
  id?: number;
  maquina_id: number;
  maquina_nombre?: string;
  orden: number;
  es_regalo: boolean;
  obligatoria: boolean;
}


// ============================================================
// HORAS DE PRÁCTICA
// ============================================================

export interface PlanHoraPractica {
  id?: number;
  maquina_id: number;
  maquina_nombre?: string;
  horas: number;
  sesiones_totales: number;
}


// ============================================================
// PRECIO DEL PLAN
// ============================================================

export interface PlanPrecio {
  id?: number;

  nombre: string;

  monto_total: number | null;

  matricula: number;

  certificacion: number;

  cantidad_cuotas: number;

  monto_cuota: number | null;

  vigente_desde: string | null;

  vigente_hasta: string | null;

  activo: boolean;

  observaciones: string | null;

  aplica_maquina_id: number | null;

  aplica_maquina_nombre?: string;

  requiere_tractor: boolean;
}


// ============================================================
// PLAN DE CURSO
// ============================================================

export interface PlanCurso {

  id: number;

  tipo_curso_id: number;

  tipo_curso_codigo?: string;

  tipo_curso_nombre?: string;

  duracion_meses?: number;

  cantidad_maquinas?: number;

  codigo: string;

  nombre: string;

  version: number;

  permite_eleccion_personalizada: boolean;

  vigente_desde: string | null;

  vigente_hasta: string | null;

  activo: boolean;

  observaciones: string | null;

  maquinas?: PlanMaquina[];

  horas_practica?: PlanHoraPractica[];

  precios?: PlanPrecio[];
}


// ============================================================
// DATOS PARA CREAR / ACTUALIZAR
// ============================================================

export interface PlanCursoPayload {

  tipo_curso_id: number;

  codigo: string;

  nombre: string;

  version?: number;

  permite_eleccion_personalizada?: boolean;

  vigente_desde?: string | null;

  vigente_hasta?: string | null;

  activo?: boolean;

  observaciones?: string | null;

  maquinas: PlanMaquina[];

  horas_practica: PlanHoraPractica[];

  precios: PlanPrecio[];
}
