import type {
  Atencion,
  Cita,
  CodigoError,
  CuerpoError,
  EstadoCita,
  HorarioAtencion,
  MetaPaginacion,
  Metodo,
  Odontologo,
  Paciente,
  Query,
  Tablero,
  Tratamiento,
} from "./api";
import { diaSemanaDeFecha, finMes, hoyLocal, horaAMinutos, inicioMes, inicioSemana, instanteLocal, minutosAHora, sumarDias } from "./fechas";

/** Datos en memoria para trabajar la UI sin base de datos (NEXT_PUBLIC_USE_MOCKS="1"). */

const AHORA = new Date().toISOString();
const HOY = hoyLocal();

const pacientes: Paciente[] = [
  ["Juan Carlos", "Pérez Flores", "4567891", "+591 71234567", "jcperez@gmail.com", "1985-03-14"],
  ["Ana Lucía", "Torrez Mendoza", "6789123", "+591 76543210", "ana.torrez@hotmail.com", "1992-07-22"],
  ["Luis Fernando", "Quispe Mamani", "5123987", "+591 70011223", null, "1978-11-02"],
  ["María José", "Rojas Vargas", "8456123-1A", "+591 72233445", "mjrojas@gmail.com", null],
].map(([nombre, apellido, ci, telefono, email, fechaNacimiento], i) => ({
  id: i + 1,
  nombre: nombre as string,
  apellido: apellido as string,
  ci: ci as string,
  telefono: telefono as string,
  email,
  fechaNacimiento: fechaNacimiento ? `${fechaNacimiento}T00:00:00.000Z` : null,
  createdAt: AHORA,
  updatedAt: AHORA,
}));

function horarios(odontologoId: number, bloques: [number, string, string][]): HorarioAtencion[] {
  return bloques.map(([diaSemana, horaInicio, horaFin], i) => ({
    id: odontologoId * 100 + i,
    odontologoId,
    diaSemana,
    horaInicio,
    horaFin,
    createdAt: AHORA,
    updatedAt: AHORA,
  }));
}

const odontologos: Odontologo[] = [
  { id: 1, nombre: "Dra. María Fernanda Quiroga", especialidad: "Odontología general", activo: true, horarios: horarios(1, [[1, "08:00", "12:00"], [1, "14:00", "18:00"], [3, "08:00", "12:00"], [5, "08:00", "12:00"]]) },
  { id: 2, nombre: "Dr. Carlos Mamani Choque", especialidad: "Endodoncia", activo: true, horarios: horarios(2, [[2, "09:00", "13:00"], [4, "15:00", "19:00"]]) },
  { id: 3, nombre: "Dra. Paola Salvatierra", especialidad: "Ortodoncia", activo: false, horarios: [] },
].map((o) => ({ ...o, createdAt: AHORA, updatedAt: AHORA }));

const tratamientos: Tratamiento[] = [
  ["Consulta y diagnóstico", "Evaluación inicial, odontograma y plan de tratamiento", 30, "100"],
  ["Limpieza dental", "Profilaxis y eliminación de sarro", 45, "180"],
  ["Obturación con resina", "Restauración estética de una pieza con caries", 60, "250"],
  ["Endodoncia unirradicular", null, 90, "850.5"],
].map(([nombre, descripcion, duracionMinutos, precio], i) => ({
  id: i + 1,
  nombre: nombre as string,
  descripcion: descripcion as string | null,
  duracionMinutos: duracionMinutos as number,
  precio: precio as string,
  activo: true,
  createdAt: AHORA,
  updatedAt: AHORA,
}));

const atenciones: Atencion[] = [];
const citas: Cita[] = [];

function construirCita(id: number, pacienteId: number, odontologoId: number, tratamientoId: number, fecha: string, horaInicio: string, estado: EstadoCita, motivo: string | null = null): Cita {
  const duracion = tratamientos.find((t) => t.id === tratamientoId)?.duracionMinutos ?? 30;
  const horaFin = minutosAHora(horaAMinutos(horaInicio) + duracion);
  return {
    id,
    pacienteId,
    odontologoId,
    tratamientoId,
    inicio: instanteLocal(fecha, horaInicio).toISOString(),
    fin: instanteLocal(fecha, horaFin).toISOString(),
    estado,
    motivo,
    motivoCancelacion: null,
    createdAt: AHORA,
    updatedAt: AHORA,
    fecha,
    horaInicio,
    horaFin,
  };
}

[
  [1, 1, 1, 0, "08:30", "CONFIRMADA", "Control semestral"],
  [2, 2, 3, 0, "10:00", "PENDIENTE", "Dolor en muela inferior izquierda"],
  [3, 3, 2, 0, "15:00", "CANCELADA", null],
  [4, 2, 4, 1, "09:00", "PENDIENTE", null],
  [1, 1, 2, -7, "08:00", "ATENDIDA", null],
  [4, 1, 1, 2, "11:00", "CONFIRMADA", "Primera visita"],
].forEach(([pacienteId, odontologoId, tratamientoId, dias, hora, estado, motivo], i) => {
  citas.push(construirCita(i + 1, pacienteId as number, odontologoId as number, tratamientoId as number, sumarDias(HOY, dias as number), hora as string, estado as EstadoCita, motivo as string | null));
});
atenciones.push({ id: 1, citaId: 5, diagnostico: "Gingivitis leve", tratamientoRealizado: "Limpieza con ultrasonido", observaciones: "Control en 6 meses", createdAt: AHORA, updatedAt: AHORA });

// ---------- Utilidades ----------

type RespuestaMock = { status: number; cuerpo: { data: unknown; meta?: MetaPaginacion } | CuerpoError };

const ok = (data: unknown, status = 200): RespuestaMock => ({ status, cuerpo: { data } });
const falla = (status: number, code: CodigoError, message: string): RespuestaMock => ({ status, cuerpo: { error: { code, message } } });

function paginar<T>(items: T[], query: Query, porDefecto = 20): RespuestaMock {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.max(1, Number(query.pageSize) || porDefecto);
  const total = items.length;
  return {
    status: 200,
    cuerpo: {
      data: items.slice((page - 1) * pageSize, page * pageSize),
      meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    },
  };
}

const normalizar = (texto: string) => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function coincide(q: Query[string], ...campos: (string | null | undefined)[]) {
  if (!q) return true;
  const texto = normalizar(campos.filter(Boolean).join(" "));
  return normalizar(String(q)).split(/\s+/).every((palabra) => texto.includes(palabra));
}

function filtroActivo(activo: Query[string]) {
  return (item: { activo: boolean }) => activo === undefined || String(item.activo) === String(activo);
}

const odontologoBase = (o: Odontologo) => ({ id: o.id, nombre: o.nombre, especialidad: o.especialidad, activo: o.activo, createdAt: o.createdAt, updatedAt: o.updatedAt });

function citaCompleta(cita: Cita): Cita {
  const odontologo = odontologos.find((o) => o.id === cita.odontologoId);
  return {
    ...cita,
    paciente: pacientes.find((p) => p.id === cita.pacienteId),
    odontologo: odontologo ? odontologoBase(odontologo) : undefined,
    tratamiento: tratamientos.find((t) => t.id === cita.tratamientoId),
    atencion: atenciones.find((a) => a.citaId === cita.id) ?? null,
  };
}

const ordenarCitas = (a: Cita, b: Cita) => a.inicio.localeCompare(b.inicio);
const siguienteId = (items: { id: number }[]) => Math.max(0, ...items.map((i) => i.id)) + 1;

type Cuerpo = Record<string, unknown>;

function reservar(cuerpo: Cuerpo, existente?: Cita): RespuestaMock | Cita {
  const pacienteId = Number(cuerpo.pacienteId ?? existente?.pacienteId);
  const odontologoId = Number(cuerpo.odontologoId ?? existente?.odontologoId);
  const tratamientoId = Number(cuerpo.tratamientoId ?? existente?.tratamientoId);
  const fecha = String(cuerpo.fecha ?? existente?.fecha ?? "");
  const horaInicio = String(cuerpo.horaInicio ?? existente?.horaInicio ?? "");
  const odontologo = odontologos.find((o) => o.id === odontologoId);
  const tratamiento = tratamientos.find((t) => t.id === tratamientoId);
  if (!pacientes.some((p) => p.id === pacienteId) || !odontologo || !tratamiento) {
    return falla(404, "NO_ENCONTRADO", "El paciente, odontólogo o tratamiento no existe");
  }
  if (!odontologo.activo || !tratamiento.activo) return falla(422, "INACTIVO", "El odontólogo o el tratamiento está inactivo");
  const cita = construirCita(existente?.id ?? siguienteId(citas), pacienteId, odontologoId, tratamientoId, fecha, horaInicio, existente?.estado ?? "PENDIENTE");
  if (new Date(cita.inicio) < new Date()) return falla(422, "CITA_EN_PASADO", "No se puede agendar una cita en el pasado");
  const dia = diaSemanaDeFecha(fecha);
  const cabe = odontologo.horarios.some((h) => h.diaSemana === dia && h.horaInicio <= cita.horaInicio && cita.horaFin <= h.horaFin);
  if (!cabe) return falla(422, "FUERA_DE_HORARIO", `La cita ${cita.horaInicio}-${cita.horaFin} no cabe en el horario de ${odontologo.nombre} ese día`);
  const choque = citas.find((c) => c.id !== cita.id && c.odontologoId === odontologoId && c.estado !== "CANCELADA" && c.inicio < cita.fin && cita.inicio < c.fin);
  if (choque) return falla(409, "CHOQUE_HORARIO", `Choca con otra cita de ${choque.horaInicio} a ${choque.horaFin}`);
  cita.motivo = (cuerpo.motivo as string | null | undefined) ?? existente?.motivo ?? null;
  return cita;
}

function tablero(fecha: string): Tablero {
  const delDia = citas.filter((c) => c.fecha === fecha).sort(ordenarCitas).map(citaCompleta);
  const porEstado = { PENDIENTE: 0, CONFIRMADA: 0, ATENDIDA: 0, CANCELADA: 0 };
  delDia.forEach((c) => porEstado[c.estado]++);
  const desde = inicioSemana(fecha);
  const hasta = sumarDias(desde, 6);
  const semana = citas.filter((c) => c.fecha >= desde && c.fecha <= hasta && c.estado !== "CANCELADA").sort(ordenarCitas);
  return {
    fecha,
    citasHoy: { fecha, total: delDia.length, porEstado, citas: delDia },
    citasSemana: {
      desde,
      hasta,
      total: semana.length,
      porOdontologo: odontologos
        .filter((o) => o.activo || semana.some((c) => c.odontologoId === o.id))
        .map((o) => {
          const propias = semana.filter((c) => c.odontologoId === o.id).map((c) => ({ ...citaCompleta(c), atencion: undefined }));
          return { odontologo: { id: o.id, nombre: o.nombre, especialidad: o.especialidad }, citas: propias, total: propias.length };
        }),
    },
    pacientesNuevosMes: {
      desde: inicioMes(fecha),
      hasta: finMes(fecha),
      total: pacientes.filter((p) => p.createdAt.slice(0, 7) === fecha.slice(0, 7)).length,
      pacientes: pacientes.filter((p) => p.createdAt.slice(0, 7) === fecha.slice(0, 7)),
    },
  };
}

// ---------- Enrutador ----------

export function responderMock(metodo: Metodo, ruta: string, query: Query, body: unknown): RespuestaMock {
  const cuerpo = (body ?? {}) as Cuerpo;
  const [, recurso, idTexto, accion] = ruta.split("/");
  const id = Number(idTexto);
  const ahora = new Date().toISOString();

  if (recurso === "tablero") return ok(tablero(String(query.fecha || hoyLocal())));

  if (recurso === "pacientes") {
    if (!idTexto) {
      if (metodo === "GET") {
        const lista = pacientes.filter((p) => coincide(query.q, p.nombre, p.apellido, p.ci)).sort((a, b) => a.apellido.localeCompare(b.apellido));
        return paginar(lista, query);
      }
      const ci = String(cuerpo.ci ?? "").toUpperCase();
      if (pacientes.some((p) => p.ci === ci)) return falla(409, "CI_DUPLICADO", `Ya existe un paciente con CI ${ci}`);
      const nuevo: Paciente = {
        id: siguienteId(pacientes),
        nombre: String(cuerpo.nombre),
        apellido: String(cuerpo.apellido),
        ci,
        telefono: String(cuerpo.telefono),
        email: (cuerpo.email as string) || null,
        fechaNacimiento: cuerpo.fechaNacimiento ? `${cuerpo.fechaNacimiento}T00:00:00.000Z` : null,
        createdAt: ahora,
        updatedAt: ahora,
      };
      pacientes.push(nuevo);
      return ok(nuevo, 201);
    }
    const paciente = pacientes.find((p) => p.id === id);
    if (!paciente) return falla(404, "NO_ENCONTRADO", "No existe el paciente");
    const propias = citas.filter((c) => c.pacienteId === id);
    if (accion === "citas") {
      const lista = propias.filter((c) => !query.estado || c.estado === query.estado).sort((a, b) => ordenarCitas(b, a));
      return ok(lista.map((c) => ({ ...citaCompleta(c), paciente: undefined })));
    }
    if (metodo === "GET") return ok({ ...paciente, _count: { citas: propias.length } });
    if (metodo === "DELETE") {
      if (propias.length) return falla(409, "EN_USO", `No se puede eliminar al paciente porque tiene ${propias.length} cita(s) registrada(s)`);
      pacientes.splice(pacientes.indexOf(paciente), 1);
      return ok({ id });
    }
    Object.assign(paciente, cuerpo, {
      ci: cuerpo.ci ? String(cuerpo.ci).toUpperCase() : paciente.ci,
      fechaNacimiento: "fechaNacimiento" in cuerpo ? (cuerpo.fechaNacimiento ? `${cuerpo.fechaNacimiento}T00:00:00.000Z` : null) : paciente.fechaNacimiento,
      updatedAt: ahora,
    });
    return ok(paciente);
  }

  if (recurso === "odontologos") {
    const conHorarios = (odontologoId: number, entrada: unknown) =>
      horarios(odontologoId, ((entrada ?? []) as HorarioAtencion[]).map((h) => [h.diaSemana, h.horaInicio, h.horaFin]));
    if (!idTexto) {
      if (metodo === "GET") {
        const lista = odontologos
          .filter(filtroActivo(query.activo))
          .filter((o) => coincide(query.q, o.nombre, o.especialidad) && coincide(query.especialidad, o.especialidad))
          .sort((a, b) => a.nombre.localeCompare(b.nombre));
        return paginar(lista, query);
      }
      const nuevoId = siguienteId(odontologos);
      const nuevo: Odontologo = {
        id: nuevoId,
        nombre: String(cuerpo.nombre),
        especialidad: String(cuerpo.especialidad),
        activo: cuerpo.activo !== false,
        horarios: conHorarios(nuevoId, cuerpo.horarios),
        createdAt: ahora,
        updatedAt: ahora,
      };
      odontologos.push(nuevo);
      return ok(nuevo, 201);
    }
    const odontologo = odontologos.find((o) => o.id === id);
    if (!odontologo) return falla(404, "NO_ENCONTRADO", "No existe el odontólogo");
    const total = citas.filter((c) => c.odontologoId === id).length;
    if (metodo === "DELETE") {
      if (total) return falla(409, "EN_USO", `No se puede eliminar al odontólogo porque tiene ${total} cita(s) registrada(s); desactívalo con activo=false`);
      odontologos.splice(odontologos.indexOf(odontologo), 1);
      return ok({ id });
    }
    if (metodo === "PATCH") {
      Object.assign(odontologo, cuerpo, { horarios: "horarios" in cuerpo ? conHorarios(id, cuerpo.horarios) : odontologo.horarios, updatedAt: ahora });
    }
    return ok({ ...odontologo, _count: { citas: total } });
  }

  if (recurso === "tratamientos") {
    if (!idTexto) {
      if (metodo === "GET") {
        const lista = tratamientos.filter(filtroActivo(query.activo)).filter((t) => coincide(query.q, t.nombre, t.descripcion)).sort((a, b) => a.nombre.localeCompare(b.nombre));
        return paginar(lista, query);
      }
      if (tratamientos.some((t) => normalizar(t.nombre) === normalizar(String(cuerpo.nombre)))) {
        return falla(409, "NOMBRE_DUPLICADO", `Ya existe un tratamiento llamado ${cuerpo.nombre}`);
      }
      const nuevo: Tratamiento = {
        id: siguienteId(tratamientos),
        nombre: String(cuerpo.nombre),
        descripcion: (cuerpo.descripcion as string) || null,
        duracionMinutos: Number(cuerpo.duracionMinutos),
        precio: String(Number(cuerpo.precio)),
        activo: cuerpo.activo !== false,
        createdAt: ahora,
        updatedAt: ahora,
      };
      tratamientos.push(nuevo);
      return ok(nuevo, 201);
    }
    const tratamiento = tratamientos.find((t) => t.id === id);
    if (!tratamiento) return falla(404, "NO_ENCONTRADO", "No existe el tratamiento");
    const total = citas.filter((c) => c.tratamientoId === id).length;
    if (metodo === "DELETE") {
      if (total) return falla(409, "EN_USO", `No se puede eliminar el tratamiento porque tiene ${total} cita(s); desactívalo con activo=false`);
      tratamientos.splice(tratamientos.indexOf(tratamiento), 1);
      return ok({ id });
    }
    if (metodo === "PATCH") {
      Object.assign(tratamiento, cuerpo, { precio: cuerpo.precio === undefined ? tratamiento.precio : String(Number(cuerpo.precio)), updatedAt: ahora });
      return ok(tratamiento);
    }
    return ok({ ...tratamiento, _count: { citas: total } });
  }

  if (recurso === "citas") {
    if (!idTexto) {
      if (metodo === "GET") {
        const estados = query.estado ? String(query.estado).toUpperCase().split(",") : null;
        const lista = citas
          .filter((c) => (!query.desde || c.fecha >= String(query.desde)) && (!query.hasta || c.fecha <= String(query.hasta)))
          .filter((c) => (!query.odontologoId || c.odontologoId === Number(query.odontologoId)) && (!query.pacienteId || c.pacienteId === Number(query.pacienteId)))
          .filter((c) => !estados || estados.includes(c.estado))
          .map(citaCompleta)
          .filter((c) => coincide(query.q, c.paciente?.nombre, c.paciente?.apellido, c.paciente?.ci, c.odontologo?.nombre, c.tratamiento?.nombre))
          .sort(ordenarCitas);
        return paginar(lista, query, 50);
      }
      const resultado = reservar(cuerpo);
      if ("status" in resultado) return resultado;
      citas.push(resultado);
      return ok(citaCompleta(resultado), 201);
    }
    const cita = citas.find((c) => c.id === id);
    if (!cita) return falla(404, "NO_ENCONTRADO", "No existe la cita");
    const final = cita.estado === "CANCELADA" || cita.estado === "ATENDIDA";

    if (accion === "cancelar" || (accion === "estado" && cuerpo.estado === "CANCELADA")) {
      if (cita.estado === "ATENDIDA") return falla(422, "ESTADO_INVALIDO", "Una cita atendida no puede cancelarse");
      Object.assign(cita, { estado: "CANCELADA", motivoCancelacion: (cuerpo.motivoCancelacion as string) || null, updatedAt: ahora });
      return ok(citaCompleta(cita));
    }
    if (accion === "estado") {
      if (final && cita.estado !== cuerpo.estado) return falla(422, "ESTADO_INVALIDO", `Una cita ${cita.estado.toLowerCase()} no puede cambiar de estado`);
      Object.assign(cita, { estado: cuerpo.estado, motivoCancelacion: null, updatedAt: ahora });
      return ok(citaCompleta(cita));
    }
    if (accion === "atencion") {
      const atencion = atenciones.find((a) => a.citaId === id);
      if (metodo === "GET") return atencion ? ok(atencion) : falla(404, "NO_ENCONTRADO", "La cita todavía no tiene una atención registrada");
      if (metodo === "POST") {
        if (atencion) return falla(409, "CONFLICTO", "La cita ya tiene una atención registrada; usa PATCH para modificarla");
        if (cita.estado === "CANCELADA") return falla(422, "ESTADO_INVALIDO", "No se puede registrar la atención de una cita cancelada");
        atenciones.push({ id: siguienteId(atenciones), citaId: id, diagnostico: null, tratamientoRealizado: null, observaciones: null, ...cuerpo, createdAt: ahora, updatedAt: ahora });
        Object.assign(cita, { estado: "ATENDIDA", updatedAt: ahora });
        return ok(citaCompleta(cita), 201);
      }
      if (!atencion) return falla(404, "NO_ENCONTRADO", "La cita todavía no tiene una atención registrada");
      Object.assign(atencion, cuerpo, { updatedAt: ahora });
      return ok(citaCompleta(cita));
    }
    if (metodo === "GET") return ok(citaCompleta(cita));
    if (metodo === "DELETE") {
      if (cita.estado === "ATENDIDA") return falla(422, "ESTADO_INVALIDO", "No se puede eliminar una cita atendida porque tiene una atención registrada");
      citas.splice(citas.indexOf(cita), 1);
      return ok({ id });
    }
    if (final) return falla(422, "ESTADO_INVALIDO", `No se puede reprogramar una cita ${cita.estado.toLowerCase()}`);
    const resultado = reservar(cuerpo, cita);
    if ("status" in resultado) return resultado;
    Object.assign(cita, resultado, { updatedAt: ahora });
    return ok(citaCompleta(cita));
  }

  return falla(404, "NO_ENCONTRADO", `Ruta simulada desconocida: ${metodo} ${ruta}`);
}
