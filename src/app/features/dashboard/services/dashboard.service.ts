import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {

  private dashboardService = inject(DashboardService);
  private cd = inject(ChangeDetectorRef);

  dashboard: any = null;
  loading = false;

  ngOnInit(): void {
    this.cargarDashboard();
  }

  cargarDashboard() {
    this.loading = true;

    this.dashboardService.getDashboard().subscribe({
      next: (resp) => {
        console.log('DASHBOARD API:', resp);

        this.dashboard = { ...resp.data }; // 👈 clave PRO
        this.loading = false;

        this.cd.detectChanges(); // 👈 igual que matrículas
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }
}
