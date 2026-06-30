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
  modoEdicion = false;
  
  idEditando: number | null = null;
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
      editar(tipo: TipoCurso): void {
    
      this.modoEdicion = true;
    
      this.idEditando = tipo.id;
    
      this.mostrarFormulario = true;
    
      this.nuevoTipo = {
        codigo: tipo.codigo,
        nombre: tipo.nombre,
        duracion_meses: tipo.duracion_meses,
        cantidad_maquinas: tipo.cantidad_maquinas,
        activo: tipo.activo
      };
    
    }

  cerrarFormulario(): void {

  this.mostrarFormulario = false;

  this.modoEdicion = false;

  this.idEditando = null;

  this.nuevoTipo = {
    codigo: '',
    nombre: '',
    duracion_meses: 1,
    cantidad_maquinas: 1,
    activo: true
  };

}
      
guardarTipo(): void {

  if (this.modoEdicion) {

    this.service.actualizar(
      this.idEditando!,
      this.nuevoTipo
    ).subscribe({

      next: () => {

        Swal.fire({
          icon: 'success',
          title: 'Actualizado',
          text: 'Tipo de curso actualizado correctamente.'
        });

        this.cerrarFormulario();

        this.cargarTipos();

      },

      error: () => {

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo actualizar.'
        });

      }

    });

    return;
  }

  this.service.crear(this.nuevoTipo).subscribe({

    next: () => {

      Swal.fire({
        icon: 'success',
        title: 'Correcto',
        text: 'Tipo de curso creado correctamente.'
      });

      this.cerrarFormulario();

      this.cargarTipos();

    },

    error: () => {

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo crear.'
      });

    }

  });
}
  
