"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { hoyLocal } from "@/lib/fechas";

const sinSuscripcion = () => () => {};

/**
 * Fecha de hoy (AAAA-MM-DD) en La Paz. Devuelve null durante el prerender del servidor,
 * donde no se puede leer el reloj con cacheComponents.
 */
export function useHoy(): string | null {
  return useSyncExternalStore(sinSuscripcion, () => hoyLocal(), () => null);
}

/** true una vez hidratado en el navegador. */
export function useMontado(): boolean {
  return useSyncExternalStore(sinSuscripcion, () => true, () => false);
}

export function useDebounce<T>(valor: T, ms = 300): T {
  const [demorado, setDemorado] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setDemorado(valor), ms);
    return () => clearTimeout(t);
  }, [valor, ms]);
  return demorado;
}
