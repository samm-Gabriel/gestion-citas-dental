import type { Prisma } from "@prisma/client";
import { creado, leerJson, manejar, metaPaginacion, ok, parametros } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { odontologoCrear, odontologosQuery } from "@/lib/validators";

const incluirHorarios = {
  horarios: { orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }] },
} satisfies Prisma.OdontologoInclude;

export const GET = manejar(async (req) => {
  const { q, page, pageSize, activo, especialidad } = odontologosQuery.parse(parametros(req));
  const where: Prisma.OdontologoWhereInput = {
    ...(activo !== undefined && { activo }),
    ...(especialidad && { especialidad: { contains: especialidad, mode: "insensitive" } }),
    ...(q && {
      OR: [
        { nombre: { contains: q, mode: "insensitive" } },
        { especialidad: { contains: q, mode: "insensitive" } },
      ],
    }),
  };
  const [total, odontologos] = await prisma.$transaction([
    prisma.odontologo.count({ where }),
    prisma.odontologo.findMany({
      where,
      include: incluirHorarios,
      orderBy: [{ nombre: "asc" }, { id: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return ok(odontologos, { meta: metaPaginacion(page, pageSize, total) });
});

export const POST = manejar(async (req) => {
  const { horarios, ...datos } = odontologoCrear.parse(await leerJson(req));
  const odontologo = await prisma.odontologo.create({
    data: { ...datos, horarios: { create: horarios } },
    include: incluirHorarios,
  });
  return creado(odontologo);
});
