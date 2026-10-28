import type { Prisma } from "@prisma/client";
import { ApiError, creado, leerJson, manejar, metaPaginacion, ok, parametros } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { tratamientoCrear, tratamientosQuery } from "@/lib/validators";

export const GET = manejar(async (req) => {
  const { q, page, pageSize, activo } = tratamientosQuery.parse(parametros(req));
  const where: Prisma.TratamientoWhereInput = {
    ...(activo !== undefined && { activo }),
    ...(q && {
      OR: [
        { nombre: { contains: q, mode: "insensitive" } },
        { descripcion: { contains: q, mode: "insensitive" } },
      ],
    }),
  };
  const [total, tratamientos] = await prisma.$transaction([
    prisma.tratamiento.count({ where }),
    prisma.tratamiento.findMany({
      where,
      orderBy: [{ nombre: "asc" }, { id: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return ok(tratamientos, { meta: metaPaginacion(page, pageSize, total) });
});

export const POST = manejar(async (req) => {
  const datos = tratamientoCrear.parse(await leerJson(req));
  const existente = await prisma.tratamiento.findFirst({
    where: { nombre: { equals: datos.nombre, mode: "insensitive" } },
  });
  if (existente) {
    throw new ApiError(409, "NOMBRE_DUPLICADO", `Ya existe un tratamiento llamado "${existente.nombre}"`, {
      tratamientoId: existente.id,
    });
  }
  const tratamiento = await prisma.tratamiento.create({
    data: { ...datos, descripcion: datos.descripcion ?? null },
  });
  return creado(tratamiento);
});
