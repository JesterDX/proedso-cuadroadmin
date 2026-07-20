// ==========================================================================
// SCSS: LISTA DE PRÁCTICAS CON TABLA MINIMALISTA
// ==========================================================================

$c-bg: #f8fafc;
$c-surface: #ffffff;
$c-text-main: #0f172a;
$c-text-muted: #64748b;
$c-border: #e2e8f0;
$c-primary: #0f172a;

$radius-card: 8px;
$radius-sm: 4px;

:host {
  display: block;
  padding: 24px;
  background-color: $c-bg;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: $c-text-main;
  padding-bottom: 90px; // Espacio para la barra flotante inferior
}

// --- Header y Filtros ---
.main-header {
  margin-bottom: 20px;
  h1 { margin: 0 0 4px 0; font-size: 1.5rem; font-weight: 700; }
  p { margin: 0; color: $c-text-muted; font-size: 0.875rem; }
}

.card {
  background: $c-surface;
  border: 1px solid $c-border;
  border-radius: $radius-card;
  padding: 20px;
  margin-bottom: 24px;
}

.filtros-card {
  .card-header {
    margin-bottom: 16px;
    h3 { margin: 0 0 4px 0; font-size: 1rem; font-weight: 600; }
    p { margin: 0; font-size: 0.8125rem; color: $c-text-muted; }
  }
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;

  .filter-box {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
    min-width: 150px;

    label { font-size: 0.75rem; font-weight: 600; color: $c-text-muted; text-transform: uppercase; letter-spacing: 0.02em; }
    
    input, select {
      padding: 8px 12px;
      border: 1px solid $c-border;
      border-radius: $radius-sm;
      font-size: 0.875rem;
      background: #fff;
      color: $c-text-main;
      outline: none;
      &:focus { border-color: #3b82f6; }
    }
  }

  .loading-indicator { font-size: 0.875rem; font-weight: 500; color: #3b82f6; padding-bottom: 8px; }
}

// --- Grupos por Año / Mes ---
.grupo-anio {
  margin-top: 32px;
  
  .grupo-anio-header {
    display: flex;
    align-items: baseline;
    gap: 12px;
    border-bottom: 2px solid $c-text-main;
    padding-bottom: 8px;
    margin-bottom: 20px;
    
    h3 { margin: 0; font-size: 1.25rem; font-weight: 700; }
    .contador { font-size: 0.8125rem; color: $c-text-muted; font-weight: 500; }
  }
}

.grupo-mes {
  margin-bottom: 32px;

  .grupo-mes-header {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 12px;
    
    h4 { margin: 0; font-size: 1rem; font-weight: 600; color: #334155; }
    .contador { font-size: 0.75rem; color: $c-text-muted; }
  }
}

// ==========================================================================
// TABLA MINIMALISTA
// ==========================================================================
.table-container {
  background: $c-surface;
  border: 1px solid $c-border;
  border-radius: $radius-card;
  overflow-x: auto;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.tabla-alumnos {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.875rem;

  thead {
    background: #f8fafc;
    border-bottom: 1px solid $c-border;
    
    th {
      padding: 12px 16px;
      font-size: 0.75rem;
      font-weight: 600;
      color: $c-text-muted;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
  }

  tbody {
    tr {
      border-bottom: 1px solid $c-border;
      transition: background-color 0.15s ease;
      
      &:last-child { border-bottom: none; }
      &:hover { background-color: #f8fafc; }
      
      &.row-bloqueada {
        background-color: #fef2f2;
        .nombre-principal { color: #991b1b; }
      }
    }

    td {
      padding: 16px;
      vertical-align: top;
    }
  }

  // Dimensiones y estilos de columnas
  .col-alumno {
    width: 30%;
    min-width: 200px;
    
    .nombre-principal { font-weight: 600; color: $c-text-main; margin-bottom: 2px; }
    .curso-sub { font-size: 0.75rem; color: $c-text-muted; }
    
    .alerta {
      margin-top: 8px;
      font-size: 0.75rem;
      padding: 6px 10px;
      border-radius: $radius-sm;
      line-height: 1.3;
      
      &.alerta-roja { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
      &.alerta-naranja { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    }
  }

  .col-estado {
    width: 15%;
    white-space: nowrap;
  }

  .col-maquinas {
    width: 55%;
    
    // Lista compacta de máquinas dentro de la celda
    .maquina-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      border-radius: $radius-sm;
      margin-bottom: 8px;
      gap: 12px;
      
      &:last-child { margin-bottom: 0; }
    }

    .maquina-info {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .maquina-nombre { font-weight: 600; font-size: 0.8125rem; }
      .maquina-progreso { 
        font-size: 0.75rem; color: $c-text-muted; 
        small { color: #94a3b8; }
      }
    }

    .maquina-controles {
      display: flex;
      align-items: center;
      gap: 12px;

      .checkbox-label {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 0.8125rem;
        font-weight: 500;
        cursor: pointer;
        
        input[type="checkbox"] {
          width: 16px; height: 16px; cursor: pointer;
        }
      }

      .input-sesiones {
        width: 60px;
        padding: 4px 6px;
        border: 1px solid $c-border;
        border-radius: $radius-sm;
        text-align: right;
        font-size: 0.8125rem;
        font-weight: 600;
        
        &:disabled { background: #e2e8f0; color: #94a3b8; }
      }
    }
  }
}

// --- Badges ---
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;

  &.estado-verde { background: #dcfce7; color: #166534; }
  &.estado-naranja { background: #fef3c7; color: #92400e; }
  &.estado-rojo { background: #fee2e2; color: #991b1b; }
}

.badge-completo {
  font-size: 0.75rem;
  font-weight: 600;
  color: #10b981;
  background: #ecfdf5;
  padding: 4px 8px;
  border-radius: $radius-sm;
}

// --- Mensajes de error / sin resultados ---
.error-carga, .sin-resultados {
  background: $c-surface;
  border: 1px dashed $c-border;
  border-radius: $radius-card;
  padding: 32px;
  text-align: center;
  color: $c-text-muted;
  font-size: 0.875rem;
}
.error-carga { border-color: #fca5a5; color: #ef4444; }

// --- Barra de Resumen Flotante ---
.resumen-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: $c-surface;
  border-top: 1px solid $c-border;
  padding: 16px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
  z-index: 50;

  .resumen-info {
    display: flex;
    gap: 24px;
    font-size: 0.875rem;
    color: $c-text-muted;
    strong { color: $c-text-main; font-size: 1rem; }
  }

  .btn-primary {
    background: $c-primary;
    color: #fff;
    border: none;
    padding: 10px 20px;
    border-radius: $radius-sm;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s ease;

    &:hover:not(:disabled) { background: #1e293b; }
    &:disabled { background: #94a3b8; cursor: not-allowed; }
  }
}

// --- Responsive ---
@media (max-width: 768px) {
  :host { padding: 16px; padding-bottom: 120px; }
  
  .tabla-alumnos {
    .col-maquinas .maquina-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
  }

  .resumen-bar {
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    align-items: stretch;
    
    .resumen-info { justify-content: space-between; }
    .btn-primary { width: 100%; }
  }
}
