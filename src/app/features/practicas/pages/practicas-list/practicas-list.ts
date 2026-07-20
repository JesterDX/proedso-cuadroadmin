import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-nueva-sesion-practica',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './practicas-list.html',
  styleUrl: ''
})
export class PracticasListComponent {

  
    fechaSesion = '';
  
    filtroMes: number | null = null;
  
    filtroAnio = new Date().getFullYear();
  
    filtroCurso: number | null = null;
  
    filtroMaquina: number | null = null;
  
    filtroNombre = '';
  
    loadingLista = false;
  
    meses = [
      { id:1,nombre:'Enero'},
      { id:2,nombre:'Febrero'},
      { id:3,nombre:'Marzo'},
      { id:4,nombre:'Abril'},
      { id:5,nombre:'Mayo'},
      { id:6,nombre:'Junio'},
      { id:7,nombre:'Julio'},
      { id:8,nombre:'Agosto'},
      { id:9,nombre:'Septiembre'},
      { id:10,nombre:'Octubre'},
      { id:11,nombre:'Noviembre'},
      { id:12,nombre:'Diciembre'}
    ];
  
    cursos:any[] = [];
  
    maquinas:any[] = [];
  
    cargarPracticas(){}
  
  }

}
