import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import Swal from 'sweetalert2';

import {
  PlanCurso
} from '../../models/plan-curso.model';

import {
  PlanesCursoService
} from '../../services/planes-curso-admin';


@Component({
  selector: 'app-planes-curso-list',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],

  templateUrl: './planes-curso.html',
  styleUrl: './planes-curso.scss'
})
export class PlanesCursoComponent
  implements OnInit {


  // ==========================================================
  // INYECCIONES
  // ==========================================================

  private readonly planesCursoService =
    inject(PlanesCursoService);

  private readonly cdr =
    inject(ChangeDetectorRef);


  // ==========================================================
  // DATOS
  // ==========================================================

  planes: PlanCurso[] = [];

  planesFiltrados: PlanCurso[] = [];


  // ==========================================================
  // ESTADOS
  // ==========================================================

  cargando = false;

  error = false;


  // ==========================================================
  // BÚSQUEDA
  // ==========================================================

  busqueda = '';


  // ==========================================================
  // FILTRO ESTADO
  // ==========================================================

  filtroEstado:
    'TODOS' |
    'ACTIVOS' |
    'INACTIVOS' = 'TODOS';


  // ==========================================================
  // PAGINACIÓN
  // ==========================================================

  paginaActual = 1;

  itemsPorPagina = 8;


  // ==========================================================
  // INIT
  // ==========================================================

  ngOnInit(): void {

    this.cargarPlanes();

  }


  // ==========================================================
  // CARGAR PLANES
  // ==========================================================

  cargarPlanes(): void {

    this.cargando = true;

    this.error = false;

    this.planesCursoService
      .listar()
      .subscribe({

        next: (response) => {

          if (response.ok) {

            this.planes =
              response.data ?? [];

            this.aplicarFiltros();

          } else {

            this.planes = [];

            this.planesFiltrados = [];

          }

          this.cargando = false;

          this.cdr.detectChanges();

        },

        error: (err) => {

          console.error(
            'Error al cargar planes de curso:',
            err
          );

          this.error = true;

          this.planes = [];

          this.planesFiltrados = [];

          this.cargando = false;

          this.cdr.detectChanges();

          Swal.fire({
            icon: 'error',
            title: 'Error',
            text:
              'No se pudieron cargar los planes de curso.'
          });

        }

      });

  }


  // ==========================================================
  // APLICAR FILTROS
  // ==========================================================

  aplicarFiltros(): void {

    const texto =
      this.busqueda
        .trim()
        .toLowerCase();


    this.planesFiltrados =
      this.planes.filter(
        (plan) => {

          const coincideBusqueda =
            !texto ||

            plan.codigo
              ?.toLowerCase()
              .includes(texto) ||

            plan.nombre
              ?.toLowerCase()
              .includes(texto) ||

            plan.tipo_curso_nombre
              ?.toLowerCase()
              .includes(texto);


          const coincideEstado =

            this.filtroEstado === 'TODOS'

              ? true

              : this.filtroEstado === 'ACTIVOS'
                ? plan.activo
                : !plan.activo;


          return Boolean(
            coincideBusqueda &&
            coincideEstado
          );

        }
      );


    this.paginaActual = 1;

  }


  // ==========================================================
  // CAMBIAR FILTRO ESTADO
  // ==========================================================

  cambiarFiltroEstado(
    estado:
      'TODOS' |
      'ACTIVOS' |
      'INACTIVOS'
  ): void {

    this.filtroEstado = estado;

    this.aplicarFiltros();

  }


  // ==========================================================
  // PLANES PAGINADOS
  // ==========================================================

  get planesPaginados(): PlanCurso[] {

    const inicio =
      (this.paginaActual - 1) *
      this.itemsPorPagina;

    const fin =
      inicio +
      this.itemsPorPagina;

    return this.planesFiltrados.slice(
      inicio,
      fin
    );

  }


  // ==========================================================
  // TOTAL PÁGINAS
  // ==========================================================

  get totalPaginas(): number {

    return Math.ceil(
      this.planesFiltrados.length /
      this.itemsPorPagina
    );

  }


  // ==========================================================
  // CAMBIAR PÁGINA
  // ==========================================================

  cambiarPagina(
    pagina: number
  ): void {

    if (
      pagina < 1 ||
      pagina > this.totalPaginas
    ) {

      return;

    }

    this.paginaActual = pagina;

  }


  // ==========================================================
  // SIGUIENTE
  // ==========================================================

  siguientePagina(): void {

    if (
      this.paginaActual <
      this.totalPaginas
    ) {

      this.paginaActual++;

    }

  }


  // ==========================================================
  // ANTERIOR
  // ==========================================================

  anteriorPagina(): void {

    if (
      this.paginaActual > 1
    ) {

      this.paginaActual--;

    }

  }


  // ==========================================================
  // CAMBIAR ESTADO
  // ==========================================================

  cambiarEstado(
    plan: PlanCurso
  ): void {

    const nuevoEstado =
      !plan.activo;


    Swal.fire({

      icon:
        nuevoEstado
          ? 'question'
          : 'warning',

      title:
        nuevoEstado
          ? '¿Activar plan?'
          : '¿Desactivar plan?',

      text:
        nuevoEstado
          ? `¿Deseas activar "${plan.nombre}"?`
          : `¿Deseas desactivar "${plan.nombre}"?`,

      showCancelButton: true,

      confirmButtonText:
        nuevoEstado
          ? 'Sí, activar'
          : 'Sí, desactivar',

      cancelButtonText:
        'Cancelar'

    }).then((result) => {

      if (!result.isConfirmed) {

        return;

      }


      this.planesCursoService
        .cambiarEstado(
          plan.id,
          nuevoEstado
        )
        .subscribe({

          next: (response) => {

            if (response.ok) {

              plan.activo =
                nuevoEstado;

              this.aplicarFiltros();

              Swal.fire({

                icon: 'success',

                title: 'Listo',

                text:
                  nuevoEstado
                    ? 'Plan activado correctamente.'
                    : 'Plan desactivado correctamente.',

                timer: 1800,

                showConfirmButton: false

              });

              this.cdr.detectChanges();

            }

          },

          error: (err) => {

            console.error(
              'Error al cambiar estado:',
              err
            );

            Swal.fire({

              icon: 'error',

              title: 'Error',

              text:
                'No se pudo cambiar el estado del plan.'

            });

          }

        });

    });

  }


  // ==========================================================
  // TRACK BY
  // ==========================================================

  trackById(
    index: number,
    plan: PlanCurso
  ): number {

    return plan.id;

  }

}
