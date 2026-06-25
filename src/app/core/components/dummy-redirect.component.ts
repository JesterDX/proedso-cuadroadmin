import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  standalone: true,
  template: ''
})
export class DummyRedirectComponent implements OnInit {

  private authService = inject(AuthService);
  private router = inject(Router);

ngOnInit(): void {
  const user = this.authService.usuarioActual();
  const rol = user?.rol?.toUpperCase();

  if (rol === 'ADMINISTRADOR') {
    this.router.navigateByUrl('/dashboard'); // ✅ NO '/'
  } else {
    this.router.navigateByUrl('/alumnos'); // asesor
  }
}
}
