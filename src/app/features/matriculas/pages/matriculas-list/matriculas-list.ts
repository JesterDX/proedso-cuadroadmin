import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { finalize } from 'rxjs/operators';

import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  forkJoin
} from 'rxjs';

import Swal from 'sweetalert2';

import {
  RouterLink,
  ActivatedRoute
} from '@angular/router';

import { Alumno } from '../../../alumnos/models/alumno.model';

import {
  Matricula,
  MatriculaPayload,
  CuotaCronograma,
  PrevisualizacionCuotasData
} from '../../models/matricula.model';

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

@Component({
  selector: 'app-matriculas-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './matriculas-list.html',
  styleUrl: './matriculas-list.scss'
})
export class MatriculasList implements OnInit {

  // ==========================================================
  // SERVICES
  // ==========================================================

  private alumnosService = inject(AlumnosService);
  private estadosAlumnoService = inject(EstadosAlumnoService);
  private planesCursoService = inject(PlanesCursoService);
  private matriculasService = inject(MatriculasService);
  private maquinasService = inject(MaquinasService);
  private matriculaPdfService = inject(MatriculaPdfService);

  private cd = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);

  private searchSubject = new Subject<string>();

  // ==========================================================
  // VISTA
  // ==========================================================

  vistaActual:
    | 'MATRICULADO'
    | 'RETIRADO'
    | 'RESERVA'
    | 'EGRESADO' = 'MATRICULADO';

  tituloVista = 'Matrículas activas';

  // ==========================================================
  // MATRÍCULAS
  // ==========================================================

  matriculas: Matricula[] = [];

  matriculasOriginal: Matricula[] = [];

  matriculasPaginadas: Matricula[] = [];

  // ==========================================================
  // CATÁLOGOS
  // ==========================================================

  alumnos: Alumno[] = [];

  estadosAlumno: EstadoAlumno[] = [];

  planesCurso: PlanCurso[] = [];

  maquinas: Maquina[] = [];

  maquinasDisponibles: Maquina[] = [];

  maquinasSeleccionadas: number[] = [];

  // ==========================================================
  // BÚSQUEDA Y FILTROS
  // ==========================================================

  txtBusquedaAlumno = '';

  search = '';

  anioFiltro: number | null = null;

  mesFiltro: number | null = null;

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

  // ==========================================================
  // PAGINACIÓN
  // ==========================================================

  paginaActual = 1;

  itemsPorPagina = 10;

  totalPaginas = 1;

  // ==========================================================
  // ESTADOS DE CARGA
  // ==========================================================

  loading = false;

  saving = false;

  errorMsg = '';

  cargado = false;

  // ==========================================================
  // MODAL MATRÍCULA
  // ==========================================================

  modalOpen = false;

  /**
   * Compatibilidad con HTML que utiliza:
   * *ngIf="mostrarModal"
   */
  get mostrarModal(): boolean {
    return this.modalOpen;
  }

  modoModal: 'crear' | 'editar' = 'crear';

  matriculaEditandoId: number | null = null;

  // ==========================================================
  // FORMULARIO
  // ==========================================================

  form: MatriculaPayload = this.getEmptyForm();

  // ==========================================================
  // SELECTOR DE MÁQUINAS
  // ==========================================================

  mostrarSelectorMaquinas = false;

  cantidadMaquinasRequeridas = 0;

  // ==========================================================
  // PREVISUALIZACIÓN DE CUOTAS
  // ==========================================================

  previewCuotasOpen = false;

  previewCuotasLoading = false;

  previewCuotasError = '';

  previewCuotas: CuotaCronograma[] = [];

  previewMontoTotal: number | null = null;

  previewCuotaInicial: number | null = null;

  previewPrecio: any = null;

  previewPlan: any = null;

  previewMaquinas: any[] = [];

  // ==========================================================
  // COMPATIBILIDAD CON HTML
  // ==========================================================

  get mostrarPrevisualizacionCuotas(): boolean {
    return this.previewCuotasOpen;
  }

  get cuotasPrevisualizadas(): CuotaCronograma[] {
    return this.previewCuotas;
  }

  get cargandoPrevisualizacion(): boolean {
    return this.previewCuotasLoading;
  }

  // ==========================================================
  // TOTAL PREVISUALIZACIÓN
  // ==========================================================

  get totalPreviewCuotas(): number {

    return this.previewCuotas.reduce(
      (total, cuota) =>
        total + this.getMontoCuota(cuota),
      0
    );

  }

  // ==========================================================
  // CONSTRUCTOR
  // ==========================================================

  constructor() {

    const anioActual = new Date().getFullYear();

    for (
      let i = anioActual + 1;
      i >= 2023;
      i--
    ) {
      this.aniosDisponibles.push(i);
    }

  }

  // ==========================================================
  // INIT
  // ==========================================================

  ngOnInit(): void {

    this.vistaActual =
      this.route.snapshot.data['vista'] ??
      'MATRICULADO';

    this.tituloVista =
      this.route.snapshot.data['titulo'] ??
      'Matrículas';

    // ========================================================
    // BUSCADOR
    // ========================================================

    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe((texto: string) => {

        this.search = texto;

        this.paginaActual = 1;

        this.buscar();

      });

    // ========================================================
    // CARGAR DATOS
    // ========================================================

    this.cargarTodo();

  }

  // ==========================================================
  // FORMULARIO VACÍO
  // ==========================================================

 getEmptyForm(): MatriculaPayload {

  return {

    alumno_id: null,

    plan_curso_id: null,

    estado_alumno_id: null,

    fecha_matricula:
      new Date()
        .toISOString()
        .slice(0, 10),

    fecha_inicio: null,

    fecha_fin_estimada: null,

    notas: '',

    maquinas_seleccionadas: [],

    modalidad_pago: 'MENSUAL',

    monto_total: null,

    cuota_inicial: null,

    // ==================================================
    // CERTIFICACIÓN
    // ==================================================

    certificacion_incluida: true,

    costo_certificacion: null

  };

}

  // ==========================================================
  // CARGAR TODO
  // ==========================================================

  cargarTodo(): void {

    this.loading = true;

    this.errorMsg = '';

    this.cargado = false;

    this.cd.detectChanges();

    forkJoin({

      alumnos:
        this.alumnosService.listar('', true),

      estados:
        this.estadosAlumnoService.listar(),

      planes:
        this.planesCursoService.listar(),

      maquinas:
        this.maquinasService.listar(),

      matriculas:
        this.matriculasService.listar(
          this.vistaActual,
          this.search,
          this.anioFiltro,
          this.mesFiltro
        )

    })
      .pipe(

        finalize(() => {

          this.loading = false;

          this.cargado = true;

          this.cd.detectChanges();

        })

      )
      .subscribe({

        next: (resp) => {

          // ==================================================
          // ALUMNOS
          // ==================================================

          this.alumnos =
            resp.alumnos?.data ?? [];

          // ==================================================
          // ESTADOS
          // ==================================================

          this.estadosAlumno =
            resp.estados?.data ?? [];

          // ==================================================
          // PLANES
          // ==================================================

          this.planesCurso =
            resp.planes?.data ?? [];

          // ==================================================
          // MÁQUINAS
          // ==================================================

          this.maquinas =
            resp.maquinas?.data ?? [];

          // ==================================================
          // MATRÍCULAS
          // ==================================================

          this.matriculas =
            resp.matriculas?.data ?? [];

          this.matriculasOriginal =
            [...this.matriculas];

          // ==================================================
          // PAGINACIÓN
          // ==================================================

          this.actualizarPaginacion();

          this.cd.detectChanges();

        },

        error: (err: any) => {

          console.error(
            'Error al cargar datos de matrículas:',
            err
          );

          this.errorMsg =
            'No se pudieron cargar las matrículas.';

          this.cd.detectChanges();

        }

      });

  }

  // ==========================================================
  // ABRIR MODAL CREAR
  // ==========================================================

  abrirModalCrear(): void {

    this.modoModal = 'crear';

    this.matriculaEditandoId = null;

    this.form =
      this.getEmptyForm();

    this.modalOpen = true;

    this.txtBusquedaAlumno = '';

    this.mostrarSelectorMaquinas = false;

    this.cantidadMaquinasRequeridas = 0;

    this.maquinasDisponibles = [];

    this.maquinasSeleccionadas = [];

    this.cerrarPreviewCuotas();

    this.cd.detectChanges();

  }

  // ==========================================================
  // BUSCAR ALUMNO
  // ==========================================================

  onSearchChange(): void {

    this.searchSubject.next(
      this.search || ''
    );

  }

  // ==========================================================
  // FILTRAR ALUMNOS
  // ==========================================================

  filtrarAlumnos(): void {

    this.cd.detectChanges();

  }

  // ==========================================================
  // PREVISUALIZAR CUOTAS
  // ==========================================================

  previsualizarCuotas(): void {

    // ========================================================
    // VALIDACIONES
    // ========================================================

    if (!this.form.alumno_id) {

      Swal.fire({
        icon: 'warning',
        title: 'Selecciona un alumno',
        text:
          'Debes seleccionar un alumno antes de previsualizar las cuotas.',
        confirmButtonText: 'Entendido'
      });

      return;

    }

    if (!this.form.plan_curso_id) {

      Swal.fire({
        icon: 'warning',
        title: 'Selecciona un plan',
        text:
          'Debes seleccionar un plan de curso antes de previsualizar las cuotas.',
        confirmButtonText: 'Entendido'
      });

      return;

    }

    if (!this.form.fecha_matricula) {

      Swal.fire({
        icon: 'warning',
        title: 'Fecha requerida',
        text:
          'Debes indicar la fecha de matrícula.',
        confirmButtonText: 'Entendido'
      });

      return;

    }

    if (
      this.mostrarSelectorMaquinas &&
      this.maquinasSeleccionadas.length !==
      this.cantidadMaquinasRequeridas
    ) {

      Swal.fire({
        icon: 'warning',
        title: 'Máquinas incompletas',
        text:
          `Debes seleccionar exactamente ${this.cantidadMaquinasRequeridas} máquina(s) antes de previsualizar.`,
        confirmButtonText: 'Entendido'
      });

      return;

    }

    // ========================================================
    // ESTADO INICIAL
    // ========================================================

    this.previewCuotasLoading = true;

    this.previewCuotasError = '';

    this.previewCuotas = [];

    this.previewCuotasOpen = false;

    this.previewPrecio = null;

    this.previewPlan = null;

    this.previewMaquinas = [];

    this.previewMontoTotal =
      this.form.monto_total ?? null;

    this.previewCuotaInicial =
      this.form.cuota_inicial ?? null;

    this.cd.detectChanges();

    // ========================================================
    // PAYLOAD
    // ========================================================

    const payload = {

      plan_curso_id:
        Number(this.form.plan_curso_id),

      fecha_matricula:
        this.form.fecha_matricula,

      monto_total:
        this.form.monto_total ?? null,

      cuota_inicial:
        this.form.cuota_inicial ?? null,

      modalidad_pago:
        this.form.modalidad_pago ??
        'MENSUAL',

      maquinas_seleccionadas:
        [
          ...this.maquinasSeleccionadas
        ],
      
        certificacion_incluida:
          true,
      
        costo_certificacion:
          this.form.costo_certificacion ??
          null
      
      };

    };

    // ========================================================
    // LOG REQUEST
    // ========================================================

    console.log('');
    console.log('========================================');
    console.log('📤 PREVISUALIZAR CUOTAS - REQUEST');
    console.log('========================================');

    console.log(
      '📦 PAYLOAD:',
      payload
    );

    console.log(
      '📋 PLAN:',
      payload.plan_curso_id
    );

    console.log(
      '📅 FECHA MATRÍCULA:',
      payload.fecha_matricula
    );

    console.log(
      '💰 MONTO TOTAL:',
      payload.monto_total
    );

    console.log(
      '💵 CUOTA INICIAL:',
      payload.cuota_inicial
    );

    console.log(
      '📆 MODALIDAD:',
      payload.modalidad_pago
    );

    console.log(
      '🚜 MÁQUINAS:',
      payload.maquinas_seleccionadas
    );

    console.log('========================================');
    console.log('⏳ Esperando respuesta del backend...');
    console.log('');

    // ========================================================
    // REQUEST
    // ========================================================

    this.matriculasService
      .previsualizarCuotas(payload)
      .subscribe({

        // ====================================================
        // SUCCESS
        // ====================================================

        next: (
          resp: ApiResponse<any>
        ) => {

          console.log('');
          console.log('========================================');
          console.log('📥 PREVISUALIZAR CUOTAS - RESPONSE');
          console.log('========================================');

          console.log(
            '📊 RESPUESTA COMPLETA:',
            resp
          );

          console.log(
            '✅ OK:',
            resp?.ok
          );

          console.log(
            '📦 DATA:',
            resp?.data
          );

          // ==================================================
          // VALIDAR RESPUESTA
          // ==================================================

          if (
            !resp ||
            !resp.ok ||
            !resp.data
          ) {

            console.error(
              '❌ El backend no devolvió información válida.'
            );

            this.previewCuotasLoading = false;

            this.previewCuotasError =
              'El backend no devolvió información para la previsualización.';

            this.cd.detectChanges();

            return;

          }

          // ==================================================
          // DATA BACKEND
          // ==================================================

          const data =
            resp.data as PrevisualizacionCuotasData;

          // ==================================================
          // EXTRAER CUOTAS
          // ==================================================

          let cuotas: CuotaCronograma[] = [];

          if (Array.isArray(data)) {

            cuotas =
              data as unknown as CuotaCronograma[];

          } else if (
            Array.isArray(
              (data as any).cuotas
            )
          ) {

            cuotas =
              (data as any).cuotas;

          }

          console.log(
            '📋 CUOTAS EXTRAÍDAS:',
            cuotas
          );

          console.log(
            '📏 CANTIDAD DE CUOTAS:',
            cuotas.length
          );

          // ==================================================
          // PRECIO
          // ==================================================

          if (
            (data as any).precio
          ) {

            this.previewPrecio =
              (data as any).precio;

            console.log(
              '💰 INFORMACIÓN DE PRECIO:',
              this.previewPrecio
            );

          }

          // ==================================================
          // PLAN
          // ==================================================

          if (
            (data as any).plan
          ) {

            this.previewPlan =
              (data as any).plan;

            console.log(
              '📚 INFORMACIÓN DEL PLAN:',
              this.previewPlan
            );

          }

          // ==================================================
          // MÁQUINAS
          // ==================================================

          if (
            Array.isArray(
              (data as any).maquinas
            )
          ) {

            this.previewMaquinas =
              (data as any).maquinas;

            console.log(
              '🚜 MÁQUINAS DEL BACKEND:',
              this.previewMaquinas
            );

          }

          // ==================================================
          // GUARDAR CUOTAS
          // ==================================================

          this.previewCuotas =
            cuotas;

          // ==================================================
          // SIN CUOTAS
          // ==================================================

          if (
            this.previewCuotas.length === 0
          ) {

            console.warn(
              '⚠️ El backend respondió correctamente, pero no hay cuotas.'
            );

            this.previewCuotasLoading = false;

            this.previewCuotasError =
              'No se pudieron generar cuotas para los datos seleccionados.';

            this.cd.detectChanges();

            console.log(
              '========================================'
            );

            return;

          }

          // ==================================================
          // MOSTRAR PREVISUALIZACIÓN
          // ==================================================

          this.previewCuotasLoading = false;

          this.previewCuotasOpen = true;

          this.cd.detectChanges();

          console.log(
            '✅ Previsualización lista para mostrar.'
          );

          console.log(
            '💰 TOTAL PREVISUALIZADO:',
            this.totalPreviewCuotas
          );

          console.log(
            '========================================'
          );

          console.log('');

        },

        // ====================================================
        // ERROR
        // ====================================================

        error: (err: any) => {

          console.error('');
          console.error('========================================');
          console.error('❌ PREVISUALIZAR CUOTAS - ERROR');
          console.error('========================================');

          console.error(
            'STATUS:',
            err?.status
          );

          console.error(
            'STATUS TEXT:',
            err?.statusText
          );

          console.error(
            'ERROR COMPLETO:',
            err
          );

          console.error(
            'ERROR BACKEND:',
            err?.error
          );

          console.error('========================================');

          this.previewCuotasLoading = false;

          this.previewCuotasError =
            err?.error?.message ||
            err?.error?.error ||
            'No se pudo generar la previsualización de cuotas.';

          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: this.previewCuotasError,
            confirmButtonText: 'Aceptar'
          });

          this.cd.detectChanges();

        }

      });

  }

  // ==========================================================
  // CERRAR PREVIEW
  // ==========================================================

  cerrarPreviewCuotas(): void {

    if (this.previewCuotasLoading) {
      return;
    }

    this.previewCuotasOpen = false;

    this.previewCuotas = [];

    this.previewCuotasError = '';

    this.previewMontoTotal = null;

    this.previewCuotaInicial = null;

    this.previewPrecio = null;

    this.previewPlan = null;

    this.previewMaquinas = [];

    this.cd.detectChanges();

  }

  // ==========================================================
  // CAMBIO MODALIDAD PAGO
  // ==========================================================

  onModalidadPagoChange(): void {

    this.previewCuotasOpen = false;

    this.previewCuotas = [];

    this.previewCuotasError = '';

    this.cd.detectChanges();

  }

  // ==========================================================
  // CAMBIO MONTO
  // ==========================================================

  onMontoPagoChange(): void {

    this.previewCuotasOpen = false;

    this.previewCuotas = [];

    this.previewCuotasError = '';

    this.cd.detectChanges();

  }

  // ==========================================================
  // CAMBIO CUOTA INICIAL
  // ==========================================================

  onCuotaInicialChange(): void {

    this.previewCuotasOpen = false;

    this.previewCuotas = [];

    this.previewCuotasError = '';

    this.cd.detectChanges();

  }

  // ==========================================================
  // FORMATEAR MONTO
  // ==========================================================

  formatMonto(
    valor: number | string | null | undefined
  ): string {

    const numero =
      Number(valor ?? 0);

    return numero.toLocaleString(
      'es-PE',
      {
        style: 'currency',
        currency: 'PEN',
        minimumFractionDigits: 2
      }
    );

  }

  // ==========================================================
  // NÚMERO CUOTA
  // ==========================================================

  getNumeroCuota(
    cuota: any,
    index: number
  ): number {

    return Number(
      cuota?.numero_cuota ??
      cuota?.nro_cuota ??
      cuota?.numero ??
      index + 1
    );

  }

  // ==========================================================
  // FECHA CUOTA
  // ==========================================================

  getFechaCuota(
    cuota: any
  ): string | null {

    return (
      cuota?.fecha_vencimiento ??
      cuota?.fecha_pago ??
      cuota?.fecha_programada ??
      cuota?.fecha ??
      null
    );

  }

  // ==========================================================
  // FECHA INPUT
  // ==========================================================

  getFechaCuotaInput(
    cuota: any
  ): string {

    const fecha =
      this.getFechaCuota(cuota);

    if (!fecha) {
      return '';
    }

    return fecha
      .split('T')[0];

  }

  // ==========================================================
  // EDITAR FECHA CUOTA
  // ==========================================================

  editarFechaCuota(
    cuota: any,
    nuevaFecha: string
  ): void {

    if (!nuevaFecha) {
      return;
    }

    if (
      cuota.fecha_vencimiento !== undefined
    ) {

      cuota.fecha_vencimiento =
        nuevaFecha;

    } else if (
      cuota.fecha_pago !== undefined
    ) {

      cuota.fecha_pago =
        nuevaFecha;

    } else if (
      cuota.fecha_programada !== undefined
    ) {

      cuota.fecha_programada =
        nuevaFecha;

    } else if (
      cuota.fecha !== undefined
    ) {

      cuota.fecha =
        nuevaFecha;

    } else {

      cuota.fecha_vencimiento =
        nuevaFecha;

    }

    this.cd.detectChanges();

  }

  // ==========================================================
  // MONTO CUOTA
  // ==========================================================

  getMontoCuota(
    cuota: any
  ): number {

    return Number(
      cuota?.monto ??
      cuota?.monto_cuota ??
      cuota?.importe ??
      cuota?.total ??
      0
    );

  }

  // ==========================================================
  // CERRAR MODAL
  // ==========================================================

  cerrarModal(): void {

    if (this.saving) {
      return;
    }

    this.modalOpen = false;

    this.cerrarPreviewCuotas();

    this.cd.detectChanges();

  }

  // ==========================================================
  // PAGINACIÓN
  // ==========================================================

  actualizarPaginacion(): void {

    this.totalPaginas =
      Math.ceil(
        this.matriculas.length /
        this.itemsPorPagina
      );

    if (
      this.totalPaginas < 1
    ) {

      this.totalPaginas = 1;

    }

    if (
      this.paginaActual >
      this.totalPaginas
    ) {

      this.paginaActual =
        this.totalPaginas;

    }

    const inicio =
      (
        this.paginaActual - 1
      ) *
      this.itemsPorPagina;

    const fin =
      inicio +
      this.itemsPorPagina;

    this.matriculasPaginadas =
      this.matriculas.slice(
        inicio,
        fin
      );

    this.cd.detectChanges();

  }

  cambiarPagina(
    pagina: number
  ): void {

    if (
      pagina < 1 ||
      pagina > this.totalPaginas
    ) {

      return;

    }

    this.paginaActual =
      pagina;

    this.actualizarPaginacion();

  }

  get paginas(): number[] {

    return Array.from(
      {
        length:
          this.totalPaginas
      },
      (_, i) =>
        i + 1
    );

  }

  // ==========================================================
  // ALUMNOS FILTRADOS
  // ==========================================================

  get alumnosFiltrados(): Alumno[] {

    if (
      !this.txtBusquedaAlumno
    ) {

      return this.alumnos;

    }

    const busqueda =
      this.txtBusquedaAlumno
        .toLowerCase()
        .trim();

    return this.alumnos.filter(
      (a) => {

        const nombres =
          a.nombres?.toLowerCase() ??
          '';

        const apellidos =
          a.apellidos?.toLowerCase() ??
          '';

        const dni =
          a.dni?.toString() ??
          '';

        const nombreCompleto =
          `${nombres} ${apellidos}`;

        return (
          nombres.includes(busqueda) ||
          apellidos.includes(busqueda) ||
          nombreCompleto.includes(busqueda) ||
          dni.includes(busqueda)
        );

      }
    );

  }

  // ==========================================================
  // EDITAR MATRÍCULA
  // ==========================================================

  abrirModalEditar(
    matricula: Matricula
  ): void {

    this.modoModal = 'editar';

    this.matriculaEditandoId =
      matricula.id;

    // ========================================================
    // FECHAS
    // ========================================================

    const fechaMatricula =
      matricula.fecha_matricula
        ? matricula.fecha_matricula
            .split('T')[0]
        : new Date()
            .toISOString()
            .slice(0, 10);

    const fechaInicio =
      matricula.fecha_inicio
        ? matricula.fecha_inicio
            .split('T')[0]
        : null;

    const fechaFin =
      matricula.fecha_fin_estimada
        ? matricula.fecha_fin_estimada
            .split('T')[0]
        : null;

    // ========================================================
    // FORMULARIO
    // ========================================================

    this.form = {

      alumno_id:
        matricula.alumno_id,

      plan_curso_id:
        matricula.plan_curso_id,

      estado_alumno_id:
        matricula.estado_alumno_id,

      fecha_matricula:
        fechaMatricula,

      fecha_inicio:
        fechaInicio,

      fecha_fin_estimada:
        fechaFin,

      notas:
        matricula.notas ||
        '',

      maquinas_seleccionadas:
        [],

      modalidad_pago:
        matricula.modalidad_pago ||
        'MENSUAL',

      monto_total:
        matricula.monto_total ??
        null,

      cuota_inicial:
        matricula.cuota_inicial ??
        null

    };

    this.modalOpen = true;

    this.cerrarPreviewCuotas();

    // ========================================================
    // CONFIGURAR SELECTOR
    // ========================================================

    this.actualizarSelectorMaquinas();

    // ========================================================
    // CARGAR MÁQUINAS DE MATRÍCULA
    // ========================================================

    this.matriculasService
      .listarMaquinas(matricula.id)
      .subscribe({

        next: (resp) => {

          this.maquinasSeleccionadas =
            (resp?.data ?? [])
              .filter(
                (m: any) =>
                  !m.es_regalo
              )
              .map(
                (m: any) =>
                  Number(m.maquina_id)
              )
              .filter(
                (id: number) =>
                  !Number.isNaN(id)
              );

          this.form.maquinas_seleccionadas =
            [
              ...this.maquinasSeleccionadas
            ];

          this.cd.detectChanges();

        },

        error: (err) => {

          console.error(
            'Error al cargar máquinas de matrícula:',
            err
          );

        }

      });

    this.cd.detectChanges();

  }

  // ==========================================================
  // VALIDAR FORMULARIO
  // ==========================================================

  validarFormulario(): string[] {

    const errores: string[] = [];

    if (
      !this.form.alumno_id
    ) {

      errores.push(
        'Debes seleccionar un alumno.'
      );

    }

    if (
      !this.form.plan_curso_id
    ) {

      errores.push(
        'Debes seleccionar un plan de curso.'
      );

    }

    if (
      !this.form.estado_alumno_id
    ) {

      errores.push(
        'Debes seleccionar un estado.'
      );

    }

    if (
      !this.form.fecha_matricula
    ) {

      errores.push(
        'La fecha de matrícula es obligatoria.'
      );

    }

    if (
      this.mostrarSelectorMaquinas &&
      this.maquinasSeleccionadas.length !==
      this.cantidadMaquinasRequeridas
    ) {

      errores.push(
        `Debes seleccionar exactamente ${this.cantidadMaquinasRequeridas} máquina(s).`
      );

    }
    if (
  this.form.costo_certificacion === null ||
  this.form.costo_certificacion === undefined ||
  Number(this.form.costo_certificacion) < 0
) {

  errores.push(
    'Debes indicar el costo de certificación.'
  );

}

    return errores;

  }

  // ==========================================================
  // GUARDAR MATRÍCULA
  // ==========================================================

  guardarMatricula(): void {

    const errores =
      this.validarFormulario();

    if (
      errores.length > 0
    ) {

      Swal.fire({

        icon: 'warning',

        title: 'Faltan datos',

        html:
          errores
            .map(
              (e) => `• ${e}`
            )
            .join('<br>'),

        confirmButtonText:
          'Entendido'

      });

      return;

    }

    // ========================================================
    // SINCRONIZAR MÁQUINAS
    // ========================================================

    this.form.maquinas_seleccionadas =
      [
        ...this.maquinasSeleccionadas
      ];

    // ========================================================
    // PAYLOAD
    // ========================================================

    const payload:
      MatriculaPayload = {

      alumno_id:
        this.form.alumno_id,

      plan_curso_id:
        this.form.plan_curso_id,

      estado_alumno_id:
        this.form.estado_alumno_id,

      fecha_matricula:
        this.form.fecha_matricula,

      fecha_inicio:
        this.form.fecha_inicio ||
        null,

      fecha_fin_estimada:
        this.form.fecha_fin_estimada ||
        null,

      notas:
        this.form.notas ||
        '',

      maquinas_seleccionadas:
        [
          ...this.maquinasSeleccionadas
        ],

      modalidad_pago:
        this.form.modalidad_pago ||
        'MENSUAL',

      monto_total:
        this.form.monto_total ??
        null,

      cuota_inicial:
        this.form.cuota_inicial ??
        null

    };

    // ========================================================
    // GUARDAR
    // ========================================================

    this.saving = true;

    this.cd.detectChanges();

    const request$ =
      this.modoModal === 'crear'
        ? this.matriculasService.crear(payload)
        : this.matriculasService.actualizar(
            this.matriculaEditandoId!,
            payload
          );

    request$.subscribe({

      next: (
        resp: ApiResponse<Matricula>
      ) => {

        const modo =
          this.modoModal;

        this.saving = false;

        this.modalOpen = false;

        this.cerrarPreviewCuotas();

        this.cd.detectChanges();

        Swal.fire({

          icon: 'success',

          title:
            modo === 'crear'
              ? 'Matrícula creada'
              : 'Matrícula actualizada',

          text:
            resp.message ||
            (
              modo === 'crear'
                ? 'La matrícula fue registrada correctamente.'
                : 'La matrícula fue actualizada correctamente.'
            ),

          confirmButtonText:
            'Aceptar'

        });

        this.cargarTodo();

      },

      error: (err: any) => {

        this.saving = false;

        this.cd.detectChanges();

        Swal.fire({

          icon: 'error',

          title: 'Error',

          text:
            err?.error?.message ||
            'No se pudo guardar la matrícula.',

          confirmButtonText:
            'Aceptar'

        });

      }

    });

  }

  // ==========================================================
  // CAMBIO DE PLAN
  // ==========================================================

  onPlanChange(): void {

    this.recalcularFechaFin();

    this.actualizarSelectorMaquinas();

    this.cerrarPreviewCuotas();

    this.cd.detectChanges();

  }

  // ==========================================================
  // CAMBIO FECHA INICIO
  // ==========================================================

  onFechaInicioChange(): void {

    this.recalcularFechaFin();

    this.cd.detectChanges();

  }

  // ==========================================================
  // RECALCULAR FECHA FIN
  // ==========================================================

  recalcularFechaFin(): void {

    if (
      !this.form.plan_curso_id ||
      !this.form.fecha_inicio
    ) {

      this.form.fecha_fin_estimada =
        null;

      return;

    }

    const plan =
      this.planesCurso.find(
        (p) =>
          Number(p.id) ===
          Number(this.form.plan_curso_id)
      );

    if (!plan) {

      this.form.fecha_fin_estimada =
        null;

      return;

    }

    const meses =
      this.getDuracionMesesPorTipo(
        plan.tipo_curso_codigo
      );

    if (!meses) {

      this.form.fecha_fin_estimada =
        null;

      return;

    }

    this.form.fecha_fin_estimada =
      this.calcularFechaFin(
        this.form.fecha_inicio,
        meses
      );

  }

  // ==========================================================
  // SELECTOR DE MÁQUINAS
  // ==========================================================

  actualizarSelectorMaquinas(): void {

    this.mostrarSelectorMaquinas =
      false;

    this.cantidadMaquinasRequeridas =
      0;

    this.maquinasDisponibles =
      [];

    /*
     * Al cambiar de plan se reinician las máquinas.
     */
    this.maquinasSeleccionadas =
      [];

    this.form.maquinas_seleccionadas =
      [];

    if (
      !this.form.plan_curso_id
    ) {

      this.cd.detectChanges();

      return;

    }

    const plan =
      this.planesCurso.find(
        (p) =>
          Number(p.id) ===
          Number(this.form.plan_curso_id)
      );

    if (!plan) {

      this.cd.detectChanges();

      return;

    }

    if (
      !plan.permite_eleccion_personalizada
    ) {

      this.cd.detectChanges();

      return;

    }

    this.mostrarSelectorMaquinas =
      true;

    this.cantidadMaquinasRequeridas =
      this.getCantidadMaquinasPorTipo(
        plan.tipo_curso_codigo
      );

    const maquinasOrdenadas =
      [...this.maquinas].sort(
        (a, b) =>
          (a.orden_visual ?? 999) -
          (b.orden_visual ?? 999)
      );

    this.maquinasDisponibles =
      this.esPlanMultipleConRegalo()
        ? maquinasOrdenadas.filter(
            (m) =>
              m.nombre !==
              'Camioneta'
          )
        : maquinasOrdenadas;

    this.cd.detectChanges();

  }

  // ==========================================================
  // CANTIDAD MÁQUINAS
  // ==========================================================

  getCantidadMaquinasPorTipo(
    tipoCursoCodigo: string
  ): number {

    switch (
      tipoCursoCodigo
    ) {

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

  // ==========================================================
  // TOGGLE MÁQUINA
  // ==========================================================

  toggleMaquina(
    maquinaId: number,
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    const id =
      Number(maquinaId);

    if (
      input.checked
    ) {

      if (
        this.maquinasSeleccionadas.length >=
        this.cantidadMaquinasRequeridas
      ) {

        input.checked = false;

        Swal.fire({

          icon: 'warning',

          title: 'Límite alcanzado',

          text:
            `Solo puedes seleccionar ${this.cantidadMaquinasRequeridas} máquina(s) para este plan.`,

          confirmButtonText:
            'Aceptar'

        });

        return;

      }

      if (
        !this.maquinasSeleccionadas
          .includes(id)
      ) {

        this.maquinasSeleccionadas.push(
          id
        );

      }

    } else {

      this.maquinasSeleccionadas =
        this.maquinasSeleccionadas.filter(
          (selectedId) =>
            Number(selectedId) !== id
        );

    }

    this.form.maquinas_seleccionadas =
      [
        ...this.maquinasSeleccionadas
      ];

    this.cerrarPreviewCuotas();

    this.cd.detectChanges();

  }

  // ==========================================================
  // MÁQUINA SELECCIONADA
  // ==========================================================

  isMaquinaSeleccionada(
    maquinaId: number
  ): boolean {

    return this.maquinasSeleccionadas
      .some(
        (id) =>
          Number(id) ===
          Number(maquinaId)
      );

  }

  // ==========================================================
  // DURACIÓN DEL PLAN
  // ==========================================================

  getDuracionMesesPorTipo(
    tipoCursoCodigo: string
  ): number {

    switch (
      tipoCursoCodigo
    ) {

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

  // ==========================================================
  // CALCULAR FECHA FIN
  // ==========================================================

  calcularFechaFin(
    fechaInicio: string,
    meses: number
  ): string {

    const [
      anioStr,
      mesStr,
      diaStr
    ] =
      fechaInicio.split('-');

    const anio =
      Number(anioStr);

    const mes =
      Number(mesStr);

    const dia =
      Number(diaStr);

    const fecha =
      new Date(
        anio,
        mes - 1,
        dia
      );

    if (
      Number.isNaN(
        fecha.getTime()
      )
    ) {

      return '';

    }

    fecha.setMonth(
      fecha.getMonth() +
      meses
    );

    const anioFinal =
      fecha.getFullYear();

    const mesFinal =
      String(
        fecha.getMonth() + 1
      ).padStart(2, '0');

    const diaFinal =
      String(
        fecha.getDate()
      ).padStart(2, '0');

    return `${anioFinal}-${mesFinal}-${diaFinal}`;

  }

  // ==========================================================
  // NOMBRE ALUMNO
  // ==========================================================

  getNombreAlumno(
    alumnoId: number
  ): string {

    const alumno =
      this.alumnos.find(
        (a) =>
          Number(a.id) ===
          Number(alumnoId)
      );

    return alumno
      ? `${alumno.nombres ?? ''} ${alumno.apellidos ?? ''}`.trim()
      : '-';

  }

  // ==========================================================
  // NOMBRE ESTADO
  // ==========================================================

  getNombreEstado(
    estadoId: number
  ): string {

    const estado =
      this.estadosAlumno.find(
        (e) =>
          Number(e.id) ===
          Number(estadoId)
      );

    return estado?.nombre ??
      '-';

  }

  // ==========================================================
  // NOMBRE PLAN
  // ==========================================================

  getNombrePlan(
    planId: number
  ): string {

    const plan =
      this.planesCurso.find(
        (p) =>
          Number(p.id) ===
          Number(planId)
      );

    return plan?.nombre ??
      '-';

  }

  // ==========================================================
  // TRACK BY
  // ==========================================================

  trackByMatriculaId(
    index: number,
    matricula: Matricula
  ): number {

    return matricula.id;

  }

  // ==========================================================
  // PLAN MULTIPLE
  // ==========================================================

  esPlanMultipleConRegalo(): boolean {

    const plan =
      this.planesCurso.find(
        (p) =>
          Number(p.id) ===
          Number(this.form.plan_curso_id)
      );

    if (!plan) {
      return false;
    }

    return (
      plan.tipo_curso_codigo ===
      'MULTIPLE'
    );

  }

  // ==========================================================
  // ESTADOS DISPONIBLES
  // ==========================================================

  get estadosMatriculaDisponibles():
    EstadoAlumno[] {

    const permitidos = [

      'MATRICULADO',
      'EGRESADO',
      'RETIRADO',
      'RESERVA'

    ];

    return this.estadosAlumno.filter(
      (e) =>
        permitidos.includes(
          e.codigo
        )
    );

  }

  // ==========================================================
  // FORMATO FECHA
  // ==========================================================

  formatFechaVista(
    fecha?: string | null
  ): string {

    if (!fecha) {
      return '-';
    }

    const soloFecha =
      fecha.split('T')[0];

    const partes =
      soloFecha.split('-');

    if (
      partes.length !== 3
    ) {

      return fecha;

    }

    const [
      anio,
      mes,
      dia
    ] = partes;

    return `${dia}/${mes}/${anio}`;

  }

  // ==========================================================
  // CLASE ESTADO
  // ==========================================================

  getClaseEstado(
    estadoId: number
  ): string {

    const estado =
      this.estadosAlumno.find(
        (e) =>
          Number(e.id) ===
          Number(estadoId)
      );

    switch (
      estado?.codigo
    ) {

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

  // ==========================================================
  // CAMBIAR ESTADO
  // ==========================================================

  cambiarEstadoMatricula(
    matricula: Matricula,
    codigoEstado:
      | 'RETIRADO'
      | 'EGRESADO'
      | 'RESERVA'
      | 'MATRICULADO'
  ): void {

    const nombreEstado =
      this.getNombreEstadoPorCodigo(
        codigoEstado
      );

    Swal.fire({

      icon: 'question',

      title: 'Confirmar cambio',

      text:
        `La matrícula pasará al estado ${nombreEstado}.`,

      showCancelButton: true,

      confirmButtonText:
        'Sí, continuar',

      cancelButtonText:
        'Cancelar'

    }).then(
      (result) => {

        if (
          !result.isConfirmed
        ) {

          return;

        }

        this.matriculasService
          .cambiarEstado(
            matricula.id,
            codigoEstado
          )
          .subscribe({

            next: (
              resp: ApiResponse<Matricula>
            ) => {

              Swal.fire({

                icon: 'success',

                title:
                  'Estado actualizado',

                text:
                  resp.message ||
                  'El estado de la matrícula fue actualizado.'

              });

              this.cargarTodo();

            },

            error: (err: any) => {

              Swal.fire({

                icon: 'error',

                title: 'Error',

                text:
                  err?.error?.message ||
                  'No se pudo cambiar el estado de la matrícula.'

              });

            }

          });

      }
    );

  }

  // ==========================================================
  // NOMBRE ESTADO POR CÓDIGO
  // ==========================================================

  getNombreEstadoPorCodigo(
    codigo: string
  ): string {

    return (

      this.estadosAlumno.find(
        (e) =>
          e.codigo === codigo
      )?.nombre ??

      codigo

    );

  }

  // ==========================================================
  // CÓDIGO ESTADO
  // ==========================================================

  getCodigoEstado(
    estadoId: number
  ): string {

    return (

      this.estadosAlumno.find(
        (e) =>
          Number(e.id) ===
          Number(estadoId)
      )?.codigo ??

      ''

    );

  }

  // ==========================================================
  // PERMISOS
  // ==========================================================

  puedeRetirar(
    estadoId: number
  ): boolean {

    return (
      this.getCodigoEstado(
        estadoId
      ) === 'MATRICULADO'
    );

  }

  puedeEgresar(
    estadoId: number
  ): boolean {

    return (
      this.getCodigoEstado(
        estadoId
      ) === 'MATRICULADO'
    );

  }

  puedeReservar(
    estadoId: number
  ): boolean {

    return (
      this.getCodigoEstado(
        estadoId
      ) === 'MATRICULADO'
    );

  }

  puedeActivarMatricula(
    estadoId: number
  ): boolean {

    const codigo =
      this.getCodigoEstado(
        estadoId
      );

    return [

      'RETIRADO',
      'RESERVA',
      'EGRESADO'

    ].includes(codigo);

  }

  // ==========================================================
  // VISTAS
  // ==========================================================

  esVistaActiva(): boolean {

    return (
      this.vistaActual ===
      'MATRICULADO'
    );

  }

  esVistaNoActiva(): boolean {

    return [

      'RETIRADO',
      'RESERVA',
      'EGRESADO'

    ].includes(
      this.vistaActual
    );

  }

  puedeEditar(): boolean {

    return (
      this.vistaActual ===
      'MATRICULADO'
    );

  }

  puedeVer(): boolean {

    return true;

  }

  puedeMostrarAccionesDeActiva(): boolean {

    return (
      this.vistaActual ===
      'MATRICULADO'
    );

  }

  puedeMostrarActivar(): boolean {

    return [

      'RETIRADO',
      'RESERVA',
      'EGRESADO'

    ].includes(
      this.vistaActual
    );

  }

  // ==========================================================
  // DESCARGAR CRONOGRAMA
  // ==========================================================

  descargarCronograma(
    matricula: Matricula
  ): void {

    console.log(
      'MATRÍCULA COMPLETA',
      matricula
    );

    this.matriculaPdfService
      .generarCronogramaPDF(

        matricula,

        this.getNombreAlumno(
          matricula.alumno_id
        ),

        this.getNombrePlan(
          matricula.plan_curso_id
        )

      );

  }

  // ==========================================================
  // BÚSQUEDA
  // ==========================================================

  buscar(): void {

    const texto =
      (
        this.search ||
        ''
      )
        .toLowerCase()
        .trim();

    let filtradas =
      [
        ...this.matriculasOriginal
      ];

    // ========================================================
    // TEXTO
    // ========================================================

    if (texto) {

      filtradas =
        filtradas.filter(
          (m) => {

            const alumno =
              this.getNombreAlumno(
                m.alumno_id
              )
                .toLowerCase();

            const alumnoData =
              this.alumnos.find(
                (a) =>
                  Number(a.id) ===
                  Number(m.alumno_id)
              );

            const dni =
              alumnoData?.dni
                ?.toString()
                .toLowerCase() ??
              '';

            return (
              alumno.includes(texto) ||
              dni.includes(texto)
            );

          }
        );

    }

    // ========================================================
    // AÑO
    // ========================================================

    if (
      this.anioFiltro !== null
    ) {

      filtradas =
        filtradas.filter(
          (m) => {

            if (
              !m.fecha_matricula
            ) {

              return false;

            }

            const fecha =
              m.fecha_matricula
                .split('T')[0];

            const anio =
              Number(
                fecha.split('-')[0]
              );

            return (
              anio ===
              this.anioFiltro
            );

          }
        );

    }

    // ========================================================
    // MES
    // ========================================================

    if (
      this.mesFiltro !== null
    ) {

      filtradas =
        filtradas.filter(
          (m) => {

            if (
              !m.fecha_matricula
            ) {

              return false;

            }

            const fecha =
              m.fecha_matricula
                .split('T')[0];

            const mes =
              Number(
                fecha.split('-')[1]
              );

            return (
              mes ===
              this.mesFiltro
            );

          }
        );

    }

    // ========================================================
    // ACTUALIZAR
    // ========================================================

    this.matriculas =
      filtradas;

    this.paginaActual = 1;

    this.actualizarPaginacion();

    this.cd.detectChanges();

  }

  // ==========================================================
  // LIMPIAR FILTROS
  // ==========================================================

  limpiarFiltros(): void {

    this.search = '';

    this.txtBusquedaAlumno = '';

    this.anioFiltro = null;

    this.mesFiltro = null;

    this.matriculas =
      [
        ...this.matriculasOriginal
      ];

    this.paginaActual = 1;

    this.actualizarPaginacion();

    this.cd.detectChanges();

  }

}
