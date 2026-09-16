import { createMockResponse, normalizeAiResponse, type AiRequest, type AiResponse } from "./aiModel";

export type { AiConfidence, AiDecision, AiElementProposal, AiFinding, AiFindingType, AiOperation, AiProposalAction, AiRequest, AiResponse } from "./aiModel";
export { createMockResponse as mockResponse, normalizeAiResponse } from "./aiModel";

// Public URL only: the Gemini credential remains exclusively in the Vercel
// server function. This also prevents file:// from becoming file:///api/ai.
export const DEFAULT_AI_API_BASE_URL = "https://canvas-model-ia-medina-lujan.vercel.app";
const AI_REQUEST_TIMEOUT_MS = 65000;

type CanvasRuntime = { apiBaseUrl?: string };

function normalizeBaseUrl(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return DEFAULT_AI_API_BASE_URL;
  }
}

function getAiApiBaseUrl() {
  if (typeof window === "undefined") return DEFAULT_AI_API_BASE_URL;

  const runtime = (window as Window & { canvasModelIA?: CanvasRuntime }).canvasModelIA;
  if (runtime?.apiBaseUrl) return normalizeBaseUrl(runtime.apiBaseUrl);

  const currentOrigin = window.location.origin;
  const currentHost = window.location.hostname;
  const isLocalDevelopment = currentHost === "localhost" || currentHost === "127.0.0.1";
  const isVercelDeployment = currentHost.endsWith(".vercel.app");
  if (window.location.protocol !== "file:" && (isLocalDevelopment || isVercelDeployment)) {
    return normalizeBaseUrl(currentOrigin);
  }

  return DEFAULT_AI_API_BASE_URL;
}

export function getAiApiUrl() {
  return new URL("/api/ai", getAiApiBaseUrl()).toString();
}

async function callAi(request: AiRequest): Promise<AiResponse> {
  try {
    const response = await fetch(getAiApiUrl(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
      // No cookies or authorization headers are needed, so this remains
      // compatible with the allowlisted CORS policy from a standalone HTML file.
      credentials: "omit",
      signal: AbortSignal.timeout(AI_REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) return createMockResponse(request.operation, request.context, "respuesta HTTP " + response.status);
    const data: unknown = await response.json();
    return normalizeAiResponse(data, request.operation) ?? createMockResponse(request.operation, request.context, "respuesta no estructurada");
  } catch {
    return createMockResponse(request.operation, request.context, "endpoint no disponible o sin conexión");
  }
}

export const aiService = {
  analizarCanvas: (request: Omit<AiRequest, "operation">) => requestAi({ ...request, operation: "analizarCanvas" }),
  detectarInconsistencias: (request: Omit<AiRequest, "operation">) => requestAi({ ...request, operation: "detectarInconsistencias" }),
  generarToBe: (request: Omit<AiRequest, "operation">) => requestAi({ ...request, operation: "generarToBe" }),
  proponerProyectos: (request: Omit<AiRequest, "operation">) => requestAi({ ...request, operation: "proponerProyectos" }),
  explicarPrediccion: (request: Omit<AiRequest, "operation">) => requestAi({ ...request, operation: "explicarPrediccion" }),
  generarRecomendaciones: (request: Omit<AiRequest, "operation">) => requestAi({ ...request, operation: "generarRecomendaciones" }),
};

function requestAi(request: AiRequest) {
  return callAi(request);
}
