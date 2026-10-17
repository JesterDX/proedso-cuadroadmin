import { Injectable, inject, signal, computed } from '@angular/core';
import { forkJoin, interval, startWith, switchMap, catchError, of, Subscription } from 'rxjs';

import { MatriculasService } from '../../features/matriculas/services/matriculas.service';
import { AlumnosService } from '../../features/alumnos/services/alumnos.service';

export type NivelReserva = 'HOY' | 'URGENTE' | 'PROXIMA' | 'VENCIDA';

export interface ReservaAlerta {
  matriculaId: number;
  alumno: string;
  fechaFin: string;
  dias: number;
  nivel: NivelReserva;
  texto: string;
}

@Injectable({ providedIn: 'root' })
export class ReservaAlertasService {

  private matriculasService = inject(MatriculasService);
  private alumnosService = inject(AlumnosService);

  private readonly DIAS_CON_SONIDO = [3, 2, 0];
  private readonly DIAS_VISIBLES = 3;

  alertas = signal<ReservaAlerta[]>([]);
  total = computed(() => this.alertas().length);
  hayCritica = computed(() => this.alertas().some(a => a.dias <= 0));

  private audioCtx?: AudioContext;
  private sonidoPendiente: NivelReserva | null = null;
  private sub?: Subscription;
  private iniciado = false;

  iniciar(): void {
    if (this.iniciado) return;
    this.iniciado = true;

    const desbloquear = () => {
      this.getAudio().resume().then(() => {
        if (this.sonidoPendiente) {
          this.reproducir(this.sonidoPendiente);
          this.sonidoPendiente = null;
        }
      });
    };
    document.addEventListener('click', desbloquear, { once: true });
    document.addEventListener('keydown', desbloquear, { once: true });

    this.sub = interval(5 * 60 * 1000).pipe(
      startWith(0),
      switchMap(() =>
        forkJoin({
          matriculas: this.matriculasService.listar('RESERVA', '', null, null),
          alumnos: this.alumnosService.listar('', true)
        }).pipe(catchError(() => of(null)))
      )
    ).subscribe((resp: any) => {
      if (!resp) return;
      this.procesar(resp.matriculas?.data ?? [], resp.alumnos?.data ?? []);
    });
  }

  detener(): void {
    this.sub?.unsubscribe();
    this.iniciado = false;
  }

  private procesar(matriculas: any[], alumnos: any[]): void {
    const alertas: ReservaAlerta[] = [];

    for (const m of matriculas) {
      const dias = this.diasRestantes(m.fecha_reserva_fin);
      if (dias === null || dias > this.DIAS_VISIBLES) continue;

      const a = alumnos.find((x: any) => Number(x.id) === Number(m.alumno_id));
      const nombre = a ? `${a.apellidos ?? ''} ${a.nombres ?? ''}`.trim() : 'Alumno';

      alertas.push({
        matriculaId: m.id,
        alumno: nombre,
        fechaFin: String(m.fecha_reserva_fin).split('T')[0],
        dias,
        nivel: dias < 0 ? 'VENCIDA' : dias === 0 ? 'HOY' : dias <= 2 ? 'URGENTE' : 'PROXIMA',
        texto: this.texto(dias)
      });
    }

    alertas.sort((a, b) => a.dias - b.dias);
    this.alertas.set(alertas);
    this.evaluarSonido(alertas);
  }

  private evaluarSonido(alertas: ReservaAlerta[]): void {
    const hoy = new Date().toISOString().slice(0, 10);
    let nivelMax: NivelReserva | null = null;

    for (const a of alertas) {
      if (!this.DIAS_CON_SONIDO.includes(a.dias)) continue;

      const key = `reserva-sonido:${hoy}:${a.matriculaId}:${a.dias}`;
      try {
        if (localStorage.getItem(key)) continue;
        localStorage.setItem(key, '1');
      } catch { /* sin storage: suena igual */ }

      if (nivelMax === null || a.dias < this.diasDeNivel(nivelMax)) {
        nivelMax = a.nivel;
      }
    }

    if (!nivelMax) return;

    if (this.getAudio().state === 'running') {
      this.reproducir(nivelMax);
    } else {
      this.sonidoPendiente = nivelMax;
    }
  }

  private diasDeNivel(n: NivelReserva): number {
    return n === 'HOY' ? 0 : n === 'URGENTE' ? 2 : 3;
  }

  private getAudio(): AudioContext {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioCtx;
  }

  reproducir(nivel: NivelReserva): void {
    const patron: Record<NivelReserva, number[]> = {
      PROXIMA: [660],
      URGENTE: [660, 784],
      HOY: [784, 988, 784],
      VENCIDA: [784, 988, 784]
    };

    const ctx = this.getAudio();
    patron[nivel].forEach((freq, i) => {
      const t0 = ctx.currentTime + i * 0.22;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.35);

      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.4);
    });
  }

  private diasRestantes(fin?: string | null): number | null {
    if (!fin) return null;
    const [y, m, d] = String(fin).split('T')[0].split('-').map(Number);
    if (!y || !m || !d) return null;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return Math.round((new Date(y, m - 1, d).getTime() - hoy.getTime()) / 86400000);
  }

  private texto(dias: number): string {
    if (dias < 0) return `Venció hace ${Math.abs(dias)} día(s)`;
    if (dias === 0) return 'La reserva vence HOY';
    if (dias === 1) return 'Vence mañana';
    return `Vence en ${dias} días`;
  }
}
