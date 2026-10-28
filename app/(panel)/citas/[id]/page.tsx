"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { AtencionDialog } from "@/components/citas/atencion-dialog";
import { CitaAcciones } from "@/components/citas/cita-acciones";
import { Dato, Encabezado, ErrorCarga, EstadoVacio, ListaSkeleton } from "@/components/comunes";
import { EstadoBadge } from "@/components/estado-badge";
import { usePerfil } from "@/components/perfil-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDatos } from "@/hooks/use-datos";
import { getCita } from "@/lib/api";
import { formatearDuracion, formatearFechaLarga, formatearPrecio, nombrePaciente } from "@/lib/formato";

export default function DetalleCitaPage() {
  const { id } = useParams<{ id: string }>();
  const { puedeGestionarCitas, puedeRegistrarAtencion } = usePerfil();
  const { data: cita, error, recargar } = useDatos(() => getCita(Number(id)), `cita-${id}`);

  if (error) {
    return (
      <div className="mx-auto max-w-4xl">
        <Encabezado volver="/citas" titulo="Detalle de la cita" />
        <ErrorCarga mensaje={error} onReintentar={recargar} />
      </div>
    );
  }

  if (!cita) {
    return (
      <div className="mx-auto max-w-4xl">
        <Encabezado volver="/citas" titulo="Cargando…" />
        <ListaSkeleton filas={3} />
      </div>
    );
  }

  const atencion = cita.atencion;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Encabezado
        volver="/citas"
        etiqueta={`Cita #${cita.id}`}
        titulo={nombrePaciente(cita.paciente)}
        descripcion={`${formatearFechaLarga(cita.fecha)} · ${cita.horaInicio}–${cita.horaFin}`}
        acciones={
          <>
            {puedeGestionarCitas && <CitaAcciones cita={cita} onCambio={recargar} />}
            {puedeRegistrarAtencion && <AtencionDialog cita={cita} onCambio={recargar} />}
          </>
        }
      />

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">Datos de la cita</CardTitle>
          <EstadoBadge estado={cita.estado} />
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Dato etiqueta="Paciente">
            {cita.paciente ? (
              <Link href={`/pacientes/${cita.pacienteId}`} className="hover:underline">
                {nombrePaciente(cita.paciente)}
              </Link>
            ) : (
              "—"
            )}
            {cita.paciente && <p className="text-xs font-normal text-muted-foreground">CI {cita.paciente.ci} · {cita.paciente.telefono}</p>}
          </Dato>
          <Dato etiqueta="Odontólogo">
            {cita.odontologo?.nombre ?? "—"}
            {cita.odontologo && <p className="text-xs font-normal text-muted-foreground">{cita.odontologo.especialidad}</p>}
          </Dato>
          <Dato etiqueta="Tratamiento">
            {cita.tratamiento?.nombre ?? "—"}
            {cita.tratamiento && (
              <p className="text-xs font-normal text-muted-foreground">
                {formatearDuracion(cita.tratamiento.duracionMinutos)} · {formatearPrecio(cita.tratamiento.precio)}
              </p>
            )}
          </Dato>
          <Dato etiqueta="Fecha y hora">
            {formatearFechaLarga(cita.fecha)}
            <p className="text-xs font-normal text-muted-foreground tabular-nums">
              {cita.horaInicio} a {cita.horaFin}
            </p>
          </Dato>
          <Dato etiqueta="Motivo" className="sm:col-span-2">
            {cita.motivo ?? <span className="font-normal text-muted-foreground">Sin motivo registrado</span>}
          </Dato>
          {cita.estado === "CANCELADA" && (
            <Dato etiqueta="Motivo de la cancelación" className="sm:col-span-2">
              {cita.motivoCancelacion ?? <span className="font-normal text-muted-foreground">No se indicó</span>}
            </Dato>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Atención</CardTitle>
        </CardHeader>
        <CardContent>
          {atencion ? (
            <div className="grid gap-4">
              <Dato etiqueta="Diagnóstico">{atencion.diagnostico ?? "—"}</Dato>
              <Dato etiqueta="Tratamiento realizado">{atencion.tratamientoRealizado ?? "—"}</Dato>
              <Dato etiqueta="Observaciones">{atencion.observaciones ?? "—"}</Dato>
            </div>
          ) : (
            <EstadoVacio
              icono={ClipboardList}
              titulo="Sin atención registrada"
              descripcion={cita.estado === "CANCELADA" ? "La cita fue cancelada." : "El odontólogo registra la atención desde su agenda del día."}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
