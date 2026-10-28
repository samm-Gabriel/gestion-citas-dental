import type { EstadoCita, HorarioAtencion, HorarioInput, Paciente } from "./api";

export const DIAS_SEMANA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
export const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export const ETIQUETA_ESTADO: Record<EstadoCita, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADA: "Confirmada",
  ATENDIDA: "Atendida",
  CANCELADA: "Cancelada",
};

const formatoFecha = new Intl.DateTimeFormat("es-BO", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const formatoFechaLarga = new Intl.DateTimeFormat("es-BO", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

function comoUTC(fecha: string) {
  const [y, m, d] = fecha.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** "mar, 28 oct 2026" a partir de AAAA-MM-DD, sin conversiones de zona horaria. */
export function formatearFecha(fecha: string) {
  return formatoFecha.format(comoUTC(fecha));
}

/** "martes, 28 de octubre" */
export function formatearFechaLarga(fecha: string) {
  const texto = formatoFechaLarga.format(comoUTC(fecha));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function nombrePaciente(paciente?: Pick<Paciente, "nombre" | "apellido"> | null) {
  return paciente ? `${paciente.nombre} ${paciente.apellido}` : "Paciente";
}

export function formatearPrecio(precio: string) {
  return `Bs ${precio}`;
}

export function formatearDuracion(minutos: number) {
  if (minutos < 60) return `${minutos} min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function ordenarHorarios<T extends HorarioInput>(horarios: T[]) {
  return [...horarios].sort((a, b) => a.diaSemana - b.diaSemana || a.horaInicio.localeCompare(b.horaInicio));
}

/** ["Lun 08:00–12:00, 14:00–18:00", "Mié 08:00–12:00"] */
export function resumirHorarios(horarios: HorarioAtencion[]) {
  const porDia = new Map<number, string[]>();
  for (const h of ordenarHorarios(horarios)) {
    porDia.set(h.diaSemana, [...(porDia.get(h.diaSemana) ?? []), `${h.horaInicio}–${h.horaFin}`]);
  }
  return [...porDia.entries()].map(([dia, bloques]) => `${DIAS_CORTOS[dia]} ${bloques.join(", ")}`);
}
