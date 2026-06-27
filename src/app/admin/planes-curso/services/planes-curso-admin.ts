import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PlanCurso } from '../models/plan-curso.model';

@Injectable({
  providedIn: 'root'
})
export class PlanesCursoService {

  private http = inject(HttpClient);

  private apiUrl = 'https://proedso-back-wtdl.onrender.com/api/planes-curso';

  listar(): Observable<PlanCurso[]> {
    return this.http.get<PlanCurso[]>(this.apiUrl);
  }

  crear(data: any) {
    return this.http.post(this.apiUrl, data);
  }

  editar(id: number, data: any) {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  eliminar(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

}
