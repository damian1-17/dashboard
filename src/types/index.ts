// ─── Delinquency Risk ─────────────────────────────────────────────────────────
export interface DimensionScore {
  dimension: string;
  tipo: 'Interna' | 'Externa';
  peso: number;
  score: number;
  contribucion: number;
}

export interface SocioRiesgo {
  nroCliente: string;
  nombre: string;
  scoreGlobal: number;
  scoreInterno: number;
  scoreExterno: number;
  nivelRiesgo: 'Bajo' | 'Medio' | 'Alto' | 'Crítico';
  senalPrincipal: string;
  saldoPromedio: number;
  probabilidadMora: number;
  dimensiones: DimensionScore[];
}

export interface DistribucionRiesgo {
  bajo: number;
  medio: number;
  alto: number;
  critico: number;
}

export interface DelinquencyRiskResponse {
  fechaCorteAhorro: string;
  fechaCorteCredito: string;
  totalSocios: number;
  carteraTotal: number;
  tasaMoraActual: number;
  distribucion: DistribucionRiesgo;
  data: SocioRiesgo[];
  page: number;
  limit: number;
}

// ─── Active Credits ────────────────────────────────────────────────────────────
export interface ActiveCredit {
  nroCliente: string;
  nombresSocio: string;
  nroOperacion: string;
  estadoOp: string;
  montoCredito: number;
  saldoCapital: number;
  diasMora: number;
  calificacion: string;
  fechaConcesionOp: string;
}

export interface ActiveCreditsResponse {
  data: ActiveCredit[];
  total: number;
  page: number;
  limit: number;
}

// ─── Predictions ──────────────────────────────────────────────────────────────
export interface SocioPrediccion {
  nroCliente:      string;
  nombre:          string;
  horizonte:       '10 días' | '20 días' | '30 días';
  scoreGlobal:     number;
  prob10d:         number;
  prob20d:         number;
  prob30d:         number;
  montoEnRiesgo:   number;
  saldoPromedio:   number;
  factorPrincipal: string;
  senalPrincipal:  string;
  nivelRiesgo:     string;
}

export interface PredictionResumen {
  total10d:           number;
  total20d:           number;
  total30d:           number;
  totalGeneral:       number;
  montoEnRiesgo10d:   number;
  montoEnRiesgo20d:   number;
  montoEnRiesgo30d:   number;
  montoTotalEnRiesgo: number;
}

export interface PredictionsResponse {
  resumen: PredictionResumen;
  data:    SocioPrediccion[];
  page:    number;
  limit:   number;
  total:   number;
}

// ─── Cuotas Próximas en Riesgo ────────────────────────────────────────────────
export interface CuotaRiesgo {
  nroCliente:      string;
  nombresSocio:    string;
  nroOperacion:    string;
  fechaProxPago:   string;
  diasHastaPago:   number;
  cuotaEstimada:   number;
  saldoCapital:    number;
  saldoPorVencer:  number;
  calificacion:    string;
  nivelRiesgo:     string;
  diasMora:        number;
  prioridad:       'CRÍTICA' | 'ALTA' | 'MEDIA' | 'BAJA';
  destinoOp:       string;
  actividadSocio:  string;
  plazo:           string;
  cuotasAtrasadas: number;
  fechaUltPago:    string | null;
}

export interface CuotasRiesgoResumen {
  total7d:       number;
  total15d:      number;
  total30d:      number;
  totalCritica:  number;
  monto7d:       number;
  monto15d:      number;
  monto30d:      number;
}

export interface CuotasRiesgoResponse {
  resumen: CuotasRiesgoResumen;
  data:    CuotaRiesgo[];
  page:    number;
  limit:   number;
  total:   number;
}

// ─── Concentración de Cartera ─────────────────────────────────────────────────
export interface ConcentracionItem {
  categoria: string;
  cantidadOperaciones: number;
  saldoCapitalTotal: number;
  saldoCapitalMora: number;
  indiceMora: number;
  participacion: number;
}

export interface ConcentracionResponse {
  carteraTotal: number;
  moraTotal: number;
  indiceMoraGlobal: number;
  porActividad: ConcentracionItem[];
  porDestino: ConcentracionItem[];
  porCiudad: ConcentracionItem[];
}

// ─── Retención de Socios (Riesgo de Fuga / Liquidez) ────────────────────────
export interface SocioRetencion {
  nroCliente: string;
  nombresSocio: string;
  saldoAhorro: number;
  diasInactividad: number;
  fechaUltMovimiento: string | null;
  tieneCredito: boolean;
  tieneCooplinea: boolean;
  probabilidadFuga: number;
  nivelRiesgo: string;
  motivoPrincipal: string;
}

export interface RetencionResumen {
  totalRiesgoAlto: number;
  totalRiesgoMedio: number;
  saldoEnRiesgo: number;
}

export interface RetencionResponse {
  resumen: RetencionResumen;
  data: SocioRetencion[];
  page: number;
  limit: number;
  total: number;
}

// ─── Recuperabilidad de Cartera Vencida ─────────────────────────────────────
export interface SocioRecuperable {
  nroCliente: string;
  nombresSocio: string;
  nroOperacion: string;
  diasMora: number;
  saldoVencido: number;
  tipoGarantia: string;
  segmento: string; // 'Alta' | 'Media' | 'Baja'
  scoreRecuperacion: number;
  factorPositivo: string;
  ingresos: number;
}

export interface RecuperabilidadResumen {
  totalAlta: number;
  totalMedia: number;
  totalBaja: number;
  montoAlta: number;
  montoMedia: number;
  montoBaja: number;
}

export interface RecuperabilidadResponse {
  resumen: RecuperabilidadResumen;
  data: SocioRecuperable[];
  page: number;
  limit: number;
  total: number;
}
