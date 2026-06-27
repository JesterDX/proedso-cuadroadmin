import { Routes } from '@angular/router';

import { AdminLayout } from './layout/admin-layout/admin-layout';
import { LoginComponent } from './auth/login/login.component';
import { DummyRedirectComponent } from './core/components/dummy-redirect.component';

import { authGuard, publicGuard } from './core/guards/auth.guard';
import { roleRedirectGuard } from './core/guards/role-redirect.guard';

export const routes: Routes = [

  // =========================
  // 🚪 RUTAS PÚBLICAS
  // =========================
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [publicGuard]
  },

  // =========================
  // 🛡️ LAYOUT PROTEGIDO
  // =========================
  {
    path: '',
    component: AdminLayout,
    canActivate: [authGuard],
    children: [

      // 🔥 REDIRECCIÓN POR ROL
      {
        path: '',
        component: DummyRedirectComponent
      },

      // =========================
      // 📊 DASHBOARD / PRINCIPAL
      // =========================
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard')
            .then(m => m.Dashboard)
      },

      {
        path: 'cursos',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard')
            .then(m => m.Dashboard)
      },

      {
        path: 'maquinas',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard')
            .then(m => m.Dashboard)
      },

      // =========================
      // 👨‍🎓 ALUMNOS
      // =========================
      {
        path: 'alumnos',
        loadComponent: () =>
          import('./features/alumnos/pages/alumnos-list/alumnos-list')
            .then(m => m.AlumnosList)
      },
      {
        path: 'alumnos-retirados',
        loadComponent: () =>
          import('./features/alumnos/pages/alumnos-retirados/alumnos-retirados')
            .then(m => m.AlumnosRetirados)
      },

      // =========================
      // 🎓 MATRÍCULAS
      // =========================
      {
        path: 'matriculas',
        loadComponent: () =>
          import('./features/matriculas/pages/matriculas-list/matriculas-list')
            .then(m => m.MatriculasList),
        data: { vista: 'MATRICULADO', titulo: 'Matrículas activas' }
      },
      {
        path: 'matriculas-retiradas',
        loadComponent: () =>
          import('./features/matriculas/pages/matriculas-list/matriculas-list')
            .then(m => m.MatriculasList),
        data: { vista: 'RETIRADO', titulo: 'Matrículas retiradas' }
      },
      {
        path: 'matriculas-reserva',
        loadComponent: () =>
          import('./features/matriculas/pages/matriculas-list/matriculas-list')
            .then(m => m.MatriculasList),
        data: { vista: 'RESERVA', titulo: 'Matrículas en reserva' }
      },
      {
        path: 'matriculas-egresadas',
        loadComponent: () =>
          import('./features/matriculas/pages/matriculas-list/matriculas-list')
            .then(m => m.MatriculasList),
        data: { vista: 'EGRESADO', titulo: 'Matrículas egresadas' }
      },
      {
        path: 'matriculas/:id',
        loadComponent: () =>
          import('./features/matriculas/pages/matricula-detail/matricula-detail')
            .then(m => m.MatriculaDetail)
      },

      // =========================
      // 💰 PAGOS
      // =========================
      {
        path: 'pagos',
        loadComponent: () =>
          import('./features/pagos/pages/pagos-list/pagos-list')
            .then(m => m.PagosList)
      },

      // =========================
      // 🚜 PRÁCTICAS
      // =========================
      {
        path: 'practicas',
        loadComponent: () =>
          import('./features/practicas/pages/practicas-list/practicas-list')
            .then(m => m.PracticasListComponent)
      },

      // =========================
      // 📄 OTROS MÓDULOS (PLACEHOLDER)
      // =========================
      {
        path: 'certificacion',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard')
            .then(m => m.Dashboard)
      },
      {
        path: 'homologaciones',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard')
            .then(m => m.Dashboard)
      },
      {
        path: 'ept',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard')
            .then(m => m.Dashboard)
      },
      {
        path: 'configuracion',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard')
            .then(m => m.Dashboard)
      }
    ]
  },

  // =========================
  // 🔄 FALLBACK
  // =========================
  {
    path: '**',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
