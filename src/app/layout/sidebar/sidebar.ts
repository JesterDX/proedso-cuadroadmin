import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';

import {
  LayoutDashboard,
  GraduationCap,
  Users,
  CreditCard,
  CalendarDays,
  Award,
  Settings,
  ChevronDown,
  ChevronRight,
  LucideAngularModule,
  Tractor,
  BookOpen,
  UserRoundX,
  ClipboardList,
  CircleDollarSign,
  FileBadge2
} from 'lucide-angular';

interface MenuItem {
  label: string;
  route?: string;
  icon?: any;
  children?: MenuItem[];
  expanded?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar {

  private authService = inject(AuthService);

  readonly icons = {
    dashboard: LayoutDashboard,
    academic: GraduationCap,
    alumnos: Users,
    pagos: CreditCard,
    practicas: CalendarDays,
    certificacion: Award,
    configuracion: Settings,
    equipos: Tractor,
    chevronDown: ChevronDown,
    chevronRight: ChevronRight,
    cursos: BookOpen,
    retirados: UserRoundX,
    matriculas: ClipboardList,
    finanzas: CircleDollarSign,
    homologacion: FileBadge2
  };

  esAdministrador = false;

  menu: MenuItem[] = [];

  constructor() {
    const usuario = this.authService.usuarioActual();

    this.esAdministrador =
      usuario?.rol?.toUpperCase() === 'ADMINISTRADOR';

    if (this.esAdministrador) {
      this.menu = [
        {
          label: 'Dashboard',
          route: '/',
          icon: this.icons.dashboard
        },
        {
          label: 'Tipos de Curso',
          route: '/admin/tipos-curso',
          icon: this.icons.cursos
        },
        {
          label: 'Planes de Curso',
          route: '/admin/planes-curso',
          icon: this.icons.cursos
        },
        {
          label: 'Máquinas',
          route: '/admin/maquinas',
          icon: this.icons.equipos
        }
      ];
    }else {
      this.menu = [
        {
          label: 'Gestión Académica',
          icon: this.icons.academic,
          expanded: true,
          children: [

            { label: 'Prácticas', route: '/practicas' }
          ]
        },
        {
          label: 'Gestión de Alumnos',
          icon: this.icons.alumnos,
          expanded: true,
          children: [
            { label: 'Alumnos activos', route: '/alumnos' },
            { label: 'Alumnos retirados', route: '/alumnos-retirados' }
          ]
        },
        {
          label: 'Matrículas',
          icon: this.icons.matriculas,
          expanded: true,
          children: [
            { label: 'Matrículas activas', route: '/matriculas' },
            { label: 'Matrículas retiradas', route: '/matriculas-retiradas' },
            { label: 'Matrículas egresadas', route: '/matriculas-egresadas' },
            { label: 'Matrículas en reserva', route: '/matriculas-reserva' }
          ]
        },
        {
          label: 'Finanzas',
          icon: this.icons.finanzas,
          expanded: true,
          children: [
            { label: 'Pagos', route: '/pagos' }
          ]
        },
      ];
    }
  }

  toggleGroup(item: MenuItem): void {
    if (!item.children) return;
    item.expanded = !item.expanded;
  }

  isGroupActive(item: MenuItem): boolean {
    if (!item.children?.length) return false;

    return item.children.some(
      child => !!child.route && this.isRouteActive(child.route)
    );
  }

  private isRouteActive(route: string): boolean {
    return typeof window !== 'undefined'
      ? window.location.pathname === route ||
          window.location.pathname.startsWith(route + '/')
      : false;
  }
}
