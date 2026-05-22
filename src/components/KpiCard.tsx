import React from 'react';
import type { ReactNode } from 'react';

interface KpiCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  variant?: 'default' | 'yellow' | 'red' | 'blue';
  sub?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({
  label, value, icon, trend, trendUp, variant = 'default', sub,
}) => (
  <div className={`kpi-card ${variant !== 'default' ? variant : ''}`}>
    <div className="kpi-header">
      <div className="kpi-icon">{icon}</div>
      {trend && (
        <span className={`kpi-trend ${trendUp === false ? 'down' : ''}`}>
          {trendUp ? '↑' : '↓'} {trend}
        </span>
      )}
    </div>
    <div className="kpi-value">{value}</div>
    <div className="kpi-label">{label}</div>
    {sub && <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>{sub}</div>}
  </div>
);

export default KpiCard;
