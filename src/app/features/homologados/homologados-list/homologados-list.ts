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
  estadoPagoSeleccionado = '';



  // ==========================================================
  // OPCIONES DE FILTROS
  // ==========================================================

  estados: string[] = [];

  documentos: string[] = [];

  vendedores: string[] = [];

  estadosPago: string[] = [];

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

    /*
     * Evitamos peticiones duplicadas.
     *
     * Si ya estamos cargando y no se trata de una importación,
     * no volvemos a disparar la petición.
     */

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


          // ====================================================
          // CARGAR DATOS
          // ====================================================

          const datos =
            Array.isArray(resp?.data)
              ? resp.data
              : [];


          this.homologados =
            datos.map(
              (homologado: Homologado) =>
                this.formatearHomologado(
                  homologado
                )
            );


          // ====================================================
          // ACTUALIZAR OPCIONES
          // ====================================================

          this.generarOpcionesFiltros();


          // ====================================================
          // APLICAR FILTROS
          // ====================================================

          this.aplicarFiltros(false);


          // ====================================================
          // FINALIZAR CARGA
          // ====================================================

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

          this.estados = [];

          this.documentos = [];

          this.vendedores = [];

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

      monto_total:
        Number(
          homologado.monto_total ?? 0
        ),

      monto_pagado:
        Number(
          homologado.monto_pagado ?? 0
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
  // GENERAR OPCIONES DE FILTROS
  // ==========================================================
private generarOpcionesFiltros(): void {

  // --------------------------------------------------------
  // ESTADOS
  // --------------------------------------------------------

  this.estados =
    this.obtenerValoresUnicos(
      this.homologados.map(
        h => h.estado
      )
    );


  // --------------------------------------------------------
  // ESTADOS DE PAGO
  // --------------------------------------------------------

  this.estadosPago =
    this.obtenerValoresUnicos(
      this.homologados.map(
        h => h.estado_pago
      )
    );


  // --------------------------------------------------------
  // DOCUMENTOS
  // --------------------------------------------------------

  this.documentos =
    this.obtenerValoresUnicos(
      this.homologados.map(
        h => h.estado_documento
      )
    );


  // --------------------------------------------------------
  // VENDEDORES
  // --------------------------------------------------------

  this.vendedores =
    this.obtenerValoresUnicos(
      this.homologados.map(
        h => h.vendedor
      )
    );


  // --------------------------------------------------------
  // VALIDAR ESTADO
  // --------------------------------------------------------

  if (
    this.estadoSeleccionado &&
    !this.estados.includes(
      this.estadoSeleccionado
    )
  ) {

    this.estadoSeleccionado = '';

  }


  // --------------------------------------------------------
  // VALIDAR ESTADO DE PAGO
  // --------------------------------------------------------

  if (
    this.estadoPagoSeleccionado &&
    !this.estadosPago.includes(
      this.estadoPagoSeleccionado
    )
  ) {

    this.estadoPagoSeleccionado = '';

  }


  // --------------------------------------------------------
  // VALIDAR DOCUMENTO
  // --------------------------------------------------------

  if (
    this.documentoSeleccionado &&
    !this.documentos.includes(
      this.documentoSeleccionado
    )
  ) {

    this.documentoSeleccionado = '';

  }


  // --------------------------------------------------------
  // VALIDAR VENDEDOR
  // --------------------------------------------------------

  if (
    this.vendedorSeleccionado &&
    !this.vendedores.includes(
      this.vendedorSeleccionado
    )
  ) {

    this.vendedorSeleccionado = '';

  }

}
  // ==========================================================
  // OBTENER VALORES ÚNICOS
  // ==========================================================

  private obtenerValoresUnicos(
    valores: (string | undefined)[]
  ): string[] {

    return Array.from(

      new Set(

        valores

          .filter(
            (
              valor
            ): valor is string =>
              !!valor &&
              valor.trim() !== ''
          )

          .map(
            valor =>
              valor.trim()
          )

      )

    ).sort(
      (
        a,
        b
      ) =>
        a.localeCompare(
          b,
          'es',
          {
            sensitivity: 'base'
          }
        )
    );

  }


  // ==========================================================
  // FILTROS
  // ==========================================================

  aplicarFiltros(
    reiniciarPagina = true
  ): void {

    const texto =
      this.busqueda
        .toLowerCase()
        .trim();


    this.homologadosFiltrados =
      this.homologados.filter(
        (
          h: Homologado
        ) => {

          // --------------------------------------------------
          // BÚSQUEDA
          // --------------------------------------------------

          const coincideBusqueda =

            !texto ||

            (
              h.alumno ?? ''
            )
              .toLowerCase()
              .includes(
                texto
              ) ||

            String(
              h.dni ?? ''
            )
              .toLowerCase()
              .includes(
                texto
              ) ||

            (
              h.curso_equipo ?? ''
            )
              .toLowerCase()
              .includes(
                texto
              ) ||

            (
              h.celular ?? ''
            )
              .toLowerCase()
              .includes(
                texto
              );


          // --------------------------------------------------
          // ESTADO
          // --------------------------------------------------

          const coincideEstado =

            !this.estadoSeleccionado ||

            h.estado ===
              this.estadoSeleccionado;


          const coincideEstadoPago =

          !this.estadoPagoSeleccionado ||
        
          h.estado_pago ===
            this.estadoPagoSeleccionado;


          // --------------------------------------------------
          // DOCUMENTO
          // --------------------------------------------------

          const coincideDocumento =

            !this.documentoSeleccionado ||

            h.estado_documento ===
              this.documentoSeleccionado;


          // --------------------------------------------------
          // VENDEDOR
          // --------------------------------------------------

          const coincideVendedor =

            !this.vendedorSeleccionado ||

            h.vendedor ===
              this.vendedorSeleccionado;

          return (
          
            coincideBusqueda &&
          
            coincideEstado &&
          
            coincideEstadoPago &&
          
            coincideDocumento &&
          
            coincideVendedor
          
          );

        }
      );


    // --------------------------------------------------------
    // REINICIAR PAGINA
    // --------------------------------------------------------

    if (reiniciarPagina) {

      this.paginaActual = 1;

    }


    // --------------------------------------------------------
    // ASEGURAR PAGINA VALIDA
    // --------------------------------------------------------

    this.validarPaginaActual();

  }


  // ==========================================================
  // EVENTOS DE FILTROS
  // ==========================================================

  buscar(): void {

    this.aplicarFiltros();

  }


  filtrarEstado(): void {

    this.aplicarFiltros();

  }

  filtrarEstadoPago(): void {

    this.aplicarFiltros();

  }


  filtrarDocumento(): void {

    this.aplicarFiltros();

  }


  filtrarVendedor(): void {

    this.aplicarFiltros();

  }


  // ==========================================================
  // LIMPIAR FILTROS
  // ==========================================================

  limpiarFiltros(): void {
  
    this.busqueda = '';
  
    this.estadoSeleccionado = '';
  
    this.estadoPagoSeleccionado = '';
  
    this.documentoSeleccionado = '';
  
    this.vendedorSeleccionado = '';
  
    this.aplicarFiltros();
  
  }

  // ==========================================================
  // TOTAL PÁGINAS
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
  // HOMOLOGADOS DE LA PÁGINA ACTUAL
  // ==========================================================

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


    // --------------------------------------------------------
    // POCAS PÁGINAS
    // --------------------------------------------------------

    if (
      total <= max + 2
    ) {

      return Array.from(

        {
          length: total
        },

        (
          _,
          index
        ) =>
          index + 1

      );

    }


    const paginas:
      (number | string)[] = [];


    // --------------------------------------------------------
    // PRIMERA
    // --------------------------------------------------------

    paginas.push(1);


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


    // --------------------------------------------------------
    // CERCA DEL PRINCIPIO
    // --------------------------------------------------------

    if (
      actual <= 3
    ) {

      inicio = 2;

      fin = 4;

    }


    // --------------------------------------------------------
    // CERCA DEL FINAL
    // --------------------------------------------------------

    if (
      actual >= total - 2
    ) {

      inicio =
        total - 3;

      fin =
        total - 1;

    }


    // --------------------------------------------------------
    // ELLIPSIS INICIAL
    // --------------------------------------------------------

    if (
      inicio > 2
    ) {

      paginas.push('...');

    }


    // --------------------------------------------------------
    // PÁGINAS CENTRALES
    // --------------------------------------------------------

    for (
      let pagina = inicio;
      pagina <= fin;
      pagina++
    ) {

      paginas.push(
        pagina
      );

    }


    // --------------------------------------------------------
    // ELLIPSIS FINAL
    // --------------------------------------------------------

    if (
      fin < total - 1
    ) {

      paginas.push('...');

    }


    // --------------------------------------------------------
    // ÚLTIMA
    // --------------------------------------------------------

    paginas.push(
      total
    );


    return paginas;

  }


  // ==========================================================
  // CAMBIAR PÁGINA
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


    this.paginaActual =
      pagina;


    this.scrollTablaArriba();

  }


  // ==========================================================
  // ANTERIOR
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
  // SIGUIENTE
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
  // PRIMERA
  // ==========================================================

  primeraPagina(): void {

    if (
      this.paginaActual !== 1
    ) {

      this.cambiarPagina(
        1
      );

    }

  }


  // ==========================================================
  // ÚLTIMA
  // ==========================================================

  ultimaPagina(): void {

    if (
      this.paginaActual !==
      this.totalPaginas
    ) {

      this.cambiarPagina(
        this.totalPaginas
      );

    }

  }


  // ==========================================================
  // VALIDAR PÁGINA
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
  // SCROLL
  // ==========================================================

  private scrollTablaArriba(): void {

    window.scrollTo({

      top: 0,

      behavior: 'smooth'

    });

  }


  // ==========================================================
  // CAMBIAR REGISTROS POR PÁGINA
  // ==========================================================

  cambiarItemsPorPagina(): void {

    this.paginaActual = 1;

    this.validarPaginaActual();

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
      this.cargandoImportacion ||
      this.loading
    ) {

      return;

    }


    this.cargandoImportacion = true;


    this.service
      .importarSheets()
      .subscribe({

        next: (
          resp: any
        ) => {

          console.log(
            'Importación Google Sheets:',
            resp
          );


          /*
           * Primero liberamos el estado de importación.
           */

          this.cargandoImportacion = false;


          /*
           * Después hacemos UNA sola petición
           * para traer nuevamente todos los registros.
           */

          this.recargarDespuesDeImportar();

        },


        error: (
          err: any
        ) => {

          console.error(
            'Error importando Google Sheets:',
            err
          );


          this.cargandoImportacion = false;

          this.cd.detectChanges();

        }

      });

  }


  // ==========================================================
  // RECARGAR DESPUÉS DE IMPORTACIÓN
  // ==========================================================

  private recargarDespuesDeImportar(): void {

    /*
     * Limpiamos la página para que el usuario
     * vea inmediatamente los nuevos registros.
     */

    this.paginaActual = 1;


    this.cargarHomologados();

  }


  // ==========================================================
  // ACTUALIZAR TODO
  // ==========================================================

  actualizar(): void {

    /*
     * Si ya existe una petición activa,
     * no hacemos otra.
     */

    if (
      this.loading ||
      this.cargandoImportacion
    ) {

      return;

    }


    /*
     * Conservamos los filtros actuales.
     *
     * cargarHomologados() vuelve a generar:
     *
     * - datos
     * - filtros
     * - paginación
     * - opciones de selects
     */

    this.cargarHomologados();

  }

}
