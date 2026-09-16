import { NextResponse } from "next/server";
import { createMockResponse, normalizeAiResponse, type AiOperation } from "../../../src/services/ai/aiModel";

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";
const GEMINI_TIMEOUT_MS = 60000;

const ALLOWED_OPERATIONS = new Set<AiOperation>([
  "analizarCanvas",
  "detectarInconsistencias",
  "generarToBe",
  "proponerProyectos",
  "explicarPrediccion",
  "generarRecomendaciones",
]);

function parseJsonText(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    const fence = String.fromCharCode(96);
    const cleaned = value.replace(new RegExp("^" + fence + "{3}(?:json)?\\s*", "i"), "").replace(new RegExp("\\s*" + fence + "{3}$", "i"), "").trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }
}

function logicalPrompt(operation: AiOperation, context: Record<string, unknown>) {
  return [
    "Actúa como asistente de análisis de Business Model Canvas.",
    "Usa exclusivamente el contexto JSON suministrado por el usuario; no uses buscadores, fuentes externas ni inventes hechos.",
    "Separa HECHO, HIPOTESIS, RECOMENDACION e INFERENCIA.",
    "Toda generación futura debe ser una PROPUESTA y debe indicar la evidencia suministrada y la hipótesis que requiere validación.",
    "No modifiques ni apruebes datos. El usuario revisará, editará o rechazará cada propuesta.",
    "Devuelve únicamente JSON con esta forma: {title:string, summary:string, findings:[{id,type,title,text,reason,evidence,recommendation,confidence,block?}], proposals:[{id,block,action,title,description,hypothesis,evidence,responsible,relatedKpi,confidence,tags,comments,source,rationale,sourceElementId?}]}",
    "En proposals usa action CREAR o MODIFICAR. Para MODIFICAR, sourceElementId debe ser el id exacto de un elemento recibido.",
    "Operacion solicitada: " + operation,
    "Contexto del usuario: " + JSON.stringify(context),
  ].join("\\n");
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload JSON inválido." }, { status: 400 });
  }

  if (!body || typeof body !== "object") return NextResponse.json({ error: "El payload debe ser un objeto." }, { status: 400 });
  const payload = body as { operation?: unknown; organizationId?: unknown; context?: unknown };
  if (typeof payload.operation !== "string" || !ALLOWED_OPERATIONS.has(payload.operation as AiOperation)) return NextResponse.json({ error: "Operación de IA no permitida." }, { status: 400 });
  if (typeof payload.organizationId !== "string" || !payload.organizationId.trim()) return NextResponse.json({ error: "organizationId es obligatorio." }, { status: 400 });
  if (!payload.context || typeof payload.context !== "object" || Array.isArray(payload.context)) return NextResponse.json({ error: "context debe ser un objeto." }, { status: 400 });

  const operation = payload.operation as AiOperation;
  const context = payload.context as Record<string, unknown>;
  const contextJson = JSON.stringify(context);
  if (contextJson.length > 120000) return NextResponse.json({ error: "El contexto IA supera el tamaño permitido." }, { status: 413 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json(createMockResponse(operation, context), { headers: { "x-ai-mode": "mock" } });

  try {
    const geminiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(GEMINI_MODEL) + ":generateContent", {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: logicalPrompt(operation, context) }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2, maxOutputTokens: 1800 },
      }),
      signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
    });
    if (!geminiResponse.ok) return NextResponse.json(createMockResponse(operation, context, "Gemini respondió HTTP " + geminiResponse.status), { headers: { "x-ai-mode": "mock" } });
    const result: unknown = await geminiResponse.json();
    const candidateText = (((result as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }).candidates?.[0]?.content?.parts ?? []).map((part) => part.text ?? "").join("\\n")).trim();
    const parsed = parseJsonText(candidateText);
    const normalized = normalizeAiResponse({ ...(parsed && typeof parsed === "object" ? parsed : {}), mode: "REAL" }, operation);
    if (!normalized) return NextResponse.json(createMockResponse(operation, context, "Gemini devolvió una respuesta no validable"), { headers: { "x-ai-mode": "mock" } });
    return NextResponse.json(normalized);
  } catch {
    return NextResponse.json(createMockResponse(operation, context, "error de conexión o respuesta no validable"), { headers: { "x-ai-mode": "mock" } });
  }
}
