homologados:any[]=[];

busqueda:string='';

ngOnInit(){

this.cargarHomologados();

}

cargarHomologados(){

this.service.listar().subscribe({

next:(resp:any)=>{

this.homologados=resp.data;

}

});

}
