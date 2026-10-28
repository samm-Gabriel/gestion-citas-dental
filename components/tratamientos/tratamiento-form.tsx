"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertaError, Campo } from "@/components/comunes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, createTratamiento, erroresPorCampo, mensajeError, updateTratamiento, type Tratamiento, type TratamientoInput } from "@/lib/api";

export function TratamientoForm({ tratamiento }: { tratamiento?: Tratamiento }) {
  const router = useRouter();
  const [nombre, setNombre] = useState(tratamiento?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(tratamiento?.descripcion ?? "");
  const [duracion, setDuracion] = useState(tratamiento ? String(tratamiento.duracionMinutos) : "30");
  const [precio, setPrecio] = useState(tratamiento?.precio ?? "");
  const [activo, setActivo] = useState(tratamiento?.activo ?? true);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const locales: Record<string, string> = {};
    const minutos = Number(duracion);
    if (!nombre.trim()) locales.nombre = "Ingresa el nombre";
    if (!Number.isInteger(minutos) || minutos < 5 || minutos > 480) locales.duracionMinutos = "Entre 5 y 480 minutos";
    if (!/^\d{1,8}(\.\d{1,2})?$/.test(precio.trim())) locales.precio = "Monto en Bs con hasta 2 decimales (ej. 250 o 250.50)";
    setErrores(locales);
    setErrorGeneral(null);
    if (Object.keys(locales).length) return;

    const input: TratamientoInput = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || null,
      duracionMinutos: minutos,
      precio: precio.trim(),
      activo,
    };
    setEnviando(true);
    try {
      if (tratamiento) await updateTratamiento(tratamiento.id, input);
      else await createTratamiento(input);
      toast.success(tratamiento ? "Tratamiento actualizado" : "Tratamiento registrado");
      router.push("/tratamientos");
    } catch (err) {
      const porCampo = erroresPorCampo(err);
      if (err instanceof ApiError && err.code === "NOMBRE_DUPLICADO") porCampo.nombre = err.message;
      setErrores(porCampo);
      setErrorGeneral(Object.keys(porCampo).length ? "Revisa los campos marcados." : mensajeError(err));
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={guardar} noValidate>
      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <AlertaError mensaje={errorGeneral} />
          </div>
          <Campo id="nombre" etiqueta="Nombre" requerido error={errores.nombre} className="sm:col-span-2">
            <Input id="nombre" placeholder="Obturación con resina" value={nombre} onChange={(e) => setNombre(e.target.value)} aria-invalid={!!errores.nombre} />
          </Campo>
          <Campo id="descripcion" etiqueta="Descripción" error={errores.descripcion} className="sm:col-span-2">
            <Textarea id="descripcion" rows={3} maxLength={500} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </Campo>
          <Campo id="duracion" etiqueta="Duración (minutos)" requerido error={errores.duracionMinutos} ayuda="Entre 5 y 480">
            <Input id="duracion" type="number" inputMode="numeric" min={5} max={480} step={5} value={duracion} onChange={(e) => setDuracion(e.target.value)} aria-invalid={!!errores.duracionMinutos} />
          </Campo>
          <Campo id="precio" etiqueta="Precio (Bs)" requerido error={errores.precio}>
            <Input id="precio" inputMode="decimal" placeholder="250" value={precio} onChange={(e) => setPrecio(e.target.value)} aria-invalid={!!errores.precio} />
          </Campo>
          <div className="flex items-center justify-between gap-4 rounded-lg border p-3 sm:col-span-2">
            <div>
              <Label htmlFor="activo">Activo</Label>
              <p className="text-xs text-muted-foreground">Los tratamientos inactivos no se pueden agendar.</p>
            </div>
            <Switch id="activo" checked={activo} onCheckedChange={(v) => setActivo(v)} />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" disabled={enviando}>
            {enviando ? "Guardando…" : tratamiento ? "Guardar cambios" : "Registrar tratamiento"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
