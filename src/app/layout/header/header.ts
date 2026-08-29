import {
  Component,
  inject,
  signal,
  OnInit
} from '@angular/core';

import { Router } from '@angular/router';

import {
  LucideAngularModule,
  Search,
  Bell,
  UserCircle2,
  LogOut,
  Download
} from 'lucide-angular';

import Swal from 'sweetalert2';

import * as XLSX from 'xlsx';

import { AuthService } from '../../auth/services/auth.service';

import {
  NotificacionService,
  ResumenNotificaciones,
  NotificacionCuota
} from '../../core/services/notificaciones.service';

@Component({
  selector: 'app-header',
  standalone: true,

  imports: [
    LucideAngularModule
  ],

  templateUrl: './header.html',

  styleUrls: [
    './header.scss'
  ]
})
export class HeaderComponent implements OnInit {

  // ==========================================================
  // SERVICIOS
  // ==========================================================

  private authService =
    inject(AuthService);

  private router =
    inject(Router);

  private notificacionService =
    inject(NotificacionService);


  // ==========================================================
  // USUARIO
  // ==========================================================

  public usuarioLogueado =
    this.authService.usuarioActual;


  // ==========================================================
  // ICONOS
  // ==========================================================

  readonly icons = {

    search: Search,

    bell: Bell,

    user: UserCircle2,

    logout: LogOut,

    download: Download

  };


  // ==========================================================
  // NOTIFICACIONES
  // ==========================================================

  notificaciones =
    signal<ResumenNotificaciones>({

      vencidas: 0,

      por_vencer: 0,

      total: 0,

      cantidad_alumnos: 0,

      cantidad_alumnos_vencidos: 0,

      cantidad_alumnos_por_vencer: 0,

      notificaciones: []

    });


  // ==========================================================
  // INICIO
  // ==========================================================

  ngOnInit(): void {

    this.cargarNotificaciones();

  }


  // ==========================================================
  // CARGAR NOTIFICACIONES
  // ==========================================================

  cargarNotificaciones(): void {

    this.notificacionService
      .obtenerNotificaciones()

      .subscribe({

        next: (
          response: ResumenNotificaciones
        ) => {

          this.notificaciones.set({

            vencidas:
              Number(
                response?.vencidas || 0
              ),

            por_vencer:
              Number(
                response?.por_vencer || 0
              ),

            total:
              Number(
                response?.total || 0
              ),

            cantidad_alumnos:
              Number(
                response?.cantidad_alumnos || 0
              ),

            cantidad_alumnos_vencidos:
              Number(
                response?.cantidad_alumnos_vencidos || 0
              ),

            cantidad_alumnos_por_vencer:
              Number(
                response?.cantidad_alumnos_por_vencer || 0
              ),

            notificaciones:
              response?.notificaciones || []

          });

        },

        error: (error) => {

          console.error(
            'Error al cargar las notificaciones:',
            error
          );

          this.notificaciones.set({

            vencidas: 0,

            por_vencer: 0,

            total: 0,

            cantidad_alumnos: 0,

            cantidad_alumnos_vencidos: 0,

            cantidad_alumnos_por_vencer: 0,

            notificaciones: []

          });

        }

      });

  }


  // ==========================================================
  // ABRIR NOTIFICACIONES
  // ==========================================================

  abrirNotificaciones(): void {

    const data =
      this.notificaciones();


    // --------------------------------------------------------
    // SIN NOTIFICACIONES
    // --------------------------------------------------------

    if (!data.total) {

      Swal.fire({

        icon: 'success',

        title: 'Sin notificaciones',

        text:
          'No hay cuotas vencidas ni cuotas próximas a vencer.',

        confirmButtonColor: '#f5b700'

      });

      return;
    }


    // --------------------------------------------------------
    // CONTENIDO
    // --------------------------------------------------------

    const contenido =
      data.notificaciones

        .map(
          (
            notificacion
          ) => {

            const clase =
              notificacion.tipo === 'VENCIDA'

                ? 'color:#dc2626;'

                : 'color:#d97706;';


            const estado =
              notificacion.tipo === 'VENCIDA'

                ? 'CUOTA VENCIDA'

                : 'CUOTA POR VENCER';


            const fecha =
              this.formatearFecha(
                notificacion.fecha_vencimiento
              );


            const saldo =
              Number(
                notificacion.saldo_pendiente || 0
              ).toFixed(2);


            const nombreCompleto =
              `${notificacion.alumno_nombres ?? ''} ${notificacion.alumno_apellidos ?? ''}`
                .trim();


            return `

              <div style="
                text-align:left;
                padding:12px;
                margin-bottom:8px;
                border:1px solid #e5e7eb;
                border-radius:8px;
                background:#fff;
              ">

                <div style="
                  font-weight:700;
                  ${clase}
                  margin-bottom:5px;
                ">
                  ${estado}
                </div>


                <div style="
                  font-weight:600;
                  color:#1f2937;
                ">
                  ${nombreCompleto}
                </div>


                <div style="
                  font-size:13px;
                  color:#64748b;
                ">
                  DNI:
                  ${notificacion.alumno_dni ?? '-'}
                </div>


                ${
                  notificacion.alumno_telefono
                    ? `
                      <div style="
                        font-size:13px;
                        color:#64748b;
                      ">
                        Teléfono:
                        ${notificacion.alumno_telefono}
                      </div>
                    `
                    : ''
                }


                ${
                  notificacion.alumno_correo
                    ? `
                      <div style="
                        font-size:13px;
                        color:#64748b;
                      ">
                        Correo:
                        ${notificacion.alumno_correo}
                      </div>
                    `
                    : ''
                }


                <div style="
                  font-size:13px;
                  color:#475569;
                  margin-top:4px;
                ">
                  Cuota:

                  ${
                    notificacion.numero_cuota !== null

                      ? notificacion.numero_cuota

                      : 'Certificación'
                  }

                </div>


                <div style="
                  font-size:13px;
                  color:#475569;
                ">
                  Vencimiento:
                  ${fecha}
                </div>


                <div style="
                  font-size:13px;
                  color:#475569;
                ">
                  Saldo pendiente:
                  S/ ${saldo}
                </div>

              </div>

            `;
          }
        )

        .join('');


    // --------------------------------------------------------
    // MODAL
    // --------------------------------------------------------

    Swal.fire({

      title: 'Notificaciones',

      html: `

        <div style="
          max-height:450px;
          overflow-y:auto;
          padding:4px;
        ">

          ${contenido}

        </div>

      `,

      width: 550,

      confirmButtonColor: '#f5b700',

      confirmButtonText: 'Cerrar'

    });

  }


  // ==========================================================
  // EXPORTAR EXCEL
  // ==========================================================

  exportarExcel(): void {

    const data =
      this.notificaciones();


    // --------------------------------------------------------
    // VALIDAR DATOS
    // --------------------------------------------------------

    if (
      !data.notificaciones ||
      data.notificaciones.length === 0
    ) {

      Swal.fire({

        icon: 'info',

        title: 'No hay información',

        text:
          'No existen notificaciones para exportar.',

        confirmButtonColor: '#f5b700'

      });

      return;
    }


    // --------------------------------------------------------
    // ALERTA DE CARGA
    // --------------------------------------------------------

    Swal.fire({

      title: 'Generando reporte',

      text:
        'Preparando el archivo Excel...',

      allowOutsideClick: false,

      allowEscapeKey: false,

      didOpen: () => {

        Swal.showLoading();

      }

    });


    // --------------------------------------------------------
    // PEQUEÑO DELAY PARA QUE EL LOADING SE RENDERICE
    // --------------------------------------------------------

    setTimeout(() => {

      try {

        // ====================================================
        // CREAR LIBRO
        // ====================================================

        const workbook =
          XLSX.utils.book_new();


        // ====================================================
        // FECHA ACTUAL
        // ====================================================

        const fechaActual =
          new Date();

        const fechaTexto =
          this.formatearFechaExcel(
            fechaActual
          );


        // ====================================================
        // HOJA 1 - RESUMEN
        // ====================================================

        const resumenData = [

          [
            'REPORTE DE NOTIFICACIONES DE PAGOS'
          ],

          [],

          [
            'Fecha de generación',
            fechaTexto
          ],

          [],

          [
            'RESUMEN'
          ],

          [
            'Indicador',
            'Cantidad'
          ],

          [
            'Total de notificaciones',
            data.total
          ],

          [
            'Cuotas vencidas',
            data.vencidas
          ],

          [
            'Cuotas por vencer',
            data.por_vencer
          ],

          [
            'Alumnos con notificaciones',
            data.cantidad_alumnos ?? 0
          ],

          [
            'Alumnos con cuotas vencidas',
            data.cantidad_alumnos_vencidos ?? 0
          ],

          [
            'Alumnos con cuotas por vencer',
            data.cantidad_alumnos_por_vencer ?? 0
          ]

        ];


        const worksheetResumen =
          XLSX.utils.aoa_to_sheet(
            resumenData
          );


        // ====================================================
        // ESTILOS / ANCHOS RESUMEN
        // ====================================================

        worksheetResumen['A1'].s = {

          font: {
            bold: true,
            sz: 16
          }

        };


        worksheetResumen['A5'].s = {

          font: {
            bold: true,
            sz: 13
          }

        };


        worksheetResumen['A6'].s = {

          font: {
            bold: true
          }

        };


        worksheetResumen['B6'].s = {

          font: {
            bold: true
          }

        };


        worksheetResumen['!cols'] = [

          {
            wch: 38
          },

          {
            wch: 20
          }

        ];


        XLSX.utils.book_append_sheet(

          workbook,

          worksheetResumen,

          'Resumen'

        );


        // ====================================================
        // PREPARAR DETALLE
        // ====================================================

        const detalleExcel =
          data.notificaciones.map(

            (
              item: NotificacionCuota
            ) => {

              const nombre =
                `${item.alumno_nombres ?? ''} ${item.alumno_apellidos ?? ''}`
                  .trim();


              const estado =
                item.tipo === 'VENCIDA'

                  ? 'VENCIDA'

                  : 'POR VENCER';


              const cuota =
                item.numero_cuota !== null

                  ? item.numero_cuota

                  : 'Certificación';


              return {

                'ESTADO':
                  estado,

                'N° DOCUMENTO':
                  item.alumno_dni ?? '',

                'APELLIDOS':
                  item.alumno_apellidos ?? '',

                'NOMBRES':
                  item.alumno_nombres ?? '',

                'ALUMNO':
                  nombre,

                'TELÉFONO':
                  item.alumno_telefono ?? '',

                'CORREO':
                  item.alumno_correo ?? '',

                'MATRÍCULA ID':
                  item.matricula_id,

                'ALUMNO ID':
                  item.alumno_id,

                'CUOTA ID':
                  item.cuota_id,

                'N° CUOTA':
                  cuota,

                'CÓDIGO CONCEPTO':
                  item.concepto_codigo ?? '',

                'CONCEPTO':
                  item.concepto_nombre ?? '',

                'FECHA VENCIMIENTO':
                  this.formatearFecha(
                    item.fecha_vencimiento
                  ),

                'DÍAS':
                  item.dias,

                'MONTO PROGRAMADO':
                  Number(
                    item.monto_programado || 0
                  ),

                'MONTO PAGADO':
                  Number(
                    item.monto_pagado || 0
                  ),

                'SALDO PENDIENTE':
                  Number(
                    item.saldo_pendiente || 0
                  )

              };

            }

          );


        // ====================================================
        // HOJA DETALLE
        // ====================================================

        const worksheetDetalle =
          XLSX.utils.json_to_sheet(
            detalleExcel
          );


        // ====================================================
        // FILTRO
        // ====================================================

        if (
          detalleExcel.length > 0
        ) {

          worksheetDetalle['!autofilter'] = {

            ref:
              `A1:R${detalleExcel.length + 1}`

          };

        }


        // ====================================================
        // CONGELAR ENCABEZADO
        // ====================================================

        worksheetDetalle['!freeze'] = {

          xSplit: 0,

          ySplit: 1

        };


        // ====================================================
        // ANCHOS DE COLUMNAS
        // ====================================================

        worksheetDetalle['!cols'] = [

          {
            wch: 18
          },

          {
            wch: 16
          },

          {
            wch: 25
          },

          {
            wch: 20
          },

          {
            wch: 32
          },

          {
            wch: 15
          },

          {
            wch: 32
          },

          {
            wch: 14
          },

          {
            wch: 12
          },

          {
            wch: 12
          },

          {
            wch: 12
          },

          {
            wch: 18
          },

          {
            wch: 30
          },

          {
            wch: 20
          },

          {
            wch: 10
          },

          {
            wch: 20
          },

          {
            wch: 18
          },

          {
            wch: 20
          }

        ];


        // ====================================================
        // AGREGAR HOJA
        // ====================================================

        XLSX.utils.book_append_sheet(

          workbook,

          worksheetDetalle,

          'Detalle de cuotas'

        );


        // ====================================================
        // HOJA 3 - VENCIDAS
        // ====================================================

        const vencidas =
          data.notificaciones

            .filter(
              item =>
                item.tipo === 'VENCIDA'
            )

            .map(
              item =>
                this.convertirParaExcel(
                  item
                )
            );


        const worksheetVencidas =
          XLSX.utils.json_to_sheet(
            vencidas
          );


        worksheetVencidas['!cols'] =
          worksheetDetalle['!cols'];


        if (
          vencidas.length > 0
        ) {

          worksheetVencidas['!autofilter'] = {

            ref:
              `A1:R${vencidas.length + 1}`

          };

        }


        worksheetVencidas['!freeze'] = {

          xSplit: 0,

          ySplit: 1

        };


        XLSX.utils.book_append_sheet(

          workbook,

          worksheetVencidas,

          'Vencidas'

        );


        // ====================================================
        // HOJA 4 - POR VENCER
        // ====================================================

        const porVencer =
          data.notificaciones

            .filter(
              item =>
                item.tipo === 'POR_VENCER'
            )

            .map(
              item =>
                this.convertirParaExcel(
                  item
                )
            );


        const worksheetPorVencer =
          XLSX.utils.json_to_sheet(
            porVencer
          );


        worksheetPorVencer['!cols'] =
          worksheetDetalle['!cols'];


        if (
          porVencer.length > 0
        ) {

          worksheetPorVencer['!autofilter'] = {

            ref:
              `A1:R${porVencer.length + 1}`

          };

        }


        worksheetPorVencer['!freeze'] = {

          xSplit: 0,

          ySplit: 1

        };


        XLSX.utils.book_append_sheet(

          workbook,

          worksheetPorVencer,

          'Por vencer'

        );


        // ====================================================
        // NOMBRE DEL ARCHIVO
        // ====================================================

        const nombreArchivo =
          `Reporte_Notificaciones_${this.formatearNombreFecha(
            fechaActual
          )}.xlsx`;


        // ====================================================
        // DESCARGAR
        // ====================================================

        XLSX.writeFile(

          workbook,

          nombreArchivo

        );


        // ====================================================
        // CERRAR LOADING
        // ====================================================

        Swal.close();


        // ====================================================
        // CONFIRMACIÓN
        // ====================================================

        Swal.fire({

          icon: 'success',

          title: 'Reporte generado',

          html: `

            <div style="
              text-align:center;
            ">

              <p>
                El archivo Excel fue generado
                correctamente.
              </p>

              <p style="
                color:#64748b;
                font-size:13px;
              ">

                <strong>
                  ${data.notificaciones.length}
                </strong>

                registros exportados.

              </p>

            </div>

          `,

          confirmButtonColor: '#f5b700',

          confirmButtonText: 'Aceptar'

        });


      } catch (error) {

        console.error(
          'Error generando Excel:',
          error
        );


        Swal.close();


        Swal.fire({

          icon: 'error',

          title: 'Error al generar Excel',

          text:
            'No fue posible generar el archivo. Revise la consola para más detalles.',

          confirmButtonColor: '#dc2626'

        });

      }

    }, 150);

  }


  // ==========================================================
  // CONVERTIR NOTIFICACIÓN PARA EXCEL
  // ==========================================================

  private convertirParaExcel(
    item: NotificacionCuota
  ): Record<string, any> {

    const nombre =
      `${item.alumno_nombres ?? ''} ${item.alumno_apellidos ?? ''}`
        .trim();


    const cuota =
      item.numero_cuota !== null

        ? item.numero_cuota

        : 'Certificación';


    return {

      'ESTADO':
        item.tipo === 'VENCIDA'
          ? 'VENCIDA'
          : 'POR VENCER',

      'N° DOCUMENTO':
        item.alumno_dni ?? '',

      'APELLIDOS':
        item.alumno_apellidos ?? '',

      'NOMBRES':
        item.alumno_nombres ?? '',

      'ALUMNO':
        nombre,

      'TELÉFONO':
        item.alumno_telefono ?? '',

      'CORREO':
        item.alumno_correo ?? '',

      'MATRÍCULA ID':
        item.matricula_id,

      'ALUMNO ID':
        item.alumno_id,

      'CUOTA ID':
        item.cuota_id,

      'N° CUOTA':
        cuota,

      'CÓDIGO CONCEPTO':
        item.concepto_codigo ?? '',

      'CONCEPTO':
        item.concepto_nombre ?? '',

      'FECHA VENCIMIENTO':
        this.formatearFecha(
          item.fecha_vencimiento
        ),

      'DÍAS':
        item.dias,

      'MONTO PROGRAMADO':
        Number(
          item.monto_programado || 0
        ),

      'MONTO PAGADO':
        Number(
          item.monto_pagado || 0
        ),

      'SALDO PENDIENTE':
        Number(
          item.saldo_pendiente || 0
        )

    };

  }


  // ==========================================================
  // FORMATEAR FECHA
  // ==========================================================

  formatearFecha(
    fecha: string
  ): string {

    if (!fecha) {

      return '-';

    }


    const partes =
      String(fecha).split('-');


    if (
      partes.length !== 3
    ) {

      return fecha;

    }


    return `${partes[2]}/${partes[1]}/${partes[0]}`;

  }


  // ==========================================================
  // FECHA PARA NOMBRE DE ARCHIVO
  // ==========================================================

  private formatearNombreFecha(
    fecha: Date
  ): string {

    const dia =
      String(
        fecha.getDate()
      ).padStart(2, '0');


    const mes =
      String(
        fecha.getMonth() + 1
      ).padStart(2, '0');


    const anio =
      fecha.getFullYear();


    return `${dia}-${mes}-${anio}`;

  }


  // ==========================================================
  // FECHA PARA RESUMEN
  // ==========================================================

  private formatearFechaExcel(
    fecha: Date
  ): string {

    const dia =
      String(
        fecha.getDate()
      ).padStart(2, '0');


    const mes =
      String(
        fecha.getMonth() + 1
      ).padStart(2, '0');


    const anio =
      fecha.getFullYear();


    return `${dia}/${mes}/${anio}`;

  }


  // ==========================================================
  // LOGOUT
  // ==========================================================

  onLogout(): void {

    Swal.fire({

      title:
        '¿Cerrar sesión?',

      text:
        '¿Está seguro de que desea salir del sistema PROEDSO?',

      icon:
        'question',

      showCancelButton:
        true,

      confirmButtonColor:
        '#f5b700',

      cancelButtonColor:
        '#1e222b',

      confirmButtonText:
        'Sí, salir',

      cancelButtonText:
        'Cancelar',

      reverseButtons:
        true

    })

    .then(
      (
        result
      ) => {

        if (
          result.isConfirmed
        ) {

          this.authService.logout();


          Swal.fire({

            icon:
              'success',

            title:
              'Sesión finalizada',

            text:
              'Has cerrado sesión de forma segura.',

            timer:
              1300,

            showConfirmButton:
              false

          });


          this.router.navigate([
            '/login'
          ]);

        }

      }
    );

  }

}
