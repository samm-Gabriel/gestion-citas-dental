"use client";

import { AlertCircle, CalendarX2, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useDatos } from "@/hooks/use-datos";
import { ApiError, listCitas, listOdontologos, listTratamientos, type CodigoError, type Odontologo } from "@/lib/api";
import { diaSemanaDeFecha } from "@/lib/fechas";
import { DIAS_SEMANA, nombrePaciente, ordenarHorarios } from "@/lib/formato";

const TITULOS: Partial<Record<CodigoError, string>> = {
  CHOQUE_HORARIO: "El horario ya está ocupado",
  FUERA_DE_HORARIO: "Fuera del horario de atención",
  CITA_EN_PASADO: "La fecha y hora ya pasaron",
  INACTIVO: "Odontólogo o tratamiento inactivo",
  ESTADO_INVALIDO: "La cita no admite este cambio",
  NO_ENCONTRADO: "No se encontró el registro",
  VALIDACION: "Revisa los datos",
};

/** Muestra un error de la API con un título según el código de las reglas de agenda. */
export function AlertaErrorAgenda({ error }: { error: unknown }) {
  if (!error) return null;
  const codigo = error instanceof ApiError ? error.code : undefined;
  const mensaje = error instanceof Error ? error.message : "Ocurrió un error inesperado";
  return (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertTitle>{(codigo && TITULOS[codigo]) ?? "No se pudo guardar"}</AlertTitle>
      <AlertDescription>{mensaje}</AlertDescription>
    </Alert>
  );
}

/** Odontólogos y tratamientos activos para los selectores de citas. */
export function useCatalogos() {
  const odontologos = useDatos(() => listOdontologos({ activo: true, pageSize: 100 }), "catalogo-odontologos");
  const tratamientos = useDatos(() => listTratamientos({ activo: true, pageSize: 100 }), "catalogo-tratamientos");
  return {
    odontologos: odontologos.data?.data ?? [],
    tratamientos: tratamientos.data?.data ?? [],
    cargando: odontologos.cargando || tratamientos.cargando,
    error: odontologos.error ?? tratamientos.error,
  };
}

/** Bloques de atención del odontólogo para la fecha y citas ya ocupadas ese día. */
export function HorarioDelDia({ odontologo, fecha, excluirCitaId }: { odontologo?: Odontologo; fecha: string; excluirCitaId?: number }) {
  const valido = !!odontologo && /^\d{4}-\d{2}-\d{2}$/.test(fecha);
  const ocupadas = useDatos(
    () => listCitas({ desde: fecha, hasta: fecha, odontologoId: odontologo?.id, estado: ["PENDIENTE", "CONFIRMADA"], pageSize: 200 }),
    valido ? `ocupadas-${odontologo?.id}-${fecha}` : null,
  );
  if (!valido || !odontologo) return null;

  const dia = diaSemanaDeFecha(fecha);
  const bloques = ordenarHorarios(odontologo.horarios.filter((h) => h.diaSemana === dia));
  const citas = (ocupadas.data?.data ?? []).filter((c) => c.id !== excluirCitaId);

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
      <p className="font-medium">
        {DIAS_SEMANA[dia]}: horario de {odontologo.nombre}
      </p>
      {bloques.length === 0 ? (
        <p className="inline-flex items-center gap-1.5 text-destructive">
          <CalendarX2 className="size-4" />
          No atiende este día.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {bloques.map((b) => (
            <span key={`${b.horaInicio}-${b.horaFin}`} className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary tabular-nums">
              {b.horaInicio}–{b.horaFin}
            </span>
          ))}
        </div>
      )}
      {citas.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">Horas ya reservadas:</p>
          <ul className="flex flex-wrap gap-1.5">
            {citas.map((c) => (
              <li key={c.id} title={nombrePaciente(c.paciente)} className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-0.5 text-xs tabular-nums">
                <Clock className="size-3 text-muted-foreground" />
                {c.horaInicio}–{c.horaFin}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
