import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PlanesCursoService } from '../../services/planes-curso-admin';
import { PlanCurso } from '../../models/plan-curso.model';

@Component({
  selector: 'app-planes-curso',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './planes-curso.html',
  styleUrl: './planes-curso.scss'
})
export class PlanesCursoComponent implements OnInit {

  private fb = inject(FormBuilder);
  private service = inject(PlanesCursoService);

  planes: PlanCurso[] = [];
  tiposCurso: any[] = [];

  loading = false;
  modoEdicion = false;
  idEditando: number | null = null;

  form = this.fb.group({
    codigo: ['', Validators.required],
    nombre: ['', Validators.required],
    version: ['', Validators.required],
    tipo_curso_id: ['', Validators.required],
    permite_eleccion_personalizada: [false],
    vigente_desde: ['', Validators.required],
    vigente_hasta: ['', Validators.required],
    observaciones: ['']
  });

  ngOnInit(): void {
    this.listarActivos();
    this.cargarTipos();
  }

  cargarTipos() {
    this.service.listarTiposCurso().subscribe({
      next: (res) => {
        this.tiposCurso = res.data;
      }
    });
  }

  listarActivos() {
    this.loading = true;

    this.service.listarActivos().subscribe({
      next: (data) => {
        this.planes = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  guardar() {

    if (this.form.invalid) return;

    if (this.modoEdicion) {

      this.service.editar(this.idEditando!, this.form.value).subscribe({
        next: () => {
          this.reset();
          this.listarActivos();
        }
      });

      return;
    }

    this.service.crear(this.form.value).subscribe({
      next: () => {
        this.reset();
        this.listarActivos();
      }
    });
  }

  editar(plan: PlanCurso) {

    this.modoEdicion = true;
    this.idEditando = plan.id;

    this.form.patchValue(plan);
  }

  cambiarEstado(id: number) {

    this.service.cambiarEstado(id).subscribe({
      next: () => this.listarActivos()
    });

  }

  reset() {
    this.form.reset();
    this.modoEdicion = false;
    this.idEditando = null;
  }
}
