#!/usr/bin/env node
// Genera desde docs/casos_uso.js los .puml que dependen solo del catálogo:
//   docs/diagramas/casos_uso/   general, por ciclo y uno por CU (ficha)
//   docs/diagramas/paquetes/    «trace» de cada paquete por ciclo
// Las relaciones «include»/«extend» están aquí y deben coincidir con la fila
// "Relaciones" de cada ficha.
//
// Uso: node casos_uso_puml.mjs [--docs <carpeta docs>]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const i = process.argv.indexOf("--docs");
const docsDir = path.resolve(i >= 0 ? process.argv[i + 1] : path.join(here, ".."));
const { default: catalogo } = await import(pathToFileURL(path.join(docsDir, "casos_uso.js")).href);
const { casosUso, paquetes } = catalogo;

const SISTEMA = "Sistema de gestión de citas odontológicas";
const PERFILES = ["Recepcionista", "Odontólogo", "Administrador"];

export const RELACIONES = [
  { tipo: "include", origen: "CU07", destino: "CU08" },
  { tipo: "include", origen: "CU09", destino: "CU08" },
  {
    tipo: "extend",
    origen: "CU05",
    destino: "CU04",
    nota: "Condición: el administrador agrega, modifica\no quita bloques de horario\nPunto de extensión: «Horario de atención»",
  },
  {
    tipo: "extend",
    origen: "CU14",
    destino: "CU13",
    nota: "Condición: la cita no está cancelada\ny el odontólogo pulsa «Registrar atención»\nPunto de extensión: «acciones de la cita»",
  },
];

const alias = (actor) => actor.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const slug = (cu) =>
  `${cu.id}_${cu.nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]+/g, "_").replace(/_$/, "")}`;
const porId = new Map(casosUso.map((c) => [c.id, c]));

// Un CU que usan los tres perfiles se asocia al actor abstracto Usuario.
function actoresDe(cu) {
  const todos = PERFILES.every((p) => cu.actores.includes(p));
  return todos || cu.actores.includes("Usuario") ? ["Usuario"] : cu.actores;
}

function diagrama(nombre, titulo, cus, { conRelacionados = false } = {}) {
  const ids = new Set(cus.map((c) => c.id));
  const relaciones = RELACIONES.filter((r) =>
    conRelacionados ? ids.has(r.origen) || ids.has(r.destino) : ids.has(r.origen) && ids.has(r.destino),
  );
  const mostrados = new Map(cus.map((c) => [c.id, c]));
  for (const r of relaciones) for (const id of [r.origen, r.destino]) mostrados.set(id, porId.get(id));

  const actores = new Set();
  for (const c of cus) for (const a of actoresDe(c)) actores.add(a);
  if (actores.has("Usuario")) for (const p of PERFILES) actores.add(p);

  const l = [`@startuml ${nombre}`, `title ${titulo}`, "left to right direction", "skinparam packageStyle rectangle"];
  for (const a of ["Usuario", ...PERFILES]) if (actores.has(a)) l.push(`actor "${a}" as ${alias(a)}`);
  if (actores.has("Usuario")) for (const p of PERFILES) if (actores.has(p)) l.push(`${alias(p)} --|> Usuario`);
  l.push(`rectangle "${SISTEMA}" {`);
  for (const c of mostrados.values()) l.push(`  usecase "${c.id}\\n${c.nombre}" as ${c.id}`);
  l.push("}");
  for (const c of cus) for (const a of actoresDe(c)) l.push(`${alias(a)} -- ${c.id}`);
  for (const r of relaciones) {
    l.push(`${r.origen} ..> ${r.destino} : <<${r.tipo}>>`);
    if (r.nota) l.push(`note right of ${r.origen}`, ...r.nota.split("\n").map((x) => `  ${x}`), "end note");
  }
  l.push("@enduml", "");
  return l.join("\n");
}

function trace(paquete, ciclo) {
  const cus = casosUso.filter((c) => c.paquete === paquete.id && c.ciclo === ciclo);
  const nombre = `${paquete.id}_trace_${ciclo}`;
  const l = [
    `@startuml ${nombre}`,
    `title ${paquete.nombre} - Ciclo ${ciclo.slice(1)}`,
    "left to right direction",
    `package "${paquete.nombre}" as ${paquete.id} {`,
    "}",
  ];
  for (const c of cus) l.push(`usecase "${c.id} ${c.nombre}" as ${c.id}`);
  for (const c of cus) l.push(`${paquete.id} ..> ${c.id} : <<trace>>`);
  l.push("@enduml", "");
  return { nombre, cus, texto: l.join("\n") };
}

const cuDir = path.join(docsDir, "diagramas", "casos_uso");
const pqDir = path.join(docsDir, "diagramas", "paquetes");
fs.mkdirSync(cuDir, { recursive: true });
fs.mkdirSync(pqDir, { recursive: true });
const escritos = [];
const escribir = (dir, nombre, texto) => {
  fs.writeFileSync(path.join(dir, `${nombre}.puml`), texto);
  escritos.push(path.relative(docsDir, path.join(dir, `${nombre}.puml`)));
};

escribir(cuDir, "casos_uso_general", diagrama("casos_uso_general", "Casos de uso - Diagrama general", casosUso));
for (const ciclo of ["C1", "C2"]) {
  const n = ciclo.slice(1);
  escribir(
    cuDir,
    `casos_uso_ciclo${n}`,
    diagrama(`casos_uso_ciclo${n}`, `Casos de uso - Ciclo ${n}`, casosUso.filter((c) => c.ciclo === ciclo), {
      conRelacionados: true,
    }),
  );
}
for (const cu of casosUso) {
  escribir(cuDir, slug(cu), diagrama(slug(cu), `${cu.id} - ${cu.nombre}`, [cu], { conRelacionados: true }));
}
for (const p of paquetes) {
  for (const ciclo of ["C1", "C2"]) {
    const t = trace(p, ciclo);
    if (t.cus.length) escribir(pqDir, t.nombre, t.texto);
  }
}
console.log(`casos_uso_puml: ${escritos.length} archivos\n  ` + escritos.join("\n  "));
