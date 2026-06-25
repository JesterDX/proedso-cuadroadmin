import { Component, inject, OnInit } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardService {

  private http = inject(HttpClient);

  private apiUrl = 'https://proedso-back-wtdl.onrender.com/api/dashboard';

  getDashboard() {
    return this.http.get<any>(this.apiUrl);
  }
}
