import {
  Component,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  DragDropModule,
  CdkDragDrop,
  moveItemInArray
} from '@angular/cdk/drag-drop';

import { ActivatedRoute } from '@angular/router';

import { PracticasService } from '../../services/practicas.service';

@Component({
  selector: 'app-cronograma-practicas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule
  ],
  templateUrl: './cronograma-practicas.html',
  styleUrl: './cronograma-practicas.scss'
})
export class CronogramaPracticasComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private practicasService = inject(PracticasService);

  sesion: any = null;

  loading = true;

  horaInicio = '08:00';

  duracionSesion = 30;

  ngOnInit(): void {

    const id = Number(
      this.route.snapshot.paramMap.get('id')
    );

    this.practicasService
      .obtenerSesionGrupal(id)
      .subscribe({

        next: (resp: any) => {

          this.sesion = resp.data ?? resp;

          this.generarCronograma();

          this.loading = false;

        },

        error: (err: any) => {

          console.error(err);

          this.loading = false;

        }

      });

  }

  generarCronograma(): void {

    if (!this.sesion) return;

    const [hora, minuto] = this.horaInicio
      .split(':')
      .map(Number);

    const actual = new Date();

    actual.setHours(hora);
    actual.setMinutes(minuto);
    actual.setSeconds(0);

    this.sesion.detalle.forEach((item: any) => {

      const inicio = new Date(actual);

      actual.setMinutes(
        actual.getMinutes() +
        item.sesiones_asignadas * this.duracionSesion
      );

      const fin = new Date(actual);

      item.horaInicio = this.formatearHora(inicio);

      item.horaFin = this.formatearHora(fin);

    });

  }

  formatearHora(fecha: Date): string {

    return fecha.toLocaleTimeString(
      'es-PE',
      {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }
    );

  }

  drop(event: CdkDragDrop<any[]>): void {

    moveItemInArray(
      this.sesion.detalle,
      event.previousIndex,
      event.currentIndex
    );

    this.generarCronograma();

  }

  guardarCronograma(): void {

  const detalle = this.sesion.detalle.map((x: any, index: number) => ({

    detalleId: x.detalle_id,

    orden: index + 1,

    horaInicio: x.horaInicio,

    horaFin: x.horaFin

  }));

  this.practicasService
      .guardarCronograma(
        this.sesion.id,
        detalle
      )
      .subscribe({

        next: () => {

          alert("Cronograma guardado.");

        }

      });

}

}
