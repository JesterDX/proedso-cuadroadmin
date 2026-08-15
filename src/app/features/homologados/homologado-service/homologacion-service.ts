import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HomologadosService {

  private readonly http = inject(HttpClient);

  private readonly api =
    'https://proedso-back-wtdl.onrender.com/api/homologaciones';


  // ============================================================
  // LISTAR HOMOLOGACIONES
  // GET /api/homologaciones
  // ============================================================

  listar(): Observable<any> {

    return this.http.get<any>(
      this.api
    );

  }


  // ============================================================
  // OBTENER HOMOLOGACIÓN
  // GET /api/homologaciones/:id
  // ============================================================

  obtener(
    id: number
  ): Observable<any> {

    return this.http.get<any>(
      `${this.api}/${id}`
    );

  }


  // ============================================================
  // CREAR HOMOLOGACIÓN
  // POST /api/homologaciones
  // ============================================================

  crear(
    data: any
  ): Observable<any> {

    return this.http.post<any>(
      this.api,
      data
    );

  }


  // ============================================================
  // ACTUALIZAR HOMOLOGACIÓN
  // PUT /api/homologaciones/:id
  // ============================================================

  actualizar(
    id: number,
    data: any
  ): Observable<any> {

    return this.http.put<any>(
      `${this.api}/${id}`,
      data
    );

  }


  // ============================================================
  // ELIMINAR HOMOLOGACIÓN
  // DELETE /api/homologaciones/:id
  // ============================================================

  eliminar(
    id: number
  ): Observable<any> {

    return this.http.delete<any>(
      `${this.api}/${id}`
    );

  }


  // ============================================================
  // IMPORTAR GOOGLE SHEETS
  // POST /api/homologaciones/importar-sheets
  // ============================================================

  importarSheets(): Observable<any> {

    return this.http.post<any>(
      `${this.api}/importar-sheets`,
      {}
    );

  }

}
