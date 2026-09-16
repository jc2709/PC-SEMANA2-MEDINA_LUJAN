import type { AppState, CanvasBlockKey, CanvasElement, CanvasScenario, CanvasVersion, HistoricalObservation, KpiDefinition, Organization, Period, Project, ProjectMilestone, ProjectTask, ProjectTrackingEntry } from "../types/domain";

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

export const DEMO_KPI_DEFINITIONS: KpiDefinition[] = [
  { id: "kpi-sales", organizationId: DEMO_ORGANIZATION.id, name: "Ventas", description: "Ingresos comerciales del periodo.", formula: "SUM(ventas)", unit: "PEN", periodicity: "MENSUAL", baseline: 68200, target: 76000, tolerance: 5, responsible: "Equipo comercial", source: "ERP comercial", direction: "MAYOR_MEJOR", createdAt: "2026-08-01T09:00:00-05:00", updatedAt: "2026-08-01T09:00:00-05:00" },
  { id: "kpi-costs", organizationId: DEMO_ORGANIZATION.id, name: "Costos operativos", description: "Costos operativos acumulados del periodo.", formula: "SUM(costos)", unit: "PEN", periodicity: "MENSUAL", baseline: 40100, target: 39000, tolerance: 5, responsible: "Operaciones", source: "ERP financiero", direction: "MENOR_MEJOR", createdAt: "2026-08-01T09:00:00-05:00", updatedAt: "2026-08-01T09:00:00-05:00" },
  { id: "kpi-customers", organizationId: DEMO_ORGANIZATION.id, name: "Clientes activos", description: "Clientes con actividad comercial en el periodo.", formula: "COUNT_DISTINCT(clientes)", unit: "clientes", periodicity: "MENSUAL", baseline: 418, target: 480, tolerance: 5, responsible: "Equipo comercial", source: "CRM", direction: "MAYOR_MEJOR", createdAt: "2026-08-01T09:00:00-05:00", updatedAt: "2026-08-01T09:00:00-05:00" },
  { id: "kpi-conversion", organizationId: DEMO_ORGANIZATION.id, name: "Conversión", description: "Porcentaje de oportunidades que se convierten en pedidos.", formula: "pedidos / oportunidades * 100", unit: "%", periodicity: "MENSUAL", baseline: 3.8, target: 5, tolerance: 5, responsible: "María Medina", source: "CRM comercial", direction: "MAYOR_MEJOR", createdAt: "2026-08-01T09:00:00-05:00", updatedAt: "2026-08-01T09:00:00-05:00" },
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

export const DEMO_PROJECTS: Project[] = [
  {
    id: "project-digital-channel",
    organizationId: DEMO_ORGANIZATION.id,
    periodId: "period-2026-09",
    code: "P-001",
    name: "Piloto de catálogo digital",
    description: "Implementar un catálogo digital conectado al seguimiento comercial para mejorar la recompra.",
    originGap: "La venta depende principalmente del contacto presencial y se pierde seguimiento de oportunidades.",
    sourceCanvasVersionId: "canvas-to-be-demo-v1",
    sourceElementId: "canvas-to-be-digital-channel",
    objective: "Aumentar la conversión de clientes activos mediante un canal digital piloto.",
    responsible: "María Medina",
    startsOn: "2026-09-05",
    endsOn: "2026-11-30",
    plannedBudget: 12500,
    status: "EN_CURSO",
    priority: "ALTA",
    risks: "Adopción inicial del equipo comercial y calidad del catálogo.",
    relatedKpi: "Conversión",
    progress: 35,
    observations: "El piloto inició con diez clientes frecuentes.",
    approvalStatus: "APROBADO",
    createdAt: "2026-09-03T09:00:00-05:00",
    updatedAt: "2026-10-15T18:00:00-05:00",
    approvedAt: "2026-09-04T10:00:00-05:00",
  },
  {
    id: "project-order-standardization",
    organizationId: DEMO_ORGANIZATION.id,
    periodId: "period-2026-09",
    code: "P-002",
    name: "Estandarización de pedidos",
    description: "Definir un flujo único para registrar, validar y entregar pedidos omnicanal.",
    originGap: "Los pedidos se registran en canales distintos y generan reprocesos operativos.",
    sourceCanvasVersionId: "canvas-to-be-demo-v1",
    sourceElementId: "canvas-to-be-digital-channel",
    objective: "Reducir errores de registro y hacer visible el estado de cada pedido.",
    responsible: "Luis Luján",
    startsOn: "2026-09-15",
    endsOn: "2026-12-15",
    plannedBudget: 9800,
    status: "EN_RIESGO",
    priority: "MEDIA",
    risks: "Falta de disponibilidad del equipo de operaciones para validar el flujo.",
    relatedKpi: "Costos operativos",
    progress: 20,
    observations: "La definición del flujo está pendiente de validación con despacho.",
    approvalStatus: "BORRADOR",
    createdAt: "2026-09-10T09:00:00-05:00",
    updatedAt: "2026-10-12T18:00:00-05:00",
  },
];

export const DEMO_PROJECT_TASKS: ProjectTask[] = [
  { id: "task-digital-discovery", projectId: "project-digital-channel", name: "Definir catálogo mínimo", description: "Seleccionar productos, precios y reglas del piloto.", startsOn: "2026-09-05", endsOn: "2026-09-18", responsible: "María Medina", dependencyTaskId: null, status: "COMPLETADA", progress: 100, plannedCost: 1800, actualCost: 1650, createdAt: "2026-09-03T09:00:00-05:00", updatedAt: "2026-09-18T18:00:00-05:00" },
  { id: "task-digital-build", projectId: "project-digital-channel", name: "Configurar canal y mensajes", description: "Preparar catálogo digital, respuestas y registro de oportunidades.", startsOn: "2026-09-19", endsOn: "2026-10-20", responsible: "Luis Luján", dependencyTaskId: "task-digital-discovery", status: "EN_CURSO", progress: 55, plannedCost: 6200, actualCost: 5900, createdAt: "2026-09-03T09:00:00-05:00", updatedAt: "2026-10-15T18:00:00-05:00" },
  { id: "task-digital-pilot", projectId: "project-digital-channel", name: "Ejecutar piloto con clientes", description: "Medir conversaciones, conversiones y comentarios de clientes.", startsOn: "2026-10-21", endsOn: "2026-11-30", responsible: "Equipo comercial", dependencyTaskId: "task-digital-build", status: "PENDIENTE", progress: 0, plannedCost: 4500, actualCost: 0, createdAt: "2026-09-03T09:00:00-05:00", updatedAt: "2026-09-03T09:00:00-05:00" },
  { id: "task-orders-map", projectId: "project-order-standardization", name: "Mapear flujo actual", description: "Documentar pasos, responsables y puntos de reproceso.", startsOn: "2026-09-15", endsOn: "2026-10-05", responsible: "Luis Luján", dependencyTaskId: null, status: "COMPLETADA", progress: 100, plannedCost: 2400, actualCost: 2300, createdAt: "2026-09-10T09:00:00-05:00", updatedAt: "2026-10-05T18:00:00-05:00" },
  { id: "task-orders-validate", projectId: "project-order-standardization", name: "Validar flujo con despacho", description: "Revisar el flujo propuesto y acordar criterios de aceptación.", startsOn: "2026-10-06", endsOn: "2026-10-25", responsible: "Operaciones", dependencyTaskId: "task-orders-map", status: "BLOQUEADA", progress: 20, plannedCost: 3100, actualCost: 1800, createdAt: "2026-09-10T09:00:00-05:00", updatedAt: "2026-10-12T18:00:00-05:00" },
];

export const DEMO_PROJECT_MILESTONES: ProjectMilestone[] = [
  { id: "milestone-digital-approved", projectId: "project-digital-channel", name: "Catálogo aprobado", date: "2026-09-18", responsible: "María Medina", status: "ALCANZADO", notes: "Se aprobó el catálogo inicial para clientes frecuentes.", createdAt: "2026-09-03T09:00:00-05:00", updatedAt: "2026-09-18T18:00:00-05:00" },
  { id: "milestone-digital-pilot", projectId: "project-digital-channel", name: "Inicio de piloto", date: "2026-10-21", responsible: "Equipo comercial", status: "PENDIENTE", notes: "Requiere finalizar configuración de mensajes.", createdAt: "2026-09-03T09:00:00-05:00", updatedAt: "2026-09-03T09:00:00-05:00" },
  { id: "milestone-orders-validation", projectId: "project-order-standardization", name: "Flujo validado", date: "2026-10-25", responsible: "Operaciones", status: "ATRASADO", notes: "Pendiente de agenda con despacho.", createdAt: "2026-09-10T09:00:00-05:00", updatedAt: "2026-10-12T18:00:00-05:00" },
];

export const DEMO_PROJECT_TRACKING: ProjectTrackingEntry[] = [
  { id: "tracking-digital-oct", projectId: "project-digital-channel", recordedAt: "2026-10-15", plannedProgress: 45, actualProgress: 35, plannedCost: 8000, actualCost: 7550, status: "EN_CURSO", milestone: "Configuración del canal", risks: "Adopción del equipo comercial.", evidence: "Reporte de diez clientes piloto.", comments: "La configuración avanza con una desviación de diez puntos.", createdAt: "2026-10-15T18:00:00-05:00" },
  { id: "tracking-orders-oct", projectId: "project-order-standardization", recordedAt: "2026-10-12", plannedProgress: 35, actualProgress: 20, plannedCost: 4200, actualCost: 4100, status: "EN_RIESGO", milestone: "Mapeo del flujo actual", risks: "Validación retrasada por disponibilidad de despacho.", evidence: "Mapa de proceso v1.", comments: "Definir una nueva fecha de sesión con operaciones.", createdAt: "2026-10-12T18:00:00-05:00" },
];

export function createDemoState(): AppState {
  return {
    schemaVersion: 4,
    organizations: [DEMO_ORGANIZATION],
    periods: DEMO_PERIODS,
    observations: DEMO_OBSERVATIONS,
    imports: [],
    aiHistory: [],
    scenarios: DEMO_SCENARIOS,
    canvasVersions: DEMO_CANVAS_VERSIONS,
    projects: DEMO_PROJECTS,
    projectTasks: DEMO_PROJECT_TASKS,
    projectMilestones: DEMO_PROJECT_MILESTONES,
    projectTracking: DEMO_PROJECT_TRACKING,
    kpiDefinitions: DEMO_KPI_DEFINITIONS,
    forecasts: [],
    simulations: [],
    activeOrganizationId: DEMO_ORGANIZATION.id,
    activePeriodId: "period-2026-09",
  };
}
