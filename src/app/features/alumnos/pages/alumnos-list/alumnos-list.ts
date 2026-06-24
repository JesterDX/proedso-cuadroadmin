import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { finalize } from 'rxjs/operators';

import { ApiResponse } from '../../../../core/models/api-response.model';
import { Alumno, AlumnoPayload } from '../../models/alumno.model';
import { AlumnosService } from '../../services/alumnos.service';

@Component({
  selector: 'app-alumnos-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alumnos-list.html',
  styleUrl: './alumnos-list.scss'
})
export class AlumnosList implements OnInit {
  private alumnosService = inject(AlumnosService);
  private cd = inject(ChangeDetectorRef);
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  alumnos: Alumno[] = [];
  loading = false;
  search = '';
  errorMsg = '';
  cargado = false;

  viewModalOpen = false;
  alumnoSeleccionado: Alumno | null = null;

  modalOpen = false;
  saving = false;

  actualPagina = 1;
  itemsPorPagina = 8;

  modoModal: 'crear' | 'editar' = 'crear';
  alumnoEditandoId: number | null = null;

  selectedFile: File | null = null;
  previewUrl: string | null = null;
  dragOver = false;

  filtroAnio: number | null = null;
  filtroMes = '';

  readonly meses = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ];

  readonly opcionesSeguro = ['SIS', 'ESSALUD', 'PARTICULAR', 'N.A.'];

  aniosDisponibles: number[] = [];

  form: AlumnoPayload = this.getEmptyForm();

  ngOnInit(): void {
    this.generarAnios();
    this.cargarAlumnos();
  }

  getEmptyForm(): AlumnoPayload {
    return {
      dni: '',
      nombres: '',
      apellidos: '',
      fecha_nacimiento: null,
      telefono: '',
      correo: '',
      direccion: '',
      observaciones: '',
      seguro_alumno: '',
      anio_ingreso: new Date().getFullYear(),
      mes_ingreso: this.meses[new Date().getMonth()]
    };
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

  trackByAlumnoId(index: number, alumno: Alumno): string | number {
    return alumno.id;
  }

  onSearchChange(): void {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.actualPagina = 1;
      this.cargarAlumnos();
    }, 220);
  }

  onFiltrosChange(): void {
    this.actualPagina = 1;
    this.cargarAlumnos();
  }

  limpiarFiltros(): void {
    this.search = '';
    this.filtroAnio = null;
    this.filtroMes = '';
    this.actualPagina = 1;
    this.cargarAlumnos();
  }

  private ajustarPaginaActual(): void {
    if (this.actualPagina > this.totalPaginas) this.actualPagina = this.totalPaginas;
    if (this.actualPagina < 1) this.actualPagina = 1;
  }

  cargarAlumnos(): void {
    this.loading = true;
    this.errorMsg = '';
    this.cd.detectChanges();

    this.alumnosService
      .listar(this.search?.trim() || '', true, this.filtroAnio, this.filtroMes)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cargado = true;
          this.cd.detectChanges();
        })
      )
      .subscribe({
        next: (resp) => {
          this.alumnos = [...(resp.data ?? [])];
          this.ajustarPaginaActual();
          this.cd.detectChanges();
        },
        error: (err: any) => {
          console.error('Error al cargar alumnos:', err);
          this.alumnos = [];
          this.errorMsg = 'No se pudo conectar con el servidor de alumnos.';
          this.cd.detectChanges();
        }
      });
  }

  buscar(): void {
    this.actualPagina = 1;
    this.cargarAlumnos();
  }

  abrirModalCrear(): void {
    this.modoModal = 'crear';
    this.alumnoEditandoId = null;
    this.form = this.getEmptyForm();
    this.selectedFile = null;
    this.previewUrl = null;
    this.dragOver = false;
    this.modalOpen = true;
    this.cd.detectChanges();
  }

  abrirModalEditar(alumno: Alumno): void {
    this.modoModal = 'editar';
    this.alumnoEditandoId = alumno.id;

    this.form = {
      dni: alumno.dni,
      nombres: alumno.nombres,
      apellidos: alumno.apellidos,
      fecha_nacimiento: alumno.fecha_nacimiento || null,
      telefono: alumno.telefono || '',
      correo: alumno.correo || '',
      direccion: alumno.direccion || '',
      observaciones: alumno.observaciones || '',
      seguro_alumno: alumno.seguro_alumno || '',
      anio_ingreso: alumno.anio_ingreso ?? null,
      mes_ingreso: alumno.mes_ingreso || ''
    };

    this.selectedFile = null;
    this.previewUrl = alumno.foto_url ? this.getFotoUrl(alumno.foto_url) : null;
    this.dragOver = false;
    this.modalOpen = true;
    this.cd.detectChanges();
  }

  cerrarModal(): void {
    if (this.saving) return;
    this.modalOpen = false;
    this.cd.detectChanges();
  }

  validarFormulario(): string[] {
    const errores: string[] = [];

    if (!this.form.dni?.trim()) errores.push('El DNI es obligatorio.');
    if (!this.form.nombres?.trim()) errores.push('Los nombres son obligatorios.');
    if (!this.form.apellidos?.trim()) errores.push('Los apellidos son obligatorios.');
    if (!this.form.anio_ingreso) errores.push('El año de ingreso es obligatorio.');
    if (!this.form.mes_ingreso?.trim()) errores.push('El mes de ingreso es obligatorio.');

    return errores;
  }

  verAlumno(alumno: Alumno): void {
    this.alumnoSeleccionado = alumno;
    this.viewModalOpen = true;
  }

  cerrarVistaAlumno(): void {
    this.viewModalOpen = false;
    this.alumnoSeleccionado = null;
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

  retirarAlumno(alumno: Alumno): void {
    Swal.fire({
      icon: 'warning',
      title: '¿Retirar alumno?',
      text: `Se marcará como inactivo a ${alumno.nombres} ${alumno.apellidos}.`,
      showCancelButton: true,
      confirmButtonText: 'Sí, retirar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626'
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.alumnosService.eliminar(alumno.id).subscribe({
        next: (resp: ApiResponse<{ id: number; activo: boolean }>) => {
          Swal.fire({
            icon: 'success',
            title: 'Alumno retirado',
            text: resp.message || 'El alumno fue marcado como inactivo.',
            confirmButtonText: 'Aceptar'
          });

          this.cargarAlumnos();
        },
        error: (err: any) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err?.error?.message || 'No se pudo retirar al alumno.',
            confirmButtonText: 'Aceptar'
          });
        }
      });
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.setFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
    const file = event.dataTransfer?.files?.[0] ?? null;
    this.setFile(file);
  }

  setFile(file: File | null): void {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

    if (!allowedTypes.includes(file.type)) {
      Swal.fire({
        icon: 'warning',
        title: 'Archivo no válido',
        text: 'Solo se permiten imágenes JPG, PNG o WEBP.'
      });
      return;
    }

    this.selectedFile = file;
    this.previewUrl = URL.createObjectURL(file);
    this.cd.detectChanges();
  }

  quitarFoto(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.cd.detectChanges();
  }

  guardarAlumno(): void {
    const errores = this.validarFormulario();

    if (errores.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Faltan datos',
        html: errores.map(e => `• ${e}`).join('<br>'),
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const formData = new FormData();
    formData.append('dni', this.form.dni.trim());
    formData.append('nombres', this.form.nombres.trim());
    formData.append('apellidos', this.form.apellidos.trim());

    if (this.form.fecha_nacimiento) formData.append('fecha_nacimiento', this.form.fecha_nacimiento);
    if (this.form.telefono) formData.append('telefono', this.form.telefono.trim());
    if (this.form.correo) formData.append('correo', this.form.correo.trim());
    if (this.form.direccion) formData.append('direccion', this.form.direccion.trim());
    if (this.form.observaciones) formData.append('observaciones', this.form.observaciones.trim());
    if (this.form.seguro_alumno) formData.append('seguro_alumno', this.form.seguro_alumno.trim());

    formData.append('anio_ingreso', String(this.form.anio_ingreso));
    formData.append('mes_ingreso', this.form.mes_ingreso || '');

    if (this.selectedFile) formData.append('foto', this.selectedFile);

    this.saving = true;
    this.cd.detectChanges();

    const request$ =
      this.modoModal === 'crear'
        ? this.alumnosService.crear(formData)
        : this.alumnosService.actualizarConFoto(this.alumnoEditandoId!, formData);

    request$.subscribe({
      next: (resp: any) => {
        this.saving = false;
        this.modalOpen = false;
        this.cd.detectChanges();

        Swal.fire({
          icon: 'success',
          title: this.modoModal === 'crear' ? 'Alumno creado' : 'Alumno actualizado',
          text: resp.message || 'Operación realizada correctamente.',
          confirmButtonText: 'Aceptar'
        });

        this.cargarAlumnos();
      },
      error: (err: any) => {
        this.saving = false;
        this.cd.detectChanges();

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err?.error?.message || 'No se pudo guardar la información del alumno.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

getFotoUrl(foto_url?: string | null): string {
  if (!foto_url) return '';

  // 1. Si ya es una URL limpia de internet (Cloudinary), devuélvela intacta
  if (foto_url.startsWith('http://') || foto_url.startsWith('https://')) {
    return foto_url;
  }

  // 2. Si el backend guardó el path con el prefijo duplicado o local de Cloudinary
  //    Ejemplo: /uploads/alumnos/proedso/alumnos/... o proedso/alumnos/...
  if (foto_url.includes('proedso/alumnos/')) {
    // Extraemos solo la parte limpia de Cloudinary (proedso/alumnos/nombre_archivo)
    const index = foto_url.indexOf('proedso/alumnos/');
    const pathLimpio = foto_url.substring(index);
    
    // ⚠️ IMPORTANTE: Pon aquí tu Cloud Name real de Cloudinary en lugar de 'tu_cloud_name'
    return `https://res.cloudinary.com/dfx6p5sjd/image/upload/${pathLimpio}`;
  }

  // 3. Para los alumnos antiguos del servidor local (que no tienen "proedso/" en su ruta)
  //    Si ya trae "/uploads/alumnos/", lo dejamos pasar; si no, se lo agregamos.
  if (foto_url.startsWith('/uploads/')) {
    return foto_url;
  }
  
  return `/uploads/alumnos/${foto_url}`;
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
