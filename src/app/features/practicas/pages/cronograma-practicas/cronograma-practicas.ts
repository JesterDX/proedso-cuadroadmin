import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  DragDropModule,
  CdkDragDrop,
  moveItemInArray
} from '@angular/cdk/drag-drop';

import Swal from 'sweetalert2';

import { PracticasService } from '../../services/practicas.service';

import html2pdf from 'html2pdf.js';


@Component({
  selector: 'app-cronograma-practicas',
  standalone: true,
  imports:[
    CommonModule,
    FormsModule,
    DragDropModule
  ],
  templateUrl:'./cronograma-practicas.html',
  styleUrl:'./cronograma-practicas.scss'
})
export class CronogramaPracticasComponent 
implements OnInit {


private route = inject(ActivatedRoute);

private router = inject(Router);

private practicasService = inject(PracticasService);
private cdr = inject(ChangeDetectorRef);


sesion:any = null;

loading = true;


horaInicio = '08:00';


duracionSesion = 30;



ngOnInit():void{


const id = Number(
 this.route.snapshot.paramMap.get('id')
);



this.practicasService
.obtenerSesionGrupal(id)

.subscribe({

next:(resp:any)=>{

  this.sesion = resp.data ?? resp;


  if(this.sesion?.detalle){

    this.generarCronograma();

  }


  this.loading = false;


  this.cdr.detectChanges();

},


error:(err)=>{

  console.error(
    'Error cargando cronograma',
    err
  );

  this.loading = false;

  this.cdr.detectChanges();

}
});


}




generarCronograma():void{


if(
 !this.sesion?.detalle
) return;



const [hora,minuto] =
this.horaInicio
.split(':')
.map(Number);



let actual = new Date();


actual.setHours(hora);

actual.setMinutes(minuto);

actual.setSeconds(0);



this.sesion.detalle.forEach(
(item:any)=>{


const inicio =
new Date(actual);



actual.setMinutes(
 actual.getMinutes()
 +
 (
 item.sesiones_asignadas *
 this.duracionSesion
 )
);



const fin =
new Date(actual);



item.horaInicio =
this.formatearHora(inicio);



item.horaFin =
this.formatearHora(fin);



});


}





formatearHora(fecha:Date):string{


return fecha.toLocaleTimeString(
'es-PE',
{
 hour:'2-digit',
 minute:'2-digit',
 hour12:false
}
);


}





drop(
event:CdkDragDrop<any[]>
){


moveItemInArray(

this.sesion.detalle,

event.previousIndex,

event.currentIndex

);



this.generarCronograma();


}






guardarCronograma():void{


const detalle =
this.sesion.detalle.map(
(item:any,index:number)=>({

detalleId:item.detalle_id,

orden:index+1,

horaInicio:item.horaInicio,

horaFin:item.horaFin

})
);



this.practicasService
.guardarCronograma(
this.sesion.id,
detalle
)

.subscribe({

next:()=>{


Swal.fire({

icon:'success',

title:'Cronograma guardado'

});


},


error:(err)=>{


console.error(err);


Swal.fire({

icon:'error',

title:'Error',

text:'No se pudo guardar el cronograma'

});


}


});


}







generarPDF():void{


const elemento =
document.getElementById(
'cronogramaPDF'
);



if(!elemento)return;



const opciones:any={


margin:0.5,


filename:
`Cronograma_${this.sesion.fecha}.pdf`,


image:{
type:'jpeg',
quality:1
},


html2canvas:{
scale:2
},


jsPDF:{
unit:'in',
format:'a4',
orientation:'portrait'
}


};



html2pdf()

.set(opciones)

.from(elemento)

.save();


}






// ==================================
// IR A ASISTENCIA
// ==================================

iniciarJornada():void{


this.router.navigate([

'/practicas',

this.sesion.id

]);


}



}
