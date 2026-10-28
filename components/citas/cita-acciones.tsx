"use client";

import { useState } from "react";
import { CheckCircle2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { CancelarDialog } from "@/components/citas/cancelar-dialog";
import { ReprogramarDialog } from "@/components/citas/reprogramar-dialog";
import { Button } from "@/components/ui/button";
import { cambiarEstadoCita, mensajeError, type Cita } from "@/lib/api";

export const esActiva = (cita: Cita) => cita.estado === "PENDIENTE" || cita.estado === "CONFIRMADA";

/** Confirmar / volver a pendiente, reprogramar y cancelar. Solo para citas pendientes o confirmadas. */
export function CitaAcciones({ cita, onCambio }: { cita: Cita; onCambio: (cita: Cita) => void }) {
  const [enviando, setEnviando] = useState(false);
  if (!esActiva(cita)) return null;

  const siguiente = cita.estado === "PENDIENTE" ? "CONFIRMADA" : "PENDIENTE";

  async function cambiarEstado() {
    setEnviando(true);
    try {
      const actualizada = await cambiarEstadoCita(cita.id, { estado: siguiente });
      toast.success(siguiente === "CONFIRMADA" ? "Cita confirmada" : "Cita marcada como pendiente");
      onCambio(actualizada);
    } catch (err) {
      toast.error(mensajeError(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <Button size="sm" variant={siguiente === "CONFIRMADA" ? "secondary" : "ghost"} disabled={enviando} onClick={cambiarEstado}>
        {siguiente === "CONFIRMADA" ? <CheckCircle2 data-icon="inline-start" /> : <Undo2 data-icon="inline-start" />}
        {siguiente === "CONFIRMADA" ? "Confirmar" : "Marcar pendiente"}
      </Button>
      <ReprogramarDialog cita={cita} onCambio={onCambio} />
      <CancelarDialog cita={cita} onCambio={onCambio} />
    </>
  );
}
