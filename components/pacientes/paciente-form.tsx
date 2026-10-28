"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertaError, Campo } from "@/components/comunes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiError, createPaciente, erroresPorCampo, mensajeError, updatePaciente, type Paciente, type PacienteInput } from "@/lib/api";

type Valores = Record<"nombre" | "apellido" | "ci" | "telefono" | "email" | "fechaNacimiento", string>;

function valoresIniciales(paciente?: Paciente): Valores {
  return {
    nombre: paciente?.nombre ?? "",
    apellido: paciente?.apellido ?? "",
    ci: paciente?.ci ?? "",
    telefono: paciente?.telefono ?? "",
    email: paciente?.email ?? "",
    fechaNacimiento: paciente?.fechaNacimiento?.slice(0, 10) ?? "",
  };
}

function validar(v: Valores, hoy: string | null): Record<string, string> {
  const errores: Record<string, string> = {};
  if (!v.nombre.trim()) errores.nombre = "Ingresa el nombre";
  if (!v.apellido.trim()) errores.apellido = "Ingresa el apellido";
  if (!/^[0-9]{4,12}(-?[0-9A-Za-z]{1,4})?$/.test(v.ci.trim())) errores.ci = "De 4 a 12 dígitos y complemento opcional (ej. 1234567-1A)";
  if (!/^\+?[0-9 ()-]{6,20}$/.test(v.telefono.trim())) errores.telefono = "Teléfono no válido (ej. +591 71234567)";
  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) errores.email = "Correo no válido";
  if (v.fechaNacimiento && hoy && v.fechaNacimiento > hoy) errores.fechaNacimiento = "No puede estar en el futuro";
  return errores;
}

export function PacienteForm({ paciente, hoy }: { paciente?: Paciente; hoy: string | null }) {
  const router = useRouter();
  const [valores, setValores] = useState<Valores>(() => valoresIniciales(paciente));
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo: keyof Valores) => (e: React.ChangeEvent<HTMLInputElement>) => setValores((v) => ({ ...v, [campo]: e.target.value }));

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const locales = validar(valores, hoy);
    setErrores(locales);
    setErrorGeneral(null);
    if (Object.keys(locales).length) return;

    const input: PacienteInput = {
      nombre: valores.nombre.trim(),
      apellido: valores.apellido.trim(),
      ci: valores.ci.trim(),
      telefono: valores.telefono.trim(),
      email: valores.email.trim() || null,
      fechaNacimiento: valores.fechaNacimiento || null,
    };
    setEnviando(true);
    try {
      const guardado = paciente ? await updatePaciente(paciente.id, input) : await createPaciente(input);
      toast.success(paciente ? "Paciente actualizado" : "Paciente registrado");
      router.push(`/pacientes/${guardado.id}`);
    } catch (err) {
      const porCampo = erroresPorCampo(err);
      if (err instanceof ApiError && err.code === "CI_DUPLICADO") porCampo.ci = err.message;
      setErrores(porCampo);
      setErrorGeneral(Object.keys(porCampo).length ? "Revisa los campos marcados." : mensajeError(err));
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={guardar} noValidate>
      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <AlertaError mensaje={errorGeneral} />
          </div>
          <Campo id="nombre" etiqueta="Nombre" requerido error={errores.nombre}>
            <Input id="nombre" value={valores.nombre} onChange={cambiar("nombre")} aria-invalid={!!errores.nombre} autoComplete="given-name" />
          </Campo>
          <Campo id="apellido" etiqueta="Apellido" requerido error={errores.apellido}>
            <Input id="apellido" value={valores.apellido} onChange={cambiar("apellido")} aria-invalid={!!errores.apellido} autoComplete="family-name" />
          </Campo>
          <Campo id="ci" etiqueta="Cédula de identidad (CI)" requerido error={errores.ci} ayuda="Ej. 4567891 o 1234567-1A">
            <Input id="ci" value={valores.ci} onChange={cambiar("ci")} aria-invalid={!!errores.ci} inputMode="text" />
          </Campo>
          <Campo id="telefono" etiqueta="Teléfono" requerido error={errores.telefono} ayuda="Ej. +591 71234567">
            <Input id="telefono" type="tel" value={valores.telefono} onChange={cambiar("telefono")} aria-invalid={!!errores.telefono} autoComplete="tel" />
          </Campo>
          <Campo id="email" etiqueta="Correo electrónico" error={errores.email}>
            <Input id="email" type="email" value={valores.email} onChange={cambiar("email")} aria-invalid={!!errores.email} autoComplete="email" />
          </Campo>
          <Campo id="fechaNacimiento" etiqueta="Fecha de nacimiento" error={errores.fechaNacimiento}>
            <Input
              id="fechaNacimiento"
              type="date"
              max={hoy ?? undefined}
              value={valores.fechaNacimiento}
              onChange={cambiar("fechaNacimiento")}
              aria-invalid={!!errores.fechaNacimiento}
            />
          </Campo>
        </CardContent>
        <CardFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" disabled={enviando}>
            {enviando ? "Guardando…" : paciente ? "Guardar cambios" : "Registrar paciente"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
