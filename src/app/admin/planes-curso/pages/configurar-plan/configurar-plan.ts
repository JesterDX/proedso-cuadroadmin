import {
  Component,
  inject,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators
} from '@angular/forms';

import { PlanCurso } from '../../models/plan-curso.model';
import { PlanMaquina } from '../../models/plan-maquina.model';
import { PlanesCursoService } from '../../services/planes-curso-admin';

@Component({
  selector: 'app-configurar-plan',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './configurar-plan.html',
  styleUrl: './configurar-plan.scss'
})
export class ConfigurarPlanComponent implements OnInit {

  plan!: PlanCurso;

  maquinas: PlanMaquina[] = [];

  private fb = inject(FormBuilder);

  private service = inject(PlanesCursoService);

  private route = inject(ActivatedRoute);

  private cd = inject(ChangeDetectorRef);

  modoNuevo = false;
  
  idPlan!: number;

  loading = false;

  error = '';

  // ==========================================
  // FORMULARIO DEL PLAN
  // ==========================================
  form = this.fb.group({

    codigo: ['', Validators.required],

    nombre: ['', Validators.required],

    version: [1, Validators.required],

    tipo_curso_id: [null as number | null],

    permite_eleccion_personalizada: [false],

    vigente_desde: [''],

    vigente_hasta: [''],

    observaciones: ['']

  });

ngOnInit(): void {

  const id = this.route.snapshot.paramMap.get('id');

  this.modoNuevo = !id;

  if (this.modoNuevo) {

    this.plan = {

      id: 0,
      codigo: '',
      nombre: '',
      version: 1,
      tipo_curso_id: 0,
      tipo_curso_nombre: '',
      vigente_desde: '',
      vigente_hasta: '',
      permite_eleccion_personalizada: false,
      activo: true,
      observaciones: ''

    };

    this.form.patchValue({

      version: 1,
      permite_eleccion_personalizada: false

    });

    this.cargarMaquinas();

  }
  else {

    this.idPlan = Number(id);

    this.cargarPlan();

    this.cargarMaquinas();

  }

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

          // ===============================
          // CARGAR FORMULARIO
          // ===============================

          this.form.patchValue({

            codigo: this.plan.codigo,

            nombre: this.plan.nombre,

            version: this.plan.version,

            tipo_curso_id: this.plan.tipo_curso_id,

            permite_eleccion_personalizada:
              this.plan.permite_eleccion_personalizada,

            vigente_desde: this.plan.vigente_desde,

            vigente_hasta: this.plan.vigente_hasta,

            observaciones: this.plan.observaciones

          });

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

if (this.modoNuevo) {

  this.service.obtenerMaquinas(0).subscribe({

    next: (res) => {

      this.maquinas = res.data || [];

      this.loading = false;

      this.cd.detectChanges();

    },

    error: (err:any) => {

      console.error(err);

      this.loading = false;

    }

  });

  return;

}

this.service.obtenerMaquinas(this.idPlan).subscribe({

  next:(res)=>{

    this.maquinas = res.data || [];

    this.loading = false;

    this.cd.detectChanges();

  },

  error:(err:any)=>{

    console.error(err);

    this.loading=false;

  }

});

  }

  // ==========================================
  // GUARDAR CONFIGURACIÓN
  // ==========================================
guardarTodo(): void {


  this.loading = true;



  // ======================================
  // 1. GUARDAR DATOS DEL PLAN
  // ======================================

  const datosPlan = {


    codigo:
    this.form.value.codigo,


    nombre:
    this.form.value.nombre,


    version:
    this.form.value.version,


    tipo_curso_id:
    this.form.value.tipo_curso_id,


    permite_eleccion_personalizada:
    this.form.value.permite_eleccion_personalizada,


    vigente_desde:
    this.form.value.vigente_desde,


    vigente_hasta:
    this.form.value.vigente_hasta,


    observaciones:
    this.form.value.observaciones

  };



if (this.modoNuevo) {

  this.service
    .crearCompleto({

      ...datosPlan,

      maquinas: this.maquinas

    })
    .subscribe({

      next: () => {

        alert("Plan creado correctamente");

        this.loading = false;

      },

      error: (err:any) => {

        console.error(err);

        this.loading = false;

      }

    });

}
else {

  this.service
    .actualizar(
      this.idPlan,
      datosPlan
    )
    .subscribe({

      next: () => {

        this.service
          .guardarConfiguracion(
            this.idPlan,
            this.maquinas
          )
          .subscribe({

            next: () => {

              alert("Plan actualizado correctamente");

              this.loading = false;

            },

            error: (err:any) => {

              console.error(err);

              this.loading = false;

            }

          });

      },

      error: (err:any) => {

        console.error(err);

        this.loading = false;

      }

    });

}


    error:(err)=>{


      console.error(err);


      alert(
      "Error actualizando información del plan"
      );


      this.loading=false;


    }

  });


}

}
