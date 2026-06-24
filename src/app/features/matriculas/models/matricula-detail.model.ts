export interface MatriculaDetail {
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

  alumno_dni: string;
  alumno_nombres: string;
  alumno_apellidos: string;
  alumno_fecha_nacimiento?: string | null;
  alumno_telefono?: string | null;
  alumno_correo?: string | null;
  alumno_direccion?: string | null;
  alumno_foto_url?: string | null;
  alumno_observaciones?: string | null;
  alumno_seguro_alumno?: string | null;

  plan_codigo: string;
  plan_nombre: string;

  estado_codigo: string;
  estado_nombre: string;
}