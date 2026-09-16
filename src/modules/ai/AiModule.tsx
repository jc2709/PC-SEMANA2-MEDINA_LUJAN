"use client";

import { useMemo, useState } from "react";
import type { AppState, Organization, Period } from "../../types/domain";
import type { AiDecision, AiElementProposal, AiResponse } from "../../services/ai/aiModel";
import { CANVAS_BLOCK_LABELS } from "../../services/ai/aiModel";

const findingLabels: Record<AiElementProposal["action"] | "HECHO" | "HIPOTESIS" | "RECOMENDACION" | "INFERENCIA", string> = {
  HECHO: "Hecho",
  HIPOTESIS: "Hipótesis",
  RECOMENDACION: "Recomendación",
  INFERENCIA: "Inferencia",
  CREAR: "Crear",
  MODIFICAR: "Modificar",
};

type AiAnalysisProps = {
  state: AppState;
  organization?: Organization;
  period?: Period;
  response: AiResponse | null;
  historyId: string | null;
  loading: boolean;
  onAnalyze: (versionId: string) => void;
  onGenerateToBe: (versionId: string) => void;
  onDecision: (decision: AiDecision, sourceVersionId: string, historyId: string, response: AiResponse, proposals: AiElementProposal[]) => void;
  onNavigateCanvas: () => void;
};

export function AiAnalysisView({ state, organization, period, response, historyId, loading, onAnalyze, onGenerateToBe, onDecision, onNavigateCanvas }: AiAnalysisProps) {
  const versions = useMemo(() => state.canvasVersions.filter((item) => item.organizationId === organization?.id && item.periodId === period?.id && item.kind === "AS_IS"), [organization?.id, period?.id, state.canvasVersions]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState<AiElementProposal[]>([]);
  const [draftResponseKey, setDraftResponseKey] = useState<string | null>(null);
  const selectedVersion = versions.find((item) => item.id === selectedVersionId) ?? versions.find((item) => item.id === response?.sourceVersionId) ?? versions[0];
  const responseMatchesSelection = !response?.sourceVersionId || response.sourceVersionId === selectedVersion?.id;
  const activeDrafts = response && draftResponseKey === response.generatedAt ? drafts : response?.proposals ?? [];
  const editingCurrentResponse = editing && Boolean(response && draftResponseKey === response.generatedAt);

  if (!organization || !period) return <AiEmptyState title="Selecciona una organización y periodo" description="El análisis IA necesita un contexto activo." action="Ir a Canvas AS IS" onAction={onNavigateCanvas} />;
  if (!versions.length) return <AiEmptyState title="Primero crea un Canvas AS IS" description="La IA analiza información existente y nunca inventa el modelo actual." action="Abrir Canvas AS IS" onAction={onNavigateCanvas} />;

  function updateDraft(id: string, field: keyof AiElementProposal, value: string | number | string[]) {
    setDraftResponseKey(response?.generatedAt ?? null);
    setDrafts((current) => current.map((item) => item.id === id ? { ...item, [field]: value } : item));
  }

  function reject() {
    if (historyId && response && selectedVersion && responseMatchesSelection) onDecision("RECHAZADA", selectedVersion.id, historyId, response, activeDrafts);
  }

  function accept() {
    if (historyId && response && selectedVersion && responseMatchesSelection) onDecision("ACEPTADA", selectedVersion.id, historyId, response, response.proposals);
  }

  function applyEdited() {
    if (historyId && response && selectedVersion && responseMatchesSelection) onDecision("EDITADA", selectedVersion.id, historyId, response, activeDrafts);
  }

  return <div className="ai-layout">
    <section className="panel ai-control-panel">
      <div className="ai-toolbar">
        <div><span className="eyebrow">IA / PROPUESTAS CONTROLADAS</span><h2>Análisis del Canvas AS IS</h2><p>La IA observa el contexto suministrado y presenta hallazgos para revisión humana.</p></div>
        <div className="ai-toolbar-actions"><button className="outline-button" onClick={() => onAnalyze(selectedVersion.id)} disabled={loading}>{loading ? "Analizando…" : "Analizar AS IS"}</button><button className="primary-button" onClick={() => onGenerateToBe(selectedVersion.id)} disabled={loading}>{loading ? "Preparando…" : "Generar propuesta TO BE"}</button></div>
      </div>
      <div className="ai-version-bar"><label className="field compact-field"><span>Versión AS IS a analizar</span><select value={selectedVersion.id} onChange={(event) => setSelectedVersionId(event.target.value)}>{versions.map((version) => <option key={version.id} value={version.id}>v{version.version} · {version.name} · {version.status}</option>)}</select></label><div className="ai-source-summary"><strong>{selectedVersion.elements.length} elementos</strong><span>{selectedVersion.status === "APROBADO" ? "Versión aprobada" : "Versión de trabajo"}</span></div></div>
    </section>

    {loading && <section className="panel ai-loading-state" role="status"><span className="ai-pulse">✦</span><div><strong>Procesando propuesta IA…</strong><p>Se está usando únicamente la organización, periodo, observaciones y Canvas seleccionados.</p></div></section>}
    {!loading && !response && <AiEmptyState title="Aún no hay un análisis" description="Ejecuta el análisis AS IS para detectar inconsistencias o genera una propuesta TO BE revisable." />}
    {!loading && response && <>
      <section className="panel ai-response-header"><div><div className="ai-response-title"><span className={"mode-tag " + (response.mode === "MOCK" ? "mock" : "real")}>{response.mode === "MOCK" ? "MODO DEMOSTRACIÓN / MOCK" : "GEMINI / RESPUESTA REAL"}</span><span className="proposal-status">PROPUESTA</span></div><h2>{response.title}</h2><p>{response.summary}</p></div><div className="ai-response-stats"><strong>{response.findings.length}</strong><span>hallazgos</span><strong>{response.proposals.length}</strong><span>propuestas TO BE</span></div></section>
      {response.warning && <div className="ai-warning" role="status"><span>!</span><p>{response.warning}</p></div>}
      {!responseMatchesSelection && <div className="ai-warning" role="alert"><span>!</span><p>Esta respuesta corresponde a otra versión AS IS. Selecciona la versión de origen para decidir sobre ella.</p></div>}
      <section className="panel ai-findings-panel"><div className="panel-heading"><div><h2>Hallazgos para revisión</h2><p>Cada resultado separa hecho, hipótesis, recomendación o inferencia.</p></div></div><div className="ai-findings-grid">{response.findings.map((item) => <article className="ai-finding-card" key={item.id}><div className="ai-card-topline"><span className={"ai-type-tag " + item.type.toLowerCase()}>{findingLabels[item.type]}</span><span>{item.confidence} confianza</span></div><h3>{item.title}</h3><p className="ai-finding-text">{item.text}</p><dl><div><dt>Motivo</dt><dd>{item.reason}</dd></div><div><dt>Evidencia</dt><dd>{item.evidence}</dd></div><div><dt>Recomendación</dt><dd>{item.recommendation}</dd></div></dl>{item.block && <small className="ai-block-ref">Bloque: {CANVAS_BLOCK_LABELS[item.block]}</small>}</article>)}</div></section>
      {response.proposals.length > 0 && <section className="panel ai-proposals-panel"><div className="panel-heading"><div><h2>Propuesta TO BE</h2><p>Revisa los cambios antes de incorporarlos a una nueva versión editable.</p></div><span className="ai-decision-note">IA propone · usuario decide</span></div><div className="ai-proposals-list">{activeDrafts.map((item) => <AiProposalCard key={item.id} proposal={item} editing={editingCurrentResponse} onChange={updateDraft} />)}</div><div className="ai-decision-actions">{!editingCurrentResponse ? <><button className="primary-button" onClick={accept} disabled={!responseMatchesSelection}>Aceptar propuesta y crear TO BE</button><button className="outline-button" onClick={() => { setDrafts(response.proposals); setDraftResponseKey(response.generatedAt); setEditing(true); }} disabled={!responseMatchesSelection}>Editar antes de aplicar</button><button className="outline-button danger-action" onClick={reject} disabled={!responseMatchesSelection}>Rechazar propuesta</button></> : <><button className="primary-button" onClick={applyEdited} disabled={!responseMatchesSelection}>Guardar cambios y crear TO BE</button><button className="outline-button" onClick={() => setEditing(false)}>Cancelar edición</button><button className="outline-button danger-action" onClick={reject} disabled={!responseMatchesSelection}>Rechazar propuesta</button></>}</div></section>}
      {response.proposals.length === 0 && <section className="panel ai-no-proposals"><strong>Este análisis no contiene una propuesta TO BE aplicable.</strong><span>Usa el botón “Generar propuesta TO BE” cuando quieras explorar una alternativa.</span></section>}
    </>}
  </div>;
}

function AiProposalCard({ proposal, editing, onChange }: { proposal: AiElementProposal; editing: boolean; onChange: (id: string, field: keyof AiElementProposal, value: string | number | string[]) => void }) {
  if (!editing) return <article className="ai-proposal-card"><div className="ai-card-topline"><span className={"ai-type-tag " + proposal.action.toLowerCase()}>{findingLabels[proposal.action]}</span><span>{CANVAS_BLOCK_LABELS[proposal.block]}</span></div><h3>{proposal.title}</h3><p>{proposal.description}</p><div className="ai-proposal-details"><span><b>Hipótesis</b>{proposal.hypothesis || "No definida"}</span><span><b>Evidencia</b>{proposal.evidence || "No definida"}</span><span><b>KPI</b>{proposal.relatedKpi || "Por definir"}</span><span><b>Confianza</b>{proposal.confidence}%</span></div><small className="ai-rationale">{proposal.rationale}</small></article>;
  return <article className="ai-proposal-card editing"><div className="ai-card-topline"><span className={"ai-type-tag " + proposal.action.toLowerCase()}>{findingLabels[proposal.action]}</span><span>{CANVAS_BLOCK_LABELS[proposal.block]}</span></div><label className="field"><span>Título</span><input value={proposal.title} onChange={(event) => onChange(proposal.id, "title", event.target.value)} /></label><label className="field"><span>Descripción</span><textarea rows={2} value={proposal.description} onChange={(event) => onChange(proposal.id, "description", event.target.value)} /></label><div className="form-two"><label className="field"><span>Hipótesis</span><textarea rows={2} value={proposal.hypothesis} onChange={(event) => onChange(proposal.id, "hypothesis", event.target.value)} /></label><label className="field"><span>Evidencia</span><textarea rows={2} value={proposal.evidence} onChange={(event) => onChange(proposal.id, "evidence", event.target.value)} /></label></div><div className="form-two"><label className="field"><span>Responsable</span><input value={proposal.responsible} onChange={(event) => onChange(proposal.id, "responsible", event.target.value)} /></label><label className="field"><span>KPI relacionado</span><input value={proposal.relatedKpi} onChange={(event) => onChange(proposal.id, "relatedKpi", event.target.value)} /></label></div><div className="form-two"><label className="field"><span>Confianza (%)</span><input type="number" min="0" max="100" value={proposal.confidence} onChange={(event) => onChange(proposal.id, "confidence", Number(event.target.value))} /></label><label className="field"><span>Etiquetas</span><input value={proposal.tags.join(", ")} onChange={(event) => onChange(proposal.id, "tags", event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean))} /></label></div><label className="field"><span>Comentarios de revisión</span><textarea rows={2} value={proposal.comments} onChange={(event) => onChange(proposal.id, "comments", event.target.value)} /></label></article>;
}

function AiEmptyState({ title, description, action, onAction }: { title: string; description: string; action?: string; onAction?: () => void }) {
  return <div className="empty-state ai-empty-state"><span>✦</span><h3>{title}</h3><p>{description}</p>{action && onAction && <button className="outline-button" onClick={onAction}>{action}</button>}</div>;
}
