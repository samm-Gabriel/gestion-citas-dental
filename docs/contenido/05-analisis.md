# 5. FT. ANÁLISIS

## 5.1 Análisis de Arquitectura

### 5.1.1 Identificar Paquetes

Los paquetes de análisis agrupan casos de uso que comparten objetos y responsabilidades. Cada caso de uso pertenece a un único paquete. Los paquetes se ordenaron en dos capas para que sus dependencias no formen ciclos: P1 y P2 no dependen de las citas, y P3 y P4 sí.

<!-- casos_uso:paquetes -->

### 5.1.2 Relacionar Paquetes y Casos de Uso

Para cada paquete se indica el menú o la pantalla donde se ejecuta cada caso de uso y los componentes previstos con la convención V (vista) y C (control). Los componentes reales de cada clase de análisis se listan en 7.3.

#### 5.1.2.1 Ciclo 1

**P1 Acceso y pacientes**

| CU | Caso de uso | Módulo / menú | Componente previsto (V · C) |
|---|---|---|---|
| CU01 | Seleccionar perfil | Pantalla inicial «/» y «Cambiar perfil» | Vperfil · Cperfil |
| CU02 | Gestionar pacientes | «Pacientes», «Nuevo paciente», ficha | Vpaciente · Cpaciente |
| CU03 | Buscar paciente | «Pacientes» (buscador) | Vpaciente · Cpaciente |

![P1 Acceso y pacientes: trazabilidad con sus casos de uso](../diagramas/png/paquetes/P1_trace_C1.png "Nota. Elaboración propia en PlantUML (docs/diagramas/paquetes/P1_trace_C1.puml).")

**P2 Odontólogos y tratamientos**

| CU | Caso de uso | Módulo / menú | Componente previsto (V · C) |
|---|---|---|---|
| CU04 | Gestionar odontólogos | «Odontólogos» | Vodontologo · Codontologo |
| CU05 | Definir horario de atención | «Odontólogos», sección «Horario de atención» | Vodontologo · Codontologo |
| CU06 | Gestionar tratamientos | «Tratamientos» | Vtratamiento · Ctratamiento |

![P2 Odontólogos y tratamientos: trazabilidad con sus casos de uso](../diagramas/png/paquetes/P2_trace_C1.png "Nota. Elaboración propia en PlantUML (docs/diagramas/paquetes/P2_trace_C1.puml).")

**P3 Agenda de citas (ciclo 1)**

| CU | Caso de uso | Módulo / menú | Componente previsto (V · C) |
|---|---|---|---|
| CU07 | Reservar cita | «Nueva cita» | Vcita · Ccita |
| CU08 | Consultar disponibilidad del odontólogo | «Nueva cita» y diálogo «Reprogramar cita» | Vcita · Ccita |

![P3 Agenda de citas: trazabilidad con sus casos de uso del ciclo 1](../diagramas/png/paquetes/P3_trace_C1.png "Nota. Elaboración propia en PlantUML (docs/diagramas/paquetes/P3_trace_C1.puml).")

#### 5.1.2.2 Ciclo 2

**P3 Agenda de citas (ciclo 2)**

| CU | Caso de uso | Módulo / menú | Componente previsto (V · C) |
|---|---|---|---|
| CU09 | Reprogramar cita | «Agenda de citas» y detalle de la cita, botón «Reprogramar» | Vcita · Ccita |
| CU10 | Cancelar cita | «Agenda de citas» y detalle, botón «Cancelar» | Vcita · Ccita |
| CU11 | Confirmar cita | «Agenda de citas» y detalle, botón «Confirmar» | Vcita · Ccita |

![P3 Agenda de citas: trazabilidad con sus casos de uso del ciclo 2](../diagramas/png/paquetes/P3_trace_C2.png "Nota. Elaboración propia en PlantUML (docs/diagramas/paquetes/P3_trace_C2.puml).")

**P4 Atención y seguimiento**

| CU | Caso de uso | Módulo / menú | Componente previsto (V · C) |
|---|---|---|---|
| CU12 | Consultar agenda de citas | «Agenda de citas» | Vagenda · Ccita |
| CU13 | Consultar agenda del día | «Mi agenda del día» / «Agenda del día» | Vagenda · Ccita |
| CU14 | Registrar atención | «Mi agenda del día» y detalle de la cita | Vatencion · Catencion |
| CU15 | Consultar historial del paciente | «Pacientes», ficha del paciente | Vpaciente · Cpaciente |
| CU16 | Consultar tablero | «Tablero» | Vtablero · Ctablero |

![P4 Atención y seguimiento: trazabilidad con sus casos de uso](../diagramas/png/paquetes/P4_trace_C2.png "Nota. Elaboración propia en PlantUML (docs/diagramas/paquetes/P4_trace_C2.puml).")

### 5.1.3 Vista de Paquetes

Las dependencias van del paquete consumidor al proveedor y no forman ciclos: P2 no depende de nadie, P1 depende solo de P2, P3 depende de P1 y P2, y P4 depende de los tres.

| Paquete consumidor | Depende de | Motivo |
|---|---|---|
| P1 Acceso y pacientes | P2 Odontólogos y tratamientos | El perfil Odontólogo se elige entre los odontólogos activos (CU01, A1). |
| P3 Agenda de citas | P1 Acceso y pacientes | Toda cita pertenece a un paciente existente. |
| P3 Agenda de citas | P2 Odontólogos y tratamientos | Las reglas usan el estado y el horario del odontólogo y la duración del tratamiento. |
| P4 Atención y seguimiento | P3 Agenda de citas | Consulta citas y, al registrar la atención, cambia su estado a ATENDIDA. |
| P4 Atención y seguimiento | P1 Acceso y pacientes | Historial del paciente y pacientes nuevos del mes. |
| P4 Atención y seguimiento | P2 Odontólogos y tratamientos | Agenda del día por odontólogo y citas de la semana agrupadas por odontólogo activo. |

![Vista de paquetes](../diagramas/png/paquetes/vista_paquetes.png "Nota. Elaboración propia en PlantUML (docs/diagramas/paquetes/vista_paquetes.puml).")

## 5.2 Analizar Casos de Uso

### 5.2.1 Diagrama de Comunicación

Los diagramas de comunicación muestran el mismo escenario que el diagrama de secuencia del caso de uso (6.2.1), con los mismos participantes y mensajes. La numeración es anidada: 1, 2 para cada mensaje del actor y 1.1, 2.1 para lo que ocurre dentro; las guardas entre corchetes corresponden a los fragmentos `break` de la secuencia. En esta entrega se elaboraron los diagramas del caso de uso núcleo de cada ciclo.

#### 5.2.1.1 Ciclo 1

##### CU01 Seleccionar perfil

!pendiente: Espacio para el diagrama de comunicación (docs/diagramas/comunicacion/CU01_Seleccionar_perfil.puml).

##### CU02 Gestionar pacientes

!pendiente: Espacio para el diagrama de comunicación (docs/diagramas/comunicacion/CU02_Gestionar_pacientes.puml).

##### CU03 Buscar paciente

!pendiente: Espacio para el diagrama de comunicación (docs/diagramas/comunicacion/CU03_Buscar_paciente.puml).

##### CU04 Gestionar odontólogos

!pendiente: Espacio para el diagrama de comunicación (docs/diagramas/comunicacion/CU04_Gestionar_odontologos.puml).

##### CU05 Definir horario de atención

!pendiente: Espacio para el diagrama de comunicación (docs/diagramas/comunicacion/CU05_Definir_horario_de_atencion.puml).

##### CU06 Gestionar tratamientos

!pendiente: Espacio para el diagrama de comunicación (docs/diagramas/comunicacion/CU06_Gestionar_tratamientos.puml).

##### CU07 Reservar cita

El controlador Ccita es el único objeto que habla con las entidades. El primer mensaje del actor corresponde a la consulta de disponibilidad incluida (CU08); el segundo, a la reserva. La consulta de choque y la inserción solo ocurren si las validaciones anteriores no cortaron el flujo.

![Diagrama de comunicación de CU07 Reservar cita](../diagramas/png/comunicacion/CU07_Reservar_cita_comunicacion.png "Nota. Elaboración propia en PlantUML (docs/diagramas/comunicacion/CU07_Reservar_cita.puml).")

##### CU08 Consultar disponibilidad del odontólogo

!pendiente: Sus mensajes aparecen como 1, 1.1 a 1.4 del diagrama de CU07; queda pendiente el diagrama propio (docs/diagramas/comunicacion/CU08_Consultar_disponibilidad_del_odontologo.puml).

#### 5.2.1.2 Ciclo 2

##### CU09 Reprogramar cita

!pendiente: Espacio para el diagrama de comunicación (docs/diagramas/comunicacion/CU09_Reprogramar_cita.puml).

##### CU10 Cancelar cita

!pendiente: Espacio para el diagrama de comunicación (docs/diagramas/comunicacion/CU10_Cancelar_cita.puml).

##### CU11 Confirmar cita

!pendiente: Espacio para el diagrama de comunicación (docs/diagramas/comunicacion/CU11_Confirmar_cita.puml).

##### CU12 Consultar agenda de citas

!pendiente: Espacio para el diagrama de comunicación (docs/diagramas/comunicacion/CU12_Consultar_agenda_de_citas.puml).

##### CU13 Consultar agenda del día

!pendiente: Espacio para el diagrama de comunicación (docs/diagramas/comunicacion/CU13_Consultar_agenda_del_dia.puml).

##### CU14 Registrar atención

El mensaje 1 corresponde al registro de una cita sin atención y el mensaje 2 al flujo alternativo A1 (corregir la atención). La creación de la atención y el cambio de estado de la cita ocurren en la misma transacción.

![Diagrama de comunicación de CU14 Registrar atención](../diagramas/png/comunicacion/CU14_Registrar_atencion_comunicacion.png "Nota. Elaboración propia en PlantUML (docs/diagramas/comunicacion/CU14_Registrar_atencion.puml).")

##### CU15 Consultar historial del paciente

!pendiente: Espacio para el diagrama de comunicación (docs/diagramas/comunicacion/CU15_Consultar_historial_del_paciente.puml).

##### CU16 Consultar tablero

!pendiente: Espacio para el diagrama de comunicación (docs/diagramas/comunicacion/CU16_Consultar_tablero.puml).

## 5.3 Analizar una Clase

Los diagramas de análisis de clase muestran las clases de vista (azul), control (amarillo) y entidad (verde) de cada caso de uso, con los nombres fijados en la fila «Clases de análisis previstas» de su ficha. Las entidades y sus atributos son los del modelo de datos (6.3.1.1); solo se incluyen las que intervienen en el escenario.

### 5.3.1 Ciclo 1

#### CU01 Seleccionar perfil

!pendiente: Espacio para el diagrama de análisis de clase (docs/diagramas/analisis_clase/CU01_Seleccionar_perfil.puml).

#### CU02 Gestionar pacientes

!pendiente: Espacio para el diagrama de análisis de clase (docs/diagramas/analisis_clase/CU02_Gestionar_pacientes.puml).

#### CU03 Buscar paciente

!pendiente: Espacio para el diagrama de análisis de clase (docs/diagramas/analisis_clase/CU03_Buscar_paciente.puml).

#### CU04 Gestionar odontólogos

!pendiente: Espacio para el diagrama de análisis de clase (docs/diagramas/analisis_clase/CU04_Gestionar_odontologos.puml).

#### CU05 Definir horario de atención

!pendiente: Espacio para el diagrama de análisis de clase (docs/diagramas/analisis_clase/CU05_Definir_horario_de_atencion.puml).

#### CU06 Gestionar tratamientos

!pendiente: Espacio para el diagrama de análisis de clase (docs/diagramas/analisis_clase/CU06_Gestionar_tratamientos.puml).

#### CU07 Reservar cita

Vcita corresponde al formulario de reserva, Ccita al manejador `POST /api/citas` con las reglas de `lib/agenda.ts`, y las entidades a los modelos Prisma. Ehorario_atencion no recibe mensajes directos: sus bloques llegan junto con el odontólogo y Ccita los evalúa con `cabeEnHorario`.

![Diagrama de análisis de clase de CU07 Reservar cita](../diagramas/png/analisis_clase/CU07_Reservar_cita_analisis.png "Nota. Elaboración propia en PlantUML (docs/diagramas/analisis_clase/CU07_Reservar_cita.puml).")

#### CU08 Consultar disponibilidad del odontólogo

!pendiente: Sus clases (Vcita, Ccita, Eodontologo, Ehorario_atencion, Ecita) aparecen en el diagrama de CU07; queda pendiente el diagrama propio.

### 5.3.2 Ciclo 2

#### CU09 Reprogramar cita

!pendiente: Espacio para el diagrama de análisis de clase (docs/diagramas/analisis_clase/CU09_Reprogramar_cita.puml).

#### CU10 Cancelar cita

!pendiente: Espacio para el diagrama de análisis de clase (docs/diagramas/analisis_clase/CU10_Cancelar_cita.puml).

#### CU11 Confirmar cita

!pendiente: Espacio para el diagrama de análisis de clase (docs/diagramas/analisis_clase/CU11_Confirmar_cita.puml).

#### CU12 Consultar agenda de citas

!pendiente: Espacio para el diagrama de análisis de clase (docs/diagramas/analisis_clase/CU12_Consultar_agenda_de_citas.puml).

#### CU13 Consultar agenda del día

!pendiente: Espacio para el diagrama de análisis de clase (docs/diagramas/analisis_clase/CU13_Consultar_agenda_del_dia.puml).

#### CU14 Registrar atención

Vatencion corresponde al diálogo de atención y Catencion a los manejadores `POST` y `PATCH /api/citas/{id}/atencion` con `registrarAtencion` y `actualizarAtencion`. La multiplicidad 1 a 0..1 entre Ecita y Eatencion refleja la restricción UNIQUE sobre `citaId`.

![Diagrama de análisis de clase de CU14 Registrar atención](../diagramas/png/analisis_clase/CU14_Registrar_atencion_analisis.png "Nota. Elaboración propia en PlantUML (docs/diagramas/analisis_clase/CU14_Registrar_atencion.puml).")

#### CU15 Consultar historial del paciente

!pendiente: Espacio para el diagrama de análisis de clase (docs/diagramas/analisis_clase/CU15_Consultar_historial_del_paciente.puml).

#### CU16 Consultar tablero

!pendiente: Espacio para el diagrama de análisis de clase (docs/diagramas/analisis_clase/CU16_Consultar_tablero.puml).

## 5.4 Analizar un Paquete

El paquete núcleo es **P3 Agenda de citas**. Recibe del actor la intención de ocupar, mover, confirmar o liberar un intervalo de tiempo de un odontólogo: paciente, odontólogo, tratamiento, fecha y hora de inicio. De P1 usa la existencia del paciente; de P2, el estado activo del odontólogo y del tratamiento, los bloques del horario de atención y la duración del tratamiento, con la que calcula la hora de fin.

Produce citas con un intervalo [inicio, fin) y un estado. Protege las tres reglas de la historia de usuario y la máquina de estados de la cita: no hay choques con otra cita no cancelada del mismo odontólogo, no hay citas en el pasado, toda cita cabe completa en un bloque del horario del día y solo se admiten las transiciones PENDIENTE ↔ CONFIRMADA y de ambas hacia CANCELADA o ATENDIDA. Para evitar que dos reservas simultáneas para el mismo odontólogo pasen ambas la comprobación de choque, la reserva y la reprogramación se ejecutan en una transacción que toma un bloqueo consultivo de PostgreSQL por odontólogo (`pg_advisory_xact_lock`).

Hacia los demás paquetes, P3 expone la consulta de citas por rango, odontólogo, paciente y estado que usa P4 para las agendas, el historial y el tablero, y el estado ATENDIDA que P4 asigna al registrar la atención. Una cita CANCELADA o ATENDIDA queda fuera de las operaciones de P3: no se reprograma ni cambia de estado.
