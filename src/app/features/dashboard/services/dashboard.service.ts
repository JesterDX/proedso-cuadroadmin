import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private http = inject(HttpClient);

  private apiUrl = 'https://proedso-back-wtdl.onrender.com/api/';

  getDashboard() {
    return this.http.get<any>(this.apiUrl);
  }
}
