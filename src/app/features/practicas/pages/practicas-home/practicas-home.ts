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


  obtenerUltimaSesionPendiente(){

    this.practicasService.obtenerSesiones().subscribe({

      next: (sesiones:any[]) => {


        const pendientes = sesiones.filter(
          s => s.estado === 'PENDIENTE'
        );


        if(pendientes.length > 0){


          // ordenamos por fecha descendente
          pendientes.sort(
            (a,b) =>
            new Date(b.fecha_creacion).getTime() -
            new Date(a.fecha_creacion).getTime()
          );


          this.ultimaSesionPendienteId = pendientes[0].id;


        }


      },

      error: err =>{
        console.error(err);
      }

    });

  }


  abrirRegistrarPractica(){


    if(this.ultimaSesionPendienteId){

      this.router.navigate([
        '/practicas',
        this.ultimaSesionPendienteId
      ]);


    }else{

      alert(
        'No existe una sesión pendiente para registrar práctica.'
      );

    }

  }


}
