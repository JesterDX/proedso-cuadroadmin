export interface PlanMaquina {

  id: number;

  nombre: string;

  horas: number;

  sesiones_totales: number;

  seleccionada: boolean;

  obligatoria: boolean;

  es_regalo: boolean;

  orden: number | null;

}
