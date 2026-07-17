import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  PracticasService
} from '../../services/practicas.service';

// Interfaces locales simuladas para evitar errores de compilación
interface PracticaOrdenada {
  matricula_id: number;
  alumno_nombre_completo: string;
  alumno_dni: string;
  plan_nombre: string;
  fecha_matricula: string;
  estado_financiero: string;
}
interface MaquinaAlumno { maquina: string; horas_practica: number; }
interface AsignacionPractica { id: number; matricula_id: number; maquina: string; estado: string; progreso: number; sesiones_completadas: number; sesiones_totales: number; sesiones?: any[]; }

@Component({
  selector: 'app-practicas-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './practicas-list.html',
  styleUrls: ['./practicas-list.scss']
})
export class PracticasListComponent implements OnInit {

  // ==========================================
  // INYECTIONS
  // ==========================================
  private practicasService = inject(PracticasService);
  private cd = inject(ChangeDetectorRef);

  // ==========================================
  // VARIABLES
  // ==========================================
  alumnos: PracticaOrdenada[] = [];
  alumnosAgrupados: any[] = [];
  maquinas: MaquinaAlumno[] = [];
  asignaciones: AsignacionPractica[] = [];

  alumnoSeleccionado: PracticaOrdenada | null = null;
  detalleAlumno: any = null; 

  panelVisible = false;

  loadingLista = false;
  loadingValidacion = false;
  loadingAsignaciones = false;
  loadingDetalle = false;
  creandoAsignacion = false;

  error = '';

  // ==========================================
  // FILTROS
  // ==========================================
  filtroMes: number | null = null;
  filtroAnio: number | null = null;
  filtroTipoCurso: string | null = null;

  // ==========================================
  // CONFIGURACIÓN DE PAGINACIÓN LOCAL
  // ==========================================
  itemsPorPagina = 10; // Cambia este número si quieres ver más o menos filas por página
  paginasPorGrupo: { [key: string]: number } = {}; // Guarda el estado de página de cada mes

  // ==========================================
  // INIT
  // ==========================================
  ngOnInit(): void {
    this.cargarPracticas();
  }

  private agruparPorMesAnio(): void {
    const grupos = new Map<string, any[]>();
    this.paginasPorGrupo = {}; // Limpiamos paginaciones previas

    this.alumnos.forEach((alumno: any) => {
      const fecha = new Date(alumno.fecha_matricula);
      const key = fecha.toLocaleString('es-PE', {
        month: 'long',
        year: 'numeric'
      });

      if (!grupos.has(key)) {
        grupos.set(key, []);
        this.paginasPorGrupo[key] = 1; // Inicializar grupo en la página 1
      }
      grupos.get(key)?.push(alumno);
    });

    this.alumnosAgrupados = Array.from(
      grupos.entries()
    ).map(([periodo, alumnos]) => ({
      periodo,
      alumnos
    }));
  }

  // ==========================================
  // LÓGICA DE PAGINACIÓN DINÁMICA
  // ==========================================
  obtenerAlumnosPaginados(grupo: any): any[] {
    const paginaActual = this.paginasPorGrupo[grupo.periodo] || 1;
    const inicio = (paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return grupo.alumnos.slice(inicio, fin);
  }

  calcularTotalPaginas(totalItems: number): number {
    return Math.ceil(totalItems / this.itemsPorPagina);
  }

  cambiarPagina(periodoKey: string, direccion: number): void {
    if (!this.paginasPorGrupo[periodoKey]) {
      this.paginasPorGrupo[periodoKey] = 1;
    }
    this.paginasPorGrupo[periodoKey] += direccion;
    this.cd.detectChanges();
  }

  obtenerRangoPaginacion(grupo: any): string {
    const paginaActual = this.paginasPorGrupo[grupo.periodo] || 1;
    const inicio = ((paginaActual - 1) * this.itemsPorPagina) + 1;
    const fin = Math.min(paginaActual * this.itemsPorPagina, grupo.alumnos.length);
    return `${inicio}-${fin}`;
  }

  // ==========================================
  // CARGAR ALUMNOS
  // ==========================================
  cargarPracticas(): void {
    this.loadingLista = true;
    this.error = '';
    this.cd.detectChanges();

    const filtros = {
      mes: this.filtroMes,
      anio: this.filtroAnio,
      tipoCurso: this.filtroTipoCurso
    };

    this.practicasService.listarPracticasOrdenadas(filtros)
      .subscribe({
        next: (resp) => {
          this.alumnos = resp.data || [];
          this.agruparPorMesAnio();
          this.loadingLista = false;
          this.cd.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.error = 'Error al cargar alumnos';
          this.loadingLista = false;
          this.cd.detectChanges();
        }
      });
  }

  // ==========================================
  // SELECCIONAR ALUMNO
  // ==========================================
  seleccionarAlumno(alumno: PracticaOrdenada): void {
    this.alumnoSeleccionado = alumno;
    this.panelVisible = true;
    this.detalleAlumno = null;
    this.asignaciones = [];
    this.maquinas = [];
    this.cd.detectChanges();

    this.cargarDetalleAlumno(alumno.matricula_id);
    this.cargarAsignaciones(alumno.matricula_id);
  }

  // ==========================================
  // CARGAR DETALLE ALUMNO
  // ==========================================
  cargarDetalleAlumno(matriculaId: number): void {
    this.loadingDetalle = true;
    this.cd.detectChanges();

    this.practicasService.obtenerDetallePracticas(matriculaId)
      .subscribe({
        next: (resp) => {
          console.log('DETALLE:', resp);
          this.detalleAlumno = resp.data;
          this.maquinas = resp.data?.maquinas || [];
          this.asignaciones = resp.data?.asignaciones || [];
          this.loadingDetalle = false;
          this.cd.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.loadingDetalle = false;
          this.error = 'Error al cargar detalle';
          this.cd.detectChanges();
        }
      });
  }

  // ==========================================
  // CARGAR ASIGNACIONES
  // ==========================================
  cargarAsignaciones(matriculaId: number): void {
    this.loadingAsignaciones = true;
    this.cd.detectChanges();

    this.practicasService.listarAsignaciones()
      .subscribe({
        next: (resp) => {
          const todas = resp.data || [];
          this.asignaciones = todas.filter(
            (x: AsignacionPractica) => Number(x.matricula_id) === Number(matriculaId)
          );
          this.loadingAsignaciones = false;
          this.cd.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.loadingAsignaciones = false;
          this.error = 'Error al cargar asignaciones';
          this.cd.detectChanges();
        }
      });
  }

  // ==========================================
  // CREAR ASIGNACIÓN
  // ==========================================
  crearAsignacion(): void {
    if (!this.alumnoSeleccionado) return;

    this.creandoAsignacion = true;
    this.cd.detectChanges();

    this.practicasService.crearAsignacion(
      this.alumnoSeleccionado.matricula_id
    ).subscribe({
      next: () => {
        this.creandoAsignacion = false;
        this.cargarAsignaciones(this.alumnoSeleccionado!.matricula_id);
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.creandoAsignacion = false;
        this.error = err?.error?.error || 'Error al crear asignación';
        this.cd.detectChanges();
      }
    });
  }

  // ==========================================
  // VER SESIONES
  // ==========================================
  verSesiones(asignacion: AsignacionPractica): void {
    this.practicasService.listarSesiones(asignacion.id)
      .subscribe({
        next: (resp) => {
          asignacion.sesiones = resp.data || [];
          this.cd.detectChanges();
        },
        error: (err) => console.error(err)
      });
  }

  // ==========================================
  // REGISTRAR ASISTENCIA
  // ==========================================
  marcarAsistencia(sesionId: number, asistio: boolean): void {
    this.practicasService.registrarAsistencia(
      sesionId,
      { asistio }
    ).subscribe({
      next: () => {
        if (this.alumnoSeleccionado) {
          this.cargarAsignaciones(this.alumnoSeleccionado.matricula_id);
        }
      },
      error: (err) => console.error(err)
    });
  }

  // ==========================================
  // CERRAR PANEL
  // ==========================================
  cerrarPanel(): void {
    this.panelVisible = false;
    this.detalleAlumno = null;
    this.asignaciones = [];
    this.maquinas = [];
    this.alumnoSeleccionado = null;
    this.cd.detectChanges();
  }
}
