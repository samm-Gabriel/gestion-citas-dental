#!/usr/bin/env node
// Capturas de las pantallas reales para el capítulo de prototipos (4.4).
// Requiere la app levantada (next build && next start) y solo hace lecturas:
// abre páginas y diálogos, pero no envía formularios.
//
// Uso: node capturas.mjs [--url http://localhost:3091] [--docs <carpeta docs>]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (n) => (process.argv.indexOf(n) >= 0 ? process.argv[process.argv.indexOf(n) + 1] : undefined);
const base = arg("--url") ?? "http://localhost:3091";
const outDir = path.join(path.resolve(arg("--docs") ?? path.join(here, "..")), "capturas");
fs.mkdirSync(outDir, { recursive: true });

const chrome = [process.env.PUPPETEER_EXECUTABLE_PATH, "/usr/bin/google-chrome", "/usr/bin/chromium"].find(
  (c) => c && fs.existsSync(c),
);
const browser = await puppeteer.launch({ executablePath: chrome, args: ["--no-sandbox", "--disable-gpu"] });

const api = async (ruta) => (await (await fetch(`${base}/api${ruta}`)).json()).data;
const hoy = new Date(Date.now() - 4 * 3600_000).toISOString().slice(0, 10);
const paciente = (await api("/pacientes?pageSize=1"))[0];
const odontologos = await api("/odontologos?activo=true&pageSize=100");
const conCitasHoy = [];
for (const o of odontologos) {
  const citas = await api(`/citas?desde=${hoy}&hasta=${hoy}&odontologoId=${o.id}&pageSize=100`);
  if (citas.length) conCitasHoy.push({ o, citas });
}
const agenda = conCitasHoy.sort((a, b) => b.citas.length - a.citas.length)[0] ?? { o: odontologos[0], citas: [] };
const citaActiva = agenda.citas.find((c) => c.estado === "PENDIENTE" || c.estado === "CONFIRMADA") ?? agenda.citas[0];

async function capturar(nombre, { ruta, perfil, ancho = 1280, alto = 800, antes }) {
  const page = await browser.newPage();
  await page.setViewport({ width: ancho, height: alto, deviceScaleFactor: 1 });
  await page.goto(base + "/", { waitUntil: "networkidle0" });
  await page.evaluate((p) => {
    if (p) localStorage.setItem("consultorio.perfil", p);
    else localStorage.removeItem("consultorio.perfil");
    localStorage.setItem("consultorio.tema", "claro");
  }, perfil ?? null);
  await page.goto(base + ruta, { waitUntil: "networkidle0" });
  if (antes) await antes(page);
  await new Promise((r) => setTimeout(r, 800));
  const archivo = path.join(outDir, `${nombre}.png`);
  await page.screenshot({ path: archivo });
  await page.close();
  console.log(`  ${path.relative(process.cwd(), archivo)}  (${ruta})`);
}

async function clicEnBoton(page, texto) {
  const botones = await page.$$("button");
  for (const b of botones) {
    const t = await b.evaluate((el) => el.textContent?.trim() ?? "");
    if (t.includes(texto)) {
      await b.click();
      await new Promise((r) => setTimeout(r, 600));
      return true;
    }
  }
  return false;
}

const R = "RECEPCIONISTA";
const A = "ADMINISTRADOR";
const O = `ODONTOLOGO:${agenda.o.id}`;

await capturar("cu01_selector_perfil", { ruta: "/" });
await capturar("cu02_nuevo_paciente", { ruta: "/pacientes/nuevo", perfil: R });
await capturar("cu03_pacientes", { ruta: "/pacientes", perfil: R });
await capturar("cu04_cu05_editar_odontologo", { ruta: `/odontologos/${agenda.o.id}/editar`, perfil: A, alto: 1000 });
await capturar("cu06_tratamientos", { ruta: "/tratamientos", perfil: A });
await capturar("cu07_cu08_nueva_cita", {
  ruta: `/citas/nueva?pacienteId=${paciente.id}`,
  perfil: R,
  alto: 1000,
  antes: async (page) => {
    await page.waitForSelector("#odontologo");
    await page.select("#odontologo", String(agenda.o.id));
    await new Promise((r) => setTimeout(r, 1200));
  },
});
if (citaActiva) {
  await capturar("cu09_reprogramar", {
    ruta: `/citas/${citaActiva.id}`,
    perfil: R,
    antes: (page) => clicEnBoton(page, "Reprogramar"),
  });
  await capturar("cu10_cancelar", { ruta: `/citas/${citaActiva.id}`, perfil: R, antes: (page) => clicEnBoton(page, "Cancelar") });
  await capturar("cu11_detalle_cita", { ruta: `/citas/${citaActiva.id}`, perfil: R });
}
await capturar("cu12_agenda_citas", { ruta: "/citas", perfil: R });
await capturar("cu13_agenda_dia", { ruta: "/agenda-dia", perfil: O });
await capturar("cu14_registrar_atencion", {
  ruta: "/agenda-dia",
  perfil: O,
  antes: (page) => clicEnBoton(page, "Registrar atención"),
});
await capturar("cu15_ficha_paciente", { ruta: `/pacientes/${paciente.id}`, perfil: R });
await capturar("cu16_tablero", { ruta: "/tablero", perfil: A });
await capturar("movil_agenda_dia", { ruta: "/agenda-dia", perfil: O, ancho: 390, alto: 844 });

await browser.close();
