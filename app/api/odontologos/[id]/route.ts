import type { Prisma } from "@prisma/client";
import { ApiError, leerId, leerJson, manejar, noEncontrado, ok, type ContextoId } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { odontologoActualizar } from "@/lib/validators";

const incluir = {
  horarios: { orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }] },
  _count: { select: { citas: true } },
} satisfies Prisma.OdontologoInclude;

async function buscarOdontologo(id: number) {
  const odontologo = await prisma.odontologo.findUnique({ where: { id }, include: incluir });
  if (!odontologo) throw noEncontrado(`No existe el odontólogo con id ${id}`);
  return odontologo;
}

export const GET = manejar(async (_req, ctx: ContextoId) => {
  return ok(await buscarOdontologo(await leerId(ctx)));
});

export const PATCH = manejar(async (req, ctx: ContextoId) => {
  const id = await leerId(ctx);
  const { horarios, ...datos } = odontologoActualizar.parse(await leerJson(req));
  await buscarOdontologo(id);

  const odontologo = await prisma.$transaction(async (tx) => {
    if (horarios) {
      await tx.horarioAtencion.deleteMany({ where: { odontologoId: id } });
      await tx.horarioAtencion.createMany({ data: horarios.map((h) => ({ ...h, odontologoId: id })) });
    }
    return tx.odontologo.update({ where: { id }, data: datos, include: incluir });
  });
  return ok(odontologo);
});

export const DELETE = manejar(async (_req, ctx: ContextoId) => {
  const id = await leerId(ctx);
  const odontologo = await buscarOdontologo(id);
  if (odontologo._count.citas > 0) {
    throw new ApiError(
      409,
      "EN_USO",
      `No se puede eliminar al odontólogo porque tiene ${odontologo._count.citas} cita(s) registrada(s); desactívalo con activo=false`,
    );
  }
  await prisma.odontologo.delete({ where: { id } });
  return ok({ id });
});
