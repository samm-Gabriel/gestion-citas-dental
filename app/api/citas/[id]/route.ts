import { obtenerCita, reprogramarCita, serializarCita } from "@/lib/agenda";
import { ApiError, leerId, leerJson, manejar, ok, type ContextoId } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { citaReprogramar } from "@/lib/validators";

export const GET = manejar(async (_req, ctx: ContextoId) => {
  return ok(serializarCita(await obtenerCita(prisma, await leerId(ctx))));
});

export const PATCH = manejar(async (req, ctx: ContextoId) => {
  const id = await leerId(ctx);
  const cambios = citaReprogramar.parse(await leerJson(req));
  return ok(await reprogramarCita(id, cambios));
});

export const DELETE = manejar(async (_req, ctx: ContextoId) => {
  const id = await leerId(ctx);
  const cita = await obtenerCita(prisma, id);
  if (cita.estado === "ATENDIDA") {
    throw new ApiError(
      422,
      "ESTADO_INVALIDO",
      "No se puede eliminar una cita atendida porque tiene una atención registrada",
    );
  }
  await prisma.cita.delete({ where: { id } });
  return ok({ id });
});
