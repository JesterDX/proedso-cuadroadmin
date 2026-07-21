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

  // Inyecciones
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private practicasService = inject(PracticasService);
  private cdr = inject(ChangeDetectorRef);

  // Estados
  sesion: any = null;
  loading: boolean = true;
  
  // Lista de sesiones pendientes (Lugares de práctica disponibles)
  sesionesPendientes: any[] = [];
  sesionSeleccionadaId: number | null = null;
  
  // Configuración de horarios
  horaInicio: string = '08:00';
  duracionSesion: number = 30; // Minutos por cada sesión asignada

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const idInicial = idParam ? Number(idParam) : null;
    
    this.cargarSesionesPendientes(idInicial);
  }

  /**
   * Carga la lista de sesiones pendientes y selecciona la correspondiente
   */
  cargarSesionesPendientes(idInicial: number | null): void {
    this.loading = true;
    this.practicasService.obtenerPendientes().subscribe({
      next: (resp: any) => {
        this.sesionesPendientes = resp.data ?? resp ?? [];

        if (this.sesionesPendientes.length > 0) {
          // Si viene un ID por la ruta y existe en la lista, lo selecciona; de lo contrario usa el primero
          const existe = this.sesionesPendientes.find(s => Number(s.id) === idInicial);
          this.sesionSeleccionadaId = existe ? Number(existe.id) : Number(this.sesionesPendientes[0].id);
          
          this.cargarSesion(this.sesionSeleccionadaId);
        } else if (idInicial) {
          // Si no hay lista pero se pasó un ID explícito por parámetro
          this.sesionSeleccionadaId = idInicial;
          this.cargarSesion(idInicial);
        } else {
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error al cargar sesiones pendientes', err);
        if (idInicial) {
          this.cargarSesion(idInicial);
        } else {
          this.loading = false;
          this.cdr.detectChanges();
        }
      }
    });
  }

  /**
   * Evento que se ejecuta al cambiar de sesión en el dropdown
   */
    onSesionChange(id: number): void {
      if (!id) return;
      this.sesionSeleccionadaId = Number(id);
      
      // CORRECCIÓN AQUÍ: Agregar '/practicas/' antes de 'cronograma'
      this.router.navigate(['/practicas/cronograma', id]); 
      
      this.cargarSesion(this.sesionSeleccionadaId);
    }

  /**
   * Obtiene la sesión por ID y genera el cronograma
   */
  cargarSesion(id: number): void {
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

  generarCronograma(): void {
    if (!this.sesion?.detalle) return;

    const [hora, minuto] = this.horaInicio.split(':').map(Number);
    
    let actual = new Date();
    actual.setHours(hora, minuto, 0, 0);

    this.sesion.detalle.forEach((item: any) => {
      const inicio = new Date(actual);
      actual.setMinutes(actual.getMinutes() + (item.sesiones_asignadas * this.duracionSesion));
      const fin = new Date(actual);

      item.horaInicio = this.formatearHora(inicio);
      item.horaFin = this.formatearHora(fin);
    });
  }

  private formatearHora(fecha: Date): string {
    return fecha.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  drop(event: CdkDragDrop<any[]>): void {
    moveItemInArray(this.sesion.detalle, event.previousIndex, event.currentIndex);
    this.generarCronograma();
  }

  guardarCronograma(): void {
    const detalle = this.sesion.detalle.map((item: any, index: number) => ({
      detalleId: item.detalle_id,
      orden: index + 1,
      horaInicio: item.horaInicio,
      horaFin: item.horaFin
    }));

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

  generarPDF(): void {
    const elemento = document.getElementById('cronogramaPDF');
    if (!elemento) return;

    const opciones: any = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: `Cronograma_Practicas_${this.sesion.lugar_practica || ''}_${this.sesion.fecha || 'Export'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

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
      .then(() => Swal.close())
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

  iniciarJornada(): void {
    this.router.navigate(['/practicas', this.sesion.id]);
  }
}
