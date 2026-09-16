import type { AppState, HistoricalObservation, Organization, Period } from "../types/domain";

export const DEMO_ORGANIZATION: Organization = {
  id: "org-comercial-andina",
  name: "Comercial Andina S.A.C.",
  sector: "comercial",
  size: "mediana",
  description: "Distribución de productos de consumo y suministros para negocios del sur del Perú.",
  currency: "PEN",
  createdAt: "2026-08-01T09:00:00-05:00",
  status: "ACTIVA",
};

export const DEMO_PERIODS: Period[] = [
  { id: "period-2026-08", organizationId: DEMO_ORGANIZATION.id, code: "2026-08", label: "Agosto 2026", startsOn: "2026-08-01", endsOn: "2026-08-31" },
  { id: "period-2026-09", organizationId: DEMO_ORGANIZATION.id, code: "2026-09", label: "Septiembre 2026", startsOn: "2026-09-01", endsOn: "2026-09-30" },
  { id: "period-2026-10", organizationId: DEMO_ORGANIZATION.id, code: "2026-10", label: "Octubre 2026", startsOn: "2026-10-01", endsOn: "2026-10-31" },
];

const observation = (
  id: string,
  periodId: string,
  kpi: string,
  value: number,
  unit: string,
  observedAt: string,
): HistoricalObservation => ({
  id,
  organizationId: DEMO_ORGANIZATION.id,
  periodId,
  kpi,
  value,
  unit,
  source: "Dataset sintético de demostración",
  quality: "ALTA",
  observedAt,
  createdAt: `${observedAt}T18:00:00-05:00`,
});

export const DEMO_OBSERVATIONS: HistoricalObservation[] = [
  observation("obs-aug-sales", "period-2026-08", "Ventas", 68200, "PEN", "2026-08-31"),
  observation("obs-aug-costs", "period-2026-08", "Costos operativos", 40100, "PEN", "2026-08-31"),
  observation("obs-aug-customers", "period-2026-08", "Clientes activos", 418, "clientes", "2026-08-31"),
  observation("obs-aug-conversion", "period-2026-08", "Conversión", 3.8, "%", "2026-08-31"),
  observation("obs-sep-sales", "period-2026-09", "Ventas", 70400, "PEN", "2026-09-30"),
  observation("obs-sep-costs", "period-2026-09", "Costos operativos", 41400, "PEN", "2026-09-30"),
  observation("obs-sep-customers", "period-2026-09", "Clientes activos", 436, "clientes", "2026-09-30"),
  observation("obs-sep-conversion", "period-2026-09", "Conversión", 4.1, "%", "2026-09-30"),
  observation("obs-oct-sales", "period-2026-10", "Ventas", 73100, "PEN", "2026-10-31"),
  observation("obs-oct-costs", "period-2026-10", "Costos operativos", 42200, "PEN", "2026-10-31"),
  observation("obs-oct-customers", "period-2026-10", "Clientes activos", 451, "clientes", "2026-10-31"),
  observation("obs-oct-conversion", "period-2026-10", "Conversión", 4.3, "%", "2026-10-31"),
];

export function createDemoState(): AppState {
  return {
    schemaVersion: 1,
    organizations: [DEMO_ORGANIZATION],
    periods: DEMO_PERIODS,
    observations: DEMO_OBSERVATIONS,
    imports: [],
    aiHistory: [],
    activeOrganizationId: DEMO_ORGANIZATION.id,
    activePeriodId: "period-2026-09",
  };
}
