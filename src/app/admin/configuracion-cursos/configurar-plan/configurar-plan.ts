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
  PlanHoraPractica,
  PlanPrecio
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

  private readonly planesCursoService = inject(PlanesCursoService);
  private readonly maquinasService = inject(MaquinasAdminService);

  // ============================================================
  // INPUTS / OUTPUTS
  // ============================================================

  @Input() tipoCurso: TipoCurso | null = null;

  @Input() plan: PlanCurso | null = null;

  @Output() guardado = new EventEmitter<PlanCurso>();

  @Output() cancelar = new EventEmitter<void>();

  // ============================================================
  // ESTADO
  // ============================================================

  cargando = false;
  guardando = false;

  maquinasDisponibles: Maquina[] = [];

  // ============================================================
  // FORMULARIO
  // ============================================================

  formulario: PlanCursoPayload = {
    tipo_curso_id: 0,
    codigo: '',
    nombre: '',
    version: 1,
    permite_eleccion_personalizada: false,
    vigente_desde: null,
    vigente_hasta: null,
    activo: true,
    observaciones: '',
    maquinas: [],
    horas_practica: [],
    precios: []
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

  get cantidadMaquinasSeleccionadas(): number {
    return this.formulario.maquinas.length;
  }

  get cantidadMaquinasPermitidas(): number {
    return this.tipoCurso?.cantidad_maquinas ?? 0;
  }

  get maquinasCompletas(): boolean {
    if (!this.tipoCurso) {
      return false;
    }

    return (
      this.formulario.maquinas.length ===
      this.tipoCurso.cantidad_maquinas
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
  // INICIALIZACIÓN
  // ============================================================

  private inicializarFormulario(): void {

    if (!this.tipoCurso) {
      return;
    }

    this.formulario = {
      tipo_curso_id: this.tipoCurso.id,
      codigo: '',
      nombre: '',
      version: 1,
      permite_eleccion_personalizada: false,
      vigente_desde: null,
      vigente_hasta: null,
      activo: true,
      observaciones: '',
      maquinas: [],
      horas_practica: [],
      precios: []
    };

    if (this.plan) {
      this.cargarPlanExistente(this.plan);
    }
  }

  private cargarPlanExistente(plan: PlanCurso): void {

    this.formulario = {
      tipo_curso_id:
        plan.tipo_curso_id ??
        this.tipoCurso?.id ??
        0,

      codigo: plan.codigo ?? '',

      nombre: plan.nombre ?? '',

      version: plan.version ?? 1,

      permite_eleccion_personalizada:
        plan.permite_eleccion_personalizada ?? false,

      vigente_desde:
        plan.vigente_desde ?? null,

      vigente_hasta:
        plan.vigente_hasta ?? null,

      activo:
        plan.activo ?? true,

      observaciones:
        plan.observaciones ?? '',

      maquinas:
        (plan.maquinas ?? []).map(maquina => ({
          id: maquina.id,
          maquina_id: maquina.maquina_id,
          maquina_nombre: maquina.maquina_nombre,
          orden: maquina.orden ?? 1,
          es_regalo: maquina.es_regalo ?? false,
          obligatoria: maquina.obligatoria ?? true
        })),

      horas_practica:
        (plan.horas_practica ?? []).map(practica => ({
          id: practica.id,
          maquina_id: practica.maquina_id,
          maquina_nombre: practica.maquina_nombre,
          horas: practica.horas ?? 0,
          sesiones_totales: practica.sesiones_totales ?? 1
        })),

      precios:
        (plan.precios ?? []).map(precio => ({
          id: precio.id,
          nombre: precio.nombre ?? '',
          monto_total: precio.monto_total ?? null,
          matricula: precio.matricula ?? 0,
          certificacion: precio.certificacion ?? 0,
          cantidad_cuotas: precio.cantidad_cuotas ?? 1,
          monto_cuota: precio.monto_cuota ?? null,

          vigente_desde:
            precio.vigente_desde ?? null,

          vigente_hasta:
            precio.vigente_hasta ?? null,

          activo:
            precio.activo ?? true,

          observaciones:
            precio.observaciones ?? '',

          aplica_maquina_id:
            precio.aplica_maquina_id ?? null,

          aplica_maquina_nombre:
            precio.aplica_maquina_nombre,

          requiere_tractor:
            precio.requiere_tractor ?? false
        }))
    };

    this.asegurarPracticasDeMaquinas();
  }

  // ============================================================
  // MAQUINAS
  // ============================================================

  private cargarMaquinas(): void {

    this.cargando = true;

    this.maquinasService.listarTodas().subscribe({
      next: maquinas => {

        this.maquinasDisponibles = [...maquinas].sort(
          (a, b) =>
            a.nombre.localeCompare(b.nombre)
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
          text: 'No se pudieron cargar las máquinas.'
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
        maquina.maquina_id === maquinaId
    );
  }

  toggleMaquina(maquina: Maquina): void {

    const index =
      this.formulario.maquinas.findIndex(
        item =>
          item.maquina_id === maquina.id
      );

    // ----------------------------------------------------------
    // QUITAR
    // ----------------------------------------------------------

    if (index >= 0) {

      this.formulario.maquinas.splice(
        index,
        1
      );

      this.formulario.horas_practica =
        this.formulario.horas_practica.filter(
          practica =>
            practica.maquina_id !== maquina.id
        );

      return;
    }

    // ----------------------------------------------------------
    // VALIDAR CANTIDAD
    // ----------------------------------------------------------

    if (
      this.tipoCurso &&
      this.formulario.maquinas.length >=
        this.tipoCurso.cantidad_maquinas
    ) {

      Swal.fire({
        icon: 'warning',
        title: 'Límite alcanzado',
        text:
          `Este tipo de curso permite seleccionar ` +
          `${this.tipoCurso.cantidad_maquinas} máquina(s).`
      });

      return;
    }

    // ----------------------------------------------------------
    // AGREGAR
    // ----------------------------------------------------------

    const nuevaMaquina: PlanMaquina = {
      maquina_id: maquina.id,
      maquina_nombre: maquina.nombre,
      orden:
        this.formulario.maquinas.length + 1,
      es_regalo: false,
      obligatoria: true
    };

    this.formulario.maquinas.push(
      nuevaMaquina
    );

    this.asegurarPractica(
      maquina.id,
      maquina.nombre
    );

    this.reordenarMaquinas();
  }

  quitarMaquina(maquinaId: number): void {

    const index =
      this.formulario.maquinas.findIndex(
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
      this.formulario.horas_practica.filter(
        practica =>
          practica.maquina_id !== maquinaId
      );

    this.reordenarMaquinas();
  }

  private reordenarMaquinas(): void {

    this.formulario.maquinas.forEach(
      (maquina, index) => {
        maquina.orden = index + 1;
      }
    );
  }

  // ============================================================
  // PRÁCTICAS
  // ============================================================

  obtenerPractica(
    maquinaId: number
  ): PlanHoraPractica | undefined {

    return this.formulario.horas_practica.find(
      practica =>
        practica.maquina_id === maquinaId
    );
  }

  private asegurarPractica(
    maquinaId: number,
    maquinaNombre?: string
  ): PlanHoraPractica {

    let practica =
      this.obtenerPractica(maquinaId);

    if (!practica) {

      practica = {
        maquina_id: maquinaId,
        maquina_nombre: maquinaNombre,
        horas: 0,
        sesiones_totales: 1
      };

      this.formulario.horas_practica.push(
        practica
      );
    }

    return practica;
  }

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

  actualizarHoras(
    maquinaId: number,
    valor: number | string
  ): void {

    const maquina =
      this.formulario.maquinas.find(
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
      Number.isFinite(horas) && horas >= 0
        ? horas
        : 0;
  }

  actualizarSesiones(
    maquinaId: number,
    valor: number | string
  ): void {

    const maquina =
      this.formulario.maquinas.find(
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
        ? sesiones
        : 1;
  }

  horasPorSesion(
    maquinaId: number
  ): number | null {

    const practica =
      this.obtenerPractica(maquinaId);

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

  eliminarPracticaDeMaquina(
    maquinaId: number
  ): void {

    this.formulario.horas_practica =
      this.formulario.horas_practica.filter(
        practica =>
          practica.maquina_id !== maquinaId
      );
  }

  // ============================================================
  // PRECIOS
  // ============================================================

  agregarPrecio(): void {

    const nuevoPrecio: PlanPrecio = {
      nombre: 'Nuevo precio',
      monto_total: 0,
      matricula: 0,
      certificacion: 0,
      cantidad_cuotas: 1,
      monto_cuota: 0,
      vigente_desde: null,
      vigente_hasta: null,
      activo: true,
      observaciones: '',
      aplica_maquina_id: null,
      requiere_tractor: false
    };

    this.formulario.precios.push(
      nuevoPrecio
    );
  }

  eliminarPrecio(index: number): void {

    this.formulario.precios.splice(
      index,
      1
    );
  }

  actualizarMontoCuota(
    precio: PlanPrecio
  ): void {

    const total =
      Number(precio.monto_total);

    const cuotas =
      Number(precio.cantidad_cuotas);

    if (
      Number.isFinite(total) &&
      total >= 0 &&
      Number.isFinite(cuotas) &&
      cuotas > 0
    ) {

      precio.monto_cuota =
        Number(
          (total / cuotas).toFixed(2)
        );

    } else {

      precio.monto_cuota = null;
    }
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

    return maquina.id ?? maquina.maquina_id;
  }

  trackPractica(
    index: number,
    practica: PlanHoraPractica
  ): number {

    return practica.id ?? practica.maquina_id;
  }

  trackPrecio(
    index: number,
    precio: PlanPrecio
  ): number {

    return precio.id ?? index;
  }

  // ============================================================
  // VALIDACIÓN
  // ============================================================

  private validarFormulario(): boolean {

    if (!this.tipoCurso) {

      Swal.fire({
        icon: 'error',
        title: 'Tipo de curso no seleccionado',
        text:
          'No se recibió el tipo de curso.'
      });

      return false;
    }

    // ----------------------------------------------------------
    // DATOS BÁSICOS
    // ----------------------------------------------------------

    if (
      !this.formulario.codigo.trim()
    ) {

      Swal.fire({
        icon: 'warning',
        title: 'Código requerido',
        text:
          'Ingresa el código del plan.'
      });

      return false;
    }

    if (
      !this.formulario.nombre.trim()
    ) {

      Swal.fire({
        icon: 'warning',
        title: 'Nombre requerido',
        text:
          'Ingresa el nombre del plan.'
      });

      return false;
    }

    // ----------------------------------------------------------
    // MÁQUINAS
    // ----------------------------------------------------------

    if (
      this.formulario.maquinas.length === 0
    ) {

      Swal.fire({
        icon: 'warning',
        title: 'Máquinas requeridas',
        text:
          'Selecciona al menos una máquina.'
      });

      return false;
    }

    if (
      this.formulario.maquinas.length !==
      this.tipoCurso.cantidad_maquinas
    ) {

      Swal.fire({
        icon: 'warning',
        title: 'Cantidad de máquinas incorrecta',
        text:
          `El tipo de curso requiere exactamente ` +
          `${this.tipoCurso.cantidad_maquinas} máquina(s).`
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
          title: 'Horas de práctica faltantes',
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
          title: 'Horas de práctica inválidas',
          text:
            `Las horas de práctica de ` +
            `${maquina.maquina_nombre ?? 'la máquina'} ` +
            `deben ser mayores a 0.`
        });

        return false;
      }

      if (
        Number(practica.sesiones_totales) <= 0
      ) {

        Swal.fire({
          icon: 'warning',
          title: 'Sesiones inválidas',
          text:
            `Las sesiones de ` +
            `${maquina.maquina_nombre ?? 'la máquina'} ` +
            `deben ser mayores a 0.`
        });

        return false;
      }
    }

    // ----------------------------------------------------------
    // PRECIOS
    // ----------------------------------------------------------

    for (
      const precio
      of this.formulario.precios
    ) {

      if (
        !precio.nombre?.trim()
      ) {

        Swal.fire({
          icon: 'warning',
          title: 'Nombre de precio requerido',
          text:
            'Todos los precios deben tener un nombre.'
        });

        return false;
      }

      if (
        Number(precio.monto_total ?? 0) < 0
      ) {

        Swal.fire({
          icon: 'warning',
          title: 'Monto inválido',
          text:
            `El monto del precio "${precio.nombre}" ` +
            `no puede ser negativo.`
        });

        return false;
      }

      if (
        Number(precio.cantidad_cuotas ?? 0) <= 0
      ) {

        Swal.fire({
          icon: 'warning',
          title: 'Cuotas inválidas',
          text:
            `El precio "${precio.nombre}" ` +
            `debe tener al menos una cuota.`
        });

        return false;
      }
    }

    return true;
  }

  // ============================================================
  // PAYLOAD
  // ============================================================

  private construirPayload(): PlanCursoPayload {

    return {
      tipo_curso_id:
        this.tipoCurso?.id ??
        this.formulario.tipo_curso_id,

      codigo:
        this.formulario.codigo.trim(),

      nombre:
        this.formulario.nombre.trim(),

      version:
        Number(this.formulario.version) || 1,

      permite_eleccion_personalizada:
        Boolean(
          this.formulario
            .permite_eleccion_personalizada
        ),

      vigente_desde:
        this.formulario.vigente_desde || null,

      vigente_hasta:
        this.formulario.vigente_hasta || null,

      activo:
        Boolean(this.formulario.activo),

      observaciones:
        this.formulario.observaciones?.trim() || null,

      maquinas:
        this.formulario.maquinas.map(
          maquina => ({
            id: maquina.id,
            maquina_id: maquina.maquina_id,
            orden: maquina.orden,
            es_regalo:
              Boolean(maquina.es_regalo),
            obligatoria:
              Boolean(maquina.obligatoria)
          })
        ),

      horas_practica:
        this.formulario.horas_practica
          .filter(
            practica =>
              this.formulario.maquinas.some(
                maquina =>
                  maquina.maquina_id ===
                  practica.maquina_id
              )
          )
          .map(
            practica => ({
              id: practica.id,
              maquina_id:
                practica.maquina_id,
              horas:
                Number(practica.horas) || 0,
              sesiones_totales:
                Number(
                  practica.sesiones_totales
                ) || 1
            })
          ),

      precios:
        this.formulario.precios.map(
          precio => ({
            id: precio.id,

            nombre:
              precio.nombre.trim(),

            monto_total:
              precio.monto_total !== null &&
              precio.monto_total !== undefined
                ? Number(
                    precio.monto_total
                  )
                : null,

            matricula:
              Number(precio.matricula) || 0,

            certificacion:
              Number(precio.certificacion) || 0,

            cantidad_cuotas:
              Number(
                precio.cantidad_cuotas
              ) || 1,

            monto_cuota:
              precio.monto_cuota !== null &&
              precio.monto_cuota !== undefined
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
              Boolean(precio.activo),

            observaciones:
              precio.observaciones?.trim() ||
              null,

            aplica_maquina_id:
              precio.aplica_maquina_id ??
              null,

            requiere_tractor:
              Boolean(
                precio.requiere_tractor
              )
          })
        )
    };
  }

  // ============================================================
  // GUARDAR
  // ============================================================

  guardar(): void {

    if (this.guardando) {
      return;
    }

    if (!this.validarFormulario()) {
      return;
    }

    const payload =
      this.construirPayload();

    this.guardando = true;

    const operacion =
      this.modoEdicion && this.plan?.id
        ? this.planesCursoService.actualizar(
            this.plan.id,
            payload
          )
        : this.planesCursoService.crear(
            payload
          );

    operacion.subscribe({
      next: response => {

        this.guardando = false;

        if (!response?.data) {

          Swal.fire({
            icon: 'error',
            title: 'Error',
            text:
              'El servidor no devolvió el plan guardado.'
          });

          return;
        }

        Swal.fire({
          icon: 'success',
          title: this.modoEdicion
            ? 'Plan actualizado'
            : 'Plan creado',
          text: this.modoEdicion
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
          title: 'No se pudo guardar',
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
