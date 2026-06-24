export interface Alumno {
  id: number;
  dni: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento?: string | null;
  telefono?: string | null;
  correo?: string | null;
  direccion?: string | null;
  foto_url?: string | null;
  observaciones?: string | null;
  fecha_registro?: string | null;
  activo: boolean;

  seguro_alumno?: string | null;
  anio_ingreso?: number | null;
  mes_ingreso?: string | null;
}

export interface AlumnoPayload {
  dni: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento?: string | null;
  telefono?: string | null;
  correo?: string | null;
  direccion?: string | null;
  observaciones?: string | null;

  seguro_alumno?: string | null;
  anio_ingreso?: number | null;
  mes_ingreso?: string | null;
}