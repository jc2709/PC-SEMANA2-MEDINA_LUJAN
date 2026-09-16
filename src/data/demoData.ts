import type { AppState, CanvasBlockKey, CanvasElement, CanvasScenario, CanvasVersion, HistoricalObservation, Organization, Period } from "../types/domain";

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

const demoElement = (id: string, block: CanvasBlockKey, title: string, description: string, extra: Partial<CanvasElement> = {}): CanvasElement => ({
  id,
  block,
  title,
  description,
  hypothesis: "",
  evidence: "Observaciones históricas y conocimiento operativo registrado.",
  responsible: "Equipo comercial",
  relatedKpi: "",
  confidence: 70,
  tags: [],
  comments: "",
  source: "Taller interno de demostración",
  createdAt: "2026-09-01T09:00:00-05:00",
  updatedAt: "2026-09-01T09:00:00-05:00",
  ...extra,
});

const DEMO_AS_IS_ELEMENTS: CanvasElement[] = [
  demoElement("canvas-as-is-segments", "customer-segments", "Negocios minoristas del sur", "Bodegas y pequeños comercios que necesitan reposición frecuente.", { relatedKpi: "Clientes activos" }),
  demoElement("canvas-as-is-value", "value-propositions", "Abastecimiento confiable", "Portafolio de consumo y suministros con atención cercana.", { relatedKpi: "Ventas" }),
  demoElement("canvas-as-is-channels", "channels", "Venta presencial", "Pedidos atendidos por equipo comercial y contacto directo.", { relatedKpi: "Ventas" }),
  demoElement("canvas-as-is-relationships", "customer-relationships", "Asesoría comercial", "Relación basada en seguimiento y resolución rápida de pedidos."),
  demoElement("canvas-as-is-revenue", "revenue-streams", "Venta de productos", "Ingresos por comercialización de productos de consumo y suministros.", { relatedKpi: "Ventas" }),
  demoElement("canvas-as-is-resources", "key-resources", "Portafolio y equipo comercial", "Catálogo, inventario y experiencia del equipo para atender clientes.", { relatedKpi: "Inventario" }),
  demoElement("canvas-as-is-activities", "key-activities", "Gestión de pedidos", "Cotizar, coordinar despacho y mantener la reposición de clientes."),
  demoElement("canvas-as-is-partners", "key-partners", "Proveedores mayoristas", "Proveedores que sostienen la disponibilidad del portafolio."),
  demoElement("canvas-as-is-costs", "cost-structure", "Compra y distribución", "Costos de adquisición, almacenamiento y entrega.", { relatedKpi: "Costos operativos" }),
];

const DEMO_TO_BE_ELEMENTS: CanvasElement[] = DEMO_AS_IS_ELEMENTS.map((item) => ({
  ...item,
  id: `${item.id}-to-be`,
  sourceElementId: item.id,
  updatedAt: "2026-09-02T09:00:00-05:00",
})).map((item) => item.block === "channels"
  ? { ...item, title: "Venta presencial + catálogo digital", description: "Pedidos presenciales complementados con catálogo digital y WhatsApp.", relatedKpi: "Conversión" }
  : item);

DEMO_TO_BE_ELEMENTS.push(demoElement("canvas-to-be-digital-channel", "channels", "WhatsApp Business", "Canal experimental para seguimiento de pedidos y recompra.", { relatedKpi: "Conversión", confidence: 55, tags: ["hipótesis", "piloto"], hypothesis: "Un canal digital puede mejorar la conversión de clientes activos." }));

export const DEMO_SCENARIOS: CanvasScenario[] = [
  { id: "scenario-base", organizationId: DEMO_ORGANIZATION.id, periodId: "period-2026-09", name: "Base actual", type: "BASE", description: "Representa el contexto operativo vigente.", createdAt: "2026-09-01T09:00:00-05:00", updatedAt: "2026-09-01T09:00:00-05:00" },
  { id: "scenario-moderado", organizationId: DEMO_ORGANIZATION.id, periodId: "period-2026-09", name: "Moderado", type: "MODERADO", description: "Evolución gradual con un canal digital piloto.", createdAt: "2026-09-01T09:00:00-05:00", updatedAt: "2026-09-01T09:00:00-05:00" },
];

export const DEMO_CANVAS_VERSIONS: CanvasVersion[] = [
  { id: "canvas-as-is-demo-v1", organizationId: DEMO_ORGANIZATION.id, periodId: "period-2026-09", scenarioId: null, kind: "AS_IS", version: 1, name: "Modelo actual", status: "BORRADOR", elements: DEMO_AS_IS_ELEMENTS, createdAt: "2026-09-01T09:00:00-05:00", updatedAt: "2026-09-01T09:00:00-05:00" },
  { id: "canvas-to-be-demo-v1", organizationId: DEMO_ORGANIZATION.id, periodId: "period-2026-09", scenarioId: "scenario-moderado", kind: "TO_BE", version: 1, name: "Canal digital propuesto", status: "BORRADOR", sourceVersionId: "canvas-as-is-demo-v1", elements: DEMO_TO_BE_ELEMENTS, createdAt: "2026-09-02T09:00:00-05:00", updatedAt: "2026-09-02T09:00:00-05:00" },
];

export function createDemoState(): AppState {
  return {
    schemaVersion: 2,
    organizations: [DEMO_ORGANIZATION],
    periods: DEMO_PERIODS,
    observations: DEMO_OBSERVATIONS,
    imports: [],
    aiHistory: [],
    scenarios: DEMO_SCENARIOS,
    canvasVersions: DEMO_CANVAS_VERSIONS,
    activeOrganizationId: DEMO_ORGANIZATION.id,
    activePeriodId: "period-2026-09",
  };
}
