import { cambiarEstadoCita } from "@/lib/agenda";
import { leerId, leerJson, manejar, ok, type ContextoId } from "@/lib/http";
import { citaCancelar } from "@/lib/validators";

export const POST = manejar(async (req, ctx: ContextoId) => {
  const id = await leerId(ctx);
  const { motivoCancelacion } = citaCancelar.parse(await leerJson(req, true));
  return ok(await cambiarEstadoCita(id, "CANCELADA", motivoCancelacion));
});
