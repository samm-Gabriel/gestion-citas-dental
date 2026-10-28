"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MENUS, PERFILES, usePerfil, type ItemMenu } from "@/components/perfil-provider";
import { cn } from "@/lib/utils";

function activo(pathname: string, item: ItemMenu, items: ItemMenu[]) {
  if (pathname === item.href) return true;
  if (!pathname.startsWith(`${item.href}/`)) return false;
  // "/citas/nueva" tiene su propio ítem: no marcar también "/citas".
  return !items.some((otro) => otro.href !== item.href && otro.href.startsWith(item.href) && pathname.startsWith(otro.href));
}

export function Marca() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Smile className="size-5" />
      </div>
      <div className="leading-tight">
        <p className="font-semibold">Consultorio Dental</p>
        <p className="text-xs text-muted-foreground">Gestión de citas</p>
      </div>
    </div>
  );
}

export function AppSidebar({ onNavegar }: { onNavegar?: () => void }) {
  const { perfil, salir } = usePerfil();
  const pathname = usePathname();
  if (!perfil) return null;
  const items = MENUS[perfil];
  const InfoPerfil = PERFILES[perfil];

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="px-2 pt-1">
        <Marca />
      </div>
      <Separator />
      <nav className="flex flex-col gap-1" aria-label="Navegación principal">
        {items.map((item) => {
          const seleccionado = activo(pathname, item, items);
          const Icono = item.icono;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavegar}
              aria-current={seleccionado ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                seleccionado ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icono className="size-4" />
              {item.etiqueta}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col gap-2">
        <div className="flex items-center gap-3 rounded-lg bg-muted/60 px-3 py-2.5">
          <InfoPerfil.icono className="size-4 text-primary" />
          <div className="text-sm leading-tight">
            <p className="text-xs text-muted-foreground">Perfil</p>
            <p className="font-medium">{InfoPerfil.nombre}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground"
          onClick={() => {
            onNavegar?.();
            salir();
          }}
        >
          <LogOut data-icon="inline-start" />
          Cambiar perfil
        </Button>
      </div>
    </div>
  );
}
