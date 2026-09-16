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
  assert.match(route, /MOCK/);
  assert.doesNotMatch(envExample, /GEMINI_API_KEY=\S+/);
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
