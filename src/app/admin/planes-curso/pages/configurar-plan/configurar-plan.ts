import {
  Component,
  inject,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PlanCurso } from '../../models/plan-curso.model';
import { PlanMaquina } from '../../models/plan-maquina.model';
import { PlanesCursoService } from '../../services/planes-curso-admin';

@Component({
  selector: 'app-configurar-plan',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './configurar-plan.html',
  styleUrl: './configurar-plan.scss'
})
export class ConfigurarPlanComponent implements OnInit {

  plan!: PlanCurso;

  maquinas: PlanMaquina[] = [];

  private service = inject(PlanesCursoService);

  private route = inject(ActivatedRoute);

  private cd = inject(ChangeDetectorRef);

  idPlan!: number;

  loading = false;

  error = '';

  ngOnInit(): void {

    this.idPlan = Number(
      this.route.snapshot.paramMap.get('id')
    );

    this.cargarPlan();

    this.cargarMaquinas();

  }

  // ==========================================
  // CARGAR PLAN
  // ==========================================
  cargarPlan(): void {

    this.loading = true;

    this.error = '';

    this.cd.detectChanges();

    this.service
      .obtenerPorId(this.idPlan)
      .subscribe({

        next: (res) => {

          console.log('RESPUESTA OBTENER PLAN:', res);

          this.plan = res.data;

          this.loading = false;

          this.cd.detectChanges();

        },

        error: (err) => {

          console.error('ERROR OBTENER PLAN:', err);

          this.error =
            'Error al cargar la información del plan.';

          this.loading = false;

          this.cd.detectChanges();

        }

      });

  }

  // ==========================================
  // CARGAR MÁQUINAS
  // ==========================================
  cargarMaquinas(): void {

    this.loading = true;

    this.error = '';

    this.cd.detectChanges();

    this.service
      .obtenerMaquinas(this.idPlan)
      .subscribe({

        next: (res) => {

          console.log('RESPUESTA OBTENER MAQUINAS:', res);

          this.maquinas = res.data || [];

          this.loading = false;

          this.cd.detectChanges();

        },

        error: (err) => {

          console.error('ERROR OBTENER MAQUINAS:', err);

          this.error =
            'Error al cargar las máquinas del plan.';

          this.loading = false;

          this.cd.detectChanges();

        }

      });

  }

  guardar(){

 this.loading=true;


 this.service
 .guardarConfiguracion(
    this.idPlan,
    this.maquinas
 )
 .subscribe({

 next:(res)=>{

   console.log(res);

   alert(
    "Configuración guardada correctamente"
   );

   this.loading=false;

 },


 error:(err)=>{

   console.error(err);

   alert(
    "Error guardando configuración"
   );

   this.loading=false;

 }


 });


}

}
