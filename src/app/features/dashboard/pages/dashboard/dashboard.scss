@use 'sass:color';

// ==========================================================================
// SCSS DESIGN: TECHNICAL MINIMALISM FOR PROEDSO DASHBOARD
// ==========================================================================

// --- 1. Variables & Design Tokens ---
$font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
$font-mono: 'JetBrains Mono', 'SF Mono', 'Roboto Mono', monospace;

$c-surface: #ffffff;
$c-background: #f8fafc; // Blanco con ligerísimo matiz azul frío
$c-text-main: #0f172a;  // Slate oscuro (base azul)
$c-text-muted: #64748b; // Slate medio
$c-border: #e2e8f0;
$c-border-hover: #94a3b8;

// Paleta Institucional Azulada
$c-accent: #102544;       // Azul marino profundo
$c-accent-hover: #1e3a8a; // Azul hovers activos
$c-primary: #2563eb;      // Azul estándar de acciones secundarias
$c-primary-bg: #eff6ff;   // Fondo sutil para elementos activos

// Alertas semánticas finas
$c-danger: #dc2626;
$c-danger-bg: #fef2f2;
$c-success: #16a34a;
$c-warning: #d97706;

$radius-sm: 4px;
$radius-md: 6px;
$radius-lg: 8px;

$shadow-crisp: 0 1px 2px rgba(15, 23, 42, 0.06);
$shadow-float: 0 8px 24px rgba(15, 23, 42, 0.08);

// --- 2. Mixins Estructurales ---
@mixin mono-label {
  font-family: $font-mono;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
}

// ==========================================================================
// MAIN COMPONENT STYLES
// ==========================================================================

.dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
  font-family: $font-sans;
  background-color: $c-background;
  color: $c-text-main;
  -webkit-font-smoothing: antialiased;
}

// --- Welcome Header Card ---
.welcome-card {
  background: $c-surface;
  border: 1px solid $c-border;
  border-bottom: 3px solid $c-accent; // Línea gruesa de firma técnica
  border-radius: $radius-lg;
  box-shadow: $shadow-crisp;
  padding: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;

  h1 {
    margin: 0;
    color: $c-text-main;
    font-size: 2rem;
    font-weight: 500;
    letter-spacing: -0.04em;
    line-height: 1.1;
  }

  p {
    margin: 8px 0 0;
    color: $c-text-muted;
    font-size: 0.875rem;
  }
}

// Badge de Administrador Pasaporte/ID
.admin-badge {
  @include mono-label;
  background: transparent;
  color: $c-danger;
  border: 1px solid rgba($c-danger, 0.4);
  padding: 6px 14px;
  border-radius: $radius-sm;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    background: $c-danger;
    border-radius: 50%;
  }
}

// --- KPIs Stats Grid ---
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  background: $c-surface;
  border: 1px solid $c-border;
  border-radius: $radius-lg;
  box-shadow: $shadow-crisp;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
  overflow: hidden;

  .label {
    @include mono-label;
    color: $c-text-muted;
    margin: 0;
  }

  h3 {
    margin: 0;
    font-family: $font-sans;
    font-size: 2rem;
    font-weight: 500;
    letter-spacing: -0.03em;
    color: $c-text-main; // Base unificada
  }

  // Sutiles bordes superiores en lugar de pintar números enteros de colores
  &.blue { border-top: 3px solid $c-primary; }
  &.green { border-top: 3px solid $c-success; }
  &.orange { border-top: 3px solid $c-warning; }
  &.purple { border-top: 3px solid #7c3aed; }
}

// --- Panel Grid Layout ---
.panel-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.panel-card {
  background: $c-surface;
  border: 1px solid $c-border;
  border-radius: $radius-lg;
  box-shadow: $shadow-crisp;
  padding: 28px;

  h2 {
    margin: 0 0 20px 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: $c-text-main;
    padding-bottom: 12px;
    border-bottom: 1px solid $c-border;
  }
}

// --- Quick Actions (Buttons Sharp) ---
.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;

  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    height: 44px;
    padding: 0 16px;
    border: 1px solid $c-border;
    border-radius: $radius-md;
    background: $c-surface;
    color: $c-text-main;
    font-family: $font-sans;
    font-weight: 500;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      border-color: $c-accent;
      background: $c-primary-bg;
      color: $c-accent;
    }

    &:focus-visible {
      outline: none;
      box-shadow: $shadow-focus;
    }
  }
}

// --- Lists Design & Structural Geometry ---
ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;

  li {
    margin: 0;
    padding: 10px 14px;
    background: $c-background;
    border: 1px solid $c-border;
    border-radius: $radius-sm;
    font-size: 0.875rem;
    font-family: $font-sans;
    color: $c-text-main;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    // Transforma los datos dinámicos o números internos en estilo mono de manera implícita
    &::after {
      font-family: $font-mono;
      font-weight: 500;
      color: $c-text-main;
    }
  }
}

// Alertas Finas de Contraste Controlado
.alerts li {
  background: $c-danger-bg;
  border-color: rgba($c-danger, 0.2);
  color: $c-danger;
  font-weight: 500;
  box-shadow: inset 3px 0 0 $c-danger; // Fina línea indicadora izquierda
}

// ==========================================================================
// RESPONSIVE DESIGN MEDIA QUERIES
// ==========================================================================
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .welcome-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding: 24px;
  }

  .stats-grid,
  .panel-grid,
  .quick-actions {
    grid-template-columns: 1fr;
  }
}
