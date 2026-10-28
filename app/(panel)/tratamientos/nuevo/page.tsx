import { Encabezado } from "@/components/comunes";
import { TratamientoForm } from "@/components/tratamientos/tratamiento-form";

export default function NuevoTratamientoPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Encabezado volver="/tratamientos" etiqueta="Tratamientos" titulo="Nuevo tratamiento" descripcion="El nombre debe ser único." />
      <TratamientoForm />
    </div>
  );
}
