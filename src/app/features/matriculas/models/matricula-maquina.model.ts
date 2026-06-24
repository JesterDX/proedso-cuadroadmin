export interface MatriculaMaquina {
  id: number;
  matricula_id: number;
  maquina_id: number;
  orden: number;
  es_regalo: boolean;
  horas_asignadas: number;
  sesiones_totales: number;
  sesiones_completadas: number;
  estado: string;
  maquina_nombre: string;
}