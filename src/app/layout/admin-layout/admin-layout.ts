import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { HeaderComponent } from '../header/header'; 
// 🔑 CAMBIO AQUÍ: Importamos 'Sidebar' en lugar de 'SidebarComponent'
import { Sidebar } from '../sidebar/sidebar'; 
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  // 🔑 REGLA DE ORO: Cambia también aquí a 'Sidebar' dentro del arreglo
  imports: [RouterModule, HeaderComponent, Sidebar], 
  templateUrl: './admin-layout.html',
  styleUrls: ['./admin-layout.scss']
})
export class AdminLayout {
  private authService = inject(AuthService);
  private router = inject(Router);

  public usuarioLogueado = this.authService.usuarioActual;

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