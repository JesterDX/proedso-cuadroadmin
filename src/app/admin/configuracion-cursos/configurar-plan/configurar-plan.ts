import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import Swal from 'sweetalert2';

import {
  PlanCurso,
  PlanCursoPayload,
  PlanMaquina,
  PlanHoraPractica,
  PlanPrecio
} from '../models/plan-curso.model';

import { TipoCurso } from '../models/tipo-curso.model';

import { PlanesCursoService } from '../services/planes-curso.service';

import { MaquinasAdminService } from '../../maquinas/services/maquinas-admin.service';

import { Maquina } from '../../maquinas/model/maquina.model';

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
export class ConfigurarPlanComponent implements OnChanges {

  private readonly planesService =
    inject(PlanesCursoService);

  private readonly maquinasService =
    inject(MaquinasAdminService);

  private readonly cd =
    inject(ChangeDetectorRef);


  // ==========================================================
  // INPUTS / OUTPUTS
  // ==========================================================

  @Input({ required: true })
  tipoCurso!: TipoCurso;

  @Input()
  plan: PlanCurso | null = null;

  @Output()
  guardado =
    new EventEmitter<PlanCurso>();

  @Output()
  cancelar =
    new EventEmitter<void>();


  // ==========================================================
  // ESTADO
  // ==========================================================

  modoEdicion = false;

  cargando = true;

  guardando = false;


  // ==========================================================
  // SECCIÓN ACTIVA
  // ==========================================================

  seccionActiva:
    'informacion' |
    'maquinas' |
    'practicas' |
    'precios' = 'informacion';


  // ==========================================================
  // MÁQUINAS DISPONIBLES
  // ==========================================================

  maquinasDisponibles: Maquina[] = [];


  // ==========================================================
  // FORMULARIO
  // ==========================================================

  formulario: PlanCursoPayload = {

    tipo_curso_id: 0,

    codigo: '',

    nombre: '',

    version: 1,

    permite_eleccion_personalizada: false,

    vigente_desde: null,

    vigente_hasta: null,

    activo: true,

    observaciones: null,

    maquinas: [],

    horas_practica: [],

    precios: []

  };


  // ==========================================================
  // INIT / CAMBIOS
  // ==========================================================

  ngOnChanges(
    changes: SimpleChanges
  ): void {

    if (
      changes['tipoCurso'] ||
      changes['plan']
    ) {

      this.inicializar();

    }

  }


  // ==========================================================
  // INICIALIZAR
  // ==========================================================

  private inicializar(): void {

    this.cargando = true;

    this.modoEdicion =
      !!this.plan;

    this.formulario = {

      tipo_curso_id:
        this.tipoCurso?.id ?? 0,

      codigo: '',

      nombre: '',

      version: 1,

      permite_eleccion_personalizada:
        false,

      vigente_desde: null,

      vigente_hasta: null,

      activo: true,

      observaciones: null,

      maquinas: [],

      horas_practica: [],

      precios: []

    };


    if (this.plan) {

      this.cargarDesdePlan(
        this.plan
      );

    }


    this.cargarMaquinas();

  }


  // ==========================================================
  // CARGAR MÁQUINAS
  // ==========================================================

  private cargarMaquinas(): void {

    this.maquinasService
      .listar()
      .subscribe({

        next: (maquinas) => {

          this.maquinasDisponibles =
            maquinas ?? [];

          this.cargando = false;

          this.cd.detectChanges();

        },

        error: (error) => {

          console.error(
            'Error cargando máquinas:',
            error
          );

          this.cargando = false;

          Swal.fire(
            'Error',
            'No se pudieron cargar las máquinas.',
            'error'
          );

        }

      });

  }


  // ==========================================================
  // CARGAR PLAN
  // ==========================================================

  private cargarDesdePlan(
    plan: PlanCurso
  ): void {

    this.formulario = {

      tipo_curso_id:
        plan.tipo_curso_id,

      codigo:
        plan.codigo ?? '',

      nombre:
        plan.nombre ?? '',

      version:
        Number(plan.version ?? 1),

      permite_eleccion_personalizada:
        Boolean(
          plan.permite_eleccion_personalizada
        ),

      vigente_desde:
        plan.vigente_desde ?? null,

      vigente_hasta:
        plan.vigente_hasta ?? null,

      activo:
        Boolean(plan.activo),

      observaciones:
        plan.observaciones ?? null,

      maquinas:
        (plan.maquinas ?? []).map(
          maquina => ({

            id:
              maquina.id,

            maquina_id:
              Number(
                maquina.maquina_id
              ),

            maquina_nombre:
              maquina.maquina_nombre ?? '',

            orden:
              Number(
                maquina.orden ?? 1
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
        (plan.horas_practica ?? []).map(
          hora => ({

            id:
              hora.id,

            maquina_id:
              Number(
                hora.maquina_id
              ),

            maquina_nombre:
              hora.maquina_nombre ?? '',

            horas:
              Number(
                hora.horas ?? 0
              ),

            sesiones_totales:
              Number(
                hora.sesiones_totales ?? 1
              )

          })
        ),

      precios:
        (plan.precios ?? []).map(
          precio => ({

            id:
              precio.id,

            nombre:
              precio.nombre ?? '',

            monto_total:
              precio.monto_total !== null &&
              precio.monto_total !== undefined
                ? Number(
                    precio.monto_total
                  )
                : null,

            matricula:
              Number(
                precio.matricula ?? 0
              ),

            certificacion:
              Number(
                precio.certificacion ?? 0
              ),

            cantidad_cuotas:
              Number(
                precio.cantidad_cuotas ?? 1
              ),

            monto_cuota:
              precio.monto_cuota !== null &&
              precio.monto_cuota !== undefined
                ? Number(
                    precio.monto_cuota
                  )
                : null,

            vigente_desde:
              precio.vigente_desde ?? null,

            vigente_hasta:
              precio.vigente_hasta ?? null,

            activo:
              Boolean(
                precio.activo
              ),

            observaciones:
              precio.observaciones ?? null,

            aplica_maquina_id:
              precio.aplica_maquina_id !== null &&
              precio.aplica_maquina_id !== undefined
                ? Number(
                    precio.aplica_maquina_id
                  )
                : null,

            aplica_maquina_nombre:
              precio.aplica_maquina_nombre,

            requiere_tractor:
              Boolean(
                precio.requiere_tractor
              )

          })
        )

    };

  }


  // ==========================================================
  // NAVEGACIÓN
  // ==========================================================

  volver(): void {

    this.cancelar.emit();

  }


  cambiarSeccion(
    seccion:
      'informacion' |
      'maquinas' |
      'practicas' |
      'precios'
  ): void {

    this.seccionActiva =
      seccion;

  }


  // ==========================================================
  // MÁQUINAS
  // ==========================================================

  get maquinasSeleccionadas():
    PlanMaquina[] {

    return this.formulario.maquinas;

  }


  estaSeleccionada(
    maquinaId: number
  ): boolean {

    return this.formulario.maquinas
      .some(
        maquina =>
          maquina.maquina_id ===
          maquinaId
      );

  }


  toggleMaquina(
    maquina: Maquina
  ): void {

    const indice =
      this.formulario.maquinas
        .findIndex(
          item =>
            item.maquina_id ===
            maquina.id
        );


    // --------------------------------------------------------
    // QUITAR
    // --------------------------------------------------------

    if (indice >= 0) {

      this.formulario.maquinas
        .splice(indice, 1);

      this.formulario.horas_practica =
        this.formulario.horas_practica
          .filter(
            hora =>
              hora.maquina_id !==
              maquina.id
          );

      this.reordenarMaquinas();

      return;

    }


    // --------------------------------------------------------
    // AGREGAR
    // --------------------------------------------------------

    const nuevo: PlanMaquina = {

      maquina_id:
        Number(maquina.id),

      maquina_nombre:
        maquina.nombre,

      orden:
        this.formulario.maquinas.length + 1,

      es_regalo:
        false,

      obligatoria:
        true

    };


    this.formulario.maquinas
      .push(nuevo);

    this.reordenarMaquinas();

  }


  // ==========================================================
  // REORDENAR
  // ==========================================================

  reordenarMaquinas(): void {

    this.formulario.maquinas
      .forEach(
        (maquina, index) => {

          maquina.orden =
            index + 1;

        }
      );

  }


  // ==========================================================
  // OBLIGATORIA
  // ==========================================================

  cambiarObligatoria(
    maquina: PlanMaquina
  ): void {

    maquina.obligatoria =
      !maquina.obligatoria;

  }


  // ==========================================================
  // REGALO
  // ==========================================================

  cambiarRegalo(
    maquina: PlanMaquina
  ): void {

    maquina.es_regalo =
      !maquina.es_regalo;

  }


  // ==========================================================
  // PRÁCTICAS
  // ==========================================================

  obtenerPractica(
    maquinaId: number
  ): PlanHoraPractica | null {

    return (
      this.formulario.horas_practica
        .find(
          practica =>
            practica.maquina_id ===
            maquinaId
        ) ?? null
    );

  }


  asegurarPractica(
    maquina: PlanMaquina
  ): PlanHoraPractica {

    let practica =
      this.obtenerPractica(
        maquina.maquina_id
      );


    if (!practica) {

      practica = {

        maquina_id:
          maquina.maquina_id,

        maquina_nombre:
          maquina.maquina_nombre ?? '',

        horas: 0,

        sesiones_totales: 1

      };


      this.formulario.horas_practica
        .push(practica);

    }


    return practica;

  }


  actualizarHorasPractica(
    maquina: PlanMaquina,
    valor: number | string
  ): void {

    const practica =
      this.asegurarPractica(
        maquina
      );


    const horas =
      Number(valor);


    practica.horas =
      Number.isFinite(horas)
        ? horas
        : 0;

  }


  actualizarSesionesPractica(
    maquina: PlanMaquina,
    valor: number | string
  ): void {

    const practica =
      this.asegurarPractica(
        maquina
      );


    const sesiones =
      Number(valor);


    practica.sesiones_totales =
      Number.isFinite(sesiones)
        ? Math.max(
            1,
            Math.floor(sesiones)
          )
        : 1;

  }


  agregarPractica(
    maquina: PlanMaquina
  ): void {

    this.asegurarPractica(
      maquina
    );

    this.seccionActiva =
      'practicas';

  }


  eliminarPractica(
    practica: PlanHoraPractica
  ): void {

    this.formulario.horas_practica =
      this.formulario.horas_practica
        .filter(
          item =>
            item !== practica
        );

  }


  horasPorSesion(
    maquinaId: number
  ): number {

    const practica =
      this.obtenerPractica(
        maquinaId
      );


    if (!practica) {

      return 0;

    }


    const horas =
      Number(
        practica.horas ?? 0
      );

    const sesiones =
      Number(
        practica.sesiones_totales ?? 1
      );


    if (
      horas <= 0 ||
      sesiones <= 0
    ) {

      return 0;

    }


    return Number(
      (
        horas /
        sesiones
      ).toFixed(2)
    );

  }


  // ==========================================================
  // PRECIOS
  // ==========================================================

  agregarPrecio(): void {

    this.formulario.precios
      .push({

        nombre:
          'Precio regular',

        monto_total:
          null,

        matricula:
          0,

        certificacion:
          0,

        cantidad_cuotas:
          1,

        monto_cuota:
          null,

        vigente_desde:
          this.formulario.vigente_desde ??
          null,

        vigente_hasta:
          this.formulario.vigente_hasta ??
          null,

        activo:
          true,

        observaciones:
          null,

        aplica_maquina_id:
          null,

        requiere_tractor:
          false

      });


    this.seccionActiva =
      'precios';

  }


  eliminarPrecio(
    precio: PlanPrecio
  ): void {

    this.formulario.precios =
      this.formulario.precios
        .filter(
          item =>
            item !== precio
        );

  }


  calcularMontoCuota(
    precio: PlanPrecio
  ): void {

    const total =
      Number(
        precio.monto_total ?? 0
      );

    const cuotas =
      Number(
        precio.cantidad_cuotas ?? 1
      );


    if (
      total > 0 &&
      cuotas > 0
    ) {

      precio.monto_cuota =
        Number(
          (
            total /
            cuotas
          ).toFixed(2)
        );

    }
    else {

      precio.monto_cuota =
        null;

    }

  }


  // ==========================================================
  // VALIDACIÓN
  // ==========================================================

  private validarFormulario():
    string | null {

    if (
      !this.formulario.codigo.trim()
    ) {

      return 'Ingresa el código del plan.';

    }


    if (
      !this.formulario.nombre.trim()
    ) {

      return 'Ingresa el nombre del plan.';

    }


    if (
      !this.formulario.tipo_curso_id
    ) {

      return 'El tipo de curso es obligatorio.';

    }


    const cantidadEsperada =
      Number(
        this.tipoCurso?.cantidad_maquinas ?? 0
      );

    const cantidadSeleccionada =
      this.formulario.maquinas.length;


    if (
      !this.formulario
        .permite_eleccion_personalizada &&
      cantidadEsperada > 0 &&
      cantidadSeleccionada !==
        cantidadEsperada
    ) {

      return (
        `Este tipo requiere exactamente ` +
        `${cantidadEsperada} máquina(s).`
      );

    }


    if (
      this.formulario
        .permite_eleccion_personalizada &&
      cantidadEsperada > 0 &&
      cantidadSeleccionada <
        cantidadEsperada
    ) {

      return (
        `Este plan requiere como mínimo ` +
        `${cantidadEsperada} máquina(s).`
      );

    }


    // --------------------------------------------------------
    // PRÁCTICAS
    // --------------------------------------------------------

    for (
      const maquina of
      this.formulario.maquinas
    ) {

      const practica =
        this.obtenerPractica(
          maquina.maquina_id
        );


      if (!practica) {

        return (
          `Faltan las horas de práctica ` +
          `para ${maquina.maquina_nombre}.`
        );

      }


      if (
        Number(practica.horas) <= 0
      ) {

        return (
          `Las horas de ${maquina.maquina_nombre} ` +
          `deben ser mayores a 0.`
        );

      }


      if (
        Number(
          practica.sesiones_totales
        ) <= 0
      ) {

        return (
          `Las sesiones de ${maquina.maquina_nombre} ` +
          `deben ser mayores a 0.`
        );

      }

    }


    // --------------------------------------------------------
    // PRECIOS
    // --------------------------------------------------------

    for (
      const precio of
      this.formulario.precios
    ) {

      if (
        !precio.nombre.trim()
      ) {

        return (
          'Todos los precios deben tener un nombre.'
        );

      }


      if (
        precio.monto_total === null ||
        Number(precio.monto_total) < 0
      ) {

        return (
          `Ingresa un monto total válido ` +
          `para "${precio.nombre}".`
        );

      }


      if (
        Number(
          precio.cantidad_cuotas
        ) <= 0
      ) {

        return (
          `La cantidad de cuotas debe ser mayor a 0 ` +
          `en "${precio.nombre}".`
        );

      }

    }


    return null;

  }


  // ==========================================================
  // GUARDAR
  // ==========================================================

  guardar(): void {

    if (this.guardando) {

      return;

    }


    const error =
      this.validarFormulario();


    if (error) {

      Swal.fire(
        'Revisa la configuración',
        error,
        'warning'
      );

      return;

    }


    const payload:
      PlanCursoPayload = {

      tipo_curso_id:
        Number(
          this.formulario.tipo_curso_id
        ),

      codigo:
        this.formulario.codigo
          .trim()
          .toUpperCase(),

      nombre:
        this.formulario.nombre
          .trim(),

      version:
        Number(
          this.formulario.version ?? 1
        ),

      permite_eleccion_personalizada:
        Boolean(
          this.formulario
            .permite_eleccion_personalizada
        ),

      vigente_desde:
        this.formulario.vigente_desde ||
        null,

      vigente_hasta:
        this.formulario.vigente_hasta ||
        null,

      activo:
        Boolean(
          this.formulario.activo
        ),

      observaciones:
        this.formulario.observaciones?.trim() ||
        null,

      maquinas:
        this.formulario.maquinas
          .map(
            maquina => ({

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
        this.formulario.horas_practica
          .map(
            hora => ({

              maquina_id:
                Number(
                  hora.maquina_id
                ),

              horas:
                Number(
                  hora.horas
                ),

              sesiones_totales:
                Number(
                  hora.sesiones_totales
                )

            })
          ),

      precios:
        this.formulario.precios
          .map(
            precio => ({

              nombre:
                precio.nombre.trim(),

              monto_total:
                precio.monto_total !== null
                  ? Number(
                      precio.monto_total
                    )
                  : null,

              matricula:
                Number(
                  precio.matricula ?? 0
                ),

              certificacion:
                Number(
                  precio.certificacion ?? 0
                ),

              cantidad_cuotas:
                Number(
                  precio.cantidad_cuotas ?? 1
                ),

              monto_cuota:
                precio.monto_cuota !== null
                  ? Number(
                      precio.monto_cuota
                    )
                  : null,

              vigente_desde:
                precio.vigente_desde ??
                null,

              vigente_hasta:
                precio.vigente_hasta ??
                null,

              activo:
                Boolean(
                  precio.activo
                ),

              observaciones:
                precio.observaciones?.trim() ||
                null,

              aplica_maquina_id:
                precio.aplica_maquina_id
                  ? Number(
                      precio.aplica_maquina_id
                    )
                  : null,

              requiere_tractor:
                Boolean(
                  precio.requiere_tractor
                )

            })
          )

    };


    this.guardando = true;


    const peticion =
      this.modoEdicion &&
      this.plan?.id

        ? this.planesService.actualizar(
            this.plan.id,
            payload
          )

        : this.planesService.crear(
            payload
          );


    peticion.subscribe({

      next: (resp) => {

        this.guardando = false;


        if (!resp?.data) {

          Swal.fire(
            'Aviso',
            'El servidor no devolvió el plan guardado.',
            'warning'
          );

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
              ? 'La configuración fue actualizada correctamente.'
              : 'El plan fue creado correctamente.',

          timer: 1400,

          showConfirmButton: false

        }).then(() => {

          this.guardado.emit(
            resp.data
          );

        });

      },

      error: (error) => {

        console.error(
          'Error guardando plan:',
          error
        );

        this.guardando = false;

        Swal.fire({

          icon: 'error',

          title:
            'No se pudo guardar',

          text:
            error?.error?.message ??
            'Ocurrió un error al guardar el plan.'

        });

      }

    });

  }


  // ==========================================================
  // TRACKS
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

    return maquina.maquina_id;

  }


  trackPractica(
    index: number,
    practica: PlanHoraPractica
  ): number {

    return practica.id ??
      practica.maquina_id ??
      index;

  }


  trackPrecio(
    index: number,
    precio: PlanPrecio
  ): number {

    return precio.id ??
      index;

  }

}
