import { describe, expect, it } from "vitest";
import * as odontologo from "@/app/api/odontologos/[id]/route";
import * as odontologos from "@/app/api/odontologos/route";
import { HORARIO_MANANA, crearEscenario, crearOdontologo, llamar, reservar, type Registro } from "../helpers";

describe("API /api/odontologos (#8)", () => {
  it("crea un odontólogo con horarios (201)", async () => {
    const res = await llamar(odontologos.POST, "/api/odontologos", {
      metodo: "POST",
      body: { nombre: "Dra. Rojas", especialidad: "Ortodoncia", horarios: HORARIO_MANANA },
    });
    expect(res.status).toBe(201);
    expect(res.data).toMatchObject({ nombre: "Dra. Rojas", activo: true });
    expect(res.data.horarios).toHaveLength(5);
  });

  it("rechaza bloques de horario solapados o invertidos con 400 VALIDACION", async () => {
    const res = await llamar(odontologos.POST, "/api/odontologos", {
      metodo: "POST",
      body: {
        nombre: "Dr. Error",
        especialidad: "General",
        horarios: [
          { diaSemana: 1, horaInicio: "08:00", horaFin: "12:00" },
          { diaSemana: 1, horaInicio: "11:00", horaFin: "13:00" },
          { diaSemana: 2, horaInicio: "15:00", horaFin: "14:00" },
        ],
      },
    });
    expect(res.status).toBe(400);
    expect(res.error?.code).toBe("VALIDACION");
  });

  it("GET de un odontólogo inexistente → 404 NO_ENCONTRADO", async () => {
    const res = await llamar(odontologo.GET, "/api/odontologos/999999", { id: 999999 });
    expect(res.status).toBe(404);
    expect(res.error?.code).toBe("NO_ENCONTRADO");
  });

  it("actualiza datos y reemplaza el horario (200)", async () => {
    const o = await crearOdontologo();
    const res = await llamar(odontologo.PATCH, "/api/odontologos/x", {
      metodo: "PATCH",
      id: o.id,
      body: { especialidad: "Endodoncia", horarios: [{ diaSemana: 6, horaInicio: "09:00", horaFin: "13:00" }] },
    });
    expect(res.status).toBe(200);
    expect(res.data.especialidad).toBe("Endodoncia");
    expect(res.data.horarios).toEqual([expect.objectContaining({ diaSemana: 6, horaInicio: "09:00" })]);
  });

  it("elimina un odontólogo sin citas (200)", async () => {
    const o = await crearOdontologo();
    const res = await llamar(odontologo.DELETE, "/api/odontologos/x", { metodo: "DELETE", id: o.id });
    expect(res.status).toBe(200);
    expect((await llamar(odontologo.GET, "/api/odontologos/x", { id: o.id })).status).toBe(404);
  });

  it("no elimina un odontólogo con citas → 409 EN_USO", async () => {
    const e = await crearEscenario();
    await reservar({ ...e, horaInicio: "09:00" });
    const res = await llamar(odontologo.DELETE, "/api/odontologos/x", { metodo: "DELETE", id: e.odontologoId });
    expect(res.status).toBe(409);
    expect(res.error?.code).toBe("EN_USO");
  });

  it("un odontólogo inactivo no recibe citas → 422 INACTIVO", async () => {
    const e = await crearEscenario();
    await llamar(odontologo.PATCH, "/api/odontologos/x", { metodo: "PATCH", id: e.odontologoId, body: { activo: false } });
    const res = await reservar({ ...e, horaInicio: "09:00" });
    expect(res.status).toBe(422);
    expect(res.error?.code).toBe("INACTIVO");
  });

  it("listado con ?pageSize=100 (200, data array) y filtro ?q= por nombre o especialidad", async () => {
    await crearOdontologo({ nombre: "Dr. Vargas", especialidad: "Periodoncia" });
    await crearOdontologo({ nombre: "Dra. Flores", especialidad: "Ortodoncia" });

    const todos = await llamar<Registro[]>(odontologos.GET, "/api/odontologos?pageSize=100");
    expect(todos.status).toBe(200);
    expect(Array.isArray(todos.data)).toBe(true);
    expect(todos.meta).toMatchObject({ pageSize: 100, total: 2 });

    const filtrado = await llamar<Registro[]>(odontologos.GET, "/api/odontologos?q=perio");
    expect(filtrado.data.map((o) => o.nombre)).toEqual(["Dr. Vargas"]);
  });
});
