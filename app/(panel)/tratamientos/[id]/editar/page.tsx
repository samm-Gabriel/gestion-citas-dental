"use client";

import { useParams, useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Encabezado, ErrorCarga, ListaSkeleton } from "@/components/comunes";
import { ConfirmarDialog } from "@/components/confirmar-dialog";
import { TratamientoForm } from "@/components/tratamientos/tratamiento-form";
import { Button } from "@/components/ui/button";
import { useDatos } from "@/hooks/use-datos";
import { deleteTratamiento, getTratamiento } from "@/lib/api";

export default function EditarTratamientoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: tratamiento, error, recargar } = useDatos(() => getTratamiento(Number(id)), `tratamiento-${id}`);

  return (
    <div className="mx-auto max-w-3xl">
      <Encabezado
        volver="/tratamientos"
        etiqueta="Editar tratamiento"
        titulo={tratamiento?.nombre ?? "Tratamiento"}
        descripcion={tratamiento ? `${tratamiento._count.citas} cita(s) con este tratamiento` : undefined}
        acciones={
          tratamiento && (
            <ConfirmarDialog
              disparador={
                <Button variant="destructive">
                  <Trash2 data-icon="inline-start" />
                  Eliminar
                </Button>
              }
              titulo="¿Eliminar tratamiento?"
              descripcion={
                tratamiento._count.citas > 0
                  ? "Tiene citas registradas, por lo que no se puede eliminar. Desactívalo para que no se pueda agendar."
                  : `Se eliminará «${tratamiento.nombre}» del catálogo.`
              }
              textoConfirmar="Eliminar"
              onConfirmar={async () => {
                await deleteTratamiento(tratamiento.id);
                toast.success("Tratamiento eliminado");
                router.push("/tratamientos");
              }}
            />
          )
        }
      />
      {error ? <ErrorCarga mensaje={error} onReintentar={recargar} /> : !tratamiento ? <ListaSkeleton filas={3} /> : <TratamientoForm tratamiento={tratamiento} />}
    </div>
  );
}
