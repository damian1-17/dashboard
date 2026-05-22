import axios from 'axios';
import type { DelinquencyRiskResponse, ActiveCreditsResponse, PredictionsResponse, CuotasRiesgoResponse, ConcentracionResponse, RetencionResponse, RecuperabilidadResponse } from '../types';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 60000,
});

export const getDelinquencyRisk = (params: {
  page?: number;
  limit?: number;
  nivel?: string;
  startDate?: string;
  endDate?: string;
}): Promise<DelinquencyRiskResponse> =>
  api.get('/dashboard/delinquency-risk', { params }).then((r) => r.data);

export const getActiveCredits = (params: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<ActiveCreditsResponse> =>
  api.get('/dashboard/active-credits', { params }).then((r) => r.data);

export const getPredictions = (params: {
  page?:      number;
  limit?:     number;
  horizonte?: string;
}): Promise<PredictionsResponse> =>
  api.get('/dashboard/predictions', { params }).then((r) => r.data);

export const getCuotasEnRiesgo = (params: {
  page?:      number;
  limit?:     number;
  ventana?:   number;
  prioridad?: string;
}): Promise<CuotasRiesgoResponse> =>
  api.get('/dashboard/cuotas-riesgo', { params }).then((r) => r.data);

export const getConcentracionCartera = (): Promise<ConcentracionResponse> =>
  api.get('/dashboard/concentracion').then((r) => r.data);

export const getRetencionSocios = (params: {
  page?:   number;
  limit?:  number;
  riesgo?: string;
}): Promise<RetencionResponse> =>
  api.get('/dashboard/retencion', { params }).then((r) => r.data);

export const getRecuperabilidadCartera = (params: {
  page?:     number;
  limit?:    number;
  segmento?: string;
}): Promise<RecuperabilidadResponse> =>
  api.get('/dashboard/recuperabilidad', { params }).then((r) => r.data);
