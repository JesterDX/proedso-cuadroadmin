import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { finalize } from 'rxjs/operators';

import { ApiResponse } from '../../../../core/models/api-response.model';
import { Alumno } from '../../models/alumno.model';
import { AlumnosService } from '../../services/alumnos.service';

@Component({
  selector: 'app-alumnos-retirados',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alumnos-retirados.html',
  styleUrl: './alumnos-retirados.scss'
})
export class AlumnosRetirados implements OnInit {
  private alumnosService = inject(AlumnosService);
  private cd = inject(ChangeDetectorRef);
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  alumnos: Alumno[] = [];
  loading = false;
  cargado = false;
  search = '';
  errorMsg = '';

  viewModalOpen = false;
  alumnoSeleccionado: Alumno | null = null;

  actualPagina = 1;
  itemsPorPagina = 8;

  filtroAnio: number | null = null;
  filtroMes = '';

  readonly meses = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ];

  aniosDisponibles: number[] = [];

  ngOnInit(): void {
    this.generarAnios();
    this.cargarAlumnosRetirados();
  }

  generarAnios(): void {
    const actual = new Date().getFullYear();
    const inicio = actual - 10;
    const fin = actual + 1;

    this.aniosDisponibles = [];
    for (let anio = fin; anio >= inicio; anio--) {
      this.aniosDisponibles.push(anio);
    }
  }

  onSearchChange(): void {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.actualPagina = 1;
      this.cargarAlumnosRetirados();
    }, 220);
  }

  onFiltrosChange(): void {
    this.actualPagina = 1;
    this.cargarAlumnosRetirados();
  }

  limpiarFiltros(): void {
    this.search = '';
    this.filtroAnio = null;
    this.filtroMes = '';
    this.actualPagina = 1;
    this.cargarAlumnosRetirados();
  }

  buscar(): void {
    this.actualPagina = 1;
    this.cargarAlumnosRetirados();
  }

  cargarAlumnosRetirados(): void {
    this.loading = true;
    this.errorMsg = '';
    this.cd.detectChanges();

    this.alumnosService
      .listar(this.search?.trim() || '', false, this.filtroAnio, this.filtroMes)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cargado = true;
          this.cd.detectChanges();
        })
      )
      .subscribe({
        next: (resp: ApiResponse<Alumno[]>) => {
          this.alumnos = [...(resp.data ?? [])];
          this.ajustarPaginaActual();
          this.cd.detectChanges();
        },
        error: (err: any) => {
          console.error('Error al cargar alumnos retirados:', err);
          this.alumnos = [];
          this.errorMsg = 'No se pudo cargar la lista de alumnos retirados.';
          this.cd.detectChanges();
        }
      });
  }

  private ajustarPaginaActual(): void {
    if (this.actualPagina > this.totalPaginas) this.actualPagina = this.totalPaginas;
    if (this.actualPagina < 1) this.actualPagina = 1;
  }

  verAlumno(alumno: Alumno): void {
    this.alumnoSeleccionado = alumno;
    this.viewModalOpen = true;
    this.cd.detectChanges();
  }

  cerrarVistaAlumno(): void {
    this.viewModalOpen = false;
    this.alumnoSeleccionado = null;
    this.cd.detectChanges();
  }

  reactivarAlumno(alumno: Alumno): void {
    Swal.fire({
      icon: 'question',
      title: '¿Activar alumno?',
      text: `Se reactivará a ${alumno.nombres} ${alumno.apellidos}.`,
      showCancelButton: true,
      confirmButtonText: 'Sí, activar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#1f5db4'
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.alumnosService.reactivar(alumno.id).subscribe({
        next: (resp: ApiResponse<Alumno>) => {
          Swal.fire({
            icon: 'success',
            title: 'Alumno activado',
            text: resp.message || 'El alumno fue reactivado correctamente.'
          });

          this.cerrarVistaAlumno();
          this.cargarAlumnosRetirados();
        },
        error: (err: any) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err?.error?.message || 'No se pudo activar al alumno.'
          });
        }
      });
    });
  }

  irAPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.actualPagina = pagina;
  }

  get totalRegistros(): number {
    return this.alumnos.length;
  }

  get totalPaginas(): number {
    return Math.ceil(this.totalRegistros / this.itemsPorPagina) || 1;
  }

  get alumnosPaginados(): Alumno[] {
    const inicio = (this.actualPagina - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.alumnos.slice(inicio, fin);
  }

  get inicioRegistro(): number {
    if (this.totalRegistros === 0) return 0;
    return (this.actualPagina - 1) * this.itemsPorPagina + 1;
  }

  get finRegistro(): number {
    return Math.min(this.actualPagina * this.itemsPorPagina, this.totalRegistros);
  }

  get paginasVisibles(): number[] {
    const total = this.totalPaginas;
    const actual = this.actualPagina;
    const rango = 2;

    let inicio = Math.max(1, actual - rango);
    let fin = Math.min(total, actual + rango);

    if (actual <= 3) fin = Math.min(total, 5);
    if (actual >= total - 2) inicio = Math.max(1, total - 4);

    const paginas: number[] = [];
    for (let i = inicio; i <= fin; i++) paginas.push(i);
    return paginas;
  }

  trackByAlumnoId(index: number, alumno: Alumno): string | number {
    return alumno.id;
  }

  getFotoUrl(foto_url?: string | null): string {
    return foto_url || '';
  }

  getIniciales(nombres: string, apellidos: string): string {
    const n = nombres?.trim()?.charAt(0) || '';
    const a = apellidos?.trim()?.charAt(0) || '';
    return `${n}${a}`.toUpperCase();
  }

  getSeguroLabel(valor?: string | null): string {
    if (!valor) return 'No especificado';

    const normalizado = valor.trim().toUpperCase();

    switch (normalizado) {
      case 'SIS': return 'SIS';
      case 'ESSALUD': return 'EsSalud';
      case 'PARTICULAR': return 'Particular';
      case 'NO CUENTO':
      case 'NO TENGO': return 'No cuenta';
      case 'N.A.':
      case 'NA': return 'N.A.';
      default: return valor;
    }
  }

  getSeguroClass(valor?: string | null): string {
    if (!valor) return 'status-chip status-chip--neutral';

    const normalizado = valor.trim().toUpperCase();

    switch (normalizado) {
      case 'SIS': return 'status-chip status-chip--sis';
      case 'ESSALUD': return 'status-chip status-chip--essalud';
      case 'PARTICULAR': return 'status-chip status-chip--particular';
      case 'NO CUENTO':
      case 'NO TENGO': return 'status-chip status-chip--sin-seguro';
      case 'N.A.':
      case 'NA': return 'status-chip status-chip--neutral';
      default: return 'status-chip status-chip--neutral';
    }
  }

  getIngresoLabel(alumno: Alumno): string {
    const mes = alumno.mes_ingreso || '-';
    const anio = alumno.anio_ingreso || '-';
    return `${mes} ${anio}`.trim();
  }

  getEstadoLabel(activo: boolean): string {
    return activo ? 'Activo' : 'Retirado';
  }

  getEstadoClass(activo: boolean): string {
    return activo
      ? 'status-chip status-chip--activo'
      : 'status-chip status-chip--retirado';
  }
}