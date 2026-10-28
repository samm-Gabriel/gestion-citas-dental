import type { Prisma } from "@prisma/client";
import { incluirCita, reservarCita, serializarCita } from "@/lib/agenda";
import { instanteLocal, sumarDias } from "@/lib/fechas";
import { creado, leerJson, manejar, metaPaginacion, ok, parametros } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { citaCrear, citasQuery } from "@/lib/validators";

export const GET = manejar(async (req) => {
  const f = citasQuery.parse(parametros(req));
  const palabras = (f.q ?? "").split(/\s+/).filter(Boolean);
  const where: Prisma.CitaWhereInput = {
    ...(f.odontologoId && { odontologoId: f.odontologoId }),
    ...(f.pacienteId && { pacienteId: f.pacienteId }),
    ...(f.estado && { estado: { in: f.estado } }),
    ...((f.desde || f.hasta) && {
      inicio: {
        ...(f.desde && { gte: instanteLocal(f.desde) }),
        ...(f.hasta && { lt: instanteLocal(sumarDias(f.hasta, 1)) }),
      },
    }),
    ...(palabras.length > 0 && {
      AND: palabras.map((p) => ({
        OR: [
          { paciente: { nombre: { contains: p, mode: "insensitive" } } },
          { paciente: { apellido: { contains: p, mode: "insensitive" } } },
          { paciente: { ci: { contains: p, mode: "insensitive" } } },
          { odontologo: { nombre: { contains: p, mode: "insensitive" } } },
          { tratamiento: { nombre: { contains: p, mode: "insensitive" } } },
        ],
      })),
    }),
  };
  const [total, citas] = await prisma.$transaction([
    prisma.cita.count({ where }),
    prisma.cita.findMany({
      where,
      include: incluirCita,
      orderBy: [{ inicio: "asc" }, { id: "asc" }],
      skip: (f.page - 1) * f.pageSize,
      take: f.pageSize,
    }),
  ]);
  return ok(citas.map(serializarCita), { meta: metaPaginacion(f.page, f.pageSize, total) });
});

export const POST = manejar(async (req) => {
  const datos = citaCrear.parse(await leerJson(req));
  return creado(await reservarCita(datos));
});
