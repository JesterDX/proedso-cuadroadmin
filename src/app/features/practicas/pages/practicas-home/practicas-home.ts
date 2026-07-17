import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-practicas-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './practicas-home.html',
  styleUrl: './practicas-home.scss'
})
export class PracticasHomeComponent {

  constructor(private router: Router) {}

  nuevaSesion() {
    this.router.navigate(['/practicas/nueva-sesion']);
  }

  historial() {
    this.router.navigate(['/practicas/historial']);
  }

  expedientes() {
    this.router.navigate(['/practicas/expedientes']);
  }

}
