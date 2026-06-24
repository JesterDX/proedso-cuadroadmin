import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { MatriculaHistorial } from '../../models/matricula-historial.model';
import { MatriculaPdfService } from '../../services/matricula-pdf.service';
import { MatriculasService } from '../../services/matriculas.service';
import { AdjuntosService } from '../../services/adjuntos.service';
import {
    MatriculaFinanzasData,
    MatriculaFinanzasResumen,
    MatriculaCuota
} from '../../models/matricula-finanzas.model';
import { MatriculaDetail as MatriculaDetailModel } from '../../models/matricula-detail.model';
import { MatriculaMaquina } from '../../models/matricula-maquina.model';
import { Adjunto } from '../../models/adjunto.model';
import { ApiResponse } from '../../../../core/models/api-response.model';
@Component({
    selector: 'app-matricula-detail',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './matricula-detail.html',
    styleUrl: './matricula-detail.scss',

})
export class MatriculaDetail implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private matriculasService = inject(MatriculasService);
    private cd = inject(ChangeDetectorRef);
    private adjuntosService = inject(AdjuntosService);
    private matriculaPdfService = inject(MatriculaPdfService);
    maquinas: MatriculaMaquina[] = [];
    maquinasSeleccionadas: number[] = [];
    historial: MatriculaHistorial[] = [];
    loadingHistorial = false;
    subiendoArchivo = false;
    archivoCronograma: File | null = null;
    detalle: MatriculaDetailModel | null = null;
    loading = false;
    adjuntos: Adjunto[] = [];
    archivoSeleccionado: File | null = null;
    tipoArchivo = 'PLAN_ESTUDIOS';
    observacionArchivo = '';
    dragOverArchivo = false;
    errorMsg = '';
    finanzasResumen: MatriculaFinanzasResumen | null = null;
    cuotas: MatriculaCuota[] = [];
    loadingFinanzas = false;
    activeTab: 'matriculas' | 'practicas' | 'finanzas' | 'archivos' | 'historial' = 'matriculas';

    ngOnInit(): void {
        const id = Number(this.route.snapshot.paramMap.get('id'));

        if (!id) {
            this.errorMsg = 'ID de matrícula no válido.';
            this.cd.detectChanges();
            return;
        }

        this.cargarDetalle(id);
    }

    cargarDetalle(id: number): void {
        this.loading = true;
        this.errorMsg = '';
        this.cargarFinanzas(id);
        this.cd.detectChanges();
        this.cargarHistorial(id);
        this.matriculasService.obtenerDetalle(id).subscribe({
            next: (resp: ApiResponse<MatriculaDetailModel>) => {
                this.detalle = resp.data;
                this.cargarMaquinas(id);
                this.loading = false;
                this.cd.detectChanges();
                this.cargarAdjuntos(id);
            },
            error: (err: any) => {
                console.error('Error al cargar detalle de matrícula:', err);
                this.errorMsg = err?.error?.message || 'No se pudo cargar la ficha de matrícula.';
                this.loading = false;
                this.cd.detectChanges();
            }
        });
    }
    cargarFinanzas(id: number): void {
        this.loadingFinanzas = true;
        this.cd.detectChanges();

        this.matriculasService.obtenerFinanzas(id).subscribe({
            next: (resp: ApiResponse<MatriculaFinanzasData>) => {
                this.finanzasResumen = resp.data?.resumen ?? null;
                this.cuotas = resp.data?.cuotas ?? [];
                this.loadingFinanzas = false;
                this.cd.detectChanges();
            },
            error: (err: any) => {
                console.error('Error al cargar finanzas de la matrícula:', err);
                this.finanzasResumen = null;
                this.cuotas = [];
                this.loadingFinanzas = false;
                this.cd.detectChanges();
            }
        });
    }

    cambiarTab(tab: 'matriculas' | 'practicas' | 'finanzas' | 'archivos' | 'historial'): void {
        this.activeTab = tab;
        this.cd.detectChanges();
    }
    async generarCronograma(): Promise<void> {
        if (!this.detalle) {
            return;
        }

        // 1. Detectamos la URL de la foto de forma segura aquí en el componente
        const urlFotoDetectada =
            (this.detalle as any).foto_url ||
            (this.detalle as any).foto ||
            (this.detalle as any).alumno_foto ||
            (this.detalle as any).foto_alumno ||
            (this.detalle as any).alumno?.foto ||
            (this.detalle as any).alumno?.foto_url || '';

        // 2. Armamos el objeto estructurado que irá al PDF
        const matriculaPdf = {
            ...this.detalle,
            foto_url: urlFotoDetectada, // URL estandarizada
            cuotas: this.cuotas,
            resumen: this.finanzasResumen,
            maquinas: this.maquinas

        };
        console.log('=================================');
        console.log('DETALLE PDF');
        console.log(matriculaPdf);
        console.log('MAQUINAS PDF');
        console.table(this.maquinas);
        console.log('=================================');
        const nombreAlumno = `${this.detalle.alumno_nombres} ${this.detalle.alumno_apellidos}`;

        try {
            // 3. Enviamos los datos limpios al servicio
            await this.matriculaPdfService.generarCronogramaPDF(
                matriculaPdf,
                nombreAlumno,
                this.detalle.plan_nombre || 'Plan de Formación'
            );
        } catch (error) {
            console.error('Error al generar el PDF:', error);
        }
    }

    getSeguroLabel(valor?: string | null): string {
        if (!valor) return 'No especificado';

        const normalizado = valor.trim().toUpperCase();

        switch (normalizado) {
            case 'SIS':
                return 'SIS';
            case 'ESSALUD':
                return 'EsSalud';
            case 'PARTICULAR':
                return 'Particular';
            case 'NO CUENTO':
            case 'NO TENGO':
                return 'No cuenta';
            case 'N.A.':
            case 'NA':
                return 'N.A.';
            default:
                return valor;
        }
    }

    getSeguroClass(valor?: string | null): string {
        if (!valor) return 'status-chip status-chip--neutral';

        const normalizado = valor.trim().toUpperCase();

        switch (normalizado) {
            case 'SIS':
                return 'status-chip status-chip--sis';
            case 'ESSALUD':
                return 'status-chip status-chip--essalud';
            case 'PARTICULAR':
                return 'status-chip status-chip--particular';
            case 'NO CUENTO':
            case 'NO TENGO':
                return 'status-chip status-chip--sin-seguro';
            case 'N.A.':
            case 'NA':
                return 'status-chip status-chip--neutral';
            default:
                return 'status-chip status-chip--neutral';
        }
    }
    formatMonto(valor?: number | null): string {
        const monto = Number(valor ?? 0);
        return `S/ ${monto.toFixed(2)}`;
    }

    getClaseEstadoCuota(estado?: string | null): string {
        switch ((estado || '').toUpperCase()) {
            case 'PAGADO':
                return 'estado-badge estado-badge--egresado';
            case 'PENDIENTE':
                return 'estado-badge estado-badge--reserva';
            case 'VENCIDO':
                return 'estado-badge estado-badge--retirado';
            case 'PARCIAL':
                return 'estado-badge estado-badge--matriculado';
            default:
                return 'estado-badge';
        }
    }

    volver(): void {
        this.router.navigate(['/matriculas']);
    }

getFotoUrl(foto_url?: string | null): string {
  if (!foto_url) return '';

  // 1. Si ya es una URL limpia de internet (Cloudinary), devuélvela intacta
  if (foto_url.startsWith('http://') || foto_url.startsWith('https://')) {
    return foto_url;
  }

  // 2. Si el backend guardó el path con el prefijo duplicado o local de Cloudinary
  //    Ejemplo: /uploads/alumnos/proedso/alumnos/... o proedso/alumnos/...
  if (foto_url.includes('proedso/alumnos/')) {
    // Extraemos solo la parte limpia de Cloudinary (proedso/alumnos/nombre_archivo)
    const index = foto_url.indexOf('proedso/alumnos/');
    const pathLimpio = foto_url.substring(index);
    
    // ⚠️ IMPORTANTE: Pon aquí tu Cloud Name real de Cloudinary en lugar de 'tu_cloud_name'
    return `https://res.cloudinary.com/dfx6p5sjd/image/upload/${pathLimpio}`;
  }

  // 3. Para los alumnos antiguos del servidor local (que no tienen "proedso/" en su ruta)
  //    Si ya trae "/uploads/alumnos/", lo dejamos pasar; si no, se lo agregamos.
  if (foto_url.startsWith('/uploads/')) {
    return foto_url;
  }
  
  return `/uploads/alumnos/${foto_url}`;
}

    getIniciales(): string {
        if (!this.detalle) return '';
        const n = this.detalle.alumno_nombres?.trim()?.charAt(0) || '';
        const a = this.detalle.alumno_apellidos?.trim()?.charAt(0) || '';
        return `${n}${a}`.toUpperCase();
    }

    formatFechaVista(fecha?: string | null): string {
        if (!fecha) return '-';

        const date = new Date(fecha);

        if (Number.isNaN(date.getTime())) {
            const soloFecha = fecha.split('T')[0];
            const partes = soloFecha.split('-');
            if (partes.length !== 3) return fecha;
            const [anio, mes, dia] = partes;
            return `${dia}-${mes}-${anio}`;
        }

        const anio = date.getFullYear();
        const mes = String(date.getMonth() + 1).padStart(2, '0');
        const dia = String(date.getDate()).padStart(2, '0');

        return `${dia}-${mes}-${anio}`;
    }

    getEdad(fechaNacimiento?: string | null): string {
        if (!fechaNacimiento) return '-';

        const nacimiento = new Date(fechaNacimiento);
        if (Number.isNaN(nacimiento.getTime())) return '-';

        const hoy = new Date();
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const mes = hoy.getMonth() - nacimiento.getMonth();

        if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
            edad--;
        }

        return `${edad} años`;
    }
    cargarMaquinas(id: number): void {
        this.matriculasService.listarMaquinas(id).subscribe({
            next: (resp) => {
                this.maquinas = resp.data ?? [];

                this.maquinasSeleccionadas = this.maquinas
                    .filter(m => !m.es_regalo)
                    .map(m => m.maquina_id);

                this.cd.detectChanges();
            },
            error: (err: any) => {
                console.error('Error al cargar máquinas de la matrícula:', err);
            }
        });
    }
    cargarAdjuntos(id: number): void {
        this.adjuntosService.listar('matriculas', id).subscribe({
            next: (resp: ApiResponse<Adjunto[]>) => {
                this.adjuntos = resp.data ?? [];
                this.cd.detectChanges();
            },
            error: (err: any) => {
                console.error('Error al cargar adjuntos:', err);
            }
        });
    }

    cargarHistorial(id: number): void {
        this.loadingHistorial = true;

        this.matriculasService.obtenerHistorial(id).subscribe({
            next: (resp: ApiResponse<any[]>) => {
                this.historial = resp.data ?? [];
                this.loadingHistorial = false;
                this.cd.detectChanges();
            },
            error: () => {
                this.historial = [];
                this.loadingHistorial = false;
                this.cd.detectChanges();
            }
        });
    }

    onArchivoSeleccionado(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.archivoSeleccionado = input.files?.[0] ?? null;
    }

    subirArchivo(): void {
        if (!this.detalle) return;

        if (!this.archivoSeleccionado) {
            Swal.fire({
                icon: 'warning',
                title: 'Archivo faltante',
                text: 'Selecciona un archivo antes de subir.'
            });
            return;
        }

        const formData = new FormData();
        formData.append('modulo', 'matriculas');
        formData.append('registro_id', String(this.detalle.id));
        formData.append('tipo_archivo', this.tipoArchivo);
        formData.append('observaciones', this.observacionArchivo);
        formData.append('archivo', this.archivoSeleccionado);

        this.subiendoArchivo = true;
        this.cd.detectChanges();

        this.adjuntosService.subir(formData).subscribe({
            next: (resp: ApiResponse<Adjunto>) => {
                this.subiendoArchivo = false;
                this.archivoSeleccionado = null;
                this.observacionArchivo = '';
                this.cd.detectChanges();

                Swal.fire({
                    icon: 'success',
                    title: 'Archivo subido',
                    text: resp.message || 'El archivo fue subido correctamente.'
                });

                this.cargarAdjuntos(this.detalle!.id);
            },
            error: (err: any) => {
                this.subiendoArchivo = false;
                this.cd.detectChanges();

                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: err?.error?.message || 'No se pudo subir el archivo.'
                });
            }
        });
    }
    getConceptoClase(codigo?: string | null): string {
        switch ((codigo || '').toUpperCase()) {
            case 'MATRICULA':
                return 'badge badge--matricula';
            case 'CUOTA':
                return 'badge badge--cuota';
            case 'CERTIFICACION':
                return 'badge badge--certificacion';
            default:
                return 'badge';
        }
    }
    getConceptoLabel(codigo?: string | null): string {
        switch ((codigo || '').toUpperCase()) {
            case 'MATRICULA':
                return 'Pago de Matrícula';
            case 'CUOTA':
                return 'Cuota mensual';
            case 'CERTIFICACION':
                return 'Carpeta y Certificación';
            default:
                return codigo || '-';
        }
    }
getArchivoUrl(url?: string | null): string {
        if (!url) return '#';

        // 1. Si ya es una URL limpia de internet, devuélvela intacta
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }

        // 2. Si contiene la estructura de carpetas de Cloudinary (ej: proedso/documentos/...)
        if (url.includes('proedso/')) {
            const index = url.indexOf('proedso/');
            const pathLimpio = url.substring(index);
            
            return `https://res.cloudinary.com/dfx6p5sjd/image/upload/${pathLimpio}`;
        }

        // 3. Para archivos antiguos que apuntaban a la carpeta local de subidas
        if (url.startsWith('/uploads/')) {
            return url;
        }

        return `/uploads/matriculas/${url}`;
    }
    eliminarAdjunto(id: number): void {
        Swal.fire({
            icon: 'warning',
            title: '¿Eliminar archivo?',
            text: 'Esta acción no se puede deshacer.',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (!result.isConfirmed) return;

            this.adjuntosService.eliminar(id).subscribe({
                next: () => {
                    Swal.fire('Eliminado', 'Archivo eliminado correctamente', 'success');
                    this.cargarAdjuntos(this.detalle!.id);
                },
                error: () => {
                    Swal.fire('Error', 'No se pudo eliminar el archivo', 'error');
                }
            });
        });
    }

    onDragOverArchivo(event: DragEvent): void {
        event.preventDefault();
        this.dragOverArchivo = true;
        this.cd.detectChanges();
    }

    onDragLeaveArchivo(event: DragEvent): void {
        event.preventDefault();
        this.dragOverArchivo = false;
        this.cd.detectChanges();
    }

    onDropArchivo(event: DragEvent): void {
        event.preventDefault();
        this.dragOverArchivo = false;

        const file = event.dataTransfer?.files?.[0] ?? null;
        if (file) {
            this.archivoSeleccionado = file;
        }

        this.cd.detectChanges();
    }
    editarMatricula(): void {
        if (!this.detalle) return;

        this.router.navigate(
            ['/matriculas'],
            {
                queryParams: {
                    editar: this.detalle.id
                }
            }
        );
    }


    getClaseEstado(): string {
        switch (this.detalle?.estado_codigo) {
            case 'MATRICULADO':
                return 'estado-badge estado-badge--matriculado';
            case 'EGRESADO':
                return 'estado-badge estado-badge--egresado';
            case 'RETIRADO':
                return 'estado-badge estado-badge--retirado';
            case 'RESERVA':
                return 'estado-badge estado-badge--reserva';
            default:
                return 'estado-badge';
        }
    }
}
