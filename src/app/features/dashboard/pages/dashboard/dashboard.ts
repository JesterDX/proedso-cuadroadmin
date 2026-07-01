import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { BaseChartDirective } from 'ng2-charts';

// CHARTS
import { ChartConfiguration, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
  standalone: true,
  imports: [BaseChartDirective]
})
export class Dashboard implements OnInit {

  private dashboardService = inject(DashboardService);
  private cd = inject(ChangeDetectorRef);

  dashboard: any = {};
  loading = false;

  // =========================
  // CHART DATA
  // =========================

  donutChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['Matriculados', 'Egresados', 'Retirados'],
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ['#10b981', '#7c3aed', '#ef4444'],
        borderWidth: 0
      }
    ]
  };

  pagosChartData: ChartConfiguration<'bar'>['data'] = {
    labels: ['Al día', 'Con deuda'],
    datasets: [
      {
        data: [0, 0],
        backgroundColor: ['#10b981', '#ef4444']
      }
    ]
  };

  lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
    datasets: [
      {
        data: [0, 0, 0, 0, 0, 0],
        label: 'Matrículas',
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  // =========================
  // OPTIONS
  // =========================

  donutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  pagosOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { display: false }
    }
  };

  lineOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' }
    }
  };

  // =========================
  // INIT
  // =========================

  ngOnInit(): void {
    this.cargarDashboard();
  }

  // =========================
  // LOAD DATA
  // =========================

  cargarDashboard(): void {
    this.loading = true;

    this.dashboardService.getDashboard().subscribe({
      next: (resp: any) => {

        console.log('DASHBOARD API:', resp);

        const data = resp?.data ?? {};
        const r = data.resumen ?? {};

        this.dashboard = data;

        // =========================
        // DONUT CHART
        // =========================
        this.donutChartData = {
          ...this.donutChartData,
          datasets: [
            {
              ...this.donutChartData.datasets[0],
              data: [
                r.matriculados ?? 0,
                r.egresados ?? 0,
                r.retirados ?? 0
              ]
            }
          ]
        };

        // =========================
        // PAGOS CHART
        // =========================
        this.pagosChartData = {
          ...this.pagosChartData,
          datasets: [
            {
              ...this.pagosChartData.datasets[0],
              data: [
                r.alumnosAlDia ?? 0,
                r.alumnosConDeuda ?? 0
              ]
            }
          ]
        };

        // =========================
        // FORCE REFRESH (IMPORTANTE NG2-CHARTS)
        // =========================
        this.donutChartData = { ...this.donutChartData };
        this.pagosChartData = { ...this.pagosChartData };

        this.loading = false;

        // 🔥 Angular change detection fix
        this.cd.detectChanges();
      },

      error: (err: any) => {
        console.error(err);
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }
}
