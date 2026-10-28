"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Plus, Search, Syringe } from "lucide-react";
import { BotonEnlace, Encabezado, ErrorCarga, EstadoVacio, ListaSkeleton } from "@/components/comunes";
import { ActivoBadge } from "@/components/estado-badge";
import { Paginacion } from "@/components/paginacion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDatos } from "@/hooks/use-datos";
import { useDebounce } from "@/hooks/use-hoy";
import { listTratamientos } from "@/lib/api";
import { formatearDuracion, formatearPrecio } from "@/lib/formato";

type FiltroActivo = "todos" | "true" | "false";

export default function TratamientosPage() {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [activo, setActivo] = useState<FiltroActivo>("todos");
  const [pagina, setPagina] = useState(1);
  const q = useDebounce(busqueda.trim());
  const { data, error, cargando, recargar } = useDatos(
    () => listTratamientos({ q, activo: activo === "todos" ? undefined : activo === "true", page: pagina, pageSize: 10 }),
    `${q}|${activo}|${pagina}`,
  );

  return (
    <div className="mx-auto max-w-6xl">
      <Encabezado
        etiqueta="Catálogo"
        titulo="Tratamientos"
        descripcion="La duración define cuánto ocupa cada cita en la agenda."
        acciones={
          <BotonEnlace href="/tratamientos/nuevo">
            <Plus data-icon="inline-start" />
            Nuevo tratamiento
          </BotonEnlace>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nombre o descripción…"
                aria-label="Buscar tratamientos"
                className="h-9 pl-8"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPagina(1);
                }}
              />
            </div>
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
            <EstadoVacio icono={Syringe} titulo="No hay tratamientos" descripcion="Prueba con otra búsqueda o registra uno nuevo." />
          ) : (
            <div className={cargando ? "opacity-60" : undefined}>
              <ul className="flex flex-col gap-2 md:hidden">
                {data.data.map((t) => (
                  <li key={t.id}>
                    <Link href={`/tratamientos/${t.id}/editar`} className="flex items-center gap-3 rounded-xl border p-3 hover:border-primary/50">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{t.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatearDuracion(t.duracionMinutos)} · {formatearPrecio(t.precio)}
                        </p>
                      </div>
                      <ActivoBadge activo={t.activo} />
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>

              <Table className="hidden md:table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Tratamiento</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((t) => (
                    <TableRow key={t.id} className="cursor-pointer" onClick={() => router.push(`/tratamientos/${t.id}/editar`)}>
                      <TableCell className="max-w-md whitespace-normal">
                        <Link href={`/tratamientos/${t.id}/editar`} className="font-medium hover:underline">
                          {t.nombre}
                        </Link>
                        {t.descripcion && <p className="text-xs text-muted-foreground">{t.descripcion}</p>}
                      </TableCell>
                      <TableCell>{formatearDuracion(t.duracionMinutos)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatearPrecio(t.precio)}</TableCell>
                      <TableCell>
                        <ActivoBadge activo={t.activo} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <Paginacion meta={data?.meta} onCambiar={setPagina} />
        </CardContent>
      </Card>
    </div>
  );
}
