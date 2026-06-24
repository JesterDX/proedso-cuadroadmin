// import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';

// import { MatriculasService } from '../../services/matriculas.service';
// import { AlumnosService } from '../../../alumnos/services/alumnos.service';
// import { PlanesCursoService } from '../../services/planes-curso.service';

// @Component({
//   selector: 'app-matriculas-reserva',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   templateUrl: './matriculas-reserva.html',
//   styleUrl: './matriculas-reserva.scss'
// })
// export class MatriculasReserva implements OnInit {
//   private matriculasService = inject(MatriculasService);
//   private alumnosService = inject(AlumnosService);
//   private planesCursoService = inject(PlanesCursoService);
//   private cd = inject(ChangeDetectorRef);

//   matriculas: any[] = [];
//   alumnos: any[] = [];
//   planesCurso: any[] = [];

//   loading = false;
//   errorMsg = '';

//   actualPagina = 1;
//   itemsPorPagina = 8;

//   ngOnInit(): void {
//     this.cargarTodo();
//   }

//   async cargarTodo(): Promise<void> {
//     this.loading = true;
//     this.errorMsg = '';
//     this.cd.detectChanges();

//     try {
//       const [matriculasResp, alumnosResp, planesResp] = await Promise.all([
//         this.matriculasService.listar('RESERVA').toPromise(),
//         this.alumnosService.listar('', true).toPromise(),
//         this.planesCursoService.listar().toPromise()
//       ]);

//       this.matriculas = matriculasResp?.data ?? [];
//       this.alumnos = alumnosResp?.data ?? [];
//       this.planesCurso = planesResp?.data ?? [];
//       this.ajustarPaginaActual();
//     } catch (error) {
//       console.error('Error al cargar matrículas en reserva:', error);
//       this.errorMsg = 'No se pudo cargar la lista de matrículas en reserva.';
//     } finally {
//       this.loading = false;
//       this.cd.detectChanges();
//     }
//   }

//   trackByMatriculaId(index: number, matricula: any): number {
//     return matricula.id;
//   }

//   getNombreAlumno(alumnoId: number): string {
//     const alumno = this.alumnos.find(a => a.id === alumnoId);
//     return alumno ? `${alumno.nombres} ${alumno.apellidos}` : 'Alumno no encontrado';
//   }

//   getNombrePlan(planId: number): string {
//     const plan = this.planesCurso.find((p: any) => p.id === planId);
//     return plan?.nombre || 'Plan no encontrado';
//   }

//   formatFechaVista(fecha?: string | null): string {
//     if (!fecha) return '-';
//     const f = new Date(fecha);
//     if (Number.isNaN(f.getTime())) return '-';
//     return f.toLocaleDateString('es-PE');
//   }

//   private ajustarPaginaActual(): void {
//     if (this.actualPagina > this.totalPaginas) {
//       this.actualPagina = this.totalPaginas;
//     }

//     if (this.actualPagina < 1) {
//       this.actualPagina = 1;
//     }
//   }

//   irAPagina(pagina: number): void {
//     if (pagina < 1 || pagina > this.totalPaginas) return;
//     this.actualPagina = pagina;
//   }

//   get totalRegistros(): number {
//     return this.matriculas.length;
//   }

//   get totalPaginas(): number {
//     return Math.ceil(this.totalRegistros / this.itemsPorPagina) || 1;
//   }

//   get matriculasPaginadas(): any[] {
//     const inicio = (this.actualPagina - 1) * this.itemsPorPagina;
//     return this.matriculas.slice(inicio, inicio + this.itemsPorPagina);
//   }

//   get inicioRegistro(): number {
//     if (this.totalRegistros === 0) return 0;
//     return (this.actualPagina - 1) * this.itemsPorPagina + 1;
//   }

//   get finRegistro(): number {
//     return Math.min(this.actualPagina * this.itemsPorPagina, this.totalRegistros);
//   }

//   get paginasVisibles(): number[] {
//     const total = this.totalPaginas;
//     const actual = this.actualPagina;
//     const rango = 2;

//     let inicio = Math.max(1, actual - rango);
//     let fin = Math.min(total, actual + rango);

//     if (actual <= 3) {
//       fin = Math.min(total, 5);
//     }

//     if (actual >= total - 2) {
//       inicio = Math.max(1, total - 4);
//     }

//     const paginas: number[] = [];
//     for (let i = inicio; i <= fin; i++) {
//       paginas.push(i);
//     }

//     return paginas;
//   }
// }