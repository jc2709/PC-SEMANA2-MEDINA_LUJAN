export type Sector = "industrial" | "comercial" | "servicios";
export type OrganizationSize = "micro" | "pequena" | "mediana" | "grande";
export type OrganizationStatus = "ACTIVA" | "INACTIVA";
export type DataQuality = "ALTA" | "MEDIA" | "BAJA";
export type CanvasKind = "AS_IS" | "TO_BE";
export type CanvasStatus = "BORRADOR" | "EN_REVISION" | "APROBADO" | "ARCHIVADO";
export type ScenarioType = "BASE" | "CONSERVADOR" | "MODERADO" | "AGRESIVO" | "PERSONALIZADO";
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

export interface AppState {
  schemaVersion: 2;
  organizations: Organization[];
  periods: Period[];
  observations: HistoricalObservation[];
  imports: ImportLog[];
  aiHistory: AiHistoryEntry[];
  scenarios: CanvasScenario[];
  canvasVersions: CanvasVersion[];
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
