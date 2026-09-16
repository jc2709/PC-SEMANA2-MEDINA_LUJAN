"use client";

import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { createDemoState, DEMO_KPI_DEFINITIONS } from "./data/demoData";
import { aiService } from "./services/ai/aiService";
import { buildToBeFromAi, type AiDecision, type AiElementProposal, type AiOperation, type AiResponse } from "./services/ai/aiModel";
import { parseDataFile, previewStats, type ImportPreview } from "./services/import/importService";
import { loadState, saveState } from "./services/storage/storage";
import { CanvasComparisonView, CanvasEditorView, type CanvasElementDraft, type CanvasScenarioDraft, type CanvasVersionDraft } from "./modules/canvas/CanvasModule";
import { AiAnalysisView } from "./modules/ai/AiModule";
import { GanttView, ProjectsView, TrackingView, type ProjectDraft, type ProjectMilestoneDraft, type ProjectTaskDraft, type ProjectTrackingDraft } from "./modules/execution/ExecutionModule";
import { DemoFillButton } from "./components/DemoFillButton";
import { DashboardAnalyticsView, KpiView, PredictionView, SimulationView, type KpiDraft, type SimulationDraft } from "./modules/analytics/AnalyticsModule";
import { ReportsView } from "./modules/reports/ReportsModule";
import { buildForecast } from "./services/analytics/analyticsService";
import type { AppState, AppView, CanvasKind, CanvasStatus, CanvasVersion, DataQuality, KpiDefinition, Organization, OrganizationSize, Period, Project, ProjectMilestone, ProjectTask, ProjectTrackingEntry, Sector, SimulationScenario } from "./types/domain";
import { formatCurrency, formatDate, formatNumber, makeId, todayInputValue } from "./utils/format";

type Modal = "organization" | "edit-organization" | "period" | "edit-period" | "edit-observation" | null;

const navigation: Array<{ id: AppView; label: string; icon: string; phase?: string }> = [
  { id: "dashboard", label: "Dashboard", icon: "⌂" },
  { id: "organization", label: "Organización", icon: "▣" },
  { id: "data", label: "Datos", icon: "▤" },
  { id: "canvas-as-is", label: "Canvas AS IS", icon: "▦" },
  { id: "canvas-to-be", label: "Canvas TO BE", icon: "◇" },
  { id: "comparison", label: "Comparación", icon: "⇄" },
  { id: "ai-analysis", label: "Análisis IA", icon: "✦", phase: "F3" },
  { id: "projects", label: "Proyectos", icon: "□", phase: "F4" },
  { id: "gantt", label: "Gantt", icon: "▥", phase: "F4" },
  { id: "tracking", label: "Seguimiento", icon: "◷", phase: "F4" },
  { id: "kpi", label: "KPI", icon: "◈", phase: "F5" },
  { id: "prediction", label: "Predicción", icon: "↗", phase: "F5" },
  { id: "simulation", label: "Simulación", icon: "◌", phase: "F5" },
  { id: "reports", label: "Reportes", icon: "▧", phase: "F6" },
  { id: "ai-history", label: "Historial IA", icon: "✦", phase: "F3" },
  { id: "configuration", label: "Configuración", icon: "⚙" },
];

const viewMeta: Record<AppView, { eyebrow: string; title: string; description: string }> = {
  dashboard: { eyebrow: "NÚCLEO / RESUMEN", title: "Canvas Model IA", description: "El punto de partida para conectar datos, decisiones y evolución del modelo de negocio." },
  organization: { eyebrow: "CONFIGURACIÓN / CONTEXTO", title: "Organizaciones y periodos", description: "Aísla el contexto de cada organización y evita mezclar información entre periodos." },
  data: { eyebrow: "DATOS / INGRESO", title: "Datos históricos", description: "Registra observaciones manualmente o importa archivos con validación fila por fila." },
  "canvas-as-is": { eyebrow: "CANVAS / ACTUAL", title: "Canvas AS IS", description: "Documenta el modelo de negocio actual con evidencia y responsables." },
  "canvas-to-be": { eyebrow: "CANVAS / FUTURO", title: "Canvas TO BE", description: "Construye alternativas futuras revisables y versionadas." },
  comparison: { eyebrow: "CANVAS / BRECHAS", title: "Comparación AS IS vs TO BE", description: "Identifica qué se crea, modifica, elimina o mantiene." },
  projects: { eyebrow: "EJECUCIÓN / CAMBIOS", title: "Proyectos", description: "Convierte las brechas del Canvas TO BE en iniciativas aprobables y trazables." },
  gantt: { eyebrow: "EJECUCIÓN / PLAN", title: "Gantt", description: "Calendariza actividades, dependencias y hitos para ejecutar el cambio." },
  tracking: { eyebrow: "EJECUCIÓN / CONTROL", title: "Seguimiento", description: "Compara avance y costos reales frente al plan, con riesgos y evidencia." },
  kpi: { eyebrow: "ANALÍTICA / INDICADORES", title: "KPI", description: "Define indicadores medibles y conecta sus metas con el histórico." },
  prediction: { eyebrow: "ANALÍTICA / PRONÓSTICO", title: "Predicción", description: "Calcula el siguiente periodo con modelos locales transparentes." },
  simulation: { eyebrow: "ANALÍTICA / ESCENARIOS", title: "Simulación", description: "Compara la base contra cambios de marketing, conversión, costos y capacidad." },
  reports: { eyebrow: "SALIDAS / EVIDENCIA", title: "Reportes", description: "Exporta el contexto activo a CSV, Excel y PowerPoint." },
  "ai-analysis": { eyebrow: "IA / PROPUESTAS", title: "Análisis IA", description: "Analiza el AS IS y revisa propuestas TO BE antes de aplicarlas." },
  "ai-history": { eyebrow: "IA / TRAZABILIDAD", title: "Historial IA", description: "Consulta las propuestas y decisiones registradas por el usuario." },
  configuration: { eyebrow: "SISTEMA / CONFIGURACIÓN", title: "Configuración", description: "Estado de almacenamiento, modo IA y decisiones técnicas de esta entrega." },
};

const sectorLabels: Record<Sector, string> = { industrial: "Industrial", comercial: "Comercial", servicios: "Servicios" };
const sizeLabels: Record<OrganizationSize, string> = { micro: "Micro", pequena: "Pequeña", mediana: "Mediana", grande: "Grande" };

export default function CanvasModelApp() {
  const [state, setState] = useState<AppState>(() => createDemoState());
  const [view, setView] = useState<AppView>("dashboard");
  const [modal, setModal] = useState<Modal>(null);
  const [hydrated, setHydrated] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [toast, setToast] = useState("");
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importing, setImporting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [lastAiResponse, setLastAiResponse] = useState<AiResponse | null>(null);
  const [lastAiHistoryId, setLastAiHistoryId] = useState<string | null>(null);
  const [editingOrganizationId, setEditingOrganizationId] = useState<string | null>(null);
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);
  const [editingObservationId, setEditingObservationId] = useState<string | null>(null);

  function commitState(update: (current: AppState) => AppState) {
    setState((current) => {
      const next = update(current);
      saveState(next);
      return next;
    });
  }

  useEffect(() => {
    const result = loadState(createDemoState());
    queueMicrotask(() => {
      setState(result.state);
      setStorageAvailable(result.available);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveState(state);
  }, [hydrated, state]);

  useEffect(() => {
    if (!hydrated) return;
    const persistBeforeClose = () => saveState(state);
    window.addEventListener("pagehide", persistBeforeClose);
    window.addEventListener("beforeunload", persistBeforeClose);
    return () => {
      window.removeEventListener("pagehide", persistBeforeClose);
      window.removeEventListener("beforeunload", persistBeforeClose);
    };
  }, [hydrated, state]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const activeOrganization = state.organizations.find((item) => item.id === state.activeOrganizationId) ?? state.organizations[0];
  const organizationPeriods = useMemo(() => state.periods.filter((item) => item.organizationId === activeOrganization?.id), [activeOrganization?.id, state.periods]);
  const activePeriod = organizationPeriods.find((item) => item.id === state.activePeriodId) ?? organizationPeriods[0];
  const activeObservations = useMemo(() => state.observations.filter((item) => item.organizationId === activeOrganization?.id && item.periodId === activePeriod?.id), [activeOrganization?.id, activePeriod?.id, state.observations]);
  const latestImport = state.imports[0];
  const editingOrganization = state.organizations.find((item) => item.id === editingOrganizationId);
  const editingPeriod = state.periods.find((item) => item.id === editingPeriodId);
  const editingObservation = state.observations.find((item) => item.id === editingObservationId);

  function notify(message: string) {
    setToast(message);
  }

  function navigate(nextView: AppView) {
    setView(nextView);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function chooseOrganization(organizationId: string) {
    const firstPeriod = state.periods.find((item) => item.organizationId === organizationId);
    setLastAiResponse(null);
    setLastAiHistoryId(null);
    commitState((current) => ({ ...current, activeOrganizationId: organizationId, activePeriodId: firstPeriod?.id ?? "" }));
  }

  function choosePeriod(periodId: string) {
    setLastAiResponse(null);
    setLastAiHistoryId(null);
    commitState((current) => ({ ...current, activePeriodId: periodId }));
  }

  function handleOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const description = String(data.get("description") ?? "").trim();
    if (!name || !description) {
      notify("Completa el nombre y la descripción de la organización.");
      return;
    }
    const organization: Organization = {
      id: makeId("org"),
      name,
      description,
      sector: String(data.get("sector")) as Sector,
      size: String(data.get("size")) as OrganizationSize,
      currency: String(data.get("currency") || "PEN"),
      createdAt: new Date().toISOString(),
      status: String(data.get("status") || "ACTIVA") as Organization["status"],
    };
    commitState((current) => ({ ...current, organizations: [...current.organizations, organization], activeOrganizationId: organization.id, activePeriodId: "" }));
    setModal(null);
    notify("Organización creada. Ahora agrega su primer periodo.");
  }

  function handleOrganizationEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingOrganizationId) return;
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const description = String(data.get("description") ?? "").trim();
    if (!name || !description) {
      notify("Completa el nombre y la descripción de la organización.");
      return;
    }
    commitState((current) => ({ ...current, organizations: current.organizations.map((item) => item.id === editingOrganizationId ? { ...item, name, description, sector: String(data.get("sector")) as Sector, size: String(data.get("size")) as OrganizationSize, currency: String(data.get("currency") || "PEN"), status: String(data.get("status") || "ACTIVA") as Organization["status"] } : item) }));
    setModal(null);
    setEditingOrganizationId(null);
    notify("Organización actualizada y guardada.");
  }

  function handlePeriod(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeOrganization) {
      notify("Primero crea o selecciona una organización.");
      return;
    }
    const data = new FormData(event.currentTarget);
    const code = String(data.get("code") ?? "").trim();
    const label = String(data.get("label") ?? "").trim() || code;
    const startsOn = String(data.get("startsOn") ?? "");
    const endsOn = String(data.get("endsOn") ?? "");
    if (!code || !startsOn || !endsOn || endsOn < startsOn) {
      notify("Revisa el código y el rango de fechas del periodo.");
      return;
    }
    if (organizationPeriods.some((item) => item.code.toLowerCase() === code.toLowerCase())) {
      notify("Ese periodo ya existe en la organización activa.");
      return;
    }
    const period: Period = { id: makeId("period"), organizationId: activeOrganization.id, code, label, startsOn, endsOn };
    commitState((current) => ({ ...current, periods: [...current.periods, period], activePeriodId: period.id }));
    setModal(null);
    notify("Periodo creado y seleccionado.");
  }

  function handlePeriodEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingPeriodId || !activeOrganization) return;
    const data = new FormData(event.currentTarget);
    const code = String(data.get("code") ?? "").trim();
    const label = String(data.get("label") ?? "").trim() || code;
    const startsOn = String(data.get("startsOn") ?? "");
    const endsOn = String(data.get("endsOn") ?? "");
    if (!code || !startsOn || !endsOn || endsOn < startsOn) {
      notify("Revisa el código y el rango de fechas del periodo.");
      return;
    }
    if (organizationPeriods.some((item) => item.id !== editingPeriodId && item.code.toLowerCase() === code.toLowerCase())) {
      notify("Ese periodo ya existe en la organización activa.");
      return;
    }
    commitState((current) => ({ ...current, periods: current.periods.map((item) => item.id === editingPeriodId ? { ...item, code, label, startsOn, endsOn } : item) }));
    setModal(null);
    setEditingPeriodId(null);
    notify("Periodo actualizado y guardado.");
  }

  function handleObservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeOrganization || !activePeriod) {
      notify("Selecciona una organización con un periodo activo.");
      return;
    }
    const data = new FormData(event.currentTarget);
    const kpi = String(data.get("kpi") ?? "").trim();
    const value = Number(data.get("value"));
    const unit = String(data.get("unit") ?? "").trim();
    const source = String(data.get("source") ?? "").trim();
    const observedAt = String(data.get("observedAt") ?? "");
    const periodId = String(data.get("periodId") || activePeriod.id);
    const quality = String(data.get("quality")) as DataQuality;
    if (!kpi || !Number.isFinite(value) || !unit || !source || !observedAt || !organizationPeriods.some((item) => item.id === periodId)) {
      notify("Completa todos los campos de la observación.");
      return;
    }
    const observation = { id: makeId("obs"), organizationId: activeOrganization.id, periodId, kpi, value, unit, source, quality, observedAt, createdAt: new Date().toISOString() };
    commitState((current) => ({ ...current, observations: [observation, ...current.observations] }));
    event.currentTarget.reset();
    notify("Observación guardada localmente.");
  }

  function handleObservationEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingObservationId || !activeOrganization) return;
    const data = new FormData(event.currentTarget);
    const kpi = String(data.get("kpi") ?? "").trim();
    const value = Number(data.get("value"));
    const unit = String(data.get("unit") ?? "").trim();
    const source = String(data.get("source") ?? "").trim();
    const observedAt = String(data.get("observedAt") ?? "");
    const quality = String(data.get("quality")) as DataQuality;
    const periodId = String(data.get("periodId") ?? "");
    if (!kpi || !Number.isFinite(value) || !unit || !source || !observedAt || !organizationPeriods.some((item) => item.id === periodId)) {
      notify("Completa todos los campos de la observación.");
      return;
    }
    commitState((current) => ({ ...current, observations: current.observations.map((item) => item.id === editingObservationId ? { ...item, periodId, kpi, value, unit, source, quality, observedAt } : item) }));
    setModal(null);
    setEditingObservationId(null);
    notify("Observación actualizada y guardada.");
  }

  function handleCreateCanvasVersion(draft: CanvasVersionDraft & { kind: CanvasKind }) {
    if (!activeOrganization || !activePeriod) {
      notify("Selecciona una organización con un periodo activo antes de crear un Canvas.");
      return;
    }
    const name = draft.name.trim();
    if (!name) {
      notify("Escribe un nombre para la versión del Canvas.");
      return;
    }
    const scenarioId = draft.kind === "TO_BE" && state.scenarios.some((item) => item.id === draft.scenarioId && item.organizationId === activeOrganization.id && item.periodId === activePeriod.id) ? draft.scenarioId : null;
    const version = Math.max(0, ...state.canvasVersions.filter((item) => item.organizationId === activeOrganization.id && item.periodId === activePeriod.id && item.kind === draft.kind).map((item) => item.version)) + 1;
    const now = new Date().toISOString();
    const canvasVersion = { id: makeId("canvas"), organizationId: activeOrganization.id, periodId: activePeriod.id, scenarioId, kind: draft.kind, version, name, status: "BORRADOR" as const, elements: [], createdAt: now, updatedAt: now };
    commitState((current) => ({ ...current, canvasVersions: [canvasVersion, ...current.canvasVersions] }));
    notify(`${draft.kind === "AS_IS" ? "AS IS" : "TO BE"} v${version} creado como borrador.`);
  }

  function handleCloneCanvasVersion(sourceId: string, targetKind?: CanvasKind) {
    const source = state.canvasVersions.find((item) => item.id === sourceId);
    if (!source) return;
    const kind = targetKind ?? source.kind;
    const versions = state.canvasVersions.filter((item) => item.organizationId === source.organizationId && item.periodId === source.periodId && item.kind === kind);
    const version = Math.max(0, ...versions.map((item) => item.version)) + 1;
    const now = new Date().toISOString();
    const cloned = { ...source, id: makeId("canvas"), kind, version, name: kind !== source.kind ? `TO BE de ${source.name}` : `${source.name} · copia editable`, scenarioId: kind === "TO_BE" ? source.scenarioId : null, sourceVersionId: source.id, status: "BORRADOR" as const, elements: source.elements.map((item) => ({ ...item, id: makeId("element"), sourceElementId: item.sourceElementId ?? item.id, createdAt: now, updatedAt: now })), createdAt: now, updatedAt: now, approvedAt: undefined };
    commitState((current) => ({ ...current, canvasVersions: [cloned, ...current.canvasVersions] }));
    notify(`${kind === "AS_IS" ? "AS IS" : "TO BE"} v${version} creado como copia editable.`);
  }

  function handleSaveCanvasElement(versionId: string, elementId: string | null, draft: CanvasElementDraft) {
    const now = new Date().toISOString();
    const newElement = elementId ? null : { ...draft, id: makeId("element"), createdAt: now, updatedAt: now };
    commitState((current) => ({ ...current, canvasVersions: current.canvasVersions.map((canvas) => canvas.id !== versionId || canvas.status !== "BORRADOR" ? canvas : { ...canvas, elements: elementId ? canvas.elements.map((item) => item.id === elementId ? { ...item, ...draft, updatedAt: now } : item) : [...canvas.elements, newElement!], updatedAt: now }) }));
    notify(elementId ? "Elemento del Canvas actualizado y guardado." : "Elemento agregado y guardado.");
  }

  function handleDeleteCanvasElement(versionId: string, elementId: string) {
    commitState((current) => ({ ...current, canvasVersions: current.canvasVersions.map((canvas) => canvas.id !== versionId || canvas.status !== "BORRADOR" ? canvas : { ...canvas, elements: canvas.elements.filter((item) => item.id !== elementId), updatedAt: new Date().toISOString() }) }));
    notify("Elemento eliminado del borrador.");
  }

  function handleCanvasStatus(versionId: string, status: CanvasStatus) {
    const now = new Date().toISOString();
    commitState((current) => ({ ...current, canvasVersions: current.canvasVersions.map((canvas) => canvas.id === versionId ? { ...canvas, status, approvedAt: status === "APROBADO" ? now : canvas.approvedAt, updatedAt: now } : canvas) }));
    notify(`Versión actualizada a ${status.toLowerCase().replace("_", " ")}.`);
  }

  function handleCreateScenario(draft: CanvasScenarioDraft) {
    if (!activeOrganization || !activePeriod) {
      notify("Selecciona una organización con un periodo activo antes de crear un escenario.");
      return;
    }
    const name = draft.name.trim();
    const description = draft.description.trim();
    if (!name || !description) {
      notify("Completa el nombre y la descripción del escenario.");
      return;
    }
    if (state.scenarios.some((item) => item.organizationId === activeOrganization.id && item.periodId === activePeriod.id && item.name.toLowerCase() === name.toLowerCase())) {
      notify("Ese escenario ya existe en el periodo activo.");
      return;
    }
    const now = new Date().toISOString();
    const scenario = { id: makeId("scenario"), organizationId: activeOrganization.id, periodId: activePeriod.id, name, type: draft.type, description, createdAt: now, updatedAt: now };
    commitState((current) => ({ ...current, scenarios: [scenario, ...current.scenarios] }));
    notify("Escenario creado y guardado.");
  }

  function handleCreateProject(draft: ProjectDraft) {
    if (!activeOrganization || !activePeriod) {
      notify("Selecciona una organización y periodo antes de crear un proyecto.");
      return;
    }
    if (!draft.code || !draft.name || !draft.description || !draft.originGap || !draft.objective || !draft.responsible || !draft.startsOn || !draft.endsOn || draft.endsOn < draft.startsOn) {
      notify("Completa los campos obligatorios y revisa el rango de fechas del proyecto.");
      return;
    }
    if (state.projects.some((project) => project.organizationId === activeOrganization.id && project.periodId === activePeriod.id && project.code.toLowerCase() === draft.code.toLowerCase())) {
      notify("Ese código de proyecto ya existe en el periodo activo.");
      return;
    }
    if (draft.sourceCanvasVersionId && !state.canvasVersions.some((version) => version.id === draft.sourceCanvasVersionId && version.organizationId === activeOrganization.id && version.periodId === activePeriod.id && version.kind === "TO_BE")) {
      notify("El Canvas fuente no pertenece al contexto activo.");
      return;
    }
    const now = new Date().toISOString();
    const project: Project = { id: makeId("project"), organizationId: activeOrganization.id, periodId: activePeriod.id, ...draft, sourceCanvasVersionId: draft.sourceCanvasVersionId ?? null, sourceElementId: draft.sourceElementId ?? null, approvalStatus: "BORRADOR", createdAt: now, updatedAt: now };
    commitState((current) => ({ ...current, projects: [project, ...current.projects] }));
    notify("Proyecto creado como borrador y guardado.");
  }

  function handleUpdateProject(projectId: string, draft: ProjectDraft) {
    const existing = state.projects.find((project) => project.id === projectId && project.organizationId === activeOrganization?.id && project.periodId === activePeriod?.id);
    if (!existing) return;
    if (!draft.code || !draft.name || !draft.description || !draft.originGap || !draft.objective || !draft.responsible || !draft.startsOn || !draft.endsOn || draft.endsOn < draft.startsOn) {
      notify("Completa los campos obligatorios y revisa el rango de fechas del proyecto.");
      return;
    }
    if (state.projects.some((project) => project.id !== projectId && project.organizationId === existing.organizationId && project.periodId === existing.periodId && project.code.toLowerCase() === draft.code.toLowerCase())) {
      notify("Ese código de proyecto ya existe en el periodo activo.");
      return;
    }
    const now = new Date().toISOString();
    commitState((current) => ({ ...current, projects: current.projects.map((project) => project.id === projectId ? { ...project, ...draft, sourceCanvasVersionId: draft.sourceCanvasVersionId ?? null, sourceElementId: draft.sourceElementId ?? null, approvalStatus: "BORRADOR" as const, approvedAt: undefined, updatedAt: now } : project) }));
    notify("Proyecto actualizado. El plan volvió a borrador para revisión.");
  }

  function handleApproveProject(projectId: string) {
    if (!state.projects.some((project) => project.id === projectId && project.organizationId === activeOrganization?.id && project.periodId === activePeriod?.id)) return;
    const now = new Date().toISOString();
    commitState((current) => ({ ...current, projects: current.projects.map((project) => project.id === projectId ? { ...project, approvalStatus: "APROBADO" as const, approvedAt: now, updatedAt: now } : project) }));
    notify("Plan del proyecto aprobado y guardado.");
  }

  function projectInActiveContext(projectId: string) {
    return state.projects.find((project) => project.id === projectId && project.organizationId === activeOrganization?.id && project.periodId === activePeriod?.id);
  }

  function handleCreateTask(draft: ProjectTaskDraft) {
    const project = projectInActiveContext(draft.projectId);
    if (!project || !draft.name || !draft.responsible || !draft.startsOn || !draft.endsOn || draft.endsOn < draft.startsOn || draft.startsOn < project.startsOn || draft.endsOn > project.endsOn) {
      notify("Revisa la actividad: debe tener datos completos y estar dentro del rango del proyecto.");
      return;
    }
    if (state.projectTasks.some((task) => task.projectId === project.id && task.name.toLowerCase() === draft.name.toLowerCase())) {
      notify("Ya existe una actividad con ese nombre en el proyecto.");
      return;
    }
    const now = new Date().toISOString();
    const task: ProjectTask = { id: makeId("task"), ...draft, dependencyTaskId: draft.dependencyTaskId ?? null, createdAt: now, updatedAt: now };
    commitState((current) => ({ ...current, projectTasks: [task, ...current.projectTasks] }));
    notify("Actividad guardada en el Gantt.");
  }

  function handleUpdateTask(taskId: string, draft: ProjectTaskDraft) {
    const project = projectInActiveContext(draft.projectId);
    const existing = state.projectTasks.find((task) => task.id === taskId && task.projectId === draft.projectId);
    if (!project || !existing || !draft.name || !draft.responsible || !draft.startsOn || !draft.endsOn || draft.endsOn < draft.startsOn || draft.startsOn < project.startsOn || draft.endsOn > project.endsOn) {
      notify("Revisa la actividad y sus fechas.");
      return;
    }
    const now = new Date().toISOString();
    commitState((current) => ({ ...current, projectTasks: current.projectTasks.map((task) => task.id === taskId ? { ...task, ...draft, dependencyTaskId: draft.dependencyTaskId ?? null, updatedAt: now } : task) }));
    notify("Actividad actualizada y guardada.");
  }

  function handleCreateMilestone(draft: ProjectMilestoneDraft) {
    const project = projectInActiveContext(draft.projectId);
    if (!project || !draft.name || !draft.responsible || !draft.date || draft.date < project.startsOn || draft.date > project.endsOn) {
      notify("Revisa el hito: la fecha debe estar dentro del proyecto.");
      return;
    }
    const now = new Date().toISOString();
    const milestone: ProjectMilestone = { id: makeId("milestone"), ...draft, createdAt: now, updatedAt: now };
    commitState((current) => ({ ...current, projectMilestones: [milestone, ...current.projectMilestones] }));
    notify("Hito guardado en el plan.");
  }

  function handleUpdateMilestone(milestoneId: string, draft: ProjectMilestoneDraft) {
    const project = projectInActiveContext(draft.projectId);
    const existing = state.projectMilestones.find((milestone) => milestone.id === milestoneId && milestone.projectId === draft.projectId);
    if (!project || !existing || !draft.name || !draft.responsible || !draft.date || draft.date < project.startsOn || draft.date > project.endsOn) {
      notify("Revisa el hito y su fecha.");
      return;
    }
    const now = new Date().toISOString();
    commitState((current) => ({ ...current, projectMilestones: current.projectMilestones.map((milestone) => milestone.id === milestoneId ? { ...milestone, ...draft, updatedAt: now } : milestone) }));
    notify("Hito actualizado y guardado.");
  }

  function handleCreateTracking(draft: ProjectTrackingDraft) {
    const project = projectInActiveContext(draft.projectId);
    if (!project || !draft.recordedAt) {
      notify("Selecciona una fecha de corte para el seguimiento.");
      return;
    }
    const now = new Date().toISOString();
    const entry: ProjectTrackingEntry = { id: makeId("tracking"), ...draft, createdAt: now };
    commitState((current) => ({ ...current, projectTracking: [entry, ...current.projectTracking], projects: current.projects.map((item) => item.id === project.id ? { ...item, progress: draft.actualProgress, status: draft.status, updatedAt: now } : item) }));
    notify("Corte de seguimiento guardado; avance del proyecto actualizado.");
  }

  function handleUpdateTracking(entryId: string, draft: ProjectTrackingDraft) {
    const project = projectInActiveContext(draft.projectId);
    const existing = state.projectTracking.find((entry) => entry.id === entryId && entry.projectId === draft.projectId);
    if (!project || !existing || !draft.recordedAt) {
      notify("Revisa la fecha del corte de seguimiento.");
      return;
    }
    const now = new Date().toISOString();
    commitState((current) => {
      const projectTracking = current.projectTracking.map((entry) => entry.id === entryId ? { ...entry, ...draft } : entry);
      const latest = [...projectTracking].filter((entry) => entry.projectId === project.id).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0];
      return { ...current, projectTracking, projects: current.projects.map((item) => item.id === project.id && latest ? { ...item, progress: latest.actualProgress, status: latest.status, updatedAt: now } : item) };
    });
    notify("Corte de seguimiento actualizado y guardado.");
  }

  function handleSeedAnalyticsDemo() {
    if (!activeOrganization) {
      notify("Primero crea o selecciona una organización.");
      return;
    }
    const now = new Date().toISOString();
    const missing = DEMO_KPI_DEFINITIONS.filter((demo) => !state.kpiDefinitions.some((definition) => definition.organizationId === activeOrganization.id && definition.name.toLocaleLowerCase() === demo.name.toLocaleLowerCase())).map((demo) => ({ ...demo, id: makeId("kpi"), organizationId: activeOrganization.id, createdAt: now, updatedAt: now }));
    if (!missing.length) {
      notify("El catálogo KPI ya está completo para esta organización.");
      return;
    }
    commitState((current) => ({ ...current, kpiDefinitions: [...missing, ...current.kpiDefinitions] }));
    notify(`${missing.length} KPI demo agregados. Revisa sus metas antes de usarlos.`);
  }

  function handleCreateKpi(draft: KpiDraft) {
    if (!activeOrganization || !draft.name || !draft.unit || !draft.formula || !draft.source || !draft.responsible || !Number.isFinite(draft.baseline) || !Number.isFinite(draft.target) || !Number.isFinite(draft.tolerance) || draft.tolerance < 0) {
      notify("Completa los campos del KPI y revisa sus valores numéricos.");
      return;
    }
    if (state.kpiDefinitions.some((definition) => definition.organizationId === activeOrganization.id && definition.name.toLocaleLowerCase() === draft.name.toLocaleLowerCase())) {
      notify("Ya existe un KPI con ese nombre en la organización.");
      return;
    }
    const now = new Date().toISOString();
    const definition: KpiDefinition = { id: makeId("kpi"), organizationId: activeOrganization.id, ...draft, createdAt: now, updatedAt: now };
    commitState((current) => ({ ...current, kpiDefinitions: [definition, ...current.kpiDefinitions] }));
    notify("KPI creado y guardado.");
  }

  function handleUpdateKpi(kpiId: string, draft: KpiDraft) {
    const existing = state.kpiDefinitions.find((definition) => definition.id === kpiId && definition.organizationId === activeOrganization?.id);
    if (!existing || !draft.name || !draft.unit || !draft.formula || !draft.source || !draft.responsible || !Number.isFinite(draft.baseline) || !Number.isFinite(draft.target) || !Number.isFinite(draft.tolerance) || draft.tolerance < 0) {
      notify("Completa los campos del KPI y revisa sus valores numéricos.");
      return;
    }
    if (state.kpiDefinitions.some((definition) => definition.id !== kpiId && definition.organizationId === existing.organizationId && definition.name.toLocaleLowerCase() === draft.name.toLocaleLowerCase())) {
      notify("Ya existe otro KPI con ese nombre en la organización.");
      return;
    }
    const now = new Date().toISOString();
    commitState((current) => ({ ...current, kpiDefinitions: current.kpiDefinitions.map((definition) => definition.id === kpiId ? { ...definition, ...draft, updatedAt: now } : definition), forecasts: current.forecasts.filter((forecast) => forecast.kpiDefinitionId !== kpiId) }));
    notify("KPI actualizado; sus pronósticos anteriores requieren recalcularse.");
  }

  function handleGenerateForecast(kpiDefinitionId: string) {
    const definition = state.kpiDefinitions.find((item) => item.id === kpiDefinitionId && item.organizationId === activeOrganization?.id);
    if (!definition || !activePeriod) {
      notify("Selecciona un KPI y un periodo activo antes de pronosticar.");
      return;
    }
    const now = new Date().toISOString();
    const forecast = buildForecast(definition, state.observations.filter((item) => item.organizationId === definition.organizationId), activePeriod, makeId("forecast"), now);
    commitState((current) => ({ ...current, forecasts: [forecast, ...current.forecasts.filter((item) => !(item.kpiDefinitionId === kpiDefinitionId && item.periodId === activePeriod.id))] }));
    notify(forecast.quality === "SUFICIENTE" ? `Pronóstico actualizado con ${forecast.model}.` : "Pronóstico guardado como escenario estimado por historial insuficiente.");
  }

  function handleGenerateAllForecasts() {
    if (!activeOrganization || !activePeriod) {
      notify("Selecciona una organización y un periodo antes de pronosticar.");
      return;
    }
    const now = new Date().toISOString();
    const forecasts = state.kpiDefinitions.filter((definition) => definition.organizationId === activeOrganization.id).map((definition) => buildForecast(definition, state.observations.filter((item) => item.organizationId === activeOrganization.id), activePeriod, makeId("forecast"), now));
    commitState((current) => ({ ...current, forecasts: [...forecasts, ...current.forecasts.filter((item) => !forecasts.some((forecast) => forecast.kpiDefinitionId === item.kpiDefinitionId && forecast.periodId === item.periodId))] }));
    notify(`${forecasts.length} pronóstico(s) actualizados.`);
  }

  function handleCreateSimulation(draft: SimulationDraft) {
    if (!activeOrganization || !activePeriod) {
      notify("Selecciona una organización y periodo antes de guardar un escenario.");
      return;
    }
    const now = new Date().toISOString();
    const simulation: SimulationScenario = { id: makeId("simulation"), organizationId: activeOrganization.id, periodId: activePeriod.id, ...draft, createdAt: now, updatedAt: now };
    commitState((current) => ({ ...current, simulations: [simulation, ...current.simulations] }));
    notify("Escenario de simulación guardado.");
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!activeOrganization || organizationPeriods.length === 0) {
      notify("Crea al menos un periodo antes de importar datos.");
      event.target.value = "";
      return;
    }
    setImporting(true);
    try {
      const preview = await parseDataFile(file, organizationPeriods);
      setImportPreview(preview);
      notify(`${previewStats(preview).validRows} filas listas para confirmar.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "No se pudo leer el archivo.");
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  }

  function confirmImport() {
    if (!importPreview || !activeOrganization) return;
    const stats = previewStats(importPreview);
    if (stats.validRows === 0) {
      notify("No hay filas válidas para importar.");
      return;
    }
    const periodByCode = new Map(organizationPeriods.map((period) => [period.code, period.id]));
    const observations = importPreview.rows.flatMap((row) => {
      if (!row.draft) return [];
      const periodId = periodByCode.get(row.draft.periodCode);
      if (!periodId) return [];
      return [{ id: makeId("obs"), organizationId: activeOrganization.id, periodId, kpi: row.draft.kpi, value: row.draft.value, unit: row.draft.unit, source: row.draft.source, quality: row.draft.quality, observedAt: row.draft.observedAt, createdAt: new Date().toISOString() }];
    });
    const log = { id: makeId("import"), organizationId: activeOrganization.id, periodId: activePeriod?.id ?? "", fileName: importPreview.fileName, importedAt: new Date().toISOString(), processedRows: stats.processedRows, validRows: stats.validRows, invalidRows: stats.invalidRows, errors: importPreview.rows.flatMap((row) => row.errors), status: stats.invalidRows ? "COMPLETADO_CON_ERRORES" as const : "COMPLETADO" as const };
    commitState((current) => ({ ...current, observations: [...observations, ...current.observations], imports: [log, ...current.imports] }));
    setImportPreview(null);
    notify(`Importación confirmada: ${stats.validRows} filas válidas.`);
  }

  function aiContext(sourceVersion: CanvasVersion) {
    return { organization: activeOrganization, period: activePeriod, canvas: sourceVersion, observations: activeObservations };
  }

  function registerAiResponse(sourceVersion: CanvasVersion, response: AiResponse) {
    const contextualResponse = { ...response, sourceVersionId: sourceVersion.id };
    const historyId = makeId("ai");
    commitState((current) => ({ ...current, aiHistory: [{ id: historyId, organizationId: sourceVersion.organizationId, module: "Fase 3", operation: response.operation, logicalPrompt: "Operación " + response.operation + " sobre el Canvas AS IS seleccionado; usar únicamente contexto local y no modificar datos aprobados.", model: response.mode === "MOCK" ? "MOCK" : "Gemini", response: JSON.stringify(contextualResponse), decision: "PENDIENTE", createdAt: response.generatedAt, sourceVersionId: sourceVersion.id }, ...current.aiHistory] }));
    setLastAiResponse(contextualResponse);
    setLastAiHistoryId(historyId);
    return contextualResponse;
  }

  async function runAiOperation(operation: Extract<AiOperation, "analizarCanvas" | "detectarInconsistencias" | "generarToBe">, sourceVersionId: string) {
    if (!activeOrganization || !activePeriod) {
      notify("Selecciona una organización y periodo antes de ejecutar IA.");
      return;
    }
    const sourceVersion = state.canvasVersions.find((item) => item.id === sourceVersionId && item.organizationId === activeOrganization.id && item.periodId === activePeriod.id && item.kind === "AS_IS");
    if (!sourceVersion) {
      notify("Crea o selecciona un Canvas AS IS antes de ejecutar IA.");
      return;
    }
    setAiLoading(true);
    try {
      const request = { organizationId: activeOrganization.id, context: aiContext(sourceVersion) };
      const response = operation === "generarToBe"
        ? await aiService.generarToBe(request)
        : operation === "detectarInconsistencias"
          ? await aiService.detectarInconsistencias(request)
          : await aiService.analizarCanvas(request);
      registerAiResponse(sourceVersion, response);
      setView("ai-analysis");
      notify(response.mode === "MOCK" ? "Propuesta MOCK recibida; revisa antes de decidir." : "Respuesta Gemini recibida; revisa antes de decidir.");
    } catch {
      notify("No se pudo completar la operación IA. Las funciones locales continúan operativas.");
    } finally {
      setAiLoading(false);
    }
  }

  function runMockAssistant() {
    const sourceVersion = state.canvasVersions.find((item) => item.organizationId === activeOrganization?.id && item.periodId === activePeriod?.id && item.kind === "AS_IS");
    if (!sourceVersion) {
      notify("Crea un Canvas AS IS antes de probar el asistente IA.");
      navigate("canvas-as-is");
      return;
    }
    void runAiOperation("analizarCanvas", sourceVersion.id);
  }

  function handleAiDecision(decision: AiDecision, sourceVersionId: string, historyId: string, response: AiResponse, proposals: AiElementProposal[]) {
    const historyEntry = state.aiHistory.find((entry) => entry.id === historyId);
    if (!historyEntry || historyEntry.decision !== "PENDIENTE") {
      notify("Esta propuesta ya tiene una decisión registrada.");
      return;
    }
    const now = new Date().toISOString();
    if (decision === "RECHAZADA") {
      commitState((current) => ({ ...current, aiHistory: current.aiHistory.map((entry) => entry.id === historyId ? { ...entry, decision, decisionAt: now } : entry) }));
      notify("Propuesta rechazada. El Canvas no fue modificado.");
      return;
    }
    if (!proposals.length) {
      notify("No hay propuestas aplicables para crear un TO BE.");
      return;
    }
    const sourceVersion = state.canvasVersions.find((item) => item.id === sourceVersionId && item.organizationId === activeOrganization?.id && item.periodId === activePeriod?.id && item.kind === "AS_IS");
    if (!sourceVersion) {
      notify("La versión AS IS de origen ya no está disponible.");
      return;
    }
    const version = Math.max(0, ...state.canvasVersions.filter((item) => item.organizationId === sourceVersion.organizationId && item.periodId === sourceVersion.periodId && item.kind === "TO_BE").map((item) => item.version)) + 1;
    const name = decision === "EDITADA" ? "TO BE editado a partir de IA" : "TO BE propuesto por IA";
    const canvasVersion = buildToBeFromAi(sourceVersion, proposals, version, name, now, makeId);
    const storedResponse = { ...response, sourceVersionId: sourceVersion.id, proposals };
    commitState((current) => ({ ...current, canvasVersions: [canvasVersion, ...current.canvasVersions], aiHistory: current.aiHistory.map((entry) => entry.id === historyId ? { ...entry, decision, decisionAt: now, proposalVersionId: canvasVersion.id, response: JSON.stringify(storedResponse) } : entry) }));
    setLastAiResponse(storedResponse);
    navigate("canvas-to-be");
    notify(decision === "EDITADA" ? "Cambios guardados y TO BE editable creado." : "Propuesta aceptada y TO BE editable creado.");
  }

  function exportObservations() {
    const rows = [["KPI", "Periodo", "Valor", "Unidad", "Fuente", "Calidad", "Fecha"], ...activeObservations.map((item) => [item.kpi, activePeriod?.code ?? "", item.value, item.unit, item.source, item.quality, item.observedAt])];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
    link.download = `canvas-model-ia-${activePeriod?.code ?? "datos"}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    notify("Datos exportados en CSV.");
  }

  const activeProjects = useMemo(() => state.projects.filter((project) => project.organizationId === activeOrganization?.id && project.periodId === activePeriod?.id), [activeOrganization?.id, activePeriod?.id, state.projects]);
  const activeKpiDefinitions = useMemo(() => state.kpiDefinitions.filter((definition) => definition.organizationId === activeOrganization?.id), [activeOrganization?.id, state.kpiDefinitions]);
  const activeForecasts = useMemo(() => state.forecasts.filter((forecast) => forecast.organizationId === activeOrganization?.id && forecast.periodId === activePeriod?.id), [activeOrganization?.id, activePeriod?.id, state.forecasts]);
  const activeSimulations = useMemo(() => state.simulations.filter((simulation) => simulation.organizationId === activeOrganization?.id && simulation.periodId === activePeriod?.id), [activeOrganization?.id, activePeriod?.id, state.simulations]);
  const activeCanvasAsIs = useMemo(() => state.canvasVersions.filter((version) => version.organizationId === activeOrganization?.id && version.periodId === activePeriod?.id && version.kind === "AS_IS").toSorted((a, b) => b.version - a.version)[0], [activeOrganization?.id, activePeriod?.id, state.canvasVersions]);
  const activeCanvasToBe = useMemo(() => state.canvasVersions.filter((version) => version.organizationId === activeOrganization?.id && version.periodId === activePeriod?.id && version.kind === "TO_BE").toSorted((a, b) => b.version - a.version)[0], [activeOrganization?.id, activePeriod?.id, state.canvasVersions]);
  const meta = viewMeta[view];
  return (
    <main className="canvas-shell">
      <aside className="app-sidebar">
        <button className="app-brand" onClick={() => navigate("dashboard")} aria-label="Ir al dashboard">
          <span className="brand-symbol">CM</span>
          <span><strong>Canvas</strong><b>Model IA</b></span>
        </button>
        <div className="sidebar-caption">SISTEMA DE DECISIÓN</div>
        <nav className="app-nav" aria-label="Navegación principal">
          {navigation.map((item) => (
            <button key={item.id} className={`app-nav-item ${view === item.id ? "active" : ""} ${item.phase ? "future" : ""}`} onClick={() => navigate(item.id)}>
              <span className="nav-icon">{item.icon}</span><span>{item.label}</span>{item.phase && <small>{item.phase}</small>}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <span className="offline-dot" />
          <div><strong>Modo local</strong><small>{storageAvailable ? "Persistencia disponible" : "Memoria temporal"}</small></div>
        </div>
      </aside>

      <section className="app-workspace">
        <header className="app-topbar">
          <div className="topbar-copy"><span className="eyebrow">{meta.eyebrow}</span><h1>{meta.title}</h1><p>{meta.description}</p></div>
          <div className="topbar-context">
            <label><span>ORGANIZACIÓN</span><select value={activeOrganization?.id ?? ""} onChange={(event) => chooseOrganization(event.target.value)} aria-label="Organización activa">{state.organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}</select></label>
            <label><span>PERIODO</span><select value={activePeriod?.id ?? ""} onChange={(event) => choosePeriod(event.target.value)} aria-label="Periodo activo"><option value="">Sin periodo</option>{organizationPeriods.map((period) => <option key={period.id} value={period.id}>{period.label}</option>)}</select></label>
            <span className={`save-indicator ${storageAvailable && hydrated ? "saved" : ""}`} title="Estado de persistencia">{hydrated ? storageAvailable ? "● Guardado" : "○ Memoria temporal" : "… Cargando"}</span>
          </div>
        </header>

        <div className="app-content">
          {view === "dashboard" && <><DashboardView state={state} organization={activeOrganization} period={activePeriod} observations={activeObservations} latestImport={latestImport} navigate={navigate} onMockAi={runMockAssistant} aiLoading={aiLoading} lastAiResponse={lastAiResponse} /><DashboardAnalyticsView organization={activeOrganization} period={activePeriod} definitions={activeKpiDefinitions} observations={activeObservations} forecasts={activeForecasts} projects={activeProjects} tasks={state.projectTasks} tracking={state.projectTracking} /></>}
          {view === "organization" && <OrganizationView state={state} organization={activeOrganization} periods={organizationPeriods} onOpenOrganization={() => setModal("organization")} onOpenPeriod={() => setModal("period")} onEditOrganization={(id) => { setEditingOrganizationId(id); setModal("edit-organization"); }} onEditPeriod={(id) => { setEditingPeriodId(id); setModal("edit-period"); }} onSelectOrganization={chooseOrganization} />}
          {view === "data" && <DataView observations={activeObservations} period={activePeriod} periods={organizationPeriods} onObservation={handleObservation} onEditObservation={(id) => { setEditingObservationId(id); setModal("edit-observation"); }} onImportFile={handleImportFile} onConfirmImport={confirmImport} importPreview={importPreview} importing={importing} onExport={exportObservations} />}
          {(view === "canvas-as-is" || view === "canvas-to-be") && <CanvasEditorView state={state} organization={activeOrganization} period={activePeriod} kind={view === "canvas-as-is" ? "AS_IS" : "TO_BE"} onCreateVersion={handleCreateCanvasVersion} onCloneVersion={handleCloneCanvasVersion} onSaveElement={handleSaveCanvasElement} onDeleteElement={handleDeleteCanvasElement} onTransitionStatus={handleCanvasStatus} onCreateScenario={handleCreateScenario} />}
          {view === "comparison" && <CanvasComparisonView state={state} organization={activeOrganization} period={activePeriod} />}
          {view === "ai-analysis" && <AiAnalysisView state={state} organization={activeOrganization} period={activePeriod} response={lastAiResponse} historyId={lastAiHistoryId} loading={aiLoading} onAnalyze={(versionId) => { void runAiOperation("analizarCanvas", versionId); }} onGenerateToBe={(versionId) => { void runAiOperation("generarToBe", versionId); }} onDecision={(decision, sourceVersionId, historyId, response, proposals) => handleAiDecision(decision, sourceVersionId, historyId, response, proposals)} onNavigateCanvas={() => navigate("canvas-as-is")} />}
          {view === "projects" && <ProjectsView organization={activeOrganization} period={activePeriod} projects={activeProjects} canvasVersions={state.canvasVersions} tasks={state.projectTasks} milestones={state.projectMilestones} onCreateProject={handleCreateProject} onUpdateProject={handleUpdateProject} onApproveProject={handleApproveProject} onNavigate={navigate} />}
          {view === "gantt" && <GanttView organization={activeOrganization} projects={activeProjects} tasks={state.projectTasks} milestones={state.projectMilestones} onCreateTask={handleCreateTask} onUpdateTask={handleUpdateTask} onCreateMilestone={handleCreateMilestone} onUpdateMilestone={handleUpdateMilestone} />}
          {view === "tracking" && <TrackingView organization={activeOrganization} projects={activeProjects} tracking={state.projectTracking} onCreateTracking={handleCreateTracking} onUpdateTracking={handleUpdateTracking} />}
          {view === "kpi" && <KpiView organization={activeOrganization} definitions={activeKpiDefinitions} observations={state.observations.filter((item) => item.organizationId === activeOrganization?.id)} forecasts={activeForecasts} onCreate={handleCreateKpi} onUpdate={handleUpdateKpi} onSeedDemo={handleSeedAnalyticsDemo} />}
          {view === "prediction" && <PredictionView organization={activeOrganization} period={activePeriod} definitions={activeKpiDefinitions} observations={state.observations.filter((item) => item.organizationId === activeOrganization?.id)} forecasts={activeForecasts} onGenerate={handleGenerateForecast} onGenerateAll={handleGenerateAllForecasts} onSeedDemo={handleSeedAnalyticsDemo} />}
          {view === "simulation" && <SimulationView organization={activeOrganization} period={activePeriod} definitions={activeKpiDefinitions} observations={state.observations.filter((item) => item.organizationId === activeOrganization?.id)} forecasts={activeForecasts} scenarios={activeSimulations} onCreate={handleCreateSimulation} onSeedDemo={handleSeedAnalyticsDemo} />}
          {view === "reports" && <ReportsView state={state} organization={activeOrganization} period={activePeriod} definitions={activeKpiDefinitions} forecasts={activeForecasts} canvasAsIs={activeCanvasAsIs} canvasToBe={activeCanvasToBe} />}
          {view === "ai-history" && <AiHistoryViewV3 entries={state.aiHistory} organization={activeOrganization} />}
          {view === "configuration" && <ConfigurationView storageAvailable={storageAvailable} persisted={storageAvailable && hydrated} onMockAi={runMockAssistant} aiLoading={aiLoading} />}
          {!(["dashboard", "organization", "data", "canvas-as-is", "canvas-to-be", "comparison", "ai-analysis", "projects", "gantt", "tracking", "kpi", "prediction", "simulation", "reports", "ai-history", "configuration"] as AppView[]).includes(view) && <FutureModuleView meta={meta} />}
        </div>
      </section>

      {modal && <Modal title={modal === "organization" ? "Nueva organización" : modal === "edit-organization" ? "Editar organización" : modal === "period" ? "Nuevo periodo" : modal === "edit-period" ? "Editar periodo" : "Editar observación"} onClose={() => { setModal(null); setEditingOrganizationId(null); setEditingPeriodId(null); setEditingObservationId(null); }}>
        {modal === "organization" && <OrganizationForm onSubmit={handleOrganization} onCancel={() => setModal(null)} submitLabel="Crear organización" />}
        {modal === "edit-organization" && editingOrganization && <OrganizationForm initial={editingOrganization} onSubmit={handleOrganizationEdit} onCancel={() => setModal(null)} submitLabel="Guardar cambios" />}
        {modal === "period" && <PeriodForm onSubmit={handlePeriod} onCancel={() => setModal(null)} submitLabel="Crear periodo" />}
        {modal === "edit-period" && editingPeriod && <PeriodForm initial={editingPeriod} onSubmit={handlePeriodEdit} onCancel={() => setModal(null)} submitLabel="Guardar cambios" />}
        {modal === "edit-observation" && editingObservation && <ObservationForm initial={editingObservation} periods={organizationPeriods} onSubmit={handleObservationEdit} onCancel={() => setModal(null)} submitLabel="Guardar cambios" />}
      </Modal>}
      {toast && <div className="toast-message" role="status"><span>✓</span>{toast}</div>}
    </main>
  );
}

function DashboardView({ state, organization, period, observations, latestImport, navigate, onMockAi, aiLoading, lastAiResponse }: { state: AppState; organization?: Organization; period?: Period; observations: AppState["observations"]; latestImport?: AppState["imports"][number]; navigate: (view: AppView) => void; onMockAi: () => void; aiLoading: boolean; lastAiResponse: AiResponse | null }) {
  const totalValue = observations.reduce((sum, item) => sum + item.value, 0);
  const sources = new Set(observations.map((item) => item.source)).size;
  return <>
    <section className="welcome-grid">
      <div className="welcome-card"><div><span className="eyebrow light">FASE 4 · EJECUCIÓN</span><h2>Del Canvas aprobado a la acción.</h2><p>{organization?.description ?? "Crea una organización para comenzar."}</p></div><div className="welcome-orbit"><span>TO BE</span><i>PLAN</i><b>GANTT</b></div></div>
      <div className="phase-card"><span className="status-pill success">● Operativo</span><h3>Planifica, aprueba y mide</h3><p>Las brechas del modelo futuro se convierten en proyectos con responsables, actividades, costos y seguimiento real.</p><button className="text-button" onClick={() => navigate("projects")}>Abrir proyectos →</button></div>
    </section>
    <div className="metric-grid">
      <MetricCard label="Organizaciones" value={formatNumber(state.organizations.length, 0)} detail="Contextos registrados" icon="▣" tone="green" />
      <MetricCard label="Periodos activos" value={formatNumber(state.periods.length, 0)} detail="Sin mezclar históricos" icon="◷" tone="blue" />
      <MetricCard label="Observaciones" value={formatNumber(observations.length, 0)} detail={period ? period.label : "Selecciona un periodo"} icon="▤" tone="amber" />
      <MetricCard label="Valor acumulado" value={formatCurrency(totalValue, organization?.currency ?? "PEN")} detail={`${sources} fuente${sources === 1 ? "" : "s"} en el periodo`} icon="◈" tone="violet" />
    </div>
    <section className="dashboard-columns">
      <div className="panel observations-panel"><PanelHeading title="Observaciones recientes" description={period ? `${period.label} · ${observations.length} registros` : "Sin periodo seleccionado"}><button className="outline-button" onClick={() => navigate("data")}>Gestionar datos</button></PanelHeading>{observations.length ? <div className="observation-list">{observations.slice(0, 6).map((item) => <ObservationRow key={item.id} observation={item} />)}</div> : <EmptyState title="Aún no hay datos" description="Registra una observación manual o importa un archivo validado." action="Ir a Datos" onAction={() => navigate("data")} />}</div>
      <aside className="panel readiness-panel"><PanelHeading title="Progreso de la fase" description="Capacidades de IA preparadas para revisión humana." /><div className="readiness-item"><span className="readiness-icon done">✓</span><div><strong>Organizaciones y periodos</strong><small>Separación lógica activa</small></div><em>Listo</em></div><div className="readiness-item"><span className="readiness-icon done">✓</span><div><strong>Ingreso manual e importación</strong><small>CSV/XLSX con validación</small></div><em>Listo</em></div><div className="readiness-item"><span className="readiness-icon done">✓</span><div><strong>Análisis IA contextual</strong><small>{lastAiResponse?.mode === "REAL" ? "Respuesta real" : "Mock disponible"}</small></div><em>{lastAiResponse?.mode === "REAL" ? "Activo" : "Mock"}</em></div><button className="ai-action" onClick={onMockAi} disabled={aiLoading}>{aiLoading ? "Consultando…" : "Analizar AS IS · MOCK"}</button>{lastAiResponse && <div className="ai-result"><span>{lastAiResponse.title}</span><p>{lastAiResponse.summary}</p></div>}<div className="import-mini"><span className="mini-label">ÚLTIMA IMPORTACIÓN</span>{latestImport ? <><strong>{latestImport.fileName}</strong><small>{latestImport.validRows}/{latestImport.processedRows} filas válidas · {formatDate(latestImport.importedAt)}</small></> : <small>No hay importaciones registradas.</small>}</div></aside>
    </section>
  </>;
}

function OrganizationView({ state, organization, periods, onOpenOrganization, onOpenPeriod, onEditOrganization, onEditPeriod, onSelectOrganization }: { state: AppState; organization?: Organization; periods: Period[]; onOpenOrganization: () => void; onOpenPeriod: () => void; onEditOrganization: (id: string) => void; onEditPeriod: (id: string) => void; onSelectOrganization: (id: string) => void }) {
  return <div className="organization-layout"><section className="panel"><PanelHeading title="Organizaciones" description={`${state.organizations.length} contexto${state.organizations.length === 1 ? "" : "s"} disponible${state.organizations.length === 1 ? "" : "s"}`}><button className="primary-button" onClick={onOpenOrganization}>＋ Nueva organización</button></PanelHeading><div className="organization-list">{state.organizations.map((item) => <div className={`organization-card-wrap ${item.id === organization?.id ? "selected" : ""}`} key={item.id}><button className="organization-card" onClick={() => onSelectOrganization(item.id)}><span className="org-monogram">{item.name.slice(0, 2).toUpperCase()}</span><div><strong>{item.name}</strong><small>{sectorLabels[item.sector]} · {sizeLabels[item.size]} · {item.currency}</small></div><span className="org-status">{item.status}</span></button><button className="row-edit" onClick={() => onEditOrganization(item.id)}>Editar</button></div>)}</div></section><section className="panel period-panel"><PanelHeading title="Periodos de la organización activa" description={organization ? organization.name : "Selecciona una organización"}><button className="outline-button" onClick={onOpenPeriod} disabled={!organization}>＋ Agregar periodo</button></PanelHeading>{periods.length ? <div className="period-list">{periods.map((period) => <div className="period-row" key={period.id}><span className="period-icon">◷</span><div><strong>{period.label}</strong><small>{period.code} · {period.startsOn} → {period.endsOn}</small></div><span className="period-check">✓ Aislado</span><button className="row-edit" onClick={() => onEditPeriod(period.id)}>Editar</button></div>)}</div> : <EmptyState title="No hay periodos" description="Agrega el primer periodo para poder cargar datos." action="Crear periodo" onAction={onOpenPeriod} />}</section><section className="context-note"><span className="note-icon">i</span><div><strong>Regla de aislamiento</strong><p>Los datos siempre se guardan con organización y periodo. Cambiar de contexto no mezcla observaciones ni archivos importados.</p></div></section></div>;
}

function DataView({ observations, period, periods, onObservation, onEditObservation, onImportFile, onConfirmImport, importPreview, importing, onExport }: { observations: AppState["observations"]; period?: Period; periods: Period[]; onObservation: (event: FormEvent<HTMLFormElement>) => void; onEditObservation: (id: string) => void; onImportFile: (event: ChangeEvent<HTMLInputElement>) => void; onConfirmImport: () => void; importPreview: ImportPreview | null; importing: boolean; onExport: () => void }) {
  const stats = importPreview ? previewStats(importPreview) : null;
  return <div className="data-layout"><section className="data-entry-grid"><div className="panel form-panel"><PanelHeading title="Registro manual" description="Una observación por KPI y periodo." /><ObservationForm onSubmit={onObservation} period={period} periods={periods} /></div><div className="panel import-panel"><PanelHeading title="Importar datos" description="XLSX o CSV con vista previa y validación." /><label className="drop-zone"><input type="file" accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={onImportFile} disabled={importing} /><span className="upload-icon">↑</span><strong>{importing ? "Leyendo archivo…" : "Selecciona un archivo XLSX o CSV"}</strong><small>Columnas detectadas: KPI, Periodo, Valor, Unidad, Fuente, Calidad, Fecha</small></label>{importPreview && stats && <div className="import-preview"><div className="preview-header"><div><strong>{importPreview.fileName}</strong><small>{importPreview.headers.length} columnas detectadas</small></div><div className="preview-counts"><span className="valid">{stats.validRows} válidas</span><span className="invalid">{stats.invalidRows} inválidas</span></div></div><div className="preview-table"><table><thead><tr><th>FILA</th><th>KPI</th><th>PERIODO</th><th>VALOR</th><th>ESTADO</th></tr></thead><tbody>{importPreview.rows.slice(0, 8).map((row) => <tr key={row.sourceRow}><td>{row.sourceRow}</td><td>{row.draft?.kpi ?? String(row.raw.KPI ?? row.raw.kpi ?? "—")}</td><td>{row.draft?.periodCode ?? "—"}</td><td>{row.draft?.value ?? "—"}</td><td>{row.errors.length ? <span className="status-tag danger">{row.errors[0].message}</span> : <span className="status-tag success">Válida</span>}</td></tr>)}</tbody></table></div><button className="primary-button full" onClick={onConfirmImport} disabled={stats.validRows === 0}>Confirmar importación ({stats.validRows})</button></div>}</div></section><section className="panel"><PanelHeading title="Histórico del periodo" description={period ? `${period.label} · los registros proceden del mismo almacenamiento` : "Selecciona un periodo"}><button className="outline-button" onClick={onExport} disabled={!observations.length}>↓ Exportar CSV</button></PanelHeading>{observations.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>KPI</th><th>VALOR</th><th>UNIDAD</th><th>FUENTE</th><th>CALIDAD</th><th>FECHA</th><th>ACCIÓN</th></tr></thead><tbody>{observations.map((item) => <ObservationRow key={item.id} observation={item} table onEdit={() => onEditObservation(item.id)} />)}</tbody></table></div> : <EmptyState title="Periodo sin observaciones" description="Los datos que registres aquí quedarán persistidos localmente." />}</section></div>;
}

function ObservationForm({ onSubmit, period, periods, initial, onCancel, submitLabel = "Guardar observación" }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void; period?: Period; periods: Period[]; initial?: AppState["observations"][number]; onCancel?: () => void; submitLabel?: string }) {
  const selectedPeriod = periods.find((item) => item.id === initial?.periodId) ?? period;
  return <form className="form-stack" onSubmit={onSubmit}><label className="field"><span>KPI</span><input name="kpi" required placeholder="Ej. Ventas" defaultValue={initial?.kpi ?? ""} /></label><div className="form-two"><label className="field"><span>Valor</span><input name="value" required type="number" step="any" placeholder="0" defaultValue={initial?.value ?? ""} /></label><label className="field"><span>Unidad</span><input name="unit" required placeholder="PEN, %, clientes…" defaultValue={initial?.unit ?? ""} /></label></div><label className="field"><span>Fuente</span><input name="source" required placeholder="Sistema comercial, encuesta…" defaultValue={initial?.source ?? ""} /></label><div className="form-two"><label className="field"><span>Calidad</span><select name="quality" defaultValue={initial?.quality ?? "MEDIA"}><option value="ALTA">Alta</option><option value="MEDIA">Media</option><option value="BAJA">Baja</option></select></label><label className="field"><span>Fecha de observación</span><input name="observedAt" required type="date" defaultValue={initial?.observedAt ?? todayInputValue()} /></label></div><label className="field"><span>Periodo asociado</span><select name="periodId" required defaultValue={selectedPeriod?.id ?? ""}><option value="">Selecciona un periodo</option>{periods.map((item) => <option key={item.id} value={item.id}>{item.label} · {item.code}</option>)}</select></label><div className="modal-actions"><DemoFillButton values={{ kpi: "Ventas", value: 75000, unit: "PEN", source: "ERP · caso demo", quality: "ALTA", observedAt: selectedPeriod?.endsOn ?? todayInputValue(), periodId: selectedPeriod?.id ?? "" }} />{onCancel && <button type="button" className="outline-button" onClick={onCancel}>Cancelar</button>}<button className="primary-button" type="submit" disabled={!periods.length}>{submitLabel}</button></div></form>;
}

function OrganizationForm({ onSubmit, initial, onCancel, submitLabel }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void; initial?: Organization; onCancel: () => void; submitLabel: string }) {
  return <form className="form-stack" onSubmit={onSubmit}><label className="field"><span>Nombre legal o comercial</span><input name="name" required placeholder="Ej. Comercial Andina S.A.C." defaultValue={initial?.name ?? ""} /></label><div className="form-two"><label className="field"><span>Sector</span><select name="sector" defaultValue={initial?.sector ?? "comercial"}><option value="industrial">Industrial</option><option value="comercial">Comercial</option><option value="servicios">Servicios</option></select></label><label className="field"><span>Tamaño</span><select name="size" defaultValue={initial?.size ?? "mediana"}><option value="micro">Micro</option><option value="pequena">Pequeña</option><option value="mediana">Mediana</option><option value="grande">Grande</option></select></label></div><div className="form-two"><label className="field"><span>Moneda</span><select name="currency" defaultValue={initial?.currency ?? "PEN"}><option value="PEN">PEN · Sol peruano</option><option value="USD">USD · Dólar</option><option value="EUR">EUR · Euro</option></select></label><label className="field"><span>Estado</span><select name="status" defaultValue={initial?.status ?? "ACTIVA"}><option value="ACTIVA">Activa</option><option value="INACTIVA">Inactiva</option></select></label></div><label className="field"><span>Descripción</span><textarea name="description" required rows={3} placeholder="Describe brevemente la organización y su actividad." defaultValue={initial?.description ?? ""} /></label><div className="modal-actions"><DemoFillButton values={{ name: "Comercial Demo S.A.C.", sector: "comercial", size: "mediana", currency: "PEN", status: "ACTIVA", description: "Empresa comercial de prueba para validar el flujo completo de Canvas, proyectos y seguimiento." }} /><button type="button" className="outline-button" onClick={onCancel}>Cancelar</button><button className="primary-button" type="submit">{submitLabel}</button></div></form>;
}

function PeriodForm({ onSubmit, initial, onCancel, submitLabel }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void; initial?: Period; onCancel: () => void; submitLabel: string }) {
  return <form className="form-stack" onSubmit={onSubmit}><label className="field"><span>Código de periodo</span><input name="code" required placeholder="2026-11 o 2026-Q4" defaultValue={initial?.code ?? ""} /></label><label className="field"><span>Nombre visible</span><input name="label" placeholder="Noviembre 2026" defaultValue={initial?.label ?? ""} /></label><div className="form-two"><label className="field"><span>Inicio</span><input name="startsOn" required type="date" defaultValue={initial?.startsOn ?? ""} /></label><label className="field"><span>Fin</span><input name="endsOn" required type="date" defaultValue={initial?.endsOn ?? ""} /></label></div><div className="modal-actions"><DemoFillButton values={{ code: "2026-11", label: "Noviembre 2026", startsOn: "2026-11-01", endsOn: "2026-11-30" }} /><button type="button" className="outline-button" onClick={onCancel}>Cancelar</button><button className="primary-button" type="submit">{submitLabel}</button></div></form>;
}

function ConfigurationView({ storageAvailable, persisted, onMockAi, aiLoading }: { storageAvailable: boolean; persisted: boolean; onMockAi: () => void; aiLoading: boolean }) {
  return <div className="configuration-grid"><section className="panel"><PanelHeading title="Estado de ejecución" description="Indicadores técnicos visibles para la demostración." /><div className="config-list"><ConfigRow label="Persistencia local" value={storageAvailable ? "Disponible" : "No disponible"} state={storageAvailable ? "success" : "warning"} detail="Snapshot primario + respaldo local" /><ConfigRow label="Estado actual" value={persisted ? "Guardado" : "En memoria"} state={persisted ? "success" : "warning"} detail="Guardado inmediato y también al cerrar la pestaña" /><ConfigRow label="Operación offline" value="Activa" state="success" detail="Canvas y propuestas guardadas no dependen de red" /><ConfigRow label="Clave Gemini" value="Solo servidor" state="neutral" detail="Nunca se incluye en frontend, Electron o Git" /></div></section><section className="panel architecture-panel"><PanelHeading title="Servicio IA" description="Endpoint seguro y abstracción centralizada." /><div className="service-diagram"><span>UI React</span><b>→</b><span>aiService</span><b>→</b><span>/api/ai</span></div><p>Sin <code>GEMINI_API_KEY</code>, el endpoint responde en modo MOCK contextual. Si Gemini falla, la aplicación local continúa operativa.</p><button className="ai-action" onClick={onMockAi} disabled={aiLoading}>{aiLoading ? "Probando…" : "Ejecutar análisis MOCK"}</button></section><section className="decision-card"><span className="eyebrow light">DECISIÓN DE ARQUITECTURA</span><h3>La IA propone; el usuario decide.</h3><p>Las respuestas se registran en el historial. Aceptar o editar crea un TO BE nuevo; rechazar no modifica el Canvas de origen.</p></section></div>;
}

function AiHistoryViewV3({ entries, organization }: { entries: AppState["aiHistory"]; organization?: Organization }) {
  const filtered = entries.filter((entry) => entry.organizationId === organization?.id);
  return <section className="panel history-panel"><PanelHeading title="Historial de IA" description="Cada interacción se conserva con su respuesta y decisión del usuario." />{filtered.length ? <div className="history-list">{filtered.map((entry) => { let response: Partial<AiResponse> = {}; try { response = JSON.parse(entry.response) as Partial<AiResponse>; } catch { response = {}; } return <article className="history-row" key={entry.id}><div><span className={"mode-tag " + (entry.model === "MOCK" ? "mock" : "real")}>{entry.model}</span><strong>{entry.operation}</strong><small>{formatDate(entry.createdAt)} · decisión: {entry.decision}</small>{entry.proposalVersionId && <small>TO BE creado: {entry.proposalVersionId}</small>}</div><p><b>{response.title ?? "Respuesta registrada"}</b><br />{response.summary ?? "Respuesta estructurada registrada."}<small>{response.findings?.length ?? 0} hallazgos · {response.proposals?.length ?? 0} propuestas</small></p></article>; })}</div> : <EmptyState title="Aún no hay interacciones" description="Ejecuta un análisis desde Análisis IA para registrar una propuesta." />}</section>;
}

function FutureModuleView({ meta }: { meta: { eyebrow: string; title: string; description: string } }) {
  return <section className="future-module"><div className="future-illustration"><span>CM</span><i>✦</i></div><span className="status-pill planned">Fase pendiente</span><h2>{meta.title}</h2><p>{meta.description}</p><div className="phase-boundary"><strong>Este módulo no forma parte de las fases habilitadas.</strong><span>Se activará cuando corresponda según el plan del proyecto.</span></div></section>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button className="modal-close" onClick={onClose} aria-label="Cerrar">×</button><span className="modal-kicker">CANVAS MODEL IA</span><h2 id="modal-title">{title}</h2>{children}</section></div>;
}

function PanelHeading({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <div className="panel-heading"><div><h2>{title}</h2><p>{description}</p></div>{children}</div>;
}

function MetricCard({ label, value, detail, icon, tone }: { label: string; value: string; detail: string; icon: string; tone: string }) {
  return <article className="metric-card"><span className={`metric-icon ${tone}`}>{icon}</span><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></article>;
}

function ObservationRow({ observation, table = false, onEdit }: { observation: AppState["observations"][number]; table?: boolean; onEdit?: () => void }) {
  if (table) return <tr><td><strong className="table-primary">{observation.kpi}</strong></td><td><strong className="table-value">{formatNumber(observation.value)}</strong></td><td>{observation.unit}</td><td>{observation.source}</td><td><span className={`quality-tag ${observation.quality.toLowerCase()}`}>{observation.quality}</span></td><td>{observation.observedAt}</td><td>{onEdit && <button className="row-edit" onClick={onEdit}>Editar</button>}</td></tr>;
  return <div className="observation-row"><span className="observation-mark">◈</span><div><strong>{observation.kpi}</strong><small>{observation.source} · {observation.observedAt}</small></div><b>{formatNumber(observation.value)} <em>{observation.unit}</em></b></div>;
}

function ConfigRow({ label, value, state, detail }: { label: string; value: string; state: "success" | "warning" | "neutral"; detail: string }) {
  return <div className="config-row"><span className={`config-status ${state}`}>●</span><div><strong>{label}</strong><small>{detail}</small></div><em>{value}</em></div>;
}

function EmptyState({ title, description, action, onAction }: { title: string; description: string; action?: string; onAction?: () => void }) {
  return <div className="empty-state"><span>◌</span><h3>{title}</h3><p>{description}</p>{action && onAction && <button className="outline-button" onClick={onAction}>{action}</button>}</div>;
}
