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
import ExcelJS from 'exceljs';

import { AuthService } from '../../auth/services/auth.service';
import {
  NotificacionService,
  ResumenNotificaciones,
  NotificacionCuota
} from '../../core/services/notificaciones.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class HeaderComponent implements OnInit {

  // ==========================================================
  // SERVICIOS
  // ==========================================================
  private authService = inject(AuthService);
  private router = inject(Router);
  private notificacionService = inject(NotificacionService);

  // ==========================================================
  // USUARIO
  // ==========================================================
  public usuarioLogueado = this.authService.usuarioActual;

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
  // COLORES EXCEL
  // ==========================================================
  private readonly EXCEL_COLORS = {
    azul: '00184D',
    amarillo: 'FFCF15',
    blanco: 'FFFFFF',

    grisOscuro: '1E293B',
    grisTexto: '334155',
    grisClaro: 'F8FAFC',
    bordeClaro: 'E2E8F0',

    rojoTexto: '991B1B',
    rojoFondo: 'FEE2E2',

    amarilloTexto: '92400E',
    amarilloFondo: 'FEF3C7'
  };

  // ==========================================================
  // NOTIFICACIONES
  // ==========================================================
  notificaciones = signal<ResumenNotificaciones>({
    vencidas: 0,
    por_vencer: 0,
    total: 0,
    cantidad_alumnos: 0,
    cantidad_alumnos_vencidos: 0,
    cantidad_alumnos_por_vencer: 0,
    notificaciones: []
  });

  // ==========================================================
  // INICIALIZACIÓN
  // ==========================================================
  ngOnInit(): void {
    this.cargarNotificaciones();
  }

  // ==========================================================
  // CARGAR NOTIFICACIONES
  // ==========================================================
  cargarNotificaciones(): void {
    this.notificacionService.obtenerNotificaciones().subscribe({
      next: (response: ResumenNotificaciones) => {
        this.notificaciones.set({
          vencidas: Number(response?.vencidas || 0),
          por_vencer: Number(response?.por_vencer || 0),
          total: Number(response?.total || 0),
          cantidad_alumnos: Number(response?.cantidad_alumnos || 0),
          cantidad_alumnos_vencidos: Number(
            response?.cantidad_alumnos_vencidos || 0
          ),
          cantidad_alumnos_por_vencer: Number(
            response?.cantidad_alumnos_por_vencer || 0
          ),
          notificaciones: response?.notificaciones || []
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
  // EXPORTAR EXCEL ESTILIZADO
  // ==========================================================
  async exportarExcel(): Promise<void> {
    const data = this.notificaciones();

    if (
      !data.notificaciones ||
      data.notificaciones.length === 0
    ) {
      Swal.fire({
        icon: 'info',
        title: 'No hay información',
        text: 'No existen notificaciones para exportar.',
        confirmButtonColor: `#${this.EXCEL_COLORS.amarillo}`
      });

      return;
    }

    Swal.fire({
      title: 'Generando reporte',
      text: 'Diseñando el archivo Excel...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const workbook = new ExcelJS.Workbook();

      workbook.creator = 'PROEDSO';
      workbook.lastModifiedBy = 'PROEDSO';
      workbook.created = new Date();
      workbook.modified = new Date();

      const fechaActual = new Date();
      const fechaTexto =
        this.formatearFechaExcel(fechaActual);

      // ======================================================
      // HOJA 1 - RESUMEN
      // ======================================================
      const wsResumen = workbook.addWorksheet('Resumen', {
        views: [
          {
            showGridLines: true
          }
        ]
      });

      wsResumen.columns = [
        { width: 38 },
        { width: 18 }
      ];

      // ------------------------------------------------------
      // TÍTULO
      // ------------------------------------------------------
      wsResumen.mergeCells('A1:B2');

      const titulo = wsResumen.getCell('A1');

      titulo.value =
        'REPORTE DE NOTIFICACIONES DE PAGOS';

      titulo.font = {
        name: 'Segoe UI',
        size: 14,
        bold: true,
        color: {
          argb: this.EXCEL_COLORS.blanco
        }
      };

      titulo.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
          argb: this.EXCEL_COLORS.azul
        }
      };

      titulo.alignment = {
        vertical: 'middle',
        horizontal: 'center'
      };

      // ------------------------------------------------------
      // FECHA
      // ------------------------------------------------------
      wsResumen.mergeCells('A3:B3');

      const fechaCell = wsResumen.getCell('A3');

      fechaCell.value =
        `Generado el: ${fechaTexto}`;

      fechaCell.font = {
        name: 'Segoe UI',
        size: 9,
        italic: true,
        color: {
          argb: this.EXCEL_COLORS.grisTexto
        }
      };

      fechaCell.alignment = {
        horizontal: 'center',
        vertical: 'middle'
      };

      // ------------------------------------------------------
      // SEPARADOR AMARILLO
      // ------------------------------------------------------
      wsResumen.mergeCells('A4:B4');

      wsResumen.getCell('A4').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
          argb: this.EXCEL_COLORS.amarillo
        }
      };

      wsResumen.getRow(4).height = 4;

      // ------------------------------------------------------
      // TÍTULO INDICADORES
      // ------------------------------------------------------
      wsResumen.mergeCells('A6:B6');

      const resumenTitulo =
        wsResumen.getCell('A6');

      resumenTitulo.value =
        'INDICADORES CLAVE';

      resumenTitulo.font = {
        name: 'Segoe UI',
        size: 11,
        bold: true,
        color: {
          argb: this.EXCEL_COLORS.blanco
        }
      };

      resumenTitulo.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
          argb: this.EXCEL_COLORS.azul
        }
      };

      resumenTitulo.alignment = {
        horizontal: 'left',
        vertical: 'middle'
      };

      // ------------------------------------------------------
      // CABECERA TABLA
      // ------------------------------------------------------
      const rowHeaderResumen =
        wsResumen.getRow(7);

      rowHeaderResumen.values = [
        'Métrica',
        'Cantidad'
      ];

      this.estilizarEncabezado(
        rowHeaderResumen
      );

      // ------------------------------------------------------
      // DATOS RESUMEN
      // ------------------------------------------------------
      const resumenRows = [
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

      resumenRows.forEach(
        (row, index) => {
          const excelRow =
            wsResumen.addRow(row);

          excelRow.height = 20;

          excelRow.eachCell(
            (cell, colIndex) => {
              cell.font = {
                name: 'Segoe UI',
                size: 10,
                color: {
                  argb: this.EXCEL_COLORS.grisTexto
                }
              };

              cell.alignment = {
                vertical: 'middle',
                horizontal:
                  colIndex === 2
                    ? 'center'
                    : 'left'
              };

              cell.border =
                this.bordeSuave();

              if (index % 2 === 0) {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: {
                    argb:
                      this.EXCEL_COLORS.grisClaro
                  }
                };
              }
            }
          );
        }
      );

      // ------------------------------------------------------
      // DESTACAR VENCIDAS
      // ------------------------------------------------------
      wsResumen.getCell('A9').font = {
        name: 'Segoe UI',
        size: 10,
        bold: true,
        color: {
          argb:
            this.EXCEL_COLORS.rojoTexto
        }
      };

      wsResumen.getCell('B9').font = {
        name: 'Segoe UI',
        size: 11,
        bold: true,
        color: {
          argb:
            this.EXCEL_COLORS.rojoTexto
        }
      };

      // ------------------------------------------------------
      // DESTACAR POR VENCER
      // ------------------------------------------------------
      wsResumen.getCell('A10').font = {
        name: 'Segoe UI',
        size: 10,
        bold: true,
        color: {
          argb:
            this.EXCEL_COLORS.amarilloTexto
        }
      };

      wsResumen.getCell('B10').font = {
        name: 'Segoe UI',
        size: 11,
        bold: true,
        color: {
          argb:
            this.EXCEL_COLORS.amarilloTexto
        }
      };

      // ======================================================
      // HOJAS DE DETALLE
      // ======================================================
      const detalleExcel =
        data.notificaciones.map(
          item =>
            this.convertirParaExcel(item)
        );

      const vencidas =
        data.notificaciones
          .filter(
            item =>
              item.tipo === 'VENCIDA'
          )
          .map(
            item =>
              this.convertirParaExcel(item)
          );

      const porVencer =
        data.notificaciones
          .filter(
            item =>
              item.tipo === 'POR_VENCER'
          )
          .map(
            item =>
              this.convertirParaExcel(item)
          );

      this.crearHojaNotificaciones(
        workbook,
        'Detalle General',
        detalleExcel
      );

      this.crearHojaNotificaciones(
        workbook,
        'Vencidas',
        vencidas
      );

      this.crearHojaNotificaciones(
        workbook,
        'Por Vencer',
        porVencer
      );

      // ======================================================
      // DESCARGAR ARCHIVO
      // ======================================================
      const nombreArchivo =
        `Reporte_Notificaciones_${this.formatearNombreFecha(
          fechaActual
        )}.xlsx`;

      const buffer =
        await workbook.xlsx.writeBuffer();

      const blob = new Blob(
        [buffer],
        {
          type:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      );

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement('a');

      link.href = url;
      link.download = nombreArchivo;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);

      Swal.close();

      Swal.fire({
        icon: 'success',
        title: 'Reporte generado',
        text:
          `Se han exportado ${data.notificaciones.length} registros exitosamente.`,
        confirmButtonColor:
          `#${this.EXCEL_COLORS.amarillo}`
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
          'Ocurrió un problema al procesar el documento.',
        confirmButtonColor:
          '#DC2626'
      });
    }
  }

  // ==========================================================
  // CREAR HOJA DE NOTIFICACIONES
  // ==========================================================
  private crearHojaNotificaciones(
    workbook: ExcelJS.Workbook,
    nombreHoja: string,
    datos: Record<string, any>[]
  ): void {

    const worksheet =
      workbook.addWorksheet(
        nombreHoja,
        {
          views: [
            {
              showGridLines: true,
              state: 'frozen',
              ySplit: 1
            }
          ]
        }
      );

    worksheet.columns = [
      {
        header: 'ESTADO',
        key: 'ESTADO',
        width: 16
      },
      {
        header: 'N° DOCUMENTO',
        key: 'N° DOCUMENTO',
        width: 16
      },
      {
        header: 'APELLIDOS',
        key: 'APELLIDOS',
        width: 22
      },
      {
        header: 'NOMBRES',
        key: 'NOMBRES',
        width: 20
      },
      {
        header: 'ALUMNO',
        key: 'ALUMNO',
        width: 30
      },
      {
        header: 'TELÉFONO',
        key: 'TELÉFONO',
        width: 15
      },
      {
        header: 'CORREO',
        key: 'CORREO',
        width: 28
      },
      {
        header: 'MATRÍCULA ID',
        key: 'MATRÍCULA ID',
        width: 14
      },
      {
        header: 'ALUMNO ID',
        key: 'ALUMNO ID',
        width: 12
      },
      {
        header: 'CUOTA ID',
        key: 'CUOTA ID',
        width: 12
      },
      {
        header: 'N° CUOTA',
        key: 'N° CUOTA',
        width: 12
      },
      {
        header: 'CÓDIGO CONCEPTO',
        key: 'CÓDIGO CONCEPTO',
        width: 18
      },
      {
        header: 'CONCEPTO',
        key: 'CONCEPTO',
        width: 26
      },
      {
        header: 'FECHA VENCIMIENTO',
        key: 'FECHA VENCIMIENTO',
        width: 20
      },
      {
        header: 'DÍAS',
        key: 'DÍAS',
        width: 10
      },
      {
        header: 'MONTO PROGRAMADO',
        key: 'MONTO PROGRAMADO',
        width: 20
      },
      {
        header: 'MONTO PAGADO',
        key: 'MONTO PAGADO',
        width: 18
      },
      {
        header: 'SALDO PENDIENTE',
        key: 'SALDO PENDIENTE',
        width: 20
      }
    ];

    // ------------------------------------------------------
    // CABECERA
    // ------------------------------------------------------
    const headerRow =
      worksheet.getRow(1);

    this.estilizarEncabezado(
      headerRow
    );

    // ------------------------------------------------------
    // DATOS
    // ------------------------------------------------------
    datos.forEach(
      (dato, index) => {

        const row =
          worksheet.addRow(dato);

        row.height = 20;

        row.eachCell(
          (cell) => {

            cell.font = {
              name: 'Segoe UI',
              size: 9,
              color: {
                argb:
                  this.EXCEL_COLORS.grisTexto
              }
            };

            cell.alignment = {
              vertical: 'middle',
              horizontal: 'left'
            };

            cell.border =
              this.bordeSuave();

            if (index % 2 === 0) {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {
                  argb:
                    this.EXCEL_COLORS.grisClaro
                }
              };
            }
          }
        );

        // ----------------------------------------------------
        // ESTADO
        // ----------------------------------------------------
        const estadoCell =
          row.getCell(1);

        const estado =
          String(
            dato['ESTADO'] ?? ''
          );

        if (estado === 'VENCIDA') {

          estadoCell.font = {
            name: 'Segoe UI',
            size: 9,
            bold: true,
            color: {
              argb:
                this.EXCEL_COLORS.rojoTexto
            }
          };

          estadoCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: {
              argb:
                this.EXCEL_COLORS.rojoFondo
            }
          };

        } else if (
          estado === 'POR VENCER'
        ) {

          estadoCell.font = {
            name: 'Segoe UI',
            size: 9,
            bold: true,
            color: {
              argb:
                this.EXCEL_COLORS.amarilloTexto
            }
          };

          estadoCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: {
              argb:
                this.EXCEL_COLORS.amarilloFondo
            }
          };
        }

        estadoCell.alignment = {
          horizontal: 'center',
          vertical: 'middle'
        };

        // ----------------------------------------------------
        // ALINEACIONES CENTRALES
        // ----------------------------------------------------
        [
          2,
          6,
          8,
          9,
          10,
          11,
          12,
          14,
          15
        ].forEach(
          colIndex => {

            row
              .getCell(colIndex)
              .alignment = {
                horizontal: 'center',
                vertical: 'middle'
              };
          }
        );

        // ----------------------------------------------------
        // FORMATO MONETARIO
        // ----------------------------------------------------
        [
          16,
          17,
          18
        ].forEach(
          colIndex => {

            const montoCell =
              row.getCell(colIndex);

            montoCell.numFmt =
              '"S/" #,##0.00;[Red]-"S/" #,##0.00;"S/" 0.00';

            montoCell.alignment = {
              horizontal: 'right',
              vertical: 'middle'
            };
          }
        );
      }
    );

    // ------------------------------------------------------
    // FILTRO
    // ------------------------------------------------------
    if (datos.length > 0) {

      worksheet.autoFilter = {
        from: 'A1',
        to: `R${datos.length + 1}`
      };
    }
  }

  // ==========================================================
  // ESTILIZAR ENCABEZADO
  // ==========================================================
  private estilizarEncabezado(
    row: ExcelJS.Row
  ): void {

    row.height = 26;

    row.eachCell(
      (cell) => {

        cell.font = {
          name: 'Segoe UI',
          size: 9,
          bold: true,
          color: {
            argb:
              this.EXCEL_COLORS.blanco
          }
        };

        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
            argb:
              this.EXCEL_COLORS.azul
          }
        };

        cell.alignment = {
          horizontal: 'center',
          vertical: 'middle',
          wrapText: true
        };

        cell.border = {
          bottom: {
            style: 'medium',
            color: {
              argb:
                this.EXCEL_COLORS.amarillo
            }
          },

          right: {
            style: 'thin',
            color: {
              argb:
                this.EXCEL_COLORS.grisTexto
            }
          }
        };
      }
    );
  }

  // ==========================================================
  // BORDE SUAVE
  // ==========================================================
  private bordeSuave(): ExcelJS.Borders {

    return {

      top: {
        style: 'thin',
        color: {
          argb:
            this.EXCEL_COLORS.bordeClaro
        }
      },

      bottom: {
        style: 'thin',
        color: {
          argb:
            this.EXCEL_COLORS.bordeClaro
        }
      },

      left: {
        style: 'thin',
        color: {
          argb:
            this.EXCEL_COLORS.bordeClaro
        }
      },

      right: {
        style: 'thin',
        color: {
          argb:
            this.EXCEL_COLORS.bordeClaro
        }
      },

      // ExcelJS lo exige en la interfaz Borders.
      // No estamos aplicando ningún borde diagonal.
      diagonal: {}
    };
  }

  // ==========================================================
  // CONVERTIR NOTIFICACIÓN A EXCEL
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

    return partes.length === 3
      ? `${partes[2]}/${partes[1]}/${partes[0]}`
      : fecha;
  }

  // ==========================================================
  // NOMBRE DE ARCHIVO
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

    return `${dia}-${mes}-${fecha.getFullYear()}`;
  }

  // ==========================================================
  // FECHA PARA EXCEL
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

    return `${dia}/${mes}/${fecha.getFullYear()}`;
  }

  // ==========================================================
  // ABRIR NOTIFICACIONES
  // ==========================================================
  abrirNotificaciones(): void {

    const data =
      this.notificaciones();

    if (!data.total) {

      Swal.fire({
        icon: 'success',
        title: 'Sin notificaciones',
        text:
          'No hay cuotas vencidas ni cuotas próximas a vencer.',
        confirmButtonColor:
          `#${this.EXCEL_COLORS.amarillo}`
      });

      return;
    }

    const contenido =
      data.notificaciones
        .map(
          (notificacion) => {

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
              <div
                style="
                  text-align:left;
                  padding:12px;
                  margin-bottom:8px;
                  border:1px solid #e5e7eb;
                  border-radius:8px;
                  background:#fff;
                "
              >

                <div
                  style="
                    font-weight:700;
                    ${clase}
                    margin-bottom:5px;
                  "
                >
                  ${estado}
                </div>

                <div
                  style="
                    font-weight:600;
                    color:#1f2937;
                  "
                >
                  ${nombreCompleto}
                </div>

                <div
                  style="
                    font-size:13px;
                    color:#64748b;
                  "
                >
                  DNI:
                  ${notificacion.alumno_dni ?? '-'}
                </div>

                ${
                  notificacion.alumno_telefono
                    ? `
                      <div
                        style="
                          font-size:13px;
                          color:#64748b;
                        "
                      >
                        Teléfono:
                        ${notificacion.alumno_telefono}
                      </div>
                    `
                    : ''
                }

                ${
                  notificacion.alumno_correo
                    ? `
                      <div
                        style="
                          font-size:13px;
                          color:#64748b;
                        "
                      >
                        Correo:
                        ${notificacion.alumno_correo}
                      </div>
                    `
                    : ''
                }

                <div
                  style="
                    font-size:13px;
                    color:#475569;
                    margin-top:4px;
                  "
                >
                  Cuota:
                  ${
                    notificacion.numero_cuota !== null
                      ? notificacion.numero_cuota
                      : 'Certificación'
                  }
                </div>

                <div
                  style="
                    font-size:13px;
                    color:#475569;
                  "
                >
                  Vencimiento:
                  ${fecha}
                </div>

                <div
                  style="
                    font-size:13px;
                    color:#475569;
                  "
                >
                  Saldo pendiente:
                  S/ ${saldo}
                </div>

              </div>
            `;
          }
        )
        .join('');

    Swal.fire({
      title: 'Notificaciones',

      html:
        `<div style="max-height:450px; overflow-y:auto; padding:4px;">
          ${contenido}
        </div>`,

      width: 550,

      confirmButtonColor:
        `#${this.EXCEL_COLORS.amarillo}`,

      confirmButtonText:
        'Cerrar'
    });
  }

  // ==========================================================
  // CERRAR SESIÓN
  // ==========================================================
  onLogout(): void {

    Swal.fire({
      title: '¿Cerrar sesión?',

      text:
        '¿Está seguro de que desea salir del sistema PROEDSO?',

      icon: 'question',

      showCancelButton: true,

      confirmButtonColor:
        `#${this.EXCEL_COLORS.amarillo}`,

      cancelButtonColor:
        `#${this.EXCEL_COLORS.azul}`,

      confirmButtonText:
        'Sí, salir',

      cancelButtonText:
        'Cancelar',

      reverseButtons: true

    }).then(
      (result) => {

        if (result.isConfirmed) {

          this.authService.logout();

          Swal.fire({
            icon: 'success',
            title: 'Sesión finalizada',
            text:
              'Has cerrado sesión de forma segura.',
            timer: 1300,
            showConfirmButton: false
          });

          this.router.navigate([
            '/login'
          ]);
        }
      }
    );
  }
}
