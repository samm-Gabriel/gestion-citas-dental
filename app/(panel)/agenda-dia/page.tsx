"use client";

import { useState } from "react";
import { CalendarCheck2, ChevronLeft, ChevronRight, Stethoscope } from "lucide-react";
import { HorarioDelDia, useCatalogos } from "@/components/citas/agenda-comun";
import { AtencionDialog } from "@/components/citas/atencion-dialog";
import { CitaFila } from "@/components/citas/cita-fila";
import { Campo, Encabezado, ErrorCarga, EstadoVacio, ListaSkeleton } from "@/components/comunes";
import { usePerfil } from "@/components/perfil-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { useDatos } from "@/hooks/use-datos";
import { useHoy } from "@/hooks/use-hoy";
import { ESTADOS_CITA, listCitas } from "@/lib/api";
import { REGEX_FECHA, sumarDias } from "@/lib/fechas";
import { ETIQUETA_ESTADO, formatearFechaLarga } from "@/lib/formato";

export default function AgendaDiaPage() {
  const hoy = useHoy();
  const { odontologoId: odontologoPerfil, puedeRegistrarAtencion } = usePerfil();
  const { odontologos, error: errorCatalogos } = useCatalogos();
  const [odontologoElegido, setOdontologo] = useState<string | null>(null);
  const [fechaElegida, setFecha] = useState<string | null>(null);

  const fecha = fechaElegida ?? hoy ?? "";
  const odontologoId = odontologoElegido ?? (odontologoPerfil ? String(odontologoPerfil) : "");
  const odontologo = odontologos.find((o) => o.id === Number(odontologoId));
  const listo = !!odontologoId && REGEX_FECHA.test(fecha);

  const { data, error, cargando, recargar } = useDatos(
    () => listCitas({ desde: fecha, hasta: fecha, odontologoId: Number(odontologoId), pageSize: 100 }),
    listo ? `agenda-${odontologoId}-${fecha}` : null,
  );
  const citas = data?.data ?? [];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <Encabezado
        etiqueta="Agenda del día"
        titulo={odontologo ? odontologo.nombre : "Mis citas"}
        descripcion={fecha ? `${formatearFechaLarga(fecha)}${fecha === hoy ? " (hoy)" : ""}` : undefined}
      />

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Campo id="agenda-odontologo" etiqueta="Odontólogo" error={errorCatalogos ?? undefined}>
              <NativeSelect id="agenda-odontologo" value={odontologoId} onChange={(e) => setOdontologo(e.target.value)}>
                <option value="">Selecciona…</option>
                {odontologos.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nombre} — {o.especialidad}
                  </option>
                ))}
              </NativeSelect>
            </Campo>
            <Campo id="agenda-fecha" etiqueta="Fecha">
              <div className="flex gap-2">
                <Button variant="outline" size="icon" aria-label="Día anterior" disabled={!fecha} onClick={() => setFecha(sumarDias(fecha, -1))}>
                  <ChevronLeft />
                </Button>
                <Input id="agenda-fecha" type="date" className="w-auto" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                <Button variant="outline" size="icon" aria-label="Día siguiente" disabled={!fecha} onClick={() => setFecha(sumarDias(fecha, 1))}>
                  <ChevronRight />
                </Button>
                {hoy && fecha !== hoy && (
                  <Button variant="ghost" onClick={() => setFecha(hoy)}>
                    Hoy
                  </Button>
                )}
              </div>
            </Campo>
          </div>

          {odontologo && <HorarioDelDia odontologo={odontologo} fecha={fecha} />}

          {data && citas.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">{citas.length} citas</span>
              {ESTADOS_CITA.map((estado) => {
                const total = citas.filter((c) => c.estado === estado).length;
                return total > 0 ? (
                  <span key={estado} className="rounded-full border px-3 py-1 text-muted-foreground">
                    {ETIQUETA_ESTADO[estado]}: {total}
                  </span>
                ) : null;
              })}
            </div>
          )}

          {!odontologoId ? (
            <EstadoVacio icono={Stethoscope} titulo="Elige un odontólogo" descripcion="Selecciona el odontólogo para ver sus citas del día." />
          ) : error ? (
            <ErrorCarga mensaje={error} onReintentar={recargar} />
          ) : !data ? (
            <ListaSkeleton />
          ) : citas.length === 0 ? (
            <EstadoVacio icono={CalendarCheck2} titulo="Sin citas" descripcion="No hay citas agendadas para este día." />
          ) : (
            <ul className={cargando ? "flex flex-col gap-2 opacity-60 transition-opacity" : "flex flex-col gap-2 transition-opacity"}>
              {citas.map((cita) => (
                <li key={cita.id}>
                  <CitaFila cita={cita} mostrar={["paciente", "tratamiento"]} acciones={puedeRegistrarAtencion && <AtencionDialog cita={cita} onCambio={recargar} />} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
