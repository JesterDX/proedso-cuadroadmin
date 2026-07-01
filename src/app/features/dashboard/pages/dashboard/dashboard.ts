import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import {
  ChartConfiguration,
  ChartData,
  ChartOptions
} from 'chart.js';

import { DashboardService } from '../../services/dashboard.service';
import {
  Dashboard as DashboardModel,
  EstadoAlumno
} from '../../models/dashboard.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard implements OnInit {

  private dashboardService = inject(DashboardService);
  private cd = inject(ChangeDetectorRef);

  loading = false;

  dashboard!: DashboardModel;

  // ==========================
  // KPI
  // ==========================

  get resumen() {
    return this.dashboard?.resumen;
  }

  // ==========================
  // DONUT
  // ==========================

  donutChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [
          '#2563eb',
          '#10b981',
          '#f59e0b',
          '#ef4444',
          '#8b5cf6',
          '#06b6d4'
        ],
        borderWidth: 0,
        hoverOffset: 12
      }
    ]
  };

  donutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {

      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 18,
          font: {
            size: 13
          }
        }
      }

    },

    cutout: '70%'
  };

  // ==========================
  // BARRAS PAGOS
  // ==========================

  pagosChartData: ChartData<'bar'> = {

    labels: ['Al día', 'Con deuda'],

    datasets: [
      {
        label: 'Alumnos',

        data: [],

        borderRadius: 8,

        backgroundColor: [
          '#10b981',
          '#ef4444'
        ]
      }
    ]

  };

  pagosOptions: ChartOptions<'bar'> = {

    responsive: true,

    maintainAspectRatio: false,

    plugins: {

      legend: {
        display: false
      }

    },

    scales: {

      y: {

        beginAtZero: true,

        ticks: {
          precision: 0
        }

      }

    }

  };

  // ==========================
  // LINEA
  // (temporal)
  // ==========================

  lineChartData: ChartData<'line'> = {

    labels: [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun'
    ],

    datasets: [

      {

        label: 'Matrículas',

        data: [0,0,0,0,0,0],

        tension: .4,

        fill: true,

        borderWidth: 3,

        backgroundColor: 'rgba(37,99,235,.15)',

        borderColor: '#2563eb',

        pointRadius: 5

      }

    ]

  };

  lineOptions: ChartOptions<'line'> = {

    responsive: true,

    maintainAspectRatio: false,

    plugins: {

      legend: {

        display: false

      }

    }

  };

  // ==========================
  // INIT
  // ==========================

  ngOnInit(): void {

    this.cargarDashboard();

  }

  // ==========================
  // API
  // ==========================

  cargarDashboard(): void {

    this.loading = true;

    this.dashboardService.getDashboard().subscribe({

      next: (resp) => {

        console.log(resp);

        this.dashboard = resp.data;

        this.cargarGraficoEstados(
          this.dashboard.graficos.estadosAlumno
        );

        this.cargarGraficoPagos();

        this.loading = false;

        this.cd.detectChanges();

      },

      error: (error) => {

        console.error(error);

        this.loading = false;

      }

    });

  }

  // ==========================
  // GRAFICO DONA
  // ==========================

  cargarGraficoEstados(estados: EstadoAlumno[]): void {

    this.donutChartData = {

      labels: estados.map(e => e.nombre),

      datasets: [

        {

          data: estados.map(e => e.cantidad),

          backgroundColor: [

            '#2563eb',

            '#10b981',

            '#f59e0b',

            '#ef4444',

            '#7c3aed'

          ],

          borderWidth: 0,

          hoverOffset: 12

        }

      ]

    };

  }

  // ==========================
  // PAGOS
  // ==========================

  cargarGraficoPagos(): void {

    if (!this.resumen) return;

    this.pagosChartData = {

      labels: [

        'Al día',

        'Con deuda'

      ],

      datasets: [

        {

          data: [

            this.resumen.alumnosAlDia,

            this.resumen.alumnosConDeuda

          ],

          backgroundColor: [

            '#10b981',

            '#ef4444'

          ],

          borderRadius: 8

        }

      ]

    };

  }

}
