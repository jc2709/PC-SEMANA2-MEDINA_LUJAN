import * as XLSX from "xlsx";
import type { DataQuality, ImportError, Period } from "../../types/domain";

export interface ImportedObservationDraft {
  periodCode: string;
  kpi: string;
  value: number;
  unit: string;
  source: string;
  quality: DataQuality;
  observedAt: string;
}

export interface ImportPreviewRow {
  sourceRow: number;
  raw: Record<string, unknown>;
  draft?: ImportedObservationDraft;
  errors: ImportError[];
}

export interface ImportPreview {
  fileName: string;
  headers: string[];
  rows: ImportPreviewRow[];
  detected: Record<string, string | null>;
}

const aliases: Record<string, string[]> = {
  kpi: ["kpi", "indicador", "metric", "métrica", "nombre kpi", "nombre"],
  period: ["periodo", "period", "mes", "codigo periodo", "código periodo", "fecha periodo"],
  value: ["valor", "value", "resultado", "medición", "medicion"],
  unit: ["unidad", "unit", "unidad de medida"],
  source: ["fuente", "source", "origen"],
  quality: ["calidad", "quality", "calidad de datos"],
  observedAt: ["fecha", "date", "fecha observacion", "fecha observación", "observado en"],
};

function normalize(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function columnFor(headers: string[], field: string) {
  const normalizedHeaders = headers.map(normalize);
  return aliases[field].reduce<string | null>((found, alias) => {
    if (found) return found;
    const index = normalizedHeaders.indexOf(normalize(alias));
    return index >= 0 ? headers[index] : null;
  }, null);
}

function parseNumber(value: unknown) {
  const source = String(value ?? "").trim().replace(/\s/g, "");
  if (!source) return null;
  const normalized = source.includes(",") && source.includes(".")
    ? source.replace(/\./g, "").replace(",", ".")
    : source.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  const source = String(value ?? "").trim();
  if (!source) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(source)) return source;
  const slashMatch = source.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (slashMatch) return `${slashMatch[3]}-${slashMatch[2].padStart(2, "0")}-${slashMatch[1].padStart(2, "0")}`;
  const parsed = new Date(source);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function qualityFrom(value: unknown): DataQuality {
  const candidate = normalize(value).toUpperCase();
  if (candidate === "ALTA" || candidate === "HIGH") return "ALTA";
  if (candidate === "BAJA" || candidate === "LOW") return "BAJA";
  return "MEDIA";
}

function periodCode(value: unknown, periods: Period[]) {
  const dateCandidate = value instanceof Date && !Number.isNaN(value.getTime())
    ? `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}`
    : String(value ?? "");
  const candidate = normalize(dateCandidate);
  const matchingPeriod = periods.find((period) => normalize(period.code) === candidate || normalize(period.label) === candidate);
  return matchingPeriod?.code ?? dateCandidate.trim();
}

export async function parseDataFile(file: File, periods: Period[]): Promise<ImportPreview> {
  const fileBuffer = await file.arrayBuffer();
  const isCsv = /\.csv$/i.test(file.name) || file.type.toLowerCase().includes("csv");
  const workbook = isCsv
    ? XLSX.read(new TextDecoder("utf-8").decode(fileBuffer), { type: "string", cellDates: true })
    : XLSX.read(fileBuffer, { type: "array", cellDates: true });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!firstSheet) throw new Error("El archivo no contiene una hoja de datos.");

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const detected = Object.fromEntries(Object.keys(aliases).map((field) => [field, columnFor(headers, field)]));
  const previewRows = rows.map((raw, index) => {
    const errors: ImportError[] = [];
    const valueFor = (field: string) => detected[field] ? raw[detected[field] as string] : "";
    const kpi = String(valueFor("kpi") ?? "").trim();
    const source = String(valueFor("source") ?? "").trim();
    const unit = String(valueFor("unit") ?? "").trim();
    const period = periodCode(valueFor("period"), periods);
    const value = parseNumber(valueFor("value"));
    const observedAt = parseDate(valueFor("observedAt"));

    if (!detected.kpi) errors.push({ row: index + 2, field: "KPI", message: "No se detectó la columna KPI." });
    else if (!kpi) errors.push({ row: index + 2, field: "KPI", message: "El KPI es obligatorio." });
    if (!detected.period) errors.push({ row: index + 2, field: "Periodo", message: "No se detectó la columna Periodo." });
    else if (!periods.some((item) => item.code === period)) errors.push({ row: index + 2, field: "Periodo", message: "El periodo no existe para la organización activa.", value: period });
    if (!detected.value) errors.push({ row: index + 2, field: "Valor", message: "No se detectó la columna Valor." });
    else if (value === null) errors.push({ row: index + 2, field: "Valor", message: "El valor debe ser numérico.", value: String(valueFor("value")) });
    if (!unit) errors.push({ row: index + 2, field: "Unidad", message: "La unidad es obligatoria." });
    if (!source) errors.push({ row: index + 2, field: "Fuente", message: "La fuente es obligatoria." });
    if (!observedAt) errors.push({ row: index + 2, field: "Fecha", message: "La fecha debe ser válida." });

    return {
      sourceRow: index + 2,
      raw,
      errors,
      ...(errors.length === 0 && value !== null ? { draft: { periodCode: period, kpi, value, unit, source, quality: qualityFrom(valueFor("quality")), observedAt } } : {}),
    };
  });

  return { fileName: file.name, headers, rows: previewRows, detected };
}

export function previewStats(preview: ImportPreview) {
  const validRows = preview.rows.filter((row) => row.errors.length === 0).length;
  return { processedRows: preview.rows.length, validRows, invalidRows: preview.rows.length - validRows };
}
