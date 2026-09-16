import { NextResponse } from "next/server";
import { createMockResponse, normalizeAiResponse, type AiOperation } from "../../../src/services/ai/aiModel";

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";
const GEMINI_TIMEOUT_MS = 60000;
const ALLOWED_CORS_ORIGINS = new Set([
  "null", // HTML local and Electron file:// renderer.
  "https://canvas-model-ia-medina-lujan.vercel.app",
  "http://localhost",
  "http://localhost:3000",
  "http://127.0.0.1",
  "http://127.0.0.1:3000",
]);

function corsHeaders(request?: Request) {
  const headers = new Headers({
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  });
  const origin = request?.headers.get("origin");
  if (origin && ALLOWED_CORS_ORIGINS.has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }
  return headers;
}

function jsonResponse(data: unknown, init?: ResponseInit, request?: Request) {
  const response = NextResponse.json(data, init);
  for (const [name, value] of corsHeaders(request).entries()) response.headers.set(name, value);
  return response;
}

const ALLOWED_OPERATIONS = new Set<AiOperation>([
  "analizarCanvas",
  "detectarInconsistencias",
  "generarToBe",
  "proponerProyectos",
  "explicarPrediccion",
  "generarRecomendaciones",
]);

function parseJsonText(value: string): unknown {
  const candidates = [value.trim()];
  const fence = String.fromCharCode(96);
  const cleaned = value.replace(new RegExp("^" + fence + "{3}(?:json)?\\s*", "i"), "").replace(new RegExp("\\s*" + fence + "{3}$", "i"), "").trim();
  if (cleaned && cleaned !== candidates[0]) candidates.push(cleaned);

  const firstObject = value.indexOf("{");
  const lastObject = value.lastIndexOf("}");
  if (firstObject >= 0 && lastObject > firstObject) candidates.push(value.slice(firstObject, lastObject + 1));

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Try the next common model-output wrapper.
    }
  }
  return null;
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

async function requestGemini(apiKey: string, prompt: string) {
  const requestBody = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json", temperature: 0.2, maxOutputTokens: 1800 },
  });
  let response: Response | undefined;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(GEMINI_MODEL) + ":generateContent", {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: requestBody,
      signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
    });
    if (![429, 500, 503].includes(response.status) || attempt === 1) break;
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }

  return response;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Payload JSON inválido." }, { status: 400 }, request);
  }

  if (!body || typeof body !== "object") return jsonResponse({ error: "El payload debe ser un objeto." }, { status: 400 }, request);
  const payload = body as { operation?: unknown; organizationId?: unknown; context?: unknown };
  if (typeof payload.operation !== "string" || !ALLOWED_OPERATIONS.has(payload.operation as AiOperation)) return jsonResponse({ error: "Operación de IA no permitida." }, { status: 400 }, request);
  if (typeof payload.organizationId !== "string" || !payload.organizationId.trim()) return jsonResponse({ error: "organizationId es obligatorio." }, { status: 400 }, request);
  if (!payload.context || typeof payload.context !== "object" || Array.isArray(payload.context)) return jsonResponse({ error: "context debe ser un objeto." }, { status: 400 }, request);

  const operation = payload.operation as AiOperation;
  const context = payload.context as Record<string, unknown>;
  const contextJson = JSON.stringify(context);
  if (contextJson.length > 120000) return jsonResponse({ error: "El contexto IA supera el tamaño permitido." }, { status: 413 }, request);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return jsonResponse(createMockResponse(operation, context), { headers: { "x-ai-mode": "mock" } }, request);

  try {
    const geminiResponse = await requestGemini(apiKey, logicalPrompt(operation, context));
    if (!geminiResponse) return jsonResponse(createMockResponse(operation, context, "Gemini no devolvió respuesta"), { headers: { "x-ai-mode": "mock" } }, request);
    if (!geminiResponse.ok) return jsonResponse(createMockResponse(operation, context, "Gemini respondió HTTP " + geminiResponse.status), { headers: { "x-ai-mode": "mock" } }, request);
    const result: unknown = await geminiResponse.json();
    const candidateText = (((result as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }).candidates?.[0]?.content?.parts ?? []).map((part) => part.text ?? "").join("\\n")).trim();
    const parsed = parseJsonText(candidateText);
    const normalized = normalizeAiResponse({ ...(parsed && typeof parsed === "object" ? parsed : {}), mode: "REAL" }, operation);
    if (!normalized) return jsonResponse(createMockResponse(operation, context, "Gemini devolvió una respuesta no validable"), { headers: { "x-ai-mode": "mock" } }, request);
    return jsonResponse(normalized, undefined, request);
  } catch {
    return jsonResponse(createMockResponse(operation, context, "error de conexión o respuesta no validable"), { headers: { "x-ai-mode": "mock" } }, request);
  }
}

// Handles browser preflight for JSON requests from a file:// or Electron renderer.
export function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}
