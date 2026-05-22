import React from 'react';
import {
  CreditCard,
  AlertTriangle,
  Settings,
  LogOut,
  TrendingDown,
  Zap,
  CalendarClock,
  PieChart,
  UserMinus,
  LifeBuoy,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'risk',          icon: AlertTriangle,  label: 'Riesgo de Morosidad',   badge: null },
  { id: 'credits',       icon: CreditCard,     label: 'Créditos Activos',       badge: null },
  { id: 'predictions',   icon: Zap,            label: 'Predicción de Mora',     badge: '✨' },
  { id: 'cuotas',          icon: CalendarClock,  label: 'Cuotas en Riesgo',       badge: null },
  { id: 'retencion',       icon: UserMinus,      label: 'Retención y Fugas',      badge: null },
  { id: 'recuperabilidad', icon: LifeBuoy,       label: 'Recuperabilidad',        badge: null },
  { id: 'concentracion',   icon: PieChart,       label: 'Concentración',          badge: null },
];

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => (
  <aside className="sidebar">
    <div className="sidebar-logo">
      <div className="sidebar-logo-badge">
        <div className="sidebar-logo-icon">T</div>
        <div className="sidebar-logo-text">
          <h1>COOPTULCÁN</h1>
          <span>Dashboard Financiero</span>
        </div>
      </div>
    </div>

    <div className="sidebar-section">
      <p className="sidebar-section-label">Menú Principal</p>
    </div>

    <nav className="sidebar-nav">
      {navItems.map(({ id, icon: Icon, label, badge }) => (
        <button
          key={id}
          className={`nav-item ${activeTab === id ? 'active' : ''}`}
          onClick={() => onTabChange(id)}
        >
          <Icon size={18} />
          <span>{label}</span>
          {badge && <span className="nav-badge">{badge}</span>}
        </button>
      ))}

      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
        <button className="nav-item" style={{ cursor: 'default', opacity: 0.5 }}>
          <TrendingDown size={18} />
          <span>Analítica Avanzada</span>
          <span className="nav-badge">Pronto</span>
        </button>
        <button className="nav-item" style={{ cursor: 'default', opacity: 0.5 }}>
          <Settings size={18} />
          <span>Configuración</span>
        </button>
      </div>
    </nav>

    <div className="sidebar-footer">
      <div className="sidebar-user">
        <div className="sidebar-avatar">A</div>
        <div className="sidebar-user-info">
          <p>Administrador</p>
          <span>Riesgos</span>
        </div>
        <LogOut size={15} style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 'auto', cursor: 'pointer' }} />
      </div>
    </div>
  </aside>
);

export default Sidebar;
