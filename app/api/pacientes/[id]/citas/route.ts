import { serializarCita } from "@/lib/agenda";
import { leerId, manejar, noEncontrado, ok, parametros, type ContextoId } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { historialQuery } from "@/lib/validators";

export const GET = manejar(async (req, ctx: ContextoId) => {
  const id = await leerId(ctx);
  const { estado } = historialQuery.parse(parametros(req));
  const paciente = await prisma.paciente.findUnique({ where: { id } });
  if (!paciente) throw noEncontrado(`No existe el paciente con id ${id}`);

  const citas = await prisma.cita.findMany({
    where: { pacienteId: id, ...(estado && { estado }) },
    include: { odontologo: true, tratamiento: true, atencion: true },
    orderBy: [{ inicio: "desc" }, { id: "desc" }],
  });
  return ok(citas.map(serializarCita));
});
