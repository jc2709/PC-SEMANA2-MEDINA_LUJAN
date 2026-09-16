import type { AppState, CanvasVersion, KpiDefinition, KpiForecast, Organization, Period } from "../../types/domain";
import { downloadReportCsv, downloadReportExcel, downloadReportPptx, type ReportData } from "../../services/export/exportService";
import { buildAnalyticsSummary } from "../analytics/AnalyticsModule";
import { formatCurrency, formatNumber } from "../../utils/format";

type ReportProps = {
  state: AppState;
  organization?: Organization;
  period?: Period;
  definitions: KpiDefinition[];
  forecasts: KpiForecast[];
  canvasAsIs?: CanvasVersion;
  canvasToBe?: CanvasVersion;
};

function reportData(props: ReportProps): ReportData {
  const { state, organization, period, definitions, forecasts, canvasAsIs, canvasToBe } = props;
  const projects = state.projects.filter((project) => project.organizationId === organization?.id && project.periodId === period?.id);
  const projectIds = new Set(projects.map((project) => project.id));
  return { organization, period, canvasAsIs, canvasToBe, definitions, forecasts, observations: state.observations.filter((item) => item.organizationId === organization?.id), projects, tasks: state.projectTasks.filter((task) => projectIds.has(task.projectId)), milestones: state.projectMilestones.filter((milestone) => projectIds.has(milestone.projectId)), tracking: state.projectTracking.filter((entry) => projectIds.has(entry.projectId)) };
}

export function ReportsView(props: ReportProps) {
  const data = reportData(props);
  const summary = buildAnalyticsSummary(props.definitions, data.observations, props.forecasts, data.projects, data.tasks, data.tracking);
  const currentForecast = props.forecasts[0];
  return <div className="analytics-layout"><section className="panel analytics-hero"><div><span className="section-label">FASE 6 · SALIDAS</span><h2>Convierte el análisis en evidencia.</h2><p>Genera un reporte con los mismos datos persistidos del contexto activo. Incluye KPI, ejecución, predicción y conclusiones para revisión.</p></div><div className="analytics-hero-actions"><button className="primary-button" onClick={() => downloadReportPptx(data)}>↓ Generar PPTX</button><button className="outline-button" onClick={() => downloadReportExcel(data)}>↓ Excel</button><button className="outline-button" onClick={() => downloadReportCsv(data)}>↓ CSV</button></div></section><section className="report-context panel"><div><span>ORGANIZACIÓN</span><strong>{props.organization?.name ?? "Sin organización"}</strong></div><div><span>PERIODO</span><strong>{props.period?.label ?? "Sin periodo"}</strong></div><div><span>CANVAS ACTUAL</span><strong>{props.canvasAsIs?.name ?? "Sin versión"}</strong></div><div><span>ESCENARIO</span><strong>{props.canvasToBe?.name ?? "Sin TO BE"}</strong></div></section><section className="report-metric-grid"><ReportMetric label="Proyectos" value={formatNumber(summary.total, 0)} detail={`${summary.completed} completados · ${summary.inProgress} en curso`} tone="green" /><ReportMetric label="En riesgo / retrasados" value={`${summary.atRisk} / ${summary.delayed}`} detail="Semáforo de ejecución" tone="amber" /><ReportMetric label="Presupuesto" value={formatCurrency(summary.planBudget, props.organization?.currency ?? "PEN")} detail={`Real: ${formatCurrency(summary.realBudget, props.organization?.currency ?? "PEN")}`} tone="blue" /><ReportMetric label="Predicción" value={currentForecast ? formatNumber(currentForecast.prediction) : "—"} detail={currentForecast ? `${currentForecast.nextPeriodLabel} · ${currentForecast.quality}` : "Genera un pronóstico en F5"} tone="violet" /></section><section className="panel report-preview"><div className="panel-heading"><div><span className="section-label">VISTA PREVIA</span><h3>Contenido del paquete de reporte</h3></div><span className="analytics-disclaimer">Fuente única: almacenamiento local</span></div><div className="report-outline"><ReportOutline number="01" title="Portada y contexto" detail="Organización, periodo, Canvas AS IS y escenario TO BE." /><ReportOutline number="02" title="Diagnóstico" detail={`${data.observations.length} observaciones · ${props.definitions.length} KPI definidos.`} /><ReportOutline number="03" title="Proyectos y Gantt" detail={`${data.projects.length} proyectos · ${data.tasks.length} actividades · ${data.milestones.length} hitos.`} /><ReportOutline number="04" title="KPI y predicción" detail={currentForecast ? `${currentForecast.nextPeriodLabel} · modelo registrado.` : "Sin pronóstico registrado todavía."} /><ReportOutline number="05" title="Conclusiones" detail="Recomendaciones y advertencias para revisión humana." /></div></section><section className="panel report-kpi-table"><div className="panel-heading"><div><span className="section-label">REAL · META · PROYECTADO</span><h3>Resumen de indicadores</h3></div></div>{props.definitions.length ? <div className="execution-table-wrap"><table className="execution-table"><thead><tr><th>KPI</th><th>Real</th><th>Meta</th><th>Proyectado</th><th>Calidad</th></tr></thead><tbody>{props.definitions.map((definition) => { const rowForecast = props.forecasts.find((item) => item.kpiDefinitionId === definition.id); const latest = data.observations.filter((item) => item.kpi.trim().toLocaleLowerCase() === definition.name.trim().toLocaleLowerCase()).sort((a, b) => a.observedAt.localeCompare(b.observedAt)).at(-1); return <tr key={definition.id}><td><strong>{definition.name}</strong><small>{definition.formula}</small></td><td>{latest ? `${formatNumber(latest.value)} ${definition.unit}` : "—"}</td><td>{formatNumber(definition.target)} {definition.unit}</td><td>{rowForecast ? `${formatNumber(rowForecast.prediction)} ${definition.unit}` : "—"}</td><td>{rowForecast?.quality ?? "Sin pronóstico"}</td></tr>; })}</tbody></table></div> : <p className="execution-empty-inline">Define KPI en Fase 5 para incluirlos en el reporte.</p>}</section></div>;
}

function ReportMetric({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) {
  return <div className={`report-metric ${tone}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>;
}

function ReportOutline({ number, title, detail }: { number: string; title: string; detail: string }) {
  return <div className="report-outline-row"><b>{number}</b><div><strong>{title}</strong><small>{detail}</small></div><span>Incluido</span></div>;
}
