"use client";

import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import type { AppState, CanvasBlockKey, CanvasElement, CanvasKind, CanvasStatus, CanvasVersion, Organization, Period, ScenarioType } from "../../types/domain";

export const CANVAS_BLOCKS: Array<{ key: CanvasBlockKey; number: string; title: string; description: string }> = [
  { key: "customer-segments", number: "01", title: "Segmentos de clientes", description: "¿Para quién creamos valor?" },
  { key: "value-propositions", number: "02", title: "Propuesta de valor", description: "¿Qué problema resolvemos?" },
  { key: "channels", number: "03", title: "Canales", description: "¿Cómo llegamos al cliente?" },
  { key: "customer-relationships", number: "04", title: "Relaciones con clientes", description: "¿Cómo acompañamos al cliente?" },
  { key: "revenue-streams", number: "05", title: "Fuentes de ingresos", description: "¿Por qué nos pagan?" },
  { key: "key-resources", number: "06", title: "Recursos clave", description: "¿Qué necesitamos?" },
  { key: "key-activities", number: "07", title: "Actividades clave", description: "¿Qué hacemos para entregar valor?" },
  { key: "key-partners", number: "08", title: "Socios clave", description: "¿Quiénes nos ayudan?" },
  { key: "cost-structure", number: "09", title: "Estructura de costos", description: "¿En qué gastamos?" },
];

const scenarioLabels: Record<ScenarioType, string> = {
  BASE: "Base",
  CONSERVADOR: "Conservador",
  MODERADO: "Moderado",
  AGRESIVO: "Agresivo",
  PERSONALIZADO: "Personalizado",
};

const statusLabels: Record<CanvasStatus, string> = {
  BORRADOR: "Borrador",
  EN_REVISION: "En revisión",
  APROBADO: "Aprobado",
  ARCHIVADO: "Archivado",
};

export type CanvasElementDraft = {
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
};

export type CanvasVersionDraft = { name: string; scenarioId: string | null };
export type CanvasScenarioDraft = { name: string; type: ScenarioType; description: string };

type CanvasEditorProps = {
  state: AppState;
  organization?: Organization;
  period?: Period;
  kind: CanvasKind;
  onCreateVersion: (draft: CanvasVersionDraft & { kind: CanvasKind }) => void;
  onCloneVersion: (versionId: string, targetKind?: CanvasKind) => void;
  onSaveElement: (versionId: string, elementId: string | null, draft: CanvasElementDraft) => void;
  onDeleteElement: (versionId: string, elementId: string) => void;
  onTransitionStatus: (versionId: string, status: CanvasStatus) => void;
  onCreateScenario: (draft: CanvasScenarioDraft) => void;
};

export function CanvasEditorView({ state, organization, period, kind, onCreateVersion, onCloneVersion, onSaveElement, onDeleteElement, onTransitionStatus, onCreateScenario }: CanvasEditorProps) {
  const versions = useMemo(() => state.canvasVersions.filter((item) => item.organizationId === organization?.id && item.periodId === period?.id && item.kind === kind), [kind, organization?.id, period?.id, state.canvasVersions]);
  const scenarios = useMemo(() => state.scenarios.filter((item) => item.organizationId === organization?.id && item.periodId === period?.id), [organization?.id, period?.id, state.scenarios]);
  const asIsVersions = useMemo(() => state.canvasVersions.filter((item) => item.organizationId === organization?.id && item.periodId === period?.id && item.kind === "AS_IS"), [organization?.id, period?.id, state.canvasVersions]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [elementDraft, setElementDraft] = useState<{ versionId: string; element?: CanvasElement; block: CanvasBlockKey } | null>(null);
  const [versionFormOpen, setVersionFormOpen] = useState(false);
  const [scenarioFormOpen, setScenarioFormOpen] = useState(false);
  const selectedVersion = versions.find((item) => item.id === selectedVersionId) ?? versions[0];
  const canEdit = selectedVersion?.status === "BORRADOR";
  const currentScenario = scenarios.find((item) => item.id === selectedVersion?.scenarioId);

  if (!organization || !period) return <EmptyCanvasState title="Selecciona una organización y periodo" description="El Canvas se guarda separado por organización y periodo." />;

  function createVersion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onCreateVersion({ kind, name: String(data.get("name") ?? "").trim(), scenarioId: String(data.get("scenarioId") ?? "") || null });
    setVersionFormOpen(false);
  }

  function createScenario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onCreateScenario({ name: String(data.get("name") ?? "").trim(), type: String(data.get("type") ?? "PERSONALIZADO") as ScenarioType, description: String(data.get("description") ?? "").trim() });
    setScenarioFormOpen(false);
  }

  function requestDelete(element: CanvasElement) {
    if (window.confirm(`¿Eliminar el elemento "${element.title}"?`)) onDeleteElement(selectedVersion!.id, element.id);
  }

  const kindLabel = kind === "AS_IS" ? "modelo actual" : "modelo futuro";
  return <div className="canvas-phase-layout">
    <section className="panel canvas-control-panel">
      <div className="canvas-toolbar">
        <div><span className="eyebrow">CANVAS / {kind}</span><h2>{kind === "AS_IS" ? "Modelo actual" : "Alternativa futura"}</h2><p>{kind === "AS_IS" ? "Describe cómo funciona hoy la organización." : "Construye una evolución propuesta y revisable."}</p></div>
        <div className="canvas-toolbar-actions">
          <button className="primary-button" onClick={() => setVersionFormOpen(true)}>＋ Nuevo {kind === "AS_IS" ? "AS IS" : "TO BE"}</button>
          {kind === "AS_IS" && selectedVersion && <button className="outline-button" onClick={() => onCloneVersion(selectedVersion.id, "TO_BE")}>Derivar TO BE</button>}
          {kind === "TO_BE" && asIsVersions[0] && <button className="outline-button" onClick={() => onCloneVersion(asIsVersions[0].id, "TO_BE")}>Clonar AS IS</button>}
        </div>
      </div>
      {versions.length ? <div className="canvas-version-bar"><label className="field compact-field"><span>Versión seleccionada</span><select value={selectedVersion?.id ?? ""} onChange={(event) => setSelectedVersionId(event.target.value)}>{versions.map((item) => <option key={item.id} value={item.id}>v{item.version} · {item.name} · {statusLabels[item.status]}</option>)}</select></label><div className="canvas-version-summary"><span className={`canvas-status ${selectedVersion?.status.toLowerCase()}`}>{statusLabels[selectedVersion!.status]}</span><strong>{selectedVersion!.elements.length} elementos</strong>{currentScenario && <small>Escenario: {currentScenario.name}</small>}</div></div> : <EmptyCanvasState title={`Aún no hay ${kindLabel}`} description={`Crea el primer ${kindLabel} para trabajar con los nueve bloques.`} action={`Crear ${kind === "AS_IS" ? "AS IS" : "TO BE"}`} onAction={() => setVersionFormOpen(true)} />}
      {selectedVersion && <div className="canvas-status-actions"><span>{selectedVersion.status === "APROBADO" ? "Esta versión está congelada y no admite cambios directos." : selectedVersion.status === "EN_REVISION" ? "Revisa la propuesta antes de aprobarla." : "Los cambios se guardan en la versión seleccionada."}</span><div>{selectedVersion.status === "BORRADOR" && <><button className="outline-button" onClick={() => onTransitionStatus(selectedVersion.id, "EN_REVISION")}>Enviar a revisión</button><button className="outline-button" onClick={() => onTransitionStatus(selectedVersion.id, "ARCHIVADO")}>Archivar</button></>}{selectedVersion.status === "EN_REVISION" && <><button className="outline-button" onClick={() => onTransitionStatus(selectedVersion.id, "APROBADO")}>Aprobar versión</button><button className="outline-button" onClick={() => onTransitionStatus(selectedVersion.id, "BORRADOR")}>Devolver a borrador</button></>}{selectedVersion.status === "APROBADO" && <><button className="outline-button" onClick={() => onCloneVersion(selectedVersion.id)}>Clonar para editar</button><button className="outline-button" onClick={() => onTransitionStatus(selectedVersion.id, "ARCHIVADO")}>Archivar</button></>}</div></div>}
    </section>

    <section className="canvas-scenario-strip panel"><div><span className="eyebrow">ESCENARIOS</span><h3>Alternativas independientes</h3><p>Cada escenario tiene sus propias versiones; modificar uno no modifica los demás.</p></div><div className="scenario-list">{scenarios.map((scenario) => <span className="scenario-chip" key={scenario.id}><b>{scenarioLabels[scenario.type]}</b>{scenario.name}</span>)}<button className="outline-button" onClick={() => setScenarioFormOpen((current) => !current)}>＋ Nuevo escenario</button></div></section>

    {selectedVersion && <div className="canvas-board">{CANVAS_BLOCKS.map((block) => { const elements = selectedVersion.elements.filter((item) => item.block === block.key); return <section className={`canvas-block block-${block.key}`} key={block.key}><header><div><span>{block.number}</span><h3>{block.title}</h3><small>{block.description}</small></div>{canEdit && <button className="row-edit" onClick={() => setElementDraft({ versionId: selectedVersion.id, block: block.key })}>＋ Agregar</button>}</header><div className="canvas-block-elements">{elements.length ? elements.map((element) => <article className="canvas-element-card" key={element.id}><div className="canvas-element-heading"><h4>{element.title}</h4><span>{element.confidence}% confianza</span></div><p>{element.description}</p>{element.hypothesis && <small><b>Hipótesis:</b> {element.hypothesis}</small>}{element.evidence && <small><b>Evidencia:</b> {element.evidence}</small>}<div className="canvas-element-meta">{element.relatedKpi && <span>KPI: {element.relatedKpi}</span>}{element.responsible && <span>Responsable: {element.responsible}</span>}{element.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>{canEdit && <div className="canvas-element-actions"><button className="row-edit" onClick={() => setElementDraft({ versionId: selectedVersion.id, element, block: element.block })}>Editar</button><button className="row-edit danger-action" onClick={() => requestDelete(element)}>Eliminar</button></div>}</article>) : <div className="canvas-block-empty">Sin elementos todavía{canEdit && <button onClick={() => setElementDraft({ versionId: selectedVersion.id, block: block.key })}>Agregar el primero</button>}</div>}</div></section>; })}</div>}
    {versionFormOpen && <ModalShell title={`Nuevo Canvas ${kind}`} onClose={() => setVersionFormOpen(false)}><form className="form-stack" onSubmit={createVersion}><label className="field"><span>Nombre de la versión</span><input name="name" required placeholder={kind === "AS_IS" ? "Modelo actual v1" : "Alternativa digital v1"} /></label>{kind === "TO_BE" && <label className="field"><span>Escenario asociado</span><select name="scenarioId" defaultValue=""><option value="">Sin escenario específico</option>{scenarios.map((scenario) => <option key={scenario.id} value={scenario.id}>{scenario.name} · {scenarioLabels[scenario.type]}</option>)}</select></label>}<div className="modal-actions"><button type="button" className="outline-button" onClick={() => setVersionFormOpen(false)}>Cancelar</button><button className="primary-button" type="submit">Crear versión</button></div></form></ModalShell>}
    {scenarioFormOpen && <ModalShell title="Nuevo escenario" onClose={() => setScenarioFormOpen(false)}><form className="form-stack" onSubmit={createScenario}><label className="field"><span>Nombre</span><input name="name" required placeholder="Ej. Crecimiento regional" /></label><label className="field"><span>Tipo</span><select name="type" defaultValue="PERSONALIZADO">{Object.entries(scenarioLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="field"><span>Descripción</span><textarea name="description" required rows={3} placeholder="Explica qué representa este escenario." /></label><div className="modal-actions"><button type="button" className="outline-button" onClick={() => setScenarioFormOpen(false)}>Cancelar</button><button className="primary-button" type="submit">Crear escenario</button></div></form></ModalShell>}
    {elementDraft && <ModalShell title={`${elementDraft.element ? "Editar" : "Agregar"} elemento · ${CANVAS_BLOCKS.find((item) => item.key === elementDraft.block)?.title}`} onClose={() => setElementDraft(null)}><CanvasElementForm initial={elementDraft.element} block={elementDraft.block} onCancel={() => setElementDraft(null)} onSubmit={(draft) => { onSaveElement(elementDraft.versionId, elementDraft.element?.id ?? null, draft); setElementDraft(null); }} /></ModalShell>}
  </div>;
}

function CanvasElementForm({ initial, block, onCancel, onSubmit }: { initial?: CanvasElement; block: CanvasBlockKey; onCancel: () => void; onSubmit: (draft: CanvasElementDraft) => void }) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const confidence = Number(data.get("confidence"));
    onSubmit({ block, title: String(data.get("title") ?? "").trim(), description: String(data.get("description") ?? "").trim(), hypothesis: String(data.get("hypothesis") ?? "").trim(), evidence: String(data.get("evidence") ?? "").trim(), responsible: String(data.get("responsible") ?? "").trim(), relatedKpi: String(data.get("relatedKpi") ?? "").trim(), confidence: Number.isFinite(confidence) ? Math.min(100, Math.max(0, confidence)) : 0, tags: String(data.get("tags") ?? "").split(",").map((tag) => tag.trim()).filter(Boolean), comments: String(data.get("comments") ?? "").trim(), source: String(data.get("source") ?? "").trim() });
  }

  return <form className="form-stack canvas-element-form" onSubmit={submit}><label className="field"><span>Título</span><input name="title" required defaultValue={initial?.title ?? ""} placeholder="Ej. Clientes objetivo" /></label><label className="field"><span>Descripción</span><textarea name="description" required rows={3} defaultValue={initial?.description ?? ""} placeholder="Describe este elemento del Canvas." /></label><div className="form-two"><label className="field"><span>Hipótesis</span><textarea name="hypothesis" rows={2} defaultValue={initial?.hypothesis ?? ""} placeholder="Qué suponemos" /></label><label className="field"><span>Evidencia</span><textarea name="evidence" rows={2} defaultValue={initial?.evidence ?? ""} placeholder="Qué lo respalda" /></label></div><div className="form-two"><label className="field"><span>Responsable</span><input name="responsible" defaultValue={initial?.responsible ?? ""} placeholder="Persona o equipo" /></label><label className="field"><span>KPI relacionado</span><input name="relatedKpi" defaultValue={initial?.relatedKpi ?? ""} placeholder="Ej. Ventas" /></label></div><div className="form-two"><label className="field"><span>Confianza (%)</span><input name="confidence" type="number" min="0" max="100" defaultValue={initial?.confidence ?? 70} /></label><label className="field"><span>Etiquetas</span><input name="tags" defaultValue={initial?.tags.join(", ") ?? ""} placeholder="hipótesis, piloto" /></label></div><label className="field"><span>Fuente</span><input name="source" defaultValue={initial?.source ?? ""} placeholder="Entrevista, dato histórico, taller…" /></label><label className="field"><span>Comentarios</span><textarea name="comments" rows={2} defaultValue={initial?.comments ?? ""} placeholder="Notas para revisión" /></label><div className="modal-actions"><button type="button" className="outline-button" onClick={onCancel}>Cancelar</button><button className="primary-button" type="submit">Guardar elemento</button></div></form>;
}

export function CanvasComparisonView({ state, organization, period }: { state: AppState; organization?: Organization; period?: Period }) {
  const asIsVersions = useMemo(() => state.canvasVersions.filter((item) => item.organizationId === organization?.id && item.periodId === period?.id && item.kind === "AS_IS"), [organization?.id, period?.id, state.canvasVersions]);
  const toBeVersions = useMemo(() => state.canvasVersions.filter((item) => item.organizationId === organization?.id && item.periodId === period?.id && item.kind === "TO_BE"), [organization?.id, period?.id, state.canvasVersions]);
  const [asIsId, setAsIsId] = useState<string | null>(null);
  const [toBeId, setToBeId] = useState<string | null>(null);
  const asIs = asIsVersions.find((item) => item.id === asIsId) ?? asIsVersions[0];
  const toBe = toBeVersions.find((item) => item.id === toBeId) ?? toBeVersions[0];
  const rows = asIs && toBe ? compareCanvases(asIs, toBe) : [];
  const counts = rows.reduce<Record<ComparisonType, number>>((result, row) => { result[row.type] += 1; return result; }, { CREAR: 0, MODIFICAR: 0, ELIMINAR: 0, MANTENER: 0 });

  if (!organization || !period) return <EmptyCanvasState title="Selecciona una organización y periodo" description="La comparación necesita un contexto activo." />;
  if (!asIs || !toBe) return <EmptyCanvasState title="Faltan versiones para comparar" description="Crea un AS IS y un TO BE en este periodo para visualizar sus brechas." />;
  return <div className="comparison-layout"><section className="panel comparison-controls"><div><span className="eyebrow">CANVAS / BRECHAS</span><h2>Comparación AS IS vs TO BE</h2><p>Clasificación determinista por bloque y elemento de origen.</p></div><div className="comparison-selects"><label className="field compact-field"><span>AS IS</span><select value={asIs.id} onChange={(event) => setAsIsId(event.target.value)}>{asIsVersions.map((item) => <option key={item.id} value={item.id}>v{item.version} · {item.name}</option>)}</select></label><label className="field compact-field"><span>TO BE</span><select value={toBe.id} onChange={(event) => setToBeId(event.target.value)}>{toBeVersions.map((item) => <option key={item.id} value={item.id}>v{item.version} · {item.name}</option>)}</select></label></div></section><section className="comparison-summary">{(["CREAR", "MODIFICAR", "ELIMINAR", "MANTENER"] as ComparisonType[]).map((type) => <article key={type} className={`comparison-count ${type.toLowerCase()}`}><strong>{counts[type]}</strong><span>{type}</span></article>)}</section><div className="comparison-list">{CANVAS_BLOCKS.map((block) => { const blockRows = rows.filter((row) => row.block === block.key); return <section className="panel comparison-block" key={block.key}><header><span>{block.number}</span><div><h3>{block.title}</h3><small>{blockRows.length} diferencia{blockRows.length === 1 ? "" : "s"} o coincidencia{blockRows.length === 1 ? "" : "s"}</small></div></header>{blockRows.length ? blockRows.map((row) => <article className="comparison-row" key={`${row.type}-${row.key}`}><span className={`comparison-type ${row.type.toLowerCase()}`}>{row.type}</span><div><strong>{row.title}</strong><small>{row.detail}</small></div></article>) : <p className="comparison-empty">Sin elementos en este bloque.</p>}</section>; })}</div></div>;
}

type ComparisonType = "CREAR" | "MODIFICAR" | "ELIMINAR" | "MANTENER";
type ComparisonRow = { type: ComparisonType; block: CanvasBlockKey; key: string; title: string; detail: string };

export function compareCanvases(asIs: CanvasVersion, toBe: CanvasVersion): ComparisonRow[] {
  const rows: ComparisonRow[] = [];
  for (const block of CANVAS_BLOCKS) {
    const asElements = asIs.elements.filter((item) => item.block === block.key);
    const toElements = toBe.elements.filter((item) => item.block === block.key);
    const matched = new Set<string>();
    for (const future of toElements) {
      const match = asElements.find((current) => !matched.has(current.id) && ((future.sourceElementId && future.sourceElementId === current.id) || current.title.trim().toLowerCase() === future.title.trim().toLowerCase()));
      if (!match) {
        rows.push({ type: "CREAR", block: block.key, key: future.id, title: future.title, detail: `Nuevo elemento TO BE: ${future.description}` });
        continue;
      }
      matched.add(match.id);
      const changed = !sameElementContent(match, future);
      rows.push({ type: changed ? "MODIFICAR" : "MANTENER", block: block.key, key: future.id, title: future.title, detail: changed ? `AS IS: ${match.description} · TO BE: ${future.description}` : "El elemento se mantiene sin cambios materiales." });
    }
    for (const current of asElements.filter((item) => !matched.has(item.id))) rows.push({ type: "ELIMINAR", block: block.key, key: current.id, title: current.title, detail: `Elemento presente en AS IS: ${current.description}` });
  }
  return rows;
}

function sameElementContent(left: CanvasElement, right: CanvasElement) {
  return left.title === right.title && left.description === right.description && left.hypothesis === right.hypothesis && left.evidence === right.evidence && left.responsible === right.responsible && left.relatedKpi === right.relatedKpi && left.confidence === right.confidence && left.comments === right.comments && left.source === right.source && left.tags.join("|") === right.tags.join("|");
}

function EmptyCanvasState({ title, description, action, onAction }: { title: string; description: string; action?: string; onAction?: () => void }) {
  return <div className="empty-state canvas-empty-state"><span>▦</span><h3>{title}</h3><p>{description}</p>{action && onAction && <button className="outline-button" onClick={onAction}>{action}</button>}</div>;
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal-card canvas-modal-card" role="dialog" aria-modal="true" aria-labelledby="canvas-modal-title"><button className="modal-close" onClick={onClose} aria-label="Cerrar">×</button><span className="modal-kicker">CANVAS MODEL IA</span><h2 id="canvas-modal-title">{title}</h2>{children}</section></div>;
}
