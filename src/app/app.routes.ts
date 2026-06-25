import { Routes } from '@angular/router';
import { AdminLayout } from './layout/admin-layout/admin-layout';
import { authGuard, publicGuard } from './core/guards/auth.guard';
import { DummyRedirectComponent } from './core/components/dummy-redirect.component';
import { roleRedirectGuard } from './core/guards/role-redirect.guard';
import { LoginComponent } from './auth/login/login.component';

export const routes: Routes = [
  // 🚪 RUTA PÚBLICA CON CANDADO DE RETORNO:
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [publicGuard]
  },

  // 🛡️ EN TODOS: Contenedor protegido
{
  path: '',
  component: AdminLayout,
  canActivate: [authGuard],
  children: [

    // 🔥 ESTE ES EL CAMBIO CLAVE
    {
      path: '',
      canActivate: [roleRedirectGuard],
      component: DummyRedirectComponent
    },

      {
        path: 'cursos',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'maquinas',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'alumnos',
        loadComponent: () =>
          import('./features/alumnos/pages/alumnos-list/alumnos-list').then(m => m.AlumnosList)
      },
      {
        path: 'alumnos-retirados',
        loadComponent: () =>
          import('./features/alumnos/pages/alumnos-retirados/alumnos-retirados').then(m => m.AlumnosRetirados)
      },
      {
        path: 'matriculas',
        loadComponent: () =>
          import('./features/matriculas/pages/matriculas-list/matriculas-list').then(m => m.MatriculasList),
        data: { vista: 'MATRICULADO', titulo: 'Matrículas activas' }
      },
      {
        path: 'matriculas-retiradas',
        loadComponent: () =>
          import('./features/matriculas/pages/matriculas-list/matriculas-list').then(m => m.MatriculasList),
        data: { vista: 'RETIRADO', titulo: 'Matrículas retiradas' }
      },
      {
        path: 'matriculas-reserva',
        loadComponent: () =>
          import('./features/matriculas/pages/matriculas-list/matriculas-list').then(m => m.MatriculasList),
        data: { vista: 'RESERVA', titulo: 'Matrículas en reserva' }
      },
      {
        path: 'matriculas-egresadas',
        loadComponent: () =>
          import('./features/matriculas/pages/matriculas-list/matriculas-list').then(m => m.MatriculasList),
        data: { vista: 'EGRESADO', titulo: 'Matrículas egresadas' }
      },
      {
        path: 'matriculas/:id',
        loadComponent: () =>
          import('./features/matriculas/pages/matricula-detail/matricula-detail').then(m => m.MatriculaDetail)
      },
      {
        path: 'pagos',
        loadComponent: () =>
          import('./features/pagos/pages/pagos-list/pagos-list').then(m => m.PagosList)
      },
      {
        path: 'practicas',
        loadComponent: () =>
          import('./features/practicas/pages/practicas-list/practicas-list').then(m => m.PracticasListComponent)
      },
      {
        path: 'certificacion',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'homologaciones',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'ept',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'configuracion',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard').then(m => m.Dashboard)
      }
    ]
  },

  // 🔄 COMODÍN / REDIRECCIÓN:
  {
    path: '**',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
