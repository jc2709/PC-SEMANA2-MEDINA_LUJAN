import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
test("el estado demo tiene organización, periodos y datos aislados", async () => {
  const { createDemoState } = await import(new URL("../src/data/demoData.ts", import.meta.url).href);
  const state = createDemoState();
  assert.equal(state.organizations.length, 1);
  assert.ok(state.periods.length >= 3);
  assert.ok(state.observations.length >= 9);
  assert.ok(state.observations.every((item) => item.organizationId === state.organizations[0].id));
  assert.ok(state.observations.every((item) => state.periods.some((period) => period.id === item.periodId && period.organizationId === item.organizationId)));
  const september = state.observations.filter((item) => item.periodId === "period-2026-09");
  const october = state.observations.filter((item) => item.periodId === "period-2026-10");
  assert.ok(september.length > 0 && october.length > 0);
  assert.notDeepEqual(september.map((item) => item.id), october.map((item) => item.id));
});

test("el demo de Fase 2 contiene nueve bloques, AS IS, TO BE y escenarios aislados", async () => {
  const { createDemoState } = await import(new URL("../src/data/demoData.ts", import.meta.url).href);
  const state = createDemoState();
  const asIs = state.canvasVersions.find((item) => item.kind === "AS_IS");
  const toBe = state.canvasVersions.find((item) => item.kind === "TO_BE");
  assert.equal(state.schemaVersion, 4);
  assert.equal(state.scenarios.length, 2);
  assert.equal(state.kpiDefinitions.length, 4);
  assert.ok(asIs && toBe);
  assert.equal(new Set(asIs.elements.map((item) => item.block)).size, 9);
  assert.equal(toBe.sourceVersionId, asIs.id);
  assert.ok(toBe.elements.filter((item) => item.title !== "WhatsApp Business").every((item) => item.sourceElementId));
  assert.ok(toBe.elements.some((item) => item.title === "WhatsApp Business"));
});

test("la migración conserva datos y agrega estructuras Canvas y ejecución vacías", async () => {
  const { createDemoState } = await import(new URL("../src/data/demoData.ts", import.meta.url).href);
  const { loadState, STORAGE_KEY } = await import(new URL("../src/services/storage/storage.ts", import.meta.url).href);
  const records = new Map();
  globalThis.window = { localStorage: { getItem: (key) => records.get(key) ?? null, setItem: (key, value) => records.set(key, value), removeItem: (key) => records.delete(key) } };
  const legacy = createDemoState();
  legacy.schemaVersion = 1;
  delete legacy.scenarios;
  delete legacy.canvasVersions;
  delete legacy.projects;
  delete legacy.projectTasks;
  delete legacy.projectMilestones;
  delete legacy.projectTracking;
  delete legacy.kpiDefinitions;
  delete legacy.forecasts;
  delete legacy.simulations;
  records.set(STORAGE_KEY, JSON.stringify(legacy));
  const migrated = loadState(createDemoState());
  assert.equal(migrated.state.schemaVersion, 4);
  assert.equal(migrated.state.organizations[0].name, "Comercial Andina S.A.C.");
  assert.deepEqual(migrated.state.scenarios, []);
  assert.deepEqual(migrated.state.canvasVersions, []);
  assert.deepEqual(migrated.state.projects, []);
  assert.deepEqual(migrated.state.projectTasks, []);
  assert.deepEqual(migrated.state.projectMilestones, []);
  assert.deepEqual(migrated.state.projectTracking, []);
  assert.deepEqual(migrated.state.kpiDefinitions, []);
  assert.deepEqual(migrated.state.forecasts, []);
  assert.deepEqual(migrated.state.simulations, []);
  delete globalThis.window;
});

test("Fase 5 calcula pronósticos reproducibles y marca historial insuficiente", async () => {
  const { createDemoState } = await import(new URL("../src/data/demoData.ts", import.meta.url).href);
  const { buildForecast, buildSimulationResults } = await import(new URL("../src/services/analytics/analyticsService.ts", import.meta.url).href);
  const state = createDemoState();
  const sales = state.kpiDefinitions.find((item) => item.name === "Ventas");
  assert.ok(sales);
  const forecast = buildForecast(sales, state.observations, state.periods[1], "forecast-test", "2026-11-01T00:00:00.000Z");
  assert.equal(forecast.quality, "SUFICIENTE");
  assert.ok(forecast.prediction > 0);
  assert.ok(forecast.lowerBound <= forecast.prediction && forecast.prediction <= forecast.upperBound);
  assert.ok(["NAIVE", "MEDIA_MOVIL", "TENDENCIA_LINEAL", "SUAVIZACION_EXPONENCIAL"].includes(forecast.model));
  const shortHistory = state.observations.filter((item) => item.kpi === "Ventas").slice(-2);
  const insufficient = buildForecast(sales, shortHistory, state.periods[1], "forecast-short", "2026-11-01T00:00:00.000Z");
  assert.equal(insufficient.quality, "INSUFICIENTE");
  assert.match(insufficient.explanation, /HISTORIAL INSUFICIENTE/);
  const results = buildSimulationResults([sales], state.observations, [forecast], { marketing: 10, conversion: 8, price: 2, costs: 4, projectDelay: 0, capacity: 5 });
  assert.equal(results.length, 1);
  assert.notEqual(results[0].scenarioValue, results[0].baseValue);
});

test("la persistencia guarda respaldo y recupera si el snapshot principal se corrompe", async () => {
  const { createDemoState } = await import(new URL("../src/data/demoData.ts", import.meta.url).href);
  const { loadState, saveState, STORAGE_KEY, STORAGE_BACKUP_KEY } = await import(new URL("../src/services/storage/storage.ts", import.meta.url).href);
  const records = new Map();
  globalThis.window = { localStorage: { getItem: (key) => records.get(key) ?? null, setItem: (key, value) => records.set(key, value), removeItem: (key) => records.delete(key) } };
  const state = createDemoState();
  state.observations = [{ ...state.observations[0], kpi: "Dato persistente" }, ...state.observations.slice(1)];
  assert.equal(saveState(state), true);
  assert.ok(records.has(STORAGE_KEY) && records.has(STORAGE_BACKUP_KEY));
  records.set(STORAGE_KEY, "{snapshot incompleto");
  const restored = loadState(createDemoState());
  assert.equal(restored.persisted, true);
  assert.equal(restored.state.observations[0].kpi, "Dato persistente");
  delete globalThis.window;
});

test("la importación CSV valida filas y reconoce columnas del dataset", async () => {
  const { parseDataFile, previewStats } = await import(new URL("../src/services/import/importService.ts", import.meta.url).href);
  const file = new File([
    "KPI,Periodo,Valor,Unidad,Fuente,Calidad,Fecha\nVentas,2026-09,70400,PEN,ERP,ALTA,2026-09-30\nClientes activos,2026-09,no-num,clientes,CRM,ALTA,2026-09-30",
  ], "datos.csv", { type: "text/csv" });
  const preview = await parseDataFile(file, [{ id: "p", organizationId: "o", code: "2026-09", label: "Septiembre 2026", startsOn: "2026-09-01", endsOn: "2026-09-30" }]);
  assert.deepEqual(previewStats(preview), { processedRows: 2, validRows: 1, invalidRows: 1 });
  assert.equal(preview.rows[0].draft.kpi, "Ventas");
  assert.equal(preview.rows[0].raw.KPI, "Ventas");
  assert.match(preview.rows[1].errors[0].message, /numérico/);
});

test("la importación CSV conserva caracteres UTF-8", async () => {
  const { parseDataFile } = await import(new URL("../src/services/import/importService.ts", import.meta.url).href);
  const file = new File(["KPI,Periodo,Valor,Unidad,Fuente,Calidad,Fecha\nConversión,2026-09,4.1,%,Embudo,MEDIA,2026-09-30"], "utf8.csv", { type: "text/csv" });
  const preview = await parseDataFile(file, [{ id: "p", organizationId: "o", code: "2026-09", label: "Septiembre 2026", startsOn: "2026-09-01", endsOn: "2026-09-30" }]);
  assert.equal(preview.rows[0].draft.kpi, "Conversión");
});

test("la IA está desacoplada y el endpoint no expone secretos al cliente", async () => {
  const aiService = await readFile(new URL("../src/services/ai/aiService.ts", import.meta.url), "utf8");
  const route = await readFile(new URL("../app/api/ai/route.ts", import.meta.url), "utf8");
  const envExample = await readFile(new URL("../.env.example", import.meta.url), "utf8");
  assert.match(aiService, /\/api\/ai/);
  assert.match(route, /process\.env\.GEMINI_API_KEY/);
  assert.match(route, /createMockResponse/);
  assert.doesNotMatch(envExample, /GEMINI_API_KEY=\S+/);
});

test("Fase 3 genera análisis MOCK contextual y propuestas TO BE trazables", async () => {
  const { createDemoState } = await import(new URL("../src/data/demoData.ts", import.meta.url).href);
  const { createMockResponse, buildToBeFromAi } = await import(new URL("../src/services/ai/aiModel.ts", import.meta.url).href);
  const state = createDemoState();
  const asIs = state.canvasVersions.find((item) => item.kind === "AS_IS");
  assert.ok(asIs);
  const context = { organization: state.organizations[0], period: state.periods[1], canvas: asIs, observations: state.observations.filter((item) => item.periodId === state.periods[1].id) };
  const analysis = createMockResponse("analizarCanvas", context);
  assert.equal(analysis.mode, "MOCK");
  assert.equal(analysis.status, "PROPOSAL");
  assert.ok(analysis.findings.some((item) => item.type === "HECHO"));
  const proposalResponse = createMockResponse("generarToBe", context);
  assert.ok(proposalResponse.proposals.length >= 1);
  assert.ok(proposalResponse.proposals.some((item) => item.action === "MODIFICAR" && item.sourceElementId));
  const toBe = buildToBeFromAi(asIs, proposalResponse.proposals, 2, "TO BE propuesto por IA", "2026-11-01T10:00:00.000Z", (prefix) => prefix + "-test");
  assert.equal(toBe.kind, "TO_BE");
  assert.equal(toBe.status, "BORRADOR");
  assert.equal(toBe.sourceVersionId, asIs.id);
  assert.equal(asIs.elements.find((item) => item.block === "channels")?.title, "Venta presencial");
  assert.ok(toBe.elements.some((item) => item.title.includes("catálogo digital")));
});

test("Fase 3 normaliza respuestas estructuradas y descarta propuestas inválidas", async () => {
  const { normalizeAiResponse } = await import(new URL("../src/services/ai/aiModel.ts", import.meta.url).href);
  const response = normalizeAiResponse({
    mode: "REAL",
    title: "Diagnóstico validado",
    summary: "Resumen de prueba",
    findings: [{ type: "HECHO", title: "Cobertura", text: "Hay información", confidence: "ALTA" }],
    proposals: [
      { id: "valid", block: "channels", action: "CREAR", title: "Canal digital", description: "Propuesta revisable", confidence: 60, tags: [] },
      { id: "invalid", block: "no-existe", action: "CREAR", title: "No aplicar", description: "Debe descartarse" },
    ],
  }, "generarToBe");
  assert.equal(response?.mode, "REAL");
  assert.equal(response?.operation, "generarToBe");
  assert.equal(response?.findings.length, 1);
  assert.equal(response?.proposals.length, 1);
  assert.equal(response?.proposals[0].block, "channels");
});

test("Fase 4 contiene proyectos, tareas, hitos y seguimiento trazables", async () => {
  const { createDemoState } = await import(new URL("../src/data/demoData.ts", import.meta.url).href);
  const state = createDemoState();
  assert.ok(state.projects.length >= 2);
  assert.ok(state.projects.every((project) => project.organizationId === state.organizations[0].id && state.periods.some((period) => period.id === project.periodId && period.organizationId === project.organizationId)));
  assert.ok(state.projects.every((project) => project.sourceCanvasVersionId && state.canvasVersions.some((version) => version.id === project.sourceCanvasVersionId && version.kind === "TO_BE")));
  assert.ok(state.projectTasks.length >= 4);
  assert.ok(state.projectTasks.every((task) => state.projects.some((project) => project.id === task.projectId)));
  assert.ok(state.projectMilestones.every((milestone) => state.projects.some((project) => project.id === milestone.projectId)));
  assert.ok(state.projectTracking.every((entry) => state.projects.some((project) => project.id === entry.projectId)));
  assert.ok(state.projectTracking.some((entry) => entry.actualProgress < entry.plannedProgress));
  assert.ok(state.projectTasks.some((task) => task.dependencyTaskId && state.projectTasks.some((dependency) => dependency.id === task.dependencyTaskId)));
});

test("Fase 4 mantiene aislamiento entre proyectos y permite comparar avance y costos", async () => {
  const { createDemoState } = await import(new URL("../src/data/demoData.ts", import.meta.url).href);
  const state = createDemoState();
  const [first, second] = state.projects;
  const firstTasks = state.projectTasks.filter((task) => task.projectId === first.id);
  const secondTasks = state.projectTasks.filter((task) => task.projectId === second.id);
  assert.ok(firstTasks.length > 0 && secondTasks.length > 0);
  assert.equal(new Set(firstTasks.map((task) => task.id)).size, firstTasks.length);
  assert.equal(new Set(secondTasks.map((task) => task.id)).size, secondTasks.length);
  assert.ok(firstTasks.every((task) => task.projectId !== second.id));
  const tracking = state.projectTracking.find((entry) => entry.projectId === first.id);
  assert.ok(tracking);
  assert.equal(typeof tracking.plannedCost, "number");
  assert.equal(typeof tracking.actualCost, "number");
  assert.equal(first.progress, tracking.actualProgress);
});

test("los formularios principales incluyen carga rápida de caso demo", async () => {
  const app = await readFile(new URL("../src/CanvasModelApp.tsx", import.meta.url), "utf8");
  const canvas = await readFile(new URL("../src/modules/canvas/CanvasModule.tsx", import.meta.url), "utf8");
  const execution = await readFile(new URL("../src/modules/execution/ExecutionModule.tsx", import.meta.url), "utf8");
  const demoButton = await readFile(new URL("../src/components/DemoFillButton.tsx", import.meta.url), "utf8");
  assert.match(demoButton, /Cargar caso demo/);
  assert.match(app, /<DemoFillButton/);
  assert.match(canvas, /<DemoFillButton/);
  assert.match(execution, /<DemoFillButton/);
});

test("el build servido contiene la identidad de Canvas Model IA", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Canvas Model IA/i);
  assert.doesNotMatch(html, /Almacén Nexo/i);
});
