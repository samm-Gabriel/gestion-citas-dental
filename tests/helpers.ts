import { NextRequest } from "next/server";
import * as citas from "@/app/api/citas/route";
import * as odontologos from "@/app/api/odontologos/route";
import * as pacientes from "@/app/api/pacientes/route";
import * as tratamientos from "@/app/api/tratamientos/route";
import { diaSemanaDeFecha, hoyLocal, sumarDias } from "@/lib/fechas";
import type { ContextoId } from "@/lib/http";

type Metodo = "GET" | "POST" | "PATCH" | "DELETE";
type Handler = (req: NextRequest, ctx: ContextoId) => Promise<Response>;

export type Registro = { id: number; [campo: string]: unknown };
export type ErrorApi = { code: string; message: string; details?: unknown };
export type Respuesta<T> = {
  status: number;
  data: T;
  meta?: { page: number; pageSize: number; total: number; totalPages: number };
  error?: ErrorApi;
};

/** Llama un route handler como lo haría Next: con un NextRequest y params asíncronos. */
export async function llamar<T = Registro>(
  handler: Handler,
  ruta: string,
  opciones: { metodo?: Metodo; body?: unknown; id?: number | string } = {},
): Promise<Respuesta<T>> {
  const { metodo = "GET", body, id } = opciones;
  const req = new NextRequest(new URL(ruta, "http://localhost"), {
    method: metodo,
    ...(body !== undefined && {
      body: typeof body === "string" ? body : JSON.stringify(body),
      headers: { "content-type": "application/json" },
    }),
  });
  const res = await handler(req, { params: Promise.resolve({ id: String(id ?? "") }) });
  return { status: res.status, ...(await res.json()) };
}

/* ---------- Fechas relativas a hoy (America/La_Paz) ---------- */

export const hoy = () => hoyLocal();
export const ayer = () => sumarDias(hoyLocal(), -1);

/** Primer día estrictamente posterior a hoy cuyo día de la semana está en `dias`. */
export function proximoDia(dias: number[]): string {
  for (let i = 1; i <= 7; i++) {
    const fecha = sumarDias(hoyLocal(), i);
    if (dias.includes(diaSemanaDeFecha(fecha))) return fecha;
  }
  throw new Error(`Ningún día de la semana coincide con ${dias.join(",")}`);
}

/* ---------- Datos de prueba creados por la propia API ---------- */

/** Lunes a viernes de 08:00 a 12:00. */
export const DIAS_LABORABLES = [1, 2, 3, 4, 5];
export const HORARIO_MANANA = DIAS_LABORABLES.map((diaSemana) => ({
  diaSemana,
  horaInicio: "08:00",
  horaFin: "12:00",
}));

let secuencia = 0;
const siguiente = () => `${Date.now() % 100_000}${++secuencia}`;

export async function crearPaciente(datos: Record<string, unknown> = {}) {
  const res = await llamar(pacientes.POST, "/api/pacientes", {
    metodo: "POST",
    body: {
      nombre: "Ana",
      apellido: "Prueba",
      ci: `9${siguiente()}`.slice(0, 12),
      telefono: "70000000",
      ...datos,
    },
  });
  if (res.status !== 201) throw new Error(`crearPaciente: ${res.status} ${JSON.stringify(res.error)}`);
  return res.data;
}

export async function crearOdontologo(datos: Record<string, unknown> = {}) {
  const res = await llamar(odontologos.POST, "/api/odontologos", {
    metodo: "POST",
    body: {
      nombre: `Dr. Prueba ${siguiente()}`,
      especialidad: "Odontología general",
      horarios: HORARIO_MANANA,
      ...datos,
    },
  });
  if (res.status !== 201) throw new Error(`crearOdontologo: ${res.status} ${JSON.stringify(res.error)}`);
  return res.data;
}

export async function crearTratamiento(duracionMinutos = 60, datos: Record<string, unknown> = {}) {
  const res = await llamar(tratamientos.POST, "/api/tratamientos", {
    metodo: "POST",
    body: { nombre: `Tratamiento ${siguiente()}`, duracionMinutos, precio: "150.00", ...datos },
  });
  if (res.status !== 201) throw new Error(`crearTratamiento: ${res.status} ${JSON.stringify(res.error)}`);
  return res.data;
}

export type Escenario = { pacienteId: number; odontologoId: number; tratamientoId: number; fecha: string };

/** Paciente, odontólogo (L-V 08:00-12:00) y tratamiento nuevos, con el próximo día que atiende. */
export async function crearEscenario(duracionMinutos = 60): Promise<Escenario> {
  const [paciente, odontologo, tratamiento] = await Promise.all([
    crearPaciente(),
    crearOdontologo(),
    crearTratamiento(duracionMinutos),
  ]);
  return {
    pacienteId: paciente.id,
    odontologoId: odontologo.id,
    tratamientoId: tratamiento.id,
    fecha: proximoDia(DIAS_LABORABLES),
  };
}

export function reservar(body: Record<string, unknown>) {
  return llamar(citas.POST, "/api/citas", { metodo: "POST", body });
}
