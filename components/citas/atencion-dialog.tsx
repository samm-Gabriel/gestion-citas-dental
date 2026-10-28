"use client";

import { useState } from "react";
import { ClipboardPen, NotebookPen } from "lucide-react";
import { toast } from "sonner";
import { AlertaErrorAgenda } from "@/components/citas/agenda-comun";
import { Campo } from "@/components/comunes";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { erroresPorCampo, registrarAtencion, updateAtencion, type Cita } from "@/lib/api";
import { nombrePaciente } from "@/lib/formato";

const CAMPOS = [
  { clave: "diagnostico", etiqueta: "Diagnóstico", ejemplo: "Caries oclusal en pieza 36" },
  { clave: "tratamientoRealizado", etiqueta: "Tratamiento realizado", ejemplo: "Obturación con resina compuesta A2" },
  { clave: "observaciones", etiqueta: "Observaciones", ejemplo: "Control en 6 meses" },
] as const;

type Valores = Record<(typeof CAMPOS)[number]["clave"], string>;

function FormularioAtencion({ cita, onListo }: { cita: Cita; onListo: (cita: Cita) => void }) {
  const existente = cita.atencion;
  const [valores, setValores] = useState<Valores>({
    diagnostico: existente?.diagnostico ?? "",
    tratamientoRealizado: existente?.tratamientoRealizado ?? cita.tratamiento?.nombre ?? "",
    observaciones: existente?.observaciones ?? "",
  });
  const [error, setError] = useState<unknown>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const porCampo = erroresPorCampo(error);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const input = {
      diagnostico: valores.diagnostico.trim() || null,
      tratamientoRealizado: valores.tratamientoRealizado.trim() || null,
      observaciones: valores.observaciones.trim() || null,
    };
    if (!existente && !input.diagnostico && !input.tratamientoRealizado && !input.observaciones) {
      setAviso("Completa al menos uno de los tres campos.");
      return;
    }
    setAviso(null);
    setEnviando(true);
    setError(null);
    try {
      const actualizada = existente ? await updateAtencion(cita.id, input) : await registrarAtencion(cita.id, input);
      toast.success(existente ? "Atención actualizada" : "Atención registrada: la cita quedó atendida");
      onListo(actualizada);
    } catch (err) {
      setError(err);
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="flex flex-col gap-4" noValidate>
      {CAMPOS.map((campo) => (
        <Campo key={campo.clave} id={`atencion-${campo.clave}`} etiqueta={campo.etiqueta} error={porCampo[campo.clave]}>
          <Textarea
            id={`atencion-${campo.clave}`}
            rows={campo.clave === "observaciones" ? 2 : 3}
            maxLength={2000}
            placeholder={campo.ejemplo}
            value={valores[campo.clave]}
            onChange={(e) => setValores((v) => ({ ...v, [campo.clave]: e.target.value }))}
          />
        </Campo>
      ))}
      {aviso && <p className="text-sm text-destructive">{aviso}</p>}
      <AlertaErrorAgenda error={Object.keys(porCampo).length ? null : error} />
      <DialogFooter>
        <Button type="submit" disabled={enviando}>
          {enviando ? "Guardando…" : existente ? "Guardar cambios" : "Registrar y marcar atendida"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AtencionDialog({ cita, onCambio }: { cita: Cita; onCambio: (cita: Cita) => void }) {
  const [abierto, setAbierto] = useState(false);
  const editar = !!cita.atencion;
  if (cita.estado === "CANCELADA") return null;

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger
        render={
          <Button size="sm" variant={editar ? "outline" : "default"}>
            {editar ? <NotebookPen data-icon="inline-start" /> : <ClipboardPen data-icon="inline-start" />}
            {editar ? "Editar atención" : "Registrar atención"}
          </Button>
        }
      />
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editar ? "Editar atención" : "Registrar atención"}</DialogTitle>
          <DialogDescription>
            {nombrePaciente(cita.paciente)} · {cita.tratamiento?.nombre} · {cita.horaInicio}–{cita.horaFin}
          </DialogDescription>
        </DialogHeader>
        <FormularioAtencion
          cita={cita}
          onListo={(actualizada) => {
            setAbierto(false);
            onCambio(actualizada);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
