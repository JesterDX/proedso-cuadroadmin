import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  HomologadosService
} from '../homologado-service/homologacion-service';


// ============================================================
// INTERFACES
// ============================================================

export interface Homologado {

  id?: number;

  alumno?: string;

  dni?: string | number;

  curso_equipo?: string;

  estado?: string;

  estado_documento?: string;

  vendedor?: string;

  fecha_registro?: string;

  fecha_registro_texto?: string;

}


// ============================================================
// COMPONENTE
// ============================================================

@Component({
  selector: 'app-homologados-list',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './homologados-list.html',

  styleUrl: './homologados-list.scss'
})
export class HomologadosListComponent implements OnInit {

  // ============================================================
  // DATOS
  // ============================================================

  homologados: Homologado[] = [];

  homologadosFiltrados: Homologado[] = [];


  // ============================================================
  // ESTADO
  // ============================================================

  loading: boolean = false;


  // ============================================================
  // FILTROS
  // ============================================================

  busqueda: string = '';

  estadoSeleccionado: string = '';

  documentoSeleccionado: string = '';

  vendedorSeleccionado: string = '';


  // ============================================================
  // PAGINACIÓN
  // ============================================================

  paginaActual: number = 1;

  itemsPorPagina: number = 15;


  // ============================================================
  // UTILIDADES PARA EL TEMPLATE
  // ============================================================

  Math = Math;


  // ============================================================
  // CONSTRUCTOR
  // ============================================================

  constructor(
    private readonly service: HomologadosService,
    private readonly cd: ChangeDetectorRef
  ) {}


  // ============================================================
  // CICLO DE VIDA
  // ============================================================

  ngOnInit(): void {

    this.cargarHomologados();

  }


  // ============================================================
  // CARGAR HOMOLOGADOS
  // ============================================================

  cargarHomologados(): void {

    this.loading = true;

    this.service.listar().subscribe({

      next: (resp: any) => {

        console.log(
          'Respuesta homologaciones:',
          resp
        );

        this.homologados = (resp.data ?? []).map(
          (homologado: Homologado) =>
            this.formatearHomologado(homologado)
        );

        this.aplicarFiltros();

        this.loading = false;

        this.cd.detectChanges();

      },

      error: (err) => {

        console.error(
          'Error cargando homologaciones:',
          err
        );

        this.homologados = [];

        this.homologadosFiltrados = [];

        this.loading = false;

        this.cd.detectChanges();

      }

    });

  }


  // ============================================================
  // FORMATEAR HOMOLOGADO
  // ============================================================

  private formatearHomologado(
    homologado: Homologado
  ): Homologado {

    return {
      ...homologado,

      fecha_registro_texto:
        this.formatearFecha(
          homologado.fecha_registro
        )
    };

  }


  // ============================================================
  // FORMATEAR FECHA
  // ============================================================

  private formatearFecha(
    fecha?: string
  ): string {

    if (!fecha) {
      return '';
    }

    const fechaTexto = String(fecha).substring(0, 10);

    const partes = fechaTexto.split('-');

    if (partes.length !== 3) {
      return '';
    }

    const [
      anio,
      mes,
      dia
    ] = partes;

    return `${dia}/${mes}/${anio}`;

  }


  // ============================================================
  // FILTROS
  // ============================================================

  aplicarFiltros(): void {

    const textoBusqueda =
      this.busqueda
        .toLowerCase()
        .trim();


    this.homologadosFiltrados =
      this.homologados.filter(
        (homologado: Homologado) => {

          const coincideBusqueda =
            this.coincideConBusqueda(
              homologado,
              textoBusqueda
            );


          const coincideEstado =
            !this.estadoSeleccionado ||
            homologado.estado ===
              this.estadoSeleccionado;


          const coincideDocumento =
            !this.documentoSeleccionado ||
            homologado.estado_documento ===
              this.documentoSeleccionado;


          const coincideVendedor =
            !this.vendedorSeleccionado ||
            homologado.vendedor ===
              this.vendedorSeleccionado;


          return (
            coincideBusqueda &&
            coincideEstado &&
            coincideDocumento &&
            coincideVendedor
          );

        }
      );


    this.paginaActual = 1;

  }


  // ============================================================
  // COINCIDENCIA DE BÚSQUEDA
  // ============================================================

  private coincideConBusqueda(
    homologado: Homologado,
    texto: string
  ): boolean {

    if (!texto) {
      return true;
    }


    const alumno =
      homologado.alumno
        ?.toLowerCase()
        ?? '';


    const dni =
      homologado.dni
        ?.toString()
        ?? '';


    const cursoEquipo =
      homologado.curso_equipo
        ?.toLowerCase()
        ?? '';


    return (
      alumno.includes(texto) ||
      dni.includes(texto) ||
      cursoEquipo.includes(texto)
    );

  }


  // ============================================================
  // EVENTOS DE FILTROS
  // ============================================================

  buscar(): void {

    this.aplicarFiltros();

  }


  filtrarEstado(): void {

    this.aplicarFiltros();

  }


  filtrarDocumento(): void {

    this.aplicarFiltros();

  }


  filtrarVendedor(): void {

    this.aplicarFiltros();

  }


  // ============================================================
  // PAGINACIÓN
  // ============================================================

  get totalPaginas(): number {

    return (
      Math.ceil(
        this.homologadosFiltrados.length /
        this.itemsPorPagina
      ) || 1
    );

  }


  get homologadosPagina(): Homologado[] {

    const inicio =
      (
        this.paginaActual - 1
      ) *
      this.itemsPorPagina;


    return this.homologadosFiltrados.slice(
      inicio,
      inicio + this.itemsPorPagina
    );

  }


  cambiarPagina(
    pagina: number
  ): void {

    if (
      pagina >= 1 &&
      pagina <= this.totalPaginas
    ) {

      this.paginaActual = pagina;

    }

  }


  // ============================================================
  // ACCIONES
  // ============================================================

  abrirNuevo(): void {

    console.log(
      'Nuevo homologado'
    );

  }


  editar(
    item: Homologado
  ): void {

    console.log(
      'Editar',
      item
    );

  }


  eliminar(
    item: Homologado
  ): void {

    console.log(
      'Eliminar',
      item
    );

  }


  verPagos(
    item: Homologado
  ): void {

    console.log(
      'Pagos',
      item
    );

  }


  importarSheets(): void {

    console.log(
      'Importar Google Sheets'
    );

  }


  // ============================================================
  // ACTUALIZAR
  // ============================================================

  actualizar(): void {

    this.cargarHomologados();

  }

}
