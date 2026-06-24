import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';

// Candado 1: Protege rutas internas
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true; 
  }

  router.navigate(['/login']);
  return false;
};

// Candado 2: Evita regresar al login (¡Corregido!)
export const publicGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService); // 🧠 Cambiado de 'Inject' a 'AuthService'
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    router.navigate(['/']); 
    return false;
  }

  return true;
};