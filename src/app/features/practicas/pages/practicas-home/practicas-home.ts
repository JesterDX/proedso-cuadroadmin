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
    this.buscarSesionPendiente();
  }

  buscarSesionPendiente() {
    // CORREGIDO: Se usa listarAsignaciones() en lugar de listarSesionesGrupales()
    this.practicasService.listarAsignaciones().subscribe({
      next: (resp: any) => {
        const sesiones = resp.data ?? resp;

        if (Array.isArray(sesiones)) {
          const pendientes = sesiones.filter(
            (s: any) => s.estado === 'PENDIENTE'
          );

          pendientes.sort(
            (a: any, b: any) => b.id - a.id
          );

          if (pendientes.length > 0) {
            this.ultimaSesionPendienteId = pendientes[0].id;
          }
        }
      },
      error: (err: any) => { // CORREGIDO: Tipado estricto 'err: any'
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
