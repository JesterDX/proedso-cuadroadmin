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
        path: 'admin/tipos-curso',
        loadComponent: () =>
          import('./admin/tipos-curso/pages/tipos-curso/tipos-curso')
            .then(m => m.TiposCursoComponent)
      },
      
      {
        path: 'admin/planes-curso',
        loadComponent: () =>
          import('./admin/planes-curso/pages/planes-curso/planes-curso')
            .then(m => m.PlanesCursoComponent)
      },
      {
        path: 'admin/maquinas',
        loadComponent: () =>
          import('./admin/maquinas/pages/maquinas/maquinas')
            .then(m => m.MaquinasComponent)
      },
      {
        path: 'admin/planes-curso/nuevo',
        loadComponent: () =>
          import('./admin/planes-curso/pages/configurar-plan/configurar-plan')
            .then(m => m.ConfigurarPlanComponent)
      },
      {
        path: 'admin/planes-curso/configurar/:id',
        loadComponent: () =>
          import('./admin/planes-curso/pages/configurar-plan/configurar-plan')
            .then(m => m.ConfigurarPlanComponent)
      },

   // Las agregaremos cuando existan
      /*
      
      {
        path: 'admin/usuarios',
        loadComponent: () =>
          import('./admin/usuarios/pages/usuarios/usuarios')
            .then(m => m.UsuariosComponent)
      },
      */

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
          import('./features/practicas/pages/practicas-home/practicas-home')
            .then(m => m.PracticasHomeComponent)
      },
      
      {
        path: 'practicas/nueva-sesion',
        loadComponent: () =>
          import('./features/practicas/pages/practicas-list/practicas-list')
            .then(m => m.PracticasListComponent)
      },
      
      {
        path: 'practicas/historial',
        loadComponent: () =>
          import('./features/practicas/pages/historial-practicas/historial-practicas')
            .then(m => m.HistorialPracticasComponent)
      },
      
      {
        path: 'practicas/expedientes',
        loadComponent: () =>
          import('./features/practicas/pages/expedientes/expedientes')
            .then(m => m.ExpedientesComponent)
      },
      {
        path:'practicas/:id',
      
        loadComponent:()=>
      
          import('./features/practicas/pages/practica-detalle/practica-detalle')
      
            .then(m=>m.PracticaDetalle)
      
      },

      {
        path:'practicas/cronograma/:id',
      
        loadComponent:()=>
      
          import('./features/practicas/pages/cronograma-practicas/cronograma-practicas')
      
            .then(m=>m.CronogramaPracticasComponent)
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
