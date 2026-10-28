#!/usr/bin/env node
// Arma docs/<slug>.docx con la librería docx a partir de:
//   docs/documento.json     carátula y metadatos
//   docs/contenido/*.md     capítulos (Markdown acotado, ver README.md)
//   docs/casos_uso.js       catálogo único de actores y CU (opcional)
//   docs/diagramas/png/**   figuras ya renderizadas por render.mjs
// Formato según la skill documentacion-sistema-gestion §1.
//
// Uso: node build.mjs [--docs <carpeta docs>] [--out <archivo.docx>]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  LineRuleType,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";

const here = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.resolve(argValue("--docs") ?? path.join(here, ".."));
const contentDir = path.join(docsDir, "contenido");

const C = {
  h1: "0B2A6F",
  h2: "1D5FBF",
  h3: "0E8FA3",
  h4: "2E8B6E",
  h5: "5B3A8C",
  cu: "1F2937",
  gray: "6B7280",
  fichaKey: "E3EBF7",
};
const FULL_WIDTH = 9360;
const MAX_IMG_W = 620;
// Más alto que esto, la figura no cabe con su título en la misma página y
// keepNext deja media página en blanco.
const MAX_IMG_H = 600;

const meta = readJSON(path.join(docsDir, "documento.json"));
const slug = meta.slug || "documento";
const outFile = path.resolve(argValue("--out") ?? path.join(docsDir, `${slug}.docx`));
const catalog = await loadCatalog(path.join(docsDir, "casos_uso.js"));

let figure = 0;
let listInstance = 0;
const missing = [];

const body = [];
for (const file of chapterFiles()) {
  body.push(...renderMarkdown(fs.readFileSync(file, "utf8"), path.dirname(file)));
}
if (missing.length) {
  console.error("build: faltan figuras (corre render.mjs o corrige la ruta):\n  " + missing.join("\n  "));
  process.exit(1);
}

const doc = new Document({
  creator: meta.autor || "G. Arness",
  title: meta.sistema || slug,
  features: { updateFields: true },
  styles: {
    default: {
      document: {
        run: { font: "Arial", size: 22 },
        paragraph: { spacing: { line: 300, lineRule: LineRuleType.AUTO, after: 140 } },
      },
    },
    paragraphStyles: [
      headingStyle("Heading1", "Heading 1", 32, C.h1),
      headingStyle("Heading2", "Heading 2", 28, C.h2),
      headingStyle("Heading3", "Heading 3", 26, C.h3),
      headingStyle("Heading4", "Heading 4", 23, C.h4),
      headingStyle("Heading5", "Heading 5", 22, C.h5),
      headingStyle("Heading6", "Heading 6", 22, C.cu),
    ],
  },
  numbering: {
    config: [
      {
        reference: "vinetas",
        levels: [0, 1].map((level) => ({
          level,
          format: LevelFormat.BULLET,
          text: "•",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720 * (level + 1), hanging: 360 } }, run: { color: C.h3 } },
        })),
      },
      {
        reference: "numeros",
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
    ],
  },
  sections: [
    { properties: { page: pageProps() }, children: cover() },
    {
      properties: { page: pageProps() },
      headers: { default: header() },
      footers: { default: footer() },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 },
          children: [new TextRun({ text: "CONTENIDO", bold: true, size: 32, color: C.h1 })],
        }),
        new TableOfContents("CONTENIDO", { hyperlink: true, headingStyleRange: "1-6" }),
        ...body,
      ],
    },
  ],
});

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, await Packer.toBuffer(doc));
console.log(`documento: ${path.relative(process.cwd(), outFile) || outFile} (${figure} figuras)`);

// --- formato de página, carátula, encabezado y pie ---

function pageProps() {
  return {
    size: { width: 12240, height: 15840 },
    margin: { top: 780, right: 1300, bottom: 860, left: 1300, header: 280, footer: 340 },
  };
}

function headingStyle(id, name, size, color) {
  return {
    id,
    name,
    basedOn: "Normal",
    next: "Normal",
    quickFormat: true,
    run: { font: "Arial", size, bold: true, color },
    paragraph: { spacing: { before: 240, after: 160, line: 276 }, keepNext: true, keepLines: true },
  };
}

function header() {
  return new Header({
    children: [
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "BFBFBF", space: 2 } },
        children: [new TextRun({ text: meta.nombreCorto || meta.sistema || "", size: 18, color: "808080" })],
      }),
    ],
  });
}

function footer() {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 6, color: "BFBFBF", space: 2 } },
        children: [
          new TextRun({ children: ["Página ", PageNumber.CURRENT, " de ", PageNumber.TOTAL_PAGES], size: 18, color: "808080" }),
        ],
      }),
    ],
  });
}

function cover() {
  const t = (text, opts = {}) =>
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: opts.after ?? 120 },
      children: [new TextRun({ text, font: "Times New Roman", size: opts.size ?? 26, bold: opts.bold, color: opts.color })],
    });
  const out = [
    t(meta.universidad || "", { size: 30, bold: true, color: "1F3A93" }),
    t(meta.facultad || "", { size: 24, color: "595959" }),
    t(meta.grupo || "", { size: 26, bold: true, color: "C00000", after: 360 }),
  ];
  const escudo = meta.escudo && path.resolve(docsDir, meta.escudo);
  if (escudo && fs.existsSync(escudo)) out.push(imageParagraph(escudo, 180, 180));
  out.push(t((meta.sistema || "").toUpperCase(), { size: 34, bold: true, after: 480 }));

  const integrantes = meta.integrantes || [];
  if (integrantes.length) {
    const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
    const borders = { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none };
    const cell = (text, bold) =>
      new TableCell({
        borders,
        width: { size: 3600, type: WidthType.DXA },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [new TextRun({ text, bold, font: "Times New Roman", size: 24 })],
          }),
        ],
      });
    out.push(
      new Table({
        alignment: AlignmentType.CENTER,
        width: { size: 7200, type: WidthType.DXA },
        columnWidths: [3600, 3600],
        borders,
        rows: [
          new TableRow({ children: [cell("INTEGRANTES", true), cell("REGISTRO", true)] }),
          ...integrantes.map((i) => new TableRow({ children: [cell(i.nombre || ""), cell(i.registro || "")] })),
        ],
      }),
    );
  }
  out.push(t("", { after: 240 }));
  for (const [k, v] of [
    ["MATERIA", meta.materia],
    ["SIGLA", meta.sigla],
    ["GRUPO", meta.grupoMateria],
    ["DOCENTE", meta.docente],
  ]) {
    if (v) out.push(t(`${k}: ${v}`, { size: 24 }));
  }
  out.push(t(`${meta.ciudad || ""}${meta.ciudad && meta.fecha ? ", " : ""}${meta.fecha || ""}`, { size: 24, after: 0 }));
  return out;
}

// --- Markdown acotado ---

function chapterFiles() {
  if (Array.isArray(meta.capitulos) && meta.capitulos.length) {
    return meta.capitulos.map((f) => {
      const p = path.join(contentDir, f);
      if (!fs.existsSync(p)) fail(`documento.json lista ${f} pero no existe en ${contentDir}`);
      return p;
    });
  }
  if (!fs.existsSync(contentDir)) fail(`no existe ${contentDir}`);
  const files = fs.readdirSync(contentDir).filter((f) => f.endsWith(".md")).sort();
  if (!files.length) fail(`no hay capítulos .md en ${contentDir}`);
  return files.map((f) => path.join(contentDir, f));
}

function renderMarkdown(src, baseDir) {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let para = [];
  let nextTableKind = "";

  const flush = () => {
    if (para.length) {
      out.push(textParagraph(para.join(" ")));
      para = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      flush();
      continue;
    }

    const marker = trimmed.match(/^<!--\s*([\w:-]+)\s*-->$/);
    if (marker) {
      flush();
      const name = marker[1];
      if (name === "ficha") nextTableKind = "ficha";
      else if (name === "salto") out.push(new Paragraph({ pageBreakBefore: true, children: [] }));
      else if (name.startsWith("casos_uso:")) out.push(...catalogTable(name.slice("casos_uso:".length)));
      continue;
    }

    const h = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flush();
      out.push(heading(h[1].length, h[2].trim()));
      continue;
    }

    if (trimmed.startsWith("```")) {
      flush();
      const code = [];
      for (i++; i < lines.length && !lines[i].trim().startsWith("```"); i++) code.push(lines[i]);
      out.push(...codeBlock(code));
      continue;
    }

    if (trimmed.startsWith("|")) {
      flush();
      const rows = [];
      for (; i < lines.length && lines[i].trim().startsWith("|"); i++) rows.push(lines[i].trim());
      i--;
      out.push(...table(rows, nextTableKind));
      nextTableKind = "";
      continue;
    }

    const img = trimmed.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/);
    if (img) {
      flush();
      out.push(...figureBlock(img[1], img[2], img[3], baseDir));
      continue;
    }

    if (trimmed.startsWith("!pendiente")) {
      flush();
      const text = trimmed.replace(/^!pendiente:?\s*/, "") || "Sección por desarrollar en la siguiente entrega.";
      out.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [new TextRun({ text, italics: true, color: C.gray })],
        }),
      );
      continue;
    }

    const bullet = line.match(/^(\s*)[-*]\s+(.*)$/);
    if (bullet) {
      flush();
      const level = Math.min(1, Math.floor(bullet[1].length / 2));
      out.push(
        new Paragraph({
          numbering: { reference: "vinetas", level },
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60 },
          children: inline(bullet[2]),
        }),
      );
      continue;
    }

    const num = trimmed.match(/^\d+\.\s+(.*)$/);
    if (num) {
      flush();
      // Cada lista numerada vuelve a empezar en 1.
      const prevIsNum = i > 0 && /^\d+\.\s+/.test(lines[i - 1].trim());
      if (!prevIsNum) listInstance++;
      out.push(
        new Paragraph({
          numbering: { reference: "numeros", level: 0, instance: listInstance },
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60 },
          children: inline(num[1]),
        }),
      );
      continue;
    }

    para.push(trimmed);
  }
  flush();
  return out;
}

function heading(level, text) {
  const levels = [
    HeadingLevel.HEADING_1,
    HeadingLevel.HEADING_2,
    HeadingLevel.HEADING_3,
    HeadingLevel.HEADING_4,
    HeadingLevel.HEADING_5,
    HeadingLevel.HEADING_6,
  ];
  const isCU = /^CU\d+\b/.test(text);
  const opts = {
    heading: levels[level - 1],
    children: [isCU ? new TextRun({ text, bold: true, italics: true, size: 22, color: C.cu }) : new TextRun(text)],
  };
  if (level === 1) {
    opts.pageBreakBefore = true;
    opts.border = { bottom: { style: BorderStyle.SINGLE, size: 8, color: C.h1, space: 4 } };
  }
  return new Paragraph(opts);
}

function textParagraph(text) {
  return new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: inline(text) });
}

// **negrita**, *cursiva* y `código`. Los guiones bajos se dejan tal cual
// porque los nombres de tablas y clases usan snake_case.
function inline(text, base = {}) {
  const out = [];
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(new TextRun({ ...base, text: text.slice(last, m.index) }));
    if (m[2] !== undefined) out.push(new TextRun({ ...base, text: m[2], bold: true }));
    else if (m[3] !== undefined) out.push(new TextRun({ ...base, text: m[3], italics: true }));
    else out.push(new TextRun({ ...base, text: m[4], font: "Courier New", size: 20 }));
    last = re.lastIndex;
  }
  if (last < text.length) out.push(new TextRun({ ...base, text: text.slice(last) }));
  return out;
}

function codeBlock(lines) {
  return lines.map(
    (l, idx) =>
      new Paragraph({
        spacing: { line: 240, after: idx === lines.length - 1 ? 140 : 0 },
        shading: { type: ShadingType.CLEAR, fill: "F3F4F6", color: "auto" },
        children: [new TextRun({ text: l || " ", font: "Courier New", size: 18 })],
      }),
  );
}

function splitRow(row) {
  return row
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

function table(rawRows, kind) {
  const cells = rawRows.map(splitRow).filter((r) => !r.every((c) => /^:?-{3,}:?$/.test(c)));
  if (!cells.length) return [];
  const cols = Math.max(...cells.map((r) => r.length));

  if (kind === "ficha") return [fichaTable(cells)];

  const widths = Array(cols).fill(Math.floor(FULL_WIDTH / cols));
  const tRows = cells.map(
    (r, ri) =>
      new TableRow({
        tableHeader: ri === 0,
        cantSplit: true,
        children: Array.from({ length: cols }, (_, ci) =>
          ri === 0
            ? new TableCell({
                width: { size: widths[ci], type: WidthType.DXA },
                shading: { type: ShadingType.CLEAR, fill: C.h1, color: "auto" },
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Paragraph({
                    spacing: { line: 240, after: 40 },
                    children: [new TextRun({ text: r[ci] ?? "", bold: true, color: "FFFFFF", size: 20 })],
                  }),
                ],
              })
            : new TableCell({
                width: { size: widths[ci], type: WidthType.DXA },
                children: [new Paragraph({ spacing: { line: 240, after: 40 }, children: inline(r[ci] ?? "", { size: 20 }) })],
              }),
        ),
      }),
  );
  return [new Table({ width: { size: FULL_WIDTH, type: WidthType.DXA }, columnWidths: widths, rows: tRows }), spacer()];
}

// Ficha de caso de uso: 2 columnas (2100/7260), clave en negrita sobre fondo
// E3EBF7. Si la primera fila trae una imagen, ocupa las dos columnas.
function fichaTable(cells) {
  const rows = [];
  for (const r of cells) {
    const [k, ...rest] = r;
    const v = rest.join(" | ");
    const img = k.match(/^!\[[^\]]*\]\(([^)\s]+)\)$/);
    if (img) {
      const file = resolveImage(img[1], contentDir);
      rows.push(
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              columnSpan: 2,
              width: { size: FULL_WIDTH, type: WidthType.DXA },
              children: [file ? imageParagraph(file) : new Paragraph("")],
            }),
          ],
        }),
      );
      continue;
    }
    rows.push(
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: 2100, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: C.fichaKey, color: "auto" },
            children: [new Paragraph({ spacing: { line: 240, after: 40 }, children: [new TextRun({ text: k, bold: true, color: C.h1, size: 20 })] })],
          }),
          new TableCell({
            width: { size: 7260, type: WidthType.DXA },
            children: v
              .split(/<br\s*\/?>/i)
              .map((part) => new Paragraph({ spacing: { line: 240, after: 40 }, children: inline(part.trim(), { size: 20 }) })),
          }),
        ],
      }),
    );
  }
  return new Table({ width: { size: FULL_WIDTH, type: WidthType.DXA }, columnWidths: [2100, 7260], rows });
}

function spacer() {
  return new Paragraph({ spacing: { after: 120 }, children: [] });
}

// --- figuras ---

function resolveImage(src, baseDir) {
  for (const p of [path.resolve(baseDir, src), path.resolve(docsDir, src)]) {
    if (fs.existsSync(p)) return p;
  }
  missing.push(src);
  return null;
}

function figureBlock(title, src, note, baseDir) {
  const file = resolveImage(src, baseDir);
  figure++;
  const out = [
    new Paragraph({ keepNext: true, spacing: { before: 120, after: 0 }, children: [new TextRun({ text: `Figura ${figure}`, bold: true })] }),
    new Paragraph({ keepNext: true, spacing: { after: 80 }, children: [new TextRun({ text: title, italics: true })] }),
  ];
  if (file) out.push(imageParagraph(file));
  out.push(
    new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({ text: note || `Nota. Elaboración propia (${path.relative(docsDir, file || src)}).`, italics: true, size: 20 })],
    }),
  );
  return out;
}

function imageParagraph(file, maxW = MAX_IMG_W, maxH = MAX_IMG_H) {
  const data = fs.readFileSync(file);
  const { width, height } = pngSize(data);
  const scale = Math.min(1, maxW / width, maxH / height);
  // Sin interlineado propio, la imagen hereda line=300 y LibreOffice la
  // recorta a la altura de una línea de texto.
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    keepNext: true,
    spacing: { line: 240, lineRule: LineRuleType.AUTO, before: 60, after: 60 },
    children: [
      new ImageRun({
        type: "png",
        data,
        transformation: { width: Math.round(width * scale), height: Math.round(height * scale) },
      }),
    ],
  });
}

function pngSize(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) fail("solo se admiten figuras PNG");
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

// --- catálogo de casos de uso ---

async function loadCatalog(file) {
  if (!fs.existsSync(file)) return null;
  const mod = await import(pathToFileURL(file).href);
  return mod.default ?? mod;
}

function catalogTable(kind) {
  if (!catalog) fail(`el capítulo pide casos_uso:${kind} pero no existe docs/casos_uso.js`);
  const cu = catalog.casosUso || [];
  const join = (v) => (Array.isArray(v) ? v.join(", ") : v ?? "");
  const md = (header, rows) => table([`| ${header.join(" | ")} |`, ...rows.map((r) => `| ${r.join(" | ")} |`)], "");
  switch (kind) {
    case "actores":
      return md(["Actor", "Responsabilidad y límite de acceso"], (catalog.actores || []).map((a) => [a.nombre, a.descripcion]));
    case "listado":
      return md(["CU", "Nombre", "Actor(es)", "Descripción", "Relación"], cu.map((c) => [c.id, c.nombre, join(c.actores), c.descripcion, c.relacion || "—"]));
    case "priorizacion":
      return md(
        ["ID", "Caso de uso", "Estado", "Prioridad", "Riesgo", "Actores", "Ciclo"],
        cu.map((c) => [c.id, c.nombre, c.estado || "Incluido", c.prioridad, c.riesgo, join(c.actores), c.ciclo]),
      );
    case "paquetes":
      return md(
        ["Paquete", "Casos de uso", "Responsabilidad", "Ciclo"],
        (catalog.paquetes || []).map((p) => [p.nombre, join(cu.filter((c) => c.paquete === p.id).map((c) => c.id)), p.responsabilidad, p.ciclo]),
      );
    default:
      fail(`marcador desconocido casos_uso:${kind} (usa actores, listado, priorizacion o paquetes)`);
  }
}

// --- auxiliares ---

function readJSON(file) {
  if (!fs.existsSync(file)) fail(`falta ${file}`);
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    fail(`${file}: ${e.message}`);
  }
}

function argValue(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function fail(msg) {
  console.error("build: " + msg);
  process.exit(1);
}
