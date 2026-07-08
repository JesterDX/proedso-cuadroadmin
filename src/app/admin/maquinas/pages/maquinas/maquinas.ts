import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Maquina } from '../../model/maquina.model';
import { MaquinasAdminService } from '../../services/maquinas-admin.service';

@Component({
  selector: 'app-maquinas',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './maquinas.html',
  styleUrl: './maquinas.scss'
})
export class MaquinasComponent implements OnInit {

  private fb = inject(FormBuilder);
  private service = inject(MaquinasAdminService);

  maquinas: Maquina[] = [];

  loading = false;

  modoEdicion = false;
  idEditando: number | null = null;

  form = this.fb.group({
    nombre: ['', Validators.required],
    orden_visual: [1, Validators.required]
  });

  ngOnInit(): void {
    this.listar();
  }

  listar() {
    this.loading = true;

    this.service.listarTodas().subscribe({
      next: (data) => {
        this.maquinas = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  guardar() {

    if (this.form.invalid) return;

    if (this.modoEdicion) {

      this.service.editar(
        this.idEditando!,
        this.form.value
      ).subscribe({
        next: () => {
          this.reset();
          this.listar();
        }
      });

      return;
    }

    this.service.crear(this.form.value).subscribe({
      next: () => {
        this.reset();
        this.listar();
      }
    });

  }

  editar(maquina: Maquina) {

    this.modoEdicion = true;
    this.idEditando = maquina.id;

    this.form.patchValue({
      nombre: maquina.nombre,
      orden_visual: maquina.orden_visual
    });

  }

  cambiarEstado(id: number) {

    this.service.cambiarEstado(id).subscribe({
      next: () => this.listar()
    });

  }

  reset() {

    this.form.reset({
      nombre: '',
      orden_visual: 1
    });

    this.modoEdicion = false;
    this.idEditando = null;

  }

}
