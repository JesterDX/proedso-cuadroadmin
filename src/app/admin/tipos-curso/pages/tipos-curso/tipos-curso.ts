import {
  Component,
  inject,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { TiposCursoService } from '../../services/tipos-curso.service';
import { TipoCurso } from '../../models/tipo-curso.model';

@Component({
  selector: 'app-tipos-curso',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tipos-curso.html',
  styleUrl: './tipos-curso.scss'
})
export class TiposCursoComponent implements OnInit {

  private service = inject(TiposCursoService);

  private cd = inject(ChangeDetectorRef);

  tiposCurso: TipoCurso[] = [];

  ngOnInit(): void {
    this.cargarTipos();
  }

  cargarTipos(): void {

    this.service.listar().subscribe({

      next: (resp) => {

        this.tiposCurso = resp.data || [];

        this.cd.detectChanges();

      },

      error: (err) => {

        console.error(err);

        this.cd.detectChanges();

      }

    });

  }

}
