import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { PracticasService } from '../../services/practicas.service';

@Component({
  selector: 'app-practicas-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './practicas-home.html',
  styleUrl: './practicas-home.scss'
})
export class PracticasHomeComponent implements OnInit {

  private practicasService = inject(PracticasService);
  private router = inject(Router);

  ultimaSesionPendienteId: number | null = null;

  ngOnInit(): void {
    this.obtenerUltimaSesionPendiente();
  }

  obtenerUltimaSesionPendiente() {
    this.practicasService.listarAsignaciones().subscribe({
      next: (resp: any) => {
        const sesiones = resp.data ?? resp;
        
        if (Array.isArray(sesiones) && sesiones.length > 0) {
          // Filtramos las pendientes (o tomamos directamente la última si prefieres el flujo general)
          const pendientes = sesiones.filter(
            s => s.estado === 'PENDIENTE'
          );

          const listaAUsar = pendientes.length > 0 ? pendientes : sesiones;

          // Ordenamos estrictamente por ID de manera descendente (el ID más alto es el más reciente)
          listaAUsar.sort((a, b) => b.id - a.id);

          this.ultimaSesionPendienteId = listaAUsar[0].id;
        }
      },
      error: (err: any) => {
        console.error(err);
      }
    });
  }

  abrirRegistrarPractica() {
    if (this.ultimaSesionPendienteId) {
      this.router.navigate([
        '/practicas',
        this.ultimaSesionPendienteId
      ]);
    } else {
      alert(
        'No existe una sesión pendiente para registrar práctica.'
      );
    }
  }

}
