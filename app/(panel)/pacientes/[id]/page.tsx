"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CalendarPlus, ClipboardList, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CitaFila, FiltroEstados } from "@/components/citas/cita-fila";
import { BotonEnlace, Dato, Encabezado, ErrorCarga, EstadoVacio, ListaSkeleton } from "@/components/comunes";
import { ConfirmarDialog } from "@/components/confirmar-dialog";
import { usePerfil } from "@/components/perfil-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDatos } from "@/hooks/use-datos";
import { deletePaciente, getPaciente, listCitasPaciente, type EstadoCita } from "@/lib/api";
import { nombrePaciente } from "@/lib/formato";

export default function FichaPacientePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { puedeEditarPacientes, puedeGestionarCitas } = usePerfil();
  const [estados, setEstados] = useState<EstadoCita[]>([]);
  const pacienteId = Number(id);
  const paciente = useDatos(() => getPaciente(pacienteId), `paciente-${id}`);
  const historial = useDatos(() => listCitasPaciente(pacienteId, estados[0]), `historial-${id}-${estados.join()}`);

  if (paciente.error) {
    return (
      <div className="mx-auto max-w-5xl">
        <Encabezado volver="/pacientes" titulo="Ficha del paciente" />
        <ErrorCarga mensaje={paciente.error} onReintentar={paciente.recargar} />
      </div>
    );
  }

  const p = paciente.data;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <Encabezado
        volver="/pacientes"
        etiqueta="Ficha del paciente"
        titulo={p ? nombrePaciente(p) : "Cargando…"}
        descripcion={p ? `CI ${p.ci}` : undefined}
        acciones={
          p && (
            <>
              {puedeGestionarCitas && (
                <BotonEnlace href={`/citas/nueva?pacienteId=${p.id}`}>
                  <CalendarPlus data-icon="inline-start" />
                  Nueva cita
                </BotonEnlace>
              )}
              {puedeEditarPacientes && (
                <>
                  <BotonEnlace href={`/pacientes/${p.id}/editar`} variant="outline">
                    <Pencil data-icon="inline-start" />
                    Editar
                  </BotonEnlace>
                  <ConfirmarDialog
                    disparador={
                      <Button variant="destructive">
                        <Trash2 data-icon="inline-start" />
                        Eliminar
                      </Button>
                    }
                    titulo="¿Eliminar paciente?"
                    descripcion={`Se eliminará a ${nombrePaciente(p)}. Solo es posible si no tiene citas registradas.`}
                    textoConfirmar="Eliminar"
                    onConfirmar={async () => {
                      await deletePaciente(p.id);
                      toast.success("Paciente eliminado");
                      router.push("/pacientes");
                    }}
                  />
                </>
              )}
            </>
          )
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos personales</CardTitle>
        </CardHeader>
        <CardContent>
          {!p ? (
            <ListaSkeleton filas={2} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Dato etiqueta="Teléfono">
                <a href={`tel:${p.telefono.replace(/\s/g, "")}`} className="hover:underline">
                  {p.telefono}
                </a>
              </Dato>
              <Dato etiqueta="Correo electrónico">{p.email ?? "Sin correo"}</Dato>
              <Dato etiqueta="Fecha de nacimiento">{p.fechaNacimiento?.slice(0, 10) ?? "Sin registrar"}</Dato>
              <Dato etiqueta="Citas registradas">{p._count.citas}</Dato>
              <Dato etiqueta="Registrado el">{p.createdAt.slice(0, 10)}</Dato>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-3">
          <CardTitle className="text-base">Historial de citas</CardTitle>
          <FiltroEstados seleccion={estados} onCambiar={setEstados} />
        </CardHeader>
        <CardContent>
          {historial.error ? (
            <ErrorCarga mensaje={historial.error} onReintentar={historial.recargar} />
          ) : !historial.data ? (
            <ListaSkeleton />
          ) : historial.data.length === 0 ? (
            <EstadoVacio icono={ClipboardList} titulo="Sin citas" descripcion={estados.length ? "No hay citas con ese estado." : "Este paciente aún no tiene citas."} />
          ) : (
            <div className={historial.cargando ? "flex flex-col gap-2 opacity-60" : "flex flex-col gap-2"}>
              {historial.data.map((cita) => (
                <div key={cita.id} className="flex flex-col gap-1">
                  <CitaFila cita={cita} conFecha mostrar={["odontologo", "tratamiento"]} />
                  {cita.atencion && (
                    <p className="ml-3 border-l-2 border-primary/40 pl-3 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Atención:</span>{" "}
                      {[cita.atencion.diagnostico, cita.atencion.tratamientoRealizado, cita.atencion.observaciones].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
