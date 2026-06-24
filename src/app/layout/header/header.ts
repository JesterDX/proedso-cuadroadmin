import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service'; // Ajusta la ruta a tu auth.service
import { LucideAngularModule, Search, Bell, UserCircle2, LogOut } from 'lucide-angular'; // 👈 Añadimos LogOut
import Swal from 'sweetalert2';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Traemos los datos de Yesly (Signal) para pintarlos si los necesitas
  public usuarioLogueado = this.authService.usuarioActual;

  readonly icons = {
    search: Search,
    bell: Bell,
    user: UserCircle2,
    logout: LogOut // 👈 Mapeamos el icono de salida
  };

  onLogout(): void {
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: '¿Está seguro de que desea salir del sistema PROEDSO?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#f5b700', // Amarillo industrial PROEDSO
      cancelButtonColor: '#1e222b',   // Gris oscuro
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.logout(); // Borra tokens
        
        Swal.fire({
          icon: 'success',
          title: 'Sesión finalizada',
          text: 'Has cerrado sesión de forma segura.',
          timer: 1300,
          showConfirmButton: false
        });

        this.router.navigate(['/login']); // Redirección al Login limpio
      }
    });
  }
}