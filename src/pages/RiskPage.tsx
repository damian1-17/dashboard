import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
         AlertTriangle, Wallet, Users, TrendingDown, Filter } from 'lucide-react';
import { getDelinquencyRisk } from '../api/client';
import type { DelinquencyRiskResponse, SocioRiesgo } from '../types';
import KpiCard from '../components/KpiCard';
import Topbar from '../components/Topbar';

const COLORS = {
  Bajo:     '#16a34a',
  Medio:    '#ca8a04',
  Alto:     '#ea580c',
  Crítico:  '#dc2626',
};
const DONUT_COLORS = ['#16a34a', '#facc15', '#ea580c', '#dc2626'];

const fmt = (n: number) =>
  new Intl.NumberFormat('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);

const nivelBadge = (nivel: string) => {
  const map: Record<string, string> = {
    Bajo: 'badge-bajo', Medio: 'badge-medio', Alto: 'badge-alto', Crítico: 'badge-critico',
  };
  return map[nivel] ?? 'badge-default';
};

const scoreColor = (score: number) => {
  if (score <= 30) return '#16a34a';
  if (score <= 60) return '#ca8a04';
  if (score <= 80) return '#ea580c';
  return '#dc2626';
};

const DIM_META: Record<string, { label: string; icon: string; descripcion: string }> = {
  'Comportamiento Transaccional': {
    label:       'Actividad en la Cuenta',
    icon:        '🔄',
    descripcion: '¿El socio usa su cuenta con regularidad? Mide cuántos movimientos (retiros, depósitos) ha realizado recientemente. Poca actividad puede indicar dificultades económicas.',
  },
  'Estabilidad de Ahorro': {
    label:       'Evolución del Ahorro',
    icon:        '💰',
    descripcion: '¿Sus ahorros están creciendo o cayendo? Compara el saldo actual con el anterior. Una caída brusca es una señal de alerta temprana.',
  },
  'Historial Crediticio': {
    label:       'Cumplimiento de Créditos',
    icon:        '📊',
    descripcion: '¿Paga puntualmente sus cuotas? Considera la calificación de riesgo, los días de atraso y el número de cuotas pendientes. Es el factor más importante del modelo.',
  },
  'Señales de Deterioro': {
    label:       'Alertas Combinadas',
    icon:        '⚠️',
    descripcion: 'Detecta cuando varios problemas ocurren al mismo tiempo: mora activa + ahorros cayendo + inactividad. La combinación eleva significativamente el riesgo.',
  },
  'Perfil Socioeconómico': {
    label:       'Situación Personal y Familiar',
    icon:        '🏠',
    descripcion: '¿Cuánto gana y gasta el socio? ¿Cuántas personas dependen de él/ella? Incluye ingresos, gastos, tipo de vivienda y nivel educativo. Más dependientes y gastos altos elevan el riesgo.',
  },
  'Actividad Económica': {
    label:       'Trabajo y Destino del Crédito',
    icon:        '🏢',
    descripcion: '¿A qué sector pertenece el trabajo del socio y para qué usó el crédito? Sectores como agricultura o pesca tienen ingresos más variables. Créditos de consumo son más riesgosos que los productivos.',
  },
  'Garantías y Patrimonio': {
    label:       'Respaldo del Crédito',
    icon:        '🏦',
    descripcion: '¿Qué bienes respaldan el crédito? Una garantía hipotecaria (casa) es la más sólida. Si el valor de la garantía supera el monto prestado, el riesgo es menor.',
  },
};

const scoreLabel = (score: number): { text: string; color: string; bg: string } => {
  if (score <= 20) return { text: 'Excelente',    color: '#15803d', bg: '#dcfce7' };
  if (score <= 40) return { text: 'Bueno',         color: '#16a34a', bg: '#f0fdf4' };
  if (score <= 60) return { text: 'Moderado',      color: '#92400e', bg: '#fef3c7' };
  if (score <= 80) return { text: 'Preocupante',   color: '#c2410c', bg: '#ffedd5' };
  return              { text: 'Crítico',       color: '#b91c1c', bg: '#fee2e2' };
};

const ProbabilityRing: React.FC<{ prob: number }> = ({ prob }) => {
  const r = 14; const c = 2 * Math.PI * r;
  const fill = (prob / 100) * c;
  const color = prob >= 70 ? '#dc2626' : prob >= 40 ? '#ea580c' : prob >= 20 ? '#ca8a04' : '#16a34a';
  return (
    <svg className="prob-ring" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r={r} fill="none" stroke="#e2e8f0" strokeWidth="3" />
      <circle
        cx="18" cy="18" r={r} fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={`${fill} ${c}`} strokeLinecap="round"
        transform="rotate(-90 18 18)" style={{ transition: 'stroke-dasharray .5s ease' }}
      />
      <text x="18" y="21" textAnchor="middle" fontSize="8" fontWeight="700" fill={color}>
        {prob.toFixed(0)}%
      </text>
    </svg>
  );
};

const DimCard: React.FC<{ d: any, meta: any, colorPrimary: string }> = ({ d, meta, colorPrimary }) => {
  const [isOpen, setIsOpen] = useState(false);
  const lbl = scoreLabel(d.score);
  
  return (
    <div 
      className="dim-card" 
      style={{ borderTop: `3px solid ${colorPrimary}`, cursor: 'pointer', transition: 'all 0.2s ease' }}
      onClick={() => setIsOpen(!isOpen)}
      title="Clic para ver descripción"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-700)' }}>
          {meta?.icon} {meta?.label ?? d.dimension}
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: lbl.color, background: lbl.bg, borderRadius: 12, padding: '2px 7px', whiteSpace: 'nowrap' }}>
          {lbl.text}
        </span>
      </div>
      
      {isOpen && (
        <div style={{ fontSize: 11, color: 'var(--gray-500)', lineHeight: 1.5, marginBottom: 8, marginTop: 6, paddingTop: 6, borderTop: '1px solid #f1f5f9' }}>
          {meta?.descripcion}
        </div>
      )}
      
      <div className="dim-card-bar" style={{ marginTop: isOpen ? 0 : 8 }}>
        <div className="dim-card-bar-fill" style={{ width: `${d.score}%`, background: scoreColor(d.score) }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
        <span style={{ fontSize: 10, color: 'var(--gray-400)' }}>Impacto: {(d.peso * 100).toFixed(0)}% del score</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: scoreColor(d.score) }}>{d.score.toFixed(0)}/100</span>
      </div>
    </div>
  );
};

const LIMITS = [10, 20, 50];
const NIVELES = ['Todos', 'Bajo', 'Medio', 'Alto', 'Crítico'];

const RiskPage: React.FC = () => {
  const [data, setData]       = useState<DelinquencyRiskResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [page, setPage]       = useState(1);
  const [limit, setLimit]     = useState(20);
  const [nivel, setNivel]     = useState('Todos');
  const [search, setSearch]   = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDelinquencyRisk({
        page,
        limit,
        nivel: nivel === 'Todos' ? undefined : nivel,
        ...(dateFrom ? { startDate: dateFrom } : {}),
        ...(dateTo   ? { endDate:   dateTo   } : {}),
      });
      setData(res);
    } catch {
      setError('No se pudo conectar con el servidor. Verifique que el backend esté activo.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, nivel, dateFrom, dateTo]);

  useEffect(() => { setPage(1); }, [nivel, limit]);
  useEffect(() => { void load(); }, [load]);

  const donutData = data
    ? [
        { name: 'Bajo',     value: data.distribucion.bajo    },
        { name: 'Medio',    value: data.distribucion.medio   },
        { name: 'Alto',     value: data.distribucion.alto    },
        { name: 'Crítico',  value: data.distribucion.critico },
      ]
    : [];

  const totalDist = data
    ? data.distribucion.bajo + data.distribucion.medio +
      data.distribucion.alto + data.distribucion.critico
    : 0;

  const filteredData = search.trim()
    ? (data?.data ?? []).filter((s) =>
        s.nombre.toLowerCase().includes(search.toLowerCase()) ||
        s.nroCliente.includes(search)
      )
    : (data?.data ?? []);

  const totalPages = data ? Math.ceil(data.totalSocios / limit) : 1;

  return (
    <>
      <Topbar
        title="Riesgo de Morosidad"
        subtitle="Análisis por socio — modelo de 7 dimensiones (4 internas + 3 externas)"
        corteAhorro={data?.fechaCorteAhorro}
        corteCredito={data?.fechaCorteCredito}
        onRefresh={load}
        loading={loading}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateChange={(from, to) => { setDateFrom(from); setDateTo(to); setPage(1); }}
      />

      <div className="content">
        {/* KPI Cards */}
        <div className="kpi-grid">
          <KpiCard
            label="Cartera Total"
            value={data ? fmtCurrency(data.carteraTotal) : '—'}
            icon={<Wallet size={20} />}
            sub="Créditos vigentes"
          />
          <KpiCard
            label="Tasa de Mora Actual"
            value={data ? `${fmt(data.tasaMoraActual)}%` : '—'}
            icon={<TrendingDown size={20} />}
            variant="red"
            sub="Saldo mora / cartera total"
          />
          <KpiCard
            label="Total Socios Analizados"
            value={data ? data.totalSocios.toLocaleString('es-EC') : '—'}
            icon={<Users size={20} />}
            variant="blue"
          />
          <KpiCard
            label="Socios en Riesgo Alto/Crítico"
            value={data
              ? (data.distribucion.alto + data.distribucion.critico).toLocaleString('es-EC')
              : '—'}
            icon={<AlertTriangle size={20} />}
            variant="yellow"
            sub={data
              ? `${fmt(((data.distribucion.alto + data.distribucion.critico) / (totalDist || 1)) * 100)}% de la cartera`
              : undefined}
          />
        </div>

        {/* Charts Row */}
        <div className="charts-row">
          {/* Donut */}
          <div className="card">
            <div className="section-header">
              <div>
                <div className="section-title">Distribución de Riesgo</div>
                <div className="section-subtitle">Por nivel de score global</div>
              </div>
            </div>
            <div className="donut-wrap">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={donutData} cx="50%" cy="50%"
                    innerRadius={52} outerRadius={75}
                    paddingAngle={3} dataKey="value"
                  >
                    {donutData.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) =>
                      [`${val.toLocaleString('es-EC')} socios`, '']}
                    contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="legend-list">
                {donutData.map((d, i) => (
                  <div className="legend-item" key={d.name}>
                    <div className="legend-dot" style={{ background: DONUT_COLORS[i] }} />
                    <span className="legend-name">{d.name}</span>
                    <span className="legend-val">
                      {d.value.toLocaleString('es-EC')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Distribution Bars */}
          <div className="card">
            <div className="section-header">
              <div>
                <div className="section-title">Porcentaje por Nivel</div>
                <div className="section-subtitle">Sobre el total de socios analizados</div>
              </div>
            </div>
            <div className="dist-bar-list">
              {donutData.map((d, i) => {
                const pct = totalDist ? (d.value / totalDist) * 100 : 0;
                return (
                  <div className="dist-bar-item" key={d.name}>
                    <div className="dist-bar-label">
                      <span>{d.name}</span>
                      <span>{d.value.toLocaleString('es-EC')} ({fmt(pct)}%)</span>
                    </div>
                    <div className="dist-bar-track">
                      <div
                        className="dist-bar-fill"
                        style={{ width: `${pct}%`, background: DONUT_COLORS[i] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="table-card">
          <div className="table-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1 }}>
              {/* Search */}
              <div className="search-input" style={{ maxWidth: 260 }}>
                <Search size={14} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
                <input
                  placeholder="Buscar socio o número..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    if (searchRef.current) clearTimeout(searchRef.current);
                  }}
                />
              </div>

              {/* Nivel chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Filter size={13} style={{ color: 'var(--gray-400)' }} />
                <div className="filter-chips">
                  {NIVELES.map((n) => (
                    <button
                      key={n}
                      className={`chip ${nivel === n ? (
                        n === 'Bajo' ? 'active' : n === 'Medio' ? 'yellow active' : n === 'Alto' ? 'orange active' : n === 'Crítico' ? 'red active' : 'active'
                      ) : ''}`}
                      onClick={() => { setNivel(n); setSearch(''); }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Limit selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>Mostrar:</span>
              {LIMITS.map((l) => (
                <button
                  key={l}
                  className={`chip ${limit === l ? 'active' : ''}`}
                  onClick={() => setLimit(l)}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="loading-overlay">
              <div className="spinner" />
              <p className="loading-text">Calculando scores de riesgo…</p>
            </div>
          ) : error ? (
            <div className="empty-state">
              <AlertTriangle size={40} />
              <p style={{ color: 'var(--red)' }}>{error}</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="empty-state">
              <Users size={40} />
              <p>No se encontraron socios con los filtros aplicados</p>
            </div>
          ) : (
            <div className="table-scroll-body">
              <table>
                <thead>
                  <tr>
                    <th>Socio</th>
                    <th>Score</th>
                    <th>Nivel</th>
                    <th>Prob. Mora</th>
                    <th>Saldo Prom.</th>
                    <th>Señal Principal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((s: SocioRiesgo) => {
                    const isExpanded = expanded === s.nroCliente;
                    return (
                      <React.Fragment key={s.nroCliente}>
                        <tr>
                          <td>
                            <div className="td-name">{s.nombre}</div>
                            <div className="td-mono">#{s.nroCliente}</div>
                          </td>
                          <td>
                            <div className="score-cell">
                              <span className="score-num">{s.scoreGlobal.toFixed(1)}</span>
                              <div className="score-bar">
                                <div
                                  className="score-fill"
                                  style={{
                                    width: `${s.scoreGlobal}%`,
                                    background: scoreColor(s.scoreGlobal),
                                  }}
                                />
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                              <span style={{ fontSize: 10, background: '#f0fdf4', color: '#15803d', borderRadius: 4, padding: '1px 5px', fontWeight: 600 }}>
                                🏦 {s.scoreInterno?.toFixed(0) ?? '—'}
                              </span>
                              <span style={{ fontSize: 10, background: '#eff6ff', color: '#2563eb', borderRadius: 4, padding: '1px 5px', fontWeight: 600 }}>
                                🌍 {s.scoreExterno?.toFixed(0) ?? '—'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${nivelBadge(s.nivelRiesgo)}`}>
                              {s.nivelRiesgo}
                            </span>
                          </td>
                          <td>
                            <div className="prob-cell">
                              <ProbabilityRing prob={s.probabilidadMora} />
                            </div>
                          </td>
                          <td>
                            <span className="td-currency">{fmtCurrency(s.saldoPromedio)}</span>
                          </td>
                          <td>
                            <span className="senal-cell" title={s.senalPrincipal}>
                              {s.senalPrincipal}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-ghost"
                              style={{ padding: '5px 8px', fontSize: 12 }}
                              onClick={() => setExpanded(isExpanded ? null : s.nroCliente)}
                            >
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="dim-expand-row">
                            <td colSpan={7}>
                              {/* Internas */}
                              <div style={{ marginBottom: 12 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <span style={{ background: '#dcfce7', padding: '3px 10px', borderRadius: 20 }}>🏦 Factores Internos de la Cooperativa &mdash; Score {s.scoreInterno?.toFixed(1) ?? '—'}/100</span>
                                </div>
                                <div className="dim-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                                  {s.dimensiones.filter(d => d.tipo === 'Interna').map((d) => (
                                    <DimCard 
                                      key={d.dimension} 
                                      d={d} 
                                      meta={DIM_META[d.dimension]} 
                                      colorPrimary="#16a34a" 
                                    />
                                  ))}
                                </div>
                              </div>
                              {/* Externas */}
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <span style={{ background: '#eff6ff', padding: '3px 10px', borderRadius: 20 }}>🌍 Factores Externos del Socio &mdash; Score {s.scoreExterno?.toFixed(1) ?? '—'}/100</span>
                                </div>
                                <div className="dim-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                                  {s.dimensiones.filter(d => d.tipo === 'Externa').map((d) => (
                                    <DimCard 
                                      key={d.dimension} 
                                      d={d} 
                                      meta={DIM_META[d.dimension]} 
                                      colorPrimary="#3b82f6" 
                                    />
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && data && (
            <div className="pagination">
              <span className="pagination-info">
                Mostrando <strong>{((page - 1) * limit) + 1}–{Math.min(page * limit, data.totalSocios)}</strong> de{' '}
                <strong>{data.totalSocios.toLocaleString('es-EC')}</strong> socios
              </span>
              <div className="pagination-controls">
                <button
                  className="page-btn"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const p = totalPages <= 7 ? i + 1 : (
                    page <= 4 ? i + 1 :
                    page >= totalPages - 3 ? totalPages - 6 + i :
                    page - 3 + i
                  );
                  return (
                    <button
                      key={p}
                      className={`page-btn ${page === p ? 'active' : ''}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  className="page-btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default RiskPage;
