
import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';

import { Subject } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  finalize
} from 'rxjs/operators';

import Swal from 'sweetalert2';

// ==========================================================
// MODELOS
// ==========================================================

import { Alumno } from '../../../alumnos/models/alumno.model';

import {
  Matricula,
  MatriculaPayload
} from '../../models/matricula.model';

import { EstadoAlumno } from '../../models/estado-alumno.model';
import { PlanCurso } from '../../models/plan-curso.model';
import { Maquina } from '../../models/maquina.model';

import { ApiResponse } from '../../../../core/models/api-response.model';

// ==========================================================
// SERVICIOS
// ==========================================================

import { AlumnosService } from '../../../alumnos/services/alumnos.service';
import { EstadosAlumnoService } from '../../services/estados-alumno.service';
import { PlanesCursoService } from '../../services/planes-curso.service';
import { MatriculasService } from '../../services/matriculas.service';
import { MaquinasService } from '../../services/maquinas.service';
import { MatriculaPdfService } from '../../services/matricula-pdf.service';

// ==========================================================
// COMPONENTE
// ==========================================================

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

  // ========================================================
  // INYECCIÓN DE SERVICIOS
  // ========================================================

  private alumnosService = inject(AlumnosService);
  private estadosAlumnoService = inject(EstadosAlumnoService);
  private planesCursoService = inject(PlanesCursoService);
  private matriculasService = inject(MatriculasService);
  private maquinasService = inject(MaquinasService);
  private matriculaPdfService = inject(MatriculaPdfService);

  private cd = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);

  private searchSubject = new Subject<string>();

  // ========================================================
  // VISTA
  // ========================================================

  vistaActual:
    'MATRICULADO' |
    'RETIRADO' |
    'RESERVA' |
    'EGRESADO' = 'MATRICULADO';

  tituloVista = 'Matrículas activas';

  // ========================================================
  // DATOS
  // ========================================================

  matriculas: Matricula[] = [];
  matriculasOriginal: Matricula[] = [];
  matriculasPaginadas: Matricula[] = [];

  alumnos: Alumno[] = [];
  estadosAlumno: EstadoAlumno[] = [];
  planesCurso: PlanCurso[] = [];
  maquinas: Maquina[] = [];

  // ========================================================
  // BÚSQUEDA Y FILTROS
  // ========================================================

  search = '';
  txtBusquedaAlumno = '';

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

  // ========================================================
  // PAGINACIÓN
  // ========================================================

  paginaActual = 1;
  itemsPorPagina = 10;
  totalPaginas = 1;

  // ========================================================
  // ESTADOS DE CARGA
  // ========================================================

  loading = false;
  cargado = false;
  errorMsg = '';

  // ========================================================
  // MODAL
  // ========================================================

  modalOpen = false;
  saving = false;

  modoModal: 'crear' | 'editar' = 'crear';
  matriculaEditandoId: number | null = null;

  // ========================================================
  // FORMULARIO
  // ========================================================

  form: MatriculaPayload = this.getEmptyForm();

  // ========================================================
  // MÁQUINAS
  // ========================================================

  mostrarSelectorMaquinas = false;
  cantidadMaquinasRequeridas = 0;

  maquinasDisponibles: Maquina[] = [];
  maquinasSeleccionadas: number[] = [];

  // ========================================================
  // PREVISUALIZACIÓN DE CUOTAS
  // ========================================================

  previewCuotasOpen = false;
  previewCuotasLoading = false;
  previewCuotasError = '';

  previewCuotas: any[] = [];

  previewMontoTotal: number | null = null;
  previewCuotaInicial: number | null = null;

  // ========================================================
  // CONSTRUCTOR
  // ========================================================

  constructor() {

    const anioActual = new Date().getFullYear();

    for (let i = anioActual + 1; i >= 2023; i--) {
      this.aniosDisponibles.push(i);
    }
  }

  // ========================================================
  // INIT
  // ========================================================

  ngOnInit(): void {

    this.vistaActual =
      this.route.snapshot.data['vista'] ?? 'MATRICULADO';

    this.tituloVista =
      this.route.snapshot.data['titulo'] ?? 'Matrículas';

    // ------------------------------------------------------
    // BÚSQUEDA CON DEBOUNCE
    // ------------------------------------------------------

    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe((texto) => {

        this.search = texto;

        this.paginaActual = 1;

        this.buscar();
      });

    // ------------------------------------------------------
    // CARGA INICIAL
    // ------------------------------------------------------

    this.cargarTodo();
  }

  // ========================================================
  // FORMULARIO VACÍO
  // ========================================================

  getEmptyForm(): MatriculaPayload {

    return {

      alumno_id: null,

      plan_curso_id: null,

      estado_alumno_id: null,

      fecha_matricula:
        new Date().toISOString().slice(0, 10),

      fecha_inicio: null,

      fecha_fin_estimada: null,

      notas: '',

      maquinas_seleccionadas: [],

      modalidad_pago: 'MENSUAL',

      monto_total: null,

      cuota_inicial: null
    };
  }

  // ========================================================
  // CARGAR DATOS
  // ========================================================

  cargarTodo(): void {

    this.loading = true;
    this.errorMsg = '';
    this.cargado = false;

    this.cd.detectChanges();

    // ------------------------------------------------------
    // ALUMNOS
    // ------------------------------------------------------

    this.alumnosService
      .listar('', true)
      .subscribe({

        next: (resp) => {

          this.alumnos = resp.data ?? [];

          this.cd.detectChanges();
        },

        error: (err) => {

          console.error(
            'Error al cargar alumnos:',
            err
          );

          this.cd.detectChanges();
        }
      });

    // ------------------------------------------------------
    // ESTADOS
    // ------------------------------------------------------

    this.estadosAlumnoService
      .listar()
      .subscribe({

        next: (resp) => {

          this.estadosAlumno =
            resp.data ?? [];

          this.cd.detectChanges();
        },

        error: (err) => {

          console.error(
            'Error al cargar estados:',
            err
          );

          this.cd.detectChanges();
        }
      });

    // ------------------------------------------------------
    // PLANES
    // ------------------------------------------------------

    this.planesCursoService
      .listar()
      .subscribe({

        next: (resp) => {

          this.planesCurso =
            resp.data ?? [];

          this.cd.detectChanges();
        },

        error: (err) => {

          console.error(
            'Error al cargar planes:',
            err
          );

          this.cd.detectChanges();
        }
      });

    // ------------------------------------------------------
    // MÁQUINAS
    // ------------------------------------------------------

    this.maquinasService
      .listar()
      .subscribe({

        next: (resp) => {

          this.maquinas =
            resp.data ?? [];

          this.cd.detectChanges();
        },

        error: (err) => {

          console.error(
            'Error al cargar máquinas:',
            err
          );

          this.cd.detectChanges();
        }
      });

    // ------------------------------------------------------
    // MATRÍCULAS
    // ------------------------------------------------------

    this.matriculasService
      .listar(
        this.vistaActual,
        this.search,
        this.anioFiltro,
        this.mesFiltro
      )
      .pipe(
        finalize(() => {

          this.loading = false;
          this.cargado = true;

          this.cd.detectChanges();
        })
      )
      .subscribe({

        next: (resp) => {

          this.matriculas =
            resp.data ?? [];

          this.matriculasOriginal =
            [...this.matriculas];

          this.paginaActual = 1;

          this.actualizarPaginacion();
        },

        error: (err) => {

          console.error(
            'Error al cargar matrículas:',
            err
          );

          this.errorMsg =
            'No se pudieron cargar las matrículas.';

          this.cd.detectChanges();
        }
      });
  }

  // ========================================================
  // MODAL CREAR
  // ========================================================

  abrirModalCrear(): void {

    this.modoModal = 'crear';

    this.matriculaEditandoId = null;

    this.form = this.getEmptyForm();

    this.modalOpen = true;

    this.txtBusquedaAlumno = '';

    this.mostrarSelectorMaquinas = false;

    this.cantidadMaquinasRequeridas = 0;

    this.maquinasDisponibles = [];

    this.maquinasSeleccionadas = [];

    this.previewCuotas = [];

    this.previewCuotasOpen = false;

    this.previewCuotasError = '';

    this.cd.detectChanges();
  }

  // ========================================================
  // CERRAR MODAL
  // ========================================================

  cerrarModal(): void {

    if (this.saving) {
      return;
    }

    this.modalOpen = false;

    this.previewCuotasOpen = false;

    this.previewCuotas = [];

    this.previewCuotasError = '';

    this.cd.detectChanges();
  }

  // ========================================================
  // BÚSQUEDA
  // ========================================================

  onSearchChange(): void {

    this.searchSubject.next(
      this.search || ''
    );
  }

  // ========================================================
  // ALUMNOS FILTRADOS PARA EL MODAL
  // ========================================================

  get alumnosFiltrados(): Alumno[] {

    if (!this.txtBusquedaAlumno?.trim()) {

      return this.alumnos;
    }

    const busqueda =
      this.txtBusquedaAlumno
        .toLowerCase()
        .trim();

    return this.alumnos.filter((alumno) => {

      const nombres =
        alumno.nombres?.toLowerCase() ?? '';

      const apellidos =
        alumno.apellidos?.toLowerCase() ?? '';

      const dni =
        alumno.dni?.toString() ?? '';

      return (
        nombres.includes(busqueda) ||
        apellidos.includes(busqueda) ||
        dni.includes(busqueda)
      );
    });
  }

  // ========================================================
  // PREVISUALIZAR CUOTAS
  // ========================================================

  previsualizarCuotas(): void {

    // ------------------------------------------------------
    // VALIDAR PLAN
    // ------------------------------------------------------

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

    // ------------------------------------------------------
    // VALIDAR FECHA
    // ------------------------------------------------------

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

    // ------------------------------------------------------
    // ESTADO DE CARGA
    // ------------------------------------------------------

    this.previewCuotasLoading = true;

    this.previewCuotasError = '';

    this.previewCuotas = [];

    this.previewCuotasOpen = false;

    // ------------------------------------------------------
    // PAYLOAD
    // ------------------------------------------------------

    const payload = {

      plan_curso_id:
        this.form.plan_curso_id,

      fecha_matricula:
        this.form.fecha_matricula,

      monto_total:
        this.form.monto_total,

      cuota_inicial:
        this.form.cuota_inicial,

      modalidad_pago:
        this.form.modalidad_pago
    };

    // ------------------------------------------------------
    // PETICIÓN
    // ------------------------------------------------------

    this.matriculasService
      .previsualizarCuotas(payload)
      .subscribe({

        next: (resp: ApiResponse<any>) => {

          this.previewCuotasLoading = false;

          this.previewCuotas =
            resp.data ?? [];

          // ------------------------------------------------
          // SIN RESULTADOS
          // ------------------------------------------------

          if (
            this.previewCuotas.length === 0
          ) {

            this.previewCuotasError =
              'No se pudieron generar cuotas para los datos seleccionados.';

            this.cd.detectChanges();

            return;
          }

          // ------------------------------------------------
          // MOSTRAR PREVIEW
          // ------------------------------------------------

          this.previewCuotasOpen = true;

          this.cd.detectChanges();
        },

        error: (err) => {

          this.previewCuotasLoading = false;

          this.previewCuotasError =
            err?.error?.message ||
            'No se pudo generar la previsualización de cuotas.';

          Swal.fire({

            icon: 'error',

            title: 'Error',

            text:
              this.previewCuotasError,

            confirmButtonText: 'Aceptar'
          });

          this.cd.detectChanges();
        }
      });
  }

  // ========================================================
  // CERRAR PREVISUALIZACIÓN
  // ========================================================

  cerrarPreviewCuotas(): void {

    if (this.previewCuotasLoading) {
      return;
    }

    this.previewCuotasOpen = false;

    this.previewCuotas = [];

    this.previewCuotasError = '';

    this.cd.detectChanges();
  }

  // ========================================================
  // CAMBIOS DE PAGO
  // ========================================================

  onModalidadPagoChange(): void {

    this.previewCuotasOpen = false;

    this.previewCuotas = [];

    this.previewCuotasError = '';

    this.cd.detectChanges();
  }

  onMontoPagoChange(): void {

    this.previewCuotasOpen = false;

    this.previewCuotas = [];

    this.previewCuotasError = '';

    this.cd.detectChanges();
  }

  // ========================================================
  // TOTAL PREVISUALIZADO
  // ========================================================

  get totalPreviewCuotas(): number {

    return this.previewCuotas.reduce(

      (total, cuota) =>

        total +
        Number(
          cuota.monto ??
          cuota.monto_cuota ??
          cuota.importe ??
          cuota.total ??
          0
        ),

      0
    );
  }

  // ========================================================
  // DATOS DE CUOTA
  // ========================================================

  getNumeroCuota(
    cuota: any,
    index: number
  ): number {

    return Number(

      cuota.numero_cuota ??
      cuota.nro_cuota ??
      cuota.numero ??
      index + 1

    );
  }

  getFechaCuota(
    cuota: any
  ): string | null {

    return (
      cuota.fecha_vencimiento ??
      cuota.fecha_pago ??
      cuota.fecha ??
      null
    );
  }

  getMontoCuota(
    cuota: any
  ): number {

    return Number(

      cuota.monto ??
      cuota.monto_cuota ??
      cuota.importe ??
      cuota.total ??
      0

    );
  }

  // ========================================================
  // FORMATEAR MONTO
  // ========================================================

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

  // ========================================================
  // PAGINACIÓN
  // ========================================================

  actualizarPaginacion(): void {

    this.totalPaginas = Math.max(
      1,
      Math.ceil(
        this.matriculas.length /
        this.itemsPorPagina
      )
    );

    if (
      this.paginaActual >
      this.totalPaginas
    ) {

      this.paginaActual =
        this.totalPaginas;
    }

    const inicio =
      (this.paginaActual - 1) *
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

      (_, i) => i + 1
    );
  }

  // ========================================================
  // EDITAR MATRÍCULA
  // ========================================================

  abrirModalEditar(
    matricula: Matricula
  ): void {

    this.modoModal = 'editar';

    this.matriculaEditandoId =
      matricula.id;

    this.form = {

      alumno_id:
        matricula.alumno_id,

      plan_curso_id:
        matricula.plan_curso_id,

      estado_alumno_id:
        matricula.estado_alumno_id,

      fecha_matricula:
        matricula.fecha_matricula
          ? matricula.fecha_matricula.split('T')[0]
          : new Date()
              .toISOString()
              .slice(0, 10),

      fecha_inicio:
        matricula.fecha_inicio
          ? matricula.fecha_inicio.split('T')[0]
          : null,

      fecha_fin_estimada:
        matricula.fecha_fin_estimada
          ? matricula.fecha_fin_estimada.split('T')[0]
          : null,

      notas:
        matricula.notas || '',

      maquinas_seleccionadas: [],

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

    this.actualizarSelectorMaquinas();

    this.recalcularFechaFin();

    // ------------------------------------------------------
    // CARGAR MÁQUINAS EXISTENTES
    // ------------------------------------------------------

    this.matriculasService
      .listarMaquinas(matricula.id)
      .subscribe({

        next: (resp) => {

          this.maquinasSeleccionadas =
            (resp.data ?? [])
              .filter(
                maquina =>
                  !maquina.es_regalo
              )
              .map(
                maquina =>
                  maquina.maquina_id
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
  }

  // ========================================================
  // VALIDAR FORMULARIO
  // ========================================================

  validarFormulario(): string[] {

    const errores: string[] = [];

    if (!this.form.alumno_id) {

      errores.push(
        'Debes seleccionar un alumno.'
      );
    }

    if (!this.form.plan_curso_id) {

      errores.push(
        'Debes seleccionar un plan de curso.'
      );
    }

    if (!this.form.estado_alumno_id) {

      errores.push(
        'Debes seleccionar un estado.'
      );
    }

    if (!this.form.fecha_matricula) {

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

    return errores;
  }

  // ========================================================
  // GUARDAR MATRÍCULA
  // ========================================================

  guardarMatricula(): void {

    const errores =
      this.validarFormulario();

    // ------------------------------------------------------
    // ERRORES
    // ------------------------------------------------------

    if (errores.length > 0) {

      Swal.fire({

        icon: 'warning',

        title: 'Faltan datos',

        html:
          errores
            .map(
              error =>
                `• ${error}`
            )
            .join('<br>'),

        confirmButtonText:
          'Entendido'
      });

      return;
    }

    // ------------------------------------------------------
    // PAYLOAD
    // ------------------------------------------------------

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
        this.form.notas || '',

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

    // ------------------------------------------------------
    // GUARDANDO
    // ------------------------------------------------------

    this.saving = true;

    this.cd.detectChanges();

    const request$ =

      this.modoModal === 'crear'

        ? this.matriculasService
            .crear(payload)

        : this.matriculasService
            .actualizar(
              this.matriculaEditandoId!,
              payload
            );

    request$.subscribe({

      next: (
        resp: ApiResponse<Matricula>
      ) => {

        this.saving = false;

        this.modalOpen = false;

        this.cd.detectChanges();

        Swal.fire({

          icon: 'success',

          title:
            this.modoModal === 'crear'
              ? 'Matrícula creada'
              : 'Matrícula actualizada',

          text:
            resp.message ||

            (
              this.modoModal === 'crear'

                ? 'La matrícula fue registrada correctamente.'

                : 'La matrícula fue actualizada correctamente.'
            ),

          confirmButtonText:
            'Aceptar'
        });

        this.cargarTodo();
      },

      error: (err) => {

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

  // ========================================================
  // CAMBIO DE PLAN
  // ========================================================

  onPlanChange(): void {

    this.recalcularFechaFin();

    this.actualizarSelectorMaquinas();

    // Cada cambio de plan invalida la preview anterior
    this.previewCuotasOpen = false;

    this.previewCuotas = [];

    this.previewCuotasError = '';

    this.cd.detectChanges();
  }

  // ========================================================
  // CAMBIO DE FECHA INICIO
  // ========================================================

  onFechaInicioChange(): void {

    this.recalcularFechaFin();

    this.cd.detectChanges();
  }

  // ========================================================
  // RECALCULAR FECHA FIN
  // ========================================================

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
        p =>
          p.id ===
          this.form.plan_curso_id
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

  // ========================================================
  // SELECTOR DE MÁQUINAS
  // ========================================================

  actualizarSelectorMaquinas(): void {

    this.mostrarSelectorMaquinas =
      false;

    this.cantidadMaquinasRequeridas =
      0;

    this.maquinasDisponibles =
      [];

    this.maquinasSeleccionadas =
      [];

    this.form.maquinas_seleccionadas =
      [];

    if (!this.form.plan_curso_id) {

      this.cd.detectChanges();

      return;
    }

    const plan =
      this.planesCurso.find(
        p =>
          p.id ===
          this.form.plan_curso_id
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
            maquina =>
              maquina.nombre !==
              'Camioneta'
          )

        : maquinasOrdenadas;

    this.cd.detectChanges();
  }

  // ========================================================
  // CANTIDAD DE MÁQUINAS
  // ========================================================

  getCantidadMaquinasPorTipo(
    tipoCursoCodigo: string
  ): number {

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

  // ========================================================
  // TOGGLE MÁQUINA
  // ========================================================

  toggleMaquina(
    maquinaId: number,
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    if (input.checked) {

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
        !this.maquinasSeleccionadas.includes(
          maquinaId
        )
      ) {

        this.maquinasSeleccionadas.push(
          maquinaId
        );
      }

    } else {

      this.maquinasSeleccionadas =
        this.maquinasSeleccionadas.filter(
          id =>
            id !== maquinaId
        );
    }

    this.form.maquinas_seleccionadas =
      [
        ...this.maquinasSeleccionadas
      ];

    this.cd.detectChanges();
  }

  // ========================================================
  // SABER SI MÁQUINA ESTÁ SELECCIONADA
  // ========================================================

  isMaquinaSeleccionada(
    maquinaId: number
  ): boolean {

    return this.maquinasSeleccionadas.includes(
      maquinaId
    );
  }

  // ========================================================
  // DURACIÓN DEL CURSO
  // ========================================================

  getDuracionMesesPorTipo(
    tipoCursoCodigo: string
  ): number {

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

  // ========================================================
  // CALCULAR FECHA FIN
  // ========================================================

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

    return (
      `${anioFinal}-${mesFinal}-${diaFinal}`
    );
  }

  // ========================================================
  // DATOS AUXILIARES
  // ========================================================

  getNombreAlumno(
    alumnoId: number
  ): string {

    const alumno =
      this.alumnos.find(
        a =>
          a.id === alumnoId
      );

    return alumno
      ? `${alumno.nombres} ${alumno.apellidos}`
      : '-';
  }

  getNombreEstado(
    estadoId: number
  ): string {

    const estado =
      this.estadosAlumno.find(
        e =>
          e.id === estadoId
      );

    return estado?.nombre ?? '-';
  }

  getNombrePlan(
    planId: number
  ): string {

    const plan =
      this.planesCurso.find(
        p =>
          p.id === planId
      );

    return plan?.nombre ?? '-';
  }

  // ========================================================
  // TRACK BY
  // ========================================================

  trackByMatriculaId(
    index: number,
    matricula: Matricula
  ): number {

    return matricula.id;
  }

  // ========================================================
  // PLAN MÚLTIPLE
  // ========================================================

  esPlanMultipleConRegalo(): boolean {

    const plan =
      this.planesCurso.find(
        p =>
          p.id ===
          this.form.plan_curso_id
      );

    if (!plan) {
      return false;
    }

    return (
      plan.tipo_curso_codigo ===
      'MULTIPLE'
    );
  }

  // ========================================================
  // ESTADOS DISPONIBLES
  // ========================================================

  get estadosMatriculaDisponibles():
    EstadoAlumno[] {

    const permitidos = [

      'MATRICULADO',

      'EGRESADO',

      'RETIRADO',

      'RESERVA'

    ];

    return this.estadosAlumno.filter(
      estado =>
        permitidos.includes(
          estado.codigo
        )
    );
  }

  // ========================================================
  // FORMATEAR FECHA
  // ========================================================

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

  // ========================================================
  // CLASE ESTADO
  // ========================================================

  getClaseEstado(
    estadoId: number
  ): string {

    const estado =
      this.estadosAlumno.find(
        e =>
          e.id === estadoId
      );

    switch (estado?.codigo) {

      case 'MATRICULADO':

        return (
          'estado-badge estado-badge--matriculado'
        );

      case 'EGRESADO':

        return (
          'estado-badge estado-badge--egresado'
        );

      case 'RETIRADO':

        return (
          'estado-badge estado-badge--retirado'
        );

      case 'RESERVA':

        return (
          'estado-badge estado-badge--reserva'
        );

      default:

        return 'estado-badge';
    }
  }

  // ========================================================
  // CAMBIAR ESTADO
  // ========================================================

  cambiarEstadoMatricula(

    matricula: Matricula,

    codigoEstado:
      'RETIRADO' |
      'EGRESADO' |
      'RESERVA' |
      'MATRICULADO'

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
    })
    .then((result) => {

      if (!result.isConfirmed) {
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

          error: (err) => {

            Swal.fire({

              icon: 'error',

              title: 'Error',

              text:
                err?.error?.message ||
                'No se pudo cambiar el estado de la matrícula.'
            });
          }
        });
    });
  }

  // ========================================================
  // NOMBRE DEL ESTADO
  // ========================================================

  getNombreEstadoPorCodigo(
    codigo: string
  ): string {

    return (
      this.estadosAlumno.find(
        estado =>
          estado.codigo === codigo
      )?.nombre ??
      codigo
    );
  }

  // ========================================================
  // PERMISOS DE ESTADO
  // ========================================================

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

  getCodigoEstado(
    estadoId: number
  ): string {

    return (
      this.estadosAlumno.find(
        estado =>
          estado.id === estadoId
      )?.codigo ?? ''
    );
  }

  // ========================================================
  // PERMISOS SEGÚN VISTA
  // ========================================================

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

  // ========================================================
  // DESCARGAR CRONOGRAMA
  // ========================================================

  descargarCronograma(
    matricula: Matricula
  ): void {

    console.log(
      'MATRICULA COMPLETA',
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

  // ========================================================
  // BUSCAR / FILTRAR
  // ========================================================

  buscar(): void {

    const texto =
      (this.search || '')
        .toLowerCase()
        .trim();

    let filtradas =
      [...this.matriculasOriginal];

    // ------------------------------------------------------
    // TEXTO
    // ------------------------------------------------------

    if (texto) {

      filtradas =
        filtradas.filter(
          matricula => {

            const alumno =
              this.getNombreAlumno(
                matricula.alumno_id
              ).toLowerCase();

            return alumno.includes(
              texto
            );
          }
        );
    }

    // ------------------------------------------------------
    // AÑO
    // ------------------------------------------------------

    if (
      this.anioFiltro !== null
    ) {

      filtradas =
        filtradas.filter(
          matricula => {

            if (
              !matricula.fecha_matricula
            ) {

              return false;
            }

            const fecha =
              matricula.fecha_matricula
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

    // ------------------------------------------------------
    // MES
    // ------------------------------------------------------

    if (
      this.mesFiltro !== null
    ) {

      filtradas =
        filtradas.filter(
          matricula => {

            if (
              !matricula.fecha_matricula
            ) {

              return false;
            }

            const fecha =
              matricula.fecha_matricula
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

    // ------------------------------------------------------
    // ACTUALIZAR RESULTADO
    // ------------------------------------------------------

    this.matriculas =
      filtradas;

    this.paginaActual = 1;

    this.actualizarPaginacion();

    this.cd.detectChanges();
  }

  // ========================================================
  // LIMPIAR FILTROS
  // ========================================================

  limpiarFiltros(): void {

    this.search = '';

    this.anioFiltro = null;

    this.mesFiltro = null;

    this.paginaActual = 1;

    this.matriculas =
      [
        ...this.matriculasOriginal
      ];

    this.actualizarPaginacion();

    this.cd.detectChanges();
  }
}
