
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';


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


  private route = inject(ActivatedRoute);


  idPlan!: number;


  ngOnInit(): void {

    this.idPlan = Number(
      this.route.snapshot.paramMap.get('id')
    );


    console.log(
      'Plan seleccionado:',
      this.idPlan
    );

  }

}
