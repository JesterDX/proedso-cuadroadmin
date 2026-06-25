import { Routes } from '@angular/router';

import { AdminLayout } from './layout/admin-layout/admin-layout';
import { authGuard, publicGuard } from './core/guards/auth.guard';
import { LoginComponent } from './auth/login/login.component';

export const routes: Routes = [

  // 🔓 RUTA PÚBLICA
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [publicGuard]
  },

  // 🔐 RUTAS PROTEGIDAS
  {
    path: '',
    component: AdminLayout,
    canActivate: [authGuard],
    children: [

      // 📊 DASHBOARD (CORREGIDO)
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard.component')
            .then(m => m.DashboardComponent)
      },

      {
        path: 'cursos',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard.component')
            .then(m => m.DashboardComponent)
      },

      {
        path: 'maquinas',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard.component')
            .then(m => m.DashboardComponent)
      },

      // 👨‍🎓 ALUMNOS
      {
        path: 'alumnos',
        loadComponent: () =>
          import('./features/alumnos/pages/alumnos-list/alumnos-list.component')
            .then(m => m.AlumnosListComponent)
      },

      {
        path: 'alumnos-retirados',
        loadComponent: () =>
          import('./features/alumnos/pages/alumnos-retirados/alumnos-retirados.component')
            .then(m => m.AlumnosRetiradosComponent)
      },

      // 🎓 MATRÍCULAS
      {
        path: 'matriculas',
        loadComponent: () =>
          import('./features/matriculas/pages/matriculas-list/matriculas-list.component')
            .then(m => m.MatriculasListComponent),
        data: { vista: 'MATRICULADO', titulo: 'Matrículas activas' }
      },

      {
        path: 'matriculas-retiradas',
        loadComponent: () =>
          import('./features/matriculas/pages/matriculas-list/matriculas-list.component')
            .then(m => m.MatriculasListComponent),
        data: { vista: 'RETIRADO', titulo: 'Matrículas retiradas' }
      },

      {
        path: 'matriculas-reserva',
        loadComponent: () =>
          import('./features/matriculas/pages/matriculas-list/matriculas-list.component')
            .then(m => m.MatriculasListComponent),
        data: { vista: 'RESERVA', titulo: 'Matrículas en reserva' }
      },

      {
        path: 'matriculas-egresadas',
        loadComponent: () =>
          import('./features/matriculas/pages/matriculas-list/matriculas-list.component')
            .then(m => m.MatriculasListComponent),
        data: { vista: 'EGRESADO', titulo: 'Matrículas egresadas' }
      },

      {
        path: 'matriculas/:id',
        loadComponent: () =>
          import('./features/matriculas/pages/matricula-detail/matricula-detail.component')
            .then(m => m.MatriculaDetailComponent)
      },

      // 💰 PAGOS
      {
        path: 'pagos',
        loadComponent: () =>
          import('./features/pagos/pages/pagos-list/pagos-list.component')
            .then(m => m.PagosListComponent)
      },

      // 🧪 PRÁCTICAS
      {
        path: 'practicas',
        loadComponent: () =>
          import('./features/practicas/pages/practicas-list/practicas-list.component')
            .then(m => m.PracticasListComponent)
      },

      // 📌 OTROS (TODOS APUNTAN A DASHBOARD)
      {
        path: 'certificacion',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard.component')
            .then(m => m.DashboardComponent)
      },

      {
        path: 'homologaciones',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard.component')
            .then(m => m.DashboardComponent)
      },

      {
        path: 'ept',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard.component')
            .then(m => m.DashboardComponent)
      },

      {
        path: 'configuracion',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard.component')
            .then(m => m.DashboardComponent)
      }
    ]
  },

  // ❌ CUALQUIER RUTA
  {
    path: '**',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
