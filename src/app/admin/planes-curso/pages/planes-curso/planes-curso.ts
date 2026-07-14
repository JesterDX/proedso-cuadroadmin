import {
  Component,
  inject,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { PlanesCursoService } from '../../services/planes-curso-admin';
import { PlanCurso } from '../../models/plan-curso.model';

@Component({
  selector: 'app-planes-curso',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './planes-curso.html',
  styleUrl: './planes-curso.scss'
})
export class PlanesCursoComponent implements OnInit {

  private fb = inject(FormBuilder);
  private service = inject(PlanesCursoService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);

  planes: PlanCurso[] = [];
  tiposCurso: any[] = [];

  loading = false;
  modoEdicion = false;
  idEditando: number | null = null;

  form = this.fb.group({
    codigo: ['', Validators.required],
    nombre: ['', Validators.required],
    version: ['', Validators.required],
    tipo_curso_id: [null as number | null, Validators.required],
    permite_eleccion_personalizada: [false],
    vigente_desde: ['', Validators.required],
    vigente_hasta: ['', Validators.required],
    observaciones: ['']
  });

  ngOnInit(): void {
    this.listarActivos();
    this.cargarTipos();
  }

  cargarTipos(): void {

    this.service.listarTiposCurso().subscribe({

      next: (res) => {

        this.tiposCurso = res.data || [];

        this.cd.detectChanges();

      },

      error: (err) => {

        console.error(err);

        this.cd.detectChanges();

      }

    });

  }

  listarActivos(): void {

    this.loading = true;

    this.cd.detectChanges();

    this.service.listarActivos().subscribe({

      next: (data) => {

        this.planes = data || [];

        this.loading = false;

        this.cd.detectChanges();

      },

      error: (err) => {

        console.error(err);

        this.loading = false;

        this.cd.detectChanges();

      }

    });

  }


  configurar(plan: PlanCurso): void {

    this.router.navigate([
      '/admin/planes-curso/configurar',
      plan.id
    ]);

  }

  editar(plan: PlanCurso): void {

    this.modoEdicion = true;

    this.idEditando = plan.id;

    this.form.patchValue({
      codigo: plan.codigo,
      nombre: plan.nombre,
      version: plan.version?.toString(),
      tipo_curso_id: plan.tipo_curso_id,
      permite_eleccion_personalizada:
        plan.permite_eleccion_personalizada,
      vigente_desde: plan.vigente_desde,
      vigente_hasta: plan.vigente_hasta,
      observaciones: plan.observaciones
    });

    this.cd.detectChanges();

  }

  cambiarEstado(id: number): void {

    this.service.cambiarEstado(id).subscribe({

      next: () => {

        this.listarActivos();

        this.cd.detectChanges();

      },

      error: (err) => {

        console.error(err);

        this.cd.detectChanges();

      }

    });

  }

  reset(): void {

    this.form.reset();

    this.modoEdicion = false;

    this.idEditando = null;

    this.cd.detectChanges();

  }

}
