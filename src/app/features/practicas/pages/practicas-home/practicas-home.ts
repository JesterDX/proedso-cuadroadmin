import { Component, inject } from '@angular/core';
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
export class PracticasHomeComponent {

  private router = inject(Router);
  private practicasService = inject(PracticasService);

  abrirSesionActual(): void {

    this.practicasService.listarSesionesGrupales()
      .subscribe({

        next: (resp) => {

          const sesiones = resp.data ?? [];

          const sesion =
            sesiones.find((s: any) =>
              s.estado === 'PROGRAMADA' ||
              s.estado === 'EN_CURSO'
            );

          if (sesion) {
            this.router.navigate(['/practicas', sesion.id]);
          } else {
            this.router.navigate(['/practicas/historial']);
          }

        },

        error: () => {

          this.router.navigate(['/practicas/historial']);

        }

      });

  }

}
