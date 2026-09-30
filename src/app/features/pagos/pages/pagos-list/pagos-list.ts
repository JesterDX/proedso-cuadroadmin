import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagosService } from '../../services/pagos.service';

@Component({
  selector: 'app-pagos-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pagos-list.html',
  styleUrls: ['./pagos-list.scss']
})
export class PagosList implements OnInit {

  // ============================================================
  // EXPONER OBJETOS NATIVOS PARA EL TEMPLATE ANGULAR
  // ============================================================

  readonly Math = Math;
  readonly Number = Number;


  // ============================================================
  // INYECCIÓN
  // ============================================================

  private pagosService = inject(PagosService);
  private cd = inject(ChangeDetectorRef);


  // ============================================================
  // UI STATE
  // ============================================================

  loading = false;

  modalOpen = false;

  miniModalOpen = false;

  editandoFechas = false;

  modalManualAbierto = false;

  modalEditarCuota = false;

  cuotaEditando: any = null;

  formEditarCuota = {
    monto: null as number | null
  };

  mesMatricula: string = '';

  anioMatricula: string = '';

  gruposPaginados: any[] = [];

  aniosDisponibles: number[] = [];

  tab: 'cuotas' | 'historial' | 'pago' = 'cuotas';


  // ============================================================
  // DATA GENERAL
  // ============================================================

  alumnos: any[] = [];

  alumnosFiltrados: any[] = [];

  alumnosAgrupados: any[] = [];

  cuotasDetalle: any[] = [];

  historial: any[] = [];


  // ============================================================
  // EDITAR PAGO
  // ============================================================

  pagoEditando: any = null;

  modalEditarPago = false;

  formEditarPago = {
    monto: null as number | null,
    metodo_pago: 'EFECTIVO'
  };

  fileEditarPago: File | null = null;


  // ============================================================
  // ALUMNO / PAGO RÁPIDO
  // ============================================================

  alumnoSeleccionado: any = null;

  miniPago: any = null;


  // ============================================================
  // BÚSQUEDA PLAN MANUAL
  // ============================================================

  resultadosBusqueda: any[] = [];

  matriculaSeleccionada: any = null;

  timeoutBusqueda: any;


  // ============================================================
  // PAGINACIÓN Y FILTROS
  // ============================================================

  paginaActual = 1;

  itemsPorPagina = 8;

  totalPaginas = 1;

  paginas: number[] = [];

  search = '';

  estado = '';


  // ============================================================
  // ARCHIVOS
  // ============================================================

  selectedFile: File | null = null;

  miniFile: File | null = null;


  // ============================================================
  // FORMULARIOS
  // ============================================================

  formPago = {
    cuota_id: null as number | null,
    monto: null as number | null,
    metodo_pago: 'EFECTIVO'
  };


  miniPagoForm = {
    cuota_id: null as number | null,
    monto: null as number | null,
    metodo_pago: 'EFECTIVO'
  };


  formRecalculo = {
    tipo: 'MENSUAL' as 'MENSUAL' | 'QUINCENAL',
    fecha_inicio: new Date().toISOString().split('T')[0],
    cantidad_cuotas: 4
  };


  // ============================================================
  // FORMULARIO PLAN MANUAL
  // ============================================================

  formularioPlan: {
    matricula_id: number | null;

    modalidad_pago:
      | 'MENSUAL'
      | 'QUINCENAL'
      | 'PERSONALIZADO';

    monto_total: number | null;

    monto_matricula: number;

    monto_certificacion: number;

    cuotas: {
      numero_cuota: number;
      fecha_vencimiento: string;
      monto: number | null;
      observaciones: string;
    }[];
  } = {

    matricula_id: null,

    modalidad_pago: 'MENSUAL',

    monto_total: null,

    monto_matricula: 0,

    monto_certificacion: 0,

    cuotas: []
  };


  cuotaTemporal = {

    numero_cuota: 1,

    fecha_vencimiento: '',

    monto: null as number | null,

    observaciones: ''
  };


  // ============================================================
  // NOTIFICACIONES
  // ============================================================

  notificacion = {

    visible: false,

    mensaje: '',

    tipo: 'success' as
      | 'success'
      | 'error'
      | 'warning'
  };


  // ============================================================
  // INIT
  // ============================================================

  ngOnInit() {

    this.cargar();

  }


  // ============================================================
  // CARGA PRINCIPAL
  // ============================================================

  cargar() {

    this.loading = true;

    this.pagosService.resumen().subscribe({

      next: (data) => {

        this.alumnos = data || [];

        const anios = this.alumnos

          .map(a =>
            new Date(
              a.fecha_matricula
            ).getFullYear()
          )

          .filter(a =>
            !isNaN(a)
          );


        this.aniosDisponibles =
          [...new Set(anios)]
            .sort(
              (a, b) => b - a
            );


        this.filtrar();

        this.loading = false;

        this.cd.detectChanges();

      },

      error: (err) => {

        console.error(
          'Error cargando pagos:',
          err
        );

        this.loading = false;

      }

    });

  }


  // ============================================================
  // ARCHIVO EDITAR PAGO
  // ============================================================

  onEditarFileSelected(e: any) {

    this.fileEditarPago =
      e.target.files?.[0] || null;

  }


  // ============================================================
  // FILTRO + PAGINACIÓN + AGRUPACIÓN
  // ============================================================

  filtrar(reset = true) {

    if (reset) {

      this.paginaActual = 1;

    }


    const search =
      this.search
        .toLowerCase()
        .trim();


    const filtrados =
      this.alumnos.filter(a => {

        const cumpleBusqueda =

          !search ||

          a.alumno
            ?.toLowerCase()
            .includes(search) ||

          a.plan_nombre
            ?.toLowerCase()
            .includes(search);


        const cumpleEstado =

          !this.estado ||

          (
            this.estado === 'PAGADO' &&
            !a.tiene_deuda
          ) ||

          (
            this.estado === 'PENDIENTE' &&
            a.tiene_deuda
          );


        const fechaAgrupacion =

          a.fecha_inicio ||

          a.fecha_matricula ||

          null;


        let cumpleFecha = true;


        if (fechaAgrupacion) {

          const fecha =
            new Date(fechaAgrupacion);


          if (!isNaN(fecha.getTime())) {

            const mes =
              fecha.getMonth() + 1;

            const anio =
              fecha.getFullYear();


            if (
              this.mesMatricula &&
              mes !== Number(
                this.mesMatricula
              )
            ) {

              cumpleFecha = false;

            }


            if (
              this.anioMatricula &&
              anio !== Number(
                this.anioMatricula
              )
            ) {

              cumpleFecha = false;

            }

          }

        }


        return (
          cumpleBusqueda &&
          cumpleEstado &&
          cumpleFecha
        );

      });


    filtrados.sort((a, b) => {

      const fechaA =
        a.fecha_inicio ||
        a.fecha_matricula ||
        null;

      const fechaB =
        b.fecha_inicio ||
        b.fecha_matricula ||
        null;


      if (!fechaA && !fechaB) {
        return 0;
      }


      if (!fechaA) {
        return 1;
      }


      if (!fechaB) {
        return -1;
      }


      const tiempoA =
        new Date(fechaA).getTime();

      const tiempoB =
        new Date(fechaB).getTime();


      if (tiempoA !== tiempoB) {
        return tiempoB - tiempoA;
      }


      return (
        a.alumno || ''
      ).localeCompare(
        b.alumno || '',
        'es',
        {
          sensitivity: 'base'
        }
      );

    });


    this.totalPaginas =
      Math.ceil(
        filtrados.length /
        this.itemsPorPagina
      );


    if (this.totalPaginas === 0) {
      this.totalPaginas = 1;
    }


    const inicio =
      (this.paginaActual - 1) *
      this.itemsPorPagina;


    const fin =
      inicio +
      this.itemsPorPagina;


    const paginaActualData =
      filtrados.slice(
        inicio,
        fin
      );


    this.alumnosFiltrados =
      filtrados;


    this.paginas =
      Array.from(
        {
          length:
            this.totalPaginas
        },
        (_, i) => i + 1
      );


    const meses = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre'
    ];


    const grupos: {
      [key: string]: {
        anio: number | null;
        mesNumero: number | null;
        mes: string;
        fechaReferencia: string | null;
        alumnos: any[];
      }
    } = {};


    paginaActualData.forEach(
      alumno => {

        const fechaReferencia =
          alumno.fecha_inicio ||
          alumno.fecha_matricula ||
          null;


        if (!fechaReferencia) {

          const key =
            'SIN_FECHA';


          if (!grupos[key]) {

            grupos[key] = {

              anio: null,
              mesNumero: null,
              mes: 'Sin fecha',
              fechaReferencia: null,
              alumnos: []

            };

          }


          grupos[key]
            .alumnos
            .push(alumno);


          return;

        }


        const fecha =
          new Date(
            fechaReferencia
          );


        if (
          isNaN(
            fecha.getTime()
          )
        ) {

          const key =
            'SIN_FECHA';


          if (!grupos[key]) {

            grupos[key] = {

              anio: null,
              mesNumero: null,
              mes: 'Sin fecha',
              fechaReferencia: null,
              alumnos: []

            };

          }


          grupos[key]
            .alumnos
            .push(alumno);


          return;

        }


        const anio =
          fecha.getFullYear();

        const mes =
          fecha.getMonth();

        const key =
          `${anio}-${mes}`;


        if (!grupos[key]) {

          grupos[key] = {

            anio,
            mesNumero: mes,
            mes:
              `${meses[mes]} ${anio}`,
            fechaReferencia,
            alumnos: []

          };

        }


        grupos[key]
          .alumnos
          .push(alumno);

      });


    this.gruposPaginados =
      Object.values(grupos)
        .sort(
          (a: any, b: any) => {

            if (
              a.anio === null &&
              b.anio !== null
            ) {
              return 1;
            }


            if (
              a.anio !== null &&
              b.anio === null
            ) {
              return -1;
            }


            if (
              a.anio === null &&
              b.anio === null
            ) {
              return 0;
            }


            if (a.anio !== b.anio) {
              return b.anio - a.anio;
            }


            return (
              b.mesNumero -
              a.mesNumero
            );

          }
        );


    this.cd.detectChanges();

  }


  // ============================================================
  // PAGINACIÓN
  // ============================================================

  cambiarPagina(p: number) {

    if (
      p < 1 ||
      p > this.totalPaginas
    ) {
      return;
    }

    this.paginaActual = p;

    this.filtrar(false);

  }


  paginaAnterior() {

    if (
      this.paginaActual > 1
    ) {

      this.paginaActual--;

      this.filtrar(false);

    }

  }


  paginaSiguiente() {

    if (
      this.paginaActual <
      this.totalPaginas
    ) {

      this.paginaActual++;

      this.filtrar(false);

    }

  }


  // ============================================================
  // EDITAR PAGO REGISTRADO
  // ============================================================

  editarPago(pago: any) {

    this.pagoEditando =
      pago;


    this.formEditarPago = {

      monto:
        Number(
          pago.monto || 0
        ),

      metodo_pago:
        pago.metodo_pago ||
        'EFECTIVO'

    };


    this.modalEditarPago =
      true;

  }


  guardarEditarPago() {

    if (
      !this.pagoEditando
    ) {
      return;
    }


    const formData =
      new FormData();


    formData.append(
      'monto',
      String(
        this.formEditarPago.monto
      )
    );


    formData.append(
      'metodo_pago',
      this.formEditarPago
        .metodo_pago
    );


    if (
      this.fileEditarPago
    ) {

      formData.append(
        'comprobante',
        this.fileEditarPago
      );

    }


    this.pagosService
      .editarPago(
        this.pagoEditando.id,
        formData
      )
      .subscribe({

        next: () => {

          this.mostrarNotificacion(
            'Pago actualizado correctamente',
            'success'
          );


          this.modalEditarPago =
            false;


          this.fileEditarPago =
            null;


          if (
            this.alumnoSeleccionado
              ?.matricula_id
          ) {

            this.cargarHistorial(
              this.alumnoSeleccionado
                .matricula_id
            );


            this.verDetalle(
              this.alumnoSeleccionado
                .matricula_id
            );

          }

        },


        error: (err) => {

          console.error(
            err
          );


          this.mostrarNotificacion(
            err?.error?.message ||
            'Error al editar pago',
            'error'
          );

        }

      });

  }


  // ============================================================
  // ELIMINAR PAGO
  // ============================================================

  eliminarPago(id: number) {

    if (
      !confirm(
        '¿Eliminar este pago?'
      )
    ) {
      return;
    }


    this.pagosService
      .eliminarPago(id)
      .subscribe({

        next: () => {

          this.mostrarNotificacion(
            'Pago eliminado correctamente',
            'success'
          );


          if (
            this.alumnoSeleccionado
              ?.matricula_id
          ) {

            this.cargarHistorial(
              this.alumnoSeleccionado
                .matricula_id
            );


            this.verDetalle(
              this.alumnoSeleccionado
                .matricula_id
            );

          }

        },


        error: (err) => {

          console.error(
            err
          );


          this.mostrarNotificacion(
            err?.error?.message ||
            'Error al eliminar pago',
            'error'
          );

        }

      });

  }


  // ============================================================
  // EDITAR MONTO DE CUOTA
  // ============================================================

  abrirEditarMontoCuota(
    cuota: any
  ) {

    if (!cuota) {
      return;
    }


    this.cuotaEditando =
      cuota;


    this.formEditarCuota = {

      monto:
        Number(
          cuota.monto_programado ||
          0
        )

    };


    this.modalEditarCuota =
      true;


    this.cd.detectChanges();

  }


  // ============================================================
  // NUEVO SALDO PREVISUALIZADO
  // ============================================================

  getNuevoSaldoCuota(): number {

    if (
      !this.cuotaEditando
    ) {
      return 0;
    }


    const nuevoMonto =
      Number(
        this.formEditarCuota
          .monto || 0
      );


    const montoPagado =
      Number(
        this.cuotaEditando
          .monto_pagado || 0
      );


    return Math.max(
      nuevoMonto - montoPagado,
      0
    );

  }


  // ============================================================
  // GUARDAR NUEVO MONTO DE CUOTA
  // ============================================================

  guardarEditarMontoCuota() {

    if (
      !this.cuotaEditando
    ) {
      return;
    }


    const nuevoMonto =
      Number(
        this.formEditarCuota
          .monto
      );


    if (
      !Number.isFinite(
        nuevoMonto
      ) ||
      nuevoMonto <= 0
    ) {

      this.mostrarNotificacion(
        'Ingresa un monto válido mayor a cero.',
        'warning'
      );

      return;

    }


    const montoPagado =
      Number(
        this.cuotaEditando
          .monto_pagado || 0
      );


    if (
      nuevoMonto <
      montoPagado
    ) {

      this.mostrarNotificacion(
        `El monto no puede ser menor a lo ya pagado: ${this.formatMonto(montoPagado)}`,
        'warning'
      );

      return;

    }


    this.loading = true;


    this.pagosService
      .editarMontoCuota(
        Number(
          this.cuotaEditando.id
        ),
        nuevoMonto
      )
      .subscribe({

        next: () => {

          this.loading = false;


          this.mostrarNotificacion(
            'Monto de la cuota actualizado correctamente.',
            'success'
          );


          this.modalEditarCuota =
            false;


          this.cuotaEditando =
            null;


          this.formEditarCuota = {
            monto: null
          };


          if (
            this.alumnoSeleccionado
              ?.matricula_id
          ) {

            this.verDetalle(
              this.alumnoSeleccionado
                .matricula_id
            );

          }


          this.cargar();

        },


        error: (err) => {

          this.loading = false;


          console.error(
            'Error al editar monto de cuota:',
            err
          );


          this.mostrarNotificacion(
            err?.error?.message ||
            'No se pudo actualizar el monto de la cuota.',
            'error'
          );

        }

      });

  }


  // ============================================================
  // MODAL PLAN MANUAL
  // ============================================================

  abrirModalPlanManual() {

    this.modalManualAbierto =
      true;


    this.cerrarModalPlanManual(
      false
    );

  }


  cerrarModalPlanManual(
    cerrarOverlay = true
  ) {

    if (
      cerrarOverlay
    ) {

      this.modalManualAbierto =
        false;

    }


    this.resultadosBusqueda =
      [];

    this.matriculaSeleccionada =
      null;


    this.formularioPlan = {

      matricula_id: null,

      modalidad_pago:
        'MENSUAL',

      monto_total:
        null,

      monto_matricula:
        0,

      monto_certificacion:
        0,

      cuotas: []

    };


    this.cuotaTemporal = {

      numero_cuota: 1,

      fecha_vencimiento: '',

      monto: null,

      observaciones: ''

    };

  }


  buscarMatricula(
    event: Event
  ) {

    const termino =
      (
        event.target as
        HTMLInputElement
      ).value;


    if (
      termino.length < 3
    ) {

      this.resultadosBusqueda =
        [];

      return;

    }


    clearTimeout(
      this.timeoutBusqueda
    );


    this.timeoutBusqueda =
      setTimeout(() => {

        this.pagosService
          .buscarMatriculas(
            termino
          )
          .subscribe({

            next: (res) => {

              this.resultadosBusqueda =
                res || [];

              this.cd.detectChanges();

            },

            error: (err) => {

              console.error(
                err
              );

              this.resultadosBusqueda =
                [];

            }

          });

      }, 400);

  }


  seleccionarMatricula(
    alumno: any
  ) {

    this.matriculaSeleccionada =
      alumno;


    this.formularioPlan
      .matricula_id =
      alumno.matricula_id;


    this.resultadosBusqueda =
      [];

  }


  agregarCuota() {

    if (
      !this.cuotaTemporal
        .fecha_vencimiento ||
      !this.cuotaTemporal
        .monto
    ) {

      this.mostrarNotificacion(
        'Llena la fecha y el monto de la cuota',
        'warning'
      );

      return;

    }


    this.formularioPlan
      .cuotas
      .push({
        ...this.cuotaTemporal
      });


    this.cuotaTemporal
      .numero_cuota++;


    this.cuotaTemporal
      .monto = null;


    this.cuotaTemporal
      .observaciones = '';

  }


  eliminarCuota(
    index: number
  ) {

    this.formularioPlan
      .cuotas
      .splice(
        index,
        1
      );


    this.formularioPlan
      .cuotas
      .forEach(
        (c, i) =>
          c.numero_cuota =
            i + 1
      );


    this.cuotaTemporal
      .numero_cuota =
      this.formularioPlan
        .cuotas
        .length + 1;

  }


  guardarPlanManual() {

    const totalCuotas =
      this.formularioPlan
        .cuotas
        .reduce(
          (sum, cuota) =>
            sum +
            Number(
              cuota.monto || 0
            ),
          0
        );


    if (
      totalCuotas !==
      Number(
        this.formularioPlan
          .monto_total
      )
    ) {

      this.mostrarNotificacion(
        'La suma de las cuotas no coincide con el monto total',
        'warning'
      );

      return;

    }


    if (
      this.formularioPlan
        .cuotas.length === 0
    ) {

      this.mostrarNotificacion(
        'Debes agregar al menos una cuota',
        'warning'
      );

      return;

    }


    this.loading = true;


    this.pagosService
      .crearPlanManual(
        this.formularioPlan
      )
      .subscribe({

        next: () => {

          this.mostrarNotificacion(
            'Plan manual creado con éxito',
            'success'
          );


          this.cerrarModalPlanManual();

          this.cargar();

        },


        error: (err) => {

          this.loading = false;


          this.mostrarNotificacion(
            err?.error?.message ||
            'Error al crear plan',
            'error'
          );

        }

      });

  }


  // ============================================================
  // DETALLE ALUMNO
  // ============================================================

  verDetalle(
    matriculaId: number
  ) {

    this.loading = true;


    this.pagosService
      .detalle(
        matriculaId
      )
      .subscribe({

        next: (data) => {

          this.cuotasDetalle =
            data || [];


          this.alumnoSeleccionado =
            data?.[0] || null;


          this.cargarHistorial(
            matriculaId
          );


          this.modalOpen =
            true;


          this.tab =
            'cuotas';


          this.loading =
            false;


          this.cd.detectChanges();

        },


        error: (err) => {

          console.error(
            err
          );

          this.loading =
            false;

        }

      });

  }


  cargarHistorial(
    id: number
  ) {

    this.pagosService
      .historial(id)
      .subscribe({

        next: (data) => {

          this.historial =
            data || [];

          this.cd.detectChanges();

        },

        error: (err) => {

          console.error(
            err
          );

        }

      });

  }


  cerrarModal() {

    this.modalOpen =
      false;

    this.editandoFechas =
      false;

  }


  cambiarTab(
    tab:
      'cuotas' |
      'historial' |
      'pago'
  ) {

    this.tab =
      tab;

    this.cd.detectChanges();

  }


  // ============================================================
  // CUOTAS ORDENADAS
  // ============================================================

  get cuotasOrdenadas() {

    if (
      !this.cuotasDetalle
    ) {
      return [];
    }


    const orden:
      Record<string, number> = {

        MATRICULA: 1,

        CUOTA: 2,

        CERTIFICACION: 3

      };


    return [
      ...this.cuotasDetalle
    ].sort((a, b) => {

      const ordenA =
        orden[
          a.concepto_codigo
        ] ?? 99;


      const ordenB =
        orden[
          b.concepto_codigo
        ] ?? 99;


      if (
        ordenA !==
        ordenB
      ) {

        return (
          ordenA -
          ordenB
        );

      }


      return (
        (
          a.numero_cuota ||
          0
        ) -
        (
          b.numero_cuota ||
          0
        )
      );

    });

  }


  getClaseConcepto(
    codigo: string
  ) {

    return `badge ${codigo?.toLowerCase()}`;

  }


  getClaseEstado(
    estado: string
  ) {

    return (
      estado === 'PAGADO'
        ? 'pagado'
        : 'pendiente'
    );

  }


  onSelectCuota() {

    const cuota =
      this.cuotasDetalle.find(
        c =>
          c.id ==
          this.formPago
            .cuota_id
      );


    if (cuota) {

      this.formPago.monto =
        Number(
          cuota.saldo_pendiente
        );


      this.cd.detectChanges();

    }

  }


  getCuotaSeleccionada() {

    return this.cuotasDetalle.find(
      c =>
        c.id ==
        this.formPago
          .cuota_id
    );

  }


  // ============================================================
  // RECALCULAR PLAN
  // ============================================================

  recalcularPlan() {

    if (
      !this.alumnoSeleccionado
        ?.plan_pago_alumno_id
    ) {

      this.mostrarNotificacion(
        'No hay plan de pago disponible',
        'error'
      );

      return;

    }


    this.pagosService
      .recalcularPlan({

        plan_pago_alumno_id:
          this.alumnoSeleccionado
            .plan_pago_alumno_id,

        tipo:
          this.formRecalculo
            .tipo,

        fecha_inicio:
          this.formRecalculo
            .fecha_inicio,

        cantidad_cuotas:
          this.formRecalculo
            .cantidad_cuotas

      })
      .subscribe({

        next: () => {

          this.mostrarNotificacion(
            'Plan de pagos recalculado con éxito',
            'success'
          );


          this.miniModalOpen =
            false;


          this.verDetalle(
            this.alumnoSeleccionado
              .matricula_id
          );

        },


        error: (err) => {

          this.mostrarNotificacion(
            err?.error?.error ||
            'Error al recalcular el plan',
            'error'
          );

        }

      });

  }


  // ============================================================
  // EDITAR FECHAS
  // ============================================================

  toggleEditarFechas() {

    this.editandoFechas =
      !this.editandoFechas;

  }


  guardarFechas() {

    const data =
      this.cuotasDetalle
        .filter(
          c =>
            c.saldo_pendiente > 0
        )
        .map(c => ({
          cuota_id:
            Number(c.id),

          fecha_vencimiento:
            String(
              c.fecha_vencimiento
            )
        }));


    if (!data.length) {

      this.mostrarNotificacion(
        'No hay fechas pendientes para actualizar.',
        'warning'
      );

      return;

    }


    this.pagosService
      .actualizarFechas(data)
      .subscribe({

        next: () => {

          this.mostrarNotificacion(
            'Fechas de vencimiento actualizadas',
            'success'
          );


          this.editandoFechas =
            false;


          this.verDetalle(
            this.alumnoSeleccionado
              .matricula_id
          );

        },


        error: (err) => {

          console.error(
            err
          );


          this.mostrarNotificacion(
            err?.error?.message ||
            'Error al actualizar fechas',
            'error'
          );

        }

      });

  }


  // ============================================================
  // REGISTRAR PAGO
  // ============================================================

  registrarPago() {

    if (
      !this.formPago
        .cuota_id ||
      !this.formPago
        .monto
    ) {

      this.mostrarNotificacion(
        'Por favor, complete todos los campos obligatorios.',
        'warning'
      );

      return;

    }


    const formData =
      new FormData();


    formData.append(
      'cuota_id',
      String(
        this.formPago
          .cuota_id
      )
    );


    formData.append(
      'monto',
      String(
        this.formPago
          .monto
      )
    );


    formData.append(
      'metodo_pago',
      this.formPago
        .metodo_pago
    );


    if (
      this.selectedFile
    ) {

      formData.append(
        'comprobante',
        this.selectedFile
      );

    }


    this.pagosService
      .registrarPago(
        formData
      )
      .subscribe({

        next: () => {

          this.mostrarNotificacion(
            '¡Pago registrado correctamente!',
            'success'
          );


          this.formPago = {

            cuota_id: null,

            monto: null,

            metodo_pago:
              'EFECTIVO'

          };


          this.selectedFile =
            null;


          this.verDetalle(
            this.alumnoSeleccionado
              .matricula_id
          );

        },


        error: (err) => {

          this.mostrarNotificacion(
            err?.error?.message ||
            'Error al procesar el pago',
            'error'
          );

        }

      });

  }


  // ============================================================
  // PAGO RÁPIDO
  // ============================================================

  abrirMiniPago(
    c: any
  ) {

    this.miniPago =
      c;


    this.miniModalOpen =
      true;


    this.miniPagoForm = {

      cuota_id:
        c.id,

      monto:
        Number(
          c.saldo_pendiente
        ),

      metodo_pago:
        'EFECTIVO'

    };

  }


  pagarMini() {

    if (
      !this.miniPagoForm
        .cuota_id ||
      !this.miniPagoForm
        .monto
    ) {

      this.mostrarNotificacion(
        'Ingresa un monto válido.',
        'warning'
      );

      return;

    }


    const formData =
      new FormData();


    formData.append(
      'cuota_id',
      String(
        this.miniPagoForm
          .cuota_id
      )
    );


    formData.append(
      'monto',
      String(
        this.miniPagoForm
          .monto
      )
    );


    formData.append(
      'metodo_pago',
      this.miniPagoForm
        .metodo_pago
    );


    if (
      this.miniFile
    ) {

      formData.append(
        'comprobante',
        this.miniFile
      );

    }


    this.pagosService
      .registrarPago(
        formData
      )
      .subscribe({

        next: () => {

          this.mostrarNotificacion(
            'Pago rápido registrado correctamente',
            'success'
          );


          this.miniModalOpen =
            false;


          this.miniFile =
            null;


          this.verDetalle(
            this.alumnoSeleccionado
              .matricula_id
          );

        },


        error: (err) => {

          this.mostrarNotificacion(
            err?.error?.message ||
            'Error en pago rápido',
            'error'
          );

        }

      });

  }


  // ============================================================
  // FORMATOS
  // ============================================================

  formatMonto(
    v: number
  ) {

    return new Intl.NumberFormat(
      'es-PE',
      {
        style: 'currency',
        currency: 'PEN'
      }
    ).format(
      v || 0
    );

  }


  formatFecha(
    f: string | Date
  ) {

    if (!f) {
      return '-';
    }


    if (
      typeof f === 'string'
    ) {

      const fecha =
        f.substring(0, 10);


      const partes =
        fecha.split('-');


      if (
        partes.length === 3
      ) {

        const [
          anio,
          mes,
          dia
        ] = partes;


        return `${dia}/${mes}/${anio}`;

      }

    }


    return new Date(f)
      .toLocaleDateString(
        'es-PE'
      );

  }


  getTotalDeuda() {

    return this.cuotasDetalle
      .reduce(
        (a, b) =>
          a +
          Number(
            b.saldo_pendiente || 0
          ),
        0
      );

  }


  getTotalCuotas() {

    return this.cuotasDetalle
      .length;

  }


  get cuotasPendientes() {

    return this.cuotasDetalle
      .filter(
        c =>
          Number(
            c.saldo_pendiente || 0
          ) > 0
      );

  }


  // ============================================================
  // ARCHIVOS
  // ============================================================

  onFileSelected(
    e: any
  ) {

    this.selectedFile =
      e.target.files?.[0] ||
      null;

  }


  onMiniFileSelected(
    e: any
  ) {

    this.miniFile =
      e.target.files?.[0] ||
      null;

  }


  getComprobanteUrl(
    url?: string | null
  ): string {

    if (!url) {
      return '#';
    }


    if (
      url.startsWith(
        'http://'
      ) ||
      url.startsWith(
        'https://'
      )
    ) {
      return url;
    }


    if (
      url.includes(
        'proedso/'
      )
    ) {

      const index =
        url.indexOf(
          'proedso/'
        );


      const pathLimpio =
        url.substring(index);


      return (
        'https://res.cloudinary.com/dfx6p5sjd/image/upload/' +
        pathLimpio
      );

    }


    if (
      url.startsWith(
        '/uploads/'
      )
    ) {
      return url;
    }


    return `/uploads/pagos/${url}`;

  }


  // ============================================================
  // NOTIFICACIONES
  // ============================================================

  mostrarNotificacion(
    msg: string,
    tipo:
      'success' |
      'error' |
      'warning' = 'success'
  ) {

    this.notificacion.visible =
      false;


    this.cd.detectChanges();


    this.notificacion = {

      visible: true,

      mensaje: msg,

      tipo

    };


    this.cd.detectChanges();


    setTimeout(() => {

      this.notificacion.visible =
        false;

      this.cd.detectChanges();

    }, 4000);

  }


  // ============================================================
  // TRACK BY
  // ============================================================

  trackByAlumno(
    i: number,
    a: any
  ) {

    return a.matricula_id;

  }

}
