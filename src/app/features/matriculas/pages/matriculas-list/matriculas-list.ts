import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { Alumno } from '../../../alumnos/models/alumno.model';
import { Matricula, MatriculaPayload } from '../../models/matricula.model';
import { EstadoAlumno } from '../../models/estado-alumno.model';
import { PlanCurso } from '../../models/plan-curso.model';
import { Maquina } from '../../models/maquina.model';
import { MatriculaPdfService } from '../../services/matricula-pdf.service';

import { AlumnosService } from '../../../alumnos/services/alumnos.service';
import { EstadosAlumnoService } from '../../services/estados-alumno.service';
import { PlanesCursoService } from '../../services/planes-curso.service';
import { MatriculasService } from '../../services/matriculas.service';
import { MaquinasService } from '../../services/maquinas.service';
import { ApiResponse } from '../../../../core/models/api-response.model';
import * as html2pdf from 'html2pdf.js';
@Component({
  selector: 'app-matriculas-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './matriculas-list.html',
  styleUrl: './matriculas-list.scss'
})
export class MatriculasList implements OnInit {
  private alumnosService = inject(AlumnosService);
  private estadosAlumnoService = inject(EstadosAlumnoService);
  private planesCursoService = inject(PlanesCursoService);
  private matriculasService = inject(MatriculasService);
  private maquinasService = inject(MaquinasService);
  private cd = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private searchSubject = new Subject<string>();
  private matriculaPdfService = inject(MatriculaPdfService);

  txtBusquedaAlumno: string = '';
  vistaActual: 'MATRICULADO' | 'RETIRADO' | 'RESERVA' | 'EGRESADO' = 'MATRICULADO';
  tituloVista = 'Matrículas activas';
  matriculas: Matricula[] = [];
  matriculasOriginal: Matricula[] = [];
  paginaActual = 1;
  itemsPorPagina = 10;
  totalPaginas = 1;
  matriculasPaginadas: Matricula[] = [];
  alumnos: Alumno[] = [];
  estadosAlumno: EstadoAlumno[] = [];
  planesCurso: PlanCurso[] = [];
  maquinas: Maquina[] = [];
  search = '';
  anioFiltro: number | null = null;
  mesFiltro: number | null = null;
  modoModal: 'crear' | 'editar' = 'crear';
  matriculaEditandoId: number | null = null;
  aniosDisponibles: number[] = [];
  mesesDisponibles = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  loading = false;
  errorMsg = '';
  cargado = false;

  modalOpen = false;
  saving = false;

  mostrarSelectorMaquinas = false;
  cantidadMaquinasRequeridas = 0;
  maquinasDisponibles: Maquina[] = [];
  maquinasSeleccionadas: number[] = [];

  form: MatriculaPayload = this.getEmptyForm();

  ngOnInit(): void {
    this.vistaActual = this.route.snapshot.data['vista'] ?? 'MATRICULADO';
    this.tituloVista = this.route.snapshot.data['titulo'] ?? 'Matrículas';

    // CORRECCIÓN: Nos aseguramos de refrescar la vista después de que el debounce termine
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((texto) => {
      this.search = texto;
      this.paginaActual = 1;
      this.buscar();
    });

    this.cargarTodo();
  }


  getEmptyForm(): MatriculaPayload {
    return {
      alumno_id: null,
      plan_curso_id: null,
      estado_alumno_id: null,
      fecha_matricula: new Date().toISOString().slice(0, 10),
      fecha_inicio: null,
      fecha_fin_estimada: null,
      notas: '',
      maquinas_seleccionadas: [],
      modalidad_pago: 'MENSUAL'
    };
  }

  cargarTodo(): void {
    this.loading = true;
    this.errorMsg = '';
    this.cargado = false;
    this.cd.detectChanges();

    this.alumnosService.listar('', true).subscribe({
      next: (resp) => {
        this.alumnos = resp.data ?? [];
        this.cd.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al cargar alumnos:', err);
        this.cd.detectChanges();
      }
    });

    this.estadosAlumnoService.listar().subscribe({
      next: (resp) => {
        this.estadosAlumno = resp.data ?? [];
        this.cd.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al cargar estados de alumno:', err);
        this.cd.detectChanges();
      }
    });

    this.planesCursoService.listar().subscribe({
      next: (resp) => {
        this.planesCurso = resp.data ?? [];
        this.cd.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al cargar planes de curso:', err);
        this.cd.detectChanges();
      }
    });

    this.maquinasService.listar().subscribe({
      next: (resp) => {
        this.maquinas = resp.data ?? [];
        this.cd.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al cargar máquinas:', err);
        this.cd.detectChanges();
      }
    });

    this.matriculasService
      .listar(
        this.vistaActual,
        this.search,
        this.anioFiltro,
        this.mesFiltro
      ).pipe(
        finalize(() => {
          this.loading = false;
          this.cargado = true;
          this.cd.detectChanges();
        })
      )
      .subscribe({
        next: (resp) => {
          this.matriculas = resp.data ?? [];
          this.matriculasOriginal = [...this.matriculas];
          this.actualizarPaginacion();
          this.cd.detectChanges();
        },
        error: (err: any) => {
          console.error('Error al cargar matrículas:', err);
          this.errorMsg = 'No se pudieron cargar las matrículas.';
          this.cd.detectChanges();
        }
      });
  }

  abrirModalCrear(): void {
    this.form = this.getEmptyForm();
    this.modalOpen = true;
    this.txtBusquedaAlumno = '';
    this.form = this.getEmptyForm();
    this.mostrarSelectorMaquinas = false;
    this.cantidadMaquinasRequeridas = 0;
    this.maquinasDisponibles = [];
    this.maquinasSeleccionadas = [];
    this.cd.detectChanges();
    this.modoModal = 'crear';
    this.matriculaEditandoId = null;
  }
  onSearchChange(): void {
    this.searchSubject.next(this.search);
  }
  cerrarModal(): void {
    if (this.saving) return;
    this.modalOpen = false;
    this.cd.detectChanges();
  }
  actualizarPaginacion(): void {

    this.totalPaginas = Math.ceil(
      this.matriculas.length / this.itemsPorPagina
    );

    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;

    this.matriculasPaginadas = this.matriculas.slice(inicio, fin);

    this.cd.detectChanges();
  }
  cambiarPagina(pagina: number): void {

    if (pagina < 1 || pagina > this.totalPaginas) return;

    this.paginaActual = pagina;

    this.actualizarPaginacion();
  }
  get paginas(): number[] {
    return Array.from(
      { length: this.totalPaginas },
      (_, i) => i + 1
    );
  }
  get alumnosFiltrados(): Alumno[] {
    if (!this.txtBusquedaAlumno) {
      return this.alumnos;
    }
    const busqueda = this.txtBusquedaAlumno.toLowerCase();
    return this.alumnos.filter(a =>
      a.nombres.toLowerCase().includes(busqueda) ||
      a.apellidos.toLowerCase().includes(busqueda) ||
      a.dni?.includes(busqueda)
    );
  }
abrirModalEditar(matricula: Matricula): void {

  this.modoModal = 'editar';
  this.matriculaEditandoId = matricula.id;

  this.form = {
    alumno_id: matricula.alumno_id,
    plan_curso_id: matricula.plan_curso_id,
    estado_alumno_id: matricula.estado_alumno_id,
    fecha_matricula: matricula.fecha_matricula
      ? matricula.fecha_matricula.split('T')[0]
      : new Date().toISOString().slice(0, 10),
    fecha_inicio: matricula.fecha_inicio?.split('T')[0] || null,
    fecha_fin_estimada: matricula.fecha_fin_estimada?.split('T')[0] || null,
    notas: matricula.notas || '',
    maquinas_seleccionadas: [],
    modalidad_pago: matricula.modalidad_pago || 'MENSUAL'
  };

  this.modalOpen = true;

  this.actualizarSelectorMaquinas();
  this.recalcularFechaFin();

  // 👇 AQUÍ CARGAS LAS MÁQUINAS DE LA MATRÍCULA
  this.matriculasService.listarMaquinas(matricula.id).subscribe({
    next: (resp) => {

      this.maquinasSeleccionadas = (resp.data ?? [])
        .filter(m => !m.es_regalo)
        .map(m => m.maquina_id);

      this.form.maquinas_seleccionadas = [...this.maquinasSeleccionadas];

      this.cd.detectChanges();
    }
  });

}
  validarFormulario(): string[] {
    const errores: string[] = [];

    if (!this.form.alumno_id) errores.push('Debes seleccionar un alumno.');
    if (!this.form.plan_curso_id) errores.push('Debes seleccionar un plan de curso.');
    if (!this.form.estado_alumno_id) errores.push('Debes seleccionar un estado.');
    if (!this.form.fecha_matricula) errores.push('La fecha de matrícula es obligatoria.');

    if (this.mostrarSelectorMaquinas && this.maquinasSeleccionadas.length !== this.cantidadMaquinasRequeridas) {
      errores.push(`Debes seleccionar exactamente ${this.cantidadMaquinasRequeridas} máquina(s).`);
    }

    return errores;
  }

  guardarMatricula(): void {
    const errores = this.validarFormulario();

    if (errores.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Faltan datos',
        html: errores.map(e => `• ${e}`).join('<br>'),
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const payload: MatriculaPayload = {
      alumno_id: this.form.alumno_id,
      plan_curso_id: this.form.plan_curso_id,
      estado_alumno_id: this.form.estado_alumno_id,
      fecha_matricula: this.form.fecha_matricula,
      fecha_inicio: this.form.fecha_inicio || null,
      fecha_fin_estimada: this.form.fecha_fin_estimada || null,
      notas: this.form.notas || '',
      maquinas_seleccionadas: [...this.maquinasSeleccionadas],
      modalidad_pago: this.form.modalidad_pago || 'MENSUAL'

    };

    this.saving = true;
    this.cd.detectChanges();

    const request$ =
      this.modoModal === 'crear'
        ? this.matriculasService.crear(payload)
        : this.matriculasService.actualizar(this.matriculaEditandoId!, payload);

    request$.subscribe({
      next: (resp: ApiResponse<Matricula>) => {
        this.saving = false;
        this.modalOpen = false;
        this.cd.detectChanges();

        Swal.fire({
          icon: 'success',
          title: 'Matrícula creada',
          text: resp.message || 'La matrícula fue registrada correctamente.',
          confirmButtonText: 'Aceptar'
        });

        this.cargarTodo();
      },
      error: (err: any) => {
        this.saving = false;
        this.cd.detectChanges();

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err?.error?.message || 'No se pudo registrar la matrícula.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  onPlanChange(): void {
    this.recalcularFechaFin();
    this.actualizarSelectorMaquinas();
    this.cd.detectChanges();
  }

  onFechaInicioChange(): void {
    this.recalcularFechaFin();
    this.cd.detectChanges();
  }

  recalcularFechaFin(): void {
    if (!this.form.plan_curso_id || !this.form.fecha_inicio) {
      this.form.fecha_fin_estimada = null;
      return;
    }

    const plan = this.planesCurso.find(p => p.id === this.form.plan_curso_id);

    if (!plan) {
      this.form.fecha_fin_estimada = null;
      return;
    }

    const meses = this.getDuracionMesesPorTipo(plan.tipo_curso_codigo);

    if (!meses) {
      this.form.fecha_fin_estimada = null;
      return;
    }

    this.form.fecha_fin_estimada = this.calcularFechaFin(this.form.fecha_inicio, meses);
  }

  actualizarSelectorMaquinas(): void {
    this.mostrarSelectorMaquinas = false;
    this.cantidadMaquinasRequeridas = 0;
    this.maquinasDisponibles = [];
    this.maquinasSeleccionadas = [];
    this.form.maquinas_seleccionadas = [];

    if (!this.form.plan_curso_id) {
      this.cd.detectChanges();
      return;
    }

    const plan = this.planesCurso.find(p => p.id === this.form.plan_curso_id);
    if (!plan) {
      this.cd.detectChanges();
      return;
    }

    if (!plan.permite_eleccion_personalizada) {
      this.cd.detectChanges();
      return;
    }

    this.mostrarSelectorMaquinas = true;
    this.cantidadMaquinasRequeridas = this.getCantidadMaquinasPorTipo(plan.tipo_curso_codigo);

    const maquinasOrdenadas = [...this.maquinas].sort(
      (a, b) => (a.orden_visual ?? 999) - (b.orden_visual ?? 999)
    );

    this.maquinasDisponibles = this.esPlanMultipleConRegalo()
      ? maquinasOrdenadas.filter(m => m.nombre !== 'Camioneta')
      : maquinasOrdenadas;

    this.cd.detectChanges();
  }

  getCantidadMaquinasPorTipo(tipoCursoCodigo: string): number {
    switch (tipoCursoCodigo) {
      case 'INDIVIDUAL':
        return 1;
      case 'DOBLE':
        return 2;
      case 'TRIPLE':
        return 3;
      case 'MULTIPLE':
        return 5;
      default:
        return 0;
    }
  }

  toggleMaquina(maquinaId: number, event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.checked) {
      if (this.maquinasSeleccionadas.length >= this.cantidadMaquinasRequeridas) {
        input.checked = false;

        Swal.fire({
          icon: 'warning',
          title: 'Límite alcanzado',
          text: `Solo puedes seleccionar ${this.cantidadMaquinasRequeridas} máquina(s) para este plan.`,
          confirmButtonText: 'Aceptar'
        });
        return;
      }

      if (!this.maquinasSeleccionadas.includes(maquinaId)) {
        this.maquinasSeleccionadas.push(maquinaId);
      }
    } else {
      this.maquinasSeleccionadas = this.maquinasSeleccionadas.filter(id => id !== maquinaId);
    }

    this.form.maquinas_seleccionadas = [...this.maquinasSeleccionadas];
    this.cd.detectChanges();
  }

  isMaquinaSeleccionada(maquinaId: number): boolean {
    return this.maquinasSeleccionadas.includes(maquinaId);
  }
  constructor() {
    const anioActual = new Date().getFullYear();

    for (let i = anioActual + 1; i >= 2023; i--) {
      this.aniosDisponibles.push(i);
    }
  }

  getDuracionMesesPorTipo(tipoCursoCodigo: string): number {
    switch (tipoCursoCodigo) {
      case 'INDIVIDUAL':
        return 3;
      case 'DOBLE':
        return 5;
      case 'TRIPLE':
        return 8;
      case 'MULTIPLE':
        return 12;
      default:
        return 0;
    }
  }

  calcularFechaFin(fechaInicio: string, meses: number): string {
    const [anioStr, mesStr, diaStr] = fechaInicio.split('-');
    const anio = Number(anioStr);
    const mes = Number(mesStr);
    const dia = Number(diaStr);

    const fecha = new Date(anio, mes - 1, dia);

    if (Number.isNaN(fecha.getTime())) {
      return '';
    }

    fecha.setMonth(fecha.getMonth() + meses);

    const anioFinal = fecha.getFullYear();
    const mesFinal = String(fecha.getMonth() + 1).padStart(2, '0');
    const diaFinal = String(fecha.getDate()).padStart(2, '0');

    return `${anioFinal}-${mesFinal}-${diaFinal}`;
  }

  getNombreAlumno(alumnoId: number): string {
    const alumno = this.alumnos.find(a => a.id === alumnoId);
    return alumno ? `${alumno.nombres} ${alumno.apellidos}` : '-';
  }

  getNombreEstado(estadoId: number): string {
    const estado = this.estadosAlumno.find(e => e.id === estadoId);
    return estado?.nombre ?? '-';
  }

  getNombrePlan(planId: number): string {
    const plan = this.planesCurso.find(p => p.id === planId);
    return plan?.nombre ?? '-';
  }

  trackByMatriculaId(index: number, matricula: Matricula): number {
    return matricula.id;
  }

  esPlanMultipleConRegalo(): boolean {
    const plan = this.planesCurso.find(p => p.id === this.form.plan_curso_id);
    if (!plan) return false;

    return plan.tipo_curso_codigo === 'MULTIPLE';
  }


  get estadosMatriculaDisponibles(): EstadoAlumno[] {
    const permitidos = ['MATRICULADO', 'EGRESADO', 'RETIRADO', 'RESERVA'];
    return this.estadosAlumno.filter(e => permitidos.includes(e.codigo));
  }

  formatFechaVista(fecha?: string | null): string {
    if (!fecha) return '-';

    const soloFecha = fecha.split('T')[0];
    const partes = soloFecha.split('-');

    if (partes.length !== 3) return fecha;

    const [anio, mes, dia] = partes;
    return `${dia}/${mes}/${anio}`;
  }

  getClaseEstado(estadoId: number): string {
    const estado = this.estadosAlumno.find(e => e.id === estadoId);

    switch (estado?.codigo) {
      case 'MATRICULADO':
        return 'estado-badge estado-badge--matriculado';
      case 'EGRESADO':
        return 'estado-badge estado-badge--egresado';
      case 'RETIRADO':
        return 'estado-badge estado-badge--retirado';
      case 'RESERVA':
        return 'estado-badge estado-badge--reserva';
      default:
        return 'estado-badge';
    }
  }

  cambiarEstadoMatricula(
    matricula: Matricula,
    codigoEstado: 'RETIRADO' | 'EGRESADO' | 'RESERVA' | 'MATRICULADO'
  ): void {
    const nombreEstado = this.getNombreEstadoPorCodigo(codigoEstado);

    Swal.fire({
      icon: 'question',
      title: 'Confirmar cambio',
      text: `La matrícula pasará al estado ${nombreEstado}.`,
      showCancelButton: true,
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.matriculasService.cambiarEstado(matricula.id, codigoEstado).subscribe({
        next: (resp: ApiResponse<Matricula>) => {
          Swal.fire({
            icon: 'success',
            title: 'Estado actualizado',
            text: resp.message || 'El estado de la matrícula fue actualizado.'
          });

          this.cargarTodo();
        },
        error: (err: any) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err?.error?.message || 'No se pudo cambiar el estado de la matrícula.'
          });
        }
      });
    });
  }

  getNombreEstadoPorCodigo(codigo: string): string {
    return this.estadosAlumno.find(e => e.codigo === codigo)?.nombre ?? codigo;
  }

  puedeRetirar(estadoId: number): boolean {
    const codigo = this.getCodigoEstado(estadoId);
    return codigo === 'MATRICULADO';
  }

  puedeEgresar(estadoId: number): boolean {
    const codigo = this.getCodigoEstado(estadoId);
    return codigo === 'MATRICULADO';
  }

  puedeReservar(estadoId: number): boolean {
    const codigo = this.getCodigoEstado(estadoId);
    return codigo === 'MATRICULADO';
  }

  puedeActivarMatricula(estadoId: number): boolean {
    const codigo = this.getCodigoEstado(estadoId);
    return ['RETIRADO', 'RESERVA', 'EGRESADO'].includes(codigo);
  }

  getCodigoEstado(estadoId: number): string {
    return this.estadosAlumno.find(e => e.id === estadoId)?.codigo ?? '';
  }
  esVistaActiva(): boolean {
    return this.vistaActual === 'MATRICULADO';
  }

  esVistaNoActiva(): boolean {
    return ['RETIRADO', 'RESERVA', 'EGRESADO'].includes(this.vistaActual);
  }

  puedeEditar(): boolean {
    return this.vistaActual === 'MATRICULADO';
  }

  puedeVer(): boolean {
    return true;
  }

  puedeMostrarAccionesDeActiva(): boolean {
    return this.vistaActual === 'MATRICULADO';
  }
  descargarCronograma(matricula: Matricula): void {

    console.log('MATRICULA COMPLETA');
    console.log(matricula);

    this.matriculaPdfService.generarCronogramaPDF(
      matricula,
      this.getNombreAlumno(matricula.alumno_id),
      this.getNombrePlan(matricula.plan_curso_id)
    );
  }
  puedeMostrarActivar(): boolean {
    return ['RETIRADO', 'RESERVA', 'EGRESADO'].includes(this.vistaActual);
  }
  buscar(): void {
    // Si 'search' es undefined o null, lo tratamos como cadena vacía
    const texto = (this.search || '').toLowerCase().trim();

    // Siempre empezamos desde la lista original completa
    let filtradas = [...this.matriculasOriginal];

    // 1. Filtrado por texto (DNI, Nombre o Apellido)
    if (texto) {
      filtradas = filtradas.filter(m => {
        const alumno = this.getNombreAlumno(m.alumno_id).toLowerCase();
        return alumno.includes(texto);
      });
    }

    // 2. Filtrado por Año
    if (this.anioFiltro !== null) {
      filtradas = filtradas.filter(m => {
        if (!m.fecha_matricula) return false;
        // Convertimos a Date de forma segura para extraer el año correcto
        return new Date(m.fecha_matricula).getFullYear() === this.anioFiltro;
      });
    }

    // 3. Filtrado por Mes
    if (this.mesFiltro !== null) {
      filtradas = filtradas.filter(m => {
        if (!m.fecha_matricula) return false;
        // Sumamos 1 ya que getMonth() va de 0 a 11
        return (new Date(m.fecha_matricula).getMonth() + 1) === this.mesFiltro;
      });
    }

    // Guardamos el resultado del filtro en la lista reactiva
    this.matriculas = filtradas;

    // REQUISITO CRÍTICO: Recalcular la paginación para que se entere del nuevo tamaño de la lista
    this.actualizarPaginacion();
    this.cd.detectChanges(); // <-- Asegura que los cambios impacten en el HTML inmediatamente
  }
  limpiarFiltros(): void {
    this.search = '';
    this.anioFiltro = null;
    this.mesFiltro = null;
    this.matriculas = [...this.matriculasOriginal];
    this.paginaActual = 1;
    this.actualizarPaginacion();
  }
}
