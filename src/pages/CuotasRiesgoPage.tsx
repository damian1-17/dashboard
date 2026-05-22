import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle, Clock, ChevronLeft, ChevronRight,
  Wallet, Bell, Filter, Search, Shield, CalendarClock,
} from 'lucide-react';
import { getCuotasEnRiesgo } from '../api/client';
import type { CuotasRiesgoResponse, CuotaRiesgo } from '../types';
import KpiCard from '../components/KpiCard';
import Topbar from '../components/Topbar';

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmtUSD = (n: number) =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);

const fmtDate = (s: string | null) => {
  if (!s) return '—';
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── Countdown badge ──────────────────────────────────────────────────────────
const CountdownBadge: React.FC<{ dias: number }> = ({ dias }) => {
  let bg = '#dcfce7', color = '#15803d', text = '';
  if (dias < 0)      { bg = '#fee2e2'; color = '#b91c1c'; text = `Vencida hace ${Math.abs(dias)}d`; }
  else if (dias <= 3)  { bg = '#fee2e2'; color = '#b91c1c'; text = `Urgente: ${dias}d`; }
  else if (dias <= 7)  { bg = '#ffedd5'; color = '#c2410c'; text = `En ${dias} días`; }
  else if (dias <= 15) { bg = '#fef3c7'; color = '#92400e'; text = `En ${dias} días`; }
  else                 { bg = '#f0fdf4'; color = '#15803d'; text = `En ${dias} días`; }

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: bg, color, border: `1.5px solid ${color}33`,
      borderRadius: 20, padding: '5px 12px',
      fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap',
    }}>
      <Clock size={12} />
      {text}
    </div>
  );
};

// ─── Calificación badge ───────────────────────────────────────────────────────
const CalBadge: React.FC<{ cal: string }> = ({ cal }) => {
  const palette: Record<string, [string, string]> = {
    A1: ['#15803d','#dcfce7'], A2: ['#16a34a','#f0fdf4'],
    A3: ['#65a30d','#f7fee7'], B1: ['#92400e','#fef3c7'],
    B2: ['#c2410c','#ffedd5'], C1: ['#b91c1c','#fee2e2'],
    C2: ['#991b1b','#fecaca'],  D: ['#7f1d1d','#fee2e2'],
    E:  ['#450a0a','#fecaca'],
  };
  const [color, bg] = palette[cal] ?? ['#475569','#f1f5f9'];
  return (
    <span style={{ background: bg, color, borderRadius: 6, padding: '3px 8px', fontWeight: 800, fontSize: 12 }}>
      {cal || '—'}
    </span>
  );
};

// ─── Prioridad badge ──────────────────────────────────────────────────────────
const PrioBadge: React.FC<{ p: string }> = ({ p }) => {
  const map: Record<string, [string, string, string]> = {
    'CRÍTICA': ['🔴','#b91c1c','#fee2e2'],
    'ALTA':    ['🟠','#c2410c','#ffedd5'],
    'MEDIA':   ['🟡','#92400e','#fef3c7'],
    'BAJA':    ['🟢','#15803d','#dcfce7'],
  };
  const [icon, color, bg] = map[p] ?? ['⚪','#64748b','#f1f5f9'];
  return (
    <span style={{ background: bg, color, borderRadius: 20, padding: '3px 10px', fontWeight: 700, fontSize: 11, whiteSpace: 'nowrap' }}>
      {icon} {p}
    </span>
  );
};

// ─── Constants ────────────────────────────────────────────────────────────────
const VENTANAS   = [7, 15, 30] as const;
const PRIORIDADES = ['Todas', 'CRÍTICA', 'ALTA', 'MEDIA', 'BAJA'];
const LIMITS     = [10, 20, 50];

// ─── Component ────────────────────────────────────────────────────────────────
const CuotasRiesgoPage: React.FC = () => {
  const [data,      setData]      = useState<CuotasRiesgoResponse | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [page,      setPage]      = useState(1);
  const [limit,     setLimit]     = useState(20);
  const [ventana,   setVentana]   = useState<7 | 15 | 30>(30);
  const [prioridad, setPrioridad] = useState('Todas');
  const [search,    setSearch]    = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCuotasEnRiesgo({
        page,
        limit,
        ventana,
        prioridad: prioridad === 'Todas' ? undefined : prioridad,
      });
      setData(res);
    } catch {
      setError('No se pudo conectar con el servidor. Verifique que el backend esté activo.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, ventana, prioridad]);

  useEffect(() => { setPage(1); }, [limit, ventana, prioridad]);
  useEffect(() => { void load(); }, [load]);

  const rows = search.trim()
    ? (data?.data ?? []).filter((c) =>
        c.nombresSocio.toLowerCase().includes(search.toLowerCase()) ||
        c.nroCliente.includes(search) ||
        c.nroOperacion.toLowerCase().includes(search.toLowerCase())
      )
    : (data?.data ?? []);

  const r = data?.resumen;
  const totalPages = data ? Math.ceil(data.total / limit) : 1;
  const hayCriticas = r && r.totalCritica > 0;

  return (
    <>
      <Topbar
        title="Cuotas Próximas en Riesgo"
        subtitle="Socios con cuotas venciendo en los próximos días — ordenados por prioridad de cobranza"
        onRefresh={load}
        loading={loading}
      />

      <div className="content">

        {/* Alerta crítica */}
        {hayCriticas && (
          <div style={{
            background: 'linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)',
            borderRadius: 12, padding: '14px 20px',
            display: 'flex', alignItems: 'center', gap: 12, color: '#fff',
          }}>
            <Bell size={20} style={{ flexShrink: 0, animation: 'pulse 1.4s ease-in-out infinite' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                ⚡ {r!.totalCritica} cuota{r!.totalCritica !== 1 ? 's' : ''} con prioridad CRÍTICA — requieren contacto HOY
              </div>
              <div style={{ fontSize: 12, opacity: .85 }}>
                Socios con calificación C/D/E cuya cuota vence en menos de 7 días. El riesgo de formalización en mora es muy alto.
              </div>
            </div>
          </div>
        )}

        {/* KPI cards */}
        <div className="kpi-grid">
          <KpiCard
            label="Vencen en 7 días"
            value={r ? r.total7d.toLocaleString('es-EC') : '—'}
            icon={<Clock size={20} />}
            variant="red"
            sub={r ? `${fmtUSD(r.monto7d)} a recaudar` : undefined}
          />
          <KpiCard
            label="Vencen en 15 días"
            value={r ? r.total15d.toLocaleString('es-EC') : '—'}
            icon={<CalendarClock size={20} />}
            variant="yellow"
            sub={r ? `${fmtUSD(r.monto15d)} a recaudar` : undefined}
          />
          <KpiCard
            label="Vencen en 30 días"
            value={r ? r.total30d.toLocaleString('es-EC') : '—'}
            icon={<AlertTriangle size={20} />}
            sub={r ? `${fmtUSD(r.monto30d)} a recaudar` : undefined}
          />
          <KpiCard
            label="Monto total (30d)"
            value={r ? fmtUSD(r.monto30d) : '—'}
            icon={<Wallet size={20} />}
            variant="blue"
            sub={r ? `${r.totalCritica} cuotas críticas activas` : undefined}
          />
        </div>

        {/* Tabla */}
        <div className="table-card">
          <div className="table-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1 }}>
              {/* Búsqueda */}
              <div className="search-input" style={{ maxWidth: 240 }}>
                <Search size={14} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
                <input
                  placeholder="Socio, # cliente u operación..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {/* Ventana */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Clock size={13} style={{ color: 'var(--gray-400)' }} />
                <div className="filter-chips">
                  {VENTANAS.map((v) => (
                    <button
                      key={v}
                      className={`chip ${ventana === v ? (v === 7 ? 'red active' : v === 15 ? 'orange active' : 'active') : ''}`}
                      onClick={() => setVentana(v)}
                    >
                      {v === 7 ? '🔴 7 días' : v === 15 ? '🟠 15 días' : '🟡 30 días'}
                    </button>
                  ))}
                </div>
              </div>
              {/* Prioridad */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Filter size={13} style={{ color: 'var(--gray-400)' }} />
                <div className="filter-chips">
                  {PRIORIDADES.map((p) => (
                    <button
                      key={p}
                      className={`chip ${prioridad === p ? 'active' : ''}`}
                      onClick={() => setPrioridad(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* Límite */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>Ver:</span>
              {LIMITS.map((l) => (
                <button key={l} className={`chip ${limit === l ? 'active' : ''}`} onClick={() => setLimit(l)}>{l}</button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="loading-overlay">
              <div className="spinner" />
              <p className="loading-text">Cargando cuotas próximas en riesgo…</p>
            </div>
          ) : error ? (
            <div className="empty-state">
              <AlertTriangle size={40} />
              <p style={{ color: 'var(--red)' }}>{error}</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="empty-state">
              <Shield size={40} />
              <p>No hay cuotas en riesgo para la ventana seleccionada</p>
              <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>¡La cartera está al día en este período!</p>
            </div>
          ) : (
            <div className="table-scroll-body">
              <table>
                <thead>
                  <tr>
                    <th>Socio / Operación</th>
                    <th>Próximo Pago</th>
                    <th>Cuota Estimada</th>
                    <th>Saldo Capital</th>
                    <th>Cal.</th>
                    <th>Mora actual</th>
                    <th>Prioridad</th>
                    <th>Actividad</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c: CuotaRiesgo) => (
                    <tr key={c.nroOperacion + c.nroCliente}>
                      <td>
                        <div className="td-name">{c.nombresSocio || `Socio #${c.nroCliente}`}</div>
                        <div className="td-mono">
                          #{c.nroCliente} · Op. {c.nroOperacion}
                        </div>
                        {c.fechaUltPago && (
                          <div style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 2 }}>
                            Último pago: {fmtDate(c.fechaUltPago)}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <CountdownBadge dias={c.diasHastaPago} />
                          <span style={{ fontSize: 11, color: 'var(--gray-500)' }}>
                            {fmtDate(c.fechaProxPago)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="td-currency" style={{
                          color: c.diasHastaPago <= 3 ? '#b91c1c' : c.diasHastaPago <= 7 ? '#c2410c' : 'var(--gray-700)',
                          fontWeight: 800,
                        }}>
                          {fmtUSD(c.cuotaEstimada)}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>
                          Plazo: {c.plazo || '—'} meses
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--gray-700)' }}>
                          {fmtUSD(c.saldoCapital)}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>
                          Por vencer: {fmtUSD(c.saldoPorVencer)}
                        </div>
                      </td>
                      <td>
                        <CalBadge cal={c.calificacion} />
                        <div style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 3 }}>{c.nivelRiesgo}</div>
                      </td>
                      <td>
                        {c.diasMora > 0 ? (
                          <span style={{ color: '#b91c1c', fontWeight: 700, fontSize: 12 }}>
                            ⚠️ {Math.floor(c.diasMora)}d · {c.cuotasAtrasadas > 0 ? `${Math.floor(c.cuotasAtrasadas)} cuota${c.cuotasAtrasadas > 1 ? 's' : ''}` : ''}
                          </span>
                        ) : (
                          <span style={{ color: '#15803d', fontSize: 12 }}>✓ Al día</span>
                        )}
                      </td>
                      <td>
                        <PrioBadge p={c.prioridad} />
                      </td>
                      <td>
                        <div style={{ fontSize: 11, color: 'var(--gray-600)', maxWidth: 140, lineHeight: 1.4 }}>
                          {c.actividadSocio || '—'}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>{c.destinoOp || ''}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && data && (
            <div className="pagination">
              <span className="pagination-info">
                <strong>{((page-1)*limit)+1}–{Math.min(page*limit, data.total)}</strong> de{' '}
                <strong>{data.total.toLocaleString('es-EC')}</strong> cuotas en ventana de {ventana} días
              </span>
              <div className="pagination-controls">
                <button className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const p = totalPages <= 7 ? i + 1
                    : page <= 4 ? i + 1
                    : page >= totalPages - 3 ? totalPages - 6 + i
                    : page - 3 + i;
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

        {/* Guía de interpretación */}
        <div className="card" style={{ padding: '16px 20px' }}>
          <div className="section-title" style={{ fontSize: 13, marginBottom: 10 }}>
            🎯 Guía de prioridades de contacto
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { icon: '🔴', label: 'CRÍTICA',  color: '#b91c1c', bg: '#fee2e2', desc: 'Calificación C/D/E con cuota que vence en 7 días o ya vencida. Contacto INMEDIATO hoy.' },
              { icon: '🟠', label: 'ALTA',     color: '#c2410c', bg: '#ffedd5', desc: 'Calificación B2 o superior con cuota en 15 días. Llamada en los próximos 2 días.' },
              { icon: '🟡', label: 'MEDIA',    color: '#92400e', bg: '#fef3c7', desc: 'Calificación A3/B1 con cuota en 30 días. Recordatorio preventivo por mensaje o email.' },
              { icon: '🟢', label: 'BAJA',     color: '#15803d', bg: '#dcfce7', desc: 'Socios con buen historial. Monitorear sin acción urgente necesaria.' },
            ].map((item) => (
              <div key={item.label} style={{ borderLeft: `3px solid ${item.color}`, background: item.bg, borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{item.icon} {item.label}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-600)', lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
};

export default CuotasRiesgoPage;
