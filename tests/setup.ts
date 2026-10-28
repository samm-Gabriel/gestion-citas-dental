import { afterAll, beforeEach, inject, vi } from "vitest";

// connection() exige el request scope que crea el servidor de Next; al llamar los
// handlers directamente no existe, y su único efecto es marcar la ruta como dinámica.
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  connection: async () => {},
}));

const schema = inject("schemaPrueba");
if (!schema.startsWith("test_") || new URL(inject("databaseUrl")).searchParams.get("schema") !== schema) {
  throw new Error("Las pruebas solo pueden correr sobre un schema test_*");
}

// Debe fijarse antes de importar Prisma: el cliente lee DATABASE_URL al crearse.
process.env.DATABASE_URL = inject("databaseUrl");
process.env.DIRECT_URL = inject("directUrl");

const { prisma } = await import("@/lib/prisma");

beforeEach(async () => {
  await prisma.atencion.deleteMany();
  await prisma.cita.deleteMany();
  await prisma.horarioAtencion.deleteMany();
  await prisma.tratamiento.deleteMany();
  await prisma.odontologo.deleteMany();
  await prisma.paciente.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
