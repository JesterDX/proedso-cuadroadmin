export interface PlanCurso {

  id:number;

  codigo:string;

  nombre:string;

  version:number;

  tipo_curso_id:number;

  tipo_curso_nombre:string;

  vigente_desde:string;

  vigente_hasta:string | null;

  permite_eleccion_personalizada:boolean;

  activo:boolean;

  observaciones:string;
}