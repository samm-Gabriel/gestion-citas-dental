import { describe, expect, it } from "vitest";
import * as cita from "@/app/api/citas/[id]/route";
import * as atencion from "@/app/api/citas/[id]/atencion/route";
import * as cancelar from "@/app/api/citas/[id]/cancelar/route";
import * as estado from "@/app/api/citas/[id]/estado/route";
import * as citas from "@/app/api/citas/route";
import {
  ayer,
  crearEscenario,
  crearOdontologo,
  crearPaciente,
  llamar,
  proximoDia,
  reservar,
  type Registro,
} from "../helpers";

describe("API /api/citas (#8)", () => {
  it("crea una cita válida (201) con horaFin calculada según la duración del tratamiento", async () => {
    const e = await crearEscenario(45);
    const res = await reservar({ ...e, horaInicio: "09:00", motivo: "Control" });
    expect(res.status).toBe(201);
    expect(res.data).toMatchObject({
      fecha: e.fecha,
      horaInicio: "09:00",
      horaFin: "09:45",
      estado: "PENDIENTE",
      motivo: "Control",
    });
  });

  it("rechaza datos inválidos con 400 VALIDACION y detalle por campo", async () => {
    const e = await crearEscenario();
    const res = await reservar({ ...e, fecha: "2026-13-40", horaInicio: "9am" });
    expect(res.status).toBe(400);
    expect(res.error?.code).toBe("VALIDACION");
    const campos = (res.error?.details as { campo: string }[]).map((d) => d.campo);
    expect(campos).toEqual(expect.arrayContaining(["fecha", "horaInicio"]));
  });

  it("rechaza un cuerpo que no es JSON con 400 JSON_INVALIDO", async () => {
    const res = await llamar(citas.POST, "/api/citas", { metodo: "POST", body: "{no-json" });
    expect(res.status).toBe(400);
    expect(res.error?.code).toBe("JSON_INVALIDO");
  });

  it("devuelve 404 si el paciente no existe", async () => {
    const e = await crearEscenario();
    const res = await reservar({ ...e, pacienteId: 999999, horaInicio: "09:00" });
    expect(res.status).toBe(404);
    expect(res.error?.code).toBe("NO_ENCONTRADO");
  });

  describe("choques de horario (considerando la duración)", () => {
    it("misma hora con el mismo odontólogo → 409 CHOQUE_HORARIO", async () => {
      const e = await crearEscenario(60);
      expect((await reservar({ ...e, horaInicio: "09:00" })).status).toBe(201);
      const otro = await crearPaciente();
      const res = await reservar({ ...e, pacienteId: otro.id, horaInicio: "09:00" });
      expect(res.status).toBe(409);
      expect(res.error?.code).toBe("CHOQUE_HORARIO");
      expect(res.error?.details).toMatchObject({ horaInicio: "09:00", horaFin: "10:00" });
    });

    it("empieza dentro de una cita existente de 60 min (09:30 vs 09:00-10:00) → 409", async () => {
      const e = await crearEscenario(60);
      expect((await reservar({ ...e, horaInicio: "09:00" })).status).toBe(201);
      const res = await reservar({ ...e, horaInicio: "09:30" });
      expect(res.status).toBe(409);
      expect(res.error?.code).toBe("CHOQUE_HORARIO");
    });

    it("la nueva cita de 60 min se extiende sobre una existente (08:30-09:30 vs 09:00) → 409", async () => {
      const e = await crearEscenario(60);
      expect((await reservar({ ...e, horaInicio: "09:00" })).status).toBe(201);
      const res = await reservar({ ...e, horaInicio: "08:30" });
      expect(res.status).toBe(409);
      expect(res.error?.code).toBe("CHOQUE_HORARIO");
    });

    it("una cita que empieza justo cuando termina la anterior (10:00 tras 09:00-10:00) → 201", async () => {
      const e = await crearEscenario(60);
      expect((await reservar({ ...e, horaInicio: "09:00" })).status).toBe(201);
      const res = await reservar({ ...e, horaInicio: "10:00" });
      expect(res.status).toBe(201);
      expect(res.data).toMatchObject({ horaInicio: "10:00", horaFin: "11:00" });
    });

    it("el mismo horario con otro odontólogo no choca → 201", async () => {
      const e = await crearEscenario(60);
      expect((await reservar({ ...e, horaInicio: "09:00" })).status).toBe(201);
      const otro = await crearOdontologo();
      const res = await reservar({ ...e, odontologoId: otro.id, horaInicio: "09:00" });
      expect(res.status).toBe(201);
    });
  });

  it("rechaza una cita en el pasado con 422 CITA_EN_PASADO", async () => {
    const e = await crearEscenario();
    const res = await reservar({ ...e, fecha: ayer(), horaInicio: "09:00" });
    expect(res.status).toBe(422);
    expect(res.error?.code).toBe("CITA_EN_PASADO");
  });

  describe("fuera del horario del odontólogo", () => {
    it("en un día que no atiende (domingo) → 422 FUERA_DE_HORARIO", async () => {
      const e = await crearEscenario();
      const res = await reservar({ ...e, fecha: proximoDia([0]), horaInicio: "09:00" });
      expect(res.status).toBe(422);
      expect(res.error?.code).toBe("FUERA_DE_HORARIO");
    });

    it("después de la hora de cierre (12:30 con horario 08:00-12:00) → 422", async () => {
      const e = await crearEscenario();
      const res = await reservar({ ...e, horaInicio: "12:30" });
      expect(res.status).toBe(422);
      expect(res.error?.code).toBe("FUERA_DE_HORARIO");
    });

    it("empieza dentro pero la duración la saca del horario (11:30 + 60 min) → 422", async () => {
      const e = await crearEscenario(60);
      const res = await reservar({ ...e, horaInicio: "11:30" });
      expect(res.status).toBe(422);
      expect(res.error?.code).toBe("FUERA_DE_HORARIO");
    });
  });

  describe("cancelación", () => {
    it("cancela (200, CANCELADA) y libera el horario para otra cita (201)", async () => {
      const e = await crearEscenario(60);
      const original = await reservar({ ...e, horaInicio: "09:00" });
      const res = await llamar(cancelar.POST, `/api/citas/${original.data.id}/cancelar`, {
        metodo: "POST",
        id: original.data.id,
        body: { motivoCancelacion: "El paciente no puede asistir" },
      });
      expect(res.status).toBe(200);
      expect(res.data).toMatchObject({ estado: "CANCELADA", motivoCancelacion: "El paciente no puede asistir" });

      const otro = await crearPaciente();
      const nueva = await reservar({ ...e, pacienteId: otro.id, horaInicio: "09:00" });
      expect(nueva.status).toBe(201);
    });

    it("no permite cancelar una cita ATENDIDA → 422 ESTADO_INVALIDO", async () => {
      const e = await crearEscenario();
      const c = await reservar({ ...e, horaInicio: "09:00" });
      await llamar(atencion.POST, "/api/citas/x/atencion", {
        metodo: "POST",
        id: c.data.id,
        body: { diagnostico: "Caries" },
      });
      const res = await llamar(cancelar.POST, "/api/citas/x/cancelar", { metodo: "POST", id: c.data.id });
      expect(res.status).toBe(422);
      expect(res.error?.code).toBe("ESTADO_INVALIDO");
    });
  });

  describe("reprogramación (PATCH /api/citas/:id)", () => {
    it("reprograma (200), recalcula horaFin y libera el horario anterior", async () => {
      const e = await crearEscenario(60);
      const c = await reservar({ ...e, horaInicio: "09:00" });
      const res = await llamar(cita.PATCH, "/api/citas/x", {
        metodo: "PATCH",
        id: c.data.id,
        body: { horaInicio: "10:30" },
      });
      expect(res.status).toBe(200);
      expect(res.data).toMatchObject({ fecha: e.fecha, horaInicio: "10:30", horaFin: "11:30" });

      const otro = await crearPaciente();
      expect((await reservar({ ...e, pacienteId: otro.id, horaInicio: "09:00" })).status).toBe(201);
    });

    it("no reprograma sobre un horario ocupado → 409 CHOQUE_HORARIO", async () => {
      const e = await crearEscenario(60);
      await reservar({ ...e, horaInicio: "09:00" });
      const otro = await crearPaciente();
      const c = await reservar({ ...e, pacienteId: otro.id, horaInicio: "11:00" });
      const res = await llamar(cita.PATCH, "/api/citas/x", {
        metodo: "PATCH",
        id: c.data.id,
        body: { horaInicio: "09:30" },
      });
      expect(res.status).toBe(409);
      expect(res.error?.code).toBe("CHOQUE_HORARIO");
    });

    it("mover la cita dentro de su propio horario no choca consigo misma → 200", async () => {
      const e = await crearEscenario(60);
      const c = await reservar({ ...e, horaInicio: "09:00" });
      const res = await llamar(cita.PATCH, "/api/citas/x", {
        metodo: "PATCH",
        id: c.data.id,
        body: { horaInicio: "09:30" },
      });
      expect(res.status).toBe(200);
      expect(res.data).toMatchObject({ horaInicio: "09:30", horaFin: "10:30" });
    });
  });

  describe("atención y estados", () => {
    it("registra la atención (201) y deja la cita ATENDIDA; una segunda atención da 409", async () => {
      const e = await crearEscenario();
      const c = await reservar({ ...e, horaInicio: "09:00" });
      const res = await llamar(atencion.POST, "/api/citas/x/atencion", {
        metodo: "POST",
        id: c.data.id,
        body: { diagnostico: "Caries en pieza 16", tratamientoRealizado: "Obturación" },
      });
      expect(res.status).toBe(201);
      expect(res.data.estado).toBe("ATENDIDA");
      expect(res.data.atencion).toMatchObject({ diagnostico: "Caries en pieza 16" });

      const repetida = await llamar(atencion.POST, "/api/citas/x/atencion", {
        metodo: "POST",
        id: c.data.id,
        body: { observaciones: "otra" },
      });
      expect(repetida.status).toBe(409);
    });

    it("confirma una cita pendiente con PATCH /estado → 200 CONFIRMADA", async () => {
      const e = await crearEscenario();
      const c = await reservar({ ...e, horaInicio: "09:00" });
      const res = await llamar(estado.PATCH, "/api/citas/x/estado", {
        metodo: "PATCH",
        id: c.data.id,
        body: { estado: "CONFIRMADA" },
      });
      expect(res.status).toBe(200);
      expect(res.data.estado).toBe("CONFIRMADA");
    });
  });

  describe("consulta y eliminación", () => {
    it("GET de una cita inexistente → 404 NO_ENCONTRADO", async () => {
      const res = await llamar(cita.GET, "/api/citas/999999", { id: 999999 });
      expect(res.status).toBe(404);
      expect(res.error?.code).toBe("NO_ENCONTRADO");
    });

    it("GET con id no numérico → 400 VALIDACION", async () => {
      const res = await llamar(cita.GET, "/api/citas/abc", { id: "abc" });
      expect(res.status).toBe(400);
      expect(res.error?.code).toBe("VALIDACION");
    });

    it("DELETE elimina una cita pendiente (200) y luego GET da 404", async () => {
      const e = await crearEscenario();
      const c = await reservar({ ...e, horaInicio: "09:00" });
      const res = await llamar(cita.DELETE, "/api/citas/x", { metodo: "DELETE", id: c.data.id });
      expect(res.status).toBe(200);
      expect((await llamar(cita.GET, "/api/citas/x", { id: c.data.id })).status).toBe(404);
    });

    it("listado con ?q= filtra por apellido del paciente y ?estado= por estado", async () => {
      const e = await crearEscenario(30);
      const zu = await crearPaciente({ apellido: "Zubieta" });
      await reservar({ ...e, horaInicio: "08:00" });
      const c2 = await reservar({ ...e, pacienteId: zu.id, horaInicio: "09:00" });

      const porNombre = await llamar<Registro[]>(citas.GET, "/api/citas?q=zubi");
      expect(porNombre.status).toBe(200);
      expect(porNombre.data.map((c) => c.id)).toEqual([c2.data.id]);
      expect(porNombre.meta?.total).toBe(1);

      await llamar(cancelar.POST, "/api/citas/x/cancelar", { metodo: "POST", id: c2.data.id });
      const canceladas = await llamar<Registro[]>(citas.GET, "/api/citas?estado=CANCELADA");
      expect(canceladas.data.map((c) => c.id)).toEqual([c2.data.id]);
    });
  });
});
