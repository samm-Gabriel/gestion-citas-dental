import { describe, expect, it } from "vitest";
import * as tratamiento from "@/app/api/tratamientos/[id]/route";
import * as tratamientos from "@/app/api/tratamientos/route";
import { crearEscenario, crearTratamiento, llamar, reservar, type Registro } from "../helpers";

describe("API /api/tratamientos (#8)", () => {
  it("crea un tratamiento válido (201)", async () => {
    const res = await llamar(tratamientos.POST, "/api/tratamientos", {
      metodo: "POST",
      body: { nombre: "Limpieza dental", duracionMinutos: 30, precio: 120.5 },
    });
    expect(res.status).toBe(201);
    expect(res.data).toMatchObject({ nombre: "Limpieza dental", duracionMinutos: 30, activo: true });
    expect(Number(res.data.precio)).toBe(120.5);
  });

  it("rechaza duración y precio inválidos con 400 VALIDACION", async () => {
    const res = await llamar(tratamientos.POST, "/api/tratamientos", {
      metodo: "POST",
      body: { nombre: "Mal", duracionMinutos: 3, precio: "-10" },
    });
    expect(res.status).toBe(400);
    expect(res.error?.code).toBe("VALIDACION");
    const campos = (res.error?.details as { campo: string }[]).map((d) => d.campo);
    expect(campos).toEqual(expect.arrayContaining(["duracionMinutos", "precio"]));
  });

  it("nombre único sin distinguir mayúsculas → 409 NOMBRE_DUPLICADO", async () => {
    await crearTratamiento(30, { nombre: "Extracción" });
    const res = await llamar(tratamientos.POST, "/api/tratamientos", {
      metodo: "POST",
      body: { nombre: "EXTRACCIÓN", duracionMinutos: 45, precio: "200" },
    });
    expect(res.status).toBe(409);
    expect(res.error?.code).toBe("NOMBRE_DUPLICADO");
  });

  it("GET de un tratamiento inexistente → 404 NO_ENCONTRADO", async () => {
    const res = await llamar(tratamiento.GET, "/api/tratamientos/999999", { id: 999999 });
    expect(res.status).toBe(404);
    expect(res.error?.code).toBe("NO_ENCONTRADO");
  });

  it("actualiza duración y precio (200)", async () => {
    const t = await crearTratamiento(30);
    const res = await llamar(tratamiento.PATCH, "/api/tratamientos/x", {
      metodo: "PATCH",
      id: t.id,
      body: { duracionMinutos: 90, precio: "300.00" },
    });
    expect(res.status).toBe(200);
    expect(res.data.duracionMinutos).toBe(90);
    expect(Number(res.data.precio)).toBe(300);
  });

  it("elimina un tratamiento sin citas (200) y no uno con citas (409 EN_USO)", async () => {
    const libre = await crearTratamiento();
    const ok = await llamar(tratamiento.DELETE, "/api/tratamientos/x", { metodo: "DELETE", id: libre.id });
    expect(ok.status).toBe(200);

    const e = await crearEscenario();
    await reservar({ ...e, horaInicio: "09:00" });
    const enUso = await llamar(tratamiento.DELETE, "/api/tratamientos/x", { metodo: "DELETE", id: e.tratamientoId });
    expect(enUso.status).toBe(409);
    expect(enUso.error?.code).toBe("EN_USO");
  });

  it("listado con ?q= filtra por nombre o descripción", async () => {
    await crearTratamiento(30, { nombre: "Blanqueamiento", descripcion: "Estética dental" });
    await crearTratamiento(60, { nombre: "Endodoncia" });
    const res = await llamar<Registro[]>(tratamientos.GET, "/api/tratamientos?q=estética");
    expect(res.status).toBe(200);
    expect(res.data.map((t) => t.nombre)).toEqual(["Blanqueamiento"]);
    expect(res.meta?.total).toBe(1);
  });
});
