import { Component, OnInit, inject, ChangeDetectorRef, ViewChildren, QueryList, ChangeDetectionStrategy } from '@angular/core';
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
  styleUrls: ['./dashboard.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush // Control total sobre la detección de cambios
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
    this.cdr.markForCheck();
    this.cdr.detectChanges(); // Fuerza actualizar el estado de "Cargando..."
    
    this.dashboardService.getDashboard().subscribe({
      next: (resp: any) => {
        // CONSOLA DE DEPURACIÓN: Revisa esto con F12 en tu navegador si algo sigue en 0
        console.log('RESPUESTA CRUDA DE RENDER:', resp);

        // Extracción infalible de la data sin importar cuántas veces esté envuelta
        const rawData = resp?.data?.data || resp?.data || resp || {};
        
        // Mapeo seguro de KPIs
        const kpis = rawData.kpis || {};
        this.dashboard.kpis = {
          totalAlumnos: Number(kpis.totalAlumnos) || 0,
          porcentajeAlumnosActivos: Number(kpis.porcentajeAlumnosActivos) || 0,
          porcentajeInactivos: Number(kpis.porcentajeInactivos) || 0,
          totalMaquinas: Number(kpis.totalMaquinas) || 0,
          porcentajeOperatividadFlota: Number(kpis.porcentajeOperatividadFlota) || 0
        };

        const graficos = rawData.graficos || {};

        // 1. Gráfico de Actividad (Activos vs Inactivos)
        this.solvenciaChartData = {
          ...this.solvenciaChartData,
          datasets: [{ 
            ...this.solvenciaChartData.datasets[0], 
            data: [
              this.dashboard.kpis.porcentajeAlumnosActivos, 
              this.dashboard.kpis.porcentajeInactivos
            ] 
          }]
        };

        // 2. Gráfico de Estados de Matrículas
        if (graficos.distribucionEstados && Array.isArray(graficos.distribucionEstados)) {
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
        if (graficos.demandaMaquinas && Array.isArray(graficos.demandaMaquinas)) {
          this.maquinasChartData = {
            labels: graficos.demandaMaquinas.map((m: any) => m.nombre || 'Equipo'),
            datasets: [{ 
              ...this.maquinasChartData.datasets[0], 
              data: graficos.demandaMaquinas.map((m: any) => Number(m.porcentaje_demanda) || 0) 
            }]
          };
        }

        this.loading = false;
        
        // DETECCIÓN DE CAMBIOS 1: Avisamos a Angular que los datos ya están en memoria
        this.cdr.markForCheck();
        this.cdr.detectChanges();
        
        // DETECCIÓN DE CAMBIOS 2: Damos tiempo al DOM de crear las etiquetas <canvas> y repintamos
        setTimeout(() => {
          this.charts?.forEach(chart => chart.update());
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        }, 100);
      },
      error: (err) => {
        console.error('Error al obtener datos de Render:', err);
        this.loading = false;
        
        // DETECCIÓN DE CAMBIOS EN ERROR: Evita que la pantalla se quede congelada en "Cargando..."
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }
    });
  }
}
