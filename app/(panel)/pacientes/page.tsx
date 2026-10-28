"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Phone, Plus, Search, Users } from "lucide-react";
import { BotonEnlace, Encabezado, ErrorCarga, EstadoVacio, ListaSkeleton } from "@/components/comunes";
import { Paginacion } from "@/components/paginacion";
import { usePerfil } from "@/components/perfil-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDatos } from "@/hooks/use-datos";
import { useDebounce } from "@/hooks/use-hoy";
import { listPacientes } from "@/lib/api";
import { nombrePaciente } from "@/lib/formato";

export default function PacientesPage() {
  const router = useRouter();
  const { puedeEditarPacientes } = usePerfil();
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const q = useDebounce(busqueda.trim());
  const { data, error, cargando, recargar } = useDatos(() => listPacientes({ q, page: pagina, pageSize: 10 }), `${q}|${pagina}`);

  return (
    <div className="mx-auto max-w-6xl">
      <Encabezado
        etiqueta="Registro"
        titulo="Pacientes"
        descripcion="Busca por nombre, apellido o CI y abre la ficha con el historial de citas."
        acciones={
          puedeEditarPacientes && (
            <BotonEnlace href="/pacientes/nuevo">
              <Plus data-icon="inline-start" />
              Nuevo paciente
            </BotonEnlace>
          )
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nombre, apellido o CI…"
              aria-label="Buscar pacientes"
              className="h-9 pl-8"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPagina(1);
              }}
            />
          </div>

          {error ? (
            <ErrorCarga mensaje={error} onReintentar={recargar} />
          ) : !data ? (
            <ListaSkeleton />
          ) : data.data.length === 0 ? (
            <EstadoVacio icono={Users} titulo="No hay pacientes" descripcion={q ? `Ningún paciente coincide con «${q}».` : "Todavía no se registraron pacientes."} />
          ) : (
            <div className={cargando ? "opacity-60 transition-opacity" : "transition-opacity"}>
              <ul className="flex flex-col gap-2 md:hidden">
                {data.data.map((p) => (
                  <li key={p.id}>
                    <Link href={`/pacientes/${p.id}`} className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:border-primary/50">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {p.nombre.charAt(0)}
                        {p.apellido.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{nombrePaciente(p)}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          CI {p.ci} · {p.telefono}
                        </p>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>

              <Table className="hidden md:table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>CI</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Nacimiento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((p) => (
                    <TableRow key={p.id} className="cursor-pointer" onClick={() => router.push(`/pacientes/${p.id}`)}>
                      <TableCell className="font-medium">
                        <Link href={`/pacientes/${p.id}`} className="hover:underline">
                          {nombrePaciente(p)}
                        </Link>
                      </TableCell>
                      <TableCell>{p.ci}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1">
                          <Phone className="size-3 text-muted-foreground" />
                          {p.telefono}
                        </span>
                      </TableCell>
                      <TableCell>{p.email ?? <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>{p.fechaNacimiento?.slice(0, 10) ?? <span className="text-muted-foreground">—</span>}</TableCell>
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
