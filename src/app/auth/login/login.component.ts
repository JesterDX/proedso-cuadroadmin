import { Component, inject, NgZone } from '@angular/core'; // 👈 1. Importa NgZone aquí
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private ngZone = inject(NgZone); 

  email = '';
  password = '';
  loading = false;

  onLogin(): void {
    if (!this.email || !this.password) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos vacíos',
        text: 'Por favor, completa todos los campos para ingresar.'
      });
      return;
    }

    this.loading = true;

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (resp) => {
        this.loading = false;
        
        Swal.fire({
          icon: 'success',
          title: 'Acceso concedido',
          text: resp.message || 'Ingresando al panel de control...',
          timer: 1200,
          showConfirmButton: false
        }).then(() => {
          
          // 🚀 3. FORZAMOS A ANGULAR A EJECUTAR LA NAVEGACIÓN EN SU ZONA REACTIVA:
          this.ngZone.run(() => {
            // Cambiado a '/' porque en tus rutas el path vacío '' es el que carga el Dashboard
            this.router.navigate(['/']); 
          });

        });
      },
      error: (err) => {
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error de Autenticación',
          text: err?.error?.message || 'Credenciales inválidas, intenta nuevamente.'
        });
      }
    });
  }
}