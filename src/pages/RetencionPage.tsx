import React, { useState, useEffect, useCallback } from 'react';
import {
  UserMinus, Search, Filter, AlertTriangle, Users, TrendingDown,
  Activity, Calendar, DollarSign, AlertOctagon, CheckCircle2, AlertCircle, XCircle, ChevronLeft, ChevronRight, Smartphone, Clock, Shield
} from 'lucide-react';
import { getRetencionSocios } from '../api/client';
import type { RetencionResponse, SocioRetencion } from '../types';
import KpiCard from '../components/KpiCard';
import Topbar from '../components/Topbar';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtUSD = (n: number) =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);

const fmtDate = (s: string | null) => {
  if (!s) return 'Nunca';
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── Progress Bar para Probabilidad ───────────────────────────────────────────
const FugaBar: React.FC<{ prob: number; riesgo: string }> = ({ prob, riesgo }) => {
  let color = '#15803d'; // Bajo
  if (riesgo === 'Alto') color = '#dc2626';
  else if (riesgo === 'Medio') color = '#ca8a04';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
        <div style={{ width: `${Math.min(prob, 100)}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 32 }}>{prob}%</span>
    </div>
  );
};

// ─── Riesgo Badge ─────────────────────────────────────────────────────────────
const RiesgoBadge: React.FC<{ r: string }> = ({ r }) => {
  const map: Record<string, [JSX.Element, string, string]> = {
    'Alto':  [<XCircle size={12} />, '#b91c1c', '#fee2e2'],
    'Medio': [<AlertCircle size={12} />, '#b45309', '#fef3c7'],
    'Bajo':  [<CheckCircle2 size={12} />, '#15803d', '#dcfce7'],
  };
  const [icon, color, bg] = map[r] ?? [<AlertCircle size={12} />, '#64748b', '#f1f5f9'];
  return (
    <span style={{ background: bg, color, borderRadius: 20, padding: '4px 10px', fontWeight: 700, fontSize: 11, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {icon} {r}
    </span>
  );
};

// ─── Constants ────────────────────────────────────────────────────────────────
const RIESGOS = ['Todos', 'Alto', 'Medio', 'Bajo'];
const LIMITS  = [10, 20, 50];

// ─── Component ────────────────────────────────────────────────────────────────
const RetencionPage: React.FC = () => {
  const [data, setData]       = useState<RetencionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [page, setPage]       = useState(1);
  const [limit, setLimit]     = useState(20);
  const [riesgo, setRiesgo]   = useState('Todos');
  const [search, setSearch]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRetencionSocios({
        page,
        limit,
        riesgo: riesgo === 'Todos' ? undefined : riesgo,
      });
      setData(res);
    } catch {
      setError('No se pudo cargar el análisis de retención de socios.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, riesgo]);

  useEffect(() => { setPage(1); }, [limit, riesgo]);
  useEffect(() => { void load(); }, [load]);

  const rows = search.trim()
    ? (data?.data ?? []).filter((s) =>
        s.nombresSocio.toLowerCase().includes(search.toLowerCase()) ||
        s.nroCliente.includes(search)
      )
    : (data?.data ?? []);

  const r = data?.resumen;
  const totalPages = data ? Math.ceil(data.total / limit) : 1;
  const hayFugasAltas = r && r.totalRiesgoAlto > 0;

  return (
    <>
      <Topbar
        title="Retención de Socios"
        subtitle="Identificación de socios con alto riesgo de desvinculación y fuga de liquidez"
        onRefresh={load}
        loading={loading}
      />

      <div className="content">

        {/* Alerta Crítica */}
        {hayFugasAltas && (
          <div style={{
            background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
            borderRadius: 12, padding: '14px 20px',
            display: 'flex', alignItems: 'center', gap: 12, color: '#fff',
            marginBottom: 20
          }}>
            <UserMinus size={24} style={{ flexShrink: 0, animation: 'pulse 2s ease-in-out infinite' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 14 }}>
                <AlertOctagon size={16} /> {r!.totalRiesgoAlto} socios con Riesgo Alto de Fuga
              </div>
              <div style={{ fontSize: 12, opacity: .9, marginTop: 4 }}>
                Presentan inactividad extrema, saldos vaciados y falta de vinculación de cartera. Se recomienda contacto inmediato.
              </div>
            </div>
          </div>
        )}

        {/* KPIs */}
        <div className="kpi-grid">
          <KpiCard
            label="Riesgo de Fuga Alto"
            value={r ? r.totalRiesgoAlto.toLocaleString('es-EC') : '—'}
            icon={<UserMinus size={20} />}
            variant="red"
            sub="Probabilidad ≥ 70%"
          />
          <KpiCard
            label="Riesgo de Fuga Medio"
            value={r ? r.totalRiesgoMedio.toLocaleString('es-EC') : '—'}
            icon={<Activity size={20} />}
            variant="yellow"
            sub="Probabilidad 40% - 69%"
          />
          <KpiCard
            label="Saldo en Riesgo (Liquidez)"
            value={r ? fmtUSD(r.saldoEnRiesgo) : '—'}
            icon={<DollarSign size={20} />}
            variant="blue"
            sub="De cuentas con riesgo Alto/Medio"
          />
        </div>

        {/* Tabla */}
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
              {/* Filtro de Riesgo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Filter size={13} style={{ color: 'var(--gray-400)' }} />
                <div className="filter-chips">
                  {RIESGOS.map((s) => (
                    <button
                      key={s}
                      className={`chip ${riesgo === s ? (s === 'Bajo' ? 'green active' : s === 'Medio' ? 'orange active' : s === 'Alto' ? 'red active' : 'active') : ''}`}
                      onClick={() => setRiesgo(s)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      {s === 'Bajo' ? <CheckCircle2 size={12} /> : s === 'Medio' ? <AlertCircle size={12} /> : s === 'Alto' ? <XCircle size={12} /> : null} {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* Límite */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>Mostrar:</span>
              {LIMITS.map((l) => (
                <button key={l} className={`chip ${limit === l ? 'active' : ''}`} onClick={() => setLimit(l)}>{l}</button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="loading-overlay">
              <div className="spinner" />
              <p className="loading-text">Analizando inactividad y vinculación de socios…</p>
            </div>
          ) : error ? (
            <div className="empty-state">
              <AlertTriangle size={40} />
              <p style={{ color: 'var(--red)' }}>{error}</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="empty-state">
              <Shield size={40} />
              <p>No se encontraron socios en riesgo de fuga</p>
            </div>
          ) : (
            <div className="table-scroll-body">
              <table>
                <thead>
                  <tr>
                    <th>Socio</th>
                    <th>Nivel de Riesgo</th>
                    <th style={{ minWidth: 120 }}>Probabilidad</th>
                    <th>Inactividad / Saldo</th>
                    <th>Vinculación Cruzada</th>
                    <th>Motivo Principal</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s: SocioRetencion) => (
                    <tr key={s.nroCliente}>
                      <td>
                        <div className="td-name">{s.nombresSocio}</div>
                        <div className="td-mono">#{s.nroCliente}</div>
                      </td>
                      <td>
                        <RiesgoBadge r={s.nivelRiesgo} />
                      </td>
                      <td>
                        <FugaBar prob={s.probabilidadFuga} riesgo={s.nivelRiesgo} />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: s.diasInactividad > 90 ? '#b91c1c' : 'var(--gray-700)', fontWeight: s.diasInactividad > 90 ? 700 : 500, fontSize: 12 }}>
                          <Clock size={12} /> {s.diasInactividad} días inactivo
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 4 }}>
                          Saldo libre: <strong style={{ color: s.saldoAhorro < 10 ? '#b91c1c' : 'inherit' }}>{fmtUSD(s.saldoAhorro)}</strong>
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 2 }}>
                          Últ. mov: {fmtDate(s.fechaUltMovimiento)}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <span style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, color: s.tieneCredito ? '#15803d' : '#64748b' }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.tieneCredito ? '#15803d' : '#cbd5e1' }} />
                            Crédito Activo: {s.tieneCredito ? 'Sí' : 'No'}
                          </span>
                          <span style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, color: s.tieneCooplinea ? '#15803d' : '#64748b' }}>
                            <Smartphone size={12} style={{ color: s.tieneCooplinea ? '#15803d' : '#cbd5e1' }} />
                            Canales Digitales: {s.tieneCooplinea ? 'Sí' : 'No'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ 
                          fontSize: 11, color: 'var(--gray-700)', lineHeight: 1.4, 
                          background: s.nivelRiesgo === 'Alto' ? '#fee2e2' : '#f8fafc',
                          padding: '6px 10px', borderRadius: 6, border: `1px solid ${s.nivelRiesgo === 'Alto' ? '#fca5a5' : '#e2e8f0'}`,
                          maxWidth: 220 
                        }}>
                          {s.motivoPrincipal}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación */}
          {!loading && !error && data && (
            <div className="pagination">
              <span className="pagination-info">
                <strong>{((page-1)*limit)+1}–{Math.min(page*limit, data.total)}</strong> de{' '}
                <strong>{data.total.toLocaleString('es-EC')}</strong> socios en riesgo
              </span>
              <div className="pagination-controls">
                <button className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={14} /></button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i;
                  return <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>;
                })}
                <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>

      </div>
    </>
  );
};

export default RetencionPage;
