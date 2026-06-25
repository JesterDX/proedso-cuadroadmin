import { Component, inject, OnInit } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard implements OnInit {

  private dashboardService = inject(DashboardService);

  dashboard: any = {};

  ngOnInit(): void {
    this.cargarDashboard();
  }

  cargarDashboard(): void {
    this.dashboardService.getDashboard().subscribe({
      next: (resp: any) => {
        this.dashboard = resp.data;
      },
      error: (err: any) => {
        console.error(err);
      }
    });
  }
}
