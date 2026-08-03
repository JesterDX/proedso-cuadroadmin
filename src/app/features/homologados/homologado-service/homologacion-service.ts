import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class HomologadosService {

  private http = inject(HttpClient);

  private readonly api =
    `${environment.apiUrl}/homologaciones`;

  //=========================================
  // LISTAR HOMOLOGACIONES
  //=========================================
  listar(): Observable<any> {

    return this.http.get(this.api);

  }

  //=========================================
  // OBTENER HOMOLOGACIÓN
  //=========================================

  /*
  obtener(id:number):Observable<any>{

    return this.http.get(
      `${this.api}/${id}`
    );

  }
  */

  //=========================================
  // CREAR HOMOLOGACIÓN
  //=========================================

  /*
  crear(data:any):Observable<any>{

    return this.http.post(
      this.api,
      data
    );

  }
  */

  //=========================================
  // ACTUALIZAR HOMOLOGACIÓN
  //=========================================

  /*
  actualizar(id:number,data:any):Observable<any>{

    return this.http.put(
      `${this.api}/${id}`,
      data
    );

  }
  */

  //=========================================
  // REGISTRAR PAGO
  //=========================================

  /*
  registrarPago(
    id:number,
    data:any
  ):Observable<any>{

    return this.http.post(
      `${this.api}/${id}/pago`,
      data
    );

  }
  */

  //=========================================
  // CAMBIAR ESTADO
  //=========================================

  /*
  actualizarEstado(
    id:number,
    estado:string
  ):Observable<any>{

    return this.http.put(
      `${this.api}/${id}/estado`,
      {
        estado
      }
    );

  }
  */

  //=========================================
  // ELIMINAR
  //=========================================

  /*
  eliminar(id:number):Observable<any>{

    return this.http.delete(
      `${this.api}/${id}`
    );

  }
  */

  //=========================================
  // OBTENER MÁQUINAS
  //=========================================

  /*
  obtenerMaquinas():Observable<any>{

    return this.http.get(
      `${environment.apiUrl}/maquinas`
    );

  }
  */

  //=========================================
  // BUSCAR ALUMNOS
  //=========================================

  /*
  buscarAlumnos(
    texto:string
  ):Observable<any>{

    return this.http.get(
      `${environment.apiUrl}/alumnos?buscar=${texto}`
    );

  }
  */

}
