import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard implements OnInit {

  private dashboardService = inject(DashboardService);
  private cd = inject(ChangeDetectorRef);

  dashboard: any = {};
  loading = false;

  ngOnInit(): void {
    this.cargarDashboard();
  }

  cargarDashboard(): void {
    this.loading = true;

    this.dashboardService.getDashboard().subscribe({
      next: (resp: any) => {
        console.log('DASHBOARD API:', resp);

        this.dashboard = resp.data ?? {};

        this.loading = false;
        this.cd.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
      }
    });
  }
}
