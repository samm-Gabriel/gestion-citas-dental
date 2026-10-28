import { z } from "zod";
import { REGEX_FECHA, REGEX_HORA, esFechaValida, horaAMinutos, hoyLocal } from "./fechas";

z.config(z.locales.es());

export const ESTADOS_CITA = ["PENDIENTE", "CONFIRMADA", "ATENDIDA", "CANCELADA"] as const;

const vacioANull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

const texto = (campo: string, max = 100) =>
  z
    .string({ error: `${campo} es obligatorio` })
    .trim()
    .min(1, `${campo} es obligatorio`)
    .max(max, `${campo} admite como máximo ${max} caracteres`);

const textoOpcional = (campo: string, max = 2000) =>
  z.preprocess(
    vacioANull,
    z
      .string({ error: `${campo} debe ser texto` })
      .trim()
      .max(max, `${campo} admite como máximo ${max} caracteres`)
      .nullable()
      .optional(),
  );

export const fechaSchema = z
  .string({ error: "La fecha es obligatoria" })
  .regex(REGEX_FECHA, "La fecha debe tener el formato AAAA-MM-DD")
  .refine(esFechaValida, "La fecha no existe en el calendario");

export const horaSchema = z
  .string({ error: "La hora es obligatoria" })
  .regex(REGEX_HORA, "La hora debe tener el formato HH:MM (00:00 a 23:59)");

const idSchema = (campo: string) =>
  z.coerce
    .number({ error: `${campo} debe ser un número` })
    .int(`${campo} debe ser un entero`)
    .positive(`${campo} debe ser un entero positivo`);

const alMenosUnCampo = (obj: Record<string, unknown>) =>
  Object.values(obj).some((v) => v !== undefined);

/* ---------- Paginación y búsqueda ---------- */

export const listadoQuery = z.object({
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1, "page debe ser 1 o mayor").default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1, "pageSize debe ser 1 o mayor")
    .max(100, "pageSize admite como máximo 100")
    .default(20),
});

const booleanoQuery = z
  .enum(["true", "false"], { error: "Debe ser true o false" })
  .transform((v) => v === "true")
  .optional();

/* ---------- Paciente ---------- */

const pacienteCampos = {
  nombre: texto("El nombre"),
  apellido: texto("El apellido"),
  ci: z
    .string({ error: "El CI es obligatorio" })
    .trim()
    .toUpperCase()
    .regex(/^[0-9]{4,12}(-?[0-9A-Z]{1,4})?$/, "El CI debe tener entre 4 y 12 dígitos y un complemento opcional (ej. 1234567-1A)"),
  telefono: z
    .string({ error: "El teléfono es obligatorio" })
    .trim()
    .regex(/^\+?[0-9 ()-]{6,20}$/, "El teléfono debe tener entre 6 y 20 dígitos (puede incluir +, espacios o guiones)"),
  email: z.preprocess(
    vacioANull,
    z.email({ error: "El email no es válido" }).max(120).nullable().optional(),
  ),
  fechaNacimiento: z.preprocess(
    vacioANull,
    fechaSchema
      .refine((f) => f <= hoyLocal(), "La fecha de nacimiento no puede estar en el futuro")
      .nullable()
      .optional(),
  ),
};

export const pacienteCrear = z.object(pacienteCampos);
export const pacienteActualizar = z
  .object(pacienteCampos)
  .partial()
  .refine(alMenosUnCampo, "Envía al menos un campo para actualizar");

export const historialQuery = z.object({
  estado: z.enum(ESTADOS_CITA, { error: "Estado de cita no válido" }).optional(),
});

/* ---------- Odontólogo y horario ---------- */

export const horarioSchema = z
  .object({
    diaSemana: z.coerce
      .number({ error: "diaSemana debe ser un número" })
      .int()
      .min(0, "diaSemana va de 0 (domingo) a 6 (sábado)")
      .max(6, "diaSemana va de 0 (domingo) a 6 (sábado)"),
    horaInicio: horaSchema,
    horaFin: horaSchema,
  })
  .refine((h) => horaAMinutos(h.horaInicio) < horaAMinutos(h.horaFin), {
    message: "La hora de inicio debe ser anterior a la hora de fin",
    path: ["horaFin"],
  });

const horariosSchema = z
  .array(horarioSchema)
  .max(21, "Como máximo 21 bloques de horario")
  .superRefine((horarios, ctx) => {
    horarios.forEach((a, i) => {
      horarios.forEach((b, j) => {
        if (j <= i || a.diaSemana !== b.diaSemana) return;
        const solapan =
          horaAMinutos(a.horaInicio) < horaAMinutos(b.horaFin) &&
          horaAMinutos(b.horaInicio) < horaAMinutos(a.horaFin);
        if (solapan) {
          ctx.addIssue({
            code: "custom",
            message: `Los bloques de horario ${i + 1} y ${j + 1} se solapan el mismo día`,
            path: [j],
          });
        }
      });
    });
  });

export const odontologoCrear = z.object({
  nombre: texto("El nombre", 120),
  especialidad: texto("La especialidad"),
  activo: z.boolean({ error: "activo debe ser true o false" }).default(true),
  horarios: horariosSchema.default([]),
});

export const odontologoActualizar = z
  .object({
    nombre: texto("El nombre", 120),
    especialidad: texto("La especialidad"),
    activo: z.boolean({ error: "activo debe ser true o false" }),
    horarios: horariosSchema,
  })
  .partial()
  .refine(alMenosUnCampo, "Envía al menos un campo para actualizar");

export const odontologosQuery = listadoQuery.extend({
  activo: booleanoQuery,
  especialidad: z.string().trim().max(100).optional(),
});

/* ---------- Tratamiento ---------- */

const precioSchema = z
  .union([z.number(), z.string().trim()], { error: "El precio es obligatorio" })
  .transform((v) => String(v))
  .refine((v) => /^\d{1,8}(\.\d{1,2})?$/.test(v), "El precio debe ser un número positivo con hasta 2 decimales");

const tratamientoCampos = {
  nombre: texto("El nombre", 120),
  descripcion: textoOpcional("La descripción", 500),
  duracionMinutos: z.coerce
    .number({ error: "La duración es obligatoria" })
    .int("La duración debe ser un número entero de minutos")
    .min(5, "La duración mínima es 5 minutos")
    .max(480, "La duración máxima es 480 minutos"),
  precio: precioSchema,
};

export const tratamientoCrear = z.object({
  ...tratamientoCampos,
  activo: z.boolean({ error: "activo debe ser true o false" }).default(true),
});

export const tratamientoActualizar = z
  .object({ ...tratamientoCampos, activo: z.boolean({ error: "activo debe ser true o false" }) })
  .partial()
  .refine(alMenosUnCampo, "Envía al menos un campo para actualizar");

export const tratamientosQuery = listadoQuery.extend({ activo: booleanoQuery });

/* ---------- Cita ---------- */

export const citaCrear = z.object({
  pacienteId: idSchema("pacienteId"),
  odontologoId: idSchema("odontologoId"),
  tratamientoId: idSchema("tratamientoId"),
  fecha: fechaSchema,
  horaInicio: horaSchema,
  motivo: textoOpcional("El motivo", 500),
});

export const citaReprogramar = z
  .object({
    fecha: fechaSchema,
    horaInicio: horaSchema,
    odontologoId: idSchema("odontologoId"),
    tratamientoId: idSchema("tratamientoId"),
    motivo: textoOpcional("El motivo", 500),
  })
  .partial()
  .refine(alMenosUnCampo, "Envía al menos un campo para reprogramar");

export const citaCambiarEstado = z.object({
  estado: z.enum(["PENDIENTE", "CONFIRMADA", "CANCELADA"], {
    error: "estado debe ser PENDIENTE, CONFIRMADA o CANCELADA (ATENDIDA se registra con la atención)",
  }),
  motivoCancelacion: textoOpcional("El motivo de cancelación", 500),
});

export const citaCancelar = z.object({
  motivoCancelacion: textoOpcional("El motivo de cancelación", 500),
});

export const citasQuery = listadoQuery
  .extend({
    desde: fechaSchema.optional(),
    hasta: fechaSchema.optional(),
    odontologoId: idSchema("odontologoId").optional(),
    pacienteId: idSchema("pacienteId").optional(),
    estado: z
      .string()
      .transform((v) => v.split(",").map((e) => e.trim().toUpperCase()).filter(Boolean))
      .pipe(z.array(z.enum(ESTADOS_CITA, { error: "Estado de cita no válido" })).min(1))
      .optional(),
    pageSize: z.coerce.number().int().min(1).max(200, "pageSize admite como máximo 200").default(50),
  })
  .refine((f) => !f.desde || !f.hasta || f.desde <= f.hasta, {
    message: "desde no puede ser posterior a hasta",
    path: ["hasta"],
  });

/* ---------- Atención ---------- */

const atencionCampos = {
  diagnostico: textoOpcional("El diagnóstico"),
  tratamientoRealizado: textoOpcional("El tratamiento realizado"),
  observaciones: textoOpcional("Las observaciones"),
};

export const atencionCrear = z
  .object(atencionCampos)
  .refine((a) => Boolean(a.diagnostico || a.tratamientoRealizado || a.observaciones), {
    message: "Registra al menos el diagnóstico, el tratamiento realizado o las observaciones",
  });

export const atencionActualizar = z
  .object(atencionCampos)
  .refine(alMenosUnCampo, "Envía al menos un campo para actualizar");

/* ---------- Tablero ---------- */

export const tableroQuery = z.object({
  fecha: fechaSchema.optional(),
});

export type PacienteCrear = z.infer<typeof pacienteCrear>;
export type PacienteActualizar = z.infer<typeof pacienteActualizar>;
export type OdontologoCrear = z.infer<typeof odontologoCrear>;
export type OdontologoActualizar = z.infer<typeof odontologoActualizar>;
export type HorarioInput = z.infer<typeof horarioSchema>;
export type TratamientoCrear = z.infer<typeof tratamientoCrear>;
export type TratamientoActualizar = z.infer<typeof tratamientoActualizar>;
export type CitaCrear = z.infer<typeof citaCrear>;
export type CitaReprogramar = z.infer<typeof citaReprogramar>;
export type AtencionCrear = z.infer<typeof atencionCrear>;
export type AtencionActualizar = z.infer<typeof atencionActualizar>;
