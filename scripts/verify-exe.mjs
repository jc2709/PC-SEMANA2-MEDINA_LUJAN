import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { setTimeout as pause } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { version } = JSON.parse(await readFile(path.join(projectRoot, "package.json"), "utf8"));
const executableName = `Canvas-Model-IA-portable-${version}-x64.exe`;
const source = path.join(projectRoot, "release", executableName);
const unpackedBackup = path.join(projectRoot, "release", "win-unpacked", "Canvas Model IA.exe");
const verificationRoot = await mkdtemp(path.join(tmpdir(), "canvas-model-ia-verify-"));
const isolatedFolder = path.join(verificationRoot, "solo-exe");
const isolatedExe = path.join(isolatedFolder, executableName);
const profile = path.join(verificationRoot, "perfil-de-prueba");
const resultFile = path.join(verificationRoot, "resultado.json");
let child;

try {
  assert.ok((await stat(unpackedBackup)).size > 0, "Falta el respaldo win-unpacked.");
  await mkdir(isolatedFolder);
  await mkdir(profile);
  await copyFile(source, isolatedExe);
  assert.deepEqual(await readdir(isolatedFolder), [executableName]);

  child = spawn(isolatedExe, [], {
    cwd: isolatedFolder,
    stdio: "ignore",
    windowsHide: true,
    env: {
      ...process.env,
      CANVAS_MODEL_IA_VERIFY_OUTPUT: resultFile,
      CANVAS_MODEL_IA_VERIFY_PROFILE: profile,
    },
  });

  let spawnError;
  child.once("error", (error) => { spawnError = error; });
  const deadline = Date.now() + 150000;
  let result;
  while (Date.now() < deadline) {
    if (spawnError) throw spawnError;
    try {
      result = JSON.parse(await readFile(resultFile, "utf8"));
      break;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    if (child.exitCode !== null) throw new Error(`El EXE terminó antes de informar el resultado (código ${child.exitCode}).`);
    await pause(300);
  }

  assert.ok(result, "El EXE no informó el resultado de la prueba en 150 segundos.");
  assert.equal(result.ok, true, result.error ?? "Falló la verificación interna del EXE.");
  assert.ok(result.modules.length >= 15, "No cargaron todos los módulos de navegación.");
  assert.equal(result.apiBaseUrl, "https://canvas-model-ia-medina-lujan.vercel.app");
  assert.equal(result.apiStatus, 200, "El EXE no recibió HTTP 200 desde Vercel.");
  assert.match(result.aiMode, /RESPUESTA REAL/, "La IA respondió en modo MOCK o no mostró resultado.");
  assert.deepEqual(await readdir(isolatedFolder), [executableName], "El EXE generó archivos auxiliares visibles en su carpeta.");

  process.stdout.write(`PASS: EXE aislado; ${result.modules.length} módulos; API HTTP ${result.apiStatus}; ${result.aiMode}.\n`);
} finally {
  if (child && child.exitCode === null) {
    await Promise.race([new Promise((resolve) => child.once("exit", resolve)), pause(10000)]);
    if (child.exitCode === null) {
      child.kill();
      await pause(1500);
    }
  }
  const expectedPrefix = path.join(tmpdir(), "canvas-model-ia-verify-");
  if (verificationRoot.startsWith(expectedPrefix)) {
    await rm(verificationRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
  }
}
