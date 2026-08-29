
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

  google_id?: number;

  alumno?: string;

  alumno_id?: number | null;

  dni?: string | number;

  celular?: string;

  curso_equipo?: string;

  vendedor?: string;

  monto_total?: number;

  monto_pagado?: number;

  monto_indicado?: number;

  saldo_pendiente?: number;

  estado_pago?: string;

  estado_documento?: string;

  fecha_envio?: string | null;

  estado?: string;

  observaciones?: string;

  observaciones_admin?: string;

  fecha_registro?: string;

  fecha_registro_texto?: string;

  cantidad_pagos?: number;

  tiene_boleta?: boolean;

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

  estadoPagoSeleccionado = '';

  documentoSeleccionado = '';

  vendedorSeleccionado = '';


  // ==========================================================
  // OPCIONES DE FILTROS
  // ==========================================================

  estados: string[] = [];

  estadosPago: string[] = [];

  documentos: string[] = [];

  vendedores: string[] = [];


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
  // CARGAR DESDE BASE DE DATOS
  //
  // IMPORTANTE:
  //
  // Esta función NO importa Google Sheets.
  //
  // Solamente consulta:
  //
  // GET /api/homologaciones
  //
  // Por lo tanto NO modifica ningún registro.
  // ==========================================================

  cargarHomologados(): void {

    if (this.loading) {

      return;

    }


    this.loading = true;


    this.service
      .listar()
      .subscribe({

        next: (resp: any) => {

          console.log(
            'Homologaciones desde BD:',
            resp
          );


          const datos =
            Array.isArray(resp?.data)
              ? resp.data
              : [];


          this.homologados =
            datos.map(
              (
                homologado: Homologado
              ) =>
                this.formatearHomologado(
                  homologado
                )
            );


          // --------------------------------------------------
          // GENERAR FILTROS
          // --------------------------------------------------

          this.generarOpcionesFiltros();


          // --------------------------------------------------
          // APLICAR FILTROS
          // --------------------------------------------------

          this.aplicarFiltros(false);


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

          this.estadosPago = [];

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

      monto_total:
        this.numeroSeguro(
          homologado.monto_total
        ),

      monto_indicado:
        this.numeroSeguro(
          homologado.monto_indicado
        ),

      monto_pagado:
        this.numeroSeguro(
          homologado.monto_pagado
        ),

      saldo_pendiente:
        this.numeroSeguro(
          homologado.saldo_pendiente
        ),

      cantidad_pagos:
        this.numeroSeguro(
          homologado.cantidad_pagos
        ),

      fecha_registro_texto:
        this.formatearFecha(
          homologado.fecha_registro
        )

    };

  }


  // ==========================================================
  // CONVERTIR NÚMERO
  // ==========================================================

  private numeroSeguro(
    valor: any
  ): number {

    const numero =
      Number(valor);

    return Number.isFinite(numero)
      ? numero
      : 0;

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

    this.estados =
      this.obtenerValoresUnicos(
        this.homologados.map(
          h => h.estado
        )
      );


    this.estadosPago =
      this.obtenerValoresUnicos(
        this.homologados.map(
          h => h.estado_pago
        )
      );


    this.documentos =
      this.obtenerValoresUnicos(
        this.homologados.map(
          h => h.estado_documento
        )
      );


    this.vendedores =
      this.obtenerValoresUnicos(
        this.homologados.map(
          h => h.vendedor
        )
      );


    // --------------------------------------------------------
    // VALIDAR FILTROS EXISTENTES
    // --------------------------------------------------------

    if (
      this.estadoSeleccionado &&
      !this.estados.includes(
        this.estadoSeleccionado
      )
    ) {

      this.estadoSeleccionado = '';

    }


    if (
      this.estadoPagoSeleccionado &&
      !this.estadosPago.includes(
        this.estadoPagoSeleccionado
      )
    ) {

      this.estadoPagoSeleccionado = '';

    }


    if (
      this.documentoSeleccionado &&
      !this.documentos.includes(
        this.documentoSeleccionado
      )
    ) {

      this.documentoSeleccionado = '';

    }


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
  // APLICAR FILTROS
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
              ) ||

            (
              h.vendedor ?? ''
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


          // --------------------------------------------------
          // ESTADO DE PAGO
          // --------------------------------------------------

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


    if (reiniciarPagina) {

      this.paginaActual = 1;

    }


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
  // HOMOLOGADOS DE LA PÁGINA
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


    if (
      actual <= 3
    ) {

      inicio = 2;

      fin = 4;

    }


    if (
      actual >= total - 2
    ) {

      inicio =
        total - 3;

      fin =
        total - 1;

    }


    if (
      inicio > 2
    ) {

      paginas.push('...');

    }


    for (
      let pagina = inicio;
      pagina <= fin;
      pagina++
    ) {

      paginas.push(
        pagina
      );

    }


    if (
      fin < total - 1
    ) {

      paginas.push('...');

    }


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

      this.cambiarPagina(1);

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
  //
  // IMPORTANTE:
  //
  // Esta acción SÍ llama al backend de importación.
  //
  // El backend se encarga de:
  //
  // - crear nuevos registros
  // - NO reemplazar pagos existentes
  // - NO reemplazar monto_pagado
  // - NO reemplazar saldo pendiente real
  // - NO reemplazar estado de pago real
  //
  // Luego solamente volvemos a consultar la BD.
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
            'Resultado importación:',
            resp
          );


          this.cargandoImportacion = false;


          // ------------------------------------------------
          // TRAER DATOS ACTUALES DESDE BD
          // ------------------------------------------------

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

    this.paginaActual = 1;

    this.cargarHomologados();

  }


  // ==========================================================
  // ACTUALIZAR
  //
  // IMPORTANTE:
  //
  // NO IMPORTA SHEETS.
  //
  // SOLO CONSULTA LA BD.
  // ==========================================================

  actualizar(): void {

    if (
      this.loading ||
      this.cargandoImportacion
    ) {

      return;

    }


    this.cargarHomologados();

  }

}

