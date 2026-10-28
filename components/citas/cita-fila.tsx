import Link from "next/link";
import { ChevronRight, Clock } from "lucide-react";
import { EstadoBadge } from "@/components/estado-badge";
import { ESTADOS_CITA, type Cita, type EstadoCita } from "@/lib/api";
import { ETIQUETA_ESTADO, formatearFecha, nombrePaciente } from "@/lib/formato";
import { cn } from "@/lib/utils";

/** Fila compacta de una cita. `mostrar` decide qué datos secundarios se ven. */
export function CitaFila({
  cita,
  mostrar = ["paciente", "odontologo", "tratamiento"],
  conFecha = false,
  acciones,
}: {
  cita: Cita;
  mostrar?: ("paciente" | "odontologo" | "tratamiento")[];
  conFecha?: boolean;
  acciones?: React.ReactNode;
}) {
  const principal = mostrar.includes("paciente") ? nombrePaciente(cita.paciente) : (cita.tratamiento?.nombre ?? "Cita");
  const secundarios = [
    mostrar.includes("paciente") && mostrar.includes("tratamiento") ? cita.tratamiento?.nombre : null,
    mostrar.includes("odontologo") ? cita.odontologo?.nombre : null,
  ].filter(Boolean);

  return (
    <div className={cn("flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-center", cita.estado === "CANCELADA" && "opacity-70")}>
      <Link href={`/citas/${cita.id}`} className="group flex min-w-0 flex-1 items-center gap-3">
        <div className="flex w-20 shrink-0 flex-col items-start">
          {conFecha && <span className="text-xs text-muted-foreground">{formatearFecha(cita.fecha)}</span>}
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary tabular-nums">
            <Clock className="size-3.5" />
            {cita.horaInicio}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">a {cita.horaFin}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium group-hover:underline">{principal}</p>
          {secundarios.length > 0 && <p className="truncate text-xs text-muted-foreground">{secundarios.join(" · ")}</p>}
          {cita.motivo && <p className="truncate text-xs text-muted-foreground italic">«{cita.motivo}»</p>}
        </div>
        <EstadoBadge estado={cita.estado} />
        <ChevronRight className="hidden size-4 text-muted-foreground sm:block" />
      </Link>
      {acciones && <div className="flex flex-wrap gap-2 sm:justify-end">{acciones}</div>}
    </div>
  );
}

/** Botones para filtrar por estado; `seleccion` vacía significa todos. */
export function FiltroEstados({
  seleccion,
  onCambiar,
  multiple = false,
}: {
  seleccion: EstadoCita[];
  onCambiar: (estados: EstadoCita[]) => void;
  multiple?: boolean;
}) {
  const alternar = (estado: EstadoCita) => {
    if (!multiple) return onCambiar(seleccion.includes(estado) ? [] : [estado]);
    onCambiar(seleccion.includes(estado) ? seleccion.filter((e) => e !== estado) : [...seleccion, estado]);
  };
  const clase = (activo: boolean) =>
    cn(
      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
      activo ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground",
    );

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
      <button type="button" className={clase(seleccion.length === 0)} aria-pressed={seleccion.length === 0} onClick={() => onCambiar([])}>
        Todos
      </button>
      {ESTADOS_CITA.map((estado) => (
        <button key={estado} type="button" className={clase(seleccion.includes(estado))} aria-pressed={seleccion.includes(estado)} onClick={() => alternar(estado)}>
          {ETIQUETA_ESTADO[estado]}
        </button>
      ))}
    </div>
  );
}
