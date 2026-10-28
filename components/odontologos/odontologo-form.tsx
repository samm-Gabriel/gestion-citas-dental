"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AlertaError, Campo } from "@/components/comunes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { createOdontologo, erroresPorCampo, mensajeError, updateOdontologo, type HorarioInput, type Odontologo, type OdontologoInput } from "@/lib/api";
import { DIAS_SEMANA, ordenarHorarios } from "@/lib/formato";

type Bloque = HorarioInput & { clave: number };

const conClaves = (horarios: HorarioInput[]): Bloque[] => horarios.map((h, i) => ({ ...h, clave: i + 1 }));
const siguienteClave = (bloques: Bloque[]) => Math.max(0, ...bloques.map((b) => b.clave)) + 1;

function validarHorarios(bloques: Bloque[]): string | null {
  for (const b of bloques) {
    if (!b.horaInicio || !b.horaFin) return "Completa la hora de inicio y fin de cada bloque.";
    if (b.horaInicio >= b.horaFin) return `${DIAS_SEMANA[b.diaSemana]}: la hora de inicio debe ser anterior a la de fin.`;
  }
  const ordenados = ordenarHorarios(bloques);
  for (let i = 1; i < ordenados.length; i++) {
    const [a, b] = [ordenados[i - 1], ordenados[i]];
    if (a.diaSemana === b.diaSemana && b.horaInicio < a.horaFin) {
      return `${DIAS_SEMANA[a.diaSemana]}: los bloques ${a.horaInicio}–${a.horaFin} y ${b.horaInicio}–${b.horaFin} se solapan.`;
    }
  }
  return null;
}

export function OdontologoForm({ odontologo }: { odontologo?: Odontologo }) {
  const router = useRouter();
  const [nombre, setNombre] = useState(odontologo?.nombre ?? "");
  const [especialidad, setEspecialidad] = useState(odontologo?.especialidad ?? "");
  const [activo, setActivo] = useState(odontologo?.activo ?? true);
  const [bloques, setBloques] = useState<Bloque[]>(() =>
    conClaves(odontologo ? ordenarHorarios(odontologo.horarios) : [{ diaSemana: 1, horaInicio: "08:00", horaFin: "12:00" }]),
  );
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const actualizarBloque = (clave: number, cambios: Partial<HorarioInput>) =>
    setBloques((lista) => lista.map((b) => (b.clave === clave ? { ...b, ...cambios } : b)));

  function agregarBloque() {
    const ultimo = bloques.at(-1);
    setBloques((lista) => [...lista, { clave: siguienteClave(lista), diaSemana: ultimo ? (ultimo.diaSemana % 6) + 1 : 1, horaInicio: "08:00", horaFin: "12:00" }]);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const locales: Record<string, string> = {};
    if (!nombre.trim()) locales.nombre = "Ingresa el nombre";
    if (!especialidad.trim()) locales.especialidad = "Ingresa la especialidad";
    const errorHorario = validarHorarios(bloques);
    if (errorHorario) locales.horarios = errorHorario;
    setErrores(locales);
    setErrorGeneral(null);
    if (Object.keys(locales).length) return;

    const input: OdontologoInput = {
      nombre: nombre.trim(),
      especialidad: especialidad.trim(),
      activo,
      horarios: bloques.map(({ diaSemana, horaInicio, horaFin }) => ({ diaSemana, horaInicio, horaFin })),
    };
    setEnviando(true);
    try {
      if (odontologo) await updateOdontologo(odontologo.id, input);
      else await createOdontologo(input);
      toast.success(odontologo ? "Odontólogo actualizado" : "Odontólogo registrado");
      router.push("/odontologos");
    } catch (err) {
      const porCampo = erroresPorCampo(err);
      setErrores(porCampo);
      setErrorGeneral(Object.keys(porCampo).length ? "Revisa los campos marcados." : mensajeError(err));
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={guardar} noValidate className="flex flex-col gap-4">
      <AlertaError mensaje={errorGeneral} />
      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Campo id="nombre" etiqueta="Nombre completo" requerido error={errores.nombre}>
            <Input id="nombre" placeholder="Dra. María Fernanda Quiroga" value={nombre} onChange={(e) => setNombre(e.target.value)} aria-invalid={!!errores.nombre} />
          </Campo>
          <Campo id="especialidad" etiqueta="Especialidad" requerido error={errores.especialidad}>
            <Input id="especialidad" placeholder="Odontología general" value={especialidad} onChange={(e) => setEspecialidad(e.target.value)} aria-invalid={!!errores.especialidad} />
          </Campo>
          <div className="flex items-center justify-between gap-4 rounded-lg border p-3 sm:col-span-2">
            <div>
              <Label htmlFor="activo">Activo</Label>
              <p className="text-xs text-muted-foreground">Los odontólogos inactivos no reciben nuevas citas.</p>
            </div>
            <Switch id="activo" checked={activo} onCheckedChange={(v) => setActivo(v)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Horario de atención</CardTitle>
          <CardDescription>Bloques semanales en hora de La Paz. Un día puede tener varios bloques que no se solapen.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {bloques.length === 0 && <p className="text-sm text-muted-foreground">Sin bloques: el odontólogo no podrá recibir citas.</p>}
          {bloques.map((b, i) => (
            <div key={b.clave} className="grid grid-cols-[1fr_auto] items-end gap-2 rounded-lg border p-3 sm:grid-cols-[1.4fr_1fr_1fr_auto]">
              <div className="col-span-2 flex flex-col gap-1.5 sm:col-span-1">
                <Label htmlFor={`dia-${b.clave}`} className="text-xs">
                  Día
                </Label>
                <NativeSelect id={`dia-${b.clave}`} value={b.diaSemana} onChange={(e) => actualizarBloque(b.clave, { diaSemana: Number(e.target.value) })}>
                  {DIAS_SEMANA.map((dia, n) => (
                    <option key={dia} value={n}>
                      {dia}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="flex gap-2 sm:contents">
                <div className="flex flex-1 flex-col gap-1.5">
                  <Label htmlFor={`inicio-${b.clave}`} className="text-xs">
                    Desde
                  </Label>
                  <Input id={`inicio-${b.clave}`} type="time" value={b.horaInicio} onChange={(e) => actualizarBloque(b.clave, { horaInicio: e.target.value })} />
                </div>
                <div className="flex flex-1 flex-col gap-1.5">
                  <Label htmlFor={`fin-${b.clave}`} className="text-xs">
                    Hasta
                  </Label>
                  <Input id={`fin-${b.clave}`} type="time" value={b.horaFin} onChange={(e) => actualizarBloque(b.clave, { horaFin: e.target.value })} />
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Quitar bloque ${i + 1}`}
                onClick={() => setBloques((lista) => lista.filter((x) => x.clave !== b.clave))}
              >
                <Trash2 />
              </Button>
            </div>
          ))}
          {errores.horarios && <p className="text-sm text-destructive">{errores.horarios}</p>}
          <Button type="button" variant="outline" className="self-start" onClick={agregarBloque}>
            <Plus data-icon="inline-start" />
            Agregar bloque
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" disabled={enviando}>
            {enviando ? "Guardando…" : odontologo ? "Guardar cambios" : "Registrar odontólogo"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
