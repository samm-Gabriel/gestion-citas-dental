import { ApiError, leerId, leerJson, manejar, noEncontrado, ok, type ContextoId } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { tratamientoActualizar } from "@/lib/validators";

async function buscarTratamiento(id: number) {
  const tratamiento = await prisma.tratamiento.findUnique({
    where: { id },
    include: { _count: { select: { citas: true } } },
  });
  if (!tratamiento) throw noEncontrado(`No existe el tratamiento con id ${id}`);
  return tratamiento;
}

export const GET = manejar(async (_req, ctx: ContextoId) => {
  return ok(await buscarTratamiento(await leerId(ctx)));
});

export const PATCH = manejar(async (req, ctx: ContextoId) => {
  const id = await leerId(ctx);
  const datos = tratamientoActualizar.parse(await leerJson(req));
  await buscarTratamiento(id);

  if (datos.nombre) {
    const otro = await prisma.tratamiento.findFirst({
      where: { nombre: { equals: datos.nombre, mode: "insensitive" }, id: { not: id } },
    });
    if (otro) {
      throw new ApiError(409, "NOMBRE_DUPLICADO", `Ya existe otro tratamiento llamado "${otro.nombre}"`, {
        tratamientoId: otro.id,
      });
    }
  }

  const tratamiento = await prisma.tratamiento.update({ where: { id }, data: datos });
  return ok(tratamiento);
});

export const DELETE = manejar(async (_req, ctx: ContextoId) => {
  const id = await leerId(ctx);
  const tratamiento = await buscarTratamiento(id);
  if (tratamiento._count.citas > 0) {
    throw new ApiError(
      409,
      "EN_USO",
      `No se puede eliminar el tratamiento porque tiene ${tratamiento._count.citas} cita(s); desactívalo con activo=false`,
    );
  }
  await prisma.tratamiento.delete({ where: { id } });
  return ok({ id });
});
