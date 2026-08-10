import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  Search,
  Bell,
  UserCircle2,
  LogOut
} from 'lucide-angular';
import Swal from 'sweetalert2';

import { AuthService } from '../../auth/services/auth.service';
import {
  NotificacionService,
  ResumenNotificaciones
} from '../../core/services/notificaciones.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class HeaderComponent implements OnInit {

  private authService = inject(AuthService);
  private router = inject(Router);
  private notificacionService = inject(NotificacionService);

  public usuarioLogueado = this.authService.usuarioActual;

  readonly icons = {
    search: Search,
    bell: Bell,
    user: UserCircle2,
    logout: LogOut
  };

  notificaciones = signal<ResumenNotificaciones>({
    vencidas: 0,
    por_vencer: 0,
    total: 0,
    notificaciones: []
  });

  ngOnInit(): void {
    this.cargarNotificaciones();
  }

  cargarNotificaciones(): void {

    this.notificacionService.obtenerNotificaciones()
      .subscribe({
        next: (response: ResumenNotificaciones) => {

          this.notificaciones.set({
            vencidas: Number(response?.vencidas || 0),
            por_vencer: Number(response?.por_vencer || 0),
            total: Number(response?.total || 0),
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
            notificaciones: []
          });

        }
      });
  }

  abrirNotificaciones(): void {

    const data = this.notificaciones();

    if (!data.total) {

      Swal.fire({
        icon: 'success',
        title: 'Sin notificaciones',
        text: 'No hay cuotas vencidas ni cuotas próximas a vencer.',
        confirmButtonColor: '#f5b700'
      });

      return;
    }

    const contenido = data.notificaciones
      .map((notificacion) => {

        const clase =
          notificacion.tipo === 'VENCIDA'
            ? 'color:#dc2626;'
            : 'color:#d97706;';

        const estado =
          notificacion.tipo === 'VENCIDA'
            ? 'CUOTA VENCIDA'
            : 'CUOTA POR VENCER';

        const fecha = this.formatearFecha(
          notificacion.fecha_vencimiento
        );

        const saldo = Number(
          notificacion.saldo_pendiente || 0
        ).toFixed(2);

        const nombreCompleto =
          `${notificacion.alumno_nombres} ${notificacion.alumno_apellidos}`.trim();

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
              DNI: ${notificacion.alumno_dni}
            </div>

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
              Vencimiento: ${fecha}
            </div>

            <div style="
              font-size:13px;
              color:#475569;
            ">
              Saldo pendiente: S/ ${saldo}
            </div>

          </div>
        `;
      })
      .join('');

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

  formatearFecha(fecha: string): string {

    if (!fecha) {
      return '-';
    }

    const partes = String(fecha).split('-');

    if (partes.length !== 3) {
      return fecha;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  onLogout(): void {

    Swal.fire({
      title: '¿Cerrar sesión?',
      text: '¿Está seguro de que desea salir del sistema PROEDSO?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#f5b700',
      cancelButtonColor: '#1e222b',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
      reverseButtons: true

    }).then((result) => {

      if (result.isConfirmed) {

        this.authService.logout();

        Swal.fire({
          icon: 'success',
          title: 'Sesión finalizada',
          text: 'Has cerrado sesión de forma segura.',
          timer: 1300,
          showConfirmButton: false
        });

        this.router.navigate(['/login']);
      }

    });
  }
}

