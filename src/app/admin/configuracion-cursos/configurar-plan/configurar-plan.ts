import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import {
  CommonModule,
  Location
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import Swal from 'sweetalert2';

import {
  PlanCurso,
  PlanCursoPayload,
  PlanMaquina,
  PlanHoraPractica
} from '../models/plan-curso.model';

import {
  TipoCurso
} from '../models/tipo-curso.model';

import {
  PlanesCursoService
} from '../services/planes-curso.service';

import {
  TiposCursoService
} from '../services/tipos-curso.service';

import {
  Maquina
} from '../../maquinas/model/maquina.model';

import {
  MaquinasAdminService
} from '../../maquinas/services/maquinas-admin.service';


@Component({
  selector: 'app-configurar-plan',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './configurar-plan.html',

  styleUrl: './configurar-plan.scss'
})
export class ConfigurarPlanComponent
  implements OnInit {

  // ==========================================================
  // SERVICES
  // ==========================================================

  private readonly planesCursoService =
    inject(
      PlanesCursoService
    );

  private readonly tiposCursoService =
    inject(
      TiposCursoService
    );

  private readonly maquinasService =
    inject(
      MaquinasAdminService
    );

  private readonly route =
    inject(
      ActivatedRoute
    );

  private readonly router =
    inject(
      Router
    );

  private readonly location =
    inject(
      Location
    );

  private readonly cd =
    inject(
      ChangeDetectorRef
    );


  // ==========================================================
  // INPUTS
  // ==========================================================

  @Input()
  tipoCurso:
    TipoCurso | null = null;


  @Input()
  plan:
    PlanCurso | null = null;


  // ==========================================================
  // OUTPUTS
  // ==========================================================

  @Output()
  guardado =
    new EventEmitter<PlanCurso>();


  @Output()
  cancelar =
    new EventEmitter<void>();


  // ==========================================================
  // ESTADO
  // ==========================================================

  cargando = true;

  guardando = false;

  maquinasDisponibles:
    Maquina[] = [];


  // ==========================================================
  // FORMULARIO
  // ==========================================================

  formulario:
    PlanCursoPayload = {

      tipo_curso_id: 0,

      nombre: '',

      permite_eleccion_personalizada:
        false,

      cantidad_cuotas:
        1,

      // ======================================================
      // VIGENCIA
      // ======================================================

      vigente_desde:
        '2023-01-01',

      vigente_hasta:
        null,

      observaciones:
        null,

      maquinas:
        [],

      horas_practica:
        []

    };


  // ==========================================================
  // GETTERS
  // ==========================================================

  get modoEdicion(): boolean {

    return this.plan !== null;

  }


  get tituloFormulario(): string {

    return this.modoEdicion

      ? 'Editar plan de curso'

      : 'Nuevo plan de curso';

  }


  get textoBotonGuardar(): string {

    return this.modoEdicion

      ? 'Guardar cambios'

      : 'Crear plan';

  }


  // ==========================================================
  // MÁQUINAS
  // ==========================================================

  get cantidadMaquinasConfiguradas(): number {

    return this.formulario
      .maquinas
      .length;

  }


  get cantidadMaquinasNormales(): number {

    return this.formulario
      .maquinas
      .filter(
        maquina =>
          !maquina.es_regalo
      )
      .length;

  }


  get cantidadMaquinasRegalo(): number {

    return this.formulario
      .maquinas
      .filter(
        maquina =>
          maquina.es_regalo
      )
      .length;

  }


  // ==========================================================
  // INIT
  // ==========================================================

  ngOnInit(): void {

    this.cargando =
      true;

    this.cargarContextoDesdeRuta();

  }


  // ==========================================================
  // RESOLVER CONTEXTO
  // ==========================================================

  private cargarContextoDesdeRuta(): void {

    if (this.tipoCurso) {

      if (this.plan) {

        this.inicializarFormulario();

      } else {

        this.inicializarFormularioNuevo();

      }

      this.cargarMaquinas();

      return;

    }


    const planIdParam =
      this.route
        .snapshot
        .paramMap
        .get('id');


    const tipoCursoIdParam =
      this.route
        .snapshot
        .queryParamMap
        .get('tipoCursoId');


    // --------------------------------------------------------
    // EDITAR
    // --------------------------------------------------------

    if (planIdParam) {

      const planId =
        Number(
          planIdParam
        );


      if (
        !Number.isInteger(
          planId
        ) ||
        planId <= 0
      ) {

        this.mostrarErrorContexto(
          'El identificador del plan no es válido.'
        );

        return;

      }


      this.cargarPlanPorRuta(
        planId
      );

      return;

    }


    // --------------------------------------------------------
    // NUEVO
    // --------------------------------------------------------

    if (tipoCursoIdParam) {

      const tipoCursoId =
        Number(
          tipoCursoIdParam
        );


      if (
        !Number.isInteger(
          tipoCursoId
        ) ||
        tipoCursoId <= 0
      ) {

        this.mostrarErrorContexto(
          'El identificador del tipo de curso no es válido.'
        );

        return;

      }


      this.cargarTipoPorRuta(
        tipoCursoId
      );

      return;

    }


    this.mostrarErrorContexto(
      'No se recibió el tipo de curso ni el plan.'
    );

  }


  // ==========================================================
  // CARGAR TIPO
  // ==========================================================

  private cargarTipoPorRuta(
    tipoCursoId: number
  ): void {

    this.tiposCursoService
      .listar()
      .subscribe({

        next: (resp: any) => {

          const tipos =
            resp?.data ?? [];


          const tipoEncontrado =
            tipos.find(
              (tipo: TipoCurso) =>
                Number(tipo.id) ===
                tipoCursoId
            );


          if (!tipoEncontrado) {

            this.mostrarErrorContexto(
              'No se encontró el tipo de curso seleccionado.'
            );

            return;

          }


          this.tipoCurso =
            tipoEncontrado;


          this.inicializarFormularioNuevo();

          this.cargarMaquinas();

        },


        error: error => {

          console.error(
            'Error obteniendo tipo de curso:',
            error
          );


          this.mostrarErrorContexto(
            'No se pudo cargar la información del tipo de curso.'
          );

        }

      });

  }


  // ==========================================================
  // CARGAR PLAN
  // ==========================================================

  private cargarPlanPorRuta(
    planId: number
  ): void {

    this.planesCursoService
      .obtenerPorId(
        planId
      )
      .subscribe({

        next: (resp) => {

          const plan =
            resp?.data;


          if (!plan) {

            this.mostrarErrorContexto(
              'No se encontró el plan solicitado.'
            );

            return;

          }


          this.plan =
            plan;


          const tipoCursoId =
            Number(
              plan.tipo_curso_id
            );


          if (
            !Number.isInteger(
              tipoCursoId
            ) ||
            tipoCursoId <= 0
          ) {

            this.mostrarErrorContexto(
              'El plan no tiene un tipo de curso válido.'
            );

            return;

          }


          this.cargarTipoParaPlan(
            tipoCursoId
          );

        },


        error: error => {

          console.error(
            'Error obteniendo plan:',
            error
          );


          this.mostrarErrorContexto(
            error?.error?.message ??
            'No se pudo cargar el plan.'
          );

        }

      });

  }


  // ==========================================================
  // CARGAR TIPO ASOCIADO
  // ==========================================================

  private cargarTipoParaPlan(
    tipoCursoId: number
  ): void {

    this.tiposCursoService
      .listar()
      .subscribe({

        next: (resp: any) => {

          const tipos =
            resp?.data ?? [];


          const tipoEncontrado =
            tipos.find(
              (tipo: TipoCurso) =>
                Number(tipo.id) ===
                tipoCursoId
            );


          if (!tipoEncontrado) {

            this.mostrarErrorContexto(
              'No se encontró el tipo de curso asociado al plan.'
            );

            return;

          }


          this.tipoCurso =
            tipoEncontrado;


          this.inicializarFormulario();

          this.cargarMaquinas();

        },


        error: error => {

          console.error(
            'Error obteniendo tipo asociado:',
            error
          );


          this.mostrarErrorContexto(
            'No se pudo cargar el tipo de curso asociado.'
          );

        }

      });

  }


  // ==========================================================
  // NUEVO PLAN
  // ==========================================================

  private inicializarFormularioNuevo(): void {

    if (!this.tipoCurso) {
      return;
    }


    this.formulario = {

      tipo_curso_id:
        Number(
          this.tipoCurso.id
        ),

      nombre:
        '',

      permite_eleccion_personalizada:
        false,

      cantidad_cuotas:
        1,

      // ======================================================
      // FECHA POR DEFECTO
      // ======================================================

      vigente_desde:
        '2023-01-01',

      vigente_hasta:
        null,

      observaciones:
        null,

      maquinas:
        [],

      horas_practica:
        []

    };


    this.cd.detectChanges();

  }


  // ==========================================================
  // INICIALIZAR EDICIÓN
  // ==========================================================

  private inicializarFormulario(): void {

    if (!this.tipoCurso) {
      return;
    }


    this.formulario = {

      tipo_curso_id:
        Number(
          this.tipoCurso.id
        ),

      nombre:
        '',

      permite_eleccion_personalizada:
        false,

      cantidad_cuotas:
        1,

      vigente_desde:
        '2023-01-01',

      vigente_hasta:
        null,

      observaciones:
        null,

      maquinas:
        [],

      horas_practica:
        []

    };


    if (this.plan) {

      this.cargarPlanExistente(
        this.plan
      );

    }


    this.cd.detectChanges();

  }


  // ==========================================================
  // CARGAR PLAN EXISTENTE
  // ==========================================================

  private cargarPlanExistente(
    plan: PlanCurso
  ): void {

    const precioActivo =
      (plan.precios ?? [])
        .find(
          precio =>
            precio.activo === true
        );


    const cantidadCuotas =
      Number(
        precioActivo?.cantidad_cuotas
      ) > 0

        ? Number(
            precioActivo?.cantidad_cuotas
          )

        : 1;


    this.formulario = {

      tipo_curso_id:
        Number(
          plan.tipo_curso_id ??
          this.tipoCurso?.id ??
          0
        ),

      nombre:
        plan.nombre ??
        '',

      permite_eleccion_personalizada:
        Boolean(
          plan.permite_eleccion_personalizada
        ),

      cantidad_cuotas:
        cantidadCuotas,

      // ======================================================
      // VIGENCIA EXISTENTE
      // ======================================================

      vigente_desde:
        this.normalizarFechaInput(
          plan.vigente_desde
        ) ??
        '2023-01-01',

      vigente_hasta:
        this.normalizarFechaInput(
          plan.vigente_hasta
        ),

      observaciones:
        plan.observaciones ??
        null,

      maquinas:
        (plan.maquinas ?? [])
          .map(
            maquina => ({

              id:
                maquina.id,

              maquina_id:
                Number(
                  maquina.maquina_id
                ),

              maquina_nombre:
                maquina.maquina_nombre,

              orden:
                Number(
                  maquina.orden ??
                  1
                ),

              es_regalo:
                Boolean(
                  maquina.es_regalo
                ),

              obligatoria:
                Boolean(
                  maquina.obligatoria
                )

            })
          ),

      horas_practica:
        (plan.horas_practica ?? [])
          .map(
            practica => ({

              id:
                practica.id,

              maquina_id:
                Number(
                  practica.maquina_id
                ),

              maquina_nombre:
                practica.maquina_nombre,

              horas:
                Number(
                  practica.horas ??
                  0
                ),

              sesiones_totales:
                Number(
                  practica.sesiones_totales ??
                  1
                )

            })
          )

    };


    this.asegurarPracticasDeMaquinas();

    this.cd.detectChanges();

  }


  // ==========================================================
  // NORMALIZAR FECHA PARA INPUT DATE
  // ==========================================================

  private normalizarFechaInput(
    valor: string | null | undefined
  ): string | null {

    if (
      !valor
    ) {

      return null;

    }


    const texto =
      String(
        valor
      );


    if (
      /^\d{4}-\d{2}-\d{2}$/.test(
        texto
      )
    ) {

      return texto;

    }


    return texto
      .slice(
        0,
        10
      );

  }


  // ==========================================================
  // CARGAR MÁQUINAS
  // ==========================================================

  private cargarMaquinas(): void {

    this.maquinasService
      .listarTodas()
      .subscribe({

        next: maquinas => {

          this.maquinasDisponibles =
            [...maquinas]
              .sort(
                (a, b) =>
                  a.nombre.localeCompare(
                    b.nombre
                  )
              );


          this.asegurarPracticasDeMaquinas();

          this.cargando =
            false;

          this.cd.detectChanges();

        },


        error: error => {

          console.error(
            'Error cargando máquinas:',
            error
          );


          this.cargando =
            false;


          Swal.fire({

            icon: 'error',

            title: 'Error',

            text:
              'No se pudieron cargar las máquinas.'

          });

        }

      });

  }


  // ==========================================================
  // MÁQUINA SELECCIONADA
  // ==========================================================

  estaMaquinaSeleccionada(
    maquinaId: number
  ): boolean {

    return this.formulario
      .maquinas
      .some(
        maquina =>
          Number(
            maquina.maquina_id
          ) ===
          Number(
            maquinaId
          )
      );

  }


  // ==========================================================
  // AGREGAR / QUITAR
  // ==========================================================

  toggleMaquina(
    maquina: Maquina
  ): void {

    const index =
      this.formulario
        .maquinas
        .findIndex(
          item =>
            Number(
              item.maquina_id
            ) ===
            Number(
              maquina.id
            )
        );


    if (
      index >= 0
    ) {

      this.quitarMaquina(
        maquina.id
      );

      return;

    }


    const nuevaMaquina:
      PlanMaquina = {

      maquina_id:
        maquina.id,

      maquina_nombre:
        maquina.nombre,

      orden:
        this.formulario
          .maquinas
          .length + 1,

      es_regalo:
        false,

      obligatoria:
        !this.formulario
          .permite_eleccion_personalizada

    };


    this.formulario
      .maquinas
      .push(
        nuevaMaquina
      );


    this.asegurarPractica(
      maquina.id,
      maquina.nombre
    );


    this.reordenarMaquinas();

    this.cd.detectChanges();

  }


  // ==========================================================
  // QUITAR
  // ==========================================================

  quitarMaquina(
    maquinaId: number
  ): void {

    this.formulario.maquinas =
      this.formulario
        .maquinas
        .filter(
          maquina =>
            Number(
              maquina.maquina_id
            ) !==
            Number(
              maquinaId
            )
        );


    this.formulario.horas_practica =
      this.formulario
        .horas_practica
        .filter(
          practica =>
            Number(
              practica.maquina_id
            ) !==
            Number(
              maquinaId
            )
        );


    this.reordenarMaquinas();

    this.cd.detectChanges();

  }


  // ==========================================================
  // REORDENAR
  // ==========================================================

  private reordenarMaquinas(): void {

    this.formulario
      .maquinas
      .forEach(
        (maquina, index) => {

          maquina.orden =
            index + 1;

        }
      );

  }


  // ==========================================================
  // PRÁCTICAS
  // ==========================================================

  obtenerPractica(
    maquinaId: number
  ): PlanHoraPractica | undefined {

    return this.formulario
      .horas_practica
      .find(
        practica =>
          Number(
            practica.maquina_id
          ) ===
          Number(
            maquinaId
          )
      );

  }


  // ==========================================================
  // ASEGURAR PRÁCTICA
  // ==========================================================

  private asegurarPractica(
    maquinaId: number,
    maquinaNombre?: string
  ): PlanHoraPractica {

    let practica =
      this.obtenerPractica(
        maquinaId
      );


    if (!practica) {

      practica = {

        maquina_id:
          maquinaId,

        maquina_nombre:
          maquinaNombre,

        horas:
          0,

        sesiones_totales:
          1

      };


      this.formulario
        .horas_practica
        .push(
          practica
        );

    }


    return practica;

  }


  // ==========================================================
  // ASEGURAR PRÁCTICAS
  // ==========================================================

  private asegurarPracticasDeMaquinas(): void {

    for (
      const maquina
      of this.formulario.maquinas
    ) {

      this.asegurarPractica(

        maquina.maquina_id,

        maquina.maquina_nombre

      );

    }

  }


  // ==========================================================
  // ACTUALIZAR HORAS
  // ==========================================================

  actualizarHoras(
    maquinaId: number,
    valor: number | string
  ): void {

    const practica =
      this.asegurarPractica(

        maquinaId,

        this.formulario
          .maquinas
          .find(
            item =>
              Number(
                item.maquina_id
              ) ===
              Number(
                maquinaId
              )
          )
          ?.maquina_nombre

      );


    const horas =
      Number(
        valor
      );


    practica.horas =
      Number.isFinite(
        horas
      ) &&
      horas >= 0

        ? horas

        : 0;

  }


  // ==========================================================
  // ACTUALIZAR SESIONES
  // ==========================================================

  actualizarSesiones(
    maquinaId: number,
    valor: number | string
  ): void {

    const practica =
      this.asegurarPractica(

        maquinaId,

        this.formulario
          .maquinas
          .find(
            item =>
              Number(
                item.maquina_id
              ) ===
              Number(
                maquinaId
              )
          )
          ?.maquina_nombre

      );


    const sesiones =
      Number(
        valor
      );


    practica.sesiones_totales =
      Number.isFinite(
        sesiones
      ) &&
      sesiones >= 1

        ? Math.floor(
            sesiones
          )

        : 1;

  }


  // ==========================================================
  // HORAS POR SESIÓN
  // ==========================================================

  horasPorSesion(
    maquinaId: number
  ): number | null {

    const practica =
      this.obtenerPractica(
        maquinaId
      );


    if (!practica) {
      return null;
    }


    if (
      !practica.sesiones_totales ||
      practica.sesiones_totales <= 0
    ) {

      return null;

    }


    return Number(

      (
        practica.horas /
        practica.sesiones_totales
      ).toFixed(2)

    );

  }


  // ==========================================================
  // CUOTAS
  // ==========================================================

  actualizarCantidadCuotas(
    valor: number | string
  ): void {

    const cuotas =
      Number(
        valor
      );


    this.formulario
      .cantidad_cuotas =
        Number.isFinite(
          cuotas
        ) &&
        cuotas >= 1

          ? Math.floor(
              cuotas
            )

          : 1;

  }


  // ==========================================================
  // TRACK
  // ==========================================================

  trackMaquina(
    _index: number,
    maquina: Maquina
  ): number {

    return maquina.id;

  }


  trackPlanMaquina(
    _index: number,
    maquina: PlanMaquina
  ): number {

    return Number(
      maquina.id ??
      maquina.maquina_id
    );

  }


  trackPractica(
    _index: number,
    practica: PlanHoraPractica
  ): number {

    return Number(
      practica.id ??
      practica.maquina_id
    );

  }


  // ==========================================================
  // VALIDACIÓN
  // ==========================================================

  private validarFormulario(): boolean {

    if (!this.tipoCurso) {

      Swal.fire({

        icon: 'error',

        title:
          'Tipo de curso no seleccionado',

        text:
          'No se recibió el tipo de curso.'

      });

      return false;

    }


    if (
      !this.formulario.nombre ||
      !this.formulario.nombre.trim()
    ) {

      Swal.fire({

        icon: 'warning',

        title:
          'Nombre requerido',

        text:
          'Ingresa el nombre del plan.'

      });

      return false;

    }


    // ========================================================
    // VALIDAR VIGENCIA
    // ========================================================

    if (
      !this.formulario.vigente_desde
    ) {

      Swal.fire({

        icon: 'warning',

        title:
          'Fecha de vigencia requerida',

        text:
          'Selecciona la fecha desde la cual estará vigente el plan.'

      });

      return false;

    }


    if (
      this.formulario.vigente_hasta &&
      this.formulario.vigente_hasta <
        this.formulario.vigente_desde
    ) {

      Swal.fire({

        icon: 'warning',

        title:
          'Rango de vigencia inválido',

        text:
          'La fecha de fin de vigencia no puede ser anterior a la fecha de inicio.'

      });

      return false;

    }


    if (
      !Number.isInteger(
        Number(
          this.formulario.cantidad_cuotas
        )
      ) ||
      Number(
        this.formulario.cantidad_cuotas
      ) < 1
    ) {

      Swal.fire({

        icon: 'warning',

        title:
          'Cantidad de cuotas inválida',

        text:
          'La cantidad de cuotas debe ser un número entero mayor o igual a 1.'

      });

      return false;

    }


    if (
      this.formulario.maquinas.length === 0
    ) {

      Swal.fire({

        icon: 'warning',

        title:
          'Sin máquinas',

        text:
          'Debes configurar al menos una máquina para el plan.'

      });

      return false;

    }


    const ids =
      this.formulario
        .maquinas
        .map(
          maquina =>
            Number(
              maquina.maquina_id
            )
        );


    if (
      new Set(ids).size !==
      ids.length
    ) {

      Swal.fire({

        icon: 'error',

        title:
          'Máquinas duplicadas',

        text:
          'No puedes seleccionar la misma máquina más de una vez.'

      });

      return false;

    }


    for (
      const maquina
      of this.formulario.maquinas
    ) {

      const practica =
        this.obtenerPractica(
          maquina.maquina_id
        );


      if (!practica) {

        Swal.fire({

          icon: 'warning',

          title:
            'Horas de práctica faltantes',

          text:
            `Configura las horas de práctica para ` +
            `${maquina.maquina_nombre ?? 'la máquina'}.`

        });

        return false;

      }


      if (
        Number(
          practica.horas
        ) <= 0
      ) {

        Swal.fire({

          icon: 'warning',

          title:
            'Horas de práctica inválidas',

          text:
            `Las horas de práctica de ` +
            `${maquina.maquina_nombre ?? 'la máquina'} ` +
            `deben ser mayores a 0.`

        });

        return false;

      }


      if (
        !Number.isInteger(
          Number(
            practica.sesiones_totales
          )
        ) ||
        Number(
          practica.sesiones_totales
        ) <= 0
      ) {

        Swal.fire({

          icon: 'warning',

          title:
            'Sesiones inválidas',

          text:
            `Las sesiones de ` +
            `${maquina.maquina_nombre ?? 'la máquina'} ` +
            `deben ser un número entero mayor a 0.`

        });

        return false;

      }

    }


    for (
      const maquina
      of this.formulario.maquinas
    ) {

      if (
        maquina.es_regalo &&
        maquina.obligatoria
      ) {

        Swal.fire({

          icon: 'warning',

          title:
            'Configuración de regalo inválida',

          text:
            `${maquina.maquina_nombre ?? 'La máquina'} ` +
            `está marcada como regalo y no puede ser obligatoria.`

        });

        return false;

      }

    }


    return true;

  }


  // ==========================================================
  // PAYLOAD
  // ==========================================================

  private construirPayload():
    PlanCursoPayload {

    return {

      tipo_curso_id:
        Number(
          this.tipoCurso?.id ??
          this.formulario
            .tipo_curso_id
        ),

      nombre:
        this.formulario
          .nombre
          .trim(),

      permite_eleccion_personalizada:
        Boolean(
          this.formulario
            .permite_eleccion_personalizada
        ),

      cantidad_cuotas:
        Number(
          this.formulario
            .cantidad_cuotas
        ),

      // ======================================================
      // VIGENCIA
      // ======================================================

      vigente_desde:
        this.formulario
          .vigente_desde,

      vigente_hasta:
        this.formulario
          .vigente_hasta ||
        null,

      observaciones:
        this.formulario
          .observaciones
          ?.trim() ||
        null,

      maquinas:
        this.formulario
          .maquinas
          .map(
            maquina => ({

              id:
                maquina.id,

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

              obligatoria:
                Boolean(
                  maquina.obligatoria
                )

            })
          ),

      horas_practica:
        this.formulario
          .horas_practica
          .filter(
            practica =>
              this.formulario
                .maquinas
                .some(
                  maquina =>
                    Number(
                      maquina.maquina_id
                    ) ===
                    Number(
                      practica.maquina_id
                    )
                )
          )
          .map(
            practica => ({

              id:
                practica.id,

              maquina_id:
                Number(
                  practica.maquina_id
                ),

              horas:
                Number(
                  practica.horas
                ) || 0,

              sesiones_totales:
                Number(
                  practica.sesiones_totales
                ) || 1

            })
          )

    };

  }


  // ==========================================================
  // GUARDAR
  // ==========================================================

  guardar(): void {

    if (
      this.guardando
    ) {

      return;

    }


    if (
      !this.validarFormulario()
    ) {

      return;

    }


    const payload =
      this.construirPayload();


    console.log(
      'Payload plan:',
      payload
    );


    this.guardando =
      true;


    const operacion =
      this.modoEdicion &&
      this.plan?.id

        ? this.planesCursoService
            .actualizar(
              this.plan.id,
              payload
            )

        : this.planesCursoService
            .crear(
              payload
            );


    operacion.subscribe({

      next: response => {

        this.guardando =
          false;


        if (
          !response?.data
        ) {

          Swal.fire({

            icon: 'error',

            title:
              'Error',

            text:
              'El servidor no devolvió el plan guardado.'

          });

          return;

        }


        Swal.fire({

          icon: 'success',

          title:
            this.modoEdicion
              ? 'Plan actualizado'
              : 'Plan creado',

          text:
            this.modoEdicion
              ? 'Los cambios se guardaron correctamente.'
              : 'El nuevo plan se creó correctamente.',

          timer:
            1800,

          showConfirmButton:
            false

        });


        this.guardado.emit(
          response.data
        );


        this.router.navigate(
          ['/admin/tipos-curso']
        );

      },


      error: error => {

        console.error(
          'Error al guardar plan:',
          error
        );


        this.guardando =
          false;


        Swal.fire({

          icon: 'error',

          title:
            'No se pudo guardar',

          text:
            error?.error?.message ??
            error?.message ??
            'Ocurrió un error al guardar el plan.'

        });

      }

    });

  }


  // ==========================================================
  // ERROR DE CONTEXTO
  // ==========================================================

  private mostrarErrorContexto(
    mensaje: string
  ): void {

    this.cargando =
      false;


    Swal.fire({

      icon: 'error',

      title:
        'No se pudo cargar la configuración',

      text:
        mensaje

    }).then(() => {

      this.router.navigate(
        ['/admin/tipos-curso']
      );

    });

  }


  // ==========================================================
  // VOLVER
  // ==========================================================

  volver(): void {

    this.cancelar.emit();

    this.router.navigate(
      ['/admin/tipos-curso']
    );

  }

}
