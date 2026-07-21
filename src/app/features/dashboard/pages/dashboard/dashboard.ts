import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  
  // URL real de tu endpoint en Express (ajusta el puerto o dominio si es diferente)
  private apiUrl = 'http://localhost:3000/api/dashboard';

  getDashboard(): Observable<any> {
    return this.http.get<any>(this.apiUrl).pipe(
      catchError(error => {
        console.error('Error al solicitar datos del servidor:', error);
        return of({
          data: {
            kpis: { totalAlumnos: 0, porcentajeAlumnosActivos: 0, porcentajeInactivos: 0, totalMaquinas: 0, porcentajeOperatividadFlota: 0 },
            graficos: { distribucionEstados: [], demandaMaquinas: [] }
          }
        });
      })
    );
  }
}
