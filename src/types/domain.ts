export type Sector = "industrial" | "comercial" | "servicios";
export type OrganizationSize = "micro" | "pequena" | "mediana" | "grande";
export type OrganizationStatus = "ACTIVA" | "INACTIVA";
export type DataQuality = "ALTA" | "MEDIA" | "BAJA";

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
}

export interface AppState {
  schemaVersion: 1;
  organizations: Organization[];
  periods: Period[];
  observations: HistoricalObservation[];
  imports: ImportLog[];
  aiHistory: AiHistoryEntry[];
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
  | "projects"
  | "gantt"
  | "tracking"
  | "kpi"
  | "prediction"
  | "simulation"
  | "reports"
  | "ai-history"
  | "configuration";
