import { Encabezado } from "@/components/comunes";
import { OdontologoForm } from "@/components/odontologos/odontologo-form";

export default function NuevoOdontologoPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Encabezado volver="/odontologos" etiqueta="Odontólogos" titulo="Nuevo odontólogo" descripcion="Registra sus datos y el horario semanal de atención." />
      <OdontologoForm />
    </div>
  );
}
