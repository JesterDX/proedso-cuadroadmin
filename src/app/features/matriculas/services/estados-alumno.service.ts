import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response.model';
import { EstadoAlumno } from '../models/estado-alumno.model';

@Injectable({
  providedIn: 'root'
})
export class EstadosAlumnoService {
  private http = inject(HttpClient);
  private apiUrl = '/api/estados-alumno';

  listar(): Observable<ApiResponse<EstadoAlumno[]>> {
    return this.http.get<ApiResponse<EstadoAlumno[]>>(this.apiUrl);
  }
}