import Link from "next/link";
import { AlertCircle, ArrowLeft, Inbox, type LucideIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function Encabezado({
  titulo,
  descripcion,
  etiqueta,
  volver,
  acciones,
}: {
  titulo: React.ReactNode;
  descripcion?: React.ReactNode;
  etiqueta?: string;
  volver?: string;
  acciones?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {volver && (
          <Link href={volver} className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
            Volver
          </Link>
        )}
        {etiqueta && <p className="text-sm font-medium text-primary">{etiqueta}</p>}
        <h2 className="text-2xl font-semibold tracking-tight text-balance">{titulo}</h2>
        {descripcion && <p className="mt-1 text-sm text-muted-foreground">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
    </div>
  );
}

export function BotonEnlace({
  href,
  children,
  variant = "default",
  size = "default",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  return (
    <Link href={href} className={cn(buttonVariants({ variant, size }), className)}>
      {children}
    </Link>
  );
}

export function EstadoVacio({ icono: Icono = Inbox, titulo, descripcion, children }: { icono?: LucideIcon; titulo: string; descripcion?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icono className="size-6" />
      </div>
      <p className="font-medium">{titulo}</p>
      {descripcion && <p className="max-w-sm text-sm text-muted-foreground">{descripcion}</p>}
      {children}
    </div>
  );
}

export function ErrorCarga({ mensaje, onReintentar }: { mensaje: string; onReintentar?: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertTitle>No se pudieron cargar los datos</AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-2">
        <span>{mensaje}</span>
        {onReintentar && (
          <Button size="sm" variant="outline" onClick={onReintentar}>
            Reintentar
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

export function AlertaError({ titulo = "No se pudo guardar", mensaje }: { titulo?: string; mensaje: string | null }) {
  if (!mensaje) return null;
  return (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertTitle>{titulo}</AlertTitle>
      <AlertDescription>{mensaje}</AlertDescription>
    </Alert>
  );
}

export function ListaSkeleton({ filas = 4 }: { filas?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Cargando">
      {Array.from({ length: filas }, (_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function Campo({
  id,
  etiqueta,
  error,
  ayuda,
  requerido,
  className,
  children,
}: {
  id: string;
  etiqueta: string;
  error?: string;
  ayuda?: string;
  requerido?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>
        {etiqueta}
        {requerido && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : (
        ayuda && <p className="text-xs text-muted-foreground">{ayuda}</p>
      )}
    </div>
  );
}

export function Dato({ etiqueta, children, className }: { etiqueta: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-xs text-muted-foreground">{etiqueta}</p>
      <div className="font-medium break-words">{children}</div>
    </div>
  );
}
