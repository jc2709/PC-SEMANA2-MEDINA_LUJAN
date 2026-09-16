import { NextResponse } from "next/server";

const ALLOWED_OPERATIONS = new Set([
  "analizarCanvas",
  "detectarInconsistencias",
  "generarToBe",
  "proponerProyectos",
  "explicarPrediccion",
  "generarRecomendaciones",
]);

function mockResponse(operation: string, reason = "GEMINI_API_KEY no configurada") {
  return {
    mode: "MOCK",
    operation,
    status: "PROPOSAL",
    title: "Modo demostración / MOCK",
    findings: [{ type: "RECOMENDACION", text: `El servicio de IA está en modo demostración (${reason}). Las funciones locales continúan operativas.`, confidence: "MEDIA" }],
    generatedAt: new Date().toISOString(),
  };
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
  if (typeof payload.operation !== "string" || !ALLOWED_OPERATIONS.has(payload.operation)) return NextResponse.json({ error: "Operación de IA no permitida." }, { status: 400 });
  if (typeof payload.organizationId !== "string" || !payload.organizationId.trim()) return NextResponse.json({ error: "organizationId es obligatorio." }, { status: 400 });
  if (!payload.context || typeof payload.context !== "object" || Array.isArray(payload.context)) return NextResponse.json({ error: "context debe ser un objeto." }, { status: 400 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json(mockResponse(payload.operation), { headers: { "x-ai-mode": "mock" } });

  const logicalPrompt = [
    "Actúa como asistente de análisis de Business Model Canvas.",
    "Usa exclusivamente el contexto JSON suministrado por el usuario; no uses buscadores ni inventes hechos.",
    "Separa HECHO, HIPOTESIS, RECOMENDACION e INFERENCIA.",
    "Devuelve únicamente JSON con title y findings[]. Cada finding debe tener type, text y confidence.",
    `Operacion: ${payload.operation}`,
    `Contexto: ${JSON.stringify(payload.context)}`,
  ].join("\n");

  try {
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: logicalPrompt }] }] }),
    });
    if (!geminiResponse.ok) return NextResponse.json(mockResponse(payload.operation, "Servicio de IA no disponible"), { headers: { "x-ai-mode": "mock" } });
    const result: unknown = await geminiResponse.json();
    const candidateText = (((result as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }).candidates?.[0]?.content?.parts ?? []).map((part) => part.text ?? "").join("\n")).trim();
    const parsed = JSON.parse(candidateText) as { title?: unknown; findings?: unknown };
    if (typeof parsed.title !== "string" || !Array.isArray(parsed.findings)) throw new Error("Respuesta de IA no estructurada");
    return NextResponse.json({ mode: "REAL", operation: payload.operation, status: "PROPOSAL", title: parsed.title, findings: parsed.findings, generatedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json(mockResponse(payload.operation, "No fue posible validar la respuesta"), { headers: { "x-ai-mode": "mock" } });
  }
}
