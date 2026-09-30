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
  PrevisualizacionCuotasData,
  MatriculaAceleradaPayload,
  MaquinaMatriculaAceleradaPayload,
  CuotaMatriculaAceleradaPayload
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


// ==========================================================
// TIPOS LOCALES PARA PREVISUALIZACIÓN NORMAL
// ==========================================================

interface CuotaCronograma {

  numero_cuota?: number;

  nro_cuota?: number;

  numero?: number;

  fecha_programada?: string;

  fecha_vencimiento?: string;

  fecha_pago?: string;

  fecha?: string;

  monto?: number;

  monto_cuota?: number;

  importe?: number;

  total?: number;

  [key: string]: any;

}


interface CuotaCronogramaPayload {

  numero_cuota?: number;

  fecha_programada?: string;

  fecha_vencimiento?: string;

  monto?: number;

  [key: string]: any;

}


// ==========================================================
// MODELO LOCAL PARA MÁQUINA ACELERADA
// ==========================================================

interface MaquinaAceleradaForm {

  maquina_id: number;

  orden: number;

  es_regalo: boolean;

  horas_asignadas: number | null;

  sesiones_totales: number | null;

}


// ==========================================================
// MODELO LOCAL PARA CUOTA ACELERADA
// ==========================================================

interface CuotaAceleradaForm {

  numero_cuota: number;

  fecha_programada: string;

  fecha_vencimiento: string;

  monto: number | null;

}


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

  private alumnosService =
    inject(AlumnosService);

  private estadosAlumnoService =
    inject(EstadosAlumnoService);

  private planesCursoService =
    inject(PlanesCursoService);

  private matriculasService =
    inject(MatriculasService);

  private maquinasService =
    inject(MaquinasService);

  private matriculaPdfService =
    inject(MatriculaPdfService);

  private cd =
    inject(ChangeDetectorRef);

  private route =
    inject(ActivatedRoute);

  private searchSubject =
    new Subject<string>();


  // ==========================================================
  // VISTA
  // ==========================================================

  vistaActual:
    | 'MATRICULADO'
    | 'RETIRADO'
    | 'RESERVA'
    | 'EGRESADO' = 'MATRICULADO';

  tituloVista =
    'Matrículas activas';


  // ==========================================================
  // MATRÍCULAS
  // ==========================================================

  matriculas: Matricula[] = [];

  matriculasOriginal: Matricula[] = [];

  matriculasPaginadas: Matricula[] = [];

  nombreFiltro = '';


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
  // ESTADOS
  // ==========================================================

  loading = false;

  saving = false;

  errorMsg = '';

  cargado = false;


  // ==========================================================
  // MODAL
  // ==========================================================

  modalOpen = false;

  get mostrarModal(): boolean {
    return this.modalOpen;
  }


  modoModal:
    | 'crear'
    | 'editar'
    | 'crear-acelerada' = 'crear';


  matriculaEditandoId:
    number | null = null;


  // ==========================================================
  // TIPO DE MATRÍCULA
  // ==========================================================

  tipoMatricula:
    'ORDINARIA' |
    'ACELERADA' = 'ORDINARIA';


  // ==========================================================
  // FORMULARIO NORMAL
  // ==========================================================

  form: MatriculaPayload =
    this.getEmptyForm();


  // ==========================================================
  // FORMULARIO ACELERADO
  // ==========================================================

  formAcelerada:
    MatriculaAceleradaPayload =
    this.getEmptyFormAcelerada();


  // ==========================================================
  // MÁQUINAS ACELERADAS
  // ==========================================================

  maquinasAceleradas:
    MaquinaAceleradaForm[] = [];


  // ==========================================================
  // CUOTAS ACELERADAS
  // ==========================================================

  cuotasAceleradas:
    CuotaAceleradaForm[] = [];


  // ==========================================================
  // SELECTOR NORMAL
  // ==========================================================

  mostrarSelectorMaquinas = false;

  cantidadMaquinasRequeridas = 0;


  // ==========================================================
  // PREVISUALIZACIÓN
  // ==========================================================

  previewCuotasOpen = false;

  previewCuotasLoading = false;

  previewCuotasError = '';

  cronogramaConfirmado:
    CuotaCronogramaPayload[] = [];

  previewCuotas:
    CuotaCronograma[] = [];

  previewMontoTotal:
    number | null = null;

  previewCuotaInicial:
    number | null = null;

  previewPrecio: any = null;

  previewPlan: any = null;

  previewMaquinas: any[] = [];


  // ==========================================================
  // COMPATIBILIDAD HTML
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
  // TOTAL PREVIEW NORMAL
  // ==========================================================

  get totalPreviewCuotas(): number {

    return this.previewCuotas.reduce(
      (total, cuota) =>
        total + this.getMontoCuota(cuota),
      0
    );

  }


  // ==========================================================
  // TOTAL CUOTAS ACELERADA
  // ==========================================================

  get totalCuotasAceleradas(): number {

    return this.formAcelerada.pago.cuotas.reduce(
      (total, cuota) =>
        total + Number(cuota.monto ?? 0),
      0
    );

  }


  // ==========================================================
  // TOTAL ACELERADA
  // ==========================================================

  get totalAcelerada(): number {

    return (
      Number(
        this.formAcelerada.pago.monto_matricula ?? 0
      ) +

      this.totalCuotasAceleradas +

      Number(
        this.formAcelerada.pago.monto_certificacion ?? 0
      )
    );

  }


  // ==========================================================
  // CONSTRUCTOR
  // ==========================================================

  constructor() {

    const anioActual =
      new Date().getFullYear();

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


    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(
        (texto: string) => {

          this.search = texto;

          this.paginaActual = 1;

          this.buscar();

        }
      );


    this.cargarTodo();

  }


  // ==========================================================
  // FORMULARIO NORMAL VACÍO
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

      certificacionIncluida: true,

      costo_certificacion: null

    };

  }


  // ==========================================================
  // FORMULARIO ACELERADO VACÍO
  // ==========================================================

  getEmptyFormAcelerada():
    MatriculaAceleradaPayload {

    const hoy =
      new Date()
        .toISOString()
        .slice(0, 10);

    return {

      alumno_id: null,

      nombre_curso_manual: '',

      estado_alumno_id: null,

      fecha_matricula: hoy,

      fecha_inicio: hoy,

      fecha_fin_estimada: null,

      notas: '',

      maquinas: [],

      pago: {

        monto_matricula: 0,

        fecha_matricula: hoy,

        monto_certificacion: 0,

        fecha_certificacion: null,

        cuotas: []

      }

    };

  }


  // ==========================================================
  // CAMBIAR TIPO DE MATRÍCULA
  // ==========================================================

  cambiarTipoMatricula(
    tipo:
      'ORDINARIA' |
      'ACELERADA'
  ): void {

    this.tipoMatricula =
      tipo;


    if (
      tipo === 'ORDINARIA'
    ) {

      this.modoModal =
        'crear';

      this.form =
        this.getEmptyForm();

      this.formAcelerada =
        this.getEmptyFormAcelerada();

      this.maquinasAceleradas =
        [];

      this.cuotasAceleradas =
        [];

      this.maquinasSeleccionadas =
        [];

      this.cerrarPreviewCuotas();

    } else {

      this.modoModal =
        'crear-acelerada';

      this.form =
        this.getEmptyForm();

      this.formAcelerada =
        this.getEmptyFormAcelerada();

      this.maquinasAceleradas =
        [];

      this.cuotasAceleradas =
        [];

      this.maquinasSeleccionadas =
        [];

      this.maquinasDisponibles =
        [...this.maquinas].sort(
          (a, b) =>
            (a.orden_visual ?? 999) -
            (b.orden_visual ?? 999)
        );

      this.cerrarPreviewCuotas();

    }


    this.cd.detectChanges();

  }


  // ==========================================================
  // ¿ES ACELERADA?
  // ==========================================================

  esMatriculaAcelerada(): boolean {

    return (
      this.tipoMatricula ===
      'ACELERADA' ||
      this.modoModal ===
      'crear-acelerada'
    );

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

          this.alumnos =
            resp.alumnos?.data ?? [];

          this.estadosAlumno =
            resp.estados?.data ?? [];

          this.planesCurso =
            resp.planes?.data ?? [];

          this.maquinas =
            resp.maquinas?.data ?? [];

          this.matriculas =
            resp.matriculas?.data ?? [];

          this.matriculasOriginal =
            [...this.matriculas];

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

    this.tipoMatricula =
      'ORDINARIA';

    this.modoModal =
      'crear';

    this.matriculaEditandoId =
      null;

    this.form =
      this.getEmptyForm();

    this.formAcelerada =
      this.getEmptyFormAcelerada();

    this.maquinasAceleradas =
      [];

    this.cuotasAceleradas =
      [];

    this.modalOpen =
      true;

    this.txtBusquedaAlumno =
      '';

    this.mostrarSelectorMaquinas =
      false;

    this.cantidadMaquinasRequeridas =
      0;

    this.maquinasDisponibles =
      [];

    this.maquinasSeleccionadas =
      [];

    this.cerrarPreviewCuotas();

    this.cd.detectChanges();

  }


  // ==========================================================
  // ABRIR MODAL ACELERADA
  // ==========================================================

  abrirModalCrearAcelerada(): void {

    this.tipoMatricula =
      'ACELERADA';

    this.modoModal =
      'crear-acelerada';

    this.matriculaEditandoId =
      null;

    this.form =
      this.getEmptyForm();

    this.formAcelerada =
      this.getEmptyFormAcelerada();

    this.maquinasAceleradas =
      [];

    this.cuotasAceleradas =
      [];

    this.modalOpen =
      true;

    this.txtBusquedaAlumno =
      '';

    this.maquinasSeleccionadas =
      [];

    this.maquinasDisponibles =
      [...this.maquinas].sort(
        (a, b) =>
          (a.orden_visual ?? 999) -
          (b.orden_visual ?? 999)
      );

    this.mostrarSelectorMaquinas =
      false;

    this.cantidadMaquinasRequeridas =
      0;

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


  filtrarAlumnos(): void {

    this.cd.detectChanges();

  }


  // ==========================================================
  // CAMBIO ALUMNO ACELERADA
  // ==========================================================

  onAlumnoChangeAcelerada(): void {

    if (
      this.formAcelerada.alumno_id
    ) {

      this.formAcelerada.alumno_id =
        Number(
          this.formAcelerada.alumno_id
        );

    }

    this.cd.detectChanges();

  }


  seleccionarAlumnoAcelerada(
    alumnoId: number
  ): void {

    this.formAcelerada.alumno_id =
      Number(alumnoId);

    this.onAlumnoChangeAcelerada();

  }


  // ==========================================================
  // AGREGAR MÁQUINA ACELERADA
  // ==========================================================

  agregarMaquinaAcelerada(
    maquinaId?: number
  ): void {

    // --------------------------------------------------------
    // Si el HTML no envía ID, simplemente agrega una fila.
    // --------------------------------------------------------

    if (
      maquinaId === undefined ||
      maquinaId === null ||
      Number(maquinaId) === 0
    ) {

      this.maquinasAceleradas.push({

        maquina_id: 0,

        orden:
          this.maquinasAceleradas.length + 1,

        es_regalo: false,

        horas_asignadas: null,

        sesiones_totales: null

      });

      this.sincronizarMaquinasAceleradas();

      this.cd.detectChanges();

      return;

    }


    const id =
      Number(maquinaId);


    if (
      !id ||
      Number.isNaN(id)
    ) {

      return;

    }


    if (
      this.maquinaAceleradaYaSeleccionada(
        id,
        -1
      )
    ) {

      Swal.fire({

        icon: 'warning',

        title: 'Máquina repetida',

        text:
          'Esta máquina ya fue seleccionada.',

        confirmButtonText:
          'Aceptar'

      });

      return;

    }


    const maquina =
      this.maquinas.find(
        m =>
          Number(m.id) === id
      );


    if (!maquina) {

      return;

    }


    this.maquinasAceleradas.push({

      maquina_id: id,

      orden:
        this.maquinasAceleradas.length + 1,

      es_regalo: false,

      horas_asignadas: null,

      sesiones_totales: null

    });


    this.sincronizarMaquinasAceleradas();

    this.cd.detectChanges();

  }


  // ==========================================================
  // CAMBIO DE MÁQUINA ACELERADA
  // ==========================================================

  onMaquinaAceleradaChange(
    index: number
  ): void {

    const maquina =
      this.maquinasAceleradas[index];


    if (!maquina) {

      return;

    }


    if (
      !maquina.maquina_id
    ) {

      this.sincronizarMaquinasAceleradas();

      return;

    }


    const repetida =
      this.maquinasAceleradas.some(
        (otra, i) =>
          i !== index &&
          Number(
            otra.maquina_id
          ) === Number(
            maquina.maquina_id
          ) &&
          Number(
            maquina.maquina_id
          ) !== 0
      );


    if (repetida) {

      Swal.fire({

        icon: 'warning',

        title: 'Máquina repetida',

        text:
          'No puedes seleccionar la misma máquina más de una vez.',

        confirmButtonText:
          'Aceptar'

      });


      maquina.maquina_id =
        0;

    }


    this.sincronizarMaquinasAceleradas();

    this.cd.detectChanges();

  }


  // ==========================================================
  // VERIFICAR MÁQUINA REPETIDA
  // ==========================================================

  maquinaAceleradaYaSeleccionada(
    maquinaId: number,
    index: number
  ): boolean {

    return this.maquinasAceleradas.some(
      (maquina, i) =>
        i !== index &&
        Number(
          maquina.maquina_id
        ) === Number(maquinaId) &&
        Number(maquinaId) !== 0
    );

  }


  // ==========================================================
  // SINCRONIZAR MÁQUINAS
  // ==========================================================

  private sincronizarMaquinasAceleradas(): void {

    this.formAcelerada.maquinas =
      this.maquinasAceleradas.map(
        (maquina) => ({

          maquina_id:
            Number(
              maquina.maquina_id
            ),

          orden:
            Number(
              maquina.orden
            ),

          es_regalo:
            Boolean(
              maquina.es_regalo
            ),

          horas_asignadas:
            Number(
              maquina.horas_asignadas ?? 0
            ),

          sesiones_totales:
            Number(
              maquina.sesiones_totales ?? 0
            )

        })
      );

  }


  // ==========================================================
  // ELIMINAR MÁQUINA ACELERADA
  // ==========================================================

  eliminarMaquinaAcelerada(
    index: number
  ): void {

    this.maquinasAceleradas.splice(
      index,
      1
    );

    this.reordenarMaquinasAceleradas();

    this.sincronizarMaquinasAceleradas();

    this.cd.detectChanges();

  }


  // ==========================================================
  // ALIAS ANTIGUO
  // ==========================================================

  quitarMaquinaAcelerada(
    index: number
  ): void {

    this.eliminarMaquinaAcelerada(
      index
    );

  }


  // ==========================================================
  // REORDENAR MÁQUINAS
  // ==========================================================

  reordenarMaquinasAceleradas(): void {

    this.maquinasAceleradas =
      this.maquinasAceleradas.map(
        (maquina, index) => ({

          ...maquina,

          orden:
            index + 1

        })
      );


    this.sincronizarMaquinasAceleradas();

  }


  // ==========================================================
  // AGREGAR CUOTA ACELERADA
  // ==========================================================

  agregarCuotaAcelerada(): void {

    const cuotas =
      this.formAcelerada.pago.cuotas;


    const numero =
      cuotas.length + 1;


    const ultima =
      cuotas[
        cuotas.length - 1
      ];


    let fecha =
      ultima?.fecha_vencimiento ??
      this.formAcelerada.fecha_inicio ??
      this.formAcelerada.fecha_matricula;


    if (fecha) {

      fecha =
        this.sumarMes(
          fecha,
          1
        );

    }


    const cuota:
      CuotaMatriculaAceleradaPayload = {

      numero_cuota:
        numero,

      fecha_programada:
        fecha,

      fecha_vencimiento:
        fecha,

      monto:
        0

    };


    cuotas.push(
      cuota
    );


    this.cuotasAceleradas =
      cuotas.map(
        (item) => ({

          numero_cuota:
            item.numero_cuota,

          fecha_programada:
            item.fecha_programada,

          fecha_vencimiento:
            item.fecha_vencimiento,

          monto:
            item.monto

        })
      );


    this.cd.detectChanges();

  }


  // ==========================================================
  // ELIMINAR CUOTA ACELERADA
  // ==========================================================

  eliminarCuotaAcelerada(
    index: number
  ): void {

    this.formAcelerada.pago.cuotas.splice(
      index,
      1
    );

    this.reordenarCuotasAceleradas();

    this.cd.detectChanges();

  }


  // ==========================================================
  // REORDENAR CUOTAS
  // ==========================================================

  reordenarCuotasAceleradas(): void {

    this.formAcelerada.pago.cuotas =
      this.formAcelerada.pago.cuotas.map(
        (cuota, index) => ({

          ...cuota,

          numero_cuota:
            index + 1

        })
      );


    this.cuotasAceleradas =
      this.formAcelerada.pago.cuotas.map(
        (cuota) => ({

          numero_cuota:
            cuota.numero_cuota,

          fecha_programada:
            cuota.fecha_programada,

          fecha_vencimiento:
            cuota.fecha_vencimiento,

          monto:
            cuota.monto

        })
      );

  }


  // ==========================================================
  // RECALCULAR TOTAL ACELERADA
  // ==========================================================

  recalcularTotalAcelerada(): void {

    this.cd.detectChanges();

  }


  // ==========================================================
  // SUMAR MES
  // ==========================================================

  sumarMes(
    fechaTexto: string,
    cantidad: number
  ): string {

    const partes =
      fechaTexto
        .split('-')
        .map(Number);


    if (
      partes.length !== 3
    ) {

      return fechaTexto;

    }


    const fecha =
      new Date(
        partes[0],
        partes[1] - 1,
        partes[2]
      );


    fecha.setMonth(
      fecha.getMonth() +
      cantidad
    );


    return `${fecha.getFullYear()}-${String(
      fecha.getMonth() + 1
    ).padStart(2, '0')}-${String(
      fecha.getDate()
    ).padStart(2, '0')}`;

  }


  // ==========================================================
  // VALIDAR ACELERADA
  // ==========================================================

  validarFormularioAcelerada(): string[] {

    const errores: string[] = [];


    if (
      !this.formAcelerada.alumno_id
    ) {

      errores.push(
        'Debes seleccionar un alumno.'
      );

    }


    if (
      !this.formAcelerada
        .nombre_curso_manual
        ?.trim()
    ) {

      errores.push(
        'Debes ingresar el nombre del curso acelerado.'
      );

    }


    if (
      !this.formAcelerada.estado_alumno_id
    ) {

      errores.push(
        'Debes seleccionar un estado.'
      );

    }


    if (
      !this.formAcelerada.fecha_matricula
    ) {

      errores.push(
        'La fecha de matrícula es obligatoria.'
      );

    }


    if (
      !this.formAcelerada.fecha_inicio
    ) {

      errores.push(
        'La fecha de inicio es obligatoria.'
      );

    }


    // ========================================================
    // MÁQUINAS
    // ========================================================

    if (
      this.maquinasAceleradas.length === 0
    ) {

      errores.push(
        'Debes agregar al menos una máquina.'
      );

    }


    this.maquinasAceleradas.forEach(
      (maquina, index) => {

        if (
          !maquina.maquina_id ||
          Number(
            maquina.maquina_id
          ) <= 0
        ) {

          errores.push(
            `Debes seleccionar una máquina en la fila ${index + 1}.`
          );

        }


        if (
          maquina.horas_asignadas === null ||
          Number(
            maquina.horas_asignadas
          ) <= 0
        ) {

          errores.push(
            `La máquina ${index + 1} debe tener horas asignadas válidas.`
          );

        }


        if (
          maquina.sesiones_totales === null ||
          !Number.isInteger(
            Number(
              maquina.sesiones_totales
            )
          ) ||
          Number(
            maquina.sesiones_totales
          ) <= 0
        ) {

          errores.push(
            `La máquina ${index + 1} debe tener sesiones totales válidas.`
          );

        }

      }
    );


    // ========================================================
    // MATRÍCULA
    // ========================================================

    const montoMatricula =
      Number(
        this.formAcelerada
          .pago
          .monto_matricula ?? 0
      );


    if (
      !Number.isFinite(
        montoMatricula
      ) ||
      montoMatricula < 0
    ) {

      errores.push(
        'El monto de matrícula no puede ser negativo.'
      );

    }


    if (
      montoMatricula > 0 &&
      !this.formAcelerada
        .pago
        .fecha_matricula
    ) {

      errores.push(
        'Debes indicar la fecha del pago de matrícula.'
      );

    }


    // ========================================================
    // CUOTAS
    // ========================================================

    const cuotas =
      this.formAcelerada
        .pago
        .cuotas;


    if (
      cuotas.length === 0
    ) {

      errores.push(
        'Debes agregar al menos una cuota.'
      );

    }


    const numeros =
      cuotas.map(
        cuota =>
          Number(
            cuota.numero_cuota
          )
      );


    const numerosUnicos =
      new Set(
        numeros
      );


    if (
      numerosUnicos.size !==
      numeros.length
    ) {

      errores.push(
        'No puede haber números de cuota repetidos.'
      );

    }


    cuotas.forEach(
      (cuota, index) => {

        if (
          !Number.isInteger(
            Number(
              cuota.numero_cuota
            )
          ) ||
          Number(
            cuota.numero_cuota
          ) <= 0
        ) {

          errores.push(
            `La cuota ${index + 1} tiene un número inválido.`
          );

        }


        if (
          cuota.monto === null ||
          cuota.monto === undefined ||
          !Number.isFinite(
            Number(
              cuota.monto
            )
          ) ||
          Number(
            cuota.monto
          ) <= 0
        ) {

          errores.push(
            `La cuota ${index + 1} debe tener un monto válido.`
          );

        }


        if (
          !cuota.fecha_programada
        ) {

          errores.push(
            `La cuota ${index + 1} debe tener fecha programada.`
          );

        }


        if (
          !cuota.fecha_vencimiento
        ) {

          errores.push(
            `La cuota ${index + 1} debe tener fecha de vencimiento.`
          );

        }

      }
    );


    // ========================================================
    // CERTIFICACIÓN
    // ========================================================

    const montoCertificacion =
      Number(
        this.formAcelerada
          .pago
          .monto_certificacion ?? 0
      );


    if (
      !Number.isFinite(
        montoCertificacion
      ) ||
      montoCertificacion < 0
    ) {

      errores.push(
        'El monto de certificación no puede ser negativo.'
      );

    }


    if (
      montoCertificacion > 0 &&
      !this.formAcelerada
        .pago
        .fecha_certificacion
    ) {

      errores.push(
        'Si existe monto de certificación debes indicar la fecha de certificación.'
      );

    }


    return errores;

  }


  // ==========================================================
  // GUARDAR MATRÍCULA
  // ==========================================================

  guardarMatricula(): void {

    if (
      this.esMatriculaAcelerada()
    ) {

      this.guardarMatriculaAcelerada();

      return;

    }


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
              e => `• ${e}`
            )
            .join('<br>'),

        confirmButtonText:
          'Entendido'

      });

      return;

    }


    this.form.maquinas_seleccionadas =
      Array.isArray(
        this.maquinasSeleccionadas
      )
        ? [
            ...this.maquinasSeleccionadas
          ]
        : [];


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
        null,

      certificacionIncluida:
        this.form.certificacionIncluida ??
        true,

      costo_certificacion:
        this.form.costo_certificacion ??
        null,

      cronograma_confirmado:
        this.previewCuotas as any

    };


    this.saving = true;

    this.cd.detectChanges();


    const request$ =
      this.modoModal === 'crear'
        ? this.matriculasService.crear(
            payload
          )
        : this.matriculasService.actualizar(
            this.matriculaEditandoId!,
            payload
          );


    request$.subscribe({

      next: (
        resp:
          ApiResponse<Matricula>
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
            'La matrícula fue registrada correctamente.',

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
  // GUARDAR ACELERADA
  // ==========================================================

  guardarMatriculaAcelerada(): void {

    const errores =
      this.validarFormularioAcelerada();


    if (
      errores.length > 0
    ) {

      Swal.fire({

        icon: 'warning',

        title: 'Faltan datos',

        html:
          errores
            .map(
              e => `• ${e}`
            )
            .join('<br>'),

        confirmButtonText:
          'Entendido'

      });

      return;

    }


    this.sincronizarMaquinasAceleradas();


    // ========================================================
    // CONSTRUIR PAYLOAD
    // ========================================================

    const payload:
      MatriculaAceleradaPayload = {

      alumno_id:
        Number(
          this.formAcelerada.alumno_id
        ),

      nombre_curso_manual:
        this.formAcelerada
          .nombre_curso_manual
          .trim(),

      estado_alumno_id:
        Number(
          this.formAcelerada.estado_alumno_id
        ),

      fecha_matricula:
        this.formAcelerada
          .fecha_matricula,

      fecha_inicio:
        this.formAcelerada
          .fecha_inicio || null,

      fecha_fin_estimada:
        this.formAcelerada
          .fecha_fin_estimada || null,

      notas:
        this.formAcelerada
          .notas || null,

      maquinas:
        this.maquinasAceleradas
          .map(
            (maquina) => ({

              maquina_id:
                Number(
                  maquina.maquina_id
                ),

              orden:
                Number(
                  maquina.orden
                ),

              es_regalo:
                Boolean(
                  maquina.es_regalo
                ),

              horas_asignadas:
                Number(
                  maquina.horas_asignadas
                ),

              sesiones_totales:
                Number(
                  maquina.sesiones_totales
                )

            })
          ),

      pago: {

        monto_matricula:
          Number(
            this.formAcelerada
              .pago
              .monto_matricula ?? 0
          ),

        fecha_matricula:
          this.formAcelerada
            .pago
            .fecha_matricula ||
          null,

        monto_certificacion:
          Number(
            this.formAcelerada
              .pago
              .monto_certificacion ?? 0
          ),

        fecha_certificacion:
          this.formAcelerada
            .pago
            .fecha_certificacion ||
          null,

        cuotas:
          this.formAcelerada
            .pago
            .cuotas
            .map(
              (cuota) => ({

                numero_cuota:
                  Number(
                    cuota.numero_cuota
                  ),

                fecha_programada:
                  cuota.fecha_programada,

                fecha_vencimiento:
                  cuota.fecha_vencimiento,

                monto:
                  Number(
                    cuota.monto
                  )

              })
            )

      }

    };


    console.log(
      '🚀 MATRÍCULA ACELERADA:',
      payload
    );


    console.log(
      '💰 TOTAL:',
      this.totalAcelerada
    );


    // ========================================================
    // GUARDAR
    // ========================================================

    this.saving = true;

    this.cd.detectChanges();


    this.matriculasService
      .crearAcelerada(
        payload
      )
      .pipe(

        finalize(() => {

          this.saving = false;

          this.cd.detectChanges();

        })

      )
      .subscribe({

        next: (
          resp:
            ApiResponse<Matricula>
        ) => {

          this.modalOpen =
            false;

          this.tipoMatricula =
            'ORDINARIA';

          this.modoModal =
            'crear';

          this.maquinasAceleradas =
            [];

          this.cuotasAceleradas =
            [];

          this.formAcelerada =
            this.getEmptyFormAcelerada();


          this.cd.detectChanges();


          Swal.fire({

            icon: 'success',

            title:
              'Matrícula acelerada creada',

            text:
              resp?.message ||
              'La matrícula acelerada fue registrada correctamente.',

            confirmButtonText:
              'Aceptar'

          });


          this.cargarTodo();

        },


        error: (
          err: any
        ) => {

          console.error(
            'Error al crear matrícula acelerada:',
            err
          );

          console.error(
            'Respuesta backend:',
            err?.error
          );


          Swal.fire({

            icon: 'error',

            title:
              'No se pudo crear',

            text:
              err?.error?.message ||
              'Ocurrió un error al crear la matrícula acelerada.',

            confirmButtonText:
              'Aceptar'

          });

        }

      });

  }


  // ==========================================================
  // PREVISUALIZAR CUOTAS NORMAL
  // ==========================================================

  previsualizarCuotas(): void {

    if (
      this.esMatriculaAcelerada()
    ) {

      return;

    }


    if (
      !this.form.alumno_id
    ) {

      Swal.fire({

        icon: 'warning',

        title:
          'Selecciona un alumno',

        text:
          'Debes seleccionar un alumno antes de previsualizar las cuotas.',

        confirmButtonText:
          'Entendido'

      });

      return;

    }


    if (
      !this.form.plan_curso_id
    ) {

      Swal.fire({

        icon: 'warning',

        title:
          'Selecciona un plan',

        text:
          'Debes seleccionar un plan de curso antes de previsualizar las cuotas.',

        confirmButtonText:
          'Entendido'

      });

      return;

    }


    if (
      !this.form.fecha_matricula
    ) {

      Swal.fire({

        icon: 'warning',

        title:
          'Fecha requerida',

        text:
          'Debes indicar la fecha de matrícula.',

        confirmButtonText:
          'Entendido'

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

        title:
          'Máquinas incompletas',

        text:
          `Debes seleccionar exactamente ${this.cantidadMaquinasRequeridas} máquina(s) antes de previsualizar.`,

        confirmButtonText:
          'Entendido'

      });

      return;

    }


    this.previewCuotasLoading =
      true;

    this.previewCuotasError =
      '';

    this.previewCuotas =
      [];

    this.previewCuotasOpen =
      false;

    this.previewPrecio =
      null;

    this.previewPlan =
      null;

    this.previewMaquinas =
      [];

    this.previewMontoTotal =
      this.form.monto_total ??
      null;

    this.previewCuotaInicial =
      this.form.cuota_inicial ??
      null;


    const payload = {

      plan_curso_id:
        Number(
          this.form.plan_curso_id
        ),

      fecha_matricula:
        this.form.fecha_matricula,

      fecha_inicio:
        this.form.fecha_inicio ||
        null,

      fecha_fin_estimada:
        this.form.fecha_fin_estimada ||
        null,

      monto_total:
        this.form.monto_total ??
        null,

      cuota_inicial:
        this.form.cuota_inicial ??
        null,

      modalidad_pago:
        this.form.modalidad_pago ??
        'MENSUAL',

      maquinas_seleccionadas:
        [
          ...this.maquinasSeleccionadas
        ],

      certificacionIncluida:
        this.form.certificacionIncluida ??
        true,

      costo_certificacion:
        this.form.costo_certificacion ??
        null

    };


    this.matriculasService
      .previsualizarCuotas(
        payload
      )
      .subscribe({

        next: (
          resp:
            ApiResponse<any>
        ) => {

          if (
            !resp ||
            !resp.ok ||
            !resp.data
          ) {

            this.previewCuotasLoading =
              false;

            this.previewCuotasError =
              'El backend no devolvió información para la previsualización.';

            return;

          }


          const data =
            resp.data as
            PrevisualizacionCuotasData;


          let cuotas:
            CuotaCronograma[] = [];


          if (
            Array.isArray(
              (data as any).cronograma
            )
          ) {

            cuotas =
              (data as any).cronograma;

          } else if (
            Array.isArray(
              (data as any).cuotas
            )
          ) {

            cuotas =
              (data as any).cuotas;

          } else if (
            Array.isArray(data)
          ) {

            cuotas =
              data as unknown as
              CuotaCronograma[];

          }


          if (
            (data as any).precio
          ) {

            this.previewPrecio =
              (data as any).precio;

          }


          if (
            (data as any).plan
          ) {

            this.previewPlan =
              (data as any).plan;

          }


          if (
            Array.isArray(
              (data as any).maquinas
            )
          ) {

            this.previewMaquinas =
              (data as any).maquinas;

          }


          this.previewCuotas =
            cuotas;


          this.cronogramaConfirmado =
            cuotas as CuotaCronogramaPayload[];


          if (
            this.previewCuotas.length === 0
          ) {

            this.previewCuotasLoading =
              false;

            this.previewCuotasError =
              'No se pudieron generar cuotas para los datos seleccionados.';

            return;

          }


          this.previewCuotasLoading =
            false;

          this.previewCuotasOpen =
            true;

          this.cd.detectChanges();

        },


        error: (
          err: any
        ) => {

          console.error(
            'Error previsualizando cuotas:',
            err
          );


          this.previewCuotasLoading =
            false;

          this.previewCuotasError =
            err?.error?.message ||
            err?.error?.error ||
            'No se pudo generar la previsualización de cuotas.';


          Swal.fire({

            icon: 'error',

            title: 'Error',

            text:
              this.previewCuotasError,

            confirmButtonText:
              'Aceptar'

          });


          this.cd.detectChanges();

        }

      });

  }


  // ==========================================================
  // CERRAR PREVIEW
  // ==========================================================

  cerrarPreviewCuotas(): void {

    if (
      this.previewCuotasLoading
    ) {

      return;

    }


    this.previewCuotasOpen =
      false;

    this.previewCuotas =
      [];

    this.cronogramaConfirmado =
      [];

    this.previewCuotasError =
      '';

    this.previewMontoTotal =
      null;

    this.previewCuotaInicial =
      null;

    this.previewPrecio =
      null;

    this.previewPlan =
      null;

    this.previewMaquinas =
      [];

    this.cd.detectChanges();

  }


  // ==========================================================
  // CAMBIO MODALIDAD
  // ==========================================================

  onModalidadPagoChange(): void {

    this.previewCuotasOpen =
      false;

    this.previewCuotas =
      [];

    this.cronogramaConfirmado =
      [];

    this.previewCuotasError =
      '';

    this.cd.detectChanges();

  }


  // ==========================================================
  // CAMBIO MONTO
  // ==========================================================

  onMontoPagoChange(): void {

    this.previewCuotasOpen =
      false;

    this.previewCuotas =
      [];

    this.cronogramaConfirmado =
      [];

    this.previewCuotasError =
      '';

    this.cd.detectChanges();

  }


  // ==========================================================
  // CAMBIO CUOTA INICIAL
  // ==========================================================

  onCuotaInicialChange(): void {

    this.previewCuotasOpen =
      false;

    this.previewCuotas =
      [];

    this.cronogramaConfirmado =
      [];

    this.previewCuotasError =
      '';

    this.cd.detectChanges();

  }


  // ==========================================================
  // FORMATEAR MONTO
  // ==========================================================

  formatMonto(
    valor:
      number |
      string |
      null |
      undefined
  ): string {

    const numero =
      Number(
        valor ?? 0
      );


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
      cuota?.fecha_programada ??
      cuota?.fecha_pago ??
      cuota?.fecha ??
      null
    );

  }


  getFechaCuotaInput(
    cuota: any
  ): string {

    const fecha =
      this.getFechaCuota(
        cuota
      );


    if (!fecha) {

      return '';

    }


    return fecha
      .split('T')[0];

  }


  editarFechaCuota(
    cuota: any,
    nuevaFecha: string
  ): void {

    if (!nuevaFecha) {

      return;

    }


    cuota.fecha_vencimiento =
      nuevaFecha;

    cuota.fecha_programada =
      nuevaFecha;


    if (
      cuota.fecha_pago !== undefined
    ) {

      cuota.fecha_pago =
        nuevaFecha;

    }


    if (
      cuota.fecha !== undefined
    ) {

      cuota.fecha =
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

    if (
      this.saving
    ) {

      return;

    }


    this.modalOpen =
      false;

    this.tipoMatricula =
      'ORDINARIA';

    this.modoModal =
      'crear';

    this.maquinasAceleradas =
      [];

    this.cuotasAceleradas =
      [];

    this.formAcelerada =
      this.getEmptyFormAcelerada();

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

      this.totalPaginas =
        1;

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
  // EDITAR MATRÍCULA NORMAL
  // ==========================================================

  abrirModalEditar(
    matricula: Matricula
  ): void {

    /*
     * La edición acelerada todavía no se mezcla
     * con la edición ordinaria.
     */

    if (
      (matricula as any)
        .tipo_matricula ===
      'ACELERADA'
    ) {

      Swal.fire({

        icon: 'info',

        title:
          'Matrícula acelerada',

        text:
          'La edición de matrículas aceleradas se implementará por separado para no afectar el flujo ordinario.',

        confirmButtonText:
          'Entendido'

      });

      return;

    }


    this.tipoMatricula =
      'ORDINARIA';

    this.modoModal =
      'editar';

    this.matriculaEditandoId =
      matricula.id;


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
        null,

      certificacionIncluida:
        matricula.certificacionIncluida ??
        true,

      costo_certificacion:
        matricula.costo_certificacion ??
        null

    };


    this.modalOpen =
      true;

    this.cerrarPreviewCuotas();

    this.actualizarSelectorMaquinas();


    this.matriculasService
      .listarMaquinas(
        matricula.id
      )
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
                  Number(
                    m.maquina_id
                  )
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
  // ELIMINAR MATRÍCULA
  // ==========================================================

  eliminarMatricula(
    matricula: Matricula
  ): void {

    const nombreAlumno =
      this.getNombreAlumno(
        matricula.alumno_id
      );


    Swal.fire({

      icon: 'warning',

      title:
        '¿Eliminar matrícula?',

      html: `
        <p>
          Estás a punto de eliminar la matrícula de:
        </p>

        <strong>
          ${nombreAlumno}
        </strong>

        <p style="margin-top: 12px;">
          Esta acción eliminará la matrícula y la información
          relacionada que el backend permita eliminar.
        </p>

        <p>
          <strong>
            Esta acción no se puede deshacer.
          </strong>
        </p>
      `,

      showCancelButton:
        true,

      confirmButtonText:
        'Sí, eliminar',

      cancelButtonText:
        'Cancelar',

      confirmButtonColor:
        '#dc2626',

      cancelButtonColor:
        '#6b7280',

      reverseButtons:
        true

    }).then(
      (result) => {

        if (
          !result.isConfirmed
        ) {

          return;

        }


        this.saving =
          true;

        this.cd.detectChanges();


        this.matriculasService
          .eliminarMatriculaCompleta(
            matricula.id
          )
          .pipe(

            finalize(() => {

              this.saving =
                false;

              this.cd.detectChanges();

            })

          )
          .subscribe({

            next: (
              resp:
                ApiResponse<any>
            ) => {

              Swal.fire({

                icon:
                  'success',

                title:
                  'Matrícula eliminada',

                text:
                  resp?.message ||
                  'La matrícula fue eliminada correctamente.',

                confirmButtonText:
                  'Aceptar'

              });


              this.cargarTodo();

            },


            error: (
              err: any
            ) => {

              console.error(
                'Error al eliminar matrícula:',
                err
              );


              Swal.fire({

                icon:
                  'error',

                title:
                  'No se pudo eliminar',

                text:
                  err?.error?.message ||
                  'Ocurrió un error al intentar eliminar la matrícula.',

                confirmButtonText:
                  'Aceptar'

              });

            }

          });

      }
    );

  }


  // ==========================================================
  // VALIDAR NORMAL
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
      this.form.certificacionIncluida
    ) {

      if (
        this.form.costo_certificacion ===
          null ||
        this.form.costo_certificacion ===
          undefined ||
        Number(
          this.form.costo_certificacion
        ) <= 0
      ) {

        errores.push(
          'Debes indicar un costo de certificación válido.'
        );

      }

    }


    return errores;

  }


  // ==========================================================
  // CAMBIO PLAN
  // ==========================================================

  onPlanChange(): void {

    this.recalcularFechaFin();

    this.actualizarSelectorMaquinas();

    this.cerrarPreviewCuotas();

    this.cd.detectChanges();

  }


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
          Number(
            this.form.plan_curso_id
          )
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
  // SELECTOR MÁQUINAS NORMAL
  // ==========================================================

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
          Number(
            this.form.plan_curso_id
          )
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

      case 'CUADRUPLE':
        return 4;

      case 'MULTIPLE':
        return 5;

      default:
        return 0;

    }

  }


  // ==========================================================
  // TOGGLE MÁQUINA NORMAL
  // ==========================================================

  toggleMaquina(
    maquinaId: number,
    event: Event
  ): void {

    const input =
      event.target as
      HTMLInputElement;


    const id =
      Number(maquinaId);


    if (
      input.checked
    ) {

      if (
        this.maquinasSeleccionadas.length >=
        this.cantidadMaquinasRequeridas
      ) {

        input.checked =
          false;


        Swal.fire({

          icon:
            'warning',

          title:
            'Límite alcanzado',

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
            Number(
              selectedId
            ) !== id
        );

    }


    this.form.maquinas_seleccionadas =
      [
        ...this.maquinasSeleccionadas
      ];


    this.cerrarPreviewCuotas();

    this.cd.detectChanges();

  }


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
  // DURACIÓN PLAN
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

      case 'CUADRUPLE':
        return 10;

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
      ).padStart(
        2,
        '0'
      );

    const diaFinal =
      String(
        fecha.getDate()
      ).padStart(
        2,
        '0'
      );


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
      ? `${alumno.apellidos ?? ''} ${alumno.nombres ?? ''}`.trim()
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

getNombrePlan(planId: number | null | undefined): string {
  if (planId == null) {
    return 'Curso acelerado';
  }

  const plan = this.planesCurso.find(
    p => Number(p.id) === Number(planId)
  );

  return plan?.nombre ?? 'Plan no encontrado';
}


  // ==========================================================
  // TRACK
  // ==========================================================

  trackByMatriculaId(
    index: number,
    matricula: Matricula
  ): number {

    return matricula.id;

  }


  // ==========================================================
  // PLAN MÚLTIPLE
  // ==========================================================

  esPlanMultipleConRegalo(): boolean {

    const plan =
      this.planesCurso.find(
        (p) =>
          Number(p.id) ===
          Number(
            this.form.plan_curso_id
          )
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
  // ESTADOS
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

      icon:
        'question',

      title:
        'Confirmar cambio',

      text:
        `La matrícula pasará al estado ${nombreEstado}.`,

      showCancelButton:
        true,

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
              resp:
                ApiResponse<Matricula>
            ) => {

              Swal.fire({

                icon:
                  'success',

                title:
                  'Estado actualizado',

                text:
                  resp.message ||
                  'El estado de la matrícula fue actualizado.'

              });


              this.cargarTodo();

            },


            error: (
              err: any
            ) => {

              Swal.fire({

                icon:
                  'error',

                title:
                  'Error',

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
          e.codigo ===
          codigo
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
      ) ===
      'MATRICULADO'
    );

  }


  puedeEgresar(
    estadoId: number
  ): boolean {

    return (
      this.getCodigoEstado(
        estadoId
      ) ===
      'MATRICULADO'
    );

  }


  puedeReservar(
    estadoId: number
  ): boolean {

    return (
      this.getCodigoEstado(
        estadoId
      ) ===
      'MATRICULADO'
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

    ].includes(
      codigo
    );

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

  private getFechaReferencia(
    m: Matricula
  ): string | null {

    return (
      m.fecha_inicio ||
      m.fecha_matricula ||
      null
    );

  }


  buscar(): void {

    const texto =
      (
        this.nombreFiltro ||
        ''
      )
        .toLowerCase()
        .trim();


    let filtradas =
      [
        ...this.matriculasOriginal
      ];


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


            const nombreCurso =
              (
                m as any
              )
                .nombre_curso_manual
                ?.toLowerCase() ??
              '';


            return (
              alumno.includes(texto) ||
              dni.includes(texto) ||
              nombreCurso.includes(texto)
            );

          }
        );

    }


    if (
      this.anioFiltro !== null
    ) {

      filtradas =
        filtradas.filter(
          (m) => {

            const fechaRef =
              this.getFechaReferencia(
                m
              );


            if (
              !fechaRef
            ) {

              return false;

            }


            const fecha =
              fechaRef.split('T')[0];


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


    if (
      this.mesFiltro !== null
    ) {

      filtradas =
        filtradas.filter(
          (m) => {

            const fechaRef =
              this.getFechaReferencia(
                m
              );


            if (
              !fechaRef
            ) {

              return false;

            }


            const fecha =
              fechaRef.split('T')[0];


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


    this.matriculas =
      filtradas;

    this.paginaActual =
      1;

    this.actualizarPaginacion();

    this.cd.detectChanges();

  }


  // ==========================================================
  // LIMPIAR FILTROS
  // ==========================================================

  limpiarFiltros(): void {

    this.search =
      '';

    this.txtBusquedaAlumno =
      '';

    this.nombreFiltro =
      '';

    this.anioFiltro =
      null;

    this.mesFiltro =
      null;


    this.matriculas =
      [
        ...this.matriculasOriginal
      ];


    this.paginaActual =
      1;

    this.actualizarPaginacion();

    this.cd.detectChanges();

  }

}
