import { ApiError, leerId, leerJson, manejar, noEncontrado, ok, type ContextoId } from "@/lib/http";
import { fechaCalendario } from "@/lib/fechas";
import { prisma } from "@/lib/prisma";
import { pacienteActualizar } from "@/lib/validators";

async function buscarPaciente(id: number) {
  const paciente = await prisma.paciente.findUnique({
    where: { id },
    include: { _count: { select: { citas: true } } },
  });
  if (!paciente) throw noEncontrado(`No existe el paciente con id ${id}`);
  return paciente;
}

export const GET = manejar(async (_req, ctx: ContextoId) => {
  return ok(await buscarPaciente(await leerId(ctx)));
});

export const PATCH = manejar(async (req, ctx: ContextoId) => {
  const id = await leerId(ctx);
  const datos = pacienteActualizar.parse(await leerJson(req));
  await buscarPaciente(id);

  if (datos.ci) {
    const otro = await prisma.paciente.findUnique({ where: { ci: datos.ci } });
    if (otro && otro.id !== id) {
      throw new ApiError(
        409,
        "CI_DUPLICADO",
        `Ya existe otro paciente con CI ${datos.ci} (${otro.nombre} ${otro.apellido})`,
        { pacienteId: otro.id },
      );
    }
  }

  const { fechaNacimiento, ...resto } = datos;
  const paciente = await prisma.paciente.update({
    where: { id },
    data: {
      ...resto,
      ...(fechaNacimiento !== undefined && {
        fechaNacimiento: fechaNacimiento ? fechaCalendario(fechaNacimiento) : null,
      }),
    },
  });
  return ok(paciente);
});

export const DELETE = manejar(async (_req, ctx: ContextoId) => {
  const id = await leerId(ctx);
  const paciente = await buscarPaciente(id);
  if (paciente._count.citas > 0) {
    throw new ApiError(
      409,
      "EN_USO",
      `No se puede eliminar al paciente porque tiene ${paciente._count.citas} cita(s) registrada(s)`,
    );
  }
  await prisma.paciente.delete({ where: { id } });
  return ok({ id });
});
