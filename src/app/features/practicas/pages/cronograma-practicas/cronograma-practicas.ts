import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import Swal from 'sweetalert2';
import html2pdf from 'html2pdf.js';

import { PracticasService } from '../../services/practicas.service';

@Component({
  selector: 'app-cronograma-practicas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule
  ],
  templateUrl: './cronograma-practicas.html',
  styleUrls: ['./cronograma-practicas.scss']
})
export class CronogramaPracticasComponent implements OnInit {

  // Inyecciones de dependencias
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private practicasService = inject(PracticasService);
  private cdr = inject(ChangeDetectorRef);

  // Propiedades de estado
  sesion: any = null;
  loading: boolean = true;
  
  // Configuración de horarios
  horaInicio: string = '08:00';
  duracionSesion: number = 30; // Minutos por cada sesión asignada

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarSesion(id);
  }

  /**
   * Obtiene los datos de la sesión desde el backend
   */
  private cargarSesion(id: number): void {
    this.loading = true;
    
    this.practicasService.obtenerSesionGrupal(id).subscribe({
      next: (resp: any) => {
        this.sesion = resp.data ?? resp;
        
        if (this.sesion?.detalle) {
          this.generarCronograma();
        }
        
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando cronograma', err);
        Swal.fire({
          icon: 'error',
          title: 'Error de conexión',
          text: 'No se pudo cargar la información del cronograma.',
          confirmButtonColor: '#2563eb'
        });
        
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Recalcula las horas de inicio y fin para cada alumno
   * basado en la hora de inicio general y el orden actual.
   */
  generarCronograma(): void {
    if (!this.sesion?.detalle) return;

    const [hora, minuto] = this.horaInicio.split(':').map(Number);
    
    let actual = new Date();
    actual.setHours(hora, minuto, 0, 0);

    this.sesion.detalle.forEach((item: any) => {
      const inicio = new Date(actual);
      
      // Sumar el tiempo correspondiente (sesiones asignadas * duración de cada sesión)
      actual.setMinutes(actual.getMinutes() + (item.sesiones_asignadas * this.duracionSesion));
      
      const fin = new Date(actual);

      item.horaInicio = this.formatearHora(inicio);
      item.horaFin = this.formatearHora(fin);
    });
  }

  /**
   * Formatea un objeto Date a string en formato (HH:MM)
   */
  private formatearHora(fecha: Date): string {
    return fecha.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  /**
   * Maneja el evento Drag & Drop para reordenar a los alumnos en la tabla
   */
  drop(event: CdkDragDrop<any[]>): void {
    moveItemInArray(this.sesion.detalle, event.previousIndex, event.currentIndex);
    // Recalcular horarios automáticamente después de cambiar el orden
    this.generarCronograma();
  }

  /**
   * Guarda el nuevo orden y horarios en el backend
   */
  guardarCronograma(): void {
    const detalle = this.sesion.detalle.map((item: any, index: number) => ({
      detalleId: item.detalle_id,
      orden: index + 1,
      horaInicio: item.horaInicio,
      horaFin: item.horaFin
    }));

    // UX: Mostrar indicador de carga
    Swal.fire({
      title: 'Guardando...',
      text: 'Actualizando el orden del cronograma',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.practicasService.guardarCronograma(this.sesion.id, detalle).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Cronograma guardado',
          text: 'El orden y los horarios se han actualizado correctamente.',
          confirmButtonColor: '#2563eb'
        });
      },
      error: (err) => {
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo guardar el cronograma. Intente nuevamente.',
          confirmButtonColor: '#2563eb'
        });
      }
    });
  }

  /**
   * Genera y descarga un PDF con el diseño renderizado de la tabla
   */
  generarPDF(): void {
    const elemento = document.getElementById('cronogramaPDF');
    
    if (!elemento) return;

    // Configuración optimizada para una impresión nítida y profesional
    const opciones: any = {
      margin: [0.5, 0.5, 0.5, 0.5], // Márgenes [top, left, bottom, right]
      filename: `Cronograma_Practicas_${this.sesion.fecha || 'Export'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,           // Aumenta la resolución del texto
        useCORS: true,      // Previene errores con recursos externos
        logging: false
      },
      jsPDF: { 
        unit: 'in', 
        format: 'a4', 
        orientation: 'portrait' 
      }
    };

    // UX: Mostrar indicador de carga para el PDF
    Swal.fire({
      title: 'Generando PDF...',
      text: 'Preparando el documento para descarga.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    html2pdf()
      .set(opciones)
      .from(elemento)
      .save()
      .then(() => {
        Swal.close(); // Cierra el modal cuando la descarga inicia
      })
      .catch((err: any) => {
        console.error('Error generando PDF:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hubo un problema al generar el documento.',
          confirmButtonColor: '#2563eb'
        });
      });
  }

  /**
   * Navega a la vista de registro de asistencia / evidencias
   */
  iniciarJornada(): void {
    this.router.navigate(['/practicas', this.sesion.id]);
  }

}
