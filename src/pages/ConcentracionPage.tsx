import React, { useState, useEffect, useCallback } from 'react';
import {
  PieChart, TrendingDown, MapPin, Briefcase, Target,
  AlertTriangle, DollarSign, Activity
} from 'lucide-react';
import { getConcentracionCartera } from '../api/client';
import type { ConcentracionResponse, ConcentracionItem } from '../types';
import KpiCard from '../components/KpiCard';
import Topbar from '../components/Topbar';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtUSD = (n: number) =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const fmtPct = (n: number) => n.toFixed(1) + '%';

// ─── Bar Component ────────────────────────────────────────────────────────────
const HorizontalBar: React.FC<{
  item: ConcentracionItem;
  maxCapital: number;
  maxMora: number;
  totalCartera: number;
}> = ({ item, maxCapital, maxMora, totalCartera }) => {
  const capPct = maxCapital > 0 ? (item.saldoCapitalTotal / maxCapital) * 100 : 0;
  const moraPct = maxMora > 0 ? (item.saldoCapitalMora / maxMora) * 100 : 0;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'flex-end' }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--gray-800)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.categoria}
        </div>
        <div style={{ textAlign: 'right', fontSize: 12 }}>
          <span style={{ fontWeight: 700 }}>{fmtUSD(item.saldoCapitalTotal)}</span>
          <span style={{ color: 'var(--gray-400)', marginLeft: 8 }}>({fmtPct(item.participacion)})</span>
        </div>
      </div>

      {/* Barra de Capital */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
        <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${capPct}%`, height: '100%', background: '#0f5132', borderRadius: 4 }} />
        </div>
        <div style={{ width: 80, fontSize: 11, color: 'var(--gray-500)', textAlign: 'right' }}>
          {item.cantidadOperaciones} ops
        </div>
      </div>

      {/* Barra de Mora (solo si hay mora) */}
      {item.saldoCapitalMora > 0 && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${moraPct}%`, height: '100%', background: '#dc2626', borderRadius: 3 }} />
          </div>
          <div style={{ width: 80, fontSize: 11, color: '#dc2626', fontWeight: 600, textAlign: 'right' }}>
            Mora: {fmtPct(item.indiceMora)}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Section Component ────────────────────────────────────────────────────────
const ConcentracionSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  data: ConcentracionItem[];
  totalCartera: number;
}> = ({ title, icon, data, totalCartera }) => {
  const maxCap = Math.max(...data.map(d => d.saldoCapitalTotal), 0);
  const maxMora = Math.max(...data.map(d => d.saldoCapitalMora), 0);

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--gray-200)', paddingBottom: 12 }}>
        <div style={{ color: 'var(--primary)', padding: 6, background: 'var(--primary-light)', borderRadius: 8 }}>
          {icon}
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{title}</h3>
      </div>
      
      {data.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '20px 0', fontSize: 13 }}>
          No hay datos disponibles
        </div>
      ) : (
        <div>
          {data.map((item, idx) => (
            <HorizontalBar
              key={idx}
              item={item}
              maxCapital={maxCap}
              maxMora={maxMora}
              totalCartera={totalCartera}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Page Component ───────────────────────────────────────────────────────────
const ConcentracionPage: React.FC = () => {
  const [data, setData] = useState<ConcentracionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getConcentracionCartera();
      setData(res);
    } catch {
      setError('No se pudo cargar la concentración de cartera.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <>
      <Topbar
        title="Concentración de Cartera"
        subtitle="Análisis gerencial de distribución de riesgo y exposición por segmentos"
        onRefresh={load}
        loading={loading}
      />

      <div className="content">
        {error && (
          <div className="empty-state" style={{ marginBottom: 20 }}>
            <AlertTriangle size={40} />
            <p style={{ color: 'var(--red)' }}>{error}</p>
          </div>
        )}

        {/* KPIs Globales */}
        <div className="kpi-grid">
          <KpiCard
            label="Cartera Vigente Total"
            value={data ? fmtUSD(data.carteraTotal) : '—'}
            icon={<DollarSign size={20} />}
            variant="blue"
          />
          <KpiCard
            label="Mora Total"
            value={data ? fmtUSD(data.moraTotal) : '—'}
            icon={<TrendingDown size={20} />}
            variant="red"
          />
          <KpiCard
            label="Índice de Mora Global"
            value={data ? fmtPct(data.indiceMoraGlobal) : '—'}
            icon={<Activity size={20} />}
            variant={data && data.indiceMoraGlobal > 5 ? 'red' : 'green'}
            sub="Basado en días de mora > 0"
          />
        </div>

        {/* Secciones de Concentración */}
        {!loading && data && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            <ConcentracionSection
              title="Por Actividad Económica"
              icon={<Briefcase size={18} />}
              data={data.porActividad}
              totalCartera={data.carteraTotal}
            />
            <ConcentracionSection
              title="Por Destino del Crédito"
              icon={<Target size={18} />}
              data={data.porDestino}
              totalCartera={data.carteraTotal}
            />
            <ConcentracionSection
              title="Por Ciudad de Origen"
              icon={<MapPin size={18} />}
              data={data.porCiudad}
              totalCartera={data.carteraTotal}
            />
          </div>
        )}

        {loading && (
          <div className="loading-overlay" style={{ minHeight: 300 }}>
            <div className="spinner" />
            <p className="loading-text">Analizando distribución de cartera…</p>
          </div>
        )}
      </div>
    </>
  );
};

export default ConcentracionPage;
