"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const CLAVE = "consultorio.tema";
const EVENTO = "consultorio:tema";

/** Se inyecta en <head> para aplicar el tema antes de pintar y evitar parpadeos. */
export const SCRIPT_TEMA = `try{var t=localStorage.getItem("${CLAVE}");if(t==="oscuro"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

function suscribir(aviso: () => void) {
  window.addEventListener(EVENTO, aviso);
  return () => window.removeEventListener(EVENTO, aviso);
}

export function ThemeToggle() {
  const oscuro = useSyncExternalStore(suscribir, () => document.documentElement.classList.contains("dark"), () => false);

  function alternar() {
    const siguiente = !oscuro;
    document.documentElement.classList.toggle("dark", siguiente);
    localStorage.setItem(CLAVE, siguiente ? "oscuro" : "claro");
    window.dispatchEvent(new Event(EVENTO));
  }

  return (
    <Button variant="ghost" size="icon" aria-label={oscuro ? "Usar modo claro" : "Usar modo oscuro"} onClick={alternar}>
      {oscuro ? <Sun /> : <Moon />}
    </Button>
  );
}
