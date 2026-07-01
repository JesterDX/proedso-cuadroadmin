import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs';
import { PlanCurso } from '../models/plan-curso.model';

@Injectable({
  providedIn: 'root'
})
export class PlanesCursoService {

  private http = inject(HttpClient);

  private apiUrl = 'https://proedso-back-wtdl.onrender.com/api/planes-curso';

listarActivos(): Observable<PlanCurso[]> {
  return this.http
    .get<{ ok: boolean; data: PlanCurso[] }>(
      `${this.apiUrl}/activos`
    )
    .pipe(map(res => res.data));
}

  crear(data: any) {
    return this.http.post(this.apiUrl, data);
  }

  editar(id: number, data: any) {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

cambiarEstado(id:number){

   return this.http.patch(
      `${this.apiUrl}/${id}/estado`,
      {}
   );

}
}
