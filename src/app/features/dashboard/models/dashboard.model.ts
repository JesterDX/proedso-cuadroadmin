export interface DashboardResumen {

  totalAlumnos: number;

  matriculados: number;

  egresados: number;

  retirados: number;

  alumnosAlDia: number;

  alumnosConDeuda: number;

  maquinas: number;

  cursos: number;

}

export interface EstadoAlumno {

  nombre: string;

  cantidad: number;

}

export interface DashboardGraficos {

  estadosAlumno: EstadoAlumno[];

}

export interface Dashboard {

  resumen: DashboardResumen;

  graficos: DashboardGraficos;

}

export interface DashboardResponse {

  success: boolean;

  message: string;

  data: Dashboard;

}
