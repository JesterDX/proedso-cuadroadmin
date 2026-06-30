import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TipoCurso } from '../models/tipo-curso.model';

@Injectable({
  providedIn: 'root'
})
export class TiposCursoService {

  private http = inject(HttpClient);

  private apiUrl = 'https://proedso-back-wtdl.onrender.com/api/tipos-curso';

  listar(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  crear(data: {
    codigo: string;
    nombre: string;
    duracion_meses: number;
    cantidad_maquinas: number;
    activo: boolean;
  }) {
    return this.http.post(this.apiUrl, data);
  }

  actualizar(id: number, data: any) {
  return this.http.put(`${this.apiUrl}/${id}`, data);
}

cambiarEstado(id: number, activo: boolean) {
  return this.http.patch(`${this.apiUrl}/${id}/estado`, {
    activo
  });
}

}
