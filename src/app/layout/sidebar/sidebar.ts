import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
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

  menu: MenuItem[] = [
    {
      label: 'Dashboard',
      route: '/',
      icon: this.icons.dashboard
    },
    {
      label: 'Gestión Académica',
      icon: this.icons.academic,
      expanded: true,
      children: [
        { label: 'Cursos', route: '/cursos' },
        { label: 'Máquinas', route: '/maquinas' },
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
        { label: 'Pagos', route: '/pagos' },
      ]
    },
    {
      label: 'Certificaciones',
      icon: this.icons.certificacion,
      expanded: false,
      children: [
        { label: 'Certificación', route: '/certificacion' },
        { label: 'Homologaciones', route: '/homologaciones' },
        { label: 'EPT', route: '/ept' }
      ]
    },
    {
      label: 'Configuración',
      route: '/configuracion',
      icon: this.icons.configuracion
    }
  ];

  toggleGroup(item: MenuItem): void {
    if (!item.children) return;
    item.expanded = !item.expanded;
  }

  isGroupActive(item: MenuItem): boolean {
    if (!item.children?.length) return false;
    return item.children.some(child => !!child.route && this.isRouteActive(child.route));
  }

  private isRouteActive(route: string): boolean {
    return typeof window !== 'undefined'
      ? window.location.pathname === route || window.location.pathname.startsWith(route + '/')
      : false;
  }
}