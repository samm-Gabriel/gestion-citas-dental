"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { Marca } from "@/components/app-sidebar";
import { AlertaError } from "@/components/comunes";
import { PERFILES, usePerfil, type Perfil } from "@/components/perfil-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { useDatos } from "@/hooks/use-datos";
import { listOdontologos } from "@/lib/api";
import { cn } from "@/lib/utils";

const ORDEN: Perfil[] = ["RECEPCIONISTA", "ODONTOLOGO", "ADMINISTRADOR"];

export default function SelectorPerfilPage() {
  const router = useRouter();
  const { perfil: actual, elegir } = usePerfil();
  const [seleccionado, setSeleccionado] = useState<Perfil | null>(null);
  const [odontologoId, setOdontologoId] = useState("");
  const odontologos = useDatos(() => listOdontologos({ activo: true, pageSize: 100 }), seleccionado === "ODONTOLOGO" ? "odontologos" : null);

  function entrar(perfil: Perfil, id?: number) {
    elegir(perfil, id);
    router.push(PERFILES[perfil].inicio);
  }

  function alElegir(perfil: Perfil) {
    if (perfil === "ODONTOLOGO") setSeleccionado(perfil);
    else entrar(perfil);
  }

  return (
    <main className="min-h-svh bg-gradient-to-b from-primary/10 via-background to-background">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-5 py-8 md:py-14">
        <header className="flex items-center justify-between">
          <Marca />
          <ThemeToggle />
        </header>

        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">¿Con qué perfil deseas ingresar?</h1>
          <p className="max-w-2xl text-muted-foreground">
            Cada perfil muestra solo los menús que necesita. Puedes cambiarlo en cualquier momento desde la barra lateral.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {ORDEN.map((perfil) => {
            const info = PERFILES[perfil];
            const Icono = info.icono;
            const activo = seleccionado === perfil;
            return (
              <Card key={perfil} className={cn("transition-all", activo ? "ring-2 ring-primary" : "hover:-translate-y-0.5 hover:shadow-md")}>
                <CardContent className="flex h-full flex-col gap-5">
                  <button type="button" onClick={() => alElegir(perfil)} className="flex flex-1 flex-col gap-4 text-left outline-none">
                    <div className="flex items-start justify-between">
                      <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icono className="size-6" />
                      </div>
                      {actual === perfil && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          <Check className="size-3" />
                          Actual
                        </span>
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">{info.nombre}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{info.descripcion}</p>
                    </div>
                    {perfil !== "ODONTOLOGO" && (
                      <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary">
                        Ingresar
                        <ArrowRight className="size-4" />
                      </span>
                    )}
                  </button>

                  {perfil === "ODONTOLOGO" &&
                    (activo ? (
                      <form
                        className="flex flex-col gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (odontologoId) entrar("ODONTOLOGO", Number(odontologoId));
                        }}
                      >
                        <Label htmlFor="odontologo">¿Quién eres?</Label>
                        <NativeSelect
                          id="odontologo"
                          value={odontologoId}
                          onChange={(e) => setOdontologoId(e.target.value)}
                          disabled={odontologos.cargando}
                        >
                          <option value="">{odontologos.cargando ? "Cargando odontólogos…" : "Selecciona tu nombre"}</option>
                          {odontologos.data?.data.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.nombre} — {o.especialidad}
                            </option>
                          ))}
                        </NativeSelect>
                        <AlertaError titulo="No se pudo cargar la lista" mensaje={odontologos.error} />
                        <Button type="submit" disabled={!odontologoId}>
                          Ingresar a mi agenda
                          <ArrowRight data-icon="inline-end" />
                        </Button>
                      </form>
                    ) : (
                      <Button variant="outline" onClick={() => alElegir("ODONTOLOGO")}>
                        Elegir odontólogo
                      </Button>
                    ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </main>
  );
}
