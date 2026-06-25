import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  standalone: true,
  template: ''
})
export class DummyRedirectComponent implements OnInit {

  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit(): void {
    const usuario = this.authService.usuarioActual();

    if (!usuario) {
      this.router.navigateByUrl('/login');
      return;
    }

    const rol = usuario.rol?.toUpperCase();

    // 👇 lógica que pediste
    if (rol === 'ADMINISTRADOR') {
      this.router.navigateByUrl('/');
    } else {
      this.router.navigateByUrl('/alumnos');
    }
  }
}
