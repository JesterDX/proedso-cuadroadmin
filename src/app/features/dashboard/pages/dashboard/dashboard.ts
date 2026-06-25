import { Component, inject, OnInit } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {

  private dashboardService = inject(DashboardService);

  dashboard: any = null;
  
  cargarDashboard() {
    this.dashboardService.getDashboard().subscribe({
      next: (resp) => {
        console.log('RESP API:', resp); // 🔥 IMPORTANTE
        this.dashboard = resp.data;
      },
      error: (err) => {
        console.error('ERROR API:', err);
      }
    });
  }
}
