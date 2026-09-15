import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import {
  debounceTime,
  switchMap,
  takeUntil,
  catchError
} from 'rxjs/operators';
import {
  PracticasService,
  AlumnoDisponible,
  MaquinaAlumno,
  FiltrosAlumnosDisponibles
} from '../../services/practicas.service';

interface GrupoMes {
  mes: number;
  nombreMes: string;
  alumnos: AlumnoDisponible[];
}

interface GrupoAnio {
  anio: number;
  totalAlumnos: number;
  meses: GrupoMes[];
}

interface SeleccionMaquina {
  seleccionado: boolean;
  sesionesAAsignar: number;
}

const NOMBRES_MES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

@Component({
  selector: 'app-nueva-sesion-practica',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './practicas-list.html',
  styleUrl: './practicas-list.scss'
})
export class PracticasListComponent implements OnInit, OnDestroy {

  private practicasService = inject(PracticasService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  // ==========================================
  // FILTROS
  // ==========================================
  fechaSesion = '';
  filtroMes: number | null = null;
  filtroAnio: number | null = null;
  filtroCurso: number | null = null;
  filtroMaquina: number | null = null;
  filtroNombre = '';

  meses = NOMBRES_MES.map((nombre, i) => ({ id: i + 1, nombre }));
  cursos: any[] = [];
  maquinas: any[] = [];

  lugaresPractica: any[] = [];
  lugarPracticaId: number | null = null;

  // ==========================================
  // ESTADO
  // ==========================================
  loadingLista = false;
  errorCarga = '';
  gruposPorAnio: GrupoAnio[] = [];
  aniosDisponibles: number[] = [];

  // clave: `${matriculaId}_${maquinaId}`
  private selecciones = new Map<string, SeleccionMaquina>();

  // ==========================================
  // FILTRADO AUTOMÁTICO (debounced)
  // ==========================================
  private filtrosChange$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.cargarLugaresPractica();

    this.filtrosChange$
      .pipe(
        debounceTime(350),
        switchMap(() => this.buscarAlumnos()),
        takeUntil(this.destroy$)
      )
      .subscribe();

    this.filtrosChange$.next();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFiltroChange(): void {
    this.filtrosChange$.next();
  }

  onNombreChange(valor: string): void {
    this.filtroNombre = valor;
    this.filtrosChange$.next();
  }

  // ==========================================
  // MANEJO DE LUGARES DE PRÁCTICA
  // ==========================================
  cargarLugaresPractica(idSeleccionar?: number): void {
    this.practicasService.obtenerLugaresPractica().subscribe({
      next: (resp: any) => {
        this.lugaresPractica = resp.data ?? resp;

        if (this.lugaresPractica.length > 0) {
          if (idSeleccionar) {
            this.lugarPracticaId = idSeleccionar;
          } else if (!this.lugarPracticaId) {
            this.lugarPracticaId = this.lugaresPractica[0].id;
          }
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los lugares de práctica.'
        });
      }
    });
  }

  onLugarPracticaChange(event: Event): void {
    const target = event.target as HTMLSelectElement;

    if (target.value === '__NUEVO_LUGAR__') {
      this.crearNuevoLugarPractica();
    }
  }

  crearNuevoLugarPractica(): void {
    Swal.fire({
      title: 'Nuevo Lugar de Práctica',
      input: 'text',
      inputLabel: 'Nombre de la sede o lugar de práctica',
      inputPlaceholder: 'Ej. Cantera Central, Sede Laredo...',
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2563eb',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Debes ingresar un nombre válido para el lugar de práctica';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const nombreLugar = result.value.trim();

        Swal.fire({
          title: 'Guardando...',
          text: 'Registrando el nuevo lugar de práctica',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        this.practicasService.crearLugarPractica({ nombre: nombreLugar }).subscribe({
          next: (resp: any) => {
            const nuevoLugar = resp.data ?? resp;

            Swal.fire({
              icon: 'success',
              title: '¡Lugar creado!',
              text: `El lugar "${nombreLugar}" ha sido guardado exitosamente.`,
              timer: 2000,
              showConfirmButton: false
            });

            this.cargarLugaresPractica(nuevoLugar.id);
          },
          error: (err) => {
            console.error('❌ Error al crear lugar de práctica:', err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err.error?.error ?? err.error?.message ?? 'No se pudo guardar el lugar de práctica.'
            });

            if (this.lugaresPractica.length > 0) {
              this.lugarPracticaId = this.lugaresPractica[0].id;
            }
          }
        });
      } else {
        if (this.lugaresPractica.length > 0) {
          this.lugarPracticaId = this.lugaresPractica[0].id;
        }
      }
    });
  }

  // ==========================================
  // CARGA DE ALUMNOS
  // ==========================================
  private buscarAlumnos() {
    this.loadingLista = true;
    this.errorCarga = '';

    const filtros: FiltrosAlumnosDisponibles = {
      anio: this.filtroAnio,
      mes: this.filtroMes,
      cursoId: this.filtroCurso,
      maquinaId: this.filtroMaquina,
      nombre: this.filtroNombre
    };

    return this.practicasService.listarAlumnosDisponibles(filtros).pipe(
      switchMap((resp: any) => {
        const alumnos: AlumnoDisponible[] = resp?.data ?? [];

        this.agruparPorAnioYMes(alumnos);
        this.actualizarAniosDisponibles(alumnos);
        this.selecciones.clear();

        this.loadingLista = false;
        this.cdr.detectChanges();

        return of(alumnos);
      }),
      catchError((err) => {
        console.error('❌ listarAlumnosDisponibles:', err);

        this.errorCarga = 'No se pudo cargar la lista de alumnos.';
        this.gruposPorAnio = [];
        this.loadingLista = false;
        this.cdr.detectChanges();

        return of([]);
      })
    );
  }

  private agruparPorAnioYMes(alumnos: AlumnoDisponible[]): void {
    const mapaAnios = new Map<number, Map<number, AlumnoDisponible[]>>();

    for (const alumno of alumnos) {
      if (!mapaAnios.has(alumno.anio)) {
        mapaAnios.set(alumno.anio, new Map());
      }

      const mapaMeses = mapaAnios.get(alumno.anio)!;

      if (!mapaMeses.has(alumno.mes)) {
        mapaMeses.set(alumno.mes, []);
      }

      mapaMeses.get(alumno.mes)!.push(alumno);
    }

    this.gruposPorAnio = Array.from(mapaAnios.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([anio, mapaMeses]) => {
        const meses: GrupoMes[] = Array.from(mapaMeses.entries())
          .sort((a, b) => b[0] - a[0])
          .map(([mes, alumnosDelMes]) => ({
            mes,
            nombreMes: NOMBRES_MES[mes - 1] ?? `Mes ${mes}`,
            alumnos: alumnosDelMes.sort((a, b) => a.alumno.localeCompare(b.alumno))
          }));

        const totalAlumnos = meses.reduce((acc, m) => acc + m.alumnos.length, 0);

        return { anio, totalAlumnos, meses };
      });
  }

  private actualizarAniosDisponibles(alumnos: AlumnoDisponible[]): void {
    const set = new Set<number>();
    alumnos.forEach(a => set.add(a.anio));
    this.aniosDisponibles = Array.from(set).sort((a, b) => b - a);
  }

  // ==========================================
  // SEMÁFORO FINANCIERO
  // ==========================================
  claseEstado(alumno: AlumnoDisponible): string {
    switch (alumno.estado_financiero) {
      case 'MOROSO': return 'estado-rojo';
      case 'PENDIENTE': return 'estado-naranja';
      default: return 'estado-verde';
    }
  }

  etiquetaEstado(alumno: AlumnoDisponible): string {
    switch (alumno.estado_financiero) {
      case 'MOROSO': return 'Moroso';
      case 'PENDIENTE': return 'Pago pendiente';
      default: return 'Al día';
    }
  }

  puedeSeleccionar(alumno: AlumnoDisponible): boolean {
    return alumno.estado_financiero !== 'MOROSO';
  }

  mensajeBloqueo(alumno: AlumnoDisponible): string {
    return `${alumno.alumno} tiene cuotas vencidas y no puede asignarse a prácticas hasta regularizar su pago.`;
  }

  mensajeAdvertencia(alumno: AlumnoDisponible): string {
    return `${alumno.alumno} tiene una cuota pendiente. Puede asignarse, pero se recomienda avisarle sobre su pago.`;
  }

  // ==========================================
  // SELECCIÓN DE SESIONES POR MÁQUINA
  // ==========================================
  private clave(matriculaId: number, maquinaId: number): string {
    return `${matriculaId}_${maquinaId}`;
  }

  estaSeleccionada(alumno: AlumnoDisponible, maquina: MaquinaAlumno): boolean {
    return this.selecciones.get(this.clave(alumno.matricula_id, maquina.maquina_id))?.seleccionado ?? false;
  }

  sesionesSeleccionadas(alumno: AlumnoDisponible, maquina: MaquinaAlumno): number {
    return this.selecciones.get(this.clave(alumno.matricula_id, maquina.maquina_id))?.sesionesAAsignar ?? 1;
  }

  toggleMaquina(alumno: AlumnoDisponible, maquina: MaquinaAlumno, checked: boolean): void {
    if (!this.puedeSeleccionar(alumno) || maquina.sesiones_restantes <= 0) {
      return;
    }

    const key = this.clave(alumno.matricula_id, maquina.maquina_id);
    const actual = this.selecciones.get(key) ?? { seleccionado: false, sesionesAAsignar: 1 };

    actual.seleccionado = checked;
    if (actual.sesionesAAsignar < 1) {
      actual.sesionesAAsignar = 1;
    }

    this.selecciones.set(key, actual);
  }

  actualizarSesiones(alumno: AlumnoDisponible, maquina: MaquinaAlumno, valor: number): void {
    const key = this.clave(alumno.matricula_id, maquina.maquina_id);
    const actual = this.selecciones.get(key) ?? { seleccionado: true, sesionesAAsignar: 1 };

    let sesiones = Number(valor);

    if (isNaN(sesiones) || sesiones < 1) {
      sesiones = 1;
    }

    if (sesiones > maquina.sesiones_restantes) {
      Swal.fire({
        icon: 'warning',
        title: 'Sesiones insuficientes',
        html: `
          <b>${alumno.alumno}</b><br><br>
          Máquina: <b>${maquina.maquina}</b><br><br>
          Solo dispone de <b>${maquina.sesiones_restantes}</b> sesiones restantes.
        `
      });

      sesiones = maquina.sesiones_restantes;
    }

    actual.sesionesAAsignar = sesiones;
    this.selecciones.set(key, actual);
  }

  // ==========================================
  // RESUMEN
  // ==========================================
  get totalAlumnosSeleccionados(): number {
    const matriculas = new Set<number>();
    this.gruposPorAnio.forEach(grupo =>
      grupo.meses.forEach(gm =>
        gm.alumnos.forEach(alumno =>
          alumno.maquinas.forEach(maquina => {
            if (this.estaSeleccionada(alumno, maquina)) {
              matriculas.add(alumno.matricula_id);
            }
          })
        )
      )
    );
    return matriculas.size;
  }

  get totalSesionesSeleccionadas(): number {
    let total = 0;
    this.selecciones.forEach(sel => {
      if (sel.seleccionado) total += sel.sesionesAAsignar;
    });
    return total;
  }

  get puedeGenerarSesion(): boolean {
    return !!this.fechaSesion && this.totalAlumnosSeleccionados > 0;
  }

  get hayResultados(): boolean {
    return this.gruposPorAnio.length > 0;
  }

  // ==========================================
  // ACCIÓN PRINCIPAL: GENERAR SESIÓN
  // ==========================================
  generarSesionPractica(): void {
    const detalle: any[] = [];

    this.gruposPorAnio.forEach(grupo => {
      grupo.meses.forEach(mes => {
        mes.alumnos.forEach(alumno => {
          alumno.maquinas.forEach(maquina => {
            if (this.estaSeleccionada(alumno, maquina)) {
              detalle.push({
                matriculaId: alumno.matricula_id,
                matriculaMaquinaId: maquina.matricula_maquina_id,
                maquinaId: maquina.maquina_id,
                sesiones: this.sesionesSeleccionadas(alumno, maquina)
              });
            }
          });
        });
      });
    });

    if (detalle.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin alumnos',
        text: 'Debes seleccionar al menos un alumno y máquina para generar la sesión.'
      });
      return;
    }

    const payload = {
      fecha: this.fechaSesion,
      lugarPracticaId: this.lugarPracticaId,
      detalle
    };

    console.log('🚀 Enviando Payload:', payload);

    this.practicasService.crearSesionGrupal(payload).subscribe({
      next: (resp: any) => {
        const idSesion = resp?.data?.id ?? resp?.data ?? resp?.id;

        if (!idSesion) {
          console.error('❌ No se encontró un ID válido en la respuesta:', resp);
          Swal.fire({
            icon: 'error',
            title: 'Error de respuesta',
            text: 'La sesión se creó pero no se recibió un ID válido para el cronograma.'
          });
          return;
        }

        Swal.fire({
          icon: 'success',
          title: 'Sesión creada',
          text: 'Ahora organizarás el cronograma.',
          confirmButtonText: 'Ir al cronograma',
          confirmButtonColor: '#2563eb'
        }).then(() => {
          this.router.navigate(['/practicas/cronograma', idSesion]);
        });
      },
      error: (err) => {
        console.error('❌ Error HTTP al crear sesión:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.error?.error ?? err.error?.message ?? 'No se pudo crear la sesión.'
        });
      }
    });
  }
}
