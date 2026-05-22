import React, { useState } from 'react';
import { RefreshCw, Calendar, ChevronRight } from 'lucide-react';

interface TopbarProps {
  title: string;
  subtitle: string;
  corteAhorro?: string;
  corteCredito?: string;
  onRefresh?: () => void;
  loading?: boolean;
  /** Rango de fechas controlado desde el padre */
  dateFrom?: string;
  dateTo?: string;
  onDateChange?: (from: string, to: string) => void;
}

const Topbar: React.FC<TopbarProps> = ({
  title, subtitle, corteAhorro, corteCredito,
  onRefresh, loading,
  dateFrom = '', dateTo = '',
  onDateChange,
}) => {
  const [from, setFrom] = useState(dateFrom);
  const [to,   setTo]   = useState(dateTo);

  const handleApply = () => {
    if (onDateChange) onDateChange(from, to);
    if (onRefresh)    onRefresh();
  };

  const hasRange = from || to;

  return (
    <header className="topbar" style={{ height: 'auto', minHeight: 64, flexWrap: 'wrap', gap: 12, padding: '10px 28px' }}>
      {/* Título */}
      <div className="topbar-left" style={{ minWidth: 180 }}>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>

      {/* Rango de fechas */}
      <div className="topbar-date-range">
        <div className="date-range-label">
          <Calendar size={13} />
          Período de análisis
        </div>
        <div className="date-range-inputs">
          <div className="date-field">
            <label htmlFor="date-from">Desde</label>
            <input
              id="date-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <ChevronRight size={14} style={{ color: 'var(--gray-400)', flexShrink: 0, alignSelf: 'flex-end', marginBottom: 4 }} />
          <div className="date-field">
            <label htmlFor="date-to">Hasta</label>
            <input
              id="date-to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Cortes actuales de la BD */}
      <div className="topbar-right" style={{ marginLeft: 'auto' }}>
        {corteAhorro && (
          <span className="date-pill">
            <Calendar size={12} />
            Corte ahorro: {corteAhorro}
          </span>
        )}
        {corteCredito && (
          <span className="date-pill">
            <Calendar size={12} />
            Corte crédito: {corteCredito}
          </span>
        )}
        <button
          className="btn btn-primary"
          onClick={handleApply}
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          <RefreshCw size={14} style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }} />
          {hasRange ? 'Aplicar' : 'Actualizar'}
        </button>
      </div>
    </header>
  );
};

export default Topbar;
