import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { Maquina } from '../model/maquina.model';

@Injectable({
  providedIn: 'root'
})
export class MaquinasAdminService {

  private http = inject(HttpClient);

  private apiUrl = 'https://proedso-back-wtdl.onrender.com/api/maquinas';

  listar() {
    return this.http
      .get<{ ok: boolean; data: Maquina[] }>(this.apiUrl)
      .pipe(map(r => r.data));
  }

  listarTodas() {
  return this.http
    .get<any>(`${this.apiUrl}/todas`)
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

}
