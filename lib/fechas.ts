export const ZONA_HORARIA = "America/La_Paz";

/** America/La_Paz es UTC-4 todo el año (Bolivia no aplica horario de verano). */
export const OFFSET_MINUTOS = -240;

const MS_POR_MINUTO = 60_000;
const MS_POR_DIA = 86_400_000;

export const REGEX_FECHA = /^\d{4}-\d{2}-\d{2}$/;
export const REGEX_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

const dos = (n: number) => String(n).padStart(2, "0");

export function esFechaValida(fecha: string): boolean {
  if (!REGEX_FECHA.test(fecha)) return false;
  const [y, m, d] = fecha.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

export function horaAMinutos(hora: string): number {
  const [hh, mm] = hora.split(":").map(Number);
  return hh * 60 + mm;
}

export function minutosAHora(minutos: number): string {
  return `${dos(Math.floor(minutos / 60))}:${dos(minutos % 60)}`;
}

/** Instante UTC que corresponde a una fecha y hora locales del consultorio. */
export function instanteLocal(fecha: string, hora = "00:00"): Date {
  const [y, m, d] = fecha.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) + horaAMinutos(hora) * MS_POR_MINUTO - OFFSET_MINUTOS * MS_POR_MINUTO);
}

export type PartesLocales = {
  fecha: string;
  hora: string;
  /** 0 = domingo ... 6 = sábado */
  diaSemana: number;
  minutosDelDia: number;
};

export function partesLocales(instante: Date): PartesLocales {
  const local = new Date(instante.getTime() + OFFSET_MINUTOS * MS_POR_MINUTO);
  const minutosDelDia = local.getUTCHours() * 60 + local.getUTCMinutes();
  return {
    fecha: `${local.getUTCFullYear()}-${dos(local.getUTCMonth() + 1)}-${dos(local.getUTCDate())}`,
    hora: minutosAHora(minutosDelDia),
    diaSemana: local.getUTCDay(),
    minutosDelDia,
  };
}

export function hoyLocal(ahora: Date = new Date()): string {
  return partesLocales(ahora).fecha;
}

export function sumarDias(fecha: string, dias: number): string {
  const [y, m, d] = fecha.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d) + dias * MS_POR_DIA);
  return `${t.getUTCFullYear()}-${dos(t.getUTCMonth() + 1)}-${dos(t.getUTCDate())}`;
}

export function diaSemanaDeFecha(fecha: string): number {
  const [y, m, d] = fecha.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Lunes de la semana a la que pertenece la fecha. */
export function inicioSemana(fecha: string): string {
  const dia = diaSemanaDeFecha(fecha);
  return sumarDias(fecha, dia === 0 ? -6 : 1 - dia);
}

export function inicioMes(fecha: string): string {
  return `${fecha.slice(0, 7)}-01`;
}

export function finMes(fecha: string): string {
  const [y, m] = fecha.split("-").map(Number);
  const ultimo = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${fecha.slice(0, 7)}-${dos(ultimo)}`;
}

/** Rango [desde 00:00, hasta + 1 día 00:00) en hora local, ambos días inclusive. */
export function rangoDias(desde: string, hasta: string): { gte: Date; lt: Date } {
  return { gte: instanteLocal(desde), lt: instanteLocal(sumarDias(hasta, 1)) };
}

/** Fecha de calendario (sin hora) para columnas @db.Date: medianoche UTC. */
export function fechaCalendario(fecha: string): Date {
  const [y, m, d] = fecha.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
