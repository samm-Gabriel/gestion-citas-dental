# 3. MODELO DE NEGOCIO

## 3.1 Diagrama de Actividad

El diagrama de actividad describe el proceso de negocio tal como ocurre en el consultorio, independientemente de las pantallas del sistema. Participan el paciente, la recepcionista, el odontólogo y el administrador (dentista dueño). El proceso empieza cuando el paciente solicita una cita: la recepcionista lo ubica o lo registra, elige odontólogo y tratamiento y busca un horario que quepa en la duración del tratamiento dentro del horario de atención. Si el paciente puede asistir, la cita se confirma, el odontólogo lo atiende y anota diagnóstico, tratamiento realizado y observaciones; si no puede, la cita se reprograma o se cancela y el horario queda libre. El administrador revisa periódicamente la actividad del día, de la semana y los pacientes nuevos.

![Proceso de atención de una cita en el consultorio](../diagramas/png/actividad/actividad_negocio.png "Nota. Elaboración propia en PlantUML (docs/diagramas/actividad/actividad_negocio.puml).")

Cada decisión del diagrama corresponde a una regla que el sistema automatiza: la búsqueda del paciente (CU03), el horario libre que cabe en la duración (CU07 y CU08), la confirmación (CU11), la reprogramación (CU09), la cancelación que libera el horario (CU10), la atención (CU14) y la revisión del administrador (CU16).
