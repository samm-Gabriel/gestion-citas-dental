import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const RAIZ = path.resolve(__dirname, "../..");
const PUERTO = 3088;
const BASE = `http://localhost:${PUERTO}`;
const RUTAS = [
  "/",
  "/tablero",
  "/citas",
  "/citas/nueva",
  "/agenda-dia",
  "/pacientes",
  "/pacientes/nuevo",
  "/odontologos",
  "/tratamientos",
];

function buscarPaginas(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const ruta = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "api" ? [] : buscarPaginas(ruta);
    return e.name === "page.tsx" ? [ruta] : [];
  });
}

describe("smoke: cada page.tsx exporta un componente (#8)", () => {
  const paginas = buscarPaginas(path.join(RAIZ, "app"));

  it("encuentra las páginas del app router", () => {
    expect(paginas.length).toBeGreaterThanOrEqual(RUTAS.length);
  });

  it.each(paginas.map((p) => path.relative(RAIZ, p)))("%s", async (relativa) => {
    const modulo = await import(path.join(RAIZ, relativa));
    expect(typeof modulo.default).toBe("function");
  });
});

const hayBuild = existsSync(path.join(RAIZ, ".next/BUILD_ID"));

describe.skipIf(!hayBuild)(`smoke: páginas principales responden 200 con next start :${PUERTO} (#8)`, () => {
  let servidor: ChildProcess | undefined;
  let salida = "";

  beforeAll(async () => {
    // Sin DATABASE_URL/DIRECT_URL heredadas, Next carga las de .env (la base real, solo lectura).
    const env: NodeJS.ProcessEnv = { ...process.env, NODE_ENV: "production", PORT: String(PUERTO) };
    delete env.DATABASE_URL;
    delete env.DIRECT_URL;
    servidor = spawn(path.join(RAIZ, "node_modules/.bin/next"), ["start", "-p", String(PUERTO)], {
      cwd: RAIZ,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    servidor.stdout?.on("data", (d) => (salida += d));
    servidor.stderr?.on("data", (d) => (salida += d));

    const limite = Date.now() + 60_000;
    while (Date.now() < limite) {
      if (servidor.exitCode !== null) throw new Error(`next start terminó antes de tiempo:\n${salida}`);
      try {
        await fetch(BASE);
        return;
      } catch {
        await new Promise((r) => setTimeout(r, 500));
      }
    }
    throw new Error(`next start no respondió en 60 s:\n${salida}`);
  });

  afterAll(async () => {
    if (!servidor || servidor.exitCode !== null) return;
    const termino = new Promise((r) => servidor!.once("exit", r));
    servidor.kill("SIGTERM");
    await termino;
  });

  it.each(RUTAS)("GET %s → 200", async (ruta) => {
    const res = await fetch(`${BASE}${ruta}`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
  });
});
