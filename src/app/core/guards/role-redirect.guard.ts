
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';

export const roleRedirectGuard: CanActivateFn = () => {

  const authService = inject(AuthService);
  const router = inject(Router);

  const usuario = authService.usuarioActual();
  const rol = usuario?.rol?.toUpperCase();

  if (rol === 'ADMINISTRADOR') {
    router.navigate(['/']);
  } else {
    router.navigate(['/alumnos']);
  }

  return false;
};
