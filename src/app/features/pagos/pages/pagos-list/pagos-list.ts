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
  generandoPdf = false;

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

  // Formulario del sidebar para añadir una cuota a un plan existente
  formNuevaCuota = {
    fecha_vencimiento: '',
    monto: null as number | null,
    observaciones: ''
  };


  // ============================================================
  // FORMULARIO PLAN MANUAL
  // ============================================================

  formularioPlan: {
    matricula_id: number | null;
    modalidad_pago: 'MENSUAL' | 'QUINCENAL' | 'PERSONALIZADO';
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
    tipo: 'success' as 'success' | 'error' | 'warning'
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
          .map(a => new Date(a.fecha_matricula).getFullYear())
          .filter(a => !isNaN(a));

        this.aniosDisponibles = [...new Set(anios)].sort((a, b) => b - a);

        this.filtrar();

        this.loading = false;

        this.cd.detectChanges();
      },

      error: (err) => {
        console.error('Error cargando pagos:', err);
        this.loading = false;
      }

    });

  }


  // ============================================================
  // ARCHIVO EDITAR PAGO
  // ============================================================

  onEditarFileSelected(e: any) {
    this.fileEditarPago = e.target.files?.[0] || null;
  }


  // ============================================================
  // FILTRO + PAGINACIÓN + AGRUPACIÓN
  // ============================================================

  filtrar(reset = true) {

    if (reset) {
      this.paginaActual = 1;
    }

    const search = this.search.toLowerCase().trim();

    const filtrados = this.alumnos.filter(a => {

      const cumpleBusqueda =
        !search ||
        a.alumno?.toLowerCase().includes(search) ||
        a.plan_nombre?.toLowerCase().includes(search);

      const cumpleEstado =
        !this.estado ||
        (this.estado === 'PAGADO' && !a.tiene_deuda) ||
        (this.estado === 'PENDIENTE' && a.tiene_deuda);

      const fechaAgrupacion = a.fecha_inicio || a.fecha_matricula || null;

      let cumpleFecha = true;

      if (fechaAgrupacion) {

        const fecha = new Date(fechaAgrupacion);

        if (!isNaN(fecha.getTime())) {

          const mes = fecha.getMonth() + 1;
          const anio = fecha.getFullYear();

          if (this.mesMatricula && mes !== Number(this.mesMatricula)) {
            cumpleFecha = false;
          }

          if (this.anioMatricula && anio !== Number(this.anioMatricula)) {
            cumpleFecha = false;
          }

        }

      }

      return cumpleBusqueda && cumpleEstado && cumpleFecha;

    });

    filtrados.sort((a, b) => {

      const fechaA = a.fecha_inicio || a.fecha_matricula || null;
      const fechaB = b.fecha_inicio || b.fecha_matricula || null;

      if (!fechaA && !fechaB) return 0;
      if (!fechaA) return 1;
      if (!fechaB) return -1;

      const tiempoA = new Date(fechaA).getTime();
      const tiempoB = new Date(fechaB).getTime();

      if (tiempoA !== tiempoB) {
        return tiempoB - tiempoA;
      }

      return (a.alumno || '').localeCompare(b.alumno || '', 'es', { sensitivity: 'base' });

    });

    this.totalPaginas = Math.ceil(filtrados.length / this.itemsPorPagina);

    if (this.totalPaginas === 0) {
      this.totalPaginas = 1;
    }

    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;

    const paginaActualData = filtrados.slice(inicio, fin);

    this.alumnosFiltrados = filtrados;

    this.paginas = Array.from({ length: this.totalPaginas }, (_, i) => i + 1);

    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
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

    const agregarSinFecha = (alumno: any) => {

      const key = 'SIN_FECHA';

      if (!grupos[key]) {
        grupos[key] = {
          anio: null,
          mesNumero: null,
          mes: 'Sin fecha',
          fechaReferencia: null,
          alumnos: []
        };
      }

      grupos[key].alumnos.push(alumno);

    };

    paginaActualData.forEach(alumno => {

      const fechaReferencia = alumno.fecha_inicio || alumno.fecha_matricula || null;

      if (!fechaReferencia) {
        agregarSinFecha(alumno);
        return;
      }

      const fecha = new Date(fechaReferencia);

      if (isNaN(fecha.getTime())) {
        agregarSinFecha(alumno);
        return;
      }

      const anio = fecha.getFullYear();
      const mes = fecha.getMonth();
      const key = `${anio}-${mes}`;

      if (!grupos[key]) {
        grupos[key] = {
          anio,
          mesNumero: mes,
          mes: `${meses[mes]} ${anio}`,
          fechaReferencia,
          alumnos: []
        };
      }

      grupos[key].alumnos.push(alumno);

    });

    this.gruposPaginados = Object.values(grupos).sort((a: any, b: any) => {

      if (a.anio === null && b.anio !== null) return 1;
      if (a.anio !== null && b.anio === null) return -1;
      if (a.anio === null && b.anio === null) return 0;

      if (a.anio !== b.anio) {
        return b.anio - a.anio;
      }

      return b.mesNumero - a.mesNumero;

    });

    this.cd.detectChanges();

  }


  // ============================================================
  // PAGINACIÓN
  // ============================================================

  cambiarPagina(p: number) {

    if (p < 1 || p > this.totalPaginas) {
      return;
    }

    this.paginaActual = p;
    this.filtrar(false);

  }

  paginaAnterior() {

    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.filtrar(false);
    }

  }

  paginaSiguiente() {

    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
      this.filtrar(false);
    }

  }


  // ============================================================
  // EDITAR PAGO REGISTRADO
  // ============================================================

  editarPago(pago: any) {

    this.pagoEditando = pago;

    this.formEditarPago = {
      monto: Number(pago.monto || 0),
      metodo_pago: pago.metodo_pago || 'EFECTIVO'
    };

    this.modalEditarPago = true;

  }

  guardarEditarPago() {

    if (!this.pagoEditando) {
      return;
    }

    const formData = new FormData();

    formData.append('monto', String(this.formEditarPago.monto));
    formData.append('metodo_pago', this.formEditarPago.metodo_pago);

    if (this.fileEditarPago) {
      formData.append('comprobante', this.fileEditarPago);
    }

    this.pagosService.editarPago(this.pagoEditando.id, formData).subscribe({

      next: () => {

        this.mostrarNotificacion('Pago actualizado correctamente', 'success');

        this.modalEditarPago = false;
        this.fileEditarPago = null;

        if (this.alumnoSeleccionado?.matricula_id) {
          this.cargarHistorial(this.alumnoSeleccionado.matricula_id);
          this.verDetalle(this.alumnoSeleccionado.matricula_id);
        }

      },

      error: (err) => {

        console.error(err);

        this.mostrarNotificacion(
          err?.error?.message || 'Error al editar pago',
          'error'
        );

      }

    });

  }


  // ============================================================
  // ELIMINAR PAGO
  // ============================================================

  eliminarPago(id: number) {

    if (!confirm('¿Eliminar este pago?')) {
      return;
    }

    this.pagosService.eliminarPago(id).subscribe({

      next: () => {

        this.mostrarNotificacion('Pago eliminado correctamente', 'success');

        if (this.alumnoSeleccionado?.matricula_id) {
          this.cargarHistorial(this.alumnoSeleccionado.matricula_id);
          this.verDetalle(this.alumnoSeleccionado.matricula_id);
        }

      },

      error: (err) => {

        console.error(err);

        this.mostrarNotificacion(
          err?.error?.message || 'Error al eliminar pago',
          'error'
        );

      }

    });

  }


  // ============================================================
  // EDITAR MONTO DE CUOTA
  // ============================================================

  abrirEditarMontoCuota(cuota: any) {

    if (!cuota) {
      return;
    }

    this.cuotaEditando = cuota;

    this.formEditarCuota = {
      monto: Number(cuota.monto_programado || 0)
    };

    this.modalEditarCuota = true;

    this.cd.detectChanges();

  }

  getNuevoSaldoCuota(): number {

    if (!this.cuotaEditando) {
      return 0;
    }

    const nuevoMonto = Number(this.formEditarCuota.monto || 0);
    const montoPagado = Number(this.cuotaEditando.monto_pagado || 0);

    return Math.max(nuevoMonto - montoPagado, 0);

  }

  guardarEditarMontoCuota() {

    if (!this.cuotaEditando) {
      return;
    }

    const nuevoMonto = Number(this.formEditarCuota.monto);

    if (!Number.isFinite(nuevoMonto) || nuevoMonto <= 0) {

      this.mostrarNotificacion('Ingresa un monto válido mayor a cero.', 'warning');

      return;

    }

    const montoPagado = Number(this.cuotaEditando.monto_pagado || 0);

    if (nuevoMonto < montoPagado) {

      this.mostrarNotificacion(
        `El monto no puede ser menor a lo ya pagado: ${this.formatMonto(montoPagado)}`,
        'warning'
      );

      return;

    }

    this.loading = true;

    this.pagosService
      .editarMontoCuota(Number(this.cuotaEditando.id), nuevoMonto)
      .subscribe({

        next: () => {

          this.loading = false;

          this.mostrarNotificacion('Monto de la cuota actualizado correctamente.', 'success');

          this.modalEditarCuota = false;
          this.cuotaEditando = null;
          this.formEditarCuota = { monto: null };

          if (this.alumnoSeleccionado?.matricula_id) {
            this.verDetalle(this.alumnoSeleccionado.matricula_id);
          }

          this.cargar();

        },

        error: (err) => {

          this.loading = false;

          console.error('Error al editar monto de cuota:', err);

          this.mostrarNotificacion(
            err?.error?.message || 'No se pudo actualizar el monto de la cuota.',
            'error'
          );

        }

      });

  }


  // ============================================================
  // MODAL PLAN MANUAL
  // ============================================================

  abrirModalPlanManual() {

    this.modalManualAbierto = true;

    this.cerrarModalPlanManual(false);

  }

  cerrarModalPlanManual(cerrarOverlay = true) {

    if (cerrarOverlay) {
      this.modalManualAbierto = false;
    }

    this.resultadosBusqueda = [];
    this.matriculaSeleccionada = null;

    this.formularioPlan = {
      matricula_id: null,
      modalidad_pago: 'MENSUAL',
      monto_total: null,
      monto_matricula: 0,
      monto_certificacion: 0,
      cuotas: []
    };

    this.cuotaTemporal = {
      numero_cuota: 1,
      fecha_vencimiento: '',
      monto: null,
      observaciones: ''
    };

  }

  buscarMatricula(event: Event) {

    const termino = (event.target as HTMLInputElement).value;

    if (termino.length < 3) {
      this.resultadosBusqueda = [];
      return;
    }

    clearTimeout(this.timeoutBusqueda);

    this.timeoutBusqueda = setTimeout(() => {

      this.pagosService.buscarMatriculas(termino).subscribe({

        next: (res) => {
          this.resultadosBusqueda = res || [];
          this.cd.detectChanges();
        },

        error: (err) => {
          console.error(err);
          this.resultadosBusqueda = [];
        }

      });

    }, 400);

  }

  seleccionarMatricula(alumno: any) {

    this.matriculaSeleccionada = alumno;

    this.formularioPlan.matricula_id = alumno.matricula_id;

    this.resultadosBusqueda = [];

  }

  agregarCuota() {

    if (!this.cuotaTemporal.fecha_vencimiento || !this.cuotaTemporal.monto) {

      this.mostrarNotificacion('Llena la fecha y el monto de la cuota', 'warning');

      return;

    }

    this.formularioPlan.cuotas.push({ ...this.cuotaTemporal });

    this.cuotaTemporal.numero_cuota++;
    this.cuotaTemporal.monto = null;
    this.cuotaTemporal.observaciones = '';

  }

  eliminarCuota(index: number) {

    this.formularioPlan.cuotas.splice(index, 1);

    this.formularioPlan.cuotas.forEach((c, i) => (c.numero_cuota = i + 1));

    this.cuotaTemporal.numero_cuota = this.formularioPlan.cuotas.length + 1;

  }

  guardarPlanManual() {

    const totalCuotas = this.formularioPlan.cuotas.reduce(
      (sum, cuota) => sum + Number(cuota.monto || 0),
      0
    );

    if (totalCuotas !== Number(this.formularioPlan.monto_total)) {

      this.mostrarNotificacion('La suma de las cuotas no coincide con el monto total', 'warning');

      return;

    }

    if (this.formularioPlan.cuotas.length === 0) {

      this.mostrarNotificacion('Debes agregar al menos una cuota', 'warning');

      return;

    }

    this.loading = true;

    this.pagosService.crearPlanManual(this.formularioPlan).subscribe({

      next: () => {

        this.mostrarNotificacion('Plan manual creado con éxito', 'success');

        this.cerrarModalPlanManual();

        this.cargar();

      },

      error: (err) => {

        this.loading = false;

        this.mostrarNotificacion(
          err?.error?.message || 'Error al crear plan',
          'error'
        );

      }

    });

  }


  // ============================================================
  // DETALLE ALUMNO
  // ============================================================

  verDetalle(matriculaId: number) {

    this.loading = true;

    this.pagosService.detalle(matriculaId).subscribe({

      next: (data) => {

        this.cuotasDetalle = data || [];

        this.alumnoSeleccionado = data?.[0] || null;

        this.cargarHistorial(matriculaId);

        this.modalOpen = true;

        this.tab = 'cuotas';

        this.loading = false;

        this.cd.detectChanges();

      },

      error: (err) => {

        console.error(err);

        this.loading = false;

      }

    });

  }

  cargarHistorial(id: number) {

    this.pagosService.historial(id).subscribe({

      next: (data) => {
        this.historial = data || [];
        this.cd.detectChanges();
      },

      error: (err) => {
        console.error(err);
      }

    });

  }

  cerrarModal() {

    this.modalOpen = false;
    this.editandoFechas = false;

  }

  cambiarTab(tab: 'cuotas' | 'historial' | 'pago') {

    this.tab = tab;

    this.cd.detectChanges();

  }


  // ============================================================
  // CUOTAS ORDENADAS
  // ============================================================

  get cuotasOrdenadas() {

    if (!this.cuotasDetalle) {
      return [];
    }

    const orden: Record<string, number> = {
      MATRICULA: 1,
      CUOTA: 2,
      CERTIFICACION: 3
    };

    return [...this.cuotasDetalle].sort((a, b) => {

      const ordenA = orden[a.concepto_codigo] ?? 99;
      const ordenB = orden[b.concepto_codigo] ?? 99;

      if (ordenA !== ordenB) {
        return ordenA - ordenB;
      }

      return (a.numero_cuota || 0) - (b.numero_cuota || 0);

    });

  }

  getClaseConcepto(codigo: string) {
    return `badge ${codigo?.toLowerCase()}`;
  }

  getClaseEstado(estado: string) {
    return estado === 'PAGADO' ? 'pagado' : 'pendiente';
  }

  onSelectCuota() {

    const cuota = this.cuotasDetalle.find(c => c.id == this.formPago.cuota_id);

    if (cuota) {
      this.formPago.monto = Number(cuota.saldo_pendiente);
      this.cd.detectChanges();
    }

  }

  getCuotaSeleccionada() {
    return this.cuotasDetalle.find(c => c.id == this.formPago.cuota_id);
  }


  // ============================================================
  // AGREGAR CUOTA A UN PLAN EXISTENTE
  // ============================================================

  agregarCuotaAlPlan() {

    const planId = this.alumnoSeleccionado?.plan_pago_alumno_id;
    const matriculaId = this.alumnoSeleccionado?.matricula_id;

    if (!planId || !matriculaId) {

      this.mostrarNotificacion('No hay plan de pago disponible', 'error');

      return;

    }

    const monto = Number(this.formNuevaCuota.monto);

    if (
      !this.formNuevaCuota.fecha_vencimiento ||
      !Number.isFinite(monto) ||
      monto <= 0
    ) {

      this.mostrarNotificacion('Ingresa la fecha y un monto válido', 'warning');

      return;

    }

    this.pagosService
      .agregarCuota({
        plan_pago_alumno_id: Number(planId),
        fecha_vencimiento: this.formNuevaCuota.fecha_vencimiento,
        monto,
        observaciones: this.formNuevaCuota.observaciones || undefined
      })
      .subscribe({

        next: () => {

          this.mostrarNotificacion('Cuota añadida correctamente', 'success');

          this.formNuevaCuota = {
            fecha_vencimiento: '',
            monto: null,
            observaciones: ''
          };

          this.verDetalle(matriculaId);

          this.cargar();

        },

        error: (err) => {

          this.mostrarNotificacion(
            err?.error?.message || 'Error al añadir la cuota',
            'error'
          );

        }

      });

  }


  // ============================================================
  // ELIMINAR CUOTA DE UN PLAN EXISTENTE
  // ============================================================

  eliminarCuotaDelPlan(c: any) {

    if (Number(c.monto_pagado || 0) > 0) {

      this.mostrarNotificacion(
        'No se puede eliminar una cuota con pagos registrados',
        'warning'
      );

      return;

    }

    const matriculaId = this.alumnoSeleccionado?.matricula_id;

    if (!matriculaId) {
      return;
    }

    const nombre = c.numero_cuota
      ? `${c.concepto_nombre} #${c.numero_cuota}`
      : c.concepto_nombre;

    if (!confirm(`¿Eliminar ${nombre} por ${this.formatMonto(c.monto_programado)}?`)) {
      return;
    }

    this.pagosService.eliminarCuota(Number(c.id)).subscribe({

      next: () => {

        this.mostrarNotificacion('Cuota eliminada correctamente', 'success');

        this.verDetalle(matriculaId);

        this.cargar();

      },

      error: (err) => {

        this.mostrarNotificacion(
          err?.error?.message || 'Error al eliminar la cuota',
          'error'
        );

      }

    });

  }


  // ============================================================
  // EDITAR FECHAS
  // ============================================================

  toggleEditarFechas() {
    this.editandoFechas = !this.editandoFechas;
  }

  guardarFechas() {

    const data = this.cuotasDetalle
      .filter(c => c.saldo_pendiente > 0)
      .map(c => ({
        cuota_id: Number(c.id),
        fecha_vencimiento: String(c.fecha_vencimiento)
      }));

    if (!data.length) {

      this.mostrarNotificacion('No hay fechas pendientes para actualizar.', 'warning');

      return;

    }

    this.pagosService.actualizarFechas(data).subscribe({

      next: () => {

        this.mostrarNotificacion('Fechas de vencimiento actualizadas', 'success');

        this.editandoFechas = false;

        this.verDetalle(this.alumnoSeleccionado.matricula_id);

      },

      error: (err) => {

        console.error(err);

        this.mostrarNotificacion(
          err?.error?.message || 'Error al actualizar fechas',
          'error'
        );

      }

    });

  }


  // ============================================================
  // REGISTRAR PAGO
  // ============================================================

  registrarPago() {

    if (!this.formPago.cuota_id || !this.formPago.monto) {

      this.mostrarNotificacion(
        'Por favor, complete todos los campos obligatorios.',
        'warning'
      );

      return;

    }

    const formData = new FormData();

    formData.append('cuota_id', String(this.formPago.cuota_id));
    formData.append('monto', String(this.formPago.monto));
    formData.append('metodo_pago', this.formPago.metodo_pago);

    if (this.selectedFile) {
      formData.append('comprobante', this.selectedFile);
    }

    this.pagosService.registrarPago(formData).subscribe({

      next: () => {

        this.mostrarNotificacion('¡Pago registrado correctamente!', 'success');

        this.formPago = {
          cuota_id: null,
          monto: null,
          metodo_pago: 'EFECTIVO'
        };

        this.selectedFile = null;

        this.verDetalle(this.alumnoSeleccionado.matricula_id);

      },

      error: (err) => {

        this.mostrarNotificacion(
          err?.error?.message || 'Error al procesar el pago',
          'error'
        );

      }

    });

  }


  // ============================================================
  // PAGO RÁPIDO
  // ============================================================

  abrirMiniPago(c: any) {

    this.miniPago = c;

    this.miniModalOpen = true;

    this.miniPagoForm = {
      cuota_id: c.id,
      monto: Number(c.saldo_pendiente),
      metodo_pago: 'EFECTIVO'
    };

  }

  pagarMini() {

    if (!this.miniPagoForm.cuota_id || !this.miniPagoForm.monto) {

      this.mostrarNotificacion('Ingresa un monto válido.', 'warning');

      return;

    }

    const formData = new FormData();

    formData.append('cuota_id', String(this.miniPagoForm.cuota_id));
    formData.append('monto', String(this.miniPagoForm.monto));
    formData.append('metodo_pago', this.miniPagoForm.metodo_pago);

    if (this.miniFile) {
      formData.append('comprobante', this.miniFile);
    }

    this.pagosService.registrarPago(formData).subscribe({

      next: () => {

        this.mostrarNotificacion('Pago rápido registrado correctamente', 'success');

        this.miniModalOpen = false;
        this.miniFile = null;

        this.verDetalle(this.alumnoSeleccionado.matricula_id);

      },

      error: (err) => {

        this.mostrarNotificacion(
          err?.error?.message || 'Error en pago rápido',
          'error'
        );

      }

    });

  }


  // ============================================================
  // ★ REPORTE PDF (estado de cuenta / historial de pagos)
  // ------------------------------------------------------------
  // Requiere:  npm i jspdf jspdf-autotable
  // tipo:
  //   'completo'  -> resumen + cuotas + historial de pagos
  //   'cuotas'    -> resumen + estado de cuenta (cuotas)
  //   'historial' -> resumen + historial de pagos
  // ============================================================

  async generarReportePDF(tipo: 'completo' | 'cuotas' | 'historial' = 'completo') {

    if (!this.alumnoSeleccionado) {
      return;
    }

    this.generandoPdf = true;
    this.cd.detectChanges();

    try {

      // Carga diferida: no pesa en el bundle inicial
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF({ unit: 'pt', format: 'a4' });

      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      const M = 40;

      const NAVY: [number, number, number] = [11, 31, 58];
      const GOLD: [number, number, number] = [212, 160, 23];
      const GRAY: [number, number, number] = [102, 112, 133];
      const LIGHT: [number, number, number] = [245, 247, 251];
      const GREEN: [number, number, number] = [21, 128, 61];
      const RED: [number, number, number] = [220, 38, 38];

      const money = (v: number) => this.formatMonto(v).replace(/\u00A0/g, ' ');

      const a = this.alumnoSeleccionado;

      const titulo =
        tipo === 'historial'
          ? 'Historial de pagos'
          : tipo === 'cuotas'
            ? 'Estado de cuenta'
            : 'Estado de cuenta y pagos';

      const ahora = new Date();
      const fechaEmision = ahora.toLocaleDateString('es-PE', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      }) + ' ' + ahora.toLocaleTimeString('es-PE', {
        hour: '2-digit', minute: '2-digit'
      });

      // ---------- Totales ----------
      const totalProgramado = this.cuotasDetalle.reduce(
        (s, c) => s + Number(c.monto_programado || 0), 0
      );
      const totalPagadoCuotas = this.cuotasDetalle.reduce(
        (s, c) => s + Number(c.monto_pagado || 0), 0
      );
      const totalDeuda = this.getTotalDeuda();
      const totalHistorial = this.historial.reduce(
        (s, h) => s + Number(h.monto || 0), 0
      );

      // ---------- Cabecera ----------
      doc.setFillColor(...NAVY);
      doc.rect(0, 0, W, 80, 'F');

      doc.setFillColor(...GOLD);
      doc.rect(0, 80, W, 3, 'F');

      doc.setTextColor(...GOLD);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('PROEDSO', M, 40);

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('ADMINISTRACIÓN FINANCIERA', M, 56);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text(titulo, W - M, 38, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Emitido: ${fechaEmision}`, W - M, 56, { align: 'right' });

      // ---------- Datos del alumno ----------
      let y = 108;

      doc.setFillColor(...LIGHT);
      doc.roundedRect(M, y, W - M * 2, 70, 6, 6, 'F');

      const campo = (label: string, valor: string, x: number, yy: number) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...GRAY);
        doc.text(label.toUpperCase(), x, yy);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(...NAVY);
        const txt = doc.splitTextToSize(valor || '-', (W - M * 2) / 2 - 24);
        doc.text(txt[0], x, yy + 14);
      };

      const col2 = M + (W - M * 2) / 2;

      campo('Alumno', a.alumno, M + 14, y + 20);
      campo('Programa', a.plan_nombre, col2, y + 20);
      campo('Matrícula', `#${a.matricula_id}`, M + 14, y + 52);
      campo('Teléfono', a.telefono || 'Sin teléfono', col2, y + 52);

      y += 90;

      // ---------- Tarjetas de resumen ----------
      const cardW = (W - M * 2 - 20) / 3;

      const tarjeta = (
        i: number,
        label: string,
        valor: string,
        color: [number, number, number]
      ) => {
        const x = M + i * (cardW + 10);
        doc.setDrawColor(229, 233, 240);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(x, y, cardW, 52, 6, 6, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...GRAY);
        doc.text(label.toUpperCase(), x + 12, y + 18);
        doc.setFontSize(14);
        doc.setTextColor(...color);
        doc.text(valor, x + 12, y + 38);
      };

      if (tipo === 'historial') {
        tarjeta(0, 'Pagos registrados', String(this.historial.length), NAVY);
        tarjeta(1, 'Total abonado', money(totalHistorial), GREEN);
        tarjeta(2, 'Deuda pendiente', money(totalDeuda), totalDeuda > 0 ? RED : GREEN);
      } else {
        tarjeta(0, 'Total programado', money(totalProgramado), NAVY);
        tarjeta(1, 'Total pagado', money(totalPagadoCuotas), GREEN);
        tarjeta(2, 'Deuda pendiente', money(totalDeuda), totalDeuda > 0 ? RED : GREEN);
      }

      y += 72;

      const tituloSeccion = (txt: string) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(...NAVY);
        doc.text(txt, M, y);
        doc.setDrawColor(...GOLD);
        doc.setLineWidth(1.5);
        doc.line(M, y + 5, M + 28, y + 5);
        y += 14;
      };

      const finalY = () => (doc as any).lastAutoTable?.finalY ?? y;

      // ---------- Tabla de cuotas ----------
      if (tipo === 'completo' || tipo === 'cuotas') {

        tituloSeccion('Detalle de cuotas');

        const filas = this.cuotasOrdenadas.map(c => [
          c.numero_cuota
            ? `${c.concepto_nombre} #${c.numero_cuota}`
            : c.concepto_nombre,
          this.formatFecha(c.fecha_vencimiento),
          money(Number(c.monto_programado || 0)),
          money(Number(c.monto_pagado || 0)),
          money(Number(c.saldo_pendiente || 0)),
          c.estado || (Number(c.saldo_pendiente) <= 0 ? 'PAGADO' : 'PENDIENTE')
        ]);

        autoTable(doc, {
          startY: y,
          head: [['Concepto', 'Vencimiento', 'Programado', 'Pagado', 'Saldo', 'Estado']],
          body: filas.length ? filas : [['Sin cuotas registradas', '', '', '', '', '']],
          foot: [[
            'TOTAL', '',
            money(totalProgramado),
            money(totalPagadoCuotas),
            money(totalDeuda),
            ''
          ]],
          margin: { left: M, right: M, bottom: 50 },
          theme: 'grid',
          styles: {
            font: 'helvetica',
            fontSize: 9,
            cellPadding: 6,
            lineColor: [229, 233, 240],
            lineWidth: 0.5,
            textColor: [23, 32, 51]
          },
          headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
          footStyles: { fillColor: LIGHT, textColor: NAVY, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [251, 252, 254] },
          columnStyles: {
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'center' }
          },
          didParseCell: (d: any) => {
            if (d.section === 'body' && d.column.index === 5) {
              d.cell.styles.fontStyle = 'bold';
              d.cell.styles.textColor = d.cell.raw === 'PAGADO' ? GREEN : RED;
            }
            if (d.section === 'body' && d.column.index === 3) {
              d.cell.styles.textColor = GREEN;
            }
            if (d.section === 'body' && d.column.index === 4) {
              d.cell.styles.fontStyle = 'bold';
            }
          }
        });

        y = finalY() + 28;

      }

      // ---------- Tabla de historial de pagos ----------
      if (tipo === 'completo' || tipo === 'historial') {

        // Si queda poco espacio, salto de página
        if (y > H - 140) {
          doc.addPage();
          y = 50;
        }

        tituloSeccion('Historial de pagos');

        const filasH = this.historial.map((h, i) => [
          String(i + 1),
          this.formatFecha(h.fecha_pago),
          h.concepto_nombre || '-',
          h.metodo_pago || 'Sin método',
          h.usuario || 'Admin',
          money(Number(h.monto || 0))
        ]);

        autoTable(doc, {
          startY: y,
          head: [['#', 'Fecha', 'Concepto', 'Método', 'Registrado por', 'Monto']],
          body: filasH.length ? filasH : [['', 'Sin pagos registrados', '', '', '', '']],
          foot: filasH.length
            ? [['', '', '', '', 'TOTAL PAGADO', money(totalHistorial)]]
            : undefined,
          margin: { left: M, right: M, bottom: 50 },
          theme: 'grid',
          styles: {
            font: 'helvetica',
            fontSize: 9,
            cellPadding: 6,
            lineColor: [229, 233, 240],
            lineWidth: 0.5,
            textColor: [23, 32, 51]
          },
          headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
          footStyles: { fillColor: LIGHT, textColor: NAVY, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [251, 252, 254] },
          columnStyles: {
            0: { halign: 'center', cellWidth: 26 },
            5: { halign: 'right', fontStyle: 'bold', textColor: GREEN }
          }
        });

      }

      // ---------- Pie de página en todas las hojas ----------
      const totalPaginas = doc.getNumberOfPages();

      for (let i = 1; i <= totalPaginas; i++) {

        doc.setPage(i);

        doc.setDrawColor(229, 233, 240);
        doc.setLineWidth(0.5);
        doc.line(M, H - 36, W - M, H - 36);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...GRAY);
        doc.text('PROEDSO · Documento generado automáticamente', M, H - 22);
        doc.text(`Página ${i} de ${totalPaginas}`, W - M, H - 22, { align: 'right' });

      }

      // ---------- Descarga ----------
      const nombreLimpio = String(a.alumno || 'alumno')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

      const fechaArchivo = ahora.toISOString().substring(0, 10);

      doc.save(`${titulo.replace(/\s+/g, '_')}_${nombreLimpio}_${fechaArchivo}.pdf`);

      this.mostrarNotificacion('PDF generado correctamente', 'success');

    } catch (err) {

      console.error('Error generando PDF:', err);

      this.mostrarNotificacion(
        'No se pudo generar el PDF. Verifica que jspdf y jspdf-autotable estén instalados.',
        'error'
      );

    } finally {

      this.generandoPdf = false;
      this.cd.detectChanges();

    }

  }


  // ============================================================
  // FORMATOS
  // ============================================================

  formatMonto(v: number) {

    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(v || 0);

  }

  formatFecha(f: string | Date) {

    if (!f) {
      return '-';
    }

    if (typeof f === 'string') {

      const fecha = f.substring(0, 10);
      const partes = fecha.split('-');

      if (partes.length === 3) {

        const [anio, mes, dia] = partes;

        return `${dia}/${mes}/${anio}`;

      }

    }

    return new Date(f).toLocaleDateString('es-PE');

  }

  getTotalDeuda() {

    return this.cuotasDetalle.reduce(
      (a, b) => a + Number(b.saldo_pendiente || 0),
      0
    );

  }

  getTotalCuotas() {
    return this.cuotasDetalle.length;
  }

  get cuotasPendientes() {

    return this.cuotasDetalle.filter(
      c => Number(c.saldo_pendiente || 0) > 0
    );

  }


  // ============================================================
  // ARCHIVOS
  // ============================================================

  onFileSelected(e: any) {
    this.selectedFile = e.target.files?.[0] || null;
  }

  onMiniFileSelected(e: any) {
    this.miniFile = e.target.files?.[0] || null;
  }

  getComprobanteUrl(url?: string | null): string {

    if (!url) {
      return '#';
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    if (url.includes('proedso/')) {

      const index = url.indexOf('proedso/');
      const pathLimpio = url.substring(index);

      return 'https://res.cloudinary.com/dfx6p5sjd/image/upload/' + pathLimpio;

    }

    if (url.startsWith('/uploads/')) {
      return url;
    }

    return `/uploads/pagos/${url}`;

  }


  // ============================================================
  // NOTIFICACIONES
  // ============================================================

  mostrarNotificacion(
    msg: string,
    tipo: 'success' | 'error' | 'warning' = 'success'
  ) {

    this.notificacion.visible = false;

    this.cd.detectChanges();

    this.notificacion = {
      visible: true,
      mensaje: msg,
      tipo
    };

    this.cd.detectChanges();

    setTimeout(() => {

      this.notificacion.visible = false;

      this.cd.detectChanges();

    }, 4000);

  }


  // ============================================================
  // TRACK BY
  // ============================================================

  trackByAlumno(i: number, a: any) {
    return a.matricula_id;
  }

}
