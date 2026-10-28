import type { EstadoCita } from "@prisma/client";
import { serializarCita } from "./agenda";
import { finMes, hoyLocal, inicioMes, inicioSemana, rangoDias, sumarDias } from "./fechas";
import { prisma } from "./prisma";

export async function obtenerTablero(fechaReferencia?: string, ahora: Date = new Date()) {
  const hoy = fechaReferencia ?? hoyLocal(ahora);
  const lunes = inicioSemana(hoy);
  const domingo = sumarDias(lunes, 6);
  const mesDesde = inicioMes(hoy);
  const mesHasta = finMes(hoy);

  const [citasHoy, citasSemana, odontologosActivos, pacientesMes] = await Promise.all([
    prisma.cita.findMany({
      where: { inicio: rangoDias(hoy, hoy) },
      include: { paciente: true, odontologo: true, tratamiento: true, atencion: true },
      orderBy: [{ inicio: "asc" }, { id: "asc" }],
    }),
    prisma.cita.findMany({
      where: { inicio: rangoDias(lunes, domingo), estado: { not: "CANCELADA" } },
      include: { paciente: true, odontologo: true, tratamiento: true },
      orderBy: [{ inicio: "asc" }, { id: "asc" }],
    }),
    prisma.odontologo.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } }),
    prisma.paciente.findMany({
      where: { createdAt: rangoDias(mesDesde, mesHasta) },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const porEstado: Record<EstadoCita, number> = { PENDIENTE: 0, CONFIRMADA: 0, ATENDIDA: 0, CANCELADA: 0 };
  for (const cita of citasHoy) porEstado[cita.estado]++;

  const grupos = new Map<number, { odontologo: { id: number; nombre: string; especialidad: string }; citas: ReturnType<typeof serializarCita<(typeof citasSemana)[number]>>[] }>();
  for (const o of odontologosActivos) {
    grupos.set(o.id, { odontologo: { id: o.id, nombre: o.nombre, especialidad: o.especialidad }, citas: [] });
  }
  for (const cita of citasSemana) {
    const { odontologo } = cita;
    if (!grupos.has(odontologo.id)) {
      grupos.set(odontologo.id, {
        odontologo: { id: odontologo.id, nombre: odontologo.nombre, especialidad: odontologo.especialidad },
        citas: [],
      });
    }
    grupos.get(odontologo.id)!.citas.push(serializarCita(cita));
  }

  return {
    fecha: hoy,
    citasHoy: {
      fecha: hoy,
      total: citasHoy.length,
      porEstado,
      citas: citasHoy.map(serializarCita),
    },
    citasSemana: {
      desde: lunes,
      hasta: domingo,
      total: citasSemana.length,
      porOdontologo: [...grupos.values()].map((g) => ({ ...g, total: g.citas.length })),
    },
    pacientesNuevosMes: {
      desde: mesDesde,
      hasta: mesHasta,
      total: pacientesMes.length,
      pacientes: pacientesMes,
    },
  };
}
