import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

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

  // ==========================================
  // INYECCIONES
  // ==========================================
  private fb = inject(FormBuilder);

  private service = inject(MaquinasAdminService);

  private cd = inject(ChangeDetectorRef);

  // ==========================================
  // VARIABLES
  // ==========================================
  maquinas: Maquina[] = [];

  loading = false;

  modoEdicion = false;

  idEditando: number | null = null;

  error = '';

  // ==========================================
  // FORMULARIO
  // ==========================================
  form = this.fb.group({

    nombre: ['', Validators.required]

  });

  // ==========================================
  // INIT
  // ==========================================
  ngOnInit(): void {

    this.listar();

  }

  // ==========================================
  // LISTAR
  // ==========================================
  listar(): void {

    this.loading = true;

    this.error = '';

    this.cd.detectChanges();

    this.service
      .listarTodas()
      .subscribe({

        next: (data) => {

          this.maquinas = data;

          this.loading = false;

          this.cd.detectChanges();

        },

        error: (err) => {

          console.error(err);

          this.error =
            'Error al cargar las máquinas.';

          this.loading = false;

          this.cd.detectChanges();

        }

      });

  }

  // ==========================================
  // GUARDAR
  // ==========================================
  guardar(): void {

    if (this.form.invalid) {

      return;

    }

    this.loading = true;

    this.error = '';

    this.cd.detectChanges();

    if (this.modoEdicion) {

      this.service
        .editar(
          this.idEditando!,
          this.form.value
        )
        .subscribe({

          next: () => {

            this.reset();

            this.listar();

          },

          error: (err) => {

            console.error(err);

            this.error =
              'Error al actualizar la máquina.';

            this.loading = false;

            this.cd.detectChanges();

          }

        });

      return;

    }

    this.service
      .crear(this.form.value)
      .subscribe({

        next: () => {

          this.reset();

          this.listar();

        },

        error: (err) => {

          console.error(err);

          this.error =
            'Error al registrar la máquina.';

          this.loading = false;

          this.cd.detectChanges();

        }

      });

  }

  // ==========================================
  // EDITAR
  // ==========================================
  editar(maquina: Maquina): void {

    this.modoEdicion = true;

    this.idEditando = maquina.id;

    this.form.patchValue({

      nombre: maquina.nombre

    });

    this.cd.detectChanges();

  }

  // ==========================================
  // CAMBIAR ESTADO
  // ==========================================
  cambiarEstado(id: number): void {

    this.loading = true;

    this.cd.detectChanges();

    this.service
      .cambiarEstado(id)
      .subscribe({

        next: () => {

          this.listar();

        },

        error: (err) => {

          console.error(err);

          this.error =
            'No fue posible cambiar el estado de la máquina.';

          this.loading = false;

          this.cd.detectChanges();

        }

      });

  }

  // ==========================================
  // RESET
  // ==========================================
  reset(): void {

    this.form.reset({

      nombre: ''

    });

    this.modoEdicion = false;

    this.idEditando = null;

    this.loading = false;

    this.error = '';

    this.cd.detectChanges();

  }

}
