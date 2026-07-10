import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { PlanCurso } from '../models/plan-curso.model';
import { PlanMaquina } from '../models/plan-maquina.model';
@Injectable({
  providedIn: 'root'
})
export class PlanesCursoService {

  private http = inject(HttpClient);

  private apiUrl = 'https://proedso-back-wtdl.onrender.com/api/planes-curso';

  listarActivos() {
    return this.http
      .get<{ ok: boolean; data: PlanCurso[] }>(`${this.apiUrl}/activos`)
      .pipe(map(r => r.data));
  }

  crear(data: any) {
    return this.http.post(this.apiUrl, data);
  }

  editar(id: number, data: any) {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  cambiarEstado(id: number) {
    return this.http.patch(`${this.apiUrl}/${id}/estado`, {});
  }

  listarTiposCurso() {
    return this.http.get<any>(
      'https://proedso-back-wtdl.onrender.com/api/tipos-curso/activos'
    );
  }
  obtenerPorId(id:number){

  return this.http.get<any>(
    `${this.apiUrl}/${id}`
    );
  }
  obtenerMaquinas(id:number){

  return this.http.get<{
    ok:boolean,
    data:PlanMaquina[]
  }>(
    `${this.apiUrl}/${id}/maquinas`
  );

}
}
