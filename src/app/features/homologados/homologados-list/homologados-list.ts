import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { HomologadosService } from '../homologado-service/homologacion-service';
@Component({
  selector: 'app-homologados-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './homologados-list.html',
  styleUrls: ['./homologados-list.scss']
})
export class HomologadosListComponent implements OnInit {

  private homologadosService = inject(HomologadosService);
  private router = inject(Router);

  loading = false;

  homologados:any[] = [];

  busqueda='';

  estadoPago='';

  estadoDocumento='';

  vendedor='';

  paginaActual=1;

  itemsPorPagina=10;

  ngOnInit(): void {

    this.listar();

  }

  listar(){

    this.loading=true;

    this.homologadosService.listar().subscribe({

      next:(resp:any)=>{

        this.homologados=resp.data ?? [];

        this.loading=false;

      },

      error:()=>{

        this.loading=false;

      }

    });

  }

  get homologadosFiltrados(){

    return this.homologados.filter(h=>{

      const coincideBusqueda=

        !this.busqueda ||

        h.alumno?.toLowerCase().includes(this.busqueda.toLowerCase()) ||

        h.dni?.includes(this.busqueda);

      const coincidePago=

        !this.estadoPago ||

        h.estado_pago===this.estadoPago;

      const coincideDocumento=

        !this.estadoDocumento ||

        h.estado_documento===this.estadoDocumento;

      const coincideVendedor=

        !this.vendedor ||

        h.vendedor===this.vendedor;

      return coincideBusqueda &&

      coincidePago &&

      coincideDocumento &&

      coincideVendedor;

    });

  }

  get homologadosPagina(){

    const inicio=(this.paginaActual-1)*this.itemsPorPagina;

    return this.homologadosFiltrados.slice(

      inicio,

      inicio+this.itemsPorPagina

    );

  }

  get totalPaginas(){

    return Math.ceil(

      this.homologadosFiltrados.length/

      this.itemsPorPagina

    );

  }

  cambiarPagina(p:number){

    if(p<1)return;

    if(p>this.totalPaginas)return;

    this.paginaActual=p;

  }

  nuevo(){

    this.router.navigate(['/homologados/nuevo']);

  }

  editar(id:number){

    this.router.navigate(['/homologados',id]);

  }

}
