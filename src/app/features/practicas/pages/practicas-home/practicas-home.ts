import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { PracticasService } from '../../services/practicas.service';


@Component({
  selector:'app-practicas-home',
  standalone:true,
  imports:[
    CommonModule,
    RouterModule
  ],
  templateUrl:'./practicas-home.html',
  styleUrl:'./practicas-home.scss'
})
export class PracticasHomeComponent implements OnInit {


private practicasService = inject(PracticasService);

private router = inject(Router);



ultimaSesionPendienteId:number|null=null;



ngOnInit(){

 this.buscarSesionPendiente();

}



buscarSesionPendiente(){


this.practicasService
.listarSesionesGrupales()
.subscribe({

next:(resp:any)=>{


const sesiones =
resp.data ?? resp;



const pendientes =
sesiones.filter(
(s:any)=>s.estado === 'PENDIENTE'
);



pendientes.sort(
(a:any,b:any)=>
b.id-a.id
);



if(pendientes.length){

this.ultimaSesionPendienteId =
pendientes[0].id;

}



},


error:err=>{
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


}


}



}
