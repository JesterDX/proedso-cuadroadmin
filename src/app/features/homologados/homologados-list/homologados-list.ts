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

  tipo_homologacion?: string;

  monto_total?: number;

  monto_pagado?: number;

  monto_indicado?: number;

  saldo_pendiente: number;

  estado_pago?: string;

  estado_documento?: string;

  estado?: string;

  fecha_registro?: string;

  fecha_registro_texto?: string;

  fecha_envio?: string | null;

  observaciones?: string;

  observaciones_admin?: string;

  cantidad_pagos?: number;

  tiene_boleta?: boolean;

}


// ============================================================
// TIPO DE CAMPO EDITABLE
// ============================================================

type CampoEditable =
  | 'alumno'
  | 'dni'
  | 'celular'
  | 'curso_equipo'
  | 'vendedor'
  | 'monto_total'
  | 'estado_documento'
  | 'estado'
  | 'fecha_registro'
  | 'observaciones'
  | 'observaciones_admin';


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
  // EDICIÓN INLINE
  // ==========================================================

  editandoId: number | null = null;

  editandoCampo: CampoEditable | null = null;

  valorEdicion: any = '';

  valorAnterior: any = '';

  guardandoEdicion = false;


  // ==========================================================
  // FILTROS
  // ==========================================================

  busqueda = '';

  estadoSeleccionado = '';

  documentoSeleccionado = '';

  vendedorSeleccionado = '';


  // ==========================================================
  // OPCIONES DE FILTROS
  // ==========================================================

  estados: string[] = [];

  documentos: string[] = [];

  vendedores: string[] = [];


  // ==========================================================
  // ESTADOS PERMITIDOS
  // ==========================================================

  readonly estadosDocumento = [
    'PENDIENTE',
    'EN PREPARACION',
    'EN EMPRESA DE ENVIOS',
    'RECOGIDO',
    'INACTIVO'
  ];


  readonly estadosHomologacion = [
    'REGISTRADO',
    'EN PREPARACION',
    'EN EMPRESA DE ENVIOS',
    'RECOGIDO',
    'INACTIVO'
  ];


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


          this.generarOpcionesFiltros();

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

    this.estados =
      this.obtenerValoresUnicos(
        this.homologados.map(
          h => h.estado
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


    if (
      this.estadoSeleccionado &&
      !this.estados.includes(
        this.estadoSeleccionado
      )
    ) {

      this.estadoSeleccionado = '';

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


    this.cancelarEdicion();

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
  // CAMBIAR REGISTROS
  // ==========================================================

  cambiarItemsPorPagina(): void {

    this.cancelarEdicion();

    this.paginaActual = 1;

    this.validarPaginaActual();

  }


  // ==========================================================
  // ==========================================================
  // EDICIÓN INLINE TIPO EXCEL
  // ==========================================================
  // ==========================================================


  /**
   * Inicia la edición de una celda.
   *
   * Se utiliza doble clic para evitar
   * editar accidentalmente al seleccionar.
   */
  iniciarEdicion(
    item: Homologado,
    campo: CampoEditable
  ): void {

    if (
      !item.id ||
      this.guardandoEdicion ||
      this.loading ||
      this.cargandoImportacion
    ) {

      return;

    }


    // Si ya estamos editando otra celda,
    // primero cancelamos.
    if (
      this.editandoId !== null
    ) {

      if (
        this.editandoId === item.id &&
        this.editandoCampo === campo
      ) {

        return;

      }


      this.cancelarEdicion();

    }


    this.editandoId =
      item.id;

    this.editandoCampo =
      campo;


    const valorActual =
      this.obtenerValorCampo(
        item,
        campo
      );


    this.valorAnterior =
      this.clonarValor(
        valorActual
      );


    this.valorEdicion =
      this.clonarValor(
        valorActual
      );


    this.cd.detectChanges();


    /*
     * Enfocamos automáticamente el input.
     *
     * Se hace con setTimeout porque Angular
     * necesita primero pintar la celda editable.
     */

    setTimeout(() => {

      const elemento =
        document.querySelector(
          '.celda-editando input, .celda-editando select, .celda-editando textarea'
        ) as
          | HTMLInputElement
          | HTMLSelectElement
          | HTMLTextAreaElement
          | null;


      if (elemento) {

        elemento.focus();

        if (
          elemento instanceof
          HTMLInputElement ||
          elemento instanceof
          HTMLTextAreaElement
        ) {

          elemento.select();

        }

      }

    });

  }


  // ==========================================================
  // OBTENER VALOR
  // ==========================================================

  private obtenerValorCampo(
    item: Homologado,
    campo: CampoEditable
  ): any {

    if (
      campo === 'fecha_registro'
    ) {

      return item.fecha_registro
        ? String(
            item.fecha_registro
          ).substring(0, 10)
        : '';

    }


    return item[campo];

  }


  // ==========================================================
  // CLONAR VALOR
  // ==========================================================

  private clonarValor(
    valor: any
  ): any {

    if (
      valor === null ||
      valor === undefined
    ) {

      return '';

    }


    return valor;

  }


  // ==========================================================
  // CANCELAR EDICIÓN
  // ==========================================================

  cancelarEdicion(): void {

    if (
      this.guardandoEdicion
    ) {

      return;

    }


    this.editandoId = null;

    this.editandoCampo = null;

    this.valorEdicion = '';

    this.valorAnterior = '';

  }


  // ==========================================================
  // TECLA EN INPUT
  // ==========================================================

  manejarTeclaEdicion(
    event: KeyboardEvent
  ): void {

    if (
      event.key === 'Escape'
    ) {

      event.preventDefault();

      this.cancelarEdicion();

      return;

    }


    if (
      event.key === 'Enter'
    ) {

      event.preventDefault();

      this.guardarEdicion();

    }

  }


  // ==========================================================
  // BLUR
  // ==========================================================

  manejarBlurEdicion(): void {

    /*
     * Guardamos al salir de la celda,
     * estilo Excel.
     */

    if (
      !this.guardandoEdicion
    ) {

      setTimeout(() => {

        if (
          this.editandoId !== null
        ) {

          this.guardarEdicion();

        }

      }, 80);

    }

  }


  // ==========================================================
  // GUARDAR EDICIÓN
  // ==========================================================

  guardarEdicion(): void {

    if (
      this.editandoId === null ||
      this.editandoCampo === null ||
      this.guardandoEdicion
    ) {

      return;

    }


    const item =
      this.homologados.find(
        h =>
          h.id ===
          this.editandoId
      );


    if (!item) {

      this.cancelarEdicion();

      return;

    }


    const campo =
      this.editandoCampo;


    const nuevoValor =
      this.normalizarValorParaGuardar(
        campo,
        this.valorEdicion
      );


    const valorOriginal =
      this.normalizarValorParaGuardar(
        campo,
        this.valorAnterior
      );


    /*
     * Si no cambió nada,
     * simplemente cerramos la edición.
     */

    if (
      this.valoresIguales(
        nuevoValor,
        valorOriginal
      )
    ) {

      this.cancelarEdicion();

      return;

    }


    /*
     * Validaciones frontend.
     */

    const error =
      this.validarValor(
        campo,
        nuevoValor
      );


    if (error) {

      console.warn(
        error
      );

      /*
       * Volvemos al valor anterior.
       */

      this.valorEdicion =
        this.valorAnterior;

      return;

    }


    this.guardandoEdicion = true;


    /*
     * Guardamos temporalmente la información
     * por si necesitamos restaurarla.
     */

    const id =
      item.id;


    this.service
      .actualizar(
        id,
        {
          [campo]:
            nuevoValor
        }
      )
      .subscribe({

        next: (
          resp: any
        ) => {

          console.log(
            'Homologación actualizada:',
            resp
          );


          const actualizado =
            resp?.data;


          if (
            actualizado
          ) {

            this.actualizarItemLocal(
              item,
              actualizado
            );

          }
          else {

            /*
             * Fallback por si el backend
             * no devuelve data.
             */

            this.aplicarValorLocal(
              item,
              campo,
              nuevoValor
            );

          }


          this.guardandoEdicion = false;

          this.editandoId = null;

          this.editandoCampo = null;

          this.valorEdicion = '';

          this.valorAnterior = '';


          /*
           * Los filtros pueden haber cambiado
           * si se editó estado/vendedor.
           */

          this.generarOpcionesFiltros();

          this.aplicarFiltros(false);

          this.cd.detectChanges();

        },


        error: (
          err: any
        ) => {

          console.error(
            'Error actualizando homologación:',
            err
          );


          /*
           * Restaurar valor anterior.
           */

          this.aplicarValorLocal(
            item,
            campo,
            this.valorAnterior
          );


          this.guardandoEdicion = false;

          this.cd.detectChanges();

        }

      });

  }


  // ==========================================================
  // NORMALIZAR VALOR
  // ==========================================================

  private normalizarValorParaGuardar(
    campo: CampoEditable,
    valor: any
  ): any {

    if (
      valor === null ||
      valor === undefined
    ) {

      return '';

    }


    if (
      campo === 'monto_total'
    ) {

      const numero =
        Number(
          String(valor)
            .replace(',', '.')
        );


      return Number.isFinite(numero)
        ? numero
        : NaN;

    }


    if (
      campo === 'dni'
    ) {

      return String(
        valor
      ).trim();

    }


    return String(
      valor
    ).trim();

  }


  // ==========================================================
  // VALIDAR VALOR
  // ==========================================================

  private validarValor(
    campo: CampoEditable,
    valor: any
  ): string | null {

    if (
      campo === 'monto_total'
    ) {

      if (
        !Number.isFinite(
          Number(valor)
        )
      ) {

        return 'El monto total no es válido.';

      }


      if (
        Number(valor) < 0
      ) {

        return 'El monto total no puede ser negativo.';

      }

    }


    if (
      campo === 'alumno' &&
      !String(valor).trim()
    ) {

      return 'El nombre del alumno no puede estar vacío.';

    }


    if (
      campo === 'curso_equipo' &&
      !String(valor).trim()
    ) {

      return 'El curso/equipo no puede estar vacío.';

    }


    return null;

  }


  // ==========================================================
  // COMPARAR VALORES
  // ==========================================================

  private valoresIguales(
    a: any,
    b: any
  ): boolean {

    if (
      typeof a === 'number' ||
      typeof b === 'number'
    ) {

      return Number(a) === Number(b);

    }


    return String(a ?? '') ===
      String(b ?? '');

  }


  // ==========================================================
  // ACTUALIZAR ITEM LOCAL
  // ==========================================================

  private actualizarItemLocal(
    item: Homologado,
    actualizado: Homologado
  ): void {

    Object.assign(
      item,
      this.formatearHomologado(
        actualizado
      )
    );

  }


  // ==========================================================
  // APLICAR VALOR LOCAL
  // ==========================================================

  private aplicarValorLocal(
    item: Homologado,
    campo: CampoEditable,
    valor: any
  ): void {

    if (
      campo === 'fecha_registro'
    ) {

      item.fecha_registro =
        String(valor || '');

      item.fecha_registro_texto =
        this.formatearFecha(
          item.fecha_registro
        );

      return;

    }


    (item as any)[campo] =
      valor;


    if (
      campo === 'monto_total'
    ) {

      item.monto_total =
        Number(valor);

    }

  }


  // ==========================================================
  // ESTÁ EDITANDO
  // ==========================================================

  estaEditando(
    item: Homologado,
    campo: CampoEditable
  ): boolean {

    return (

      this.editandoId === item.id &&

      this.editandoCampo === campo

    );

  }


  // ==========================================================
  // ESTÁ GUARDANDO
  // ==========================================================

  estaGuardando(
    item: Homologado,
    campo: CampoEditable
  ): boolean {

    return (

      this.guardandoEdicion &&

      this.editandoId === item.id &&

      this.editandoCampo === campo

    );

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


          this.cargandoImportacion = false;

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
  // ACTUALIZAR TODO
  // ==========================================================

  actualizar(): void {

    if (
      this.loading ||
      this.cargandoImportacion
    ) {

      return;

    }


    this.cancelarEdicion();

    this.cargarHomologados();

  }

}
