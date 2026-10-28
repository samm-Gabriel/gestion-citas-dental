"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import {
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  LayoutDashboard,
  ShieldCheck,
  Stethoscope,
  Syringe,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

export type Perfil = "RECEPCIONISTA" | "ODONTOLOGO" | "ADMINISTRADOR";

export interface ItemMenu {
  href: string;
  etiqueta: string;
  icono: LucideIcon;
}

export const PERFILES: Record<Perfil, { nombre: string; descripcion: string; icono: LucideIcon; inicio: string }> = {
  RECEPCIONISTA: {
    nombre: "Recepcionista",
    descripcion: "Registra pacientes y gestiona la agenda de citas.",
    icono: UserRound,
    inicio: "/tablero",
  },
  ODONTOLOGO: {
    nombre: "Odontólogo",
    descripcion: "Consulta tu agenda del día y registra la atención.",
    icono: Stethoscope,
    inicio: "/agenda-dia",
  },
  ADMINISTRADOR: {
    nombre: "Administrador",
    descripcion: "Administra odontólogos, tratamientos y todo el consultorio.",
    icono: ShieldCheck,
    inicio: "/tablero",
  },
};

export const MENUS: Record<Perfil, ItemMenu[]> = {
  RECEPCIONISTA: [
    { href: "/tablero", etiqueta: "Tablero", icono: LayoutDashboard },
    { href: "/citas", etiqueta: "Agenda de citas", icono: CalendarDays },
    { href: "/citas/nueva", etiqueta: "Nueva cita", icono: CalendarPlus },
    { href: "/pacientes", etiqueta: "Pacientes", icono: Users },
  ],
  ODONTOLOGO: [
    { href: "/agenda-dia", etiqueta: "Mi agenda del día", icono: CalendarClock },
    { href: "/pacientes", etiqueta: "Pacientes", icono: Users },
  ],
  ADMINISTRADOR: [
    { href: "/tablero", etiqueta: "Tablero", icono: LayoutDashboard },
    { href: "/citas", etiqueta: "Agenda de citas", icono: CalendarDays },
    { href: "/agenda-dia", etiqueta: "Agenda del día", icono: CalendarClock },
    { href: "/pacientes", etiqueta: "Pacientes", icono: Users },
    { href: "/odontologos", etiqueta: "Odontólogos", icono: Stethoscope },
    { href: "/tratamientos", etiqueta: "Tratamientos", icono: Syringe },
  ],
};

const CLAVE = "consultorio.perfil";
const EVENTO = "consultorio:perfil";

function suscribir(aviso: () => void) {
  window.addEventListener("storage", aviso);
  window.addEventListener(EVENTO, aviso);
  return () => {
    window.removeEventListener("storage", aviso);
    window.removeEventListener(EVENTO, aviso);
  };
}

function guardar(valor: string | null) {
  if (valor === null) localStorage.removeItem(CLAVE);
  else localStorage.setItem(CLAVE, valor);
  window.dispatchEvent(new Event(EVENTO));
}

interface ContextoPerfil {
  perfil: Perfil | null;
  /** Odontólogo elegido cuando el perfil es ODONTOLOGO. */
  odontologoId: number | null;
  elegir: (perfil: Perfil, odontologoId?: number) => void;
  salir: () => void;
  /** Permisos derivados del perfil. */
  puedeEditarPacientes: boolean;
  puedeGestionarCitas: boolean;
  puedeRegistrarAtencion: boolean;
}

const Contexto = createContext<ContextoPerfil | null>(null);

export function PerfilProvider({ children }: { children: React.ReactNode }) {
  const crudo = useSyncExternalStore(suscribir, () => localStorage.getItem(CLAVE), () => null);

  const elegir = useCallback((perfil: Perfil, odontologoId?: number) => {
    guardar(odontologoId ? `${perfil}:${odontologoId}` : perfil);
  }, []);
  const salir = useCallback(() => guardar(null), []);

  const valor = useMemo<ContextoPerfil>(() => {
    const [nombre, id] = (crudo ?? "").split(":");
    const perfil = nombre in PERFILES ? (nombre as Perfil) : null;
    return {
      perfil,
      odontologoId: perfil === "ODONTOLOGO" && id ? Number(id) : null,
      elegir,
      salir,
      puedeEditarPacientes: perfil === "RECEPCIONISTA" || perfil === "ADMINISTRADOR",
      puedeGestionarCitas: perfil === "RECEPCIONISTA" || perfil === "ADMINISTRADOR",
      puedeRegistrarAtencion: perfil === "ODONTOLOGO" || perfil === "ADMINISTRADOR",
    };
  }, [crudo, elegir, salir]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function usePerfil() {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error("usePerfil debe usarse dentro de <PerfilProvider>");
  return contexto;
}
