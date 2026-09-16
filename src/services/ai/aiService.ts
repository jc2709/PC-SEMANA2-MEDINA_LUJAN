import { createMockResponse, normalizeAiResponse, type AiRequest, type AiResponse } from "./aiModel";

export type { AiConfidence, AiDecision, AiElementProposal, AiFinding, AiFindingType, AiOperation, AiProposalAction, AiRequest, AiResponse } from "./aiModel";
export { createMockResponse as mockResponse, normalizeAiResponse } from "./aiModel";

async function callAi(request: AiRequest): Promise<AiResponse> {
  try {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(12000),
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
