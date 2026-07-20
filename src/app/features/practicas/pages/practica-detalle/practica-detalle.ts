import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { PracticasService } from '../../../services/practicas.service';

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

        next: (resp)=>{

          this.sesion = resp.data;

          this.cargando = false;

          console.log(this.sesion);

        },

        error:(err)=>{

          console.error(err);

          this.cargando = false;

        }

      });

  }

}
