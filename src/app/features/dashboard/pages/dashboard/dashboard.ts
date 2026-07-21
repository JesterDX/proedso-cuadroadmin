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

  @ViewChildren(BaseChartDirective) charts?: QueryList<BaseChartDirective>;

  // Inicialización segura con valores en 0
  dashboard: any = {
    kpis: { 
      totalAlumnos: 0, 
      porcentajeAlumnosActivos: 0, 
      porcentajeInactivos: 0,
      totalMaquinas: 0, 
      porcentajeOperatividadFlota: 0 
    },
    graficos: { distribucionEstados: [], demandaMaquinas: [] }
  };
  
  loading = true;

  // Gráfico 1: Estado de Matrículas (Donut)
  estadosChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['Cargando...'],
    datasets: [{ data: [100], backgroundColor: ['#e2e8f0'] }]
  };

  // Gráfico 2: Demanda de Maquinaria (Barras)
  maquinasChartData: ChartConfiguration<'bar'>['data'] = {
    labels: ['Cargando...'],
    datasets: [{
      data: [0],
      label: '% de Demanda por Equipo',
      backgroundColor: '#2563eb',
      borderRadius: 6
    }]
  };

  // Gráfico 3: Proporción de Actividad (Pie)
  solvenciaChartData: ChartConfiguration<'pie'>['data'] = {
    labels: ['Alumnos Activos (%)', 'Alumnos Inactivos (%)'],
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
        // Compatibilidad: absorbe la respuesta venga directa o envuelta en { data: ... }
        const data = resp?.data?.data || resp?.data || resp || {};
        
        this.dashboard.kpis = data.kpis || this.dashboard.kpis;
        const graficos = data.graficos || {};

        // 1. Gráfico de Actividad (Activos vs Inactivos)
        this.solvenciaChartData = {
          ...this.solvenciaChartData,
          datasets: [{ 
            ...this.solvenciaChartData.datasets[0], 
            data: [
              Number(this.dashboard.kpis.porcentajeAlumnosActivos) || 0, 
              Number(this.dashboard.kpis.porcentajeInactivos) || 0
            ] 
          }]
        };

        // 2. Gráfico de Estados de Matrículas
        if (graficos.distribucionEstados && graficos.distribucionEstados.length > 0) {
          this.estadosChartData = {
            labels: graficos.distribucionEstados.map((e: any) => e.nombre || 'Sin estado'),
            datasets: [{ 
              ...this.estadosChartData.datasets[0], 
              data: graficos.distribucionEstados.map((e: any) => Number(e.porcentaje) || 0),
              backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#7c3aed']
            }]
          };
        }

        // 3. Gráfico de Demanda de Equipos
        if (graficos.demandaMaquinas && graficos.demandaMaquinas.length > 0) {
          this.maquinasChartData = {
            labels: graficos.demandaMaquinas.map((m: any) => m.nombre || 'Equipo'),
            datasets: [{ 
              ...this.maquinasChartData.datasets[0], 
              data: graficos.demandaMaquinas.map((m: any) => Number(m.porcentaje_demanda) || 0) 
            }]
          };
        }

        this.loading = false;
        this.cdr.detectChanges();
        
        // Damos 50ms al DOM para renderizar antes de decirle a Chart.js que dibuje las barras
        setTimeout(() => {
          this.charts?.forEach(chart => chart.update());
        }, 50);
      },
      error: (err) => {
        console.error('Error al obtener datos de Render:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
