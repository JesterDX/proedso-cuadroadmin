import { Component, inject, OnInit } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {

  private dashboardService = inject(DashboardService);

  dashboard: any = {};

  ngOnInit(): void {
    this.cargarDashboard();
  }

  cargarDashboard() {
    this.dashboardService.getDashboard().subscribe({
      next: (resp) => {
        this.dashboard = resp.data;
      }
    });
  }
}
