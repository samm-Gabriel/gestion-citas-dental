import { Prisma, type EstadoCita, type PrismaClient } from "@prisma/client";
import { ApiError, noEncontrado } from "./errores";
import { horaAMinutos, instanteLocal, partesLocales } from "./fechas";
import { prisma } from "./prisma";
import type { AtencionActualizar, AtencionCrear, CitaCrear, CitaReprogramar } from "./validators";

type Db = PrismaClient | Prisma.TransactionClient;

export type Intervalo = { inicio: Date; fin: Date };
export type BloqueHorario = { diaSemana: number; horaInicio: string; horaFin: string };

export const DIAS_SEMANA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"] as const;

const OPCIONES_TX = { maxWait: 10_000, timeout: 20_000 };

/** Clave fija del primer argumento de pg_advisory_xact_lock para no chocar con otros locks. */
const LOCK_AGENDA = 4242;

export const incluirCita = {
  paciente: true,
  odontologo: true,
  tratamiento: true,
  atencion: true,
} satisfies Prisma.CitaInclude;

export type CitaCompleta = Prisma.CitaGetPayload<{ include: typeof incluirCita }>;

/* ---------- Reglas puras ---------- */

export function calcularFin(inicio: Date, duracionMinutos: number): Date {
  return new Date(inicio.getTime() + duracionMinutos * 60_000);
}

/** Intervalos semiabiertos [inicio, fin): una cita que termina 10:00 no choca con otra que empieza 10:00. */
export function seSolapan(a: Intervalo, b: Intervalo): boolean {
  return a.inicio.getTime() < b.fin.getTime() && b.inicio.getTime() < a.fin.getTime();
}

export function esEnElPasado(inicio: Date, ahora: Date = new Date()): boolean {
  return inicio.getTime() <= ahora.getTime();
}

/** La cita completa debe caber en un bloque del horario de ese día (hora local de La Paz). */
export function cabeEnHorario(horarios: BloqueHorario[], inicio: Date, fin: Date): boolean {
  const i = partesLocales(inicio);
  const f = partesLocales(fin);
  if (f.fecha !== i.fecha) return false;
  return horarios.some(
    (h) =>
      h.diaSemana === i.diaSemana &&
      horaAMinutos(h.horaInicio) <= i.minutosDelDia &&
      f.minutosDelDia <= horaAMinutos(h.horaFin),
  );
}

export function describirHorarioDelDia(horarios: BloqueHorario[], diaSemana: number): string {
  const bloques = horarios
    .filter((h) => h.diaSemana === diaSemana)
    .sort((a, b) => horaAMinutos(a.horaInicio) - horaAMinutos(b.horaInicio))
    .map((h) => `de ${h.horaInicio} a ${h.horaFin}`);
  const dia = DIAS_SEMANA[diaSemana];
  return bloques.length === 0
    ? `el odontólogo no atiende los ${dia}`
    : `los ${dia} el odontólogo atiende ${bloques.join(" y ")}`;
}

const TRANSICIONES: Record<EstadoCita, EstadoCita[]> = {
  PENDIENTE: ["CONFIRMADA", "CANCELADA", "ATENDIDA"],
  CONFIRMADA: ["PENDIENTE", "CANCELADA", "ATENDIDA"],
  ATENDIDA: [],
  CANCELADA: [],
};

export function transicionPermitida(desde: EstadoCita, hacia: EstadoCita): boolean {
  return TRANSICIONES[desde].includes(hacia);
}

export function serializarCita<T extends Intervalo>(cita: T) {
  const inicio = partesLocales(cita.inicio);
  return {
    ...cita,
    fecha: inicio.fecha,
    horaInicio: inicio.hora,
    horaFin: partesLocales(cita.fin).hora,
  };
}

/* ---------- Reglas con base de datos ---------- */

/** Serializa las reservas de un mismo odontólogo dentro de la transacción para evitar dobles reservas concurrentes. */
export async function bloquearAgendaOdontologo(tx: Prisma.TransactionClient, odontologoId: number) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${LOCK_AGENDA}::int, ${odontologoId}::int)`;
}

export async function buscarChoque(
  db: Db,
  params: { odontologoId: number; inicio: Date; fin: Date; excluirCitaId?: number },
) {
  return db.cita.findFirst({
    where: {
      odontologoId: params.odontologoId,
      estado: { not: "CANCELADA" },
      inicio: { lt: params.fin },
      fin: { gt: params.inicio },
      ...(params.excluirCitaId ? { id: { not: params.excluirCitaId } } : {}),
    },
    orderBy: { inicio: "asc" },
  });
}

export type DatosAgenda = {
  pacienteId: number;
  odontologoId: number;
  tratamientoId: number;
  inicio: Date;
  excluirCitaId?: number;
  ahora?: Date;
};

/**
 * Aplica todas las reglas de agenda y devuelve el intervalo calculado.
 * Lanza ApiError: 404 si falta paciente/odontólogo/tratamiento, 422 si están inactivos,
 * si la cita está en el pasado o fuera del horario, y 409 si choca con otra cita no cancelada.
 */
export async function validarReglasAgenda(db: Db, datos: DatosAgenda): Promise<Intervalo> {
  const ahora = datos.ahora ?? new Date();
  const paciente = await db.paciente.findUnique({ where: { id: datos.pacienteId } });
  if (!paciente) throw noEncontrado(`No existe el paciente con id ${datos.pacienteId}`);

  const odontologo = await db.odontologo.findUnique({
    where: { id: datos.odontologoId },
    include: { horarios: true },
  });
  if (!odontologo) throw noEncontrado(`No existe el odontólogo con id ${datos.odontologoId}`);
  if (!odontologo.activo) {
    throw new ApiError(422, "INACTIVO", `El odontólogo ${odontologo.nombre} está inactivo y no puede recibir citas`);
  }

  const tratamiento = await db.tratamiento.findUnique({ where: { id: datos.tratamientoId } });
  if (!tratamiento) throw noEncontrado(`No existe el tratamiento con id ${datos.tratamientoId}`);
  if (!tratamiento.activo) {
    throw new ApiError(422, "INACTIVO", `El tratamiento ${tratamiento.nombre} está inactivo`);
  }

  const inicio = datos.inicio;
  const fin = calcularFin(inicio, tratamiento.duracionMinutos);
  const local = partesLocales(inicio);

  if (esEnElPasado(inicio, ahora)) {
    throw new ApiError(
      422,
      "CITA_EN_PASADO",
      `No se puede agendar una cita en el pasado (${local.fecha} ${local.hora}, hora de La Paz)`,
    );
  }

  if (!cabeEnHorario(odontologo.horarios, inicio, fin)) {
    throw new ApiError(
      422,
      "FUERA_DE_HORARIO",
      `La cita de ${local.hora} a ${partesLocales(fin).hora} (${tratamiento.duracionMinutos} min) ` +
        `no cabe en el horario de atención: ${describirHorarioDelDia(odontologo.horarios, local.diaSemana)}`,
      { horarios: odontologo.horarios.filter((h) => h.diaSemana === local.diaSemana) },
    );
  }

  const choque = await buscarChoque(db, {
    odontologoId: datos.odontologoId,
    inicio,
    fin,
    excluirCitaId: datos.excluirCitaId,
  });
  if (choque) {
    const c = serializarCita(choque);
    throw new ApiError(
      409,
      "CHOQUE_HORARIO",
      `El odontólogo ya tiene una cita el ${c.fecha} de ${c.horaInicio} a ${c.horaFin} que se cruza con este horario`,
      { citaId: c.id, fecha: c.fecha, horaInicio: c.horaInicio, horaFin: c.horaFin },
    );
  }

  return { inicio, fin };
}

export async function obtenerCita(db: Db, id: number): Promise<CitaCompleta> {
  const cita = await db.cita.findUnique({ where: { id }, include: incluirCita });
  if (!cita) throw noEncontrado(`No existe la cita con id ${id}`);
  return cita;
}

/* ---------- Casos de uso ---------- */

export async function reservarCita(input: CitaCrear, ahora: Date = new Date()) {
  const inicio = instanteLocal(input.fecha, input.horaInicio);
  const cita = await prisma.$transaction(async (tx) => {
    await bloquearAgendaOdontologo(tx, input.odontologoId);
    const { fin } = await validarReglasAgenda(tx, { ...input, inicio, ahora });
    return tx.cita.create({
      data: {
        pacienteId: input.pacienteId,
        odontologoId: input.odontologoId,
        tratamientoId: input.tratamientoId,
        inicio,
        fin,
        motivo: input.motivo ?? null,
      },
      include: incluirCita,
    });
  }, OPCIONES_TX);
  return serializarCita(cita);
}

export async function reprogramarCita(id: number, cambios: CitaReprogramar, ahora: Date = new Date()) {
  const cita = await prisma.$transaction(async (tx) => {
    const actual = await obtenerCita(tx, id);
    if (actual.estado === "CANCELADA" || actual.estado === "ATENDIDA") {
      throw new ApiError(
        422,
        "ESTADO_INVALIDO",
        `No se puede reprogramar una cita ${actual.estado === "CANCELADA" ? "cancelada" : "ya atendida"}`,
      );
    }

    const data: Prisma.CitaUncheckedUpdateInput = {};
    if (cambios.motivo !== undefined) data.motivo = cambios.motivo;

    const cambiaAgenda =
      cambios.fecha !== undefined ||
      cambios.horaInicio !== undefined ||
      cambios.odontologoId !== undefined ||
      cambios.tratamientoId !== undefined;

    if (cambiaAgenda) {
      const local = partesLocales(actual.inicio);
      const odontologoId = cambios.odontologoId ?? actual.odontologoId;
      const tratamientoId = cambios.tratamientoId ?? actual.tratamientoId;
      const inicio = instanteLocal(cambios.fecha ?? local.fecha, cambios.horaInicio ?? local.hora);

      await bloquearAgendaOdontologo(tx, odontologoId);
      const { fin } = await validarReglasAgenda(tx, {
        pacienteId: actual.pacienteId,
        odontologoId,
        tratamientoId,
        inicio,
        excluirCitaId: id,
        ahora,
      });
      Object.assign(data, { odontologoId, tratamientoId, inicio, fin });
    }

    return tx.cita.update({ where: { id }, data, include: incluirCita });
  }, OPCIONES_TX);
  return serializarCita(cita);
}

export async function cambiarEstadoCita(
  id: number,
  estado: Exclude<EstadoCita, "ATENDIDA">,
  motivoCancelacion?: string | null,
) {
  const actual = await obtenerCita(prisma, id);
  if (actual.estado === estado) return serializarCita(actual);

  if (!transicionPermitida(actual.estado, estado)) {
    const motivo =
      actual.estado === "CANCELADA"
        ? "La cita está cancelada y no puede reactivarse; agenda una nueva cita"
        : "La cita ya fue atendida y no puede cambiar de estado";
    throw new ApiError(422, "ESTADO_INVALIDO", motivo);
  }

  const cita = await prisma.cita.update({
    where: { id },
    data: {
      estado,
      motivoCancelacion: estado === "CANCELADA" ? (motivoCancelacion ?? null) : null,
    },
    include: incluirCita,
  });
  return serializarCita(cita);
}

export async function registrarAtencion(citaId: number, datos: AtencionCrear) {
  const cita = await prisma.$transaction(async (tx) => {
    const actual = await obtenerCita(tx, citaId);
    if (actual.estado === "CANCELADA") {
      throw new ApiError(422, "ESTADO_INVALIDO", "No se puede registrar la atención de una cita cancelada");
    }
    if (actual.atencion) {
      throw new ApiError(
        409,
        "CONFLICTO",
        "La cita ya tiene una atención registrada; usa PATCH para modificarla",
      );
    }
    await tx.atencion.create({
      data: {
        citaId,
        diagnostico: datos.diagnostico ?? null,
        tratamientoRealizado: datos.tratamientoRealizado ?? null,
        observaciones: datos.observaciones ?? null,
      },
    });
    return tx.cita.update({ where: { id: citaId }, data: { estado: "ATENDIDA" }, include: incluirCita });
  }, OPCIONES_TX);
  return serializarCita(cita);
}

export async function actualizarAtencion(citaId: number, datos: AtencionActualizar) {
  const actual = await obtenerCita(prisma, citaId);
  if (!actual.atencion) throw noEncontrado("La cita todavía no tiene una atención registrada");
  await prisma.atencion.update({ where: { citaId }, data: datos });
  return serializarCita(await obtenerCita(prisma, citaId));
}
