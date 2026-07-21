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
    this.buscarUltimaSesion();
  }

  buscarUltimaSesion() {
    this.practicasService.obtenerUltimaSesionPendiente().subscribe({
      next: (resp: any) => {
        const sesion = resp.data ?? resp;
        if (sesion && sesion.id) {
          this.ultimaSesionPendienteId = sesion.id;
        }
      },
      error: (err: any) => {
        console.error('Error al buscar la última sesión pendiente:', err);
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

  abrirCronograma(): void {

  if (this.ultimaSesionPendienteId) {

    this.router.navigate([
      '/practicas/cronograma',
      this.ultimaSesionPendienteId
    ]);

    return;

  }

  alert('No existe un cronograma pendiente.');

}

abrirRegistrarPractica(): void {

  if (this.ultimaSesionPendienteId) {

    this.router.navigate([
      '/practicas',
      this.ultimaSesionPendienteId
    ]);

    return;

  }

  alert('No existe una sesión pendiente para registrar práctica.');

}

}
