import { Component, OnInit, inject, ChangeDetectorRef, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';
import { BaseChartDirective } from 'ng2-charts';
import {
  Chart as ChartJS,
  registerables,
  ChartConfiguration,
  ChartOptions
} from 'chart.js';

ChartJS.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard implements OnInit {
  private dashboardService = inject(DashboardService);
  private cdr = inject(ChangeDetectorRef);

  // Referencia a todos los gráficos en la vista
  @ViewChildren(BaseChartDirective) charts?: QueryList<BaseChartDirective>;

  dashboard: any = {};
  loading = false;

  // Gráfico 1: Distribución Académica
  estadosChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: [],
    datasets: [{ data: [], backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#7c3aed'] }]
  };

  // Gráfico 2: Demanda de Maquinaria (%)
  maquinasChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: '% de Demanda por Equipo',
      backgroundColor: '#2563eb',
      borderRadius: 6
    }]
  };

  // Gráfico 3: Solvencia del Alumnado (%)
  solvenciaChartData: ChartConfiguration<'pie'>['data'] = {
    labels: ['Al Día (%)', 'Con Deuda Pendiente (%)'],
    datasets: [{ data: [0, 0], backgroundColor: ['#10b981', '#ef4444'] }]
  };

  chartOptions: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 12 } } },
      tooltip: {
        callbacks: {
          label: (context: any) => ` ${context.label}: ${context.raw}%`
        }
      }
    }
  };

  barOptions: ChartOptions<'bar'> = {
    ...this.chartOptions,
    scales: {
      y: { max: 100, ticks: { callback: (val) => `${val}%` } }
    }
  };

  ngOnInit(): void {
    this.cargarDashboard();
  }

  cargarDashboard(): void {
    this.loading = true;
    this.dashboardService.getDashboard().subscribe({
      next: (resp: any) => {
        this.dashboard = resp.data ?? {};
        const kpis = this.dashboard.kpis ?? {};
        const graficos = this.dashboard.graficos ?? {};

        // Actualizar Solvencia
        this.solvenciaChartData = {
          ...this.solvenciaChartData,
          datasets: [{ ...this.solvenciaChartData.datasets[0], data: [kpis.porcentajeAlDia ?? 0, kpis.porcentajeMorosidad ?? 0] }]
        };

        // Actualizar Estados Académicos
        if (graficos.distribucionEstados) {
          this.estadosChartData = {
            labels: graficos.distribucionEstados.map((e: any) => e.nombre),
            datasets: [{ ...this.estadosChartData.datasets[0], data: graficos.distribucionEstados.map((e: any) => Number(e.porcentaje)) }]
          };
        }

        // Actualizar Demanda de Maquinaria
        if (graficos.demandaMaquinas) {
          this.maquinasChartData = {
            labels: graficos.demandaMaquinas.map((m: any) => m.nombre),
            datasets: [{ ...this.maquinasChartData.datasets[0], data: graficos.demandaMaquinas.map((m: any) => Number(m.porcentaje_demanda)) }]
          };
        }

        this.loading = false;

        // 1. Forzamos la detección de cambios en la vista de Angular
        this.cdr.detectChanges();

        // 2. Notificamos a Chart.js para que vuelva a renderizar las capas de los canvas
        this.charts?.forEach(chart => chart.update());
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
