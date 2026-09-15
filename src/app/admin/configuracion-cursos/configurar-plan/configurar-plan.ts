
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
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
  PlanHoraPractica
} from '../models/plan-curso.model';

import { TipoCurso } from '../models/tipo-curso.model';

import { PlanesCursoService } from '../services/planes-curso.service';

import { Maquina } from '../../maquinas/model/maquina.model';

import { MaquinasAdminService } from '../../maquinas/services/maquinas-admin.service';

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
export class ConfigurarPlanComponent implements OnInit {

  // ==========================================================
  // SERVICES
  // ==========================================================

  private readonly planesCursoService =
    inject(PlanesCursoService);

  private readonly maquinasService =
    inject(MaquinasAdminService);

  private readonly cd =
    inject(ChangeDetectorRef);


  // ==========================================================
  // INPUTS
  // ==========================================================

  @Input()
  tipoCurso: TipoCurso | null = null;

  @Input()
  plan: PlanCurso | null = null;


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

  cargando = false;
  guardando = false;

  maquinasDisponibles: Maquina[] = [];


  // ==========================================================
  // FORMULARIO
  // ==========================================================

  formulario: PlanCursoPayload = {

    tipo_curso_id: 0,

    nombre: '',

    permite_eleccion_personalizada: false,

    cantidad_cuotas: 1,

    observaciones: null,

    maquinas: [],

    horas_practica: []

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
  // TOTAL DE MÁQUINAS CONFIGURADAS
  // ==========================================================
  //
  // IMPORTANTE:
  // cantidad_maquinas NO limita esta pantalla.
  //
  // Aquí podemos configurar 1, 2, 5, 10, 11, etc.
  //
  // La cantidad_maquinas del tipo se utilizará después
  // durante la matrícula del alumno.
  // ==========================================================

  get cantidadMaquinasConfiguradas(): number {

    return this.formulario.maquinas.length;

  }


  // ==========================================================
  // MÁQUINAS NORMALES
  // ==========================================================

  get cantidadMaquinasNormales(): number {

    return this.formulario.maquinas
      .filter(maquina => !maquina.es_regalo)
      .length;

  }


  // ==========================================================
  // MÁQUINAS REGALO
  // ==========================================================

  get cantidadMaquinasRegalo(): number {

    return this.formulario.maquinas
      .filter(maquina => maquina.es_regalo)
      .length;

  }


  // ==========================================================
  // INIT
  // ==========================================================

  ngOnInit(): void {

    this.inicializarFormulario();

    this.cargarMaquinas();

    this.cd.detectChanges();

  }


  // ==========================================================
  // INICIALIZAR FORMULARIO
  // ==========================================================

  private inicializarFormulario(): void {

    if (!this.tipoCurso) {
      return;
    }


    this.formulario = {

      tipo_curso_id:
        this.tipoCurso.id,

      nombre: '',

      permite_eleccion_personalizada:
        false,

      cantidad_cuotas:
        1,

      observaciones:
        null,

      maquinas: [],

      horas_practica: []

    };


    if (this.plan) {

      this.cargarPlanExistente(
        this.plan
      );

    }

  }


  // ==========================================================
  // CARGAR PLAN EXISTENTE
  // ==========================================================

  private cargarPlanExistente(
    plan: PlanCurso
  ): void {

    const precioActivo =
      (plan.precios ?? [])
        .find(precio =>
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
        plan.tipo_curso_id ??
        this.tipoCurso?.id ??
        0,

      nombre:
        plan.nombre ?? '',

      permite_eleccion_personalizada:
        Boolean(
          plan.permite_eleccion_personalizada
        ),

      cantidad_cuotas:
        cantidadCuotas,

      observaciones:
        plan.observaciones ??
        null,

      maquinas:
        (plan.maquinas ?? [])
          .map(maquina => ({

            id:
              maquina.id,

            maquina_id:
              maquina.maquina_id,

            maquina_nombre:
              maquina.maquina_nombre,

            orden:
              maquina.orden ?? 1,

            es_regalo:
              Boolean(
                maquina.es_regalo
              ),

            obligatoria:
              Boolean(
                maquina.obligatoria
              )

          })),

      horas_practica:
        (plan.horas_practica ?? [])
          .map(practica => ({

            id:
              practica.id,

            maquina_id:
              practica.maquina_id,

            maquina_nombre:
              practica.maquina_nombre,

            horas:
              Number(
                practica.horas ?? 0
              ),

            sesiones_totales:
              Number(
                practica.sesiones_totales ?? 1
              )

          }))

    };


    this.asegurarPracticasDeMaquinas();

    this.cd.detectChanges();

  }


  // ==========================================================
  // CARGAR MÁQUINAS
  // ==========================================================

  private cargarMaquinas(): void {

    this.cargando = true;

    this.cd.detectChanges();


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


          this.cargando = false;

          this.cd.detectChanges();

        },


        error: error => {

          console.error(
            'Error al cargar máquinas:',
            error
          );


          this.cargando = false;

          this.cd.detectChanges();


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
  // ¿MÁQUINA SELECCIONADA?
  // ==========================================================

  estaMaquinaSeleccionada(
    maquinaId: number
  ): boolean {

    return this.formulario.maquinas.some(
      maquina =>
        maquina.maquina_id === maquinaId
    );

  }


  // ==========================================================
  // AGREGAR / QUITAR MÁQUINA
  // ==========================================================
  //
  // IMPORTANTE:
  //
  // NO existe límite basado en cantidad_maquinas.
  //
  // El administrador puede configurar todas las máquinas
  // disponibles para el plan.
  //
  // La cantidad_maquinas del tipo se valida posteriormente
  // durante la matrícula.
  // ==========================================================

  toggleMaquina(
    maquina: Maquina
  ): void {

    const index =
      this.formulario.maquinas
        .findIndex(
          item =>
            item.maquina_id === maquina.id
        );


    // ----------------------------------------------------------
    // QUITAR
    // ----------------------------------------------------------

    if (index >= 0) {

      this.quitarMaquina(
        maquina.id
      );

      return;

    }


    // ----------------------------------------------------------
    // AGREGAR
    // ----------------------------------------------------------

    const nuevaMaquina: PlanMaquina = {

      maquina_id:
        maquina.id,

      maquina_nombre:
        maquina.nombre,

      orden:
        this.formulario.maquinas.length + 1,

      es_regalo:
        false,

      obligatoria:
        !this.formulario.permite_eleccion_personalizada

    };


    this.formulario.maquinas.push(
      nuevaMaquina
    );


    // ----------------------------------------------------------
    // CREAR PRÁCTICA
    // ----------------------------------------------------------

    this.asegurarPractica(
      maquina.id,
      maquina.nombre
    );


    this.reordenarMaquinas();

    this.cd.detectChanges();

  }


  // ==========================================================
  // QUITAR MÁQUINA
  // ==========================================================

  quitarMaquina(
    maquinaId: number
  ): void {

    const index =
      this.formulario.maquinas
        .findIndex(
          maquina =>
            maquina.maquina_id === maquinaId
        );


    if (index < 0) {
      return;
    }


    this.formulario.maquinas.splice(
      index,
      1
    );


    this.formulario.horas_practica =
      this.formulario.horas_practica
        .filter(
          practica =>
            practica.maquina_id !== maquinaId
        );


    this.reordenarMaquinas();

    this.cd.detectChanges();

  }


  // ==========================================================
  // REORDENAR
  // ==========================================================

  private reordenarMaquinas(): void {

    this.formulario.maquinas
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
          practica.maquina_id === maquinaId
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

    const maquina =
      this.formulario.maquinas
        .find(
          item =>
            item.maquina_id === maquinaId
        );


    const practica =
      this.asegurarPractica(

        maquinaId,

        maquina?.maquina_nombre

      );


    const horas =
      Number(valor);


    practica.horas =
      Number.isFinite(horas) &&
      horas >= 0
        ? horas
        : 0;

    this.cd.detectChanges();

  }


  // ==========================================================
  // ACTUALIZAR SESIONES
  // ==========================================================

  actualizarSesiones(
    maquinaId: number,
    valor: number | string
  ): void {

    const maquina =
      this.formulario.maquinas
        .find(
          item =>
            item.maquina_id === maquinaId
        );


    const practica =
      this.asegurarPractica(

        maquinaId,

        maquina?.maquina_nombre

      );


    const sesiones =
      Number(valor);


    practica.sesiones_totales =
      Number.isFinite(sesiones) &&
      sesiones >= 1
        ? Math.floor(sesiones)
        : 1;

    this.cd.detectChanges();

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
      Number(valor);


    this.formulario.cantidad_cuotas =
      Number.isFinite(cuotas) &&
      cuotas >= 1
        ? Math.floor(cuotas)
        : 1;

    this.cd.detectChanges();

  }


  // ==========================================================
  // TRACKING
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

    return (
      maquina.id ??
      maquina.maquina_id
    );

  }


  trackPractica(
    _index: number,
    practica: PlanHoraPractica
  ): number {

    return (
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


    // --------------------------------------------------------
    // MÁQUINAS
    // --------------------------------------------------------
    //
    // Aquí NO comparamos contra cantidad_maquinas.
    //
    // La cantidad del tipo se utilizará en matrícula.
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // IDS ÚNICOS
    // --------------------------------------------------------

    const ids =
      this.formulario.maquinas
        .map(
          maquina =>
            maquina.maquina_id
        );


    const idsUnicos =
      new Set(ids);


    if (
      idsUnicos.size !== ids.length
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


    // --------------------------------------------------------
    // VALIDAR PRÁCTICAS
    // --------------------------------------------------------

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
        Number(practica.horas) <= 0
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


    // --------------------------------------------------------
    // VALIDAR REGALOS
    // --------------------------------------------------------
    //
    // Un regalo nunca debe ser obligatorio.
    // --------------------------------------------------------

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
  // CONSTRUIR PAYLOAD
  // ==========================================================

  private construirPayload():
    PlanCursoPayload {

    return {

      tipo_curso_id:
        this.tipoCurso?.id ??
        this.formulario.tipo_curso_id,

      nombre:
        this.formulario.nombre.trim(),

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

      observaciones:
        this.formulario
          .observaciones
          ?.trim() ||
        null,

      maquinas:
        this.formulario.maquinas
          .map(
            maquina => ({

              id:
                maquina.id,

              maquina_id:
                maquina.maquina_id,

              orden:
                maquina.orden,

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
              this.formulario.maquinas
                .some(
                  maquina =>
                    maquina.maquina_id ===
                    practica.maquina_id
                )
          )
          .map(
            practica => ({

              id:
                practica.id,

              maquina_id:
                practica.maquina_id,

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

    if (this.guardando) {
      return;
    }


    if (!this.validarFormulario()) {
      return;
    }


    const payload =
      this.construirPayload();


    console.log(
      'Payload plan:',
      payload
    );


    this.guardando = true;

    this.cd.detectChanges();


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

        this.guardando = false;

        this.cd.detectChanges();


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

          timer: 1800,

          showConfirmButton: false

        });


        this.guardado.emit(
          response.data
        );

        this.cd.detectChanges();

      },


      error: error => {

        console.error(
          'Error al guardar plan:',
          error
        );


        this.guardando = false;

        this.cd.detectChanges();


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
  // CANCELAR
  // ==========================================================

  volver(): void {

    this.cancelar.emit();

  }

}

