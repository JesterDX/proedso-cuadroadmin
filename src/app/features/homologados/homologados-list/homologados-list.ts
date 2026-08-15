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
// INTERFACE
// ============================================================

export interface Homologado {

  id?: number;

  alumno?: string;

  dni?: string | number;

  celular?: string;

  curso_equipo?: string;

  vendedor?: string;

  monto_total?: number;

  monto_pagado?: number;

  saldo_pendiente?: number;

  estado_pago?: string;

  estado_documento?: string;

  estado?: string;

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
export class HomologadosListComponent
  implements OnInit {


  // ==========================================================
  // DATOS
  // ==========================================================

  homologados: Homologado[] = [];

  homologadosFiltrados: Homologado[] = [];


  // ==========================================================
  // ESTADO
  // ==========================================================

  loading = false;


  // ==========================================================
  // FILTROS
  // ==========================================================

  busqueda = '';

  estadoSeleccionado = '';

  documentoSeleccionado = '';

  vendedorSeleccionado = '';


  // ==========================================================
  // PAGINACIÓN
  // ==========================================================

  paginaActual = 1;

  itemsPorPagina = 15;


  Math = Math;


  // ==========================================================
  // CONSTRUCTOR
  // ==========================================================

  constructor(

    private readonly service: HomologadosService,

    private readonly cd: ChangeDetectorRef

  ) {}


  // ==========================================================
  // INIT
  // ==========================================================

  ngOnInit(): void {

    this.cargarHomologados();

  }


  // ==========================================================
  // CARGAR
  // ==========================================================

  cargarHomologados(): void {

    if (this.loading) {
      return;
    }

    this.loading = true;


    this.service.listar()
      .subscribe({

        next: (resp: any) => {

          console.log(
            'Respuesta homologaciones:',
            resp
          );


          this.homologados =
            (resp?.data ?? [])
              .map(
                (homologado: Homologado) =>
                  this.formatearHomologado(
                    homologado
                  )
              );


          this.aplicarFiltros();


          this.loading = false;


          this.cd.detectChanges();

        },


        error: (err: any) => {

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


  // ==========================================================
  // FORMATEAR
  // ==========================================================

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


  // ==========================================================
  // FECHA
  // ==========================================================

  private formatearFecha(
    fecha?: string
  ): string {

    if (!fecha) {
      return '';
    }


    const fechaTexto =
      String(fecha)
        .substring(0, 10);


    const partes =
      fechaTexto.split('-');


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


  // ==========================================================
  // FILTROS
  // ==========================================================

  aplicarFiltros(): void {

    const texto =
      this.busqueda
        .toLowerCase()
        .trim();


    this.homologadosFiltrados =
      this.homologados.filter(
        (h: Homologado) => {


          const coincideBusqueda =

            !texto ||

            (h.alumno ?? '')
              .toLowerCase()
              .includes(texto) ||

            String(h.dni ?? '')
              .includes(texto) ||

            (h.curso_equipo ?? '')
              .toLowerCase()
              .includes(texto);


          const coincideEstado =

            !this.estadoSeleccionado ||

            h.estado ===
              this.estadoSeleccionado;


          const coincideDocumento =

            !this.documentoSeleccionado ||

            h.estado_documento ===
              this.documentoSeleccionado;


          const coincideVendedor =

            !this.vendedorSeleccionado ||

            h.vendedor ===
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


  // ==========================================================
  // EVENTOS
  // ==========================================================

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


  // ==========================================================
  // PAGINACIÓN
  // ==========================================================

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

      (this.paginaActual - 1) *
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


  // ==========================================================
  // ACCIONES
  // ==========================================================

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


  // ==========================================================
  // IMPORTAR
  // ==========================================================

  importarSheets(): void {

    console.log(
      'Importar Google Sheets'
    );

  }


  // ==========================================================
  // ACTUALIZAR
  // ==========================================================

  actualizar(): void {

    this.cargarHomologados();

  }

}
