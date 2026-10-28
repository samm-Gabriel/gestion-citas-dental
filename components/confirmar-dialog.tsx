"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { mensajeError } from "@/lib/api";

/** Pide confirmación y ejecuta `onConfirmar`; si falla, muestra el mensaje de la API en el diálogo. */
export function ConfirmarDialog({
  disparador,
  titulo,
  descripcion,
  textoConfirmar = "Confirmar",
  destructivo = true,
  onConfirmar,
}: {
  disparador: React.ReactElement;
  titulo: string;
  descripcion: React.ReactNode;
  textoConfirmar?: string;
  destructivo?: boolean;
  onConfirmar: () => Promise<void>;
}) {
  const [abierto, setAbierto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmar() {
    setEnviando(true);
    setError(null);
    try {
      await onConfirmar();
      setAbierto(false);
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AlertDialog
      open={abierto}
      onOpenChange={(valor) => {
        setAbierto(valor);
        if (!valor) setError(null);
      }}
    >
      <AlertDialogTrigger render={disparador} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descripcion}</AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={enviando}>Volver</AlertDialogCancel>
          <AlertDialogAction variant={destructivo ? "destructive" : "default"} disabled={enviando} onClick={confirmar}>
            {enviando ? "Procesando…" : textoConfirmar}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
