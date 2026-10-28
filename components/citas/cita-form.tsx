"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { AlertaErrorAgenda, HorarioDelDia, useCatalogos } from "@/components/citas/agenda-comun";
import { Campo } from "@/components/comunes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useDatos } from "@/hooks/use-datos";
import { useDebounce, useHoy } from "@/hooks/use-hoy";
import { createCita, erroresPorCampo, listPacientes, type Paciente } from "@/lib/api";
import { formatearDuracion, formatearPrecio, nombrePaciente } from "@/lib/formato";

function BuscadorPaciente({ paciente, onElegir, error }: { paciente: Paciente | null; onElegir: (p: Paciente | null) => void; error?: string }) {
  const [texto, setTexto] = useState("");
  const q = useDebounce(texto.trim());
  const resultados = useDatos(() => listPacientes({ q, pageSize: 6 }), !paciente && q ? `buscar-${q}` : null);

  if (paciente) {
    return (
      <div className="flex items-center gap-3 rounded-lg border bg-primary/5 p-3">
        <div className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-primary">
          <UserRound className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{nombrePaciente(paciente)}</p>
          <p className="text-xs text-muted-foreground">
            CI {paciente.ci} · {paciente.telefono}
          </p>
        </div>
        <Button type="button" size="sm" variant="ghost" onClick={() => onElegir(null)}>
          <X data-icon="inline-start" />
          Cambiar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="paciente"
          type="search"
          className="pl-8"
          placeholder="Escribe nombre, apellido o CI…"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          aria-invalid={!!error}
          autoComplete="off"
        />
      </div>
      {q && (
        <ul className="flex max-h-60 flex-col overflow-y-auto rounded-lg border">
          {resultados.cargando && <li className="p-3 text-sm text-muted-foreground">Buscando…</li>}
          {!resultados.cargando && resultados.data?.data.length === 0 && <li className="p-3 text-sm text-muted-foreground">Sin resultados para «{q}».</li>}
          {!resultados.cargando &&
            resultados.data?.data.map((p) => (
              <li key={p.id} className="border-b last:border-b-0">
                <button type="button" className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-muted" onClick={() => onElegir(p)}>
                  <span className="font-medium">{nombrePaciente(p)}</span>
                  <span className="text-xs text-muted-foreground">CI {p.ci}</span>
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

export function CitaForm({ pacienteInicial }: { pacienteInicial?: Paciente | null }) {
  const router = useRouter();
  const hoy = useHoy();
  const { odontologos, tratamientos, error: errorCatalogos } = useCatalogos();
  const [paciente, setPaciente] = useState<Paciente | null>(pacienteInicial ?? null);
  const [odontologoId, setOdontologoId] = useState("");
  const [tratamientoId, setTratamientoId] = useState("");
  const [fechaElegida, setFecha] = useState<string | null>(null);
  const [hora, setHora] = useState("");
  const [motivo, setMotivo] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorApi, setErrorApi] = useState<unknown>(null);
  const [enviando, setEnviando] = useState(false);

  const fecha = fechaElegida ?? hoy ?? "";
  const odontologo = odontologos.find((o) => o.id === Number(odontologoId));
  const tratamiento = tratamientos.find((t) => t.id === Number(tratamientoId));

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const locales: Record<string, string> = {};
    if (!paciente) locales.pacienteId = "Elige un paciente";
    if (!odontologoId) locales.odontologoId = "Elige un odontólogo";
    if (!tratamientoId) locales.tratamientoId = "Elige un tratamiento";
    if (!fecha) locales.fecha = "Elige la fecha";
    if (!hora) locales.horaInicio = "Elige la hora";
    setErrores(locales);
    setErrorApi(null);
    if (Object.keys(locales).length || !paciente) return;

    setEnviando(true);
    try {
      const cita = await createCita({
        pacienteId: paciente.id,
        odontologoId: Number(odontologoId),
        tratamientoId: Number(tratamientoId),
        fecha,
        horaInicio: hora,
        motivo: motivo.trim() || null,
      });
      toast.success(`Cita reservada: ${cita.fecha} de ${cita.horaInicio} a ${cita.horaFin}`);
      router.push(`/citas/${cita.id}`);
    } catch (err) {
      const porCampo = erroresPorCampo(err);
      setErrores(porCampo);
      setErrorApi(Object.keys(porCampo).length ? null : err);
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={guardar} noValidate className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Paciente</CardTitle>
        </CardHeader>
        <CardContent>
          <Campo id="paciente" etiqueta="Buscar paciente" requerido error={errores.pacienteId}>
            <BuscadorPaciente paciente={paciente} onElegir={setPaciente} error={errores.pacienteId} />
          </Campo>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Odontólogo, tratamiento y horario</CardTitle>
          <CardDescription>La hora de fin se calcula con la duración del tratamiento.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {errorCatalogos && <p className="text-sm text-destructive sm:col-span-2">{errorCatalogos}</p>}
          <Campo id="odontologo" etiqueta="Odontólogo" requerido error={errores.odontologoId}>
            <NativeSelect id="odontologo" value={odontologoId} onChange={(e) => setOdontologoId(e.target.value)} aria-invalid={!!errores.odontologoId}>
              <option value="">Selecciona…</option>
              {odontologos.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nombre} — {o.especialidad}
                </option>
              ))}
            </NativeSelect>
          </Campo>
          <Campo
            id="tratamiento"
            etiqueta="Tratamiento"
            requerido
            error={errores.tratamientoId}
            ayuda={tratamiento ? `${formatearDuracion(tratamiento.duracionMinutos)} · ${formatearPrecio(tratamiento.precio)}` : undefined}
          >
            <NativeSelect id="tratamiento" value={tratamientoId} onChange={(e) => setTratamientoId(e.target.value)} aria-invalid={!!errores.tratamientoId}>
              <option value="">Selecciona…</option>
              {tratamientos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre} ({formatearDuracion(t.duracionMinutos)})
                </option>
              ))}
            </NativeSelect>
          </Campo>
          <Campo id="fecha" etiqueta="Fecha" requerido error={errores.fecha}>
            <Input id="fecha" type="date" min={hoy ?? undefined} value={fecha} onChange={(e) => setFecha(e.target.value)} aria-invalid={!!errores.fecha} />
          </Campo>
          <Campo id="hora" etiqueta="Hora de inicio" requerido error={errores.horaInicio}>
            <Input id="hora" type="time" step={300} value={hora} onChange={(e) => setHora(e.target.value)} aria-invalid={!!errores.horaInicio} />
          </Campo>
          <div className="sm:col-span-2">
            <HorarioDelDia odontologo={odontologo} fecha={fecha} />
          </div>
          <Campo id="motivo" etiqueta="Motivo de la consulta" error={errores.motivo} className="sm:col-span-2">
            <Textarea id="motivo" rows={2} maxLength={500} placeholder="Dolor en muela inferior izquierda" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </Campo>
          <div className="sm:col-span-2">
            <AlertaErrorAgenda error={errorApi} />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" disabled={enviando}>
            {enviando ? "Reservando…" : "Reservar cita"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
