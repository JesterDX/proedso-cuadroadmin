import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import Swal from 'sweetalert2';

import {
  TipoCurso
} from '../models/tipo-curso.model';

import {
  PlanCurso
} from '../models/plan-curso.model';

import {
  TiposCursoService
} from '../services/tipos-curso.service';

import {
  PlanesCursoService
} from '../services/planes-curso.service';


@Component({
  selector: 'app-tipos-curso',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './tipos-curso.html',
  styleUrl: './tipos-curso.scss'
})
export class TiposCursoComponent implements OnInit {

  private readonly tiposService =
    inject(TiposCursoService);

  private readonly planesService =
    inject(PlanesCursoService);

  private readonly router =
    inject(Router);

  private readonly cd =
    inject(ChangeDetectorRef);


  // ==========================================================
  // DATOS
  // ==========================================================

  tiposCurso: TipoCurso[] = [];

  planesCurso: PlanCurso[] = [];


  // ==========================================================
  // SELECCIÓN
  // ==========================================================

  tipoSeleccionado: TipoCurso | null = null;


  // ==========================================================
  // BUSCADOR
  // ==========================================================

  busqueda = '';


  // ==========================================================
  // CARGANDO
  // ==========================================================

  cargandoTipos = false;

  cargandoPlanes = false;


  // ==========================================================
  // FORMULARIO TIPO
  // ==========================================================

  mostrarFormulario = false;

  modoEdicion = false;

  idEditando: number | null = null;


  nuevoTipo: Omit<TipoCurso, 'id'> = {

    codigo: '',

    nombre: '',

    duracion_meses: 1,

    cantidad_maquinas: 1,

    activo: true

  };


  // ==========================================================
  // INIT
  // ==========================================================

  ngOnInit(): void {

    this.cargarTipos();

    this.cargarPlanes();

  }


  // ==========================================================
  // TIPOS
  // ==========================================================

  cargarTipos(): void {

    this.cargandoTipos = true;

    this.tiposService.listar()
      .subscribe({

        next: (resp: any) => {

          this.tiposCurso =
            resp?.data ?? [];

          this.cargandoTipos = false;

          /*
           * Si todavía no hay selección,
           * seleccionamos el primer tipo activo.
           */

          if (!this.tipoSeleccionado) {

            const primero =
              this.tiposCurso.find(
                tipo => tipo.activo
              );

            if (primero) {

              this.seleccionarTipo(primero);

            }

          }
          else {

            const actualizado =
              this.tiposCurso.find(
                tipo =>
                  tipo.id ===
                  this.tipoSeleccionado?.id
              );

            if (actualizado) {

              this.tipoSeleccionado =
                actualizado;

            }

          }

          this.cd.detectChanges();

        },

        error: (error) => {

          console.error(
            'Error cargando tipos de curso:',
            error
          );

          this.cargandoTipos = false;

        }

      });

  }


  // ==========================================================
  // PLANES
  // ==========================================================

  cargarPlanes(): void {

    this.cargandoPlanes = true;

    this.planesService.listar()
      .subscribe({

        next: (resp) => {

          this.planesCurso =
            resp?.data ?? [];

          this.cargandoPlanes = false;

          this.cd.detectChanges();

        },

        error: (error) => {

          console.error(
            'Error cargando planes:',
            error
          );

          this.cargandoPlanes = false;

        }

      });

  }


  // ==========================================================
  // TIPOS FILTRADOS
  // ==========================================================

  get tiposFiltrados(): TipoCurso[] {

    const texto =
      this.busqueda
        .trim()
        .toLowerCase();

    if (!texto) {

      return this.tiposCurso;

    }

    return this.tiposCurso.filter(tipo =>

      tipo.codigo
        .toLowerCase()
        .includes(texto)

      ||

      tipo.nombre
        .toLowerCase()
        .includes(texto)

    );

  }


  // ==========================================================
  // SELECCIONAR TIPO
  // ==========================================================

  seleccionarTipo(tipo: TipoCurso): void {

    this.tipoSeleccionado = tipo;

  }


  // ==========================================================
  // PLANES DEL TIPO SELECCIONADO
  // ==========================================================

  get planesDelTipo(): PlanCurso[] {

    if (!this.tipoSeleccionado) {

      return [];

    }

    return this.planesCurso
      .filter(
        plan =>
          plan.tipo_curso_id ===
          this.tipoSeleccionado!.id
      );

  }


  // ==========================================================
  // NUEVO TIPO
  // ==========================================================

  nuevo(): void {

    this.modoEdicion = false;

    this.idEditando = null;

    this.nuevoTipo = {

      codigo: '',

      nombre: '',

      duracion_meses: 1,

      cantidad_maquinas: 1,

      activo: true

    };

    this.mostrarFormulario = true;

  }


  // ==========================================================
  // EDITAR TIPO
  // ==========================================================

  editar(tipo: TipoCurso): void {

    this.modoEdicion = true;

    this.idEditando = tipo.id;

    this.nuevoTipo = {

      codigo: tipo.codigo,

      nombre: tipo.nombre,

      duracion_meses:
        tipo.duracion_meses,

      cantidad_maquinas:
        tipo.cantidad_maquinas,

      activo: tipo.activo

    };

    this.mostrarFormulario = true;

  }


  // ==========================================================
  // CERRAR
  // ==========================================================

  cerrarFormulario(): void {

    this.mostrarFormulario = false;

  }


  // ==========================================================
  // GUARDAR TIPO
  // ==========================================================

  guardarTipo(): void {

    if (
      !this.nuevoTipo.codigo.trim() ||
      !this.nuevoTipo.nombre.trim()
    ) {

      Swal.fire(
        'Datos incompletos',
        'Completa el código y el nombre.',
        'warning'
      );

      return;

    }

    if (
      this.nuevoTipo.duracion_meses < 1 ||
      this.nuevoTipo.cantidad_maquinas < 1
    ) {

      Swal.fire(
        'Datos inválidos',
        'La duración y cantidad de máquinas deben ser mayores a 0.',
        'warning'
      );

      return;

    }


    const payload = {

      codigo:
        this.nuevoTipo.codigo
          .trim()
          .toUpperCase(),

      nombre:
        this.nuevoTipo.nombre
          .trim(),

      duracion_meses:
        Number(this.nuevoTipo.duracion_meses),

      cantidad_maquinas:
        Number(this.nuevoTipo.cantidad_maquinas),

      activo:
        this.nuevoTipo.activo

    };


    const peticion =
      this.modoEdicion &&
      this.idEditando !== null

        ? this.tiposService.actualizar(
            this.idEditando,
            payload
          )

        : this.tiposService.crear(
            payload
          );


    peticion.subscribe({

      next: () => {

        Swal.fire({

          icon: 'success',

          title: this.modoEdicion
            ? 'Tipo actualizado'
            : 'Tipo creado',

          text: this.modoEdicion
            ? 'Los cambios fueron guardados.'
            : 'El tipo de curso fue registrado.',

          timer: 1600,

          showConfirmButton: false

        });

        this.cerrarFormulario();

        this.cargarTipos();

      },

      error: (error) => {

        console.error(
          'Error guardando tipo:',
          error
        );

        Swal.fire(
          'No se pudo guardar',
          error?.error?.message ??
            'Ocurrió un error al guardar el tipo de curso.',
          'error'
        );

      }

    });

  }


  // ==========================================================
  // ACTIVAR / DESACTIVAR
  // ==========================================================

  desactivar(tipo: TipoCurso): void {

    const nuevoEstado =
      !tipo.activo;


    Swal.fire({

      title:
        nuevoEstado
          ? '¿Activar tipo de curso?'
          : '¿Desactivar tipo de curso?',

      text:
        nuevoEstado
          ? 'El tipo volverá a estar disponible.'
          : 'El tipo dejará de estar disponible para nuevos registros.',

      icon: 'question',

      showCancelButton: true,

      confirmButtonText:
        nuevoEstado
          ? 'Sí, activar'
          : 'Sí, desactivar',

      cancelButtonText:
        'Cancelar'

    }).then(resultado => {

      if (!resultado.isConfirmed) {

        return;

      }


      this.tiposService
        .cambiarEstado(
          tipo.id,
          nuevoEstado
        )
        .subscribe({

          next: () => {

            tipo.activo =
              nuevoEstado;

            this.cd.detectChanges();

            Swal.fire({

              icon: 'success',

              title:
                nuevoEstado
                  ? 'Tipo activado'
                  : 'Tipo desactivado',

              timer: 1300,

              showConfirmButton: false

            });

          },

          error: (error) => {

            console.error(error);

            Swal.fire(
              'Error',
              error?.error?.message ??
                'No se pudo cambiar el estado.',
              'error'
            );

          }

        });

    });

  }


  // ==========================================================
  // CREAR PLAN
  // ==========================================================

  nuevoPlan(): void {

    if (!this.tipoSeleccionado) {

      return;

    }

    this.router.navigate(
      ['/configurar-plan'],
      {
        queryParams: {
          tipoCursoId:
            this.tipoSeleccionado.id
        }
      }
    );

  }


  // ==========================================================
  // CONFIGURAR PLAN
  // ==========================================================

  configurarPlan(plan: PlanCurso): void {

    this.router.navigate(
      ['/configurar-plan', plan.id]
    );

  }


  // ==========================================================
  // TRACK
  // ==========================================================

  trackTipo(
    _index: number,
    tipo: TipoCurso
  ): number {

    return tipo.id;

  }


  trackPlan(
    _index: number,
    plan: PlanCurso
  ): number {

    return plan.id;

  }

}
