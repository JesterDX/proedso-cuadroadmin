import {
  Component,
  inject,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import { CommonModule } from '@angular/common';

import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators
} from '@angular/forms';

import Swal from 'sweetalert2';

import {
  PlanCurso,
  PlanCursoPayload,
  PlanMaquina,
  PlanHoraPractica,
  PlanPrecio
} from '../../models/plan-curso.model';

import {
  PlanesCursoService
} from '../../services/planes-curso-admin';


@Component({
  selector: 'app-configurar-plan',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],

  templateUrl: './configurar-plan.html',
  styleUrl: './configurar-plan.scss'
})
export class ConfigurarPlanComponent
  implements OnInit {


  // ==========================================================
  // INYECCIONES
  // ==========================================================

  private readonly fb =
    inject(FormBuilder);

  private readonly service =
    inject(PlanesCursoService);

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly cd =
    inject(ChangeDetectorRef);


  // ==========================================================
  // DATOS
  // ==========================================================

  plan!: PlanCurso;

  maquinas: PlanMaquina[] = [];

  horasPractica: PlanHoraPractica[] = [];

  precios: PlanPrecio[] = [];


  // ==========================================================
  // ESTADO
  // ==========================================================

  modoNuevo = false;

  idPlan!: number;

  loading = false;

  error = '';


  // ==========================================================
  // FORMULARIO
  // ==========================================================

  form = this.fb.group({

    codigo: [
      '',
      Validators.required
    ],

    nombre: [
      '',
      Validators.required
    ],

    version: [
      1,
      [
        Validators.required,
        Validators.min(1)
      ]
    ],

    tipo_curso_id: [
      null as number | null,
      Validators.required
    ],

    permite_eleccion_personalizada: [
      false
    ],

    vigente_desde: [
      ''
    ],

    vigente_hasta: [
      ''
    ],

    observaciones: [
      ''
    ]

  });


  // ==========================================================
  // INIT
  // ==========================================================

  ngOnInit(): void {

    const id =
      this.route.snapshot.paramMap.get('id');


    this.modoNuevo =
      !id;


    // ========================================================
    // NUEVO
    // ========================================================

    if (this.modoNuevo) {

      this.idPlan = 0;

      this.plan = {

        id: 0,

        codigo: '',

        nombre: '',

        version: 1,

        tipo_curso_id: 0,

        tipo_curso_nombre: '',

        vigente_desde: null,

        vigente_hasta: null,

        permite_eleccion_personalizada:
          false,

        activo: true,

        observaciones: null,

        maquinas: [],

        horas_practica: [],

        precios: []

      };


      this.form.patchValue({

        version: 1,

        permite_eleccion_personalizada:
          false

      });


      this.inicializarConfiguracionNueva();

      return;

    }


    // ========================================================
    // EDITAR
    // ========================================================

    this.idPlan =
      Number(id);


    if (
      !Number.isFinite(this.idPlan) ||
      this.idPlan <= 0
    ) {

      this.error =
        'El identificador del plan no es válido.';

      return;

    }


    this.cargarPlan();

  }


  // ==========================================================
  // INICIALIZAR NUEVO
  // ==========================================================

  private inicializarConfiguracionNueva(): void {

    this.maquinas = [];

    this.horasPractica = [];

    this.precios = [];

    this.loading = false;

    this.error = '';

    this.cd.detectChanges();

  }


  // ==========================================================
  // CARGAR PLAN
  // ==========================================================

  cargarPlan(): void {

    this.loading = true;

    this.error = '';

    this.cd.detectChanges();


    this.service
      .obtenerPorId(this.idPlan)
      .subscribe({

        next: (res) => {

          console.log(
            'RESPUESTA OBTENER PLAN:',
            res
          );


          if (!res.ok || !res.data) {

            this.error =
              res.message ??
              'No se encontró el plan.';

            this.loading = false;

            this.cd.detectChanges();

            return;

          }


          this.plan =
            res.data;


          // ==================================================
          // FORMULARIO
          // ==================================================

          this.form.patchValue({

            codigo:
              this.plan.codigo,

            nombre:
              this.plan.nombre,

            version:
              this.plan.version,

            tipo_curso_id:
              this.plan.tipo_curso_id,

            permite_eleccion_personalizada:
              this.plan.permite_eleccion_personalizada,

            vigente_desde:
              this.plan.vigente_desde ?? '',

            vigente_hasta:
              this.plan.vigente_hasta ?? '',

            observaciones:
              this.plan.observaciones ?? ''

          });


          // ==================================================
          // CONFIGURACIÓN
          // ==================================================

          this.maquinas =
            (this.plan.maquinas ?? [])
              .map(maquina => ({
                ...maquina
              }));


          this.horasPractica =
            (this.plan.horas_practica ?? [])
              .map(hora => ({
                ...hora
              }));


          this.precios =
            (this.plan.precios ?? [])
              .map(precio => ({
                ...precio
              }));


          this.loading = false;

          this.cd.detectChanges();

        },

        error: (err) => {

          console.error(
            'ERROR OBTENER PLAN:',
            err
          );

          this.error =
            'Error al cargar la información del plan.';

          this.loading = false;

          this.cd.detectChanges();

        }

      });

  }


  // ==========================================================
  // AGREGAR MÁQUINA
  // ==========================================================

  agregarMaquina(
    maquina: PlanMaquina
  ): void {

    const existe =
      this.maquinas.some(
        m =>
          Number(m.maquina_id) ===
          Number(maquina.maquina_id)
      );


    if (existe) {

      return;

    }


    this.maquinas.push({

      ...maquina,

      orden:
        this.maquinas.length + 1,

      es_regalo:
        maquina.es_regalo ?? false,

      obligatoria:
        maquina.obligatoria ?? true

    });

  }


  // ==========================================================
  // ELIMINAR MÁQUINA
  // ==========================================================

  eliminarMaquina(
    index: number
  ): void {

    if (
      index < 0 ||
      index >= this.maquinas.length
    ) {

      return;

    }


    this.maquinas.splice(
      index,
      1
    );


    this.reordenarMaquinas();

  }


  // ==========================================================
  // REORDENAR MÁQUINAS
  // ==========================================================

  private reordenarMaquinas(): void {

    this.maquinas =
      this.maquinas.map(
        (maquina, index) => ({

          ...maquina,

          orden:
            index + 1

        })
      );

  }


  // ==========================================================
  // AGREGAR HORAS
  // ==========================================================

  agregarHoraPractica(
    maquinaId: number
  ): void {

    const existe =
      this.horasPractica.some(
        h =>
          Number(h.maquina_id) ===
          Number(maquinaId)
      );


    if (existe) {

      return;

    }


    this.horasPractica.push({

      maquina_id:
        maquinaId,

      horas: 1,

      sesiones_totales: 1

    });

  }


  // ==========================================================
  // ELIMINAR HORAS
  // ==========================================================

  eliminarHoraPractica(
    index: number
  ): void {

    if (
      index < 0 ||
      index >= this.horasPractica.length
    ) {

      return;

    }


    this.horasPractica.splice(
      index,
      1
    );

  }


  // ==========================================================
  // AGREGAR PRECIO
  // ==========================================================

  agregarPrecio(): void {

    this.precios.push({

      nombre:
        '',

      monto_total:
        null,

      matricula:
        0,

      certificacion:
        0,

      cantidad_cuotas:
        0,

      monto_cuota:
        null,

      vigente_desde:
        null,

      vigente_hasta:
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

  }


  // ==========================================================
  // ELIMINAR PRECIO
  // ==========================================================

  eliminarPrecio(
    index: number
  ): void {

    if (
      index < 0 ||
      index >= this.precios.length
    ) {

      return;

    }


    this.precios.splice(
      index,
      1
    );

  }


  // ==========================================================
  // VALIDAR FORMULARIO
  // ==========================================================

  private validarAntesDeGuardar(): boolean {

    if (
      this.form.invalid
    ) {

      this.form.markAllAsTouched();

      Swal.fire({

        icon: 'warning',

        title:
          'Datos incompletos',

        text:
          'Completa los campos obligatorios del plan.'

      });

      return false;

    }


    if (
      this.maquinas.length === 0
    ) {

      Swal.fire({

        icon: 'warning',

        title:
          'Máquinas requeridas',

        text:
          'Debes agregar al menos una máquina al plan.'

      });

      return false;

    }


    // ========================================================
    // VALIDAR HORAS
    // ========================================================

    for (
      const hora of this.horasPractica
    ) {

      if (
        !hora.maquina_id ||
        Number(hora.horas) <= 0 ||
        Number(hora.sesiones_totales) <= 0
      ) {

        Swal.fire({

          icon: 'warning',

          title:
            'Horas de práctica inválidas',

          text:
            'Verifica las horas y sesiones de cada máquina.'

        });

        return false;

      }

    }


    // ========================================================
    // VALIDAR PRECIOS
    // ========================================================

    for (
      const precio of this.precios
    ) {

      if (
        !precio.nombre?.trim()
      ) {

        Swal.fire({

          icon: 'warning',

          title:
            'Precio incompleto',

          text:
            'Cada opción de precio debe tener un nombre.'

        });

        return false;

      }


      if (
        precio.cantidad_cuotas < 0
      ) {

        Swal.fire({

          icon: 'warning',

          title:
            'Cantidad de cuotas inválida',

          text:
            'La cantidad de cuotas no puede ser negativa.'

        });

        return false;

      }

    }


    return true;

  }


  // ==========================================================
  // CONSTRUIR PAYLOAD
  // ==========================================================

  private construirPayload(): PlanCursoPayload {

    const valor =
      this.form.getRawValue();


    return {

      codigo:
        valor.codigo?.trim() ?? '',

      nombre:
        valor.nombre?.trim() ?? '',

      version:
        Number(valor.version ?? 1),

      tipo_curso_id:
        Number(valor.tipo_curso_id),

      permite_eleccion_personalizada:
        Boolean(
          valor.permite_eleccion_personalizada
        ),

      vigente_desde:
        valor.vigente_desde || null,

      vigente_hasta:
        valor.vigente_hasta || null,

      activo:
        this.plan?.activo ?? true,

      observaciones:
        valor.observaciones?.trim() || null,

      maquinas:
        this.maquinas.map(
          maquina => ({

            id:
              maquina.id,

            maquina_id:
              Number(maquina.maquina_id),

            orden:
              Number(maquina.orden),

            es_regalo:
              Boolean(maquina.es_regalo),

            obligatoria:
              Boolean(maquina.obligatoria)

          })
        ),

      horas_practica:
        this.horasPractica.map(
          hora => ({

            id:
              hora.id,

            maquina_id:
              Number(hora.maquina_id),

            horas:
              Number(hora.horas),

            sesiones_totales:
              Number(hora.sesiones_totales)

          })
        ),

      precios:
        this.precios.map(
          precio => ({

            id:
              precio.id,

            nombre:
              precio.nombre.trim(),

            monto_total:
              precio.monto_total !== null &&
              precio.monto_total !== undefined
                ? Number(precio.monto_total)
                : null,

            matricula:
              Number(precio.matricula ?? 0),

            certificacion:
              Number(precio.certificacion ?? 0),

            cantidad_cuotas:
              Number(precio.cantidad_cuotas ?? 0),

            monto_cuota:
              precio.monto_cuota !== null &&
              precio.monto_cuota !== undefined
                ? Number(precio.monto_cuota)
                : null,

            vigente_desde:
              precio.vigente_desde || null,

            vigente_hasta:
              precio.vigente_hasta || null,

            activo:
              Boolean(precio.activo),

            observaciones:
              precio.observaciones?.trim() || null,

            aplica_maquina_id:
              precio.aplica_maquina_id
                ? Number(precio.aplica_maquina_id)
                : null,

            requiere_tractor:
              Boolean(precio.requiere_tractor)

          })
        )

    };

  }


  // ==========================================================
  // GUARDAR TODO
  // ==========================================================

  guardarTodo(): void {

    if (
      this.loading
    ) {

      return;

    }


    if (
      !this.validarAntesDeGuardar()
    ) {

      return;

    }


    const payload =
      this.construirPayload();


    console.log(
      'PAYLOAD PLAN:',
      payload
    );


    this.loading = true;

    this.error = '';

    this.cd.detectChanges();


    // ========================================================
    // CREAR
    // ========================================================

    if (
      this.modoNuevo
    ) {

      this.service
        .crear(payload)
        .subscribe({

          next: (res) => {

            console.log(
              'PLAN CREADO:',
              res
            );


            this.loading = false;

            this.cd.detectChanges();


            Swal.fire({

              icon: 'success',

              title:
                'Plan creado',

              text:
                'El plan de curso se creó correctamente.',

              confirmButtonText:
                'Aceptar'

            }).then(() => {

              this.router.navigate([
                '/admin/planes-curso'
              ]);

            });

          },

          error: (err) => {

            console.error(
              'ERROR CREANDO PLAN:',
              err
            );


            this.loading = false;

            this.error =
              err?.error?.message ??
              'No se pudo crear el plan de curso.';


            this.cd.detectChanges();


            Swal.fire({

              icon: 'error',

              title:
                'Error',

              text:
                this.error

            });

          }

        });


      return;

    }


    // ========================================================
    // ACTUALIZAR
    // ========================================================

    this.service
      .actualizar(
        this.idPlan,
        payload
      )
      .subscribe({

        next: (res) => {

          console.log(
            'PLAN ACTUALIZADO:',
            res
          );


          this.loading = false;

          this.cd.detectChanges();


          Swal.fire({

            icon: 'success',

            title:
              'Plan actualizado',

            text:
              'El plan de curso se actualizó correctamente.',

            confirmButtonText:
              'Aceptar'

          }).then(() => {

            this.router.navigate([
              '/admin/planes-curso'
            ]);

          });

        },

        error: (err) => {

          console.error(
            'ERROR ACTUALIZANDO PLAN:',
            err
          );


          this.loading = false;

          this.error =
            err?.error?.message ??
            'No se pudo actualizar el plan de curso.';


          this.cd.detectChanges();


          Swal.fire({

            icon: 'error',

            title:
              'Error',

            text:
              this.error

          });

        }

      });

  }


  // ==========================================================
  // CANCELAR
  // ==========================================================

  cancelar(): void {

    this.router.navigate([
      '/admin/planes-curso'
    ]);

  }

}
