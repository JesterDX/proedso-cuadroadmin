import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response.model';
import { PlanCurso } from '../models/plan-curso.model';

@Injectable({
  providedIn: 'root'
})
export class PlanesCursoService {
  private http = inject(HttpClient);
  private apiUrl = 'https://proedso-back-wtdl.onrender.com/api/planes-curso';

  listar(): Observable<ApiResponse<PlanCurso[]>> {
    return this.http.get<ApiResponse<PlanCurso[]>>(this.apiUrl);
  }
}
