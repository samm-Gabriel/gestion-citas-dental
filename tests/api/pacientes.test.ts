import { describe, expect, it } from "vitest";
import * as historial from "@/app/api/pacientes/[id]/citas/route";
import * as paciente from "@/app/api/pacientes/[id]/route";
import * as pacientes from "@/app/api/pacientes/route";
import { crearEscenario, crearPaciente, llamar, reservar, type Registro } from "../helpers";

const valido = { nombre: "María", apellido: "Quispe", ci: "4567890-1a", telefono: "+591 71234567" };

describe("API /api/pacientes (#8)", () => {
  it("crea un paciente válido (201) y normaliza el CI a mayúsculas", async () => {
    const res = await llamar(pacientes.POST, "/api/pacientes", { metodo: "POST", body: valido });
    expect(res.status).toBe(201);
    expect(res.data).toMatchObject({ nombre: "María", apellido: "Quispe", ci: "4567890-1A", email: null });
    expect(typeof res.data.id).toBe("number");
  });

  it("rechaza datos inválidos con 400 VALIDACION", async () => {
    const res = await llamar(pacientes.POST, "/api/pacientes", {
      metodo: "POST",
      body: { ...valido, nombre: "", ci: "12", email: "no-es-email" },
    });
    expect(res.status).toBe(400);
    expect(res.error?.code).toBe("VALIDACION");
    const campos = (res.error?.details as { campo: string }[]).map((d) => d.campo);
    expect(campos).toEqual(expect.arrayContaining(["nombre", "ci", "email"]));
  });

  it("CI único: un CI repetido al crear → 409 CI_DUPLICADO", async () => {
    await llamar(pacientes.POST, "/api/pacientes", { metodo: "POST", body: valido });
    const res = await llamar(pacientes.POST, "/api/pacientes", {
      metodo: "POST",
      body: { ...valido, nombre: "Otra", ci: "4567890-1A" },
    });
    expect(res.status).toBe(409);
    expect(res.error?.code).toBe("CI_DUPLICADO");
  });

  it("CI único: cambiar el CI al de otro paciente → 409 CI_DUPLICADO", async () => {
    const a = await crearPaciente({ ci: "1111111" });
    await crearPaciente({ ci: "2222222" });
    const res = await llamar(paciente.PATCH, "/api/pacientes/x", {
      metodo: "PATCH",
      id: a.id,
      body: { ci: "2222222" },
    });
    expect(res.status).toBe(409);
    expect(res.error?.code).toBe("CI_DUPLICADO");
  });

  it("GET de un paciente inexistente → 404 NO_ENCONTRADO", async () => {
    const res = await llamar(paciente.GET, "/api/pacientes/999999", { id: 999999 });
    expect(res.status).toBe(404);
    expect(res.error?.code).toBe("NO_ENCONTRADO");
  });

  it("actualiza un paciente (200)", async () => {
    const p = await crearPaciente();
    const res = await llamar(paciente.PATCH, "/api/pacientes/x", {
      metodo: "PATCH",
      id: p.id,
      body: { telefono: "76543210", email: "ana@example.com" },
    });
    expect(res.status).toBe(200);
    expect(res.data).toMatchObject({ telefono: "76543210", email: "ana@example.com" });
  });

  it("elimina un paciente sin citas (200) y luego GET da 404", async () => {
    const p = await crearPaciente();
    const res = await llamar(paciente.DELETE, "/api/pacientes/x", { metodo: "DELETE", id: p.id });
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ id: p.id });
    expect((await llamar(paciente.GET, "/api/pacientes/x", { id: p.id })).status).toBe(404);
  });

  it("no elimina un paciente con citas → 409 EN_USO", async () => {
    const e = await crearEscenario();
    await reservar({ ...e, horaInicio: "09:00" });
    const res = await llamar(paciente.DELETE, "/api/pacientes/x", { metodo: "DELETE", id: e.pacienteId });
    expect(res.status).toBe(409);
    expect(res.error?.code).toBe("EN_USO");
  });

  it("listado con ?q= filtra por apellido o CI y devuelve meta de paginación", async () => {
    await crearPaciente({ apellido: "Mamani", ci: "3333333" });
    await crearPaciente({ apellido: "Choque", ci: "4444444" });

    const porApellido = await llamar<Registro[]>(pacientes.GET, "/api/pacientes?q=mama");
    expect(porApellido.status).toBe(200);
    expect(porApellido.data.map((p) => p.apellido)).toEqual(["Mamani"]);
    expect(porApellido.meta).toMatchObject({ page: 1, total: 1 });

    const porCi = await llamar<Registro[]>(pacientes.GET, "/api/pacientes?q=4444");
    expect(porCi.data.map((p) => p.ci)).toEqual(["4444444"]);
  });

  it("historial de citas del paciente (200) y 404 si no existe", async () => {
    const e = await crearEscenario();
    await reservar({ ...e, horaInicio: "09:00" });
    const res = await llamar<Registro[]>(historial.GET, "/api/pacientes/x/citas", { id: e.pacienteId });
    expect(res.status).toBe(200);
    expect(res.data).toHaveLength(1);
    expect((await llamar(historial.GET, "/api/pacientes/x/citas", { id: 999999 })).status).toBe(404);
  });
});
