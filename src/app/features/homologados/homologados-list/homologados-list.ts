import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HomologadosService {

  private http = inject(HttpClient);

  private readonly api =
    'https://proedso-back-wtdl.onrender.com/api/homologaciones';

  // =========================================================
  // LISTAR TODAS LAS HOMOLOGACIONES
  // =========================================================

  listar(): Observable<any> {
    return this.http.get<any>(this.api);
  }

  // =========================================================
  // OBTENER UNA HOMOLOGACIÓN
  // =========================================================

  obtener(id: number): Observable<any> {
    return this.http.get<any>(`${this.api}/${id}`);
  }

  // =========================================================
  // CREAR
  // =========================================================

  crear(data: any): Observable<any> {
    return this.http.post<any>(this.api, data);
  }

  // =========================================================
  // ACTUALIZAR
  // =========================================================

  actualizar(id: number, data: any): Observable<any> {
    return this.http.put<any>(
      `${this.api}/${id}`,
      data
    );
  }

  // =========================================================
  // ELIMINAR
  // =========================================================

  eliminar(id: number): Observable<any> {
    return this.http.delete<any>(
      `${this.api}/${id}`
    );
  }

  // =========================================================
  // IMPORTAR DESDE GOOGLE SHEETS
  // =========================================================

  importarSheets(): Observable<any> {
    return this.http.post<any>(
      `${this.api}/importar-sheets`,
      {}
    );
  }
}
