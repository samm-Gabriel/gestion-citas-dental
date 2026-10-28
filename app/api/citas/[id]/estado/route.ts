import { cambiarEstadoCita } from "@/lib/agenda";
import { leerId, leerJson, manejar, ok, type ContextoId } from "@/lib/http";
import { citaCambiarEstado } from "@/lib/validators";

export const PATCH = manejar(async (req, ctx: ContextoId) => {
  const id = await leerId(ctx);
  const { estado, motivoCancelacion } = citaCambiarEstado.parse(await leerJson(req));
  return ok(await cambiarEstadoCita(id, estado, motivoCancelacion));
});
