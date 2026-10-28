import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MetaPaginacion } from "@/lib/api";

export function Paginacion({ meta, onCambiar }: { meta: MetaPaginacion | null | undefined; onCambiar: (pagina: number) => void }) {
  if (!meta) return null;
  return (
    <div className="flex flex-col items-center justify-between gap-3 pt-4 text-sm text-muted-foreground sm:flex-row">
      <span>
        {meta.total} {meta.total === 1 ? "registro" : "registros"}
      </span>
      {meta.totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" disabled={meta.page <= 1} onClick={() => onCambiar(meta.page - 1)}>
            <ChevronLeft data-icon="inline-start" />
            Anterior
          </Button>
          <span className="px-2 tabular-nums">
            Página {meta.page} de {meta.totalPages}
          </span>
          <Button size="sm" variant="outline" disabled={meta.page >= meta.totalPages} onClick={() => onCambiar(meta.page + 1)}>
            Siguiente
            <ChevronRight data-icon="inline-end" />
          </Button>
        </div>
      )}
    </div>
  );
}
