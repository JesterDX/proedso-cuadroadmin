import {
  Component,
  inject,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import Swal from 'sweetalert2';

import { TiposCursoService } from '../../services/tipos-curso.service';
import { TipoCurso } from '../../models/tipo-curso.model';

@Component({
  selector: 'app-tipos-curso',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './tipos-curso.html',
  styleUrl: './tipos-curso.scss'
})
export class TiposCursoComponent implements OnInit {

  private service = inject(TiposCursoService);
  private cd = inject(ChangeDetectorRef);

  tiposCurso: TipoCurso[] = [];

  mostrarFormulario = false;

  nuevoTipo = {
    codigo: '',
    nombre: '',
    duracion_meses: 1,
    cantidad_maquinas: 1,
    activo: true
  };

  ngOnInit(): void {
    this.cargarTipos();
  }

  cargarTipos(): void {

    this.service.listar().subscribe({

      next: (resp) => {

        this.tiposCurso = resp.data || [];

        this.cd.detectChanges();

      },

      error: (err) => {

        console.error(err);

        this.cd.detectChanges();

      }

    });

  }

  guardarTipo(): void {

    this.service.crear(this.nuevoTipo).subscribe({

      next: () => {

        Swal.fire({
          icon: 'success',
          title: 'Correcto',
          text: 'Tipo de curso creado correctamente.'
        });

        this.mostrarFormulario = false;

        this.nuevoTipo = {
          codigo: '',
          nombre: '',
          duracion_meses: 1,
          cantidad_maquinas: 1,
          activo: true
        };

        this.cargarTipos();

      },

      error: (err) => {

        console.error(err);

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo crear el tipo de curso.'
        });

      }

    });

  }

}
