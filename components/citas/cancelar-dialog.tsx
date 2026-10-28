"use client";

import { useState } from "react";
import { XCircle } from "lucide-react";
import { toast } from "sonner";
import { AlertaErrorAgenda } from "@/components/citas/agenda-comun";
import { Campo } from "@/components/comunes";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cancelarCita, erroresPorCampo, type Cita } from "@/lib/api";
import { nombrePaciente } from "@/lib/formato";

function FormularioCancelar({ cita, onListo }: { cita: Cita; onListo: (cita: Cita) => void }) {
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [enviando, setEnviando] = useState(false);
  const porCampo = erroresPorCampo(error);

  async function cancelar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const cancelada = await cancelarCita(cita.id, { motivoCancelacion: motivo.trim() || null });
      toast.success("Cita cancelada; el horario quedó libre");
      onListo(cancelada);
    } catch (err) {
      setError(err);
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={cancelar} className="flex flex-col gap-4">
      <Campo id="motivo-cancelacion" etiqueta="Motivo de la cancelación" ayuda="Opcional" error={porCampo.motivoCancelacion}>
        <Textarea
          id="motivo-cancelacion"
          rows={3}
          maxLength={500}
          placeholder="El paciente avisó que no podrá asistir"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
        />
      </Campo>
      <AlertaErrorAgenda error={Object.keys(porCampo).length ? null : error} />
      <DialogFooter>
        <Button type="submit" variant="destructive" disabled={enviando}>
          {enviando ? "Cancelando…" : "Cancelar cita"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function CancelarDialog({ cita, onCambio }: { cita: Cita; onCambio: (cita: Cita) => void }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger
        render={
          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
            <XCircle data-icon="inline-start" />
            Cancelar
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>¿Cancelar la cita?</DialogTitle>
          <DialogDescription>
            {nombrePaciente(cita.paciente)} · {cita.fecha} de {cita.horaInicio} a {cita.horaFin}. La cancelación es definitiva y libera el horario.
          </DialogDescription>
        </DialogHeader>
        <FormularioCancelar
          cita={cita}
          onListo={(cancelada) => {
            setAbierto(false);
            onCambio(cancelada);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
