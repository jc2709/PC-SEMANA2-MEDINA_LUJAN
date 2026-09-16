export type Sector = "industrial" | "comercial" | "servicios";
export type OrganizationSize = "micro" | "pequena" | "mediana" | "grande";
export type OrganizationStatus = "ACTIVA" | "INACTIVA";
export type DataQuality = "ALTA" | "MEDIA" | "BAJA";
export type CanvasKind = "AS_IS" | "TO_BE";
export type CanvasStatus = "BORRADOR" | "EN_REVISION" | "APROBADO" | "ARCHIVADO";
export type ScenarioType = "BASE" | "CONSERVADOR" | "MODERADO" | "AGRESIVO" | "PERSONALIZADO";
export type ProjectApprovalStatus = "BORRADOR" | "APROBADO";
export type ProjectStatus = "NO_INICIADO" | "EN_CURSO" | "EN_RIESGO" | "RETRASADO" | "COMPLETADO" | "CANCELADO";
export type ProjectPriority = "BAJA" | "MEDIA" | "ALTA" | "CRITICA";
export type ProjectTaskStatus = "PENDIENTE" | "EN_CURSO" | "BLOQUEADA" | "COMPLETADA";
export type ProjectMilestoneStatus = "PENDIENTE" | "ALCANZADO" | "ATRASADO";
export type KpiPeriodicity = "DIARIA" | "SEMANAL" | "MENSUAL";
export type KpiDirection = "MAYOR_MEJOR" | "MENOR_MEJOR";
export type ForecastModel = "NAIVE" | "MEDIA_MOVIL" | "TENDENCIA_LINEAL" | "SUAVIZACION_EXPONENCIAL";
export type ForecastQuality = "SUFICIENTE" | "INSUFICIENTE";
export type SimulationType = "CONSERVADOR" | "MODERADO" | "AGRESIVO" | "PERSONALIZADO";
export type CanvasBlockKey =
  | "customer-segments"
  | "value-propositions"
  | "channels"
  | "customer-relationships"
  | "revenue-streams"
  | "key-resources"
  | "key-activities"
  | "key-partners"
  | "cost-structure";

export interface Organization {
  id: string;
  name: string;
  sector: Sector;
  size: OrganizationSize;
  description: string;
  currency: string;
  createdAt: string;
  status: OrganizationStatus;
}

export interface Period {
  id: string;
  organizationId: string;
  code: string;
  label: string;
  startsOn: string;
  endsOn: string;
}

export interface HistoricalObservation {
  id: string;
  organizationId: string;
  periodId: string;
  kpi: string;
  value: number;
  unit: string;
  source: string;
  quality: DataQuality;
  observedAt: string;
  createdAt: string;
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
  value?: string;
}

export interface ImportLog {
  id: string;
  organizationId: string;
  periodId: string;
  fileName: string;
  importedAt: string;
  processedRows: number;
  validRows: number;
  invalidRows: number;
  errors: ImportError[];
  status: "COMPLETADO" | "COMPLETADO_CON_ERRORES" | "ERROR";
}

export interface AiHistoryEntry {
  id: string;
  organizationId: string;
  module: string;
  operation: string;
  logicalPrompt: string;
  model: string;
  response: string;
  decision: "PENDIENTE" | "ACEPTADA" | "EDITADA" | "RECHAZADA";
  createdAt: string;
  sourceVersionId?: string;
  proposalVersionId?: string;
  decisionAt?: string;
}

export interface CanvasScenario {
  id: string;
  organizationId: string;
  periodId: string;
  name: string;
  type: ScenarioType;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CanvasElement {
  id: string;
  block: CanvasBlockKey;
  title: string;
  description: string;
  hypothesis: string;
  evidence: string;
  responsible: string;
  relatedKpi: string;
  confidence: number;
  tags: string[];
  comments: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  sourceElementId?: string;
}

export interface CanvasVersion {
  id: string;
  organizationId: string;
  periodId: string;
  scenarioId: string | null;
  kind: CanvasKind;
  version: number;
  name: string;
  status: CanvasStatus;
  sourceVersionId?: string;
  elements: CanvasElement[];
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
}

export interface Project {
  id: string;
  organizationId: string;
  periodId: string;
  code: string;
  name: string;
  description: string;
  originGap: string;
  sourceCanvasVersionId: string | null;
  sourceElementId: string | null;
  objective: string;
  responsible: string;
  startsOn: string;
  endsOn: string;
  plannedBudget: number;
  status: ProjectStatus;
  priority: ProjectPriority;
  risks: string;
  relatedKpi: string;
  progress: number;
  observations: string;
  approvalStatus: ProjectApprovalStatus;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  name: string;
  description: string;
  startsOn: string;
  endsOn: string;
  responsible: string;
  dependencyTaskId: string | null;
  status: ProjectTaskStatus;
  progress: number;
  plannedCost: number;
  actualCost: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  name: string;
  date: string;
  responsible: string;
  status: ProjectMilestoneStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTrackingEntry {
  id: string;
  projectId: string;
  recordedAt: string;
  plannedProgress: number;
  actualProgress: number;
  plannedCost: number;
  actualCost: number;
  status: ProjectStatus;
  milestone: string;
  risks: string;
  evidence: string;
  comments: string;
  createdAt: string;
}

export interface KpiDefinition {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  formula: string;
  unit: string;
  periodicity: KpiPeriodicity;
  baseline: number;
  target: number;
  tolerance: number;
  responsible: string;
  source: string;
  direction: KpiDirection;
  createdAt: string;
  updatedAt: string;
}

export interface KpiForecast {
  id: string;
  organizationId: string;
  periodId: string;
  kpiDefinitionId: string;
  model: ForecastModel;
  parameters: string;
  metricName: string;
  metricValue: number | null;
  cutoffDate: string;
  nextPeriodLabel: string;
  prediction: number;
  lowerBound: number;
  upperBound: number;
  trendPercent: number | null;
  observationCount: number;
  quality: ForecastQuality;
  explanation: string;
  createdAt: string;
}

export interface SimulationVariables {
  marketing: number;
  conversion: number;
  price: number;
  costs: number;
  projectDelay: number;
  capacity: number;
}

export interface SimulationScenario {
  id: string;
  organizationId: string;
  periodId: string;
  name: string;
  type: SimulationType;
  variables: SimulationVariables;
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  schemaVersion: 4;
  organizations: Organization[];
  periods: Period[];
  observations: HistoricalObservation[];
  imports: ImportLog[];
  aiHistory: AiHistoryEntry[];
  scenarios: CanvasScenario[];
  canvasVersions: CanvasVersion[];
  projects: Project[];
  projectTasks: ProjectTask[];
  projectMilestones: ProjectMilestone[];
  projectTracking: ProjectTrackingEntry[];
  kpiDefinitions: KpiDefinition[];
  forecasts: KpiForecast[];
  simulations: SimulationScenario[];
  activeOrganizationId: string;
  activePeriodId: string;
}

export type AppView =
  | "dashboard"
  | "organization"
  | "data"
  | "canvas-as-is"
  | "canvas-to-be"
  | "comparison"
  | "ai-analysis"
  | "projects"
  | "gantt"
  | "tracking"
  | "kpi"
  | "prediction"
  | "simulation"
  | "reports"
  | "ai-history"
  | "configuration";
