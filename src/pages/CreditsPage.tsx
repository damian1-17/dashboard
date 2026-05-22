import React, { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, CreditCard, AlertCircle, Users } from 'lucide-react';
import { getActiveCredits } from '../api/client';
import type { ActiveCreditsResponse, ActiveCredit } from '../types';
import Topbar from '../components/Topbar';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);

const calBadgeClass = (cal: string) => {
  if (!cal) return 'badge-default';
  if (cal.startsWith('A1')) return 'badge-a1';
  if (cal.startsWith('A')) return 'badge-a2';
  if (cal.startsWith('B')) return 'badge-b';
  if (cal.startsWith('C')) return 'badge-c';
  return 'badge-default';
};

const LIMITS = [10, 20, 50];

const CreditsPage: React.FC = () => {
  const [data, setData]       = useState<ActiveCreditsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [page, setPage]       = useState(1);
  const [limit, setLimit]     = useState(20);
  const [search, setSearch]   = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getActiveCredits({ page, limit, search: search || undefined });
      setData(res);
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => { setPage(1); }, [limit, search]);
  useEffect(() => { void load(); }, [load]);

  const handleSearch = (val: string) => {
    setSearchInput(val);
    if (searchTimer) clearTimeout(searchTimer);
    const t = setTimeout(() => setSearch(val), 400);
    setSearchTimer(t);
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  // Summary metrics
  const totalCartera = data?.data.reduce((s, c) => s + (c.saldoCapital ?? 0), 0) ?? 0;
  const conMora      = data?.data.filter((c) => (c.diasMora ?? 0) > 0).length ?? 0;

  return (
    <>
      <Topbar
        title="Créditos Activos"
        subtitle="Operaciones vigentes con saldo de capital positivo"
        onRefresh={load}
        loading={loading}
      />

      <div className="content">
        {/* Mini KPIs */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-header">
              <div className="kpi-icon"><CreditCard size={20} /></div>
            </div>
            <div className="kpi-value">{data?.total.toLocaleString('es-EC') ?? '—'}</div>
            <div className="kpi-label">Operaciones Vigentes</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-header">
              <div className="kpi-icon"><Users size={20} /></div>
            </div>
            <div className="kpi-value">{fmtCurrency(totalCartera)}</div>
            <div className="kpi-label">Saldo de Página Actual</div>
          </div>
          <div className="kpi-card red">
            <div className="kpi-header">
              <div className="kpi-icon"><AlertCircle size={20} /></div>
            </div>
            <div className="kpi-value">{conMora}</div>
            <div className="kpi-label">Con Mora (esta página)</div>
          </div>
          <div className="kpi-card yellow">
            <div className="kpi-header">
              <div className="kpi-icon"><CreditCard size={20} /></div>
            </div>
            <div className="kpi-value">
              {data
                ? fmtCurrency(totalCartera / Math.max(data.data.length, 1))
                : '—'}
            </div>
            <div className="kpi-label">Saldo Promedio por Operación</div>
          </div>
        </div>

        {/* Table */}
        <div className="table-card">
          <div className="table-toolbar">
            <div className="search-input" style={{ maxWidth: 360 }}>
              <Search size={14} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
              <input
                placeholder="Buscar por nombre, identificación u operación…"
                value={searchInput}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
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
              <p className="loading-text">Cargando créditos activos…</p>
            </div>
          ) : error ? (
            <div className="empty-state">
              <AlertCircle size={40} />
              <p style={{ color: 'var(--red)' }}>{error}</p>
            </div>
          ) : (data?.data.length ?? 0) === 0 ? (
            <div className="empty-state">
              <CreditCard size={40} />
              <p>No se encontraron operaciones</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Socio</th>
                    <th>N° Operación</th>
                    <th>Calificación</th>
                    <th>Monto Original</th>
                    <th>Saldo Capital</th>
                    <th>Días Mora</th>
                    <th>Estado</th>
                    <th>Fecha Concesión</th>
                  </tr>
                </thead>
                <tbody>
                  {data!.data.map((c: ActiveCredit) => (
                    <tr key={c.nroOperacion}>
                      <td>
                        <div className="td-name">{c.nombresSocio}</div>
                        <div className="td-mono">#{c.nroCliente}</div>
                      </td>
                      <td className="td-mono">{c.nroOperacion}</td>
                      <td>
                        <span className={`badge ${calBadgeClass(c.calificacion)}`}>
                          {c.calificacion || '—'}
                        </span>
                      </td>
                      <td className="td-currency">{fmtCurrency(c.montoCredito)}</td>
                      <td className="td-currency">{fmtCurrency(c.saldoCapital)}</td>
                      <td>
                        {c.diasMora > 0 ? (
                          <span style={{ color: 'var(--red)', fontWeight: 700 }}>
                            {c.diasMora} días
                          </span>
                        ) : (
                          <span style={{ color: 'var(--green-600)', fontWeight: 600 }}>Al día</span>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-a1">{c.estadoOp}</span>
                      </td>
                      <td className="td-mono">
                        {c.fechaConcesionOp
                          ? new Date(c.fechaConcesionOp).toLocaleDateString('es-EC')
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && data && data.total > 0 && (
            <div className="pagination">
              <span className="pagination-info">
                Mostrando <strong>{((page - 1) * limit) + 1}–{Math.min(page * limit, data.total)}</strong>{' '}
                de <strong>{data.total.toLocaleString('es-EC')}</strong> operaciones
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
                    <button
                      key={p}
                      className={`page-btn ${page === p ? 'active' : ''}`}
                      onClick={() => setPage(p)}
                    >
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
      </div>
    </>
  );
};

export default CreditsPage;
