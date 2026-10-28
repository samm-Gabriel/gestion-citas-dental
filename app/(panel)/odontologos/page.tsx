"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Search, Stethoscope } from "lucide-react";
import { BotonEnlace, Encabezado, ErrorCarga, EstadoVacio, ListaSkeleton } from "@/components/comunes";
import { ActivoBadge } from "@/components/estado-badge";
import { Paginacion } from "@/components/paginacion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { useDatos } from "@/hooks/use-datos";
import { useDebounce } from "@/hooks/use-hoy";
import { listOdontologos } from "@/lib/api";
import { resumirHorarios } from "@/lib/formato";

type FiltroActivo = "todos" | "true" | "false";

export default function OdontologosPage() {
  const [busqueda, setBusqueda] = useState("");
  const [especialidad, setEspecialidad] = useState("");
  const [activo, setActivo] = useState<FiltroActivo>("todos");
  const [pagina, setPagina] = useState(1);
  const q = useDebounce(busqueda.trim());
  const esp = useDebounce(especialidad.trim());
  const { data, error, cargando, recargar } = useDatos(
    () => listOdontologos({ q, especialidad: esp, activo: activo === "todos" ? undefined : activo === "true", page: pagina, pageSize: 12 }),
    `${q}|${esp}|${activo}|${pagina}`,
  );

  return (
    <div className="mx-auto max-w-6xl">
      <Encabezado
        etiqueta="Equipo clínico"
        titulo="Odontólogos"
        descripcion="Especialidades y horarios de atención semanales."
        acciones={
          <BotonEnlace href="/odontologos/nuevo">
            <Plus data-icon="inline-start" />
            Nuevo odontólogo
          </BotonEnlace>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nombre o especialidad…"
                aria-label="Buscar odontólogos"
                className="h-9 pl-8"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPagina(1);
                }}
              />
            </div>
            <Input
              placeholder="Especialidad (ej. Endodoncia)"
              aria-label="Filtrar por especialidad"
              className="h-9"
              value={especialidad}
              onChange={(e) => {
                setEspecialidad(e.target.value);
                setPagina(1);
              }}
            />
            <NativeSelect
              aria-label="Filtrar por estado"
              className="h-9 sm:w-40"
              value={activo}
              onChange={(e) => {
                setActivo(e.target.value as FiltroActivo);
                setPagina(1);
              }}
            >
              <option value="todos">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </NativeSelect>
          </div>

          {error ? (
            <ErrorCarga mensaje={error} onReintentar={recargar} />
          ) : !data ? (
            <ListaSkeleton />
          ) : data.data.length === 0 ? (
            <EstadoVacio icono={Stethoscope} titulo="No hay odontólogos" descripcion="Prueba con otros filtros o registra uno nuevo." />
          ) : (
            <div className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-3 ${cargando ? "opacity-60" : ""}`}>
              {data.data.map((o) => {
                const horarios = resumirHorarios(o.horarios);
                return (
                  <div key={o.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{o.nombre}</p>
                        <p className="text-sm text-primary">{o.especialidad}</p>
                      </div>
                      <ActivoBadge activo={o.activo} />
                    </div>
                    <div className="flex-1 text-xs text-muted-foreground">
                      {horarios.length ? (
                        <ul className="flex flex-col gap-0.5">
                          {horarios.map((h) => (
                            <li key={h} className="tabular-nums">
                              {h}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        "Sin horario de atención"
                      )}
                    </div>
                    <Link href={`/odontologos/${o.id}/editar`} className="inline-flex items-center gap-1 self-start text-sm font-medium text-primary hover:underline">
                      <Pencil className="size-3.5" />
                      Editar
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          <Paginacion meta={data?.meta} onCambiar={setPagina} />
        </CardContent>
      </Card>
    </div>
  );
}
