import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
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


// ============================================================
// COMPONENTE
// ============================================================

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
  //
  // El código del plan ya NO se configura aquí.
  //
  // El backend lo genera automáticamente:
  //
  // PLAN-INDIVIDUAL-001
  // PLAN-DOBLE-001
  // PLAN-TRIPLE-001
  // PLAN-MULTIPLE-001
  //
  // Tampoco configuramos:
  // - versión
  // - vigencia
  // - estado
  // - precios
  //
  // La cantidad de cuotas sí se configura porque el backend
  // la utiliza para crear/actualizar el precio compatible
  // con el sistema actual.
  //

  formulario: PlanCursoPayload = {

    tipo_curso_id: 0,

    nombre: '',

    permite_eleccion_personalizada: false,

    cantidad_cuotas: 1,

    observaciones: null,

    maquinas: [],

    horas_practica: []

  };


  // ============================================================
  // GETTERS
  // ============================================================

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


  // ------------------------------------------------------------
  // CANTIDAD DE MÁQUINAS SELECCIONADAS
  // ------------------------------------------------------------

  get cantidadMaquinasSeleccionadas(): number {

    return this.formulario.maquinas.length;

  }


  // ------------------------------------------------------------
  // CANTIDAD DEFINIDA POR EL TIPO
  // ------------------------------------------------------------

  get cantidadMaquinasPermitidas(): number {

    return this.tipoCurso?.cantidad_maquinas ?? 0;

  }


  // ------------------------------------------------------------
  // ¿ESTÁN COMPLETAS?
  // ------------------------------------------------------------

  get maquinasCompletas(): boolean {

    if (!this.tipoCurso) {

      return false;

    }

    return (
      this.formulario.maquinas.length ===
      Number(this.tipoCurso.cantidad_maquinas)
    );

  }


  // ------------------------------------------------------------
  // MÁQUINAS RESTANTES
  // ------------------------------------------------------------

  get maquinasRestantes(): number {

    return Math.max(
      0,
      this.cantidadMaquinasPermitidas -
      this.cantidadMaquinasSeleccionadas
    );

  }


  // ============================================================
  // INIT
  // ============================================================

  ngOnInit(): void {

    this.inicializarFormulario();

    this.cargarMaquinas();

  }


  // ============================================================
  // INICIALIZAR FORMULARIO
  // ============================================================

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


    // ----------------------------------------------------------
    // EDICIÓN
    // ----------------------------------------------------------

    if (this.plan) {

      this.cargarPlanExistente(
        this.plan
      );

    }

  }


  // ============================================================
  // CARGAR PLAN EXISTENTE
  // ============================================================

  private cargarPlanExistente(
    plan: PlanCurso
  ): void {

    // ----------------------------------------------------------
    // CANTIDAD DE CUOTAS
    // ----------------------------------------------------------
    //
    // El backend devuelve precios porque la tabla
    // plan_precios sigue existiendo.
    //
    // Nosotros solamente usamos la cantidad de cuotas.
    //
    // No modificamos montos.
    //

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


    // ----------------------------------------------------------
    // CONSTRUIR FORMULARIO
    // ----------------------------------------------------------

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


    // ----------------------------------------------------------
    // ASEGURAR PRÁCTICAS
    // ----------------------------------------------------------

    this.asegurarPracticasDeMaquinas();

  }


  // ============================================================
  // CARGAR MÁQUINAS
  // ============================================================

  private cargarMaquinas(): void {

    this.cargando = true;


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

        },


        error: error => {

          console.error(
            'Error al cargar máquinas:',
            error
          );


          this.cargando = false;


          Swal.fire({

            icon: 'error',

            title: 'Error',

            text:
              'No se pudieron cargar las máquinas.'

          });

        }

      });

  }


  // ============================================================
  // SELECCIÓN DE MÁQUINAS
  // ============================================================

  estaMaquinaSeleccionada(
    maquinaId: number
  ): boolean {

    return this.formulario.maquinas.some(
      maquina =>
        maquina.maquina_id ===
        maquinaId
    );

  }


  // ============================================================
  // TOGGLE MÁQUINA
  // ============================================================

  toggleMaquina(
    maquina: Maquina
  ): void {

    const index =
      this.formulario.maquinas
        .findIndex(
          item =>
            item.maquina_id ===
            maquina.id
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
    // VALIDAR TIPO DE CURSO
    // ----------------------------------------------------------

    if (!this.tipoCurso) {

      Swal.fire({

        icon: 'error',

        title:
          'Tipo de curso no disponible',

        text:
          'No se pudo determinar la cantidad de máquinas permitidas.'

      });

      return;

    }


    // ----------------------------------------------------------
    // VALIDAR LÍMITE
    // ----------------------------------------------------------

    if (
      this.formulario.maquinas.length >=
      Number(
        this.tipoCurso.cantidad_maquinas
      )
    ) {

      Swal.fire({

        icon: 'warning',

        title:
          'Límite alcanzado',

        text:
          `Este tipo de curso requiere exactamente ` +
          `${this.tipoCurso.cantidad_maquinas} máquina(s).`

      });

      return;

    }


    // ----------------------------------------------------------
    // AGREGAR
    // ----------------------------------------------------------

    const nuevaMaquina:
      PlanMaquina = {

        maquina_id:
          maquina.id,

        maquina_nombre:
          maquina.nombre,

        orden:
          this.formulario.maquinas.length +
          1,

        es_regalo:
          false,

        obligatoria:
          true

      };


    this.formulario.maquinas.push(
      nuevaMaquina
    );


    // ----------------------------------------------------------
    // CREAR CONFIGURACIÓN DE PRÁCTICA
    // ----------------------------------------------------------

    this.asegurarPractica(
      maquina.id,
      maquina.nombre
    );


    this.reordenarMaquinas();

  }


  // ============================================================
  // QUITAR MÁQUINA
  // ============================================================

  quitarMaquina(
    maquinaId: number
  ): void {

    const index =
      this.formulario.maquinas
        .findIndex(
          maquina =>
            maquina.maquina_id ===
            maquinaId
        );


    if (index < 0) {

      return;

    }


    this.formulario.maquinas.splice(
      index,
      1
    );


    // ----------------------------------------------------------
    // ELIMINAR PRÁCTICA ASOCIADA
    // ----------------------------------------------------------

    this.formulario.horas_practica =
      this.formulario.horas_practica
        .filter(
          practica =>
            practica.maquina_id !==
            maquinaId
        );


    this.reordenarMaquinas();

  }


  // ============================================================
  // REORDENAR
  // ============================================================

  private reordenarMaquinas(): void {

    this.formulario.maquinas
      .forEach(
        (maquina, index) => {

          maquina.orden =
            index + 1;

        }
      );

  }


  // ============================================================
  // PRÁCTICAS
  // ============================================================

  obtenerPractica(
    maquinaId: number
  ):
    PlanHoraPractica | undefined {

    return this.formulario
      .horas_practica
      .find(
        practica =>
          practica.maquina_id ===
          maquinaId
      );

  }


  // ============================================================
  // ASEGURAR PRÁCTICA
  // ============================================================

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


  // ============================================================
  // ASEGURAR PRÁCTICAS DE TODAS LAS MÁQUINAS
  // ============================================================

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


  // ============================================================
  // ACTUALIZAR HORAS
  // ============================================================

  actualizarHoras(
    maquinaId: number,
    valor: number | string
  ): void {

    const maquina =
      this.formulario.maquinas
        .find(
          item =>
            item.maquina_id ===
            maquinaId
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

  }


  // ============================================================
  // ACTUALIZAR SESIONES
  // ============================================================

  actualizarSesiones(
    maquinaId: number,
    valor: number | string
  ): void {

    const maquina =
      this.formulario.maquinas
        .find(
          item =>
            item.maquina_id ===
            maquinaId
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

  }


  // ============================================================
  // HORAS POR SESIÓN
  // ============================================================

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


  // ============================================================
  // ELIMINAR PRÁCTICA
  // ============================================================
  //
  // La práctica realmente debe existir para cada máquina
  // seleccionada.
  //
  // Por eso no eliminamos manualmente la práctica desde la
  // configuración. Si se quita la máquina, se elimina su
  // práctica automáticamente.
  //

  eliminarPracticaDeMaquina(
    maquinaId: number
  ): void {

    const maquinaSeleccionada =
      this.estaMaquinaSeleccionada(
        maquinaId
      );


    if (!maquinaSeleccionada) {

      return;

    }


    Swal.fire({

      icon: 'info',

      title:
        'Práctica asociada a la máquina',

      text:
        'Las horas de práctica pertenecen a una máquina seleccionada. Para eliminarlas, debes quitar la máquina del plan.',

      confirmButtonText:
        'Entendido'

    });

  }


  // ============================================================
  // VALIDAR CANTIDAD DE CUOTAS
  // ============================================================

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

  }


  // ============================================================
  // TRACKING
  // ============================================================

  trackMaquina(
    index: number,
    maquina: Maquina
  ): number {

    return maquina.id;

  }


  trackPlanMaquina(
    index: number,
    maquina: PlanMaquina
  ): number {

    return (
      maquina.id ??
      maquina.maquina_id
    );

  }


  trackPractica(
    index: number,
    practica: PlanHoraPractica
  ): number {

    return (
      practica.id ??
      practica.maquina_id
    );

  }


  // ============================================================
  // VALIDACIÓN
  // ============================================================

  private validarFormulario(): boolean {

    // ----------------------------------------------------------
    // TIPO DE CURSO
    // ----------------------------------------------------------

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


    // ----------------------------------------------------------
    // NOMBRE
    // ----------------------------------------------------------

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


    // ----------------------------------------------------------
    // CUOTAS
    // ----------------------------------------------------------

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


    // ----------------------------------------------------------
    // MÁQUINAS
    // ----------------------------------------------------------

    const cantidadPermitida =
      Number(
        this.tipoCurso.cantidad_maquinas
      );


    const cantidadSeleccionada =
      this.formulario.maquinas.length;


    if (
      cantidadSeleccionada !==
      cantidadPermitida
    ) {

      Swal.fire({

        icon: 'warning',

        title:
          'Cantidad de máquinas incorrecta',

        text:
          `El tipo "${this.tipoCurso.nombre}" ` +
          `requiere exactamente ` +
          `${cantidadPermitida} máquina(s). ` +
          `Actualmente seleccionaste ` +
          `${cantidadSeleccionada}.`

      });

      return false;

    }


    // ----------------------------------------------------------
    // MÁQUINAS DUPLICADAS
    // ----------------------------------------------------------

    const ids =
      this.formulario.maquinas
        .map(
          maquina =>
            maquina.maquina_id
        );


    const idsUnicos =
      new Set(ids);


    if (
      idsUnicos.size !==
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


    // ----------------------------------------------------------
    // PRÁCTICAS
    // ----------------------------------------------------------

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


      // --------------------------------------------------------
      // HORAS
      // --------------------------------------------------------

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


      // --------------------------------------------------------
      // SESIONES
      // --------------------------------------------------------

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


    return true;

  }


  // ============================================================
  // CONSTRUIR PAYLOAD
  // ============================================================

  private construirPayload():
    PlanCursoPayload {

    return {

      // --------------------------------------------------------
      // TIPO
      // --------------------------------------------------------

      tipo_curso_id:
        this.tipoCurso?.id ??
        this.formulario.tipo_curso_id,


      // --------------------------------------------------------
      // NOMBRE
      // --------------------------------------------------------

      nombre:
        this.formulario.nombre.trim(),


      // --------------------------------------------------------
      // ELECCIÓN PERSONALIZADA
      // --------------------------------------------------------
      //
      // OJO:
      //
      // Esto NO cambia la cantidad de máquinas.
      //
      // Si el tipo requiere 5:
      //
      // personalizada = true
      //
      // sigue significando exactamente 5 máquinas.
      //

      permite_eleccion_personalizada:
        Boolean(
          this.formulario
            .permite_eleccion_personalizada
        ),


      // --------------------------------------------------------
      // CUOTAS
      // --------------------------------------------------------

      cantidad_cuotas:
        Number(
          this.formulario
            .cantidad_cuotas
        ),


      // --------------------------------------------------------
      // OBSERVACIONES
      // --------------------------------------------------------

      observaciones:
        this.formulario
          .observaciones
          ?.trim() ||
        null,


      // --------------------------------------------------------
      // MÁQUINAS
      // --------------------------------------------------------

      maquinas:
        this.formulario.maquinas
          .map(
            maquina => ({

              // No necesitamos enviar el ID de
              // plan_maquinas al crear.
              //
              // Para actualizar también puede venir,
              // pero el backend puede ignorarlo.

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


      // --------------------------------------------------------
      // HORAS DE PRÁCTICA
      // --------------------------------------------------------

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


  // ============================================================
  // GUARDAR
  // ============================================================

  guardar(): void {

    // ----------------------------------------------------------
    // EVITAR DOBLE ENVÍO
    // ----------------------------------------------------------

    if (this.guardando) {

      return;

    }


    // ----------------------------------------------------------
    // VALIDAR
    // ----------------------------------------------------------

    if (
      !this.validarFormulario()
    ) {

      return;

    }


    // ----------------------------------------------------------
    // PAYLOAD
    // ----------------------------------------------------------

    const payload =
      this.construirPayload();


    console.log(
      'Payload plan:',
      payload
    );


    // ----------------------------------------------------------
    // ESTADO
    // ----------------------------------------------------------

    this.guardando = true;


    // ----------------------------------------------------------
    // OPERACIÓN
    // ----------------------------------------------------------

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


    // ----------------------------------------------------------
    // SUSCRIPCIÓN
    // ----------------------------------------------------------

    operacion.subscribe({

      next: response => {

        this.guardando = false;


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

      },


      error: error => {

        console.error(
          'Error al guardar plan:',
          error
        );


        this.guardando = false;


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


  // ============================================================
  // CANCELAR
  // ============================================================

  volver(): void {

    this.cancelar.emit();

  }

}
