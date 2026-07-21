import { Component, OnInit } from '@angular/core';
import { PracticasService } from '../../services/practicas.service'; // Ajusta tu ruta

@Component({
  selector: 'app-historial-sesiones',
  templateUrl: './historial-sesiones.component.html',
  styleUrls: ['./historial-sesiones.component.scss']
})
export class HistorialSesionesComponent implements OnInit {
  
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
