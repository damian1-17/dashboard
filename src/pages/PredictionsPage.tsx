import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle, Clock, TrendingUp, Wallet, ChevronLeft,
  ChevronRight, Search, Filter, Users, Shield,
  XCircle, AlertCircle, BookOpen
} from 'lucide-react';
import { getPredictions } from '../api/client';
import type { PredictionsResponse, SocioPrediccion } from '../types';
import KpiCard from '../components/KpiCard';
import Topbar from '../components/Topbar';

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);

const HORIZONTE_META: Record<string, { color: string; bg: string; border: string; label: string; icon: React.ReactNode; urgencia: string }> = {
  '10 días': { color: '#b91c1c', bg: '#fee2e2', border: '#dc2626', label: '🔴 10 días',  icon: <XCircle size={14} />, urgencia: 'Urgente' },
  '20 días': { color: '#c2410c', bg: '#ffedd5', border: '#ea580c', label: '🟠 20 días',  icon: <AlertTriangle size={14} />, urgencia: 'Alertar' },
  '30 días': { color: '#92400e', bg: '#fef3c7', border: '#ca8a04', label: '🟡 30 días',  icon: <AlertCircle size={14} />, urgencia: 'Monitorear' },
};

const ProbBar: React.FC<{ prob: number; color: string }> = ({ prob, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
    <div style={{ flex: 1, height: 5, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden', minWidth: 48 }}>
      <div style={{ width: `${Math.min(prob, 100)}%`, height: '100%', background: color, borderRadius: 3, transition: 'width .4s ease' }} />
    </div>
    <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 32 }}>{prob.toFixed(0)}%</span>
  </div>
);

const LIMITS    = [10, 20, 50];
const HORIZONTES = ['Todos', '10 días', '20 días', '30 días'];

// ─── Component ────────────────────────────────────────────────────────────────
const PredictionsPage: React.FC = () => {
  const [data,    setData]    = useState<PredictionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [page,    setPage]    = useState(1);
  const [limit,   setLimit]   = useState(20);
  const [horizonte, setHorizonte] = useState('Todos');
  const [search,  setSearch]  = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPredictions({
        page,
        limit,
        horizonte: horizonte === 'Todos' ? undefined : horizonte.split(' ')[0],
      });
      setData(res);
    } catch {
      setError('No se pudo conectar con el servidor. Verifique que el backend esté activo.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, horizonte]);

  useEffect(() => { setPage(1); }, [limit, horizonte]);
  useEffect(() => { void load(); }, [load]);

  const filteredData = search.trim()
    ? (data?.data ?? []).filter((s) =>
        s.nombre.toLowerCase().includes(search.toLowerCase()) ||
        s.nroCliente.includes(search)
      )
    : (data?.data ?? []);

  const totalPages = data ? Math.ceil(data.total / limit) : 1;
  const r = data?.resumen;

  // Alerta crítica si hay socios en horizonte 10 días
  const alertaCritica = r && r.total10d > 0;

  return (
    <>
      <Topbar
        title="Predicción de Morosidad"
        subtitle="Socios con probabilidad de caer en mora en los próximos 10, 20 o 30 días"
        onRefresh={load}
        loading={loading}
      />

      <div className="content">

        {/* Banner de alerta crítica */}
        {alertaCritica && (
          <div style={{
            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
            borderRadius: 12,
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: '#fff',
            animation: 'pulse 2s ease-in-out infinite',
          }}>
            <AlertTriangle size={20} style={{ flexShrink: 0 }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 14 }}>
                <AlertTriangle size={16} /> Atención inmediata requerida: {r!.total10d} socios podrían caer en mora en los próximos 10 días
              </div>
              <div style={{ fontSize: 12, opacity: .85 }}>
                Monto en riesgo inmediato: {fmtCurrency(r!.montoEnRiesgo10d)} — Se recomienda contactar a estos socios hoy
              </div>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="kpi-grid">
          <KpiCard
            label="En riesgo (10 días)"
            value={r ? r.total10d.toLocaleString('es-EC') : '—'}
            icon={<Clock size={20} />}
            variant="red"
            sub={r ? `${fmtCurrency(r.montoEnRiesgo10d)} en riesgo` : undefined}
          />
          <KpiCard
            label="En riesgo (20 días)"
            value={r ? r.total20d.toLocaleString('es-EC') : '—'}
            icon={<AlertTriangle size={20} />}
            variant="yellow"
            sub={r ? `${fmtCurrency(r.montoEnRiesgo20d)} en riesgo` : undefined}
          />
          <KpiCard
            label="En riesgo (30 días)"
            value={r ? r.total30d.toLocaleString('es-EC') : '—'}
            icon={<TrendingUp size={20} />}
            sub={r ? `${fmtCurrency(r.montoEnRiesgo30d)} en riesgo` : undefined}
          />
          <KpiCard
            label="Monto Total en Riesgo"
            value={r ? fmtCurrency(r.montoTotalEnRiesgo) : '—'}
            icon={<Wallet size={20} />}
            variant="blue"
            sub={r ? `${r.totalGeneral} socios identificados` : undefined}
          />
        </div>

        {/* Tabla de predicciones */}
        <div className="table-card">
          <div className="table-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1 }}>
              {/* Búsqueda */}
              <div className="search-input" style={{ maxWidth: 260 }}>
                <Search size={14} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
                <input
                  placeholder="Buscar socio o número..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {/* Filtro horizonte */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Filter size={13} style={{ color: 'var(--gray-400)' }} />
                <div className="filter-chips">
                  {HORIZONTES.map((h) => (
                    <button
                      key={h}
                      className={`chip ${horizonte === h ? (
                        h === 'Todos' ? 'active' :
                        h === '10 días' ? 'red active' :
                        h === '20 días' ? 'orange active' : 'yellow active'
                      ) : ''}`}
                      onClick={() => { setHorizonte(h); setSearch(''); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      {h === '10 días' ? <XCircle size={12} /> :
                       h === '20 días' ? <AlertTriangle size={12} /> :
                       h === '30 días' ? <AlertCircle size={12} /> : null} {h}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* Límite */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>Mostrar:</span>
              {LIMITS.map((l) => (
                <button key={l} className={`chip ${limit === l ? 'active' : ''}`} onClick={() => setLimit(l)}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="loading-overlay">
              <div className="spinner" />
              <p className="loading-text">Calculando predicciones de morosidad…</p>
            </div>
          ) : error ? (
            <div className="empty-state">
              <AlertTriangle size={40} />
              <p style={{ color: 'var(--red)' }}>{error}</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="empty-state">
              <Shield size={40} />
              <p>No se identificaron socios en riesgo con los filtros aplicados</p>
              <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>¡Buenas noticias! La cartera se ve estable</p>
            </div>
          ) : (
            <div className="table-scroll-body">
              <table>
                <thead>
                  <tr>
                    <th>Socio</th>
                    <th>Horizonte</th>
                    <th style={{ minWidth: 180 }}>Probabilidades de mora</th>
                    <th>Monto en Riesgo</th>
                    <th>Factor Principal</th>
                    <th>Señal</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((s: SocioPrediccion) => {
                    const meta = HORIZONTE_META[s.horizonte];
                    return (
                      <tr key={s.nroCliente}>
                        <td>
                          <div className="td-name">{s.nombre}</div>
                          <div className="td-mono">#{s.nroCliente}</div>
                        </td>
                        <td>
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: meta?.bg, color: meta?.color,
                            border: `1.5px solid ${meta?.border}`,
                            borderRadius: 20, padding: '4px 12px',
                            fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap',
                          }}>
                            {meta?.icon} {s.horizonte}
                            <span style={{ opacity: .8, fontWeight: 500, fontSize: 10 }}>· {meta?.urgencia}</span>
                          </div>
                        </td>
                        <td style={{ minWidth: 180 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 10, color: 'var(--gray-400)', minWidth: 38 }}>10 días</span>
                              <ProbBar prob={s.prob10d} color="#dc2626" />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 10, color: 'var(--gray-400)', minWidth: 38 }}>20 días</span>
                              <ProbBar prob={s.prob20d} color="#ea580c" />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 10, color: 'var(--gray-400)', minWidth: 38 }}>30 días</span>
                              <ProbBar prob={s.prob30d} color="#ca8a04" />
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="td-currency" style={{ color: meta?.color }}>
                            {fmtCurrency(s.montoEnRiesgo)}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                            Saldo prom. {fmtCurrency(s.saldoPromedio)}
                          </div>
                        </td>
                        <td>
                          <div style={{
                            fontSize: 12, color: 'var(--gray-700)', fontWeight: 500,
                            background: meta?.bg, borderRadius: 6, padding: '4px 8px',
                            maxWidth: 220,
                          }}>
                            {s.factorPrincipal}
                          </div>
                        </td>
                        <td>
                          <span className="senal-cell" title={s.senalPrincipal}>
                            {s.senalPrincipal}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación */}
          {!loading && !error && data && (
            <div className="pagination">
              <span className="pagination-info">
                Mostrando <strong>{((page - 1) * limit) + 1}–{Math.min(page * limit, data.total)}</strong> de{' '}
                <strong>{data.total.toLocaleString('es-EC')}</strong> socios en riesgo predicho
              </span>
              <div className="pagination-controls">
                <button className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const p = totalPages <= 7 ? i + 1 : (
                    page <= 4 ? i + 1 :
                    page >= totalPages - 3 ? totalPages - 6 + i :
                    page - 3 + i
                  );
                  return (
                    <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>
                      {p}
                    </button>
                  );
                })}
                <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Leyenda del modelo */}
        <div className="card" style={{ padding: '16px 20px' }}>
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 10 }}>
            <BookOpen size={16} /> ¿Cómo funciona la predicción?
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              {
                icon: <XCircle size={14} />, title: 'Próximos 10 días',
                desc: 'El socio ya tiene días de retraso activos (1-20 días) y su probabilidad de cruzar el umbral formal de mora es alta. Requiere contacto inmediato.',
                border: '#dc2626', bg: '#fee2e2',
              },
              {
                icon: <AlertTriangle size={14} />, title: 'Próximos 20 días',
                desc: 'Sin mora formal aún, pero el ahorro cayó abruptamente y hay inactividad transaccional. Las señales de deterioro combinadas predicen una caída próxima.',
                border: '#ea580c', bg: '#ffedd5',
              },
              {
                icon: <AlertCircle size={14} />, title: 'Próximos 30 días',
                desc: 'Riesgo compuesto moderado-alto: score elevado, presión externa y factores socioeconómicos desfavorables. Monitorear y prevenir proactivamente.',
                border: '#ca8a04', bg: '#fef3c7',
              },
            ].map((item) => (
              <div key={item.title} style={{
                borderLeft: `3px solid ${item.border}`, background: item.bg,
                borderRadius: 8, padding: '10px 14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13, marginBottom: 5 }}>
                  {item.icon} {item.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--gray-600)', lineHeight: 1.5 }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
};

export default PredictionsPage;
