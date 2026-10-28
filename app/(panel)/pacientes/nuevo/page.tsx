"use client";

import { Encabezado } from "@/components/comunes";
import { PacienteForm } from "@/components/pacientes/paciente-form";
import { useHoy } from "@/hooks/use-hoy";

export default function NuevoPacientePage() {
  const hoy = useHoy();
  return (
    <div className="mx-auto max-w-3xl">
      <Encabezado volver="/pacientes" etiqueta="Pacientes" titulo="Nuevo paciente" descripcion="Los campos con * son obligatorios. El CI debe ser único." />
      <PacienteForm hoy={hoy} />
    </div>
  );
}
