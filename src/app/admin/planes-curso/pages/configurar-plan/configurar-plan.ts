import {
  Component,
  FormsModule,
  inject,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlanCurso } from '../../models/plan-curso.model';
import { PlanesCursoService } from '../../services/planes-curso-admin';
import { PlanMaquina } from '../../models/plan-maquina.model';
@Component({
  selector: 'app-configurar-plan',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './configurar-plan.html',
  styleUrl: './configurar-plan.scss'
})
export class ConfigurarPlanComponent implements OnInit {

  plan!: PlanCurso;

  private service = inject(PlanesCursoService);

  private route = inject(ActivatedRoute);

  private cd = inject(ChangeDetectorRef);

  idPlan!: number;
  maquinas: PlanMaquina[] = [];
  loading = false;

  error = '';

  ngOnInit(): void {

    this.idPlan = Number(
      this.route.snapshot.paramMap.get('id')
    );

    this.cargarPlan();
    this.cargarMaquinas();

  }

  cargarPlan(): void {

    this.loading = true;

    this.error = '';

    this.cd.detectChanges();

    this.service
      .obtenerPorId(this.idPlan)
      .subscribe({

        next: (res) => {

          this.plan = res.data;

          this.loading = false;

          this.cd.detectChanges();

        },

        error: (err) => {

          console.error(err);

          this.error =
            'Error al cargar la información del plan.';

          this.loading = false;

          this.cd.detectChanges();

        }

      });

  }

  cargarMaquinas(){

  this.service.obtenerMaquinas(this.idPlan)
    .subscribe({

      next:(res)=>{

        this.maquinas = res.data;

      }

    });

}

}
