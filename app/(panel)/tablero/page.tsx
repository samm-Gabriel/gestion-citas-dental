"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, CalendarRange, UserPlus } from "lucide-react";
import { CitaFila } from "@/components/citas/cita-fila";
import { Campo, Encabezado, ErrorCarga, EstadoVacio, ListaSkeleton } from "@/components/comunes";
import { EstadoBadge } from "@/components/estado-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDatos } from "@/hooks/use-datos";
import { ESTADOS_CITA, getTablero } from "@/lib/api";
import { formatearFecha, formatearFechaLarga, nombrePaciente } from "@/lib/formato";

function Indicador({ icono: Icono, titulo, total, detalle }: { icono: typeof CalendarDays; titulo: string; total: number; detalle: string }) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icono className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{titulo}</p>
          <p className="text-2xl font-semibold tabular-nums">{total}</p>
          <p className="truncate text-xs text-muted-foreground">{detalle}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TableroPage() {
  const [fecha, setFecha] = useState("");
  const { data: tablero, error, cargando, recargar } = useDatos(() => getTablero(fecha || undefined), `tablero-${fecha}`);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <Encabezado
        etiqueta="Resumen del consultorio"
        titulo="Tablero"
        descripcion={tablero ? formatearFechaLarga(tablero.fecha) : undefined}
        acciones={
          <Campo id="tablero-fecha" etiqueta="Fecha de referencia">
            <Input id="tablero-fecha" type="date" value={fecha || tablero?.fecha || ""} onChange={(e) => setFecha(e.target.value)} />
          </Campo>
        }
      />

      {error ? (
        <ErrorCarga mensaje={error} onReintentar={recargar} />
      ) : !tablero ? (
        <ListaSkeleton filas={3} />
      ) : (
        <div className={cargando ? "flex flex-col gap-6 opacity-60 transition-opacity" : "flex flex-col gap-6 transition-opacity"}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Indicador icono={CalendarDays} titulo="Citas del día" total={tablero.citasHoy.total} detalle={formatearFecha(tablero.citasHoy.fecha)} />
            <Indicador
              icono={CalendarRange}
              titulo="Citas de la semana"
              total={tablero.citasSemana.total}
              detalle={`${formatearFecha(tablero.citasSemana.desde)} – ${formatearFecha(tablero.citasSemana.hasta)}`}
            />
            <Indicador
              icono={UserPlus}
              titulo="Pacientes nuevos del mes"
              total={tablero.pacientesNuevosMes.total}
              detalle={`${formatearFecha(tablero.pacientesNuevosMes.desde)} – ${formatearFecha(tablero.pacientesNuevosMes.hasta)}`}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Citas de hoy</CardTitle>
                <CardDescription>{formatearFechaLarga(tablero.citasHoy.fecha)}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {ESTADOS_CITA.map((estado) => (
                    <div key={estado} className="flex flex-col items-start gap-1 rounded-lg border p-2">
                      <EstadoBadge estado={estado} />
                      <span className="text-xl font-semibold tabular-nums">{tablero.citasHoy.porEstado[estado] ?? 0}</span>
                    </div>
                  ))}
                </div>
                {tablero.citasHoy.citas.length === 0 ? (
                  <EstadoVacio icono={CalendarDays} titulo="Sin citas hoy" />
                ) : (
                  <ul className="flex flex-col gap-2">
                    {tablero.citasHoy.citas.map((cita) => (
                      <li key={cita.id}>
                        <CitaFila cita={cita} />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Semana por odontólogo</CardTitle>
                  <CardDescription>
                    {formatearFecha(tablero.citasSemana.desde)} – {formatearFecha(tablero.citasSemana.hasta)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {tablero.citasSemana.porOdontologo.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin citas esta semana.</p>
                  ) : (
                    <ul className="flex flex-col gap-3">
                      {tablero.citasSemana.porOdontologo.map(({ odontologo, total }) => (
                        <li key={odontologo.id} className="flex flex-col gap-1">
                          <div className="flex items-center justify-between gap-2 text-sm">
                            <span className="truncate font-medium">{odontologo.nombre}</span>
                            <span className="tabular-nums text-muted-foreground">{total}</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${tablero.citasSemana.total ? (total / tablero.citasSemana.total) * 100 : 0}%` }}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Pacientes nuevos del mes</CardTitle>
                  <CardDescription>{tablero.pacientesNuevosMes.total} registrados</CardDescription>
                </CardHeader>
                <CardContent>
                  {tablero.pacientesNuevosMes.pacientes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Ningún paciente nuevo este mes.</p>
                  ) : (
                    <ul className="flex flex-col divide-y">
                      {tablero.pacientesNuevosMes.pacientes.map((p) => (
                        <li key={p.id} className="py-2 first:pt-0 last:pb-0">
                          <Link href={`/pacientes/${p.id}`} className="text-sm font-medium hover:underline">
                            {nombrePaciente(p)}
                          </Link>
                          <p className="text-xs text-muted-foreground">CI {p.ci}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
