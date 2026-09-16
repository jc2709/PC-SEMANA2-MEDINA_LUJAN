import type { ForecastModel, KpiDefinition, KpiForecast, HistoricalObservation, KpiDirection, Period, SimulationVariables } from "../../types/domain";

export type TrafficLight = "VERDE" | "AMBAR" | "ROJO" | "GRIS";

export type SimulationResult = {
  kpiName: string;
  unit: string;
  baseValue: number;
  scenarioValue: number;
  absoluteDelta: number;
  percentDelta: number | null;
  explanation: string;
};

const MODEL_LABELS: Record<ForecastModel, string> = {
  NAIVE: "Último valor",
  MEDIA_MOVIL: "Media móvil (3)",
  TENDENCIA_LINEAL: "Tendencia lineal",
  SUAVIZACION_EXPONENCIAL: "Suavización exponencial",
};

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function cleanName(value: string) {
  return value.trim().toLocaleLowerCase();
}

function lastValue(values: number[], fallback: number) {
  return values.length ? values[values.length - 1] : fallback;
}

function naive(values: number[]) {
  return lastValue(values, 0);
}

function movingAverage(values: number[], window = 3) {
  const sample = values.slice(-window);
  return sample.length ? sample.reduce((sum, value) => sum + value, 0) / sample.length : 0;
}

function linearTrend(values: number[]) {
  if (values.length < 2) return naive(values);
  const xMean = (values.length - 1) / 2;
  const yMean = values.reduce((sum, value) => sum + value, 0) / values.length;
  let numerator = 0;
  let denominator = 0;
  values.forEach((value, index) => {
    numerator += (index - xMean) * (value - yMean);
    denominator += (index - xMean) ** 2;
  });
  const slope = denominator ? numerator / denominator : 0;
  return Math.max(0, yMean + slope * values.length);
}

function exponential(values: number[], alpha = 0.5) {
  if (!values.length) return 0;
  let level = values[0];
  for (const value of values.slice(1)) level = alpha * value + (1 - alpha) * level;
  return level;
}

function forecastWithModel(model: ForecastModel, values: number[]) {
  if (model === "MEDIA_MOVIL") return movingAverage(values);
  if (model === "TENDENCIA_LINEAL") return linearTrend(values);
  if (model === "SUAVIZACION_EXPONENCIAL") return exponential(values);
  return naive(values);
}

function errorForModel(model: ForecastModel, values: number[]) {
  if (values.length < 3) return null;
  const errors: number[] = [];
  for (let index = 1; index < values.length; index += 1) {
    const history = values.slice(0, index);
    if (model === "TENDENCIA_LINEAL" && history.length < 2) continue;
    errors.push(Math.abs(values[index] - forecastWithModel(model, history)));
  }
  return errors.length ? errors.reduce((sum, value) => sum + value, 0) / errors.length : null;
}

function deviation(values: number[]) {
  if (values.length < 2) return Math.max(Math.abs(values[0] ?? 0) * 0.1, 1);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function modelLabel(model: ForecastModel) {
  return MODEL_LABELS[model];
}

export function nextPeriodLabel(period?: Period) {
  if (!period) return "Siguiente periodo";
  const date = new Date(`${period.endsOn}T12:00:00Z`);
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + 1);
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function observationsForKpi(definition: KpiDefinition, observations: HistoricalObservation[]) {
  return observations
    .filter((item) => cleanName(item.kpi) === cleanName(definition.name))
    .sort((a, b) => a.observedAt.localeCompare(b.observedAt));
}

export function latestObservation(definition: KpiDefinition, observations: HistoricalObservation[]) {
  return observationsForKpi(definition, observations).at(-1);
}

export function buildForecast(definition: KpiDefinition, observations: HistoricalObservation[], period: Period | undefined, id: string, now = new Date().toISOString()): KpiForecast {
  const records = observationsForKpi(definition, observations);
  const values = records.map((item) => item.value);
  const candidates: ForecastModel[] = ["NAIVE", "MEDIA_MOVIL", "TENDENCIA_LINEAL", "SUAVIZACION_EXPONENCIAL"];
  const scores = candidates.map((model) => ({ model, score: errorForModel(model, values) }));
  const scored = scores.filter((item) => item.score !== null) as Array<{ model: ForecastModel; score: number }>;
  const selected = scored.length ? scored.toSorted((a, b) => a.score - b.score)[0] : { model: "NAIVE" as const, score: null };
  const prediction = Math.max(0, forecastWithModel(selected.model, values.length ? values : [definition.baseline]));
  const spread = Math.max(deviation(values), Math.abs(prediction) * 0.05, 1);
  const latest = values.at(-1);
  const previous = values.at(-2);
  const trendPercent = latest !== undefined && previous !== undefined && previous !== 0 ? ((latest - previous) / Math.abs(previous)) * 100 : null;
  const cutoffDate = records.at(-1)?.observedAt ?? period?.endsOn ?? now.slice(0, 10);
  const sufficient = values.length >= 3;
  return {
    id,
    organizationId: definition.organizationId,
    periodId: period?.id ?? "",
    kpiDefinitionId: definition.id,
    model: selected.model,
    parameters: selected.model === "MEDIA_MOVIL" ? "ventana=3" : selected.model === "SUAVIZACION_EXPONENCIAL" ? "alpha=0.5" : "selección automática por MAE",
    metricName: "MAE",
    metricValue: selected.score,
    cutoffDate,
    nextPeriodLabel: nextPeriodLabel(period),
    prediction: Number(prediction.toFixed(2)),
    lowerBound: Number(Math.max(0, prediction - 1.96 * spread).toFixed(2)),
    upperBound: Number((prediction + 1.96 * spread).toFixed(2)),
    trendPercent: trendPercent === null ? null : Number(trendPercent.toFixed(2)),
    observationCount: values.length,
    quality: sufficient ? "SUFICIENTE" : "INSUFICIENTE",
    explanation: sufficient
      ? `Se compararon ${scored.length} modelos con MAE y se eligió ${modelLabel(selected.model)}. El rango usa la variabilidad histórica; no es una garantía.`
      : `HISTORIAL INSUFICIENTE: hay ${values.length} observación(es). Se muestra un escenario estimado, no una predicción estadística confiable.`,
    createdAt: now,
  };
}

export function kpiTrafficLight(definition: KpiDefinition, actual?: number): TrafficLight {
  if (actual === undefined || !Number.isFinite(actual)) return "GRIS";
  const margin = Math.abs(definition.target) * (definition.tolerance / 100);
  if (definition.direction === "MENOR_MEJOR") {
    if (actual <= definition.target) return "VERDE";
    if (actual <= definition.target + margin) return "AMBAR";
    return "ROJO";
  }
  if (actual >= definition.target) return "VERDE";
  if (actual >= definition.target - margin) return "AMBAR";
  return "ROJO";
}

function impactForKpi(name: string, baseValue: number, variables: SimulationVariables) {
  const normalized = cleanName(name);
  const delayPenalty = variables.projectDelay * 0.04;
  if (normalized.includes("venta")) return baseValue * (1 + variables.marketing * 0.003 + variables.conversion * 0.006 + variables.price * 0.002 + variables.capacity * 0.001 - delayPenalty);
  if (normalized.includes("costo")) return baseValue * (1 + variables.costs * 0.01 + variables.marketing * 0.0015 - variables.capacity * 0.0008);
  if (normalized.includes("convers")) return baseValue * (1 + variables.conversion * 0.01 + variables.marketing * 0.002 - variables.projectDelay * 0.01);
  if (normalized.includes("cliente")) return baseValue * (1 + variables.marketing * 0.002 + variables.conversion * 0.005 + variables.capacity * 0.001 - delayPenalty);
  return baseValue * (1 + variables.capacity * 0.001 - delayPenalty);
}

export function buildSimulationResults(definitions: KpiDefinition[], observations: HistoricalObservation[], forecasts: KpiForecast[], variables: SimulationVariables): SimulationResult[] {
  return definitions.map((definition) => {
    const actual = latestObservation(definition, observations)?.value;
    const forecast = forecasts.find((item) => item.kpiDefinitionId === definition.id);
    const baseValue = forecast?.prediction ?? actual ?? definition.baseline;
    const scenarioValue = Math.max(0, impactForKpi(definition.name, baseValue, variables));
    const absoluteDelta = scenarioValue - baseValue;
    return {
      kpiName: definition.name,
      unit: definition.unit,
      baseValue,
      scenarioValue: Number(scenarioValue.toFixed(2)),
      absoluteDelta: Number(absoluteDelta.toFixed(2)),
      percentDelta: baseValue ? Number(((absoluteDelta / Math.abs(baseValue)) * 100).toFixed(2)) : null,
      explanation: "Impacto estimado con reglas transparentes del MVP; no sustituye una validación operativa.",
    };
  });
}

export function directionLabel(direction: KpiDirection) {
  return direction === "MENOR_MEJOR" ? "Menor es mejor" : "Mayor es mejor";
}
