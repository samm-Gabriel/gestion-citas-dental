"use client";

import { useParams } from "next/navigation";
import { Encabezado, ErrorCarga, ListaSkeleton } from "@/components/comunes";
import { PacienteForm } from "@/components/pacientes/paciente-form";
import { useDatos } from "@/hooks/use-datos";
import { useHoy } from "@/hooks/use-hoy";
import { getPaciente } from "@/lib/api";
import { nombrePaciente } from "@/lib/formato";

export default function EditarPacientePage() {
  const { id } = useParams<{ id: string }>();
  const hoy = useHoy();
  const { data: paciente, error, recargar } = useDatos(() => getPaciente(Number(id)), `paciente-${id}`);

  return (
    <div className="mx-auto max-w-3xl">
      <Encabezado volver={`/pacientes/${id}`} etiqueta="Editar paciente" titulo={paciente ? nombrePaciente(paciente) : "Paciente"} />
      {error ? <ErrorCarga mensaje={error} onReintentar={recargar} /> : !paciente ? <ListaSkeleton filas={3} /> : <PacienteForm paciente={paciente} hoy={hoy} />}
    </div>
  );
}
