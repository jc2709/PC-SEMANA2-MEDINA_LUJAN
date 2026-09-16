export type AiOperation = "analizarCanvas" | "detectarInconsistencias" | "generarToBe" | "proponerProyectos" | "explicarPrediccion" | "generarRecomendaciones";

export interface AiRequest {
  operation: AiOperation;
  organizationId: string;
  context: Record<string, unknown>;
}

export interface AiResponse {
  mode: "MOCK" | "REAL";
  operation: AiOperation;
  status: "PROPOSAL";
  title: string;
  findings: Array<{ type: "HECHO" | "HIPOTESIS" | "RECOMENDACION" | "INFERENCIA"; text: string; confidence: "BAJA" | "MEDIA" | "ALTA" }>;
  generatedAt: string;
}

export function mockResponse(operation: AiOperation): AiResponse {
  return {
    mode: "MOCK",
    operation,
    status: "PROPOSAL",
    title: "Modo demostración / MOCK",
    findings: [{ type: "RECOMENDACION", text: "La Fase 1 ya tiene el servicio desacoplado. Agrega información del Canvas en la Fase 2 para obtener un análisis contextual.", confidence: "MEDIA" }],
    generatedAt: new Date().toISOString(),
  };
}

async function callAi(request: AiRequest): Promise<AiResponse> {
  try {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(7000),
    });
    if (!response.ok) return mockResponse(request.operation);
    const data: unknown = await response.json();
    if (!data || typeof data !== "object" || !("mode" in data)) return mockResponse(request.operation);
    return data as AiResponse;
  } catch {
    return mockResponse(request.operation);
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
