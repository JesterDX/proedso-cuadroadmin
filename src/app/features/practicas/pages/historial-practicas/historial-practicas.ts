import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PracticasService } from '../../services/practicas.service';

@Component({
  selector: 'app-historial-practicas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './historial-practicas.html',
  styleUrls: ['./historial-practicas.scss']
})
export class HistorialPracticasComponent implements OnInit {

  sesiones: any[] = [];
  cargando: boolean = true;
  errorMensaje: string = '';

  constructor(
    private practicasService: PracticasService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarHistorial();
  }

  cargarHistorial(): void {

    this.cargando = true;

    this.practicasService.obtenerHistorialSesiones()
    .subscribe({

      next: (response) => {

        if (response.ok) {
          this.sesiones = response.data;
        }

        this.cargando = false;

        // Actualizar vista manualmente
        this.cdr.detectChanges();

      },

      error: (err) => {

        console.error(
          'Error al cargar historial:',
          err
        );

        this.errorMensaje =
          'No se pudo cargar el historial de sesiones.';

        this.cargando = false;

        this.cdr.detectChanges();

      }

    });
  }
}
