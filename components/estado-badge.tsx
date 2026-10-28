import { Badge } from "@/components/ui/badge";
import type { EstadoCita } from "@/lib/api";
import { ETIQUETA_ESTADO } from "@/lib/formato";
import { cn } from "@/lib/utils";

const COLORES: Record<EstadoCita, string> = {
  PENDIENTE: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300",
  CONFIRMADA: "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-500/40 dark:bg-sky-500/15 dark:text-sky-300",
  ATENDIDA: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300",
  CANCELADA: "border-rose-200 bg-rose-50 text-rose-700 line-through decoration-rose-400/60 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300",
};

export function EstadoBadge({ estado, className }: { estado: EstadoCita; className?: string }) {
  return (
    <Badge variant="outline" className={cn(COLORES[estado], className)}>
      {ETIQUETA_ESTADO[estado]}
    </Badge>
  );
}

export function ActivoBadge({ activo }: { activo: boolean }) {
  return (
    <Badge
      variant="outline"
      className={
        activo
          ? "border-teal-300 bg-teal-50 text-teal-800 dark:border-teal-500/40 dark:bg-teal-500/15 dark:text-teal-300"
          : "text-muted-foreground"
      }
    >
      {activo ? "Activo" : "Inactivo"}
    </Badge>
  );
}
