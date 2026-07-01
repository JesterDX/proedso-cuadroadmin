import { Component, OnInit, inject } from '@angular/core';
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

  dashboard: any = {};
  loading = false;

  // =========================
  // CHARTS DATA
  // =========================

  donutChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['Matriculados', 'Egresados', 'Retirados'],
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ['#10b981', '#7c3aed', '#ef4444']
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
        data: [10, 20, 30, 40, 50, 60],
        label: 'Matrículas',
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,0.1)',
        fill: true
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

  cargarDashboard(): void {
    this.loading = true;

    this.dashboardService.getDashboard().subscribe({
      next: (resp: any) => {

        console.log('DASHBOARD API:', resp);

        this.dashboard = resp.data ?? {};

        const r = this.dashboard.resumen;

        // 🔥 ACTUALIZAR CHARTS CON API
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

        this.loading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
      }
    });
  }
}
