import { describe, expect, it } from "vitest";
import * as tablero from "@/app/api/tablero/route";
import { crearEscenario, hoy, llamar, reservar } from "../helpers";

describe("API /api/tablero (#8)", () => {
  it("GET /api/tablero responde 200 con los indicadores del día de hoy", async () => {
    const res = await llamar(tablero.GET, "/api/tablero");
    expect(res.status).toBe(200);
    expect(res.data).toMatchObject({ fecha: hoy() });
    expect(res.data).toHaveProperty("citasHoy.porEstado");
    expect(res.data).toHaveProperty("citasSemana.porOdontologo");
    expect(res.data).toHaveProperty("pacientesNuevosMes.total");
  });

  it("?fecha= cuenta las citas de ese día por estado", async () => {
    const e = await crearEscenario(30);
    await reservar({ ...e, horaInicio: "08:00" });
    await reservar({ ...e, horaInicio: "09:00" });
    const res = await llamar(tablero.GET, `/api/tablero?fecha=${e.fecha}`);
    expect(res.status).toBe(200);
    expect(res.data).toMatchObject({
      fecha: e.fecha,
      citasHoy: { total: 2, porEstado: { PENDIENTE: 2, CONFIRMADA: 0, ATENDIDA: 0, CANCELADA: 0 } },
    });
  });

  it("?fecha= inválida → 400 VALIDACION", async () => {
    const res = await llamar(tablero.GET, "/api/tablero?fecha=28-10-2026");
    expect(res.status).toBe(400);
    expect(res.error?.code).toBe("VALIDACION");
  });
});
