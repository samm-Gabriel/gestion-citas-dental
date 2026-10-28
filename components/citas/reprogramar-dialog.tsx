"use client";

import { useState } from "react";
import { CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { AlertaErrorAgenda, HorarioDelDia, useCatalogos } from "@/components/citas/agenda-comun";
import { Campo } from "@/components/comunes";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useHoy } from "@/hooks/use-hoy";
import { erroresPorCampo, reprogramarCita, type Cita, type CitaReprogramarInput } from "@/lib/api";
import { formatearDuracion, nombrePaciente } from "@/lib/formato";

function FormularioReprogramar({ cita, onListo }: { cita: Cita; onListo: (cita: Cita) => void }) {
  const hoy = useHoy();
  const { odontologos, tratamientos } = useCatalogos();
  const [fecha, setFecha] = useState(cita.fecha);
  const [hora, setHora] = useState(cita.horaInicio);
  const [odontologoId, setOdontologoId] = useState(String(cita.odontologoId));
  const [tratamientoId, setTratamientoId] = useState(String(cita.tratamientoId));
  const [motivo, setMotivo] = useState(cita.motivo ?? "");
  const [error, setError] = useState<unknown>(null);
  const [enviando, setEnviando] = useState(false);

  const cambios: CitaReprogramarInput = {};
  if (fecha !== cita.fecha) cambios.fecha = fecha;
  if (hora !== cita.horaInicio) cambios.horaInicio = hora;
  if (Number(odontologoId) !== cita.odontologoId) cambios.odontologoId = Number(odontologoId);
  if (Number(tratamientoId) !== cita.tratamientoId) cambios.tratamientoId = Number(tratamientoId);
  if (motivo.trim() !== (cita.motivo ?? "")) cambios.motivo = motivo.trim() || null;
  const hayCambios = Object.keys(cambios).length > 0;
  const porCampo = erroresPorCampo(error);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!hayCambios) return;
    setEnviando(true);
    setError(null);
    try {
      const actualizada = await reprogramarCita(cita.id, cambios);
      toast.success(`Cita reprogramada para el ${actualizada.fecha} a las ${actualizada.horaInicio}`);
      onListo(actualizada);
    } catch (err) {
      setError(err);
      setEnviando(false);
    }
  }

  // Si el odontólogo o tratamiento actual está inactivo igual debe aparecer en el selector.
  const opcionesOdontologo = odontologos.some((o) => o.id === cita.odontologoId) || !cita.odontologo ? odontologos : [{ ...cita.odontologo, horarios: [] }, ...odontologos];
  const opcionesTratamiento = tratamientos.some((t) => t.id === cita.tratamientoId) || !cita.tratamiento ? tratamientos : [cita.tratamiento, ...tratamientos];

  return (
    <form onSubmit={guardar} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo id="rep-fecha" etiqueta="Fecha" error={porCampo.fecha}>
          <Input id="rep-fecha" type="date" min={hoy ?? undefined} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Campo>
        <Campo id="rep-hora" etiqueta="Hora de inicio" error={porCampo.horaInicio}>
          <Input id="rep-hora" type="time" step={300} value={hora} onChange={(e) => setHora(e.target.value)} />
        </Campo>
        <Campo id="rep-odontologo" etiqueta="Odontólogo" error={porCampo.odontologoId} className="sm:col-span-2">
          <NativeSelect id="rep-odontologo" value={odontologoId} onChange={(e) => setOdontologoId(e.target.value)}>
            {opcionesOdontologo.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nombre} — {o.especialidad}
              </option>
            ))}
          </NativeSelect>
        </Campo>
        <Campo id="rep-tratamiento" etiqueta="Tratamiento" error={porCampo.tratamientoId} className="sm:col-span-2">
          <NativeSelect id="rep-tratamiento" value={tratamientoId} onChange={(e) => setTratamientoId(e.target.value)}>
            {opcionesTratamiento.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre} ({formatearDuracion(t.duracionMinutos)})
              </option>
            ))}
          </NativeSelect>
        </Campo>
        <div className="sm:col-span-2">
          <HorarioDelDia odontologo={odontologos.find((o) => o.id === Number(odontologoId))} fecha={fecha} excluirCitaId={cita.id} />
        </div>
        <Campo id="rep-motivo" etiqueta="Motivo" error={porCampo.motivo} className="sm:col-span-2">
          <Textarea id="rep-motivo" rows={2} maxLength={500} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </Campo>
      </div>
      <AlertaErrorAgenda error={Object.keys(porCampo).length ? null : error} />
      <DialogFooter>
        <Button type="submit" disabled={!hayCambios || enviando}>
          {enviando ? "Guardando…" : "Reprogramar"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ReprogramarDialog({ cita, onCambio, disparador }: { cita: Cita; onCambio: (cita: Cita) => void; disparador?: React.ReactElement }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger
        render={
          disparador ?? (
            <Button size="sm" variant="outline">
              <CalendarClock data-icon="inline-start" />
              Reprogramar
            </Button>
          )
        }
      />
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reprogramar cita</DialogTitle>
          <DialogDescription>
            {nombrePaciente(cita.paciente)} · actualmente el {cita.fecha} de {cita.horaInicio} a {cita.horaFin}
          </DialogDescription>
        </DialogHeader>
        <FormularioReprogramar
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
