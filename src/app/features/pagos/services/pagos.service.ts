import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PagoResumen } from '../models/pago.model';

@Injectable({
  providedIn: 'root'
})
export class PagosService {

  private http = inject(HttpClient);
  private apiUrl = '/api/pagos';

  resumen(): Observable<PagoResumen[]> {
    return this.http.get<PagoResumen[]>(`${this.apiUrl}/resumen`);
  }

  detalle(matriculaId: number) {
    return this.http.get<any[]>(`${this.apiUrl}/${matriculaId}`);
  }

  historial(matriculaId: number) {
    return this.http.get<any[]>(`${this.apiUrl}/${matriculaId}/historial`);
  }

  // 👇 AGREGADO: Método para buscar matrículas
  buscarMatriculas(search: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/buscar-matriculas?search=${search}`);
  }

  recalcularPlan(data: {
    plan_pago_alumno_id: number;
    tipo: 'MENSUAL' | 'QUINCENAL';
    fecha_inicio: string;
    cantidad_cuotas: number;
  }) {
    return this.http.post(`${this.apiUrl}/recalcular-plan`, data);
  }

  crearPlanManual(data: any) { // Usamos 'any' aquí para evitar conflictos de tipado estricto con los nulls temporales del frontend
    return this.http.post(`${this.apiUrl}/manual`, data);
  }

  actualizarFechas(data: {
    cuota_id: number;
    fecha_vencimiento: string;
  }[]) {
    return this.http.put(`${this.apiUrl}/actualizar-fechas`, data);
  }

  registrarPago(data: any) {
    return this.http.post(`${this.apiUrl}`, data);
  }
}