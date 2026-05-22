import React, { useState, useEffect, useCallback } from 'react';
import {
  LifeBuoy, Search, Filter, AlertTriangle, Shield, Clock,
  DollarSign, Activity, Target, ChevronLeft, ChevronRight,
  CheckCircle2, AlertCircle, XCircle, HelpCircle
} from 'lucide-react';
import { getRecuperabilidadCartera } from '../api/client';
import type { RecuperabilidadResponse, SocioRecuperable } from '../types';
import KpiCard from '../components/KpiCard';
import Topbar from '../components/Topbar';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtUSD = (n: number) =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);

// ─── Progress Bar para Probabilidad ───────────────────────────────────────────
const RecupBar: React.FC<{ prob: number; segmento: string }> = ({ prob, segmento }) => {
  let color = '#dc2626'; // Baja
  if (segmento === 'Alta') color = '#15803d';
  else if (segmento === 'Media') color = '#ca8a04';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
        <div style={{ width: `${Math.min(prob, 100)}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 32 }}>{prob}%</span>
    </div>
  );
};

// ─── Segmento Badge ─────────────────────────────────────────────────────────────
const SegmentoBadge: React.FC<{ s: string }> = ({ s }) => {
  const map: Record<string, [React.ReactNode, string, string]> = {
    'Alta':  [<CheckCircle2 size={12} />, '#15803d', '#dcfce7'],
    'Media': [<AlertCircle size={12} />, '#b45309', '#fef3c7'],
    'Baja':  [<XCircle size={12} />, '#b91c1c', '#fee2e2'],
  };
  const [icon, color, bg] = map[s] ?? [<HelpCircle size={12} />, '#64748b', '#f1f5f9'];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: bg, color, borderRadius: 20, padding: '4px 10px', fontWeight: 700, fontSize: 11, whiteSpace: 'nowrap' }}>
      {icon} {s}
    </span>
  );
};

// ─── Constants ────────────────────────────────────────────────────────────────
const SEGMENTOS = ['Todos', 'Alta', 'Media', 'Baja'];
const LIMITS    = [10, 20, 50];

// ─── Component ────────────────────────────────────────────────────────────────
const RecuperabilidadPage: React.FC = () => {
  const [data, setData]       = useState<RecuperabilidadResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [page, setPage]       = useState(1);
  const [limit, setLimit]     = useState(20);
  const [segmento, setSegmento] = useState('Todos');
  const [search, setSearch]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRecuperabilidadCartera({
        page,
        limit,
        segmento: segmento === 'Todos' ? undefined : segmento,
      });
      setData(res);
    } catch {
      setError('No se pudo cargar el análisis de recuperabilidad.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, segmento]);

  useEffect(() => { setPage(1); }, [limit, segmento]);
  useEffect(() => { void load(); }, [load]);

  const rows = search.trim()
    ? (data?.data ?? []).filter((s) =>
        s.nombresSocio.toLowerCase().includes(search.toLowerCase()) ||
        s.nroCliente.includes(search) ||
        s.nroOperacion.includes(search)
      )
    : (data?.data ?? []);

  const r = data?.resumen;
  const totalPages = data ? Math.ceil(data.total / limit) : 1;
  const hasAlta = r && r.totalAlta > 0;

  return (
    <>
      <Topbar
        title="Recuperabilidad de Cartera Vencida"
        subtitle="Predicción de probabilidad de pago basada en garantías, historial e ingresos"
        onRefresh={load}
        loading={loading}
      />

      <div className="content">

        {/* Alerta Estratégica */}
        {hasAlta && (
          <div style={{
            background: 'linear-gradient(135deg, #0f5132 0%, #14532d 100%)',
            borderRadius: 12, padding: '14px 20px',
            display: 'flex', alignItems: 'center', gap: 12, color: '#fff',
            marginBottom: 20
          }}>
            <Target size={24} style={{ flexShrink: 0, animation: 'pulse 2s ease-in-out infinite' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 14 }}>
                <Target size={16} /> {r!.totalAlta} casos de Alta Recuperabilidad identificados
              </div>
              <div style={{ fontSize: 12, opacity: .9, marginTop: 4 }}>
                Prioriza la gestión de cobranza en estos socios para recuperar <strong>{fmtUSD(r!.montoAlta)}</strong> rápidamente.
              </div>
            </div>
          </div>
        )}

        {/* KPIs */}
        <div className="kpi-grid">
          <KpiCard
            label="Monto Alta Probabilidad"
            value={r ? fmtUSD(r.montoAlta) : '—'}
            icon={<DollarSign size={20} />}
            variant="green"
            sub={`${r?.totalAlta ?? 0} operaciones`}
          />
          <KpiCard
            label="Monto Media Probabilidad"
            value={r ? fmtUSD(r.montoMedia) : '—'}
            icon={<Activity size={20} />}
            variant="yellow"
            sub={`${r?.totalMedia ?? 0} operaciones`}
          />
          <KpiCard
            label="Difícil Recuperación"
            value={r ? fmtUSD(r.montoBaja) : '—'}
            icon={<AlertTriangle size={20} />}
            variant="red"
            sub={`${r?.totalBaja ?? 0} operaciones`}
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
                  placeholder="Buscar socio u operación..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {/* Filtro de Segmento */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Filter size={13} style={{ color: 'var(--gray-400)' }} />
                <div className="filter-chips">
                  {SEGMENTOS.map((s) => (
                    <button
                      key={s}
                      className={`chip ${segmento === s ? (s === 'Alta' ? 'green active' : s === 'Media' ? 'orange active' : s === 'Baja' ? 'red active' : 'active') : ''}`}
                      onClick={() => setSegmento(s)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      {s === 'Alta' ? <CheckCircle2 size={12} /> : s === 'Media' ? <AlertCircle size={12} /> : s === 'Baja' ? <XCircle size={12} /> : null} {s}
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
              <p className="loading-text">Analizando garantías e historial de pagos…</p>
            </div>
          ) : error ? (
            <div className="empty-state">
              <AlertTriangle size={40} />
              <p style={{ color: 'var(--red)' }}>{error}</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="empty-state">
              <Shield size={40} />
              <p>No se encontraron créditos en mora con estos filtros</p>
            </div>
          ) : (
            <div className="table-scroll-body">
              <table>
                <thead>
                  <tr>
                    <th>Socio / Operación</th>
                    <th>Probabilidad</th>
                    <th style={{ minWidth: 120 }}>Score</th>
                    <th>Estado de Deuda</th>
                    <th>Factores de Respaldo</th>
                    <th>Análisis Algorítmico</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s: SocioRecuperable) => (
                    <tr key={s.nroOperacion}>
                      <td>
                        <div className="td-name">{s.nombresSocio}</div>
                        <div className="td-mono">#{s.nroOperacion}</div>
                      </td>
                      <td>
                        <SegmentoBadge s={s.segmento} />
                      </td>
                      <td>
                        <RecupBar prob={s.scoreRecuperacion} segmento={s.segmento} />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#b91c1c', fontWeight: 700, fontSize: 12 }}>
                          <Clock size={12} /> {s.diasMora} días vencidos
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 4 }}>
                          Saldo vencido: <strong style={{ color: '#1e293b' }}>{fmtUSD(s.saldoVencido)}</strong>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <span style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, color: s.tipoGarantia.includes('QUIROGRAFARI') ? '#64748b' : '#15803d' }}>
                            <Shield size={12} style={{ color: s.tipoGarantia.includes('QUIROGRAFARI') ? '#cbd5e1' : '#15803d' }} />
                            Garantía: {s.tipoGarantia}
                          </span>
                          <span style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--gray-700)' }}>
                            <DollarSign size={12} style={{ color: '#94a3b8' }} />
                            Ingresos: {fmtUSD(s.ingresos)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ 
                          fontSize: 11, color: 'var(--gray-700)', lineHeight: 1.4, 
                          background: s.segmento === 'Alta' ? '#dcfce7' : s.segmento === 'Baja' ? '#fee2e2' : '#fef3c7',
                          padding: '6px 10px', borderRadius: 6, 
                          border: `1px solid ${s.segmento === 'Alta' ? '#86efac' : s.segmento === 'Baja' ? '#fca5a5' : '#fde047'}`,
                          maxWidth: 200 
                        }}>
                          {s.factorPositivo}
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
                <strong>{data.total.toLocaleString('es-EC')}</strong> créditos
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

export default RecuperabilidadPage;
