"use client";

import { useCallback, useEffect, useEffectEvent, useState } from "react";
import { mensajeError } from "@/lib/api";

type Resultado<T> = { clave: string; data: T | null; error: string | null };

/**
 * Carga datos cada vez que cambia `clave` (o al llamar a `recargar`).
 * Mientras recarga conserva los datos anteriores para no parpadear.
 * Con `clave = null` no carga nada.
 */
export function useDatos<T>(cargar: () => Promise<T>, clave: string | null) {
  const [resultado, setResultado] = useState<Resultado<T> | null>(null);
  const [version, setVersion] = useState(0);
  const ejecutar = useEffectEvent(cargar);
  const claveActual = clave === null ? null : `${clave}#${version}`;

  useEffect(() => {
    if (claveActual === null) return;
    let vigente = true;
    ejecutar().then(
      (data) => {
        if (vigente) setResultado({ clave: claveActual, data, error: null });
      },
      (error: unknown) => {
        if (vigente) setResultado({ clave: claveActual, data: null, error: mensajeError(error) });
      },
    );
    return () => {
      vigente = false;
    };
  }, [claveActual]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);
  const cargando = claveActual !== null && resultado?.clave !== claveActual;

  return {
    data: resultado?.data ?? null,
    error: cargando ? null : (resultado?.error ?? null),
    cargando,
    recargar,
  };
}
