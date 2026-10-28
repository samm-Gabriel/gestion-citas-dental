import { execFileSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import type { TestProject } from "vitest/node";

declare module "vitest" {
  export interface ProvidedContext {
    databaseUrl: string;
    directUrl: string;
    schemaPrueba: string;
  }
}

function conSchema(url: string, schema: string): string {
  const u = new URL(url);
  u.searchParams.set("schema", schema);
  return u.toString();
}

async function borrarSchema(directUrl: string, schema: string) {
  const prisma = new PrismaClient({ datasourceUrl: directUrl });
  try {
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Crea un schema PostgreSQL temporal (test_<timestamp>) en la misma base, le aplica
 * las migraciones y lo borra al terminar la suite. El schema de la app nunca se toca.
 */
export default async function setup(project: TestProject) {
  config({ quiet: true });
  const { DATABASE_URL, DIRECT_URL } = process.env;
  if (!DATABASE_URL || !DIRECT_URL) {
    throw new Error("Faltan DATABASE_URL y DIRECT_URL en el entorno o en .env");
  }

  const schema = `test_${Date.now()}`;
  const databaseUrl = conSchema(DATABASE_URL, schema);
  const directUrl = conSchema(DIRECT_URL, schema);

  try {
    execFileSync("npx", ["prisma", "migrate", "deploy"], {
      env: { ...process.env, DATABASE_URL: databaseUrl, DIRECT_URL: directUrl },
      stdio: "pipe",
    });
  } catch (error) {
    await borrarSchema(directUrl, schema);
    const stderr = (error as { stderr?: Buffer }).stderr?.toString() ?? "";
    throw new Error(`prisma migrate deploy falló en el schema ${schema}:\n${stderr}`);
  }

  project.provide("databaseUrl", databaseUrl);
  project.provide("directUrl", directUrl);
  project.provide("schemaPrueba", schema);

  return async () => {
    await borrarSchema(directUrl, schema);
  };
}
