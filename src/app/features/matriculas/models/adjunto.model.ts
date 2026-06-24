export interface Adjunto {
  id: number;
  modulo: string;
  registro_id: number;
  tipo_archivo?: string | null;
  nombre_archivo?: string | null;
  url_archivo: string;
  observaciones?: string | null;
  fecha_subida: string;
}