import type { CanvasBlockKey, CanvasElement, CanvasVersion } from "../../types/domain";

export type AiOperation = "analizarCanvas" | "detectarInconsistencias" | "generarToBe" | "proponerProyectos" | "explicarPrediccion" | "generarRecomendaciones";
export type AiFindingType = "HECHO" | "HIPOTESIS" | "RECOMENDACION" | "INFERENCIA";
export type AiConfidence = "BAJA" | "MEDIA" | "ALTA";
export type AiProposalAction = "CREAR" | "MODIFICAR";
export type AiDecision = "PENDIENTE" | "ACEPTADA" | "EDITADA" | "RECHAZADA";

export interface AiFinding {
  id: string;
  type: AiFindingType;
  title: string;
  text: string;
  reason: string;
  evidence: string;
  recommendation: string;
  confidence: AiConfidence;
  block?: CanvasBlockKey;
}

export interface AiElementProposal {
  id: string;
  block: CanvasBlockKey;
  action: AiProposalAction;
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
  rationale: string;
  sourceElementId?: string;
}

export interface AiResponse {
  mode: "MOCK" | "REAL";
  operation: AiOperation;
  status: "PROPOSAL";
  title: string;
  summary: string;
  findings: AiFinding[];
  proposals: AiElementProposal[];
  generatedAt: string;
  warning?: string;
  sourceVersionId?: string;
}

export interface AiRequest {
  operation: AiOperation;
  organizationId: string;
  context: Record<string, unknown>;
}

export const CANVAS_BLOCK_LABELS: Record<CanvasBlockKey, string> = {
  "customer-segments": "Segmentos de clientes",
  "value-propositions": "Propuesta de valor",
  channels: "Canales",
  "customer-relationships": "Relaciones con clientes",
  "revenue-streams": "Fuentes de ingresos",
  "key-resources": "Recursos clave",
  "key-activities": "Actividades clave",
  "key-partners": "Socios clave",
  "cost-structure": "Estructura de costos",
};

const CANVAS_BLOCK_KEYS = Object.keys(CANVAS_BLOCK_LABELS) as CanvasBlockKey[];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown, fallback = "", maxLength = 1200) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : fallback;
}

function validBlock(value: unknown): value is CanvasBlockKey {
  return typeof value === "string" && CANVAS_BLOCK_KEYS.includes(value as CanvasBlockKey);
}

function validElement(value: unknown): value is CanvasElement {
  return isRecord(value) && validBlock(value.block) && typeof value.id === "string" && typeof value.title === "string" && typeof value.description === "string";
}

function canvasContext(value: unknown) {
  if (!isRecord(value)) return { elements: [] as CanvasElement[], name: "Canvas AS IS" };
  const elements = Array.isArray(value.elements) ? value.elements.filter(validElement) : [];
  return { elements, name: text(value.name, "Canvas AS IS") };
}

function observationsContext(value: unknown) {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function finding(id: string, type: AiFindingType, title: string, message: string, reason: string, evidence: string, recommendation: string, confidence: AiConfidence, block?: CanvasBlockKey): AiFinding {
  return { id, type, title, text: message, reason, evidence, recommendation, confidence, ...(block ? { block } : {}) };
}

function analyzeMockFindings(context: Record<string, unknown>): AiFinding[] {
  const canvas = canvasContext(context.canvas);
  const observations = observationsContext(context.observations);
  const blocksPresent = new Set(canvas.elements.map((item) => item.block));
  const findings: AiFinding[] = [finding(
    "finding-coverage",
    "HECHO",
    "Cobertura del Canvas",
    "El " + canvas.name + " contiene " + canvas.elements.length + " elemento" + (canvas.elements.length === 1 ? "" : "s") + " en " + blocksPresent.size + " de 9 bloques.",
    "La cobertura se calculó únicamente con los elementos recibidos en el contexto.",
    blocksPresent.size + "/9 bloques contienen información registrada.",
    blocksPresent.size === 9 ? "Completar la evidencia y los KPI de cada bloque." : "Completar primero los bloques sin elementos.",
    "ALTA",
  )];

  const missingBlock = CANVAS_BLOCK_KEYS.find((block) => !blocksPresent.has(block));
  if (missingBlock) findings.push(finding(
    "finding-missing-block",
    "RECOMENDACION",
    "Bloque incompleto: " + CANVAS_BLOCK_LABELS[missingBlock],
    "No se encontraron elementos registrados en " + CANVAS_BLOCK_LABELS[missingBlock] + ".",
    "Un bloque vacío limita la trazabilidad del modelo actual.",
    "El conjunto recibido no contiene elementos con block=" + missingBlock + ".",
    "Registrar al menos una hipótesis o hecho operativo y su fuente.",
    "ALTA",
    missingBlock,
  ));

  const withoutKpi = canvas.elements.find((item) => !item.relatedKpi.trim());
  if (withoutKpi) findings.push(finding(
    "finding-missing-kpi",
    "RECOMENDACION",
    "KPI pendiente de relación",
    "El elemento “" + withoutKpi.title + "” no tiene un KPI relacionado registrado.",
    "Sin un indicador asociado no es posible medir el efecto de una evolución del Canvas.",
    "Elemento del bloque " + CANVAS_BLOCK_LABELS[withoutKpi.block] + " sin relatedKpi.",
    "Relacionar el elemento con un KPI existente o documentar por qué todavía no aplica.",
    "MEDIA",
    withoutKpi.block,
  ));

  const withoutHypothesis = canvas.elements.find((item) => !item.hypothesis.trim());
  if (withoutHypothesis) findings.push(finding(
    "finding-missing-hypothesis",
    "HIPOTESIS",
    "Hipótesis no documentada",
    "El elemento “" + withoutHypothesis.title + "” no tiene una hipótesis explícita.",
    "La ausencia de hipótesis impide distinguir un hecho validado de una suposición de trabajo.",
    "El campo hypothesis del elemento " + withoutHypothesis.id + " está vacío.",
    "Registrar qué se espera que ocurra y cómo se validará.",
    "MEDIA",
    withoutHypothesis.block,
  ));

  if (observations.length === 0) findings.push(finding(
    "finding-no-observations",
    "INFERENCIA",
    "Contexto cuantitativo limitado",
    "No se recibieron observaciones históricas para complementar el análisis.",
    "Los hallazgos se basan solo en el contenido del Canvas.",
    "observations[] está vacío o no fue enviado.",
    "Agregar datos históricos antes de evaluar impacto cuantitativo.",
    "ALTA",
  ));
  else findings.push(finding(
    "finding-observations",
    "HECHO",
    "Datos históricos disponibles",
    "El contexto incluye " + observations.length + " observación" + (observations.length === 1 ? "" : "es") + " histórica" + (observations.length === 1 ? "" : "s") + ".",
    "La IA puede usar estos registros como evidencia suministrada por el usuario.",
    "Se recibieron " + observations.length + " filas en observations[].",
    "Vincular los KPI relevantes con los elementos del Canvas.",
    "MEDIA",
  ));
  return findings;
}

function generateMockProposals(context: Record<string, unknown>): AiElementProposal[] {
  const canvas = canvasContext(context.canvas);
  const channel = canvas.elements.find((item) => item.block === "channels");
  const activity = canvas.elements.find((item) => item.block === "key-activities");
  const source = "Propuesta IA / MOCK";
  const proposals: AiElementProposal[] = [];

  if (channel) proposals.push({
    id: "proposal-digital-channel",
    block: "channels",
    action: "MODIFICAR",
    title: channel.title + " + catálogo digital",
    description: "Complementar " + channel.title.toLowerCase() + " con un catálogo digital y seguimiento por WhatsApp.",
    hypothesis: "Hipótesis: un canal digital puede facilitar la recompra y mejorar la conversión.",
    evidence: "Se basa en el elemento AS IS “" + channel.title + "”; el impacto debe validarse con datos posteriores.",
    responsible: channel.responsible || "Equipo comercial",
    relatedKpi: "Conversión",
    confidence: 55,
    tags: ["hipótesis", "piloto"],
    comments: "Revisar alcance, responsable y KPI antes de aprobar.",
    source,
    rationale: "Evolución propuesta a partir del canal actual registrado.",
    sourceElementId: channel.id,
  });
  else proposals.push({
    id: "proposal-channel",
    block: "channels",
    action: "CREAR",
    title: "Canal digital piloto",
    description: "Probar un canal digital para facilitar pedidos y seguimiento.",
    hypothesis: "Hipótesis: un canal digital puede reducir fricción en la reposición.",
    evidence: "No existe un canal registrado en el Canvas AS IS; esta propuesta requiere validación.",
    responsible: "Por definir",
    relatedKpi: "Conversión",
    confidence: 35,
    tags: ["hipótesis", "piloto"],
    comments: "Propuesta no factual; requiere validación del usuario.",
    source,
    rationale: "Se propone cubrir el bloque de canales vacío.",
  });

  if (activity) proposals.push({
    id: "proposal-follow-up",
    block: "key-activities",
    action: "MODIFICAR",
    title: activity.title + " con seguimiento digital",
    description: "Incorporar seguimiento digital de pedidos y recompra a " + activity.title.toLowerCase() + ".",
    hypothesis: "Hipótesis: un seguimiento estructurado permite detectar oportunidades de recompra.",
    evidence: "Se basa en la actividad AS IS “" + activity.title + "”; no representa un resultado observado.",
    responsible: activity.responsible || "Equipo comercial",
    relatedKpi: activity.relatedKpi || "Conversión",
    confidence: 45,
    tags: ["hipótesis", "seguimiento"],
    comments: "Validar disponibilidad operativa antes de aprobar.",
    source,
    rationale: "Conecta la actividad existente con la propuesta de canal digital.",
    sourceElementId: activity.id,
  });
  return proposals;
}

export function createMockResponse(operation: AiOperation, context: Record<string, unknown> = {}, reason = "GEMINI_API_KEY no configurada"): AiResponse {
  const isToBe = operation === "generarToBe";
  return {
    mode: "MOCK",
    operation,
    status: "PROPOSAL",
    title: isToBe ? "Propuesta TO BE · modo demostración / MOCK" : "Análisis AS IS · modo demostración / MOCK",
    summary: isToBe
      ? "La IA preparó alternativas hipotéticas a partir del Canvas y los datos suministrados. Revisa cada campo antes de aplicarlas."
      : "El análisis identifica hechos, hipótesis y recomendaciones usando exclusivamente el contexto local suministrado.",
    findings: analyzeMockFindings(context),
    proposals: isToBe ? generateMockProposals(context) : [],
    generatedAt: new Date().toISOString(),
    warning: "Servicio de IA no disponible. Las funciones locales continúan operativas. (" + reason + ")",
  };
}

function normalizeFinding(value: unknown, index: number): AiFinding | null {
  if (!isRecord(value)) return null;
  const findingText = text(value.text) || text(value.message);
  if (!findingText) return null;
  const type = ["HECHO", "HIPOTESIS", "RECOMENDACION", "INFERENCIA"].includes(String(value.type)) ? value.type as AiFindingType : "INFERENCIA";
  const confidence = ["BAJA", "MEDIA", "ALTA"].includes(String(value.confidence)) ? value.confidence as AiConfidence : "MEDIA";
  return {
    id: text(value.id, "finding-" + (index + 1), 80),
    type,
    title: text(value.title, "Hallazgo IA", 160),
    text: findingText,
    reason: text(value.reason, "La respuesta fue generada a partir del contexto suministrado."),
    evidence: text(value.evidence, "Evidencia disponible en el contexto local."),
    recommendation: text(value.recommendation, "Revisar el hallazgo antes de tomar una decisión."),
    confidence,
    ...(validBlock(value.block) ? { block: value.block } : {}),
  };
}

function normalizeProposal(value: unknown, index: number): AiElementProposal | null {
  if (!isRecord(value) || !validBlock(value.block)) return null;
  const title = text(value.title, "");
  const description = text(value.description, "");
  if (!title || !description) return null;
  const action = value.action === "MODIFICAR" ? "MODIFICAR" : value.action === "CREAR" ? "CREAR" : null;
  if (!action) return null;
  const confidence = typeof value.confidence === "number" && Number.isFinite(value.confidence) ? Math.min(100, Math.max(0, value.confidence)) : 40;
  const tags = Array.isArray(value.tags) ? value.tags.filter((tag): tag is string => typeof tag === "string").map((tag) => tag.trim()).filter(Boolean).slice(0, 12) : [];
  return {
    id: text(value.id, "proposal-" + (index + 1), 80),
    block: value.block,
    action,
    title,
    description,
    hypothesis: text(value.hypothesis),
    evidence: text(value.evidence),
    responsible: text(value.responsible, "Por definir", 160),
    relatedKpi: text(value.relatedKpi, "", 160),
    confidence,
    tags,
    comments: text(value.comments),
    source: text(value.source, "Propuesta IA; requiere validación.", 240),
    rationale: text(value.rationale, "Revisar la relación con el Canvas AS IS."),
    ...(typeof value.sourceElementId === "string" && value.sourceElementId.trim() ? { sourceElementId: value.sourceElementId.trim() } : {}),
  };
}

export function normalizeAiResponse(value: unknown, operation: AiOperation): AiResponse | null {
  if (!isRecord(value)) return null;
  const findings = Array.isArray(value.findings) ? value.findings.map(normalizeFinding).filter((item): item is AiFinding => Boolean(item)) : [];
  const proposals = Array.isArray(value.proposals) ? value.proposals.map(normalizeProposal).filter((item): item is AiElementProposal => Boolean(item)) : [];
  if (!Array.isArray(value.findings) || !Array.isArray(value.proposals)) return null;
  return {
    mode: value.mode === "REAL" ? "REAL" : "MOCK",
    operation,
    status: "PROPOSAL",
    title: text(value.title, "Respuesta IA", 180),
    summary: text(value.summary, "Respuesta estructurada pendiente de revisión."),
    findings,
    proposals,
    generatedAt: text(value.generatedAt, new Date().toISOString(), 60),
    ...(text(value.warning) ? { warning: text(value.warning) } : {}),
  };
}

export function buildToBeFromAi(source: CanvasVersion, proposals: AiElementProposal[], version: number, name: string, now: string, makeId: (prefix: string) => string): CanvasVersion {
  const clonedElements = source.elements.map((element) => ({
    ...element,
    id: makeId("element"),
    sourceElementId: element.sourceElementId ?? element.id,
    createdAt: now,
    updatedAt: now,
    tags: [...element.tags],
  }));
  const clonedBySourceId = new Map(source.elements.map((element, index) => [element.id, clonedElements[index]]));

  for (const proposal of proposals) {
    if (proposal.action === "MODIFICAR") {
      const target = proposal.sourceElementId ? clonedBySourceId.get(proposal.sourceElementId) : undefined;
      if (!target) continue;
      Object.assign(target, {
        block: proposal.block,
        title: proposal.title,
        description: proposal.description,
        hypothesis: proposal.hypothesis,
        evidence: proposal.evidence,
        responsible: proposal.responsible,
        relatedKpi: proposal.relatedKpi,
        confidence: proposal.confidence,
        tags: [...proposal.tags],
        comments: proposal.comments,
        source: proposal.source,
        updatedAt: now,
      });
      continue;
    }
    clonedElements.push({
      id: makeId("element"),
      block: proposal.block,
      title: proposal.title,
      description: proposal.description,
      hypothesis: proposal.hypothesis,
      evidence: proposal.evidence,
      responsible: proposal.responsible,
      relatedKpi: proposal.relatedKpi,
      confidence: proposal.confidence,
      tags: [...proposal.tags],
      comments: proposal.comments,
      source: proposal.source,
      createdAt: now,
      updatedAt: now,
    });
  }

  return {
    id: makeId("canvas"),
    organizationId: source.organizationId,
    periodId: source.periodId,
    scenarioId: null,
    kind: "TO_BE",
    version,
    name,
    status: "BORRADOR",
    sourceVersionId: source.id,
    elements: clonedElements,
    createdAt: now,
    updatedAt: now,
  };
}
