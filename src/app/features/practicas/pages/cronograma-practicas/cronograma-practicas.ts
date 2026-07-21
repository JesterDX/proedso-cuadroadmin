import {
  Component,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { ActivatedRoute } from '@angular/router';

import { PracticasService } from '../../services/practicas.service';

@Component({

  selector:'app-cronograma-practicas',

  standalone:true,

  imports:[
    CommonModule
  ],

  templateUrl:'./cronograma-practicas.html',

  styleUrl:'./cronograma-practicas.scss'

})

export class CronogramaPracticasComponent
implements OnInit{

  private route=inject(ActivatedRoute);

  private practicasService=inject(PracticasService);

  sesion:any=null;

  loading=true;

  horaInicio='08:00';

  ngOnInit():void{

    const id=

      Number(

        this.route.snapshot.paramMap.get('id')

      );

    this.practicasService

      .obtenerSesionGrupal(id)

      .subscribe({

        next:(resp)=>{

          this.sesion=resp.data ?? resp;

          this.loading=false;

        },

        error:(err)=>{

          console.error(err);

          this.loading=false;

        }

      });

  }

}
