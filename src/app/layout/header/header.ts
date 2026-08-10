import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
LucideAngularModule,
Search,
Bell,
UserCircle2,
LogOut,
AlertCircle,
Clock,
ChevronDown
} from 'lucide-angular';
import { Subscription, interval } from 'rxjs';
import Swal from 'sweetalert2';

import { AuthService } from '../../auth/services/auth.service';
import { NotificacionService } from '../services/notificacion.service';

interface Notificacion {
id: number;
tipo: 'VENCIDA' | 'POR_VENCER';
matricula_id: number;
alumno_id: number;
alumno_nombre: string;
alumno_dni: string;
cuota_id: number;
numero_cuota: number | null;
fecha_vencimiento: string;
monto: number;
dias_diferencia: number;
mensaje: string;
}

interface ResumenNotificaciones {
vencidas: number;
por_vencer: number;
total: number;
notificaciones: Notificacion[];
}

@Component({
selector: 'app-header',
standalone: true,
imports: [LucideAngularModule],
templateUrl: './header.html',
styleUrls: ['./header.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {

private authService = inject(AuthService);
private router = inject(Router);
private notificacionService = inject(NotificacionService);

private refreshSubscription?: Subscription;

public usuarioLogueado = this.authService.usuarioActual;

readonly icons = {
search: Search,
bell: Bell,
user: UserCircle2,
logout: LogOut,
alert: AlertCircle,
clock: Clock,
chevron: ChevronDown
};

// =========================================================
// NOTIFICACIONES
// =========================================================

notificaciones = signal<ResumenNotificaciones>({
vencidas: 0,
por_vencer: 0,
total: 0,
notificaciones: []
});

mostrarNotificaciones = signal(false);

cargandoNotificaciones = signal(false);

// =========================================================
// INICIO
// =========================================================

ngOnInit(): void {


this.cargarNotificaciones();

// Actualizar cada 5 minutos
this.refreshSubscription = interval(5 * 60 * 1000)
  .subscribe(() => {
    this.cargarNotificaciones();
  });


}

// =========================================================
// DESTRUIR
// =========================================================

ngOnDestroy(): void {


this.refreshSubscription?.unsubscribe();


}

// =========================================================
// CARGAR NOTIFICACIONES
// =========================================================

cargarNotificaciones(): void {


if (this.cargandoNotificaciones()) {
  return;
}

this.cargandoNotificaciones.set(true);

this.notificacionService.obtenerNotificaciones()
  .subscribe({

    next: (response: ResumenNotificaciones) => {

      this.notificaciones.set({

        vencidas: Number(response?.vencidas || 0),

        por_vencer: Number(response?.por_vencer || 0),

        total: Number(response?.total || 0),

        notificaciones:
          Array.isArray(response?.notificaciones)
            ? response.notificaciones
            : []

      });

      this.cargandoNotificaciones.set(false);

    },

    error: (error) => {

      console.error(
        'Error al cargar notificaciones:',
        error
      );

      this.cargandoNotificaciones.set(false);

    }

  });


}

// =========================================================
// ABRIR / CERRAR CAMPANA
// =========================================================

toggleNotificaciones(): void {


this.mostrarNotificaciones.update(
  visible => !visible
);

// Si se abre, refrescamos para tener datos actualizados
if (this.mostrarNotificaciones()) {
  this.cargarNotificaciones();
}


}

// =========================================================
// IR A MATRÍCULA
// =========================================================

abrirNotificacion(
notificacion: Notificacion
): void {


this.mostrarNotificaciones.set(false);

this.router.navigate([
  '/admin/matriculas',
  notificacion.matricula_id
]);


}

// =========================================================
// COLOR SEGÚN TIPO
// =========================================================

obtenerClaseNotificacion(
tipo: string
): string {


return tipo === 'VENCIDA'
  ? 'notificacion-vencida'
  : 'notificacion-por-vencer';


}

// =========================================================
// TEXTO DE FECHA
// =========================================================

formatearFecha(
fecha: string
): string {


if (!fecha) {
  return '';
}

const fechaObj = new Date(
  `${fecha}T00:00:00`
);

return fechaObj.toLocaleDateString(
  'es-PE',
  {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }
);


}

// =========================================================
// FORMATEAR MONTO
// =========================================================

formatearMonto(
monto: number
): string {


return Number(monto || 0)
  .toLocaleString(
    'es-PE',
    {
      style: 'currency',
      currency: 'PEN'
    }
  );


}

// =========================================================
// CERRAR SESIÓN
// =========================================================

onLogout(): void {


Swal.fire({

  title: '¿Cerrar sesión?',

  text:
    '¿Está seguro de que desea salir del sistema PROEDSO?',

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

      text:
        'Has cerrado sesión de forma segura.',

      timer: 1300,

      showConfirmButton: false

    });

    this.router.navigate(['/login']);

  }

});


}

}
