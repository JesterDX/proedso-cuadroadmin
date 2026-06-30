import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PlanesCursoService } from '../services/planes-curso.service';
import { PlanCurso } from '../models/plan-curso.model';

@Component({
  selector: 'app-planes-curso',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './planes-curso.component.html',
  styleUrl: './planes-curso.component.scss'
})
export class PlanesCursoComponent implements OnInit {

  private fb = inject(FormBuilder);
  private service = inject(PlanesCursoService);

  planes: PlanCurso[] = [];
  loading = false;

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
    this.listar();
  }

  listar() {
    this.loading = true;

    this.service.listar().subscribe({
      next: (data) => {
        this.planes = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  guardar() {
    if (this.form.invalid) return;

    this.service.crear(this.form.value).subscribe({
      next: () => {
        this.form.reset();
        this.listar();
      }
    });
  }

  eliminar(id: number) {
    if (!confirm('¿Seguro que deseas eliminar este plan?')) return;

    this.service.eliminar(id).subscribe({
      next: () => this.listar()
    });
  }
}
