export interface PlanCurso {
  id: number;
  codigo: string;
  nombre: string;
  version: number;
  permite_eleccion_personalizada: boolean;
  vigente_desde?: string | null;
  vigente_hasta?: string | null;
  activo: boolean;
  observaciones?: string | null;

  tipo_curso_id: number;
  tipo_curso_codigo: string;
  tipo_curso_nombre: string;
}