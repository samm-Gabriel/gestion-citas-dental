#!/usr/bin/env node
// Renderiza los diagramas del documento a PNG:
//   docs/diagramas/<tipo>/*.puml  -> docs/diagramas/png/<tipo>/<nombre>.png  (PlantUML)
//   docs/diagramas/<tipo>/*.mmd   -> docs/diagramas/png/<tipo>/<nombre>.png  (Mermaid)
// Sale con código 1 si algún diagrama no renderiza: un documento sin la figura
// no se entrega.
//
// Uso: node render.mjs [--docs <carpeta docs>]

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.resolve(argValue("--docs") ?? path.join(here, ".."));
const diagDir = path.join(docsDir, "diagramas");
const pngDir = path.join(diagDir, "png");

if (!fs.existsSync(diagDir)) fail(`no existe ${diagDir}`);

const puml = walk(diagDir, ".puml");
const mmd = walk(diagDir, ".mmd");
if (puml.length + mmd.length === 0) fail(`no hay .puml ni .mmd en ${diagDir}`);

const failures = [];
let rendered = 0;

if (puml.length) {
  const jar = await plantumlJar();
  const smetana = !hasCommand("dot");
  // Agrupado por carpeta: el mismo nombre de CU existe en secuencia/ y en
  // comunicacion/, y un solo -o los pisaría entre sí.
  for (const [dir, files] of groupByDir(puml)) {
    const out = path.join(pngDir, path.relative(diagDir, dir));
    fs.mkdirSync(out, { recursive: true });
    const args = ["-Djava.awt.headless=true", "-jar", jar, "-tpng", "-charset", "UTF-8", "-o", out];
    if (smetana) args.push("-Playout=smetana");
    const r = spawnSync("java", [...args, ...files], { encoding: "utf8" });
    if (r.status !== 0) {
      failures.push(`PlantUML (${path.relative(docsDir, dir)}):\n${(r.stderr || r.stdout || "").trim()}`);
      continue;
    }
    for (const f of files) {
      const png = path.join(out, pumlOutputName(f) + ".png");
      if (fs.existsSync(png)) rendered++;
      else failures.push(`PlantUML no generó ${path.relative(docsDir, png)} para ${path.relative(docsDir, f)}`);
    }
  }
}

if (mmd.length) {
  const mmdc = path.join(here, "node_modules", ".bin", "mmdc");
  if (!fs.existsSync(mmdc)) fail("falta mermaid-cli: corre `npm install` en esta carpeta");
  const pcfg = puppeteerConfig();
  for (const f of mmd) {
    const out = path.join(pngDir, path.relative(diagDir, path.dirname(f)), path.basename(f, ".mmd") + ".png");
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const args = ["-i", f, "-o", out, "-b", "white", "-w", "1800", "-s", "2"];
    if (pcfg) args.push("-p", pcfg);
    const r = spawnSync(mmdc, args, { encoding: "utf8" });
    if (r.status !== 0 || !fs.existsSync(out)) {
      failures.push(`Mermaid (${path.relative(docsDir, f)}):\n${(r.stderr || r.stdout || "").trim()}`);
    } else rendered++;
  }
}

console.log(`diagramas renderizados: ${rendered}/${puml.length + mmd.length} → ${path.relative(process.cwd(), pngDir) || pngDir}`);
if (failures.length) {
  console.error("\nfallaron:\n" + failures.join("\n\n"));
  process.exit(1);
}

// --- auxiliares ---

function argValue(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function fail(msg) {
  console.error("render: " + msg);
  process.exit(1);
}

function walk(dir, ext) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (p !== pngDir) out.push(...walk(p, ext));
    } else if (e.name.endsWith(ext)) out.push(p);
  }
  return out.sort();
}

function groupByDir(files) {
  const m = new Map();
  for (const f of files) {
    const d = path.dirname(f);
    if (!m.has(d)) m.set(d, []);
    m.get(d).push(f);
  }
  return m;
}

// PlantUML nombra la salida según `@startuml <nombre>` o, si no hay nombre,
// según el archivo.
function pumlOutputName(file) {
  const first = fs.readFileSync(file, "utf8").split(/\r?\n/).find((l) => l.trim().startsWith("@startuml"));
  const name = first?.trim().slice("@startuml".length).trim();
  return name ? name : path.basename(file, ".puml");
}

function hasCommand(cmd) {
  return spawnSync("sh", ["-c", `command -v ${cmd}`]).status === 0;
}

async function plantumlJar() {
  if (process.env.PLANTUML_JAR && fs.existsSync(process.env.PLANTUML_JAR)) return process.env.PLANTUML_JAR;
  if (!hasCommand("java")) fail("falta Java (PlantUML lo necesita)");
  const cache = path.join(process.env.XDG_CACHE_HOME || path.join(os.homedir(), ".cache"), "garness");
  fs.mkdirSync(cache, { recursive: true });
  const modern = /^plantuml-(1\.\d{4}\.\d+)\.jar$/;
  const existing = fs.readdirSync(cache).filter((f) => modern.test(f)).sort(byVersion((f) => f.match(modern)[1]));
  if (existing.length) return path.join(cache, existing.at(-1));

  // <release> en Maven Central apunta a "8059", de la numeración antigua; la
  // versión vigente es la 1.AAAA.N más alta de la lista.
  const base = "https://repo1.maven.org/maven2/net/sourceforge/plantuml/plantuml";
  const meta = await (await fetch(`${base}/maven-metadata.xml`)).text();
  const versions = [...meta.matchAll(/<version>(1\.\d{4}\.\d+)<\/version>/g)].map((m) => m[1]);
  const version = versions.sort(byVersion((v) => v)).at(-1);
  if (!version) fail("no pude leer la versión de PlantUML en Maven Central");
  const res = await fetch(`${base}/${version}/plantuml-${version}.jar`);
  if (!res.ok) fail(`descarga de PlantUML falló: HTTP ${res.status}`);
  const jar = path.join(cache, `plantuml-${version}.jar`);
  fs.writeFileSync(jar, Buffer.from(await res.arrayBuffer()));
  console.log(`PlantUML ${version} descargado en ${jar}`);
  return jar;
}

function byVersion(key) {
  return (a, b) => {
    const pa = key(a).split(".").map(Number);
    const pb = key(b).split(".").map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0);
    }
    return 0;
  };
}

// mermaid-cli usa Puppeteer. Si hay un Chrome del sistema, se usa ese y no
// hace falta que npm descargue otro navegador.
function puppeteerConfig() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  const chrome = candidates.find((c) => fs.existsSync(c));
  const cfg = { args: ["--no-sandbox", "--disable-gpu"] };
  if (chrome) cfg.executablePath = chrome;
  const file = path.join(os.tmpdir(), "garness-puppeteer.json");
  fs.writeFileSync(file, JSON.stringify(cfg));
  return file;
}
