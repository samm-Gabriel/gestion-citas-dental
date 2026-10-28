"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CitaForm } from "@/components/citas/cita-form";
import { Encabezado, ErrorCarga, ListaSkeleton } from "@/components/comunes";
import { useDatos } from "@/hooks/use-datos";
import { getPaciente } from "@/lib/api";

function FormularioReserva() {
  const pacienteId = Number(useSearchParams().get("pacienteId")) || null;
  const paciente = useDatos(() => getPaciente(pacienteId!), pacienteId ? `paciente-${pacienteId}` : null);

  if (pacienteId && paciente.error) return <ErrorCarga mensaje={paciente.error} onReintentar={paciente.recargar} />;
  if (pacienteId && !paciente.data) return <ListaSkeleton filas={3} />;
  return <CitaForm key={pacienteId ?? "nueva"} pacienteInicial={paciente.data} />;
}

export default function NuevaCitaPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Encabezado
        volver="/citas"
        etiqueta="Agenda"
        titulo="Nueva cita"
        descripcion="Elige paciente, odontólogo y tratamiento; la hora de fin se calcula con la duración del tratamiento."
      />
      <Suspense fallback={<ListaSkeleton filas={3} />}>
        <FormularioReserva />
      </Suspense>
    </div>
  );
}
