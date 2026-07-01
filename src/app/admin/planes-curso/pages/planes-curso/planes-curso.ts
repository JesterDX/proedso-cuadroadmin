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
    version: ['', Validators.required], // string para input
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

    const payload = {
      ...this.form.value,
      version: this.form.value.version ?? '',
      tipo_curso_id: this.form.value.tipo_curso_id ?? null
    };

    if (this.modoEdicion) {
      this.service.editar(this.idEditando!, payload).subscribe({
        next: () => {
          this.reset();
          this.listarActivos();
        }
      });
      return;
    }

    this.service.crear(payload).subscribe({
      next: () => {
        this.reset();
        this.listarActivos();
      }
    });
  }

  editar(plan: PlanCurso) {
    this.modoEdicion = true;
    this.idEditando = plan.id;

    this.form.patchValue({
      codigo: plan.codigo,
      nombre: plan.nombre,
      version: plan.version?.toString(),
      tipo_curso_id: plan.tipo_curso_id,
      permite_eleccion_personalizada: plan.permite_eleccion_personalizada,
      vigente_desde: plan.vigente_desde,
      vigente_hasta: plan.vigente_hasta,
      observaciones: plan.observaciones
    });
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
