import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { PracticasService } from '../../services/practicas.service';

@Component({
  selector: 'app-practica-detalle',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './practica-detalle.html',
  styleUrls: ['./practica-detalle.scss']
})
export class PracticaDetalle implements OnInit {

  private route = inject(ActivatedRoute);
  private practicasService = inject(PracticasService);
  private cd = inject(ChangeDetectorRef);

  cargando = false;

  sesion: any = null;


  ngOnInit(): void {

    const id = Number(
      this.route.snapshot.paramMap.get('id')
    );

    this.cargarSesion(id);

  }


  cargarSesion(id:number){

    this.cargando = true;

    this.practicasService.obtenerSesion(id)
      .subscribe({

        next:(resp)=>{

          this.sesion = resp.data;

          this.cargando = false;

          console.log(this.sesion);


          // 🔥 Fuerza actualización de la vista
          this.cd.detectChanges();

        },


        error:(err)=>{

          console.error(err);

          this.cargando = false;

          this.cd.detectChanges();

        }

      });

  }
  seleccionarImagen(event:any,item:any){

  const archivo = event.target.files?.[0];

  if(!archivo) return;

  item.archivo = archivo;

}

guardarSesion() {

  console.log("ENVIANDO");
  console.log(this.sesion);

  this.practicasService
    .guardarSesion(
      this.sesion.id,
      this.sesion
    )
    .subscribe({

      next: (resp) => {

        console.log(resp);

        alert("Práctica guardada.");

      },

      error: (err) => {

        console.error(err);

      }

    });

}

}
