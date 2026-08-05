import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { HomologadosService } from '../services/homologados.service';

@Component({
  selector: 'app-homologados-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './homologados-list.html',
  styleUrl: './homologados-list.scss'
})
export class HomologadosListComponent implements OnInit {


  homologados:any[] = [];

  homologadosFiltrados:any[] = [];


  loading:boolean = false;


  busqueda:string = '';


  estadoSeleccionado:string = '';

  documentoSeleccionado:string = '';

  vendedorSeleccionado:string = '';



  paginaActual:number = 1;

  itemsPorPagina:number = 15;



  Math = Math;



  constructor(
    private service: HomologadosService
  ){}



  ngOnInit():void{

    this.cargarHomologados();

  }



  cargarHomologados():void{


    this.loading=true;


    this.service.listar().subscribe({

      next:(resp:any)=>{


        this.homologados = resp.data ?? [];


        this.aplicarFiltros();


        this.loading=false;


      },


      error:(err)=>{


        console.error(
          'Error cargando homologados',
          err
        );


        this.loading=false;


      }

    });


  }





  aplicarFiltros():void{


    this.homologadosFiltrados = this.homologados.filter(h=>{


      const texto = this.busqueda.toLowerCase();



      const coincideBusqueda =

      !this.busqueda ||

      h.alumno?.toLowerCase()
      .includes(texto)

      ||

      h.dni?.toString()
      .includes(this.busqueda);



      const coincideEstado =

      !this.estadoSeleccionado ||

      h.estado === this.estadoSeleccionado;



      const coincideDocumento =

      !this.documentoSeleccionado ||

      h.estado_documento === this.documentoSeleccionado;



      const coincideVendedor =

      !this.vendedorSeleccionado ||

      h.vendedor === this.vendedorSeleccionado;



      return (

        coincideBusqueda &&

        coincideEstado &&

        coincideDocumento &&

        coincideVendedor

      );


    });


    this.paginaActual=1;


  }





  buscar():void{

    this.aplicarFiltros();

  }





  filtrarEstado():void{

    this.aplicarFiltros();

  }





  filtrarDocumento():void{

    this.aplicarFiltros();

  }





  filtrarVendedor():void{

    this.aplicarFiltros();

  }







  get totalPaginas():number{


    return Math.ceil(

      this.homologadosFiltrados.length /

      this.itemsPorPagina

    ) || 1;


  }






  get homologadosPagina():any[]{


    const inicio =

    (

      this.paginaActual - 1

    ) *

    this.itemsPorPagina;



    return this.homologadosFiltrados.slice(

      inicio,

      inicio + this.itemsPorPagina

    );


  }







  cambiarPagina(pagina:number){


    if(

      pagina >= 1 &&

      pagina <= this.totalPaginas

    ){

      this.paginaActual = pagina;

    }


  }








  abrirNuevo():void{

    console.log('Nuevo homologado');

  }







  editar(item:any):void{


    console.log(
      'Editar',
      item
    );


  }







  eliminar(item:any):void{


    console.log(
      'Eliminar',
      item
    );


  }







  verPagos(item:any):void{


    console.log(
      'Pagos',
      item
    );


  }







  importarSheets():void{


    console.log(
      'Importar Google Sheets'
    );


  }







  actualizar():void{


    this.cargarHomologados();


  }



}
