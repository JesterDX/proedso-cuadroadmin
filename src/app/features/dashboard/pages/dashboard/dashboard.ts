import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {

  stats = {
    totalAlumnos: 0,
    matriculasActivas: 0,
    cuotasAlDia: 0,
    ingresosMes: 0,

    certificaciones: 0,
    practicas: 0,
    usuarios: 0,
    cursos: 0,

    cuotasVencidas: 0,
    reservas: 0,
    certificadosPendientes: 0,

    ingresosTotal: 0,
    totalPagos: 0,
    pendientesCobro: 0
  };

}
