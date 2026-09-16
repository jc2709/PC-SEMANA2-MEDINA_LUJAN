import * as XLSX from "xlsx";
import type { CanvasVersion, HistoricalObservation, KpiDefinition, KpiForecast, Organization, Period, Project, ProjectMilestone, ProjectTask, ProjectTrackingEntry } from "../../types/domain";
import { formatNumber } from "../../utils/format.ts";

export type ReportData = {
  organization?: Organization;
  period?: Period;
  canvasAsIs?: CanvasVersion;
  canvasToBe?: CanvasVersion;
  definitions: KpiDefinition[];
  observations: HistoricalObservation[];
  forecasts: KpiForecast[];
  projects: Project[];
  tasks: ProjectTask[];
  milestones: ProjectMilestone[];
  tracking: ProjectTrackingEntry[];
};

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export function buildReportRows(data: ReportData) {
  const kpiRows = data.definitions.map((definition) => {
    const observations = data.observations.filter((item) => item.kpi.trim().toLocaleLowerCase() === definition.name.trim().toLocaleLowerCase()).sort((a, b) => a.observedAt.localeCompare(b.observedAt));
    const latest = observations.at(-1);
    const forecast = data.forecasts.find((item) => item.kpiDefinitionId === definition.id);
    return { KPI: definition.name, Unidad: definition.unit, Real: latest?.value ?? "", Meta: definition.target, Baseline: definition.baseline, Proyectado: forecast?.prediction ?? "", Rango: forecast ? `${forecast.lowerBound} - ${forecast.upperBound}` : "", Calidad: forecast?.quality ?? "Sin pronóstico", "Fecha corte": forecast?.cutoffDate ?? latest?.observedAt ?? "" };
  });
  const projectRows = data.projects.map((project) => ({ Código: project.code, Proyecto: project.name, Estado: project.status, Avance: `${project.progress}%`, "Presupuesto plan": project.plannedBudget, "Costo real": data.tasks.filter((task) => task.projectId === project.id).reduce((sum, task) => sum + task.actualCost, 0), Prioridad: project.priority, Responsable: project.responsible }));
  const observationRows = data.observations.map((item) => ({ KPI: item.kpi, Periodo: data.period?.code ?? "", Valor: item.value, Unidad: item.unit, Fuente: item.source, Calidad: item.quality, Fecha: item.observedAt }));
  return { kpiRows, projectRows, observationRows };
}

export function downloadReportCsv(data: ReportData) {
  const rows = buildReportRows(data);
  const section = (title: string, values: Array<Record<string, unknown>>) => [title, ...Object.keys(values[0] ?? {}).map(csvCell), ...values.map((row) => Object.values(row).map(csvCell).join(",")), ""];
  const lines = [...section("KPI", rows.kpiRows), ...section("PROYECTOS", rows.projectRows), ...section("OBSERVACIONES", rows.observationRows)].join("\n");
  triggerDownload(new Blob(["\ufeff", lines], { type: "text/csv;charset=utf-8" }), `canvas-model-ia-reporte-${data.period?.code ?? "general"}.csv`);
}

export function downloadReportExcel(data: ReportData) {
  const rows = buildReportRows(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows.kpiRows), "KPI");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows.projectRows), "Proyectos");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows.observationRows), "Observaciones");
  const bytes = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  triggerDownload(new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `canvas-model-ia-reporte-${data.period?.code ?? "general"}.xlsx`);
}

function escapeXml(value: unknown) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

function slideXml(title: string, bullets: string[]) {
  const safeBullets = bullets.length ? bullets : ["Sin datos registrados en este contexto."];
  const paragraphs = safeBullets.map((bullet) => `<a:p><a:r><a:rPr lang="es-PE" sz="1500"><a:solidFill><a:srgbClr val="334155"/></a:solidFill></a:rPr><a:t>${escapeXml(bullet)}</a:t></a:r><a:endParaRPr lang="es-PE" sz="1500"/></a:p>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="F4F7FA"/></a:solidFill><a:effectLst/></p:bgPr></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr><p:sp><p:nvSpPr><p:cNvPr id="2" name="Título"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="610000" y="430000"/><a:ext cx="10900000" cy="900000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr><p:txBody><a:bodyPr wrap="square"/><a:lstStyle/><a:p><a:r><a:rPr lang="es-PE" sz="2600" b="1"><a:solidFill><a:srgbClr val="0B1D33"/></a:solidFill></a:rPr><a:t>${escapeXml(title)}</a:t></a:r><a:endParaRPr lang="es-PE" sz="2600"/></a:p></p:txBody></p:sp><p:sp><p:nvSpPr><p:cNvPr id="3" name="Contenido"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="760000" y="1550000"/><a:ext cx="10600000" cy="4300000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr><p:txBody><a:bodyPr wrap="square"/><a:lstStyle/>${paragraphs}</p:txBody></p:sp></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;
}

function slideMasterXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:sldLayoutIdLst><p:sldLayoutId id="1" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles></p:sldMaster>`;
}

function slideLayoutXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1"><p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt x="0" y="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld></p:sldLayout>`;
}

function presentationXml(slideCount: number) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>${Array.from({ length: slideCount }, (_, index) => `<p:sldId id="${256 + index}" r:id="rId${index + 2}"/>`).join("")}</p:sldIdLst><p:sldSz cx="12192000" cy="6858000" type="screen16x9"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>`;
}

function relationshipXml(targets: Array<{ id: string; type: string; target: string }>) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${targets.map((item) => `<Relationship Id="${item.id}" Type="${item.type}" Target="${item.target}"/>`).join("")}</Relationships>`;
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function write32(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value >>> 0, true);
}

function zipStore(files: Record<string, string>) {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const [name, content] of Object.entries(files)) {
    const nameBytes = encoder.encode(name);
    const data = encoder.encode(content);
    const header = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(header.buffer);
    write32(view, 0, 0x04034b50); view.setUint16(4, 20, true); view.setUint16(6, 0x800, true); view.setUint16(8, 0, true); write32(view, 14, crc32(data)); write32(view, 18, data.length); write32(view, 22, data.length); view.setUint16(26, nameBytes.length, true); view.setUint16(28, 0, true); header.set(nameBytes, 30);
    chunks.push(header, data);
    const directory = new Uint8Array(46 + nameBytes.length);
    const directoryView = new DataView(directory.buffer);
    write32(directoryView, 0, 0x02014b50); directoryView.setUint16(4, 20, true); directoryView.setUint16(6, 20, true); directoryView.setUint16(8, 0x800, true); directoryView.setUint16(10, 0, true); write32(directoryView, 16, crc32(data)); write32(directoryView, 20, data.length); write32(directoryView, 24, data.length); directoryView.setUint16(28, nameBytes.length, true); directoryView.setUint16(30, 0, true); directoryView.setUint16(32, 0, true); directoryView.setUint16(34, 0, true); directoryView.setUint16(36, 0, true); write32(directoryView, 42, offset); directory.set(nameBytes, 46);
    central.push(directory);
    offset += header.length + data.length;
  }
  const centralSize = central.reduce((sum, item) => sum + item.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  write32(endView, 0, 0x06054b50); endView.setUint16(8, central.length, true); endView.setUint16(10, central.length, true); write32(endView, 12, centralSize); write32(endView, 16, offset);
  return new Blob([...chunks, ...central, end], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
}

export function buildReportPptxBlob(data: ReportData) {
  const rows = buildReportRows(data);
  const actual = data.observations.at(-1)?.value ?? 0;
  const slides = [
    ["Canvas Model IA", [`${data.organization?.name ?? "Organización"} · ${data.period?.label ?? "Periodo"}`, "Reporte ejecutivo de modelo de negocio y analítica local."]],
    ["Contexto y Canvas", [`Canvas AS IS: ${data.canvasAsIs?.name ?? "Sin versión"}`, `Canvas TO BE: ${data.canvasToBe?.name ?? "Sin versión"}`, `${data.observations.length} observaciones y ${data.projects.length} proyectos en el contexto.`]],
    ["Diagnóstico", [`${data.definitions.length} KPI definidos`, `${data.projects.filter((item) => item.status === "EN_RIESGO").length} proyectos en riesgo`, `Valor observado disponible: ${formatNumber(actual)}.`]],
    ["Proyectos y ejecución", data.projects.slice(0, 5).map((project) => `${project.code} · ${project.name} · ${project.progress}% · ${project.status}`)],
    ["KPI y predicción", rows.kpiRows.slice(0, 6).map((row) => `${row.KPI}: real ${row.Real || "—"}, proyectado ${row.Proyectado || "—"} ${row.Unidad}`)],
    ["Conclusiones", ["Usar la predicción como apoyo, no como certeza automática.", "Revisar los KPI en cada corte y documentar decisiones.", "Validar los escenarios antes de convertirlos en compromisos operativos."]],
  ] as Array<[string, string[]]>;
  const files: Record<string, string> = {
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>${slides.map((_, index) => `<Override PartName="/ppt/slides/slide${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join("")}</Types>`,
    "_rels/.rels": relationshipXml([{ id: "rId1", type: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument", target: "ppt/presentation.xml" }, { id: "rId2", type: "http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties", target: "docProps/core.xml" }, { id: "rId3", type: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties", target: "docProps/app.xml" }]),
    "docProps/core.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>Reporte Canvas Model IA</dc:title><dc:creator>Canvas Model IA</dc:creator><cp:lastModifiedBy>Canvas Model IA</cp:lastModifiedBy></cp:coreProperties>`,
    "docProps/app.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Canvas Model IA</Application><PresentationFormat>Widescreen</PresentationFormat></Properties>`,
    "ppt/presentation.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>${slides.map((_, index) => `<p:sldId id="${256 + index}" r:id="rId${index + 2}"/>`).join("")}</p:sldIdLst><p:sldSz cx="12192000" cy="6858000" type="screen16x9"/><p:notesSz cx="6858000" cy="9144000"/><p:defaultTextStyle><a:defPPr/><a:lvl1pPr marL="0" algn="l"><a:defRPr lang="es-PE"/></a:lvl1pPr></p:defaultTextStyle></p:presentation>`,
    "ppt/_rels/presentation.xml.rels": relationshipXml([{ id: "rId1", type: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster", target: "slideMasters/slideMaster1.xml" }, ...slides.map((_, index) => ({ id: `rId${index + 2}`, type: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide", target: `slides/slide${index + 1}.xml` }))]),
    "ppt/slideMasters/slideMaster1.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld><p:sldLayoutIdLst><p:sldLayoutId id="1" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles><p:clrMap accent1="accent1" accent2="accent2" bg1="lt1" bg2="lt2" folHlink="folHlink" hlink="hlink" tx1="dk1" tx2="dk2"/></p:sldMaster>`,
    "ppt/slideMasters/_rels/slideMaster1.xml.rels": relationshipXml([{ id: "rId1", type: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout", target: "../slideLayouts/slideLayout1.xml" }, { id: "rId2", type: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme", target: "../theme/theme1.xml" }]),
    "ppt/slideLayouts/slideLayout1.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="title" preserve="1"><p:cSld name="Title Slide"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`,
    "ppt/slideLayouts/_rels/slideLayout1.xml.rels": relationshipXml([{ id: "rId1", type: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster", target: "../slideMasters/slideMaster1.xml" }]),
    "ppt/theme/theme1.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Canvas Model IA"><a:themeElements><a:clrScheme name="Canvas"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="1F352B"/></a:dk2><a:lt2><a:srgbClr val="F7FAF8"/></a:lt2><a:accent1><a:srgbClr val="4D9672"/></a:accent1><a:accent2><a:srgbClr val="D7A548"/></a:accent2><a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme><a:fontScheme name="Canvas"><a:majorFont><a:latin typeface="Aptos Display"/></a:majorFont><a:minorFont><a:latin typeface="Aptos"/></a:minorFont></a:fontScheme><a:fmtScheme name="Canvas"><a:fillStyleLst/><a:lnStyleLst/><a:effectStyleLst/><a:bgFillStyleLst/></a:fmtScheme></a:themeElements></a:theme>`,
  };
  files["ppt/presentation.xml"] = presentationXml(slides.length);
  files["ppt/slideMasters/slideMaster1.xml"] = slideMasterXml();
  files["ppt/slideLayouts/slideLayout1.xml"] = slideLayoutXml();
  slides.forEach(([title, bullets], index) => { files[`ppt/slides/slide${index + 1}.xml`] = slideXml(title, bullets); files[`ppt/slides/_rels/slide${index + 1}.xml.rels`] = relationshipXml([{ id: "rId1", type: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout", target: "../slideLayouts/slideLayout1.xml" }]); });
  return zipStore(files);
}

export function downloadReportPptx(data: ReportData) {
  triggerDownload(buildReportPptxBlob(data), `canvas-model-ia-reporte-${data.period?.code ?? "general"}.pptx`);
}
