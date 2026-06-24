interface PracticaOrdenada {

    matricula_id: number;

    fecha_inicio: string;

    alumno_dni: string;

    alumno_nombre_completo: string;

    alumno_telefono: string;

    plan_nombre: string;

    tipo_curso_codigo: string;

    tipo_curso_nombre: string;

    estado_matricula: string;

}

interface MaquinaAlumno {

    matricula_maquina_id: number;

    maquina_id: number;

    maquina: string;

    horas_practica: number;

}

interface SesionPractica {

    id: number;

    numero_sesion: number;

    fecha_programada: string;

    asistio: boolean;

    observaciones: string;

}

interface AsignacionPractica {

    id: number;

    matricula_id: number;

    alumno: string;

    maquina: string;

    sesiones_totales: number;

    sesiones_completadas: number;

    estado: string;

    progreso: number;

    sesiones?: SesionPractica[];

}