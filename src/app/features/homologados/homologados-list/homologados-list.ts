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

  saldo_pendiente: number;

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

  cargandoImportacion = false;


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

  readonly maxPaginasVisibles = 5;


  // ==========================================================
  // UTILIDADES TEMPLATE
  // ==========================================================

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
  // CARGAR HOMOLOGADOS
  // ==========================================================

  cargarHomologados(): void {

    this.loading = true;

    this.service.listar()
      .subscribe({

        next: (resp: any) => {

          console.log(
            'Respuesta homologaciones:',
            resp
          );


          this.homologados =
            (resp?.data ?? []).map(
              (homologado: Homologado) =>
                this.formatearHomologado(
                  homologado
                )
            );


          this.aplicarFiltros(
            false
          );


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

          this.paginaActual = 1;

          this.loading = false;


          this.cd.detectChanges();

        }

      });

  }


  // ==========================================================
  // FORMATEAR HOMOLOGADO
  // ==========================================================

  private formatearHomologado(
    homologado: Homologado
  ): Homologado {

    return {

      ...homologado,

      saldo_pendiente:
        Number(
          homologado.saldo_pendiente ?? 0
        ),

      fecha_registro_texto:
        this.formatearFecha(
          homologado.fecha_registro
        )

    };

  }


  // ==========================================================
  // FORMATEAR FECHA
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

  aplicarFiltros(
    reiniciarPagina: boolean = true
  ): void {

    const texto =
      this.busqueda
        .toLowerCase()
        .trim();


    this.homologadosFiltrados =
      this.homologados.filter(
        (h: Homologado) => {

          // ------------------------------------------
          // BÚSQUEDA
          // ------------------------------------------

          const coincideBusqueda =

            !texto ||

            (h.alumno ?? '')
              .toLowerCase()
              .includes(texto) ||

            String(h.dni ?? '')
              .toLowerCase()
              .includes(texto) ||

            (h.curso_equipo ?? '')
              .toLowerCase()
              .includes(texto);


          // ------------------------------------------
          // ESTADO
          // ------------------------------------------

          const coincideEstado =

            !this.estadoSeleccionado ||

            h.estado ===
              this.estadoSeleccionado;


          // ------------------------------------------
          // DOCUMENTO
          // ------------------------------------------

          const coincideDocumento =

            !this.documentoSeleccionado ||

            h.estado_documento ===
              this.documentoSeleccionado;


          // ------------------------------------------
          // VENDEDOR
          // ------------------------------------------

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


    // --------------------------------------------
    // REINICIAR PAGINA
    // --------------------------------------------

    if (reiniciarPagina) {

      this.paginaActual = 1;

    }


    // --------------------------------------------
    // ASEGURAR PAGINA VALIDA
    // --------------------------------------------

    this.validarPaginaActual();

  }


  // ==========================================================
  // EVENTOS FILTROS
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
  // TOTAL PAGINAS
  // ==========================================================

  get totalPaginas(): number {

    return Math.max(

      1,

      Math.ceil(

        this.homologadosFiltrados.length /
        this.itemsPorPagina

      )

    );

  }


  // ==========================================================
  // REGISTROS PAGINA ACTUAL
  // ==========================================================

  get homologadosPagina(): Homologado[] {

    const inicio =

      (this.paginaActual - 1) *
      this.itemsPorPagina;


    return this.homologadosFiltrados.slice(

      inicio,

      inicio + this.itemsPorPagina

    );

  }


  // ==========================================================
  // PAGINACIÓN INTELIGENTE
  // ==========================================================

  get paginasVisibles(): (number | string)[] {

    const total =
      this.totalPaginas;

    const actual =
      this.paginaActual;

    const max =
      this.maxPaginasVisibles;


    // --------------------------------------------
    // Pocas páginas
    // --------------------------------------------

    if (total <= max + 2) {

      return Array.from(
        { length: total },
        (_, i) => i + 1
      );

    }


    const paginas:
      (number | string)[] = [];


    // --------------------------------------------
    // Primera página
    // --------------------------------------------

    paginas.push(1);


    // --------------------------------------------
    // Ventana central
    // --------------------------------------------

    let inicio =
      Math.max(
        2,
        actual - 1
      );


    let fin =
      Math.min(
        total - 1,
        actual + 1
      );


    // --------------------------------------------
    // Ajustar extremos
    // --------------------------------------------

    if (actual <= 3) {

      inicio = 2;

      fin = 4;

    }


    if (actual >= total - 2) {

      inicio = total - 3;

      fin = total - 1;

    }


    // --------------------------------------------
    // Separador inicial
    // --------------------------------------------

    if (inicio > 2) {

      paginas.push('...');

    }


    // --------------------------------------------
    // Páginas centrales
    // --------------------------------------------

    for (
      let pagina = inicio;
      pagina <= fin;
      pagina++
    ) {

      paginas.push(pagina);

    }


    // --------------------------------------------
    // Separador final
    // --------------------------------------------

    if (fin < total - 1) {

      paginas.push('...');

    }


    // --------------------------------------------
    // Última página
    // --------------------------------------------

    paginas.push(total);


    return paginas;

  }


  // ==========================================================
  // CAMBIAR PAGINA
  // ==========================================================

  cambiarPagina(
    pagina: number
  ): void {

    if (
      pagina < 1 ||
      pagina > this.totalPaginas ||
      pagina === this.paginaActual
    ) {

      return;

    }


    this.paginaActual = pagina;


    this.scrollTablaArriba();

  }


  // ==========================================================
  // PAGINA ANTERIOR
  // ==========================================================

  paginaAnterior(): void {

    if (
      this.paginaActual > 1
    ) {

      this.cambiarPagina(
        this.paginaActual - 1
      );

    }

  }


  // ==========================================================
  // PAGINA SIGUIENTE
  // ==========================================================

  paginaSiguiente(): void {

    if (
      this.paginaActual <
      this.totalPaginas
    ) {

      this.cambiarPagina(
        this.paginaActual + 1
      );

    }

  }


  // ==========================================================
  // PRIMERA PAGINA
  // ==========================================================

  primeraPagina(): void {

    this.cambiarPagina(1);

  }


  // ==========================================================
  // ÚLTIMA PAGINA
  // ==========================================================

  ultimaPagina(): void {

    this.cambiarPagina(
      this.totalPaginas
    );

  }


  // ==========================================================
  // VALIDAR PAGINA
  // ==========================================================

  private validarPaginaActual(): void {

    if (
      this.paginaActual >
      this.totalPaginas
    ) {

      this.paginaActual =
        this.totalPaginas;

    }


    if (
      this.paginaActual < 1
    ) {

      this.paginaActual = 1;

    }

  }


  // ==========================================================
  // SCROLL TABLA
  // ==========================================================

  private scrollTablaArriba(): void {

    window.scrollTo({

      top: 0,

      behavior: 'smooth'

    });

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
  // IMPORTAR GOOGLE SHEETS
  // ==========================================================

  importarSheets(): void {

    if (
      this.cargandoImportacion
    ) {

      return;

    }


    this.cargandoImportacion = true;


    this.service
      .importarSheets()
      .subscribe({

        next: (resp: any) => {

          console.log(
            'Importación Google Sheets:',
            resp
          );


          this.cargandoImportacion = false;


          // ----------------------------------------
          // IMPORTACIÓN TERMINÓ
          // AHORA RECARGAMOS TODO
          // ----------------------------------------

          this.cargarHomologados();

        },


        error: (err: any) => {

          console.error(
            'Error importando Google Sheets:',
            err
          );


          this.cargandoImportacion = false;

        }

      });

  }


  // ==========================================================
  // ACTUALIZAR
  // ==========================================================

  actualizar(): void {

    // --------------------------------------------
    // NO bloqueamos una actualización
    // --------------------------------------------

    this.cargarHomologados();

  }

}
