import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Maquina } from '../models/maquina.model';

@Injectable({
  providedIn: 'root'
})
export class MaquinasService {
  private http = inject(HttpClient);
  private apiUrl = 'https://proedso-back-wtdl.onrender.com/api/maquinas';

  listar(): Observable<ApiResponse<Maquina[]>> {
    return this.http.get<ApiResponse<Maquina[]>>(this.apiUrl);
  }
}
