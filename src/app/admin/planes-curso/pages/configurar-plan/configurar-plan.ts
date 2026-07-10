
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PlanCurso } from '../../models/plan-curso.model';

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


  idPlan!: number;

  
  ngOnInit(): void {
  
    this.idPlan = Number(
      this.route.snapshot.paramMap.get('id')
    );
  
  
    this.cargarPlan();
  
  }
  
  
  cargarPlan(){
  
    this.service.obtenerPorId(this.idPlan)
      .subscribe({
  
        next:(res)=>{
  
          this.plan = res.data;
  
        }
  
      });

}

}
