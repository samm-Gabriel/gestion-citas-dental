import { actualizarAtencion, obtenerCita, registrarAtencion } from "@/lib/agenda";
import { creado, leerId, leerJson, manejar, noEncontrado, ok, type ContextoId } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { atencionActualizar, atencionCrear } from "@/lib/validators";

export const GET = manejar(async (_req, ctx: ContextoId) => {
  const id = await leerId(ctx);
  const cita = await obtenerCita(prisma, id);
  if (!cita.atencion) throw noEncontrado("La cita todavía no tiene una atención registrada");
  return ok(cita.atencion);
});

export const POST = manejar(async (req, ctx: ContextoId) => {
  const id = await leerId(ctx);
  const datos = atencionCrear.parse(await leerJson(req));
  return creado(await registrarAtencion(id, datos));
});

export const PATCH = manejar(async (req, ctx: ContextoId) => {
  const id = await leerId(ctx);
  const datos = atencionActualizar.parse(await leerJson(req));
  return ok(await actualizarAtencion(id, datos));
});
