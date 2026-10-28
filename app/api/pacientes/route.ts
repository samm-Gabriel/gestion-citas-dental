import type { Prisma } from "@prisma/client";
import { ApiError, creado, leerJson, manejar, metaPaginacion, ok, parametros } from "@/lib/http";
import { fechaCalendario } from "@/lib/fechas";
import { prisma } from "@/lib/prisma";
import { listadoQuery, pacienteCrear } from "@/lib/validators";

function filtroBusquedaPaciente(q?: string): Prisma.PacienteWhereInput {
  const palabras = (q ?? "").split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return {};
  return {
    AND: palabras.map((p) => ({
      OR: [
        { nombre: { contains: p, mode: "insensitive" } },
        { apellido: { contains: p, mode: "insensitive" } },
        { ci: { contains: p, mode: "insensitive" } },
      ],
    })),
  };
}

export const GET = manejar(async (req) => {
  const { q, page, pageSize } = listadoQuery.parse(parametros(req));
  const where = filtroBusquedaPaciente(q);
  const [total, pacientes] = await prisma.$transaction([
    prisma.paciente.count({ where }),
    prisma.paciente.findMany({
      where,
      orderBy: [{ apellido: "asc" }, { nombre: "asc" }, { id: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return ok(pacientes, { meta: metaPaginacion(page, pageSize, total) });
});

export const POST = manejar(async (req) => {
  const datos = pacienteCrear.parse(await leerJson(req));
  const existente = await prisma.paciente.findUnique({ where: { ci: datos.ci } });
  if (existente) {
    throw new ApiError(
      409,
      "CI_DUPLICADO",
      `Ya existe un paciente con CI ${datos.ci} (${existente.nombre} ${existente.apellido})`,
      { pacienteId: existente.id },
    );
  }
  const paciente = await prisma.paciente.create({
    data: {
      ...datos,
      email: datos.email ?? null,
      fechaNacimiento: datos.fechaNacimiento ? fechaCalendario(datos.fechaNacimiento) : null,
    },
  });
  return creado(paciente);
});
