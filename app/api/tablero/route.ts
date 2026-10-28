import { manejar, ok, parametros } from "@/lib/http";
import { obtenerTablero } from "@/lib/tablero";
import { tableroQuery } from "@/lib/validators";

export const GET = manejar(async (req) => {
  const { fecha } = tableroQuery.parse(parametros(req));
  return ok(await obtenerTablero(fecha));
});
