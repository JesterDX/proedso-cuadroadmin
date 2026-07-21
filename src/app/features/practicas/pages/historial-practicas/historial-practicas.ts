import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PracticasService } from '../../services/practicas.service';

@Component({
  selector: 'app-historial-practicas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './historial-practicas.html',
  styleUrls: ['./historial-practicas.scss']
})
export class HistorialPracticasComponent implements OnInit {

  private practicasService = inject(PracticasService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  sesiones: any[] = [];
  cargando: boolean = true;
  errorMensaje: string = '';

  ngOnInit(): void {
    this.cargarHistorial();
  }

  cargarHistorial(): void {
    this.cargando = true;
    this.errorMensaje = '';

    this.practicasService.obtenerHistorialSesiones().subscribe({
      next: (response: any) => {
        // CORRECCIÓN: Extraer data correctamente sin evaluar response.ok
        this.sesiones = response.data ?? (Array.isArray(response) ? response : []);
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar historial:', err);
        this.errorMensaje = 'No se pudo cargar el historial de sesiones.';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Métodos de navegación
  irAlCronograma(sesionId: number): void {
    this.router.navigate(['/practicas/cronograma', sesionId]);
  }

  irAlDetalle(sesionId: number): void {
    this.router.navigate(['/practicas', sesionId]);
  }
}
