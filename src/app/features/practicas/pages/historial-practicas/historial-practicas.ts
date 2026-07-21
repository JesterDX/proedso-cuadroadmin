import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // <--- Importante para *ngIf, *ngFor, ngClass y date pipe
import { PracticasService } from '../../services/practicas.service'; // Ajusta la ruta a tu service

@Component({
  selector: 'app-historial-practicas',
  standalone: true,
  imports: [CommonModule], // <--- Añadido aquí
  templateUrl: './historial-practicas.html',
  styleUrls: ['./historial-practicas.scss']
})
export class HistorialPracticasComponent implements OnInit { // <--- Nombre alineado con app.routes.ts
  
  sesiones: any[] = [];
  cargando: boolean = true;
  errorMensaje: string = '';

  constructor(private practicasService: PracticasService) {}

  ngOnInit(): void {
    this.cargarHistorial();
  }

  cargarHistorial(): void {
    this.cargando = true;
    this.practicasService.obtenerHistorialSesiones().subscribe({
      next: (response) => {
        if (response.ok) {
          this.sesiones = response.data;
        }
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar historial:', err);
        this.errorMensaje = 'No se pudo cargar el historial de sesiones.';
        this.cargando = false;
      }
    });
  }
}
