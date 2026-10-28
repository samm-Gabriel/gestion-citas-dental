"use client";

import { useParams, useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Encabezado, ErrorCarga, ListaSkeleton } from "@/components/comunes";
import { ConfirmarDialog } from "@/components/confirmar-dialog";
import { OdontologoForm } from "@/components/odontologos/odontologo-form";
import { Button } from "@/components/ui/button";
import { useDatos } from "@/hooks/use-datos";
import { deleteOdontologo, getOdontologo } from "@/lib/api";

export default function EditarOdontologoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: odontologo, error, recargar } = useDatos(() => getOdontologo(Number(id)), `odontologo-${id}`);

  return (
    <div className="mx-auto max-w-3xl">
      <Encabezado
        volver="/odontologos"
        etiqueta="Editar odontólogo"
        titulo={odontologo?.nombre ?? "Odontólogo"}
        descripcion={odontologo ? `${odontologo._count.citas} cita(s) registrada(s)` : undefined}
        acciones={
          odontologo && (
            <ConfirmarDialog
              disparador={
                <Button variant="destructive">
                  <Trash2 data-icon="inline-start" />
                  Eliminar
                </Button>
              }
              titulo="¿Eliminar odontólogo?"
              descripcion={
                odontologo._count.citas > 0
                  ? "Tiene citas registradas, por lo que no se puede eliminar. Desactívalo con el interruptor «Activo» para que no reciba nuevas citas."
                  : `Se eliminará a ${odontologo.nombre} junto con su horario.`
              }
              textoConfirmar="Eliminar"
              onConfirmar={async () => {
                await deleteOdontologo(odontologo.id);
                toast.success("Odontólogo eliminado");
                router.push("/odontologos");
              }}
            />
          )
        }
      />
      {error ? <ErrorCarga mensaje={error} onReintentar={recargar} /> : !odontologo ? <ListaSkeleton filas={3} /> : <OdontologoForm odontologo={odontologo} />}
    </div>
  );
}
