/** Cliente tipado de la API del consultorio (docs/api/openapi.yaml, base /api). */

export type EstadoCita = "PENDIENTE" | "CONFIRMADA" | "ATENDIDA" | "CANCELADA";

export const ESTADOS_CITA: EstadoCita[] = ["PENDIENTE", "CONFIRMADA", "ATENDIDA", "CANCELADA"];

export type CodigoError =
  | "VALIDACION"
  | "JSON_INVALIDO"
  | "NO_ENCONTRADO"
  | "CONFLICTO"
  | "CI_DUPLICADO"
  | "NOMBRE_DUPLICADO"
  | "CHOQUE_HORARIO"
  | "EN_USO"
  | "CITA_EN_PASADO"
  | "FUERA_DE_HORARIO"
  | "INACTIVO"
  | "ESTADO_INVALIDO"
  | "ERROR_INTERNO";

export interface MetaPaginacion {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paginado<T> {
  data: T[];
  meta: MetaPaginacion;
}

export interface DetalleValidacion {
  campo: string;
  mensaje: string;
}

export interface CuerpoError {
  error: {
    code: CodigoError;
    message: string;
    details?: DetalleValidacion[] | Record<string, unknown>;
  };
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: CodigoError;
  readonly details?: DetalleValidacion[] | Record<string, unknown>;

  constructor(status: number, cuerpo: CuerpoError["error"]) {
    super(cuerpo.message);
    this.name = "ApiError";
    this.status = status;
    this.code = cuerpo.code;
    this.details = cuerpo.details;
  }
}

/** Campo que usa la API para errores de validación que no son de un campo concreto. */
const CAMPO_CUERPO = "(cuerpo)";

/** Convierte los `details` de un error VALIDACION en { campo: mensaje }; omite los del cuerpo completo. */
export function erroresPorCampo(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || error.code !== "VALIDACION" || !Array.isArray(error.details)) {
    return {};
  }
  const errores: Record<string, string> = {};
  for (const detalle of error.details) {
    if (detalle.campo === CAMPO_CUERPO) continue;
    const campo = detalle.campo.split(".")[0];
    errores[campo] ??= detalle.mensaje;
  }
  return errores;
}

export function mensajeError(error: unknown): string {
  if (error instanceof ApiError && error.code === "VALIDACION" && Array.isArray(error.details)) {
    const general = error.details.find((d) => d.campo === CAMPO_CUERPO);
    if (general) return general.mensaje;
  }
  if (error instanceof Error) return error.message;
  return "Ocurrió un error inesperado";
}

// ---------- Entidades ----------

export interface Conteo {
  citas: number;
}

export interface Paciente {
  id: number;
  nombre: string;
  apellido: string;
  ci: string;
  telefono: string;
  email: string | null;
  /** Medianoche UTC ("1985-03-14T00:00:00.000Z"); la fecha real es slice(0, 10). */
  fechaNacimiento: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PacienteDetalle extends Paciente {
  _count: Conteo;
}

export interface HorarioAtencion {
  id: number;
  odontologoId: number;
  /** 0 = domingo ... 6 = sábado */
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  createdAt: string;
  updatedAt: string;
}

export interface OdontologoBase {
  id: number;
  nombre: string;
  especialidad: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Odontologo extends OdontologoBase {
  horarios: HorarioAtencion[];
}

export interface OdontologoDetalle extends Odontologo {
  _count: Conteo;
}

export interface OdontologoResumen {
  id: number;
  nombre: string;
  especialidad: string;
}

export interface Tratamiento {
  id: number;
  nombre: string;
  descripcion: string | null;
  duracionMinutos: number;
  /** Decimal serializado sin ceros finales: "100", "250.5". */
  precio: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TratamientoDetalle extends Tratamiento {
  _count: Conteo;
}

export interface Atencion {
  id: number;
  citaId: number;
  diagnostico: string | null;
  tratamientoRealizado: string | null;
  observaciones: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Cita {
  id: number;
  pacienteId: number;
  odontologoId: number;
  tratamientoId: number;
  inicio: string;
  fin: string;
  estado: EstadoCita;
  motivo: string | null;
  motivoCancelacion: string | null;
  createdAt: string;
  updatedAt: string;
  /** Fecha y horas locales de La Paz. */
  fecha: string;
  horaInicio: string;
  horaFin: string;
  paciente?: Paciente;
  odontologo?: OdontologoBase;
  tratamiento?: Tratamiento;
  atencion?: Atencion | null;
}

export type ConteoPorEstado = Record<EstadoCita, number>;

export interface Tablero {
  fecha: string;
  citasHoy: {
    fecha: string;
    total: number;
    porEstado: ConteoPorEstado;
    citas: Cita[];
  };
  citasSemana: {
    desde: string;
    hasta: string;
    total: number;
    porOdontologo: { odontologo: OdontologoResumen; citas: Cita[]; total: number }[];
  };
  pacientesNuevosMes: {
    desde: string;
    hasta: string;
    total: number;
    pacientes: Paciente[];
  };
}

// ---------- Cuerpos de entrada ----------

export interface PacienteInput {
  nombre: string;
  apellido: string;
  ci: string;
  telefono: string;
  email?: string | null;
  /** AAAA-MM-DD */
  fechaNacimiento?: string | null;
}

export interface HorarioInput {
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
}

export interface OdontologoInput {
  nombre: string;
  especialidad: string;
  activo?: boolean;
  horarios?: HorarioInput[];
}

export interface TratamientoInput {
  nombre: string;
  descripcion?: string | null;
  duracionMinutos: number;
  precio: number | string;
  activo?: boolean;
}

export interface CitaInput {
  pacienteId: number;
  odontologoId: number;
  tratamientoId: number;
  fecha: string;
  horaInicio: string;
  motivo?: string | null;
}

export interface CitaReprogramarInput {
  fecha?: string;
  horaInicio?: string;
  odontologoId?: number;
  tratamientoId?: number;
  motivo?: string | null;
}

export interface CitaEstadoInput {
  estado: Exclude<EstadoCita, "ATENDIDA">;
  motivoCancelacion?: string | null;
}

export interface AtencionInput {
  diagnostico?: string | null;
  tratamientoRealizado?: string | null;
  observaciones?: string | null;
}

// ---------- Filtros ----------

export interface FiltroPaginado {
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface FiltroOdontologos extends FiltroPaginado {
  activo?: boolean;
  especialidad?: string;
}

export interface FiltroTratamientos extends FiltroPaginado {
  activo?: boolean;
}

export interface FiltroCitas extends FiltroPaginado {
  desde?: string;
  hasta?: string;
  odontologoId?: number;
  pacienteId?: number;
  estado?: EstadoCita[];
}

// ---------- Transporte ----------

export type Metodo = "GET" | "POST" | "PATCH" | "DELETE";
export type Query = Record<string, string | number | boolean | undefined | null>;

export interface Sobre<T> {
  data: T;
  meta?: MetaPaginacion;
}

function construirQuery(query?: Query): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [clave, valor] of Object.entries(query)) {
    if (valor === undefined || valor === null || valor === "") continue;
    params.set(clave, String(valor));
  }
  const texto = params.toString();
  return texto ? `?${texto}` : "";
}

async function solicitar<T>(metodo: Metodo, ruta: string, opciones: { query?: Query; body?: unknown } = {}): Promise<Sobre<T>> {
  let res: Response;
  try {
    res = await fetch(`/api${ruta}${construirQuery(opciones.query)}`, {
      method: metodo,
      headers: opciones.body === undefined ? undefined : { "Content-Type": "application/json" },
      body: opciones.body === undefined ? undefined : JSON.stringify(opciones.body),
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, { code: "ERROR_INTERNO", message: "No se pudo conectar con el servidor" });
  }

  const cuerpo: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    if (cuerpo && typeof cuerpo === "object" && "error" in cuerpo) {
      throw new ApiError(res.status, (cuerpo as CuerpoError).error);
    }
    throw new ApiError(res.status, { code: "ERROR_INTERNO", message: `Error ${res.status} al llamar a la API` });
  }
  return cuerpo as Sobre<T>;
}

async function obtener<T>(metodo: Metodo, ruta: string, opciones?: { query?: Query; body?: unknown }): Promise<T> {
  return (await solicitar<T>(metodo, ruta, opciones)).data;
}

async function paginar<T>(ruta: string, query: Query): Promise<Paginado<T>> {
  const sobre = await solicitar<T[]>("GET", ruta, { query });
  return {
    data: sobre.data,
    meta: sobre.meta ?? { page: 1, pageSize: sobre.data.length, total: sobre.data.length, totalPages: 1 },
  };
}

const activoQuery = (activo?: boolean) => (activo === undefined ? undefined : String(activo));

// ---------- Pacientes ----------

export function listPacientes(filtro: FiltroPaginado = {}) {
  return paginar<Paciente>("/pacientes", { q: filtro.q, page: filtro.page, pageSize: filtro.pageSize });
}

export function getPaciente(id: number) {
  return obtener<PacienteDetalle>("GET", `/pacientes/${id}`);
}

export function createPaciente(input: PacienteInput) {
  return obtener<Paciente>("POST", "/pacientes", { body: input });
}

export function updatePaciente(id: number, input: Partial<PacienteInput>) {
  return obtener<Paciente>("PATCH", `/pacientes/${id}`, { body: input });
}

export function deletePaciente(id: number) {
  return obtener<{ id: number }>("DELETE", `/pacientes/${id}`);
}

export function listCitasPaciente(id: number, estado?: EstadoCita) {
  return obtener<Cita[]>("GET", `/pacientes/${id}/citas`, { query: { estado } });
}

// ---------- Odontólogos ----------

export function listOdontologos(filtro: FiltroOdontologos = {}) {
  return paginar<Odontologo>("/odontologos", {
    q: filtro.q,
    page: filtro.page,
    pageSize: filtro.pageSize,
    activo: activoQuery(filtro.activo),
    especialidad: filtro.especialidad,
  });
}

export function getOdontologo(id: number) {
  return obtener<OdontologoDetalle>("GET", `/odontologos/${id}`);
}

export function createOdontologo(input: OdontologoInput) {
  return obtener<Odontologo>("POST", "/odontologos", { body: input });
}

export function updateOdontologo(id: number, input: Partial<OdontologoInput>) {
  return obtener<OdontologoDetalle>("PATCH", `/odontologos/${id}`, { body: input });
}

export function deleteOdontologo(id: number) {
  return obtener<{ id: number }>("DELETE", `/odontologos/${id}`);
}

// ---------- Tratamientos ----------

export function listTratamientos(filtro: FiltroTratamientos = {}) {
  return paginar<Tratamiento>("/tratamientos", {
    q: filtro.q,
    page: filtro.page,
    pageSize: filtro.pageSize,
    activo: activoQuery(filtro.activo),
  });
}

export function getTratamiento(id: number) {
  return obtener<TratamientoDetalle>("GET", `/tratamientos/${id}`);
}

export function createTratamiento(input: TratamientoInput) {
  return obtener<Tratamiento>("POST", "/tratamientos", { body: input });
}

export function updateTratamiento(id: number, input: Partial<TratamientoInput>) {
  return obtener<Tratamiento>("PATCH", `/tratamientos/${id}`, { body: input });
}

export function deleteTratamiento(id: number) {
  return obtener<{ id: number }>("DELETE", `/tratamientos/${id}`);
}

// ---------- Citas ----------

export function listCitas(filtro: FiltroCitas = {}) {
  return paginar<Cita>("/citas", {
    q: filtro.q,
    page: filtro.page,
    pageSize: filtro.pageSize,
    desde: filtro.desde,
    hasta: filtro.hasta,
    odontologoId: filtro.odontologoId,
    pacienteId: filtro.pacienteId,
    estado: filtro.estado?.length ? filtro.estado.join(",") : undefined,
  });
}

export function getCita(id: number) {
  return obtener<Cita>("GET", `/citas/${id}`);
}

export function createCita(input: CitaInput) {
  return obtener<Cita>("POST", "/citas", { body: input });
}

export function reprogramarCita(id: number, input: CitaReprogramarInput) {
  return obtener<Cita>("PATCH", `/citas/${id}`, { body: input });
}

export function deleteCita(id: number) {
  return obtener<{ id: number }>("DELETE", `/citas/${id}`);
}

export function cancelarCita(id: number, input: { motivoCancelacion?: string | null } = {}) {
  return obtener<Cita>("POST", `/citas/${id}/cancelar`, { body: input });
}

export function cambiarEstadoCita(id: number, input: CitaEstadoInput) {
  return obtener<Cita>("PATCH", `/citas/${id}/estado`, { body: input });
}

// ---------- Atención ----------

export function getAtencion(citaId: number) {
  return obtener<Atencion>("GET", `/citas/${citaId}/atencion`);
}

export function registrarAtencion(citaId: number, input: AtencionInput) {
  return obtener<Cita>("POST", `/citas/${citaId}/atencion`, { body: input });
}

export function updateAtencion(citaId: number, input: AtencionInput) {
  return obtener<Cita>("PATCH", `/citas/${citaId}/atencion`, { body: input });
}

// ---------- Tablero ----------

export function getTablero(fecha?: string) {
  return obtener<Tablero>("GET", "/tablero", { query: { fecha } });
}
