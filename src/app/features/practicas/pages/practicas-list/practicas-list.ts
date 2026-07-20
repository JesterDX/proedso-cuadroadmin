import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  PracticasService,
  AlumnoDisponible,
  MaquinaAlumno
} from '../../services/practicas.service';
// 👆 ajusta la ruta al service según dónde quede en tu proyecto

interface GrupoAnio {
  anio: number;
  alumnos: AlumnoDisponible[];
}

interface SeleccionMaquina {
  seleccionado: boolean;
  sesionesAAsignar: number;
}

@Component({
  selector: 'app-nueva-sesion-practica',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './practicas-list.html',
  styleUrl: './practicas-list.scss'
})
export class PracticasListComponent implements OnInit {

  private practicasService = inject(PracticasService);

  // ==========================================
  // FILTROS
  // ==========================================
  fechaSesion = '';
  filtroMes: number | null = null;
  filtroAnio: number | null = new Date().getFullYear();
  filtroCurso: number | null = null;
  filtroMaquina: number | null = null;
  filtroNombre = '';

  meses = [
    { id: 1, nombre: 'Enero' },
    { id: 2, nombre: 'Febrero' },
    { id: 3, nombre: 'Marzo' },
    { id: 4, nombre: 'Abril' },
    { id: 5, nombre: 'Mayo' },
    { id: 6, nombre: 'Junio' },
    { id: 7, nombre: 'Julio' },
    { id: 8, nombre: 'Agosto' },
    { id: 9, nombre: 'Septiembre' },
    { id: 10, nombre: 'Octubre' },
    { id: 11, nombre: 'Noviembre' },
    { id: 12, nombre: 'Diciembre' }
  ];

  // TODO: cargar desde catálogo real cuando exista el endpoint
  cursos: any[] = [];
  maquinas: any[] = [];

  // ==========================================
  // ESTADO DE CARGA
  // ==========================================
  loadingLista = false;
  errorCarga = '';

  // ==========================================
  // DATOS
  // ==========================================
  gruposPorAnio: GrupoAnio[] = [];

  // clave: `${matriculaId}_${maquinaId}`
  private selecciones = new Map<string, SeleccionMaquina>();

  ngOnInit(): void {
    this.cargarPracticas();
  }

  // ==========================================
  // CARGA DE ALUMNOS
  // ==========================================
  cargarPracticas(): void {

    this.loadingLista = true;
    this.errorCarga = '';

    const filtros = {
      anio: this.filtroAnio,
      mes: this.filtroMes,
      cursoId: this.filtroCurso,
      maquinaId: this.filtroMaquina,
      nombre: this.filtroNombre
    };

    this.practicasService.listarAlumnosDisponibles(filtros).subscribe({
      next: (resp) => {
        const alumnos: AlumnoDisponible[] = resp?.data ?? [];
        this.agruparPorAnio(alumnos);
        this.selecciones.clear();
        this.loadingLista = false;
      },
      error: (err) => {
        console.error('❌ listarAlumnosDisponibles:', err);
        this.errorCarga = 'No se pudo cargar la lista de alumnos.';
        this.gruposPorAnio = [];
        this.loadingLista = false;
      }
    });
  }

  private agruparPorAnio(alumnos: AlumnoDisponible[]): void {

    const mapa = new Map<number, AlumnoDisponible[]>();

    for (const alumno of alumnos) {
      if (!mapa.has(alumno.anio)) {
        mapa.set(alumno.anio, []);
      }
      mapa.get(alumno.anio)!.push(alumno);
    }

    this.gruposPorAnio = Array.from(mapa.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([anio, alumnosDelAnio]) => ({ anio, alumnos: alumnosDelAnio }));
  }

  // ==========================================
  // SEMÁFORO FINANCIERO
  // ==========================================
  claseEstado(alumno: AlumnoDisponible): string {
    switch (alumno.estado_financiero) {
      case 'MOROSO': return 'estado-rojo';
      case 'PENDIENTE': return 'estado-naranja';
      default: return 'estado-verde';
    }
  }

  etiquetaEstado(alumno: AlumnoDisponible): string {
    switch (alumno.estado_financiero) {
      case 'MOROSO': return 'Moroso';
      case 'PENDIENTE': return 'Pago pendiente';
      default: return 'Al día';
    }
  }

  puedeSeleccionar(alumno: AlumnoDisponible): boolean {
    return alumno.estado_financiero !== 'MOROSO';
  }

  mensajeBloqueo(alumno: AlumnoDisponible): string {
    return `${alumno.alumno} tiene cuotas vencidas y no puede asignarse a prácticas hasta regularizar su pago.`;
  }

  mensajeAdvertencia(alumno: AlumnoDisponible): string {
    return `${alumno.alumno} tiene una cuota pendiente. Puede asignarse, pero se recomienda avisarle sobre su pago.`;
  }

  // ==========================================
  // SELECCIÓN DE SESIONES POR MÁQUINA
  // ==========================================
  private clave(matriculaId: number, maquinaId: number): string {
    return `${matriculaId}_${maquinaId}`;
  }

  estaSeleccionada(alumno: AlumnoDisponible, maquina: MaquinaAlumno): boolean {
    return this.selecciones.get(this.clave(alumno.matricula_id, maquina.maquina_id))?.seleccionado ?? false;
  }

  sesionesSeleccionadas(alumno: AlumnoDisponible, maquina: MaquinaAlumno): number {
    return this.selecciones.get(this.clave(alumno.matricula_id, maquina.maquina_id))?.sesionesAAsignar ?? 1;
  }

  toggleMaquina(alumno: AlumnoDisponible, maquina: MaquinaAlumno, checked: boolean): void {

    if (!this.puedeSeleccionar(alumno) || maquina.sesiones_restantes <= 0) {
      return;
    }

    const key = this.clave(alumno.matricula_id, maquina.maquina_id);
    const actual = this.selecciones.get(key) ?? { seleccionado: false, sesionesAAsignar: 1 };

    actual.seleccionado = checked;
    if (actual.sesionesAAsignar < 1) {
      actual.sesionesAAsignar = 1;
    }

    this.selecciones.set(key, actual);
  }

  actualizarSesiones(alumno: AlumnoDisponible, maquina: MaquinaAlumno, valor: number): void {

    const key = this.clave(alumno.matricula_id, maquina.maquina_id);
    const actual = this.selecciones.get(key) ?? { seleccionado: true, sesionesAAsignar: 1 };

    // 👇 nunca debe pasarse de las sesiones restantes de esa máquina
    let sesiones = Math.floor(Number(valor)) || 1;
    if (sesiones < 1) sesiones = 1;
    if (sesiones > maquina.sesiones_restantes) sesiones = maquina.sesiones_restantes;

    actual.sesionesAAsignar = sesiones;
    this.selecciones.set(key, actual);
  }

  // ==========================================
  // RESUMEN
  // ==========================================
  get totalAlumnosSeleccionados(): number {
    const matriculas = new Set<number>();
    this.gruposPorAnio.forEach(grupo =>
      grupo.alumnos.forEach(alumno =>
        alumno.maquinas.forEach(maquina => {
          if (this.estaSeleccionada(alumno, maquina)) {
            matriculas.add(alumno.matricula_id);
          }
        })
      )
    );
    return matriculas.size;
  }

  get totalSesionesSeleccionadas(): number {
    let total = 0;
    this.selecciones.forEach(sel => {
      if (sel.seleccionado) total += sel.sesionesAAsignar;
    });
    return total;
  }

  get puedeGenerarSesion(): boolean {
    return !!this.fechaSesion && this.totalAlumnosSeleccionados > 0;
  }

  // ==========================================
  // GENERAR SESIÓN DE PRÁCTICA (PENDIENTE BACKEND)
  // ==========================================
  generarSesionPractica(): void {

    if (!this.puedeGenerarSesion) {
      return;
    }

    const detalle: any[] = [];

    this.gruposPorAnio.forEach(grupo => {
      grupo.alumnos.forEach(alumno => {
        alumno.maquinas.forEach(maquina => {
          if (this.estaSeleccionada(alumno, maquina)) {
            detalle.push({
              matriculaId: alumno.matricula_id,
              matriculaMaquinaId: maquina.matricula_maquina_id,
              maquinaId: maquina.maquina_id,
              sesiones: this.sesionesSeleccionadas(alumno, maquina)
            });
          }
        });
      });
    });

    const payload = {
      fecha: this.fechaSesion,
      detalle
    };

    // TODO: conectar a POST /practicas/sesiones-grupales cuando exista.
    // Ese endpoint debe validar:
    //  - que no haya otra sesión grupal PENDIENTE/EN_CURSO abierta
    //  - que ningún alumno tenga estado_financiero = MOROSO
    //  - que "sesiones" no exceda "sesiones_restantes" por máquina
    // y devolver el id de la sesión grupal + la URL del PDF generado.
    console.log('Payload sesión de práctica (pendiente conectar backend):', payload);
  }
}
