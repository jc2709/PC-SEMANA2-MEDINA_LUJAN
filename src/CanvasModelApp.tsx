"use client";

import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { createDemoState } from "./data/demoData";
import { aiService, type AiResponse } from "./services/ai/aiService";
import { parseDataFile, previewStats, type ImportPreview } from "./services/import/importService";
import { loadState, saveState } from "./services/storage/storage";
import type { AppState, AppView, DataQuality, Organization, OrganizationSize, Period, Sector } from "./types/domain";
import { formatCurrency, formatDate, formatNumber, makeId, todayInputValue } from "./utils/format";

type Modal = "organization" | "period" | null;

const navigation: Array<{ id: AppView; label: string; icon: string; phase?: string }> = [
  { id: "dashboard", label: "Dashboard", icon: "⌂" },
  { id: "organization", label: "Organización", icon: "▣" },
  { id: "data", label: "Datos", icon: "▤" },
  { id: "canvas-as-is", label: "Canvas AS IS", icon: "▦", phase: "F2" },
  { id: "canvas-to-be", label: "Canvas TO BE", icon: "◇", phase: "F2" },
  { id: "comparison", label: "Comparación", icon: "⇄", phase: "F2" },
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
  "canvas-as-is": { eyebrow: "CANVAS / ACTUAL", title: "Canvas AS IS", description: "El modelo actual se habilitará en la Fase 2." },
  "canvas-to-be": { eyebrow: "CANVAS / FUTURO", title: "Canvas TO BE", description: "Las alternativas futuras se habilitarán en la Fase 2." },
  comparison: { eyebrow: "CANVAS / BRECHAS", title: "Comparación AS IS vs TO BE", description: "La clasificación de brechas se habilitará en la Fase 2." },
  projects: { eyebrow: "EJECUCIÓN / CAMBIOS", title: "Proyectos", description: "La gestión de proyectos se habilitará en la Fase 4." },
  gantt: { eyebrow: "EJECUCIÓN / PLAN", title: "Gantt", description: "El plan de actividades se habilitará en la Fase 4." },
  tracking: { eyebrow: "EJECUCIÓN / CONTROL", title: "Seguimiento", description: "El seguimiento de ejecución se habilitará en la Fase 4." },
  kpi: { eyebrow: "ANALÍTICA / INDICADORES", title: "KPI", description: "La definición de indicadores se habilitará en la Fase 5." },
  prediction: { eyebrow: "ANALÍTICA / PRONÓSTICO", title: "Predicción", description: "El motor predictivo local se habilitará en la Fase 5." },
  simulation: { eyebrow: "ANALÍTICA / ESCENARIOS", title: "Simulación", description: "El simulador se habilitará en la Fase 5." },
  reports: { eyebrow: "SALIDAS / EVIDENCIA", title: "Reportes", description: "Los reportes y exportaciones se habilitarán en la Fase 6." },
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
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const activeOrganization = state.organizations.find((item) => item.id === state.activeOrganizationId) ?? state.organizations[0];
  const organizationPeriods = useMemo(() => state.periods.filter((item) => item.organizationId === activeOrganization?.id), [activeOrganization?.id, state.periods]);
  const activePeriod = organizationPeriods.find((item) => item.id === state.activePeriodId) ?? organizationPeriods[0];
  const activeObservations = useMemo(() => state.observations.filter((item) => item.organizationId === activeOrganization?.id && item.periodId === activePeriod?.id), [activeOrganization?.id, activePeriod?.id, state.observations]);
  const latestImport = state.imports[0];

  function notify(message: string) {
    setToast(message);
  }

  function navigate(nextView: AppView) {
    setView(nextView);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function chooseOrganization(organizationId: string) {
    const firstPeriod = state.periods.find((item) => item.organizationId === organizationId);
    setState((current) => ({ ...current, activeOrganizationId: organizationId, activePeriodId: firstPeriod?.id ?? "" }));
  }

  function choosePeriod(periodId: string) {
    setState((current) => ({ ...current, activePeriodId: periodId }));
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
      status: "ACTIVA",
    };
    setState((current) => ({ ...current, organizations: [...current.organizations, organization], activeOrganizationId: organization.id, activePeriodId: "" }));
    setModal(null);
    notify("Organización creada. Ahora agrega su primer periodo.");
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
    setState((current) => ({ ...current, periods: [...current.periods, period], activePeriodId: period.id }));
    setModal(null);
    notify("Periodo creado y seleccionado.");
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
    const quality = String(data.get("quality")) as DataQuality;
    if (!kpi || !Number.isFinite(value) || !unit || !source || !observedAt) {
      notify("Completa todos los campos de la observación.");
      return;
    }
    const observation = { id: makeId("obs"), organizationId: activeOrganization.id, periodId: activePeriod.id, kpi, value, unit, source, quality, observedAt, createdAt: new Date().toISOString() };
    setState((current) => ({ ...current, observations: [observation, ...current.observations] }));
    event.currentTarget.reset();
    notify("Observación guardada localmente.");
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
    setState((current) => ({ ...current, observations: [...observations, ...current.observations], imports: [log, ...current.imports] }));
    setImportPreview(null);
    notify(`Importación confirmada: ${stats.validRows} filas válidas.`);
  }

  async function runMockAssistant() {
    if (!activeOrganization) return;
    setAiLoading(true);
    const response = await aiService.analizarCanvas({ organizationId: activeOrganization.id, context: { organization: activeOrganization, period: activePeriod, observations: activeObservations } });
    setLastAiResponse(response);
    setState((current) => ({ ...current, aiHistory: [{ id: makeId("ai"), organizationId: activeOrganization.id, module: "Fase 1", operation: response.operation, logicalPrompt: "Analizar contexto ingresado por el usuario; sin buscadores.", model: response.mode === "MOCK" ? "MOCK" : "Gemini", response: JSON.stringify(response), decision: "PENDIENTE", createdAt: response.generatedAt }, ...current.aiHistory] }));
    setAiLoading(false);
    notify(response.mode === "MOCK" ? "Modo demostración / MOCK: la aplicación local continúa operativa." : "Propuesta IA recibida para revisión.");
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
          {view === "dashboard" && <DashboardView state={state} organization={activeOrganization} period={activePeriod} observations={activeObservations} latestImport={latestImport} navigate={navigate} onMockAi={runMockAssistant} aiLoading={aiLoading} lastAiResponse={lastAiResponse} />}
          {view === "organization" && <OrganizationView state={state} organization={activeOrganization} periods={organizationPeriods} onOpenOrganization={() => setModal("organization")} onOpenPeriod={() => setModal("period")} onSelectOrganization={chooseOrganization} />}
          {view === "data" && <DataView observations={activeObservations} period={activePeriod} onObservation={handleObservation} onImportFile={handleImportFile} onConfirmImport={confirmImport} importPreview={importPreview} importing={importing} onExport={exportObservations} />}
          {view === "ai-history" && <AiHistoryView entries={state.aiHistory} organization={activeOrganization} />}
          {view === "configuration" && <ConfigurationView storageAvailable={storageAvailable} persisted={storageAvailable && hydrated} onMockAi={runMockAssistant} aiLoading={aiLoading} />}
          {!(["dashboard", "organization", "data", "ai-history", "configuration"] as AppView[]).includes(view) && <FutureModuleView meta={meta} />}
        </div>
      </section>

      {modal && <Modal title={modal === "organization" ? "Nueva organización" : "Nuevo periodo"} onClose={() => setModal(null)}>
        {modal === "organization" ? <OrganizationForm onSubmit={handleOrganization} /> : <PeriodForm onSubmit={handlePeriod} />}
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
      <div className="welcome-card"><div><span className="eyebrow light">FASE 1 · PREPARACIÓN + NÚCLEO + DATOS</span><h2>Un contexto confiable para tomar decisiones.</h2><p>{organization?.description ?? "Crea una organización para comenzar."}</p></div><div className="welcome-orbit"><span>DATOS</span><i>AS IS</i><b>IA</b></div></div>
      <div className="phase-card"><span className="status-pill success">● Operativo</span><h3>Base lista para evolucionar</h3><p>La información se guarda en el navegador y permanece separada por organización y periodo.</p><button className="text-button" onClick={() => navigate("configuration")}>Ver configuración →</button></div>
    </section>
    <div className="metric-grid">
      <MetricCard label="Organizaciones" value={formatNumber(state.organizations.length, 0)} detail="Contextos registrados" icon="▣" tone="green" />
      <MetricCard label="Periodos activos" value={formatNumber(state.periods.length, 0)} detail="Sin mezclar históricos" icon="◷" tone="blue" />
      <MetricCard label="Observaciones" value={formatNumber(observations.length, 0)} detail={period ? period.label : "Selecciona un periodo"} icon="▤" tone="amber" />
      <MetricCard label="Valor acumulado" value={formatCurrency(totalValue, organization?.currency ?? "PEN")} detail={`${sources} fuente${sources === 1 ? "" : "s"} en el periodo`} icon="◈" tone="violet" />
    </div>
    <section className="dashboard-columns">
      <div className="panel observations-panel"><PanelHeading title="Observaciones recientes" description={period ? `${period.label} · ${observations.length} registros` : "Sin periodo seleccionado"}><button className="outline-button" onClick={() => navigate("data")}>Gestionar datos</button></PanelHeading>{observations.length ? <div className="observation-list">{observations.slice(0, 6).map((item) => <ObservationRow key={item.id} observation={item} />)}</div> : <EmptyState title="Aún no hay datos" description="Registra una observación manual o importa un archivo validado." action="Ir a Datos" onAction={() => navigate("data")} />}</div>
      <aside className="panel readiness-panel"><PanelHeading title="Progreso del núcleo" description="Capacidades preparadas para la siguiente fase." /><div className="readiness-item"><span className="readiness-icon done">✓</span><div><strong>Organizaciones y periodos</strong><small>Separación lógica activa</small></div><em>Listo</em></div><div className="readiness-item"><span className="readiness-icon done">✓</span><div><strong>Ingreso manual e importación</strong><small>CSV/XLSX con validación</small></div><em>Listo</em></div><div className="readiness-item"><span className="readiness-icon pending">✦</span><div><strong>Asistente IA desacoplado</strong><small>{lastAiResponse?.mode === "REAL" ? "Respuesta real" : "Mock disponible"}</small></div><em>{lastAiResponse?.mode === "REAL" ? "Activo" : "Mock"}</em></div><button className="ai-action" onClick={onMockAi} disabled={aiLoading}>{aiLoading ? "Consultando…" : "Probar asistente IA · MOCK"}</button>{lastAiResponse && <div className="ai-result"><span>{lastAiResponse.title}</span><p>{lastAiResponse.findings[0]?.text}</p></div>}<div className="import-mini"><span className="mini-label">ÚLTIMA IMPORTACIÓN</span>{latestImport ? <><strong>{latestImport.fileName}</strong><small>{latestImport.validRows}/{latestImport.processedRows} filas válidas · {formatDate(latestImport.importedAt)}</small></> : <small>No hay importaciones registradas.</small>}</div></aside>
    </section>
  </>;
}

function OrganizationView({ state, organization, periods, onOpenOrganization, onOpenPeriod, onSelectOrganization }: { state: AppState; organization?: Organization; periods: Period[]; onOpenOrganization: () => void; onOpenPeriod: () => void; onSelectOrganization: (id: string) => void }) {
  return <div className="organization-layout"><section className="panel"><PanelHeading title="Organizaciones" description={`${state.organizations.length} contexto${state.organizations.length === 1 ? "" : "s"} disponible${state.organizations.length === 1 ? "" : "s"}`}><button className="primary-button" onClick={onOpenOrganization}>＋ Nueva organización</button></PanelHeading><div className="organization-list">{state.organizations.map((item) => <button key={item.id} className={`organization-card ${item.id === organization?.id ? "selected" : ""}`} onClick={() => onSelectOrganization(item.id)}><span className="org-monogram">{item.name.slice(0, 2).toUpperCase()}</span><div><strong>{item.name}</strong><small>{sectorLabels[item.sector]} · {sizeLabels[item.size]} · {item.currency}</small></div><span className="org-status">{item.status}</span></button>)}</div></section><section className="panel period-panel"><PanelHeading title="Periodos de la organización activa" description={organization ? organization.name : "Selecciona una organización"}><button className="outline-button" onClick={onOpenPeriod} disabled={!organization}>＋ Agregar periodo</button></PanelHeading>{periods.length ? <div className="period-list">{periods.map((period) => <div className="period-row" key={period.id}><span className="period-icon">◷</span><div><strong>{period.label}</strong><small>{period.code} · {period.startsOn} → {period.endsOn}</small></div><span className="period-check">✓ Aislado</span></div>)}</div> : <EmptyState title="No hay periodos" description="Agrega el primer periodo para poder cargar datos." action="Crear periodo" onAction={onOpenPeriod} />}</section><section className="context-note"><span className="note-icon">i</span><div><strong>Regla de aislamiento</strong><p>Los datos siempre se guardan con organización y periodo. Cambiar de contexto no mezcla observaciones ni archivos importados.</p></div></section></div>;
}

function DataView({ observations, period, onObservation, onImportFile, onConfirmImport, importPreview, importing, onExport }: { observations: AppState["observations"]; period?: Period; onObservation: (event: FormEvent<HTMLFormElement>) => void; onImportFile: (event: ChangeEvent<HTMLInputElement>) => void; onConfirmImport: () => void; importPreview: ImportPreview | null; importing: boolean; onExport: () => void }) {
  const stats = importPreview ? previewStats(importPreview) : null;
  return <div className="data-layout"><section className="data-entry-grid"><div className="panel form-panel"><PanelHeading title="Registro manual" description="Una observación por KPI y periodo." /><ObservationForm onSubmit={onObservation} period={period} /></div><div className="panel import-panel"><PanelHeading title="Importar datos" description="XLSX o CSV con vista previa y validación." /><label className="drop-zone"><input type="file" accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={onImportFile} disabled={importing} /><span className="upload-icon">↑</span><strong>{importing ? "Leyendo archivo…" : "Selecciona un archivo XLSX o CSV"}</strong><small>Columnas detectadas: KPI, Periodo, Valor, Unidad, Fuente, Calidad, Fecha</small></label>{importPreview && stats && <div className="import-preview"><div className="preview-header"><div><strong>{importPreview.fileName}</strong><small>{importPreview.headers.length} columnas detectadas</small></div><div className="preview-counts"><span className="valid">{stats.validRows} válidas</span><span className="invalid">{stats.invalidRows} inválidas</span></div></div><div className="preview-table"><table><thead><tr><th>FILA</th><th>KPI</th><th>PERIODO</th><th>VALOR</th><th>ESTADO</th></tr></thead><tbody>{importPreview.rows.slice(0, 8).map((row) => <tr key={row.sourceRow}><td>{row.sourceRow}</td><td>{row.draft?.kpi ?? String(row.raw.KPI ?? row.raw.kpi ?? "—")}</td><td>{row.draft?.periodCode ?? "—"}</td><td>{row.draft?.value ?? "—"}</td><td>{row.errors.length ? <span className="status-tag danger">{row.errors[0].message}</span> : <span className="status-tag success">Válida</span>}</td></tr>)}</tbody></table></div><button className="primary-button full" onClick={onConfirmImport} disabled={stats.validRows === 0}>Confirmar importación ({stats.validRows})</button></div>}</div></section><section className="panel"><PanelHeading title="Histórico del periodo" description={period ? `${period.label} · los registros proceden del mismo almacenamiento` : "Selecciona un periodo"}><button className="outline-button" onClick={onExport} disabled={!observations.length}>↓ Exportar CSV</button></PanelHeading>{observations.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>KPI</th><th>VALOR</th><th>UNIDAD</th><th>FUENTE</th><th>CALIDAD</th><th>FECHA</th></tr></thead><tbody>{observations.map((item) => <ObservationRow key={item.id} observation={item} table />)}</tbody></table></div> : <EmptyState title="Periodo sin observaciones" description="Los datos que registres aquí quedarán persistidos localmente." />}</section></div>;
}

function ObservationForm({ onSubmit, period }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void; period?: Period }) {
  return <form className="form-stack" onSubmit={onSubmit}><label className="field"><span>KPI</span><input name="kpi" required placeholder="Ej. Ventas" /></label><div className="form-two"><label className="field"><span>Valor</span><input name="value" required type="number" step="any" placeholder="0" /></label><label className="field"><span>Unidad</span><input name="unit" required placeholder="PEN, %, clientes…" /></label></div><label className="field"><span>Fuente</span><input name="source" required placeholder="Sistema comercial, encuesta…" /></label><div className="form-two"><label className="field"><span>Calidad</span><select name="quality" defaultValue="MEDIA"><option value="ALTA">Alta</option><option value="MEDIA">Media</option><option value="BAJA">Baja</option></select></label><label className="field"><span>Fecha de observación</span><input name="observedAt" required type="date" defaultValue={todayInputValue()} /></label></div><div className="form-context"><span>PERIODO ACTIVO</span><strong>{period?.label ?? "Sin periodo"}</strong></div><button className="primary-button full" type="submit" disabled={!period}>Guardar observación</button></form>;
}

function OrganizationForm({ onSubmit }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <form className="form-stack" onSubmit={onSubmit}><label className="field"><span>Nombre legal o comercial</span><input name="name" required placeholder="Ej. Comercial Andina S.A.C." /></label><div className="form-two"><label className="field"><span>Sector</span><select name="sector" defaultValue="comercial"><option value="industrial">Industrial</option><option value="comercial">Comercial</option><option value="servicios">Servicios</option></select></label><label className="field"><span>Tamaño</span><select name="size" defaultValue="mediana"><option value="micro">Micro</option><option value="pequena">Pequeña</option><option value="mediana">Mediana</option><option value="grande">Grande</option></select></label></div><div className="form-two"><label className="field"><span>Moneda</span><select name="currency" defaultValue="PEN"><option value="PEN">PEN · Sol peruano</option><option value="USD">USD · Dólar</option><option value="EUR">EUR · Euro</option></select></label><span /></div><label className="field"><span>Descripción</span><textarea name="description" required rows={3} placeholder="Describe brevemente la organización y su actividad." /></label><div className="modal-actions"><button type="button" className="outline-button" onClick={(event) => event.currentTarget.closest(".modal-backdrop")?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }))}>Cancelar</button><button className="primary-button" type="submit">Crear organización</button></div></form>;
}

function PeriodForm({ onSubmit }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <form className="form-stack" onSubmit={onSubmit}><label className="field"><span>Código de periodo</span><input name="code" required placeholder="2026-11 o 2026-Q4" /></label><label className="field"><span>Nombre visible</span><input name="label" placeholder="Noviembre 2026" /></label><div className="form-two"><label className="field"><span>Inicio</span><input name="startsOn" required type="date" /></label><label className="field"><span>Fin</span><input name="endsOn" required type="date" /></label></div><div className="modal-actions"><button type="button" className="outline-button" onClick={(event) => event.currentTarget.closest(".modal-backdrop")?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }))}>Cancelar</button><button className="primary-button" type="submit">Crear periodo</button></div></form>;
}

function AiHistoryView({ entries, organization }: { entries: AppState["aiHistory"]; organization?: Organization }) {
  const filtered = entries.filter((entry) => entry.organizationId === organization?.id);
  return <section className="panel history-panel"><PanelHeading title="Historial de IA" description="Cada interacción queda registrada como propuesta pendiente de decisión." />{filtered.length ? <div className="history-list">{filtered.map((entry) => <article className="history-row" key={entry.id}><div><span className={`mode-tag ${entry.model === "MOCK" ? "mock" : "real"}`}>{entry.model}</span><strong>{entry.operation}</strong><small>{formatDate(entry.createdAt)} · decisión: {entry.decision}</small></div><p>{entry.response}</p></article>)}</div> : <EmptyState title="Aún no hay interacciones" description="Prueba el asistente IA desde el Dashboard; en Fase 1 funcionará en modo MOCK." />}</section>;
}

function ConfigurationView({ storageAvailable, persisted, onMockAi, aiLoading }: { storageAvailable: boolean; persisted: boolean; onMockAi: () => void; aiLoading: boolean }) {
  return <div className="configuration-grid"><section className="panel"><PanelHeading title="Estado de ejecución" description="Indicadores técnicos visibles para la demostración." /><div className="config-list"><ConfigRow label="Persistencia local" value={storageAvailable ? "Disponible" : "No disponible"} state={storageAvailable ? "success" : "warning"} detail="localStorage con snapshot versionado" /><ConfigRow label="Estado actual" value={persisted ? "Guardado" : "En memoria"} state={persisted ? "success" : "warning"} detail="Se rehidrata al abrir la aplicación" /><ConfigRow label="Operación offline" value="Activa" state="success" detail="Organizaciones, periodos y datos no dependen de red" /><ConfigRow label="Clave Gemini" value="Solo servidor" state="neutral" detail="Nunca se incluye en frontend, Electron o Git" /></div></section><section className="panel architecture-panel"><PanelHeading title="Servicio IA" description="Una única abstracción centralizada." /><div className="service-diagram"><span>UI React</span><b>→</b><span>aiService</span><b>→</b><span>/api/ai</span></div><p>Si no existe <code>GEMINI_API_KEY</code>, el endpoint responde claramente en modo MOCK y la operación local continúa.</p><button className="ai-action" onClick={onMockAi} disabled={aiLoading}>{aiLoading ? "Probando…" : "Ejecutar prueba MOCK"}</button></section><section className="decision-card"><span className="eyebrow light">DECISIÓN DE ARQUITECTURA</span><h3>Una sola aplicación para web y escritorio.</h3><p>La lógica vive en <code>src/</code>. Vite/vinext entrega la versión web y el contenedor Electron cargará el mismo build en la Fase 7.</p></section></div>;
}

function FutureModuleView({ meta }: { meta: { eyebrow: string; title: string; description: string } }) {
  return <section className="future-module"><div className="future-illustration"><span>CM</span><i>✦</i></div><span className="status-pill planned">Fase pendiente</span><h2>{meta.title}</h2><p>{meta.description}</p><div className="phase-boundary"><strong>Este módulo no forma parte de la Fase 1.</strong><span>Se activará después de la aprobación del usuario.</span></div></section>;
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

function ObservationRow({ observation, table = false }: { observation: AppState["observations"][number]; table?: boolean }) {
  if (table) return <tr><td><strong className="table-primary">{observation.kpi}</strong></td><td><strong className="table-value">{formatNumber(observation.value)}</strong></td><td>{observation.unit}</td><td>{observation.source}</td><td><span className={`quality-tag ${observation.quality.toLowerCase()}`}>{observation.quality}</span></td><td>{observation.observedAt}</td></tr>;
  return <div className="observation-row"><span className="observation-mark">◈</span><div><strong>{observation.kpi}</strong><small>{observation.source} · {observation.observedAt}</small></div><b>{formatNumber(observation.value)} <em>{observation.unit}</em></b></div>;
}

function ConfigRow({ label, value, state, detail }: { label: string; value: string; state: "success" | "warning" | "neutral"; detail: string }) {
  return <div className="config-row"><span className={`config-status ${state}`}>●</span><div><strong>{label}</strong><small>{detail}</small></div><em>{value}</em></div>;
}

function EmptyState({ title, description, action, onAction }: { title: string; description: string; action?: string; onAction?: () => void }) {
  return <div className="empty-state"><span>◌</span><h3>{title}</h3><p>{description}</p>{action && onAction && <button className="outline-button" onClick={onAction}>{action}</button>}</div>;
}
