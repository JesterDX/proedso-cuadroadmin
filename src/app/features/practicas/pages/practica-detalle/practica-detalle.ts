import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { PracticasService } from '../../services/practicas.service';

@Component({
  selector: 'app-practica-detalle',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './practica-detalle.html',
  styleUrls: ['./practica-detalle.scss']
})
export class PracticaDetalle implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private practicasService = inject(PracticasService);
  private cd = inject(ChangeDetectorRef);

  Math = Math;

  // Estados de interfaz
  cargando = false;
  guardando = false;
  sesion: any = null;
  sesionBloqueada = false;

  // Búsqueda y Paginación
  filtroBusqueda: string = '';
  paginaActual: number = 1;
  itemsPorPagina: number = 6;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.cargarSesion(id);
    }
  }

  /**
   * Carga los datos iniciales de la sesión de práctica
   */
  cargarSesion(id: number): void {
    this.cargando = true;

    this.practicasService.obtenerSesion(id).subscribe({
      next: (resp) => {
        this.sesion = resp.data ?? resp;
        
        // Determina si la sesión ya fue completada para bloquear edición
        this.validarEstadoBloqueo();
                
        // Asignar valor por defecto si asistencia no viene definida
        if (this.sesion?.detalle) {
          this.sesion.detalle.forEach((item: any) => {
            if (!item.asistencia) item.asistencia = '';
          });
        }

        this.cargando = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando la sesión:', err);
        this.cargando = false;
        this.cd.detectChanges();
        
        Swal.fire({
          icon: 'error',
          title: 'Error de carga',
          text: 'No se pudo obtener la información de la práctica.',
          confirmButtonColor: '#0f172a'
        });
      }
    });
  }

  /**
   * Verifica el estado o las flags de la sesión para bloquear cambios
   */
  private validarEstadoBloqueo(): void {
    if (!this.sesion) return;
    this.sesionBloqueada = Boolean(
      this.sesion.guardado ||
      this.sesion.estado === 'FINALIZADA' ||
      this.sesion.estado === 'REGISTRADA' ||
      this.sesion.estado === 'COMPLETADA'
    );
  }

  // ==========================================
  // FILTRADO Y PAGINACIÓN COMPUTADA
  // ==========================================
  
  /** Lista filtrada por el buscador de alumnos */
  get detalleFiltrado(): any[] {
    if (!this.sesion?.detalle) return [];
    if (!this.filtroBusqueda.trim()) return this.sesion.detalle;

    const query = this.filtroBusqueda.toLowerCase().trim();
    return this.sesion.detalle.filter((item: any) =>
      item.alumno?.toLowerCase().includes(query) ||
      item.maquina?.toLowerCase().includes(query)
    );
  }

  /** Subconjunto de alumnos visibles en la página actual */
  get detallePaginado(): any[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.detalleFiltrado.slice(inicio, fin);
  }

  /** Cálculo total de páginas disponibles */
  get totalPaginas(): number {
    return Math.ceil(this.detalleFiltrado.length / this.itemsPorPagina) || 1;
  }

  /** Cambia de página reseteando la posición */
  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /** Al cambiar el término de búsqueda se reinicia a la página 1 */
  onBusquedaChange(): void {
    this.paginaActual = 1;
  }

  // ==========================================
  // MÉTRICAS / RESUMEN RÁPIDO
  // ==========================================
  get resumen() {
    if (!this.sesion?.detalle) return { total: 0, asistio: 0, falto: 0, justificado: 0, pendiente: 0 };
    
    const detalle = this.sesion.detalle;
    return {
      total: detalle.length,
      asistio: detalle.filter((i: any) => i.asistencia === 'ASISTIO').length,
      falto: detalle.filter((i: any) => i.asistencia === 'FALTO').length,
      justificado: detalle.filter((i: any) => i.asistencia === 'JUSTIFICADO').length,
      pendiente: detalle.filter((i: any) => !i.asistencia).length
    };
  }

  /**
   * Marca a todos los alumnos visibles o totales con un estado rápido
   */
  marcarTodos(estado: string): void {
    if (this.sesionBloqueada || !this.sesion?.detalle) return;

    Swal.fire({
      title: '¿Marcar a todos?',
      text: `Se asignará "${estado}" a todos los alumnos de la sesión.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, aplicar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0f172a'
    }).then((result) => {
      if (result.isConfirmed) {
        this.sesion.detalle.forEach((item: any) => {
          item.asistencia = estado;
        });
        this.cd.detectChanges();
      }
    });
  }

  // ==========================================
  // ARCHIVOS Y EVIDENCIAS
  // ==========================================
  
  /**
   * Procesa la imagen seleccionada y genera una preview local en tiempo real
   */
  seleccionarImagen(event: any, item: any): void {
    if (this.sesionBloqueada) return;

    const archivo = event.target.files?.[0];
    if (!archivo) return;

    // Validación de tipo de archivo
    if (!archivo.type.startsWith('image/')) {
      Swal.fire('Formato no válido', 'Por favor selecciona un archivo de imagen.', 'warning');
      return;
    }

    item.archivo = archivo;
    
    // Generar URL temporal local para visualizar inmediatamente la foto
    item.evidencia_url = URL.createObjectURL(archivo);
    this.cd.detectChanges();
  }

  /**
   * Elimina la foto seleccionada
   */
  quitarImagen(item: any): void {
    if (this.sesionBloqueada) return;
    item.archivo = null;
    item.evidencia_url = null;
  }

  // ==========================================
  // GUARDAR EN EL BACKEND
  // ==========================================
  
  guardarSesion(): void {
    if (!this.sesion || this.sesionBloqueada) return;

    Swal.fire({
      title: 'Guardando registro...',
      text: 'Subiendo evidencias fotográficas y actualizando asistencias',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.guardando = true;

    // Construcción de FormData para enviar imágenes y datos estructurados
    const formData = new FormData();
    formData.append('sesionId', this.sesion.id);

    // Mapeo limpio de los datos
    const detallesPayload = this.sesion.detalle.map((item: any) => ({
      detalleId: item.detalle_id || item.id,
      asistencia: item.asistencia || 'PENDIENTE',
      observaciones: item.observaciones || ''
    }));

    formData.append('detalles', JSON.stringify(detallesPayload));

    // Adjuntar archivos de imagen si existen
    this.sesion.detalle.forEach((item: any) => {
      if (item.archivo) {
        const idKey = item.detalle_id || item.id;
        formData.append(`evidencia_${idKey}`, item.archivo);
      }
    });

    // Envío al servicio
    this.practicasService.guardarSesion(this.sesion.id, formData).subscribe({
      next: (resp) => {
        this.guardando = false;

        // Actualizamos estado local y bloqueamos edición
        this.sesion.estado = 'FINALIZADA';
        this.sesion.guardado = true;
        this.validarEstadoBloqueo();

        this.cd.detectChanges();

        Swal.fire({
          icon: 'success',
          title: '¡Registro guardado!',
          text: 'La asistencia y evidencias se registraron correctamente. El formulario ahora está en modo de solo lectura.',
          confirmButtonColor: '#0f172a'
        });
      },
      error: (err) => {
        console.error('Error guardando la sesión:', err);
        this.guardando = false;
        this.cd.detectChanges();

        Swal.fire({
          icon: 'error',
          title: 'Error al guardar',
          text: err.error?.message || 'Ocurrió un problema guardando los cambios.',
          confirmButtonColor: '#0f172a'
        });
      }
    });
  }

  volver(): void {
    this.router.navigate(['/practicas/historial']);
  }
}
