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

  // ======================
  // INYECCIÓN
  // ======================
  private pagosService = inject(PagosService);
  private cd = inject(ChangeDetectorRef);

  // ======================
  // UI STATE
  // ======================
  loading = false;
  modalOpen = false;
  miniModalOpen = false;
  editandoFechas = false;
  modalManualAbierto = false;
  mesMatricula: string = '';
  anioMatricula: string = '';
  gruposPaginados: any[] = [];
  aniosDisponibles: number[] = [];

  tab: 'cuotas' | 'historial' | 'pago' = 'cuotas';

  // ======================
  // DATA GENERAL
  // ======================
  alumnos: any[] = [];
  alumnosFiltrados: any[] = [];
  alumnosAgrupados: any[] = [];
  cuotasDetalle: any[] = [];
  historial: any[] = [];
  pagoEditando: any = null;
  modalEditarPago = false;
  formEditarPago = {
    monto: null as number | null,
    metodo_pago: 'EFECTIVO'
  };
  fileEditarPago: File | null = null;
  alumnoSeleccionado: any = null;
  miniPago: any = null;

  // ======================
  // BÚSQUEDA PLAN MANUAL
  // ======================
  resultadosBusqueda: any[] = [];
  matriculaSeleccionada: any = null;
  timeoutBusqueda: any;

  // ======================
  // PAGINACIÓN Y FILTROS
  // ======================
  paginaActual = 1;
  itemsPorPagina = 8;
  totalPaginas = 1;
  paginas: number[] = [];
  search = '';
  estado = '';

  // ======================
  // ARCHIVOS
  // ======================
  selectedFile: File | null = null;
  miniFile: File | null = null;

  // ======================
  // FORMULARIOS
  // ======================
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

  // ======================
  // NOTIFICACIONES
  // ======================
  notificacion = {
    visible: false,
    mensaje: '',
    tipo: 'success' as 'success' | 'error' | 'warning'
  };

  ngOnInit() {
    this.cargar();
  }

  // ======================
  // CARGA PRINCIPAL
  // ======================
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
      error: () => this.loading = false
    });
  }

  // ======================
  // FILTRO + PAGINACIÓN
  // ======================
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

      let cumpleFecha = true;

      if (a.fecha_matricula) {
        const fecha = new Date(a.fecha_matricula);
        const mes = fecha.getMonth() + 1;
        const anio = fecha.getFullYear();

        if (this.mesMatricula && mes !== Number(this.mesMatricula)) {
          cumpleFecha = false;
        }
        if (this.anioMatricula && anio !== Number(this.anioMatricula)) {
          cumpleFecha = false;
        }
      }

      return cumpleBusqueda && cumpleEstado && cumpleFecha;
    });

    filtrados.sort((a, b) =>
      a.alumno.localeCompare(b.alumno, 'es', { sensitivity: 'base' })
    );

    this.totalPaginas = Math.ceil(filtrados.length / this.itemsPorPagina);

    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    const paginaActualData = filtrados.slice(inicio, fin);

    this.alumnosFiltrados = filtrados;

    this.paginas = Array.from({ length: this.totalPaginas }, (_, i) => i + 1);

    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const grupos: any = {};

    paginaActualData.forEach(alumno => {
      const fecha = new Date(alumno.fecha_matricula);
      const anio = fecha.getFullYear();
      const mes = fecha.getMonth();
      const key = `${anio}-${mes}`;

      if (!grupos[key]) {
        grupos[key] = {
          anio,
          mesNumero: mes,
          mes: `${meses[mes]} ${anio}`,
          alumnos: []
        };
      }
      grupos[key].alumnos.push(alumno);
    });

    this.gruposPaginados = Object.values(grupos).sort((a: any, b: any) => {
      if (a.anio !== b.anio) {
        return b.anio - a.anio;
      }
      return b.mesNumero - a.mesNumero;
    });

    this.cd.detectChanges();
  }

  cambiarPagina(p: number) {
    if (p < 1 || p > this.totalPaginas) return;
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

  editarPago(pago:any){

  this.pagoEditando = pago;

  this.formEditarPago = {
    monto: pago.monto,
    metodo_pago: pago.metodo_pago || 'EFECTIVO'
  };

  this.modalEditarPago = true;

}

  guardarEditarPago(){

  if(!this.pagoEditando) return;


  const formData = new FormData();

  formData.append(
    'monto',
    String(this.formEditarPago.monto)
  );

  formData.append(
    'metodo_pago',
    this.formEditarPago.metodo_pago
  );


  if(this.fileEditarPago){

    formData.append(
      'comprobante',
      this.fileEditarPago
    );

  }


  this.pagosService.editarPago(
    this.pagoEditando.id,
    formData
  )
  .subscribe({

    next:()=>{

      this.mostrarNotificacion(
        'Pago actualizado correctamente',
        'success'
      );


      this.modalEditarPago=false;


      this.cargarHistorial(
        this.alumnoSeleccionado.matricula_id
      );

      this.verDetalle(
        this.alumnoSeleccionado.matricula_id
      );

    },

    error:(err)=>{

      this.mostrarNotificacion(
        err.error?.message || 'Error al editar pago',
        'error'
      );

    }

  });

}

  eliminarPago(id:number){

 if(!confirm('¿Eliminar este pago?')) return;


 this.pagosService.eliminarPago(id)
 .subscribe({

  next:()=>{

    this.mostrarNotificacion(
      'Pago eliminado correctamente',
      'success'
    );


    this.cargarHistorial(
      this.alumnoSeleccionado.matricula_id
    );

    this.verDetalle(
      this.alumnoSeleccionado.matricula_id
    );

  },

  error:(err)=>{

    this.mostrarNotificacion(
      err.error?.message || 'Error al eliminar pago',
      'error'
    );

  }

 });


}

  // ======================
  // MODAL PLAN MANUAL
  // ======================
  abrirModalPlanManual() {
    this.modalManualAbierto = true;
    this.cerrarModalPlanManual(false);
  }

  cerrarModalPlanManual(cerrarOverlay = true) {
    if (cerrarOverlay) this.modalManualAbierto = false;
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
    this.cuotaTemporal = { numero_cuota: 1, fecha_vencimiento: '', monto: null, observaciones: '' };
  }

  buscarMatricula(event: Event) {
    const termino = (event.target as HTMLInputElement).value;
    if (termino.length < 3) {
      this.resultadosBusqueda = [];
      return;
    }

    clearTimeout(this.timeoutBusqueda);
    this.timeoutBusqueda = setTimeout(() => {
      this.pagosService.buscarMatriculas(termino).subscribe(res => {
        this.resultadosBusqueda = res;
        this.cd.detectChanges();
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
    this.formularioPlan.cuotas.forEach((c, i) => c.numero_cuota = i + 1);
    this.cuotaTemporal.numero_cuota = this.formularioPlan.cuotas.length + 1;
  }

  guardarPlanManual() {
    const totalCuotas = this.formularioPlan.cuotas.reduce(
      (sum, cuota) => sum + Number(cuota.monto || 0), 0
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
        this.mostrarNotificacion(err.error?.message || 'Error al crear plan', 'error');
      }
    });
  }

  // ======================
  // DETALLE ALUMNO
  // ======================
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
      error: () => this.loading = false
    });
  }

  cargarHistorial(id: number) {
    this.pagosService.historial(id).subscribe(data => {
      this.historial = data || [];
      this.cd.detectChanges();
    });
  }

  cerrarModal() {
    this.modalOpen = false;
  }

  cambiarTab(tab: any) {
    this.tab = tab;
    this.cd.detectChanges();
  }

  get cuotasOrdenadas() {
    if (!this.cuotasDetalle) return [];
    const orden: Record<string, number> = {
      MATRICULA: 1,
      CUOTA: 2,
      CERTIFICACION: 3
    };

    return [...this.cuotasDetalle].sort((a, b) => {
      const ordenA = orden[a.concepto_codigo] ?? 99;
      const ordenB = orden[b.concepto_codigo] ?? 99;
      if (ordenA !== ordenB) return ordenA - ordenB;
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
      this.formPago.monto = cuota.saldo_pendiente;
      this.cd.detectChanges();
    }
  }

  getCuotaSeleccionada() {
    return this.cuotasDetalle.find(c => c.id == this.formPago.cuota_id);
  }

  // ======================
  // OPERACIONES CON ALERTAS ASÍNCRONAS FIJADAS
  // ======================
  recalcularPlan() {
    if (!this.alumnoSeleccionado?.plan_pago_alumno_id) {
      this.mostrarNotificacion('No hay plan de pago disponible', 'error');
      return;
    }

    this.pagosService.recalcularPlan({
      plan_pago_alumno_id: this.alumnoSeleccionado.plan_pago_alumno_id,
      tipo: this.formRecalculo.tipo,
      fecha_inicio: this.formRecalculo.fecha_inicio,
      cantidad_cuotas: this.formRecalculo.cantidad_cuotas
    }).subscribe({
      next: () => {
        this.mostrarNotificacion('Plan de pagos recalculado con éxito', 'success');
        this.miniModalOpen = false;
        this.verDetalle(this.alumnoSeleccionado.matricula_id);
      },
      error: (err) => {
        this.mostrarNotificacion(err?.error?.error || 'Error al recalcular el plan', 'error');
      }
    });
  }

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

    this.pagosService.actualizarFechas(data).subscribe({
      next: () => {
        this.mostrarNotificacion('Fechas de vencimiento actualizadas', 'success');
        this.editandoFechas = false;
        this.verDetalle(this.alumnoSeleccionado.matricula_id);
      },
      error: (err) => {
        console.error(err);
        this.mostrarNotificacion('Error al actualizar fechas', 'error');
      }
    });
  }

  registrarPago() {
    if (!this.formPago.cuota_id || !this.formPago.monto) {
      this.mostrarNotificacion('Por favor, complete todos los campos obligatorios.', 'warning');
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
        this.formPago = { cuota_id: null, monto: null, metodo_pago: 'EFECTIVO' };
        this.selectedFile = null;
        this.verDetalle(this.alumnoSeleccionado.matricula_id);
      },
      error: (err) => this.mostrarNotificacion(err?.error?.message || 'Error al procesar el pago', 'error')
    });
  }

  abrirMiniPago(c: any) {
    this.miniPago = c;
    this.miniModalOpen = true;
    this.miniPagoForm = {
      cuota_id: c.id,
      monto: c.saldo_pendiente,
      metodo_pago: 'EFECTIVO'
    };
  }

  pagarMini() {
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
      error: (err) => this.mostrarNotificacion(err?.error?.message || 'Error en pago rápido', 'error')
    });
  }

  // ======================
  // FORMATOS Y UTILIDADES
  // ======================
  formatMonto(v: number) {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(v || 0);
  }

  formatFecha(f: string | Date) {
    if (!f) return '-';
    return new Date(f).toLocaleDateString('es-PE');
  }

  getTotalDeuda() {
    return this.cuotasDetalle.reduce((a, b) => a + Number(b.saldo_pendiente || 0), 0);
  }

  getTotalCuotas() {
    return this.cuotasDetalle.length;
  }

  get cuotasPendientes() {
    return this.cuotasDetalle.filter(c => c.saldo_pendiente > 0);
  }

  onFileSelected(e: any) {
    this.selectedFile = e.target.files[0];
  }

  onMiniFileSelected(e: any) {
    this.miniFile = e.target.files[0];
  }

  getComprobanteUrl(url?: string | null): string {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.includes('proedso/')) {
      const index = url.indexOf('proedso/');
      const pathLimpio = url.substring(index);
      return `https://res.cloudinary.com/dfx6p5sjd/image/upload/${pathLimpio}`;
    }
    if (url.startsWith('/uploads/')) {
      return url;
    }
    return `/uploads/pagos/${url}`;
  }

  // ======================
  // MANEJO DE NOTIFICACIONES
  // ======================
  mostrarNotificacion(msg: string, tipo: 'success' | 'error' | 'warning' = 'success') {
    this.notificacion.visible = false;
    this.cd.detectChanges();

    this.notificacion = { visible: true, mensaje: msg, tipo };
    this.cd.detectChanges();

    setTimeout(() => {
      this.notificacion.visible = false;
      this.cd.detectChanges();
    }, 4000); 
  }

  trackByAlumno(i: number, a: any) {
    return a.matricula_id;
  }
}
