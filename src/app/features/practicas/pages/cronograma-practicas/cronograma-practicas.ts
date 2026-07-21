import {
  Component,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  DragDropModule,
  CdkDragDrop,
  moveItemInArray
} from '@angular/cdk/drag-drop';

import { ActivatedRoute } from '@angular/router';

import { PracticasService } from '../../services/practicas.service';
import html2pdf from 'html2pdf.js';
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
  private router = inject(Router);
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

  const detalle = this.sesion.detalle.map(
    (item: any, index: number) => ({

      detalleId: item.detalle_id,

      orden: index + 1,

      horaInicio: item.horaInicio,

      horaFin: item.horaFin

    })
  );

  this.practicasService
    .guardarCronograma(
      this.sesion.id,
      detalle
    )
    .subscribe({

      next: () => {

        alert("Cronograma guardado correctamente.");

      },

      error: (err) => {

        console.error(err);

        alert("No se pudo guardar.");

      }

    });

}

  generarPDF(): void {

  const elemento = document.getElementById('cronogramaPDF');

  if (!elemento) return;

  const opciones = {

    margin: 0.5,

    filename: `Cronograma_${this.sesion.fecha}.pdf`,

    image: {
      type: 'jpeg',
      quality: 1
    },

    html2canvas: {
      scale: 2
    },

    jsPDF: {
      unit: 'in',
      format: 'a4',
      orientation: 'portrait'
    }

  };

  html2pdf()

    .set(opciones)

    .from(elemento)

    .save();

}
  iniciarJornada(): void {

  this.router.navigate([

    '/practicas/jornada',

    this.sesion.id

  ]);

}

}
