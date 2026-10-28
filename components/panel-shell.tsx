"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { AppSidebar, Marca } from "@/components/app-sidebar";
import { PERFILES, usePerfil } from "@/components/perfil-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useMontado } from "@/hooks/use-hoy";

export function PanelCargando() {
  return (
    <div className="flex min-h-svh">
      <div className="hidden w-64 shrink-0 border-r bg-card p-4 md:block">
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="flex-1 p-4 md:p-8">
        <Skeleton className="mb-6 h-8 w-56" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function PanelShell({ children }: { children: React.ReactNode }) {
  const { perfil } = usePerfil();
  const montado = useMontado();
  const router = useRouter();
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    if (montado && !perfil) router.replace("/");
  }, [montado, perfil, router]);

  if (!perfil) return <PanelCargando />;

  return (
    <div className="flex min-h-svh bg-muted/30">
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 border-r bg-card p-4 md:block">
        <AppSidebar />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b bg-background/90 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <Sheet open={menuAbierto} onOpenChange={setMenuAbierto}>
              <SheetTrigger render={<Button variant="outline" size="icon" className="md:hidden" aria-label="Abrir menú" />}>
                <Menu />
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-4">
                <SheetTitle className="sr-only">Menú</SheetTitle>
                <AppSidebar onNavegar={() => setMenuAbierto(false)} />
              </SheetContent>
            </Sheet>
            <div className="md:hidden">
              <Marca />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:inline">{PERFILES[perfil].nombre}</span>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-4 pb-16 md:p-8">{children}</main>
      </div>
    </div>
  );
}
