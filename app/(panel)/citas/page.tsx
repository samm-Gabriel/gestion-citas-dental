"use client";

import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { useCatalogos } from "@/components/citas/agenda-comun";
import { CitaAcciones } from "@/components/citas/cita-acciones";
import { CitaFila, FiltroEstados } from "@/components/citas/cita-fila";
import { BotonEnlace, Campo, Encabezado, ErrorCarga, EstadoVacio, ListaSkeleton } from "@/components/comunes";
import { Paginacion } from "@/components/paginacion";
import { usePerfil } from "@/components/perfil-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { useDatos } from "@/hooks/use-datos";
import { useDebounce, useHoy } from "@/hooks/use-hoy";
import { listCitas, type EstadoCita } from "@/lib/api";
import { inicioSemana, sumarDias } from "@/lib/fechas";
import { formatearFecha } from "@/lib/formato";

export default function CitasPage() {
  const hoy = useHoy();
  const { puedeGestionarCitas } = usePerfil();
  const { odontologos } = useCatalogos();
  const [rango, setRango] = useState<{ desde: string; hasta: string } | null>(null);
  const [odontologoId, setOdontologoId] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [estados, setEstados] = useState<EstadoCita[]>([]);
  const [pagina, setPagina] = useState(1);
  const q = useDebounce(busqueda.trim());

  const lunes = hoy ? inicioSemana(hoy) : null;
  const desde = rango?.desde ?? lunes ?? "";
  const hasta = rango?.hasta ?? (lunes ? sumarDias(lunes, 6) : "");
  const rangoValido = !!desde && !!hasta && desde <= hasta;

  const { data, error, cargando, recargar } = useDatos(
    () =>
      listCitas({
        desde,
        hasta,
        odontologoId: odontologoId ? Number(odontologoId) : undefined,
        q: q || undefined,
        estado: estados,
        page: pagina,
        pageSize: 10,
      }),
    rangoValido ? `citas-${desde}-${hasta}-${odontologoId}-${q}-${estados.join()}-${pagina}` : null,
  );

  function cambiarRango(nuevo: { desde: string; hasta: string }) {
    setRango(nuevo);
    setPagina(1);
  }

  function moverSemana(dias: number) {
    if (desde && hasta) cambiarRango({ desde: sumarDias(desde, dias), hasta: sumarDias(hasta, dias) });
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Encabezado
        etiqueta="Agenda"
        titulo="Citas"
        descripcion={rangoValido ? `Del ${formatearFecha(desde)} al ${formatearFecha(hasta)}` : "Filtra por fechas, odontólogo, paciente y estado."}
        acciones={
          puedeGestionarCitas && (
            <BotonEnlace href="/citas/nueva">
              <Plus data-icon="inline-start" />
              Nueva cita
            </BotonEnlace>
          )
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Campo id="desde" etiqueta="Desde">
              <Input id="desde" type="date" value={desde} max={hasta || undefined} onChange={(e) => cambiarRango({ desde: e.target.value, hasta })} />
            </Campo>
            <Campo id="hasta" etiqueta="Hasta">
              <Input id="hasta" type="date" value={hasta} min={desde || undefined} onChange={(e) => cambiarRango({ desde, hasta: e.target.value })} />
            </Campo>
            <Campo id="filtro-odontologo" etiqueta="Odontólogo">
              <NativeSelect
                id="filtro-odontologo"
                value={odontologoId}
                onChange={(e) => {
                  setOdontologoId(e.target.value);
                  setPagina(1);
                }}
              >
                <option value="">Todos</option>
                {odontologos.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nombre}
                  </option>
                ))}
              </NativeSelect>
            </Campo>
            <Campo id="filtro-q" etiqueta="Paciente">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="filtro-q"
                  type="search"
                  className="pl-8"
                  placeholder="Nombre, apellido o CI…"
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value);
                    setPagina(1);
                  }}
                />
              </div>
            </Campo>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <FiltroEstados
              multiple
              seleccion={estados}
              onCambiar={(e) => {
                setEstados(e);
                setPagina(1);
              }}
            />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => moverSemana(-7)} disabled={!rangoValido} aria-label="Semana anterior">
                <ChevronLeft />
              </Button>
              <Button size="sm" variant="outline" onClick={() => lunes && cambiarRango({ desde: lunes, hasta: sumarDias(lunes, 6) })} disabled={!lunes}>
                Esta semana
              </Button>
              <Button size="sm" variant="outline" onClick={() => moverSemana(7)} disabled={!rangoValido} aria-label="Semana siguiente">
                <ChevronRight />
              </Button>
            </div>
          </div>

          {!rangoValido && desde && hasta ? (
            <p className="text-sm text-destructive">La fecha «desde» debe ser anterior o igual a «hasta».</p>
          ) : error ? (
            <ErrorCarga mensaje={error} onReintentar={recargar} />
          ) : !data ? (
            <ListaSkeleton />
          ) : data.data.length === 0 ? (
            <EstadoVacio icono={CalendarDays} titulo="No hay citas" descripcion="Ninguna cita coincide con los filtros en este rango de fechas." />
          ) : (
            <ul className={cargando ? "flex flex-col gap-2 opacity-60 transition-opacity" : "flex flex-col gap-2 transition-opacity"}>
              {data.data.map((cita) => (
                <li key={cita.id}>
                  <CitaFila cita={cita} conFecha acciones={puedeGestionarCitas && <CitaAcciones cita={cita} onCambio={recargar} />} />
                </li>
              ))}
            </ul>
          )}

          <Paginacion meta={data?.meta} onCambiar={setPagina} />
        </CardContent>
      </Card>
    </div>
  );
}
