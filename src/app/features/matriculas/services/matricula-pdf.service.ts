import { Injectable } from '@angular/core';
import html2pdf from 'html2pdf.js';

@Injectable({
  providedIn: 'root'
})
export class MatriculaPdfService {

  public async generarCronogramaPDF(matricula: any, nombreAlumno: string, nombrePlan: string): Promise<void> {
    console.log('%c🚀 GENERANDO PDF CORPORATIVO PROEDSO V10...', 'color: #002e6e; font-weight: bold; font-size: 14px;');

    const cuotasReales = (matricula.cuotas && matricula.cuotas.length > 0)
      ? this.mapearCuotasBackend(matricula.cuotas)
      : this.generarCuotasCronogramaRespaldo(matricula.fecha_inicio || matricula.fecha_matricula || new Date().toISOString());

    const maquinasBackend = matricula.maquinas || matricula.plan_curso?.maquinas || [
      { nombre: 'Excavadora Hidráulica', horas: 40 },
      { nombre: 'Cargador Frontal', horas: 20 },
      { nombre: 'Retroexcavadora', horas: 20 }
    ];

    const maquinasReales = maquinasBackend.map((maq: any) => {
      const nombreDeLaMaquina = maq.maquina_nombre || maq.nombre || maq.maquina || 'Equipo';
      return {
        nombre: nombreDeLaMaquina,
        horas: maq.horas_asignadas || maq.horas || 0,
        ruta: this.obtenerRutaImagenMaquina(nombreDeLaMaquina)
      };
    });

    const maquinasConBase64 = await Promise.all(
      maquinasReales.map(async (maq: any) => {
        const rutaAbsoluta = `${window.location.origin}/${maq.ruta}`;
        const base64 = await this.cargarImagenBase64(rutaAbsoluta);
        return { ...maq, base64: base64 || '' };
      })
    );
    const elementoHtml = this.construirPlantillaHtml(
      matricula,
      nombreAlumno,
      nombrePlan,
      cuotasReales,
      maquinasConBase64
    );

    const opciones: any = {
      margin: 0, 
      filename: `Cronograma_${nombreAlumno.trim().replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 3, 
        useCORS: true, 
        logging: false,
        letterRendering: true
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    document.body.appendChild(elementoHtml);
    await html2pdf().set(opciones).from(elementoHtml).save();
    document.body.removeChild(elementoHtml);
  }

  private obtenerRutaImagenMaquina(nombreMaquina: string): string {
    if (!nombreMaquina) return 'img/maquinas/excavadora_hidraulica.png';

    const nombre = nombreMaquina.toLowerCase().trim();
    const rutaBase = 'img/maquinas/';

    if (nombre.includes('retroexcavadora')) return rutaBase + 'retroexcavadora.png';
    if (nombre.includes('excavadora')) return rutaBase + 'excavadora_hidraulica.png';
    if (nombre.includes('cargador frontal') || nombre.includes('cargador')) return rutaBase + 'cargador_frontal.png';
    if (nombre.includes('mini')) return rutaBase + 'mini_Cargador.png';
    if (nombre.includes('montacargas') || nombre.includes('monta')) return rutaBase + 'monta_cargas.png';
    if (nombre.includes('motoniveladora') || nombre.includes('moto')) return rutaBase + 'Moto_niveladora.png';
    if (nombre.includes('rodillo')) return rutaBase + 'rodillo_compactador.png';
    if (nombre.includes('agrícola') || nombre.includes('agricola')) return rutaBase + 'tractor agricola.png';
    if (nombre.includes('cadena')) return rutaBase + 'tractor_Cadenas.png';
    if (nombre.includes('volquete')) return rutaBase + 'volquete.png';
    if (nombre.includes('camioneta')) return rutaBase + 'camioneta.png';

    return rutaBase + 'excavadora_hidraulica.png';
  }

  private cargarImagenBase64(url: string): Promise<string | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png', 1.0));
          } else {
            resolve(null);
          }
        } catch (error) {
          resolve(null);
        }
      };

      img.onerror = () => resolve(null);
      img.src = url.includes('?') ? `${url}&t=${Date.now()}` : `${url}?t=${Date.now()}`;
    });
  }

  private mapearCuotasBackend(cuotasDesdeBack: any[]): any[] {
    return cuotasDesdeBack.map((c, index) => {
      const concepto = c.concepto_nombre || c.concepto || c.detalle || (index === 0 ? 'Matrícula' : `Cuota ${String(index).padStart(2, '0')}`);
      const fecha = c.fecha_vencimiento || c.fecha_programada || c.fecha_pago || c.fecha;
      const monto = c.monto_programado ?? c.monto ?? c.importe ?? c.total ?? 0;
      return { concepto, fecha: this.formatearFechaVista(fecha), importe: `S/ ${Number(monto).toFixed(2)}` };
    });
  }

  private generarCuotasCronogramaRespaldo(fechaInicioStr: string): any[] {
    const lista = [];
    const partes = fechaInicioStr.split('T')[0].split('-');
    const anio = Number(partes[0]), mes = Number(partes[1]), dia = Number(partes[2]);

    lista.push({ concepto: 'Matrícula', fecha: this.formatearFechaVista(fechaInicioStr), importe: 'S/ 190.00' });

    for (let i = 1; i <= 12; i++) {
      const fechaCuota = new Date(anio, mes - 1 + (i - 1), dia);
      lista.push({
        concepto: `Cuota ${i}`,
        fecha: this.formatearFechaVista(`${fechaCuota.getFullYear()}-${String(fechaCuota.getMonth() + 1).padStart(2, '0')}-${String(fechaCuota.getDate()).padStart(2, '0')}`),
        importe: 'S/ 480.00'
      });
    }
    return lista;
  }

  private formatearFechaVista(fecha?: string | null): string {
    if (!fecha) return '-';
    const soloFecha = fecha.split('T')[0];
    const partes = soloFecha.split('-');
    if (partes.length !== 3) return fecha;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  private construirPlantillaHtml(
    matricula: any,
    nombreAlumno: string,
    nombrePlan: string,
    cuotas: any[],
    maquinas: any[]
  ): HTMLElement {
    const contenedor = document.createElement('div');

    const cAzul = '#002e6e';
    const cCeleste = '#0274be';
    const cAmarillo = '#ffcc00';
    const cTextoGris = '#475569';
    const fontMain = "'Inter', 'Helvetica Neue', 'Arial', sans-serif";

    contenedor.style.fontFamily = fontMain;
    contenedor.style.width = '794px'; 
    contenedor.style.height = '1123px';
    contenedor.style.backgroundColor = '#ffffff';
    contenedor.style.boxSizing = 'border-box';
    contenedor.style.position = 'relative';
    contenedor.style.overflow = 'hidden';

    let cuotasHtml = '';
    cuotas.forEach((c, index) => {
      const bg = index % 2 === 0 ? '#ffffff' : '#f8fafc';
      cuotasHtml += `
        <tr style="background-color: ${bg};">
          <td style="padding: 7px 14px; font-size: 11px; color: #334155; font-weight: 600; border-bottom: 1px solid #f1f5f9;">${c.concepto}</td>
          <td style="padding: 7px 14px; font-size: 11px; text-align: center; color: ${cTextoGris}; border-bottom: 1px solid #f1f5f9;">${c.fecha}</td>
          <td style="padding: 7px 14px; font-size: 11px; font-weight: 700; text-align: right; color: ${cAzul}; border-bottom: 1px solid #f1f5f9;">${c.importe}</td>
        </tr>`;
    });

    let maquinasGridHtml = '';
    maquinas.forEach(m => {
      maquinasGridHtml += `
        <div style="flex: 0 0 calc(33.33% - 8px); background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 6px; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: space-between; min-height: 85px;">
          <div style="height: 45px; width: 100%; display: flex; align-items: center; justify-content: center; margin-bottom: 6px;">
            ${m.base64 
              ? `<img src="${m.base64}" style="max-height: 100%; max-width: 90%; object-fit: contain;">` 
              : `<div style="font-size: 20px;">🚜</div>`
            }
          </div>
          <div style="font-size: 8.5px; font-weight: 700; color: ${cAzul}; text-transform: uppercase; text-align: center; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2;">
            ${m.nombre}
          </div>
        </div>`;
    });

    contenedor.innerHTML = `
      <div style="padding: 45px 45px 20px 45px; display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div style="color: ${cCeleste}; font-size: 12px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px;">Escuela de Operadores</div>
          <h1 style="color: ${cAzul}; font-size: 30px; font-weight: 800; margin: 0; line-height: 1; letter-spacing: -0.5px;">CRONOGRAMA DE ACTIVIDADES</h1>
          <div style="width: 60px; height: 4px; background-color: ${cCeleste}; margin-top: 12px; border-radius: 2px;"></div>
        </div>
        <div style="text-align: right; color: ${cAzul}; font-weight: 800; font-size: 24px; letter-spacing: -0.5px;">
          PROEDSO
        </div>
      </div>

      <div style="margin: 0 45px 25px 45px; background: #fafafa; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 11px; color: ${cTextoGris}; font-weight: 500;">
          PROGRAMA ACADÉMICO: <span style="color: ${cAzul}; font-weight: 700; text-transform: uppercase; font-size: 11.5px;">${nombrePlan}</span>
        </div>
        <div style="display: flex; gap: 24px; font-size: 11px; font-weight: 600;">
          <div style="color: ${cAzul};">👤 ALUMNO: <span style="font-weight: 700; color: #000;">${nombreAlumno.toUpperCase()}</span></div>
          <div style="color: ${cAzul}; border-left: 1px solid #cbd5e1; padding-left: 24px;">📅 INICIO: <span style="font-weight: 700; color: #000;">${this.formatearFechaVista(matricula.fecha_inicio || matricula.fecha_matricula)}</span></div>
        </div>
      </div>

      <div style="display: flex; gap: 30px; padding: 0 45px; height: 800px; box-sizing: border-box;">
        
        <div style="width: 36%; display: flex; flex-direction: column; gap: 20px;">
          
          <div style="background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden;">
            <div style="background: ${cAzul}; color: #ffffff; padding: 10px; font-weight: 700; font-size: 10.5px; text-align: center; letter-spacing: 0.5px;">DATOS DE MATRÍCULA</div>
            <div style="padding: 14px; display: flex; flex-direction: column; gap: 10px; font-size: 11px;">
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;"><span style="color: ${cTextoGris}; font-weight: 500;">DURACIÓN</span><span style="color: ${cAzul}; font-weight: 700;">12 MESES</span></div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;"><span style="color: ${cTextoGris}; font-weight: 500;">MODALIDAD</span><span style="color: ${cAzul}; font-weight: 700;">PRESENCIAL</span></div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;"><span style="color: ${cTextoGris}; font-weight: 500;">FRECUENCIA</span><span style="color: ${cAzul}; font-weight: 700;">DOMINGOS</span></div>
              <div style="display: flex; justify-content: space-between;"><span style="color: ${cTextoGris}; font-weight: 500;">REGISTRO ID</span><span style="color: #ef4444; font-weight: 700;">MAT-${matricula.id || '000'}</span></div>
            </div>
          </div>

          <div style="background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden;">
            <div style="background: ${cAzul}; color: #ffffff; padding: 10px; font-weight: 700; font-size: 10.5px; text-align: center;">ESTRUCTURA HORARIA</div>
            <table style="width: 100%; border-collapse: collapse; font-size: 10.5px;">
              <tr style="background: #ffffff;"><td style="padding: 9px 12px; border-bottom: 1px solid #f1f5f9; font-weight: 700; color: ${cCeleste}; width: 110px;">08:00 - 10:00</td><td style="padding: 9px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; font-weight: 500;">Seguridad Operacional</td></tr>
              <tr style="background: #f8fafc;"><td style="padding: 9px 12px; border-bottom: 1px solid #f1f5f9; font-weight: 700; color: ${cCeleste};">10:00 - 12:15</td><td style="padding: 9px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; font-weight: 500;">Teoría Aplicada</td></tr>
              <tr style="background: #ffffff;"><td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #94a3b8;">12:15 - 01:00</td><td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; color: #94a3b8; font-style: italic;">Receso / Almuerzo</td></tr>
              <tr style="background: #f8fafc;"><td style="padding: 9px 12px; font-weight: 700; color: ${cCeleste};">01:00 - 05:00</td><td style="padding: 9px 12px; color: #334155; font-weight: 700;">Práctica en Campo</td></tr>
            </table>
          </div>

          <div style="background: #fffbeb; border: 1px solid #fde68a; padding: 14px; border-radius: 8px;">
            <div style="color: #b45309; font-weight: 700; font-size: 11px; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">⚠️ REQUERIMIENTO FINANCIERO</div>
            <div style="font-size: 10px; color: #78350f; line-height: 1.4; font-weight: 500; text-align: justify;">Para mantener el acceso continuo al circuito de prácticas de campo y la reserva de maquinaria pesada, el alumno deberá abonar sus cuotas en las fechas límite establecidas.</div>
          </div>

        </div>

        <div style="width: 64%; display: flex; flex-direction: column; gap: 20px;">
          
          <div style="border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #ffffff;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: ${cAzul}; color: #ffffff;">
                  <th style="padding: 10px 14px; font-size: 11px; font-weight: 700; text-align: left; letter-spacing: 0.3px;">DESCRIPCIÓN DEL CONCEPTO</th>
                  <th style="padding: 10px 14px; font-size: 11px; font-weight: 700; text-align: center; width: 105px;">VENCIMIENTO</th>
                  <th style="padding: 10px 14px; font-size: 11px; font-weight: 700; text-align: right; width: 85px;">MONTO TOTAL</th>
                </tr>
              </thead>
              <tbody>
                ${cuotasHtml}
              </tbody>
            </table>
          </div>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px;">
            <div style="color: ${cAzul}; font-weight: 800; font-size: 11px; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px; border-left: 3px solid ${cCeleste}; padding-left: 8px;">
              Equipamiento Técnico Asignado
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 12px; justify-content: flex-start;">
              ${maquinasGridHtml}
            </div>
          </div>

        </div>
      </div>
      
      <div style="position: absolute; bottom: 0; left: 0; right: 0; background: ${cAzul}; border-top: 3px solid ${cAmarillo}; color: #ffffff; padding: 14px 45px; display: flex; justify-content: space-between; font-size: 10px; font-weight: 600; letter-spacing: 0.2px;">
        <div style="opacity: 0.95;">📞 944 123 456</div>
        <div style="opacity: 0.95;">📍 Av. Los Constructores 123, Lima - Perú</div>
        <div style="opacity: 0.95; font-weight: 700;">🌐 www.proedso.com.pe</div>
      </div>
    `;

    return contenedor;
  }
}