# 6. FT. DISEÑO

## 6.1 Diseño de Arquitectura (Física y Lógica)

### 6.1.1 Diseño Físico de la Arquitectura (Diagrama de Despliegue)

La arquitectura física tiene tres nodos. El navegador del usuario, en una computadora o un celular, ejecuta la interfaz React y guarda el perfil elegido en `localStorage`. La plataforma Vercel sirve las páginas de Next.js y ejecuta como funciones los manejadores de `app/api/**`, que acceden a la base mediante Prisma Client. La base PostgreSQL está en Neon, en el schema `gestion-citas-dental`; la aplicación se conecta por el *pooler* de conexiones (`DATABASE_URL`) y las migraciones usan la conexión directa (`DIRECT_URL`).

La base en Neon ya está en uso: contra ella se hicieron la integración (#7) y el build. El despliegue en Vercel **no está hecho**; es la siguiente etapa (issue #10), por lo que el nodo Vercel describe el despliegue previsto. La URL de producción se registra en el issue #10.

![Diagrama de despliegue](../diagramas/png/despliegue/despliegue.png "Nota. Elaboración propia en PlantUML (docs/diagramas/despliegue/despliegue.puml). El nodo Vercel corresponde al despliegue previsto.")

### 6.1.2 Diseño Lógico de la Arquitectura (Diagrama de Paquetes)

La arquitectura lógica sigue las carpetas del código. La presentación (`app/(panel)/**`, `app/page.tsx` y `components/`) se organiza por los paquetes de análisis P1 a P4 y solo habla con la API a través del cliente tipado `lib/api.ts` y los *hooks* de `hooks/`. Los controladores (`app/api/**/route.ts`) validan la entrada y delegan en la lógica de negocio (`lib/agenda.ts`, `lib/tablero.ts`, `lib/validators.ts`, `lib/http.ts`, `lib/fechas.ts`), que accede a los datos con Prisma Client (`lib/prisma.ts`). Las dependencias van solo hacia abajo.

![Arquitectura lógica por capas](../diagramas/png/paquetes/paquetes_logicos.png "Nota. Elaboración propia en PlantUML (docs/diagramas/paquetes/paquetes_logicos.puml).")

## 6.2 Diseñar Caso de Uso (Diagrama de Secuencia)

### 6.2.1 Diagrama de Secuencia

Cada diagrama de secuencia usa los participantes de la ficha en el orden actor, vista, control y entidades, y solo los fragmentos `alt`, `opt`, `loop` y `break`. Cada excepción de la ficha aparece como un `break` con el mensaje que recibe el actor. Los diagramas largos se dividen en dos páginas con `newpage`, conservando la numeración. En esta entrega se elaboraron los del caso de uso núcleo de cada ciclo.

#### 6.2.1.1 Ciclo 1

##### CU01 Seleccionar perfil

!pendiente: Espacio para el diagrama de secuencia (docs/diagramas/secuencia/CU01_Seleccionar_perfil.puml).

##### CU02 Gestionar pacientes

!pendiente: Espacio para el diagrama de secuencia (docs/diagramas/secuencia/CU02_Gestionar_pacientes.puml).

##### CU03 Buscar paciente

!pendiente: Espacio para el diagrama de secuencia (docs/diagramas/secuencia/CU03_Buscar_paciente.puml).

##### CU04 Gestionar odontólogos

!pendiente: Espacio para el diagrama de secuencia (docs/diagramas/secuencia/CU04_Gestionar_odontologos.puml).

##### CU05 Definir horario de atención

!pendiente: Espacio para el diagrama de secuencia (docs/diagramas/secuencia/CU05_Definir_horario_de_atencion.puml).

##### CU06 Gestionar tratamientos

!pendiente: Espacio para el diagrama de secuencia (docs/diagramas/secuencia/CU06_Gestionar_tratamientos.puml).

##### CU07 Reservar cita

La primera página cubre la consulta de disponibilidad incluida (CU08), el envío del formulario, la validación de datos y la búsqueda de paciente, odontólogo y tratamiento. La segunda cubre las reglas de agenda y el registro. Todo lo que ocurre entre `bloquearAgenda` e `insertar` se ejecuta en una sola transacción (`prisma.$transaction`); cualquier `break` lanza un `ApiError` que deshace la transacción.

![Diagrama de secuencia de CU07 Reservar cita (página 1 de 2)](../diagramas/png/secuencia/CU07_Reservar_cita.png "Nota. Elaboración propia en PlantUML (docs/diagramas/secuencia/CU07_Reservar_cita.puml).")

![Diagrama de secuencia de CU07 Reservar cita (página 2 de 2)](../diagramas/png/secuencia/CU07_Reservar_cita_001.png "Nota. Elaboración propia en PlantUML (docs/diagramas/secuencia/CU07_Reservar_cita.puml, segunda página).")

##### CU08 Consultar disponibilidad del odontólogo

!pendiente: Sus mensajes aparecen en la fase «Consultar disponibilidad» del diagrama de CU07; queda pendiente el diagrama propio.

#### 6.2.1.2 Ciclo 2

##### CU09 Reprogramar cita

!pendiente: Espacio para el diagrama de secuencia (docs/diagramas/secuencia/CU09_Reprogramar_cita.puml).

##### CU10 Cancelar cita

!pendiente: Espacio para el diagrama de secuencia (docs/diagramas/secuencia/CU10_Cancelar_cita.puml).

##### CU11 Confirmar cita

!pendiente: Espacio para el diagrama de secuencia (docs/diagramas/secuencia/CU11_Confirmar_cita.puml).

##### CU12 Consultar agenda de citas

!pendiente: Espacio para el diagrama de secuencia (docs/diagramas/secuencia/CU12_Consultar_agenda_de_citas.puml).

##### CU13 Consultar agenda del día

!pendiente: Espacio para el diagrama de secuencia (docs/diagramas/secuencia/CU13_Consultar_agenda_del_dia.puml).

##### CU14 Registrar atención

La primera página es el flujo principal: registrar la atención de una cita que aún no la tiene. Las verificaciones, la inserción de la atención y el cambio a ATENDIDA ocurren en una transacción. La segunda página es el flujo alternativo A1, que corrige una atención ya registrada sin transacción porque solo actualiza una fila.

![Diagrama de secuencia de CU14 Registrar atención (flujo principal)](../diagramas/png/secuencia/CU14_Registrar_atencion.png "Nota. Elaboración propia en PlantUML (docs/diagramas/secuencia/CU14_Registrar_atencion.puml).")

![Diagrama de secuencia de CU14 Registrar atención (flujo alternativo A1)](../diagramas/png/secuencia/CU14_Registrar_atencion_001.png "Nota. Elaboración propia en PlantUML (docs/diagramas/secuencia/CU14_Registrar_atencion.puml, segunda página).")

##### CU15 Consultar historial del paciente

!pendiente: Espacio para el diagrama de secuencia (docs/diagramas/secuencia/CU15_Consultar_historial_del_paciente.puml).

##### CU16 Consultar tablero

!pendiente: Espacio para el diagrama de secuencia (docs/diagramas/secuencia/CU16_Consultar_tablero.puml).

## 6.3 Diseño de Datos (Lógico y Físico)

El diseño de datos parte de los requisitos de la historia de usuario #1, del modelo `prisma/schema.prisma` y del script generado `prisma/migrations/20261028065832_init/migration.sql`, que es la única migración. El modelo tiene **6 tablas con 48 columnas en total** (Paciente 9, Odontologo 6, HorarioAtencion 7, Tratamiento 8, Cita 11 y Atencion 7) y un tipo enumerado, `EstadoCita`. El diagrama de clases, el mapeo, la tabla de volumen, el script y el diagrama relacional describen ese mismo modelo.

### 6.3.1 Diseño de Datos Lógico

#### 6.3.1.1 Diagrama de Clases

El diagrama muestra las seis clases persistentes con sus atributos y tipos, y las asociaciones con su multiplicidad. HorarioAtencion se dibuja como composición de Odontologo porque se borra en cascada con él; Atencion, como composición de Cita por la misma razón y porque cada cita tiene como máximo una atención. No hay generalizaciones: pacientes y odontólogos no comparten una tabla de personas.

![Diagrama de clases del dominio](../diagramas/png/clases/diagrama_clases.png "Nota. Elaboración propia en PlantUML (docs/diagramas/clases/diagrama_clases.puml) a partir de prisma/schema.prisma.")

#### 6.3.1.2 Mapeo

Las reglas de transformación aplicadas son: cada clase se convierte en una tabla y cada atributo en una columna; cada asociación 1:N se representa con una clave foránea en la tabla del lado N; la asociación 1:0..1 entre Cita y Atencion se representa con una clave foránea única (`citaId`) en Atencion. No hay asociaciones N:M ni subtipos, por lo que no se necesitan tablas intermedias ni claves primarias compartidas. Las tablas conservan los nombres que genera Prisma a partir de los modelos (`Paciente`, `HorarioAtencion`) y columnas en *camelCase*; no siguen la convención *snake_case*.

**PACIENTE**

| PACIENTE | | | | | | |
|---|---|---|---|---|---|---|
| **PK** | | | | | | |
| **ID** | **NOMBRE** | **APELLIDO** | **CI** | **TELEFONO** | **EMAIL** | **FECHANACIMIENTO** |
| | | | | | | |
| **CREATEDAT** | **UPDATEDAT** | | | | | |

Sin claves foráneas. UNIQUE: CI.

**ODONTOLOGO**

| ODONTOLOGO | | | | | |
|---|---|---|---|---|---|
| **PK** | | | | | |
| **ID** | **NOMBRE** | **ESPECIALIDAD** | **ACTIVO** | **CREATEDAT** | **UPDATEDAT** |

Sin claves foráneas ni restricciones de unicidad adicionales.

**HORARIOATENCION**

| HORARIOATENCION | | | | | | |
|---|---|---|---|---|---|---|
| **PK** | **FK** | | | | | |
| **ID** | **ODONTOLOGOID** | **DIASEMANA** | **HORAINICIO** | **HORAFIN** | **CREATEDAT** | **UPDATEDAT** |

FK: ODONTOLOGOID → Odontologo(id), ON DELETE CASCADE. UNIQUE: ODONTOLOGOID, DIASEMANA, HORAINICIO.

**TRATAMIENTO**

| TRATAMIENTO | | | | | | |
|---|---|---|---|---|---|---|
| **PK** | | | | | | |
| **ID** | **NOMBRE** | **DESCRIPCION** | **DURACIONMINUTOS** | **PRECIO** | **ACTIVO** | **CREATEDAT** |
| | | | | | | |
| **UPDATEDAT** | | | | | | |

Sin claves foráneas. UNIQUE: NOMBRE.

**CITA**

| CITA | | | | | | |
|---|---|---|---|---|---|---|
| **PK** | **FK** | **FK** | **FK** | | | |
| **ID** | **PACIENTEID** | **ODONTOLOGOID** | **TRATAMIENTOID** | **INICIO** | **FIN** | **ESTADO** |
| | | | | | | |
| **MOTIVO** | **MOTIVOCANCELACION** | **CREATEDAT** | **UPDATEDAT** | | | |

FK: PACIENTEID → Paciente(id); ODONTOLOGOID → Odontologo(id); TRATAMIENTOID → Tratamiento(id); las tres con ON DELETE RESTRICT. Sin restricciones de unicidad adicionales; índices en (ODONTOLOGOID, INICIO), (PACIENTEID, INICIO) y (ESTADO).

**ATENCION**

| ATENCION | | | | | | |
|---|---|---|---|---|---|---|
| **PK** | **FK** | | | | | |
| **ID** | **CITAID** | **DIAGNOSTICO** | **TRATAMIENTOREALIZADO** | **OBSERVACIONES** | **CREATEDAT** | **UPDATEDAT** |

FK: CITAID → Cita(id), ON DELETE CASCADE. UNIQUE: CITAID.

Ninguna tabla usa clave primaria compuesta ni compartida: todas tienen una clave sustituta `id` de tipo `SERIAL`. La unicidad natural se expresa con restricciones UNIQUE: el CI del paciente, el nombre del tratamiento, la combinación (odontologoId, diaSemana, horaInicio) del horario, que impide repetir un bloque que empieza a la misma hora el mismo día, y `citaId` en Atencion, que convierte la relación 1:N en 1:0..1. No hay claves foráneas compuestas.

#### 6.3.1.3 Normalización

- **Primera forma normal (1FN).** Todas las columnas guardan valores atómicos y no hay grupos repetidos. El ejemplo más claro es el horario: en lugar de guardar una lista de bloques dentro de Odontologo, cada bloque día-hora es una fila de HorarioAtencion.
- **Segunda forma normal (2FN).** Todas las tablas tienen una clave primaria de una sola columna, por lo que no puede haber dependencias parciales de una clave compuesta. En HorarioAtencion, cuya clave candidata es (odontologoId, diaSemana, horaInicio), el único atributo no clave, `horaFin`, depende de la combinación completa.
- **Tercera forma normal (3FN).** Ningún atributo no clave depende de otro atributo no clave dentro de su tabla: Cita no copia el nombre del paciente ni el precio del tratamiento, sino que los referencia por clave foránea, y Atencion no repite datos de la cita.

Hay dos copias intencionales que no son redundancia accidental. La columna `fin` de Cita se calcula como `inicio` más la duración del tratamiento al reservar o reprogramar; se guarda para que la cita conserve su intervalo aunque después cambie la duración del tratamiento y para que la búsqueda de choques sea una sola consulta por rango. La columna `tratamientoRealizado` de Atencion es texto libre y no una clave foránea, porque registra lo que efectivamente se hizo, que puede diferir del tratamiento agendado.

### 6.3.2 Diseño de Datos Físico

#### 6.3.2.1 Tabla de Volumen

Los tipos físicos son los que genera Prisma para PostgreSQL. Las claves usan `SERIAL` (entero de 4 bytes), suficiente para el volumen de un consultorio. Los textos usan `TEXT`; la base no limita su longitud y los máximos indicados en la columna «Tamaño» son los que valida Zod en la API. Las fechas y horas de las citas son `TIMESTAMP(3)` sin zona horaria que guardan el instante en UTC; la conversión a la hora de La Paz se hace en `lib/fechas.ts`. La fecha de nacimiento es `DATE`. Las horas del horario de atención se guardan como texto `HH:MM` porque son horas del día sin fecha. El precio usa `NUMERIC(10,2)`, nunca un tipo de coma flotante. El estado es el tipo enumerado `EstadoCita`, que ocupa 4 bytes.

**Paciente**

| Atributo | Tipo de dato | Tamaño | Nulo | Llave | Descripción |
|---|---|---|---|---|---|
| id | SERIAL (INTEGER) | 4 bytes | No | PK | Identificador del paciente. |
| nombre | TEXT | Hasta 100 caracteres | No | — | Nombre o nombres. |
| apellido | TEXT | Hasta 100 caracteres | No | — | Apellidos; índice (apellido, nombre). |
| ci | TEXT | 4 a 12 dígitos y complemento de hasta 4 | No | UK | Cédula de identidad en mayúsculas. |
| telefono | TEXT | 6 a 20 caracteres | No | — | Teléfono de contacto. |
| email | TEXT | Hasta 120 caracteres | Sí | — | Correo electrónico. |
| fechaNacimiento | DATE | 4 bytes | Sí | — | Fecha de nacimiento, no futura. |
| createdAt | TIMESTAMP(3) | 8 bytes | No | — | Fecha de registro; base de «pacientes nuevos del mes». |
| updatedAt | TIMESTAMP(3) | 8 bytes | No | — | Última modificación. |

**Odontologo**

| Atributo | Tipo de dato | Tamaño | Nulo | Llave | Descripción |
|---|---|---|---|---|---|
| id | SERIAL (INTEGER) | 4 bytes | No | PK | Identificador del odontólogo. |
| nombre | TEXT | Hasta 120 caracteres | No | — | Nombre completo. |
| especialidad | TEXT | Hasta 100 caracteres | No | — | Especialidad odontológica. |
| activo | BOOLEAN | 1 byte | No | — | Si recibe nuevas citas; por defecto verdadero. |
| createdAt | TIMESTAMP(3) | 8 bytes | No | — | Fecha de registro. |
| updatedAt | TIMESTAMP(3) | 8 bytes | No | — | Última modificación. |

**HorarioAtencion**

| Atributo | Tipo de dato | Tamaño | Nulo | Llave | Descripción |
|---|---|---|---|---|---|
| id | SERIAL (INTEGER) | 4 bytes | No | PK | Identificador del bloque. |
| odontologoId | INTEGER | 4 bytes | No | FK, UK | Odontólogo; parte de la clave única compuesta. |
| diaSemana | INTEGER | 4 bytes | No | UK | 0 = domingo a 6 = sábado; parte de la clave única. |
| horaInicio | TEXT | 5 caracteres (HH:MM) | No | UK | Inicio del bloque en hora local; parte de la clave única. |
| horaFin | TEXT | 5 caracteres (HH:MM) | No | — | Fin del bloque, posterior al inicio. |
| createdAt | TIMESTAMP(3) | 8 bytes | No | — | Fecha de registro. |
| updatedAt | TIMESTAMP(3) | 8 bytes | No | — | Última modificación. |

**Tratamiento**

| Atributo | Tipo de dato | Tamaño | Nulo | Llave | Descripción |
|---|---|---|---|---|---|
| id | SERIAL (INTEGER) | 4 bytes | No | PK | Identificador del tratamiento. |
| nombre | TEXT | Hasta 120 caracteres | No | UK | Nombre del tratamiento. |
| descripcion | TEXT | Hasta 500 caracteres | Sí | — | Descripción. |
| duracionMinutos | INTEGER | 4 bytes | No | — | Duración de 5 a 480 minutos; define la hora de fin de la cita. |
| precio | NUMERIC(10,2) | Variable (10 dígitos, 2 decimales) | No | — | Precio en bolivianos. |
| activo | BOOLEAN | 1 byte | No | — | Si se puede agendar; por defecto verdadero. |
| createdAt | TIMESTAMP(3) | 8 bytes | No | — | Fecha de registro. |
| updatedAt | TIMESTAMP(3) | 8 bytes | No | — | Última modificación. |

**Cita**

| Atributo | Tipo de dato | Tamaño | Nulo | Llave | Descripción |
|---|---|---|---|---|---|
| id | SERIAL (INTEGER) | 4 bytes | No | PK | Identificador de la cita. |
| pacienteId | INTEGER | 4 bytes | No | FK | Paciente citado. |
| odontologoId | INTEGER | 4 bytes | No | FK | Odontólogo que atiende. |
| tratamientoId | INTEGER | 4 bytes | No | FK | Tratamiento agendado. |
| inicio | TIMESTAMP(3) | 8 bytes | No | — | Instante de inicio (UTC). |
| fin | TIMESTAMP(3) | 8 bytes | No | — | Instante de fin = inicio + duración del tratamiento. |
| estado | EstadoCita | 4 bytes | No | — | PENDIENTE, CONFIRMADA, ATENDIDA o CANCELADA; por defecto PENDIENTE. |
| motivo | TEXT | Hasta 500 caracteres | Sí | — | Motivo de la consulta. |
| motivoCancelacion | TEXT | Hasta 500 caracteres | Sí | — | Motivo de la cancelación. |
| createdAt | TIMESTAMP(3) | 8 bytes | No | — | Fecha de registro. |
| updatedAt | TIMESTAMP(3) | 8 bytes | No | — | Última modificación. |

**Atencion**

| Atributo | Tipo de dato | Tamaño | Nulo | Llave | Descripción |
|---|---|---|---|---|---|
| id | SERIAL (INTEGER) | 4 bytes | No | PK | Identificador de la atención. |
| citaId | INTEGER | 4 bytes | No | FK, UK | Cita atendida; una atención por cita. |
| diagnostico | TEXT | Hasta 2000 caracteres | Sí | — | Diagnóstico. |
| tratamientoRealizado | TEXT | Hasta 2000 caracteres | Sí | — | Lo que efectivamente se hizo. |
| observaciones | TEXT | Hasta 2000 caracteres | Sí | — | Observaciones e indicaciones. |
| createdAt | TIMESTAMP(3) | 8 bytes | No | — | Fecha de registro. |
| updatedAt | TIMESTAMP(3) | 8 bytes | No | — | Última modificación. |

Al menos uno de los tres campos de texto de Atencion debe tener contenido al registrarla; esa regla la valida la API, no la base.

#### 6.3.2.2 Script

El script DDL es `prisma/migrations/20261028065832_init/migration.sql`, generado por Prisma Migrate a partir del esquema. Su orden es: crear el tipo enumerado `EstadoCita`; crear las seis tablas con sus claves primarias; crear los índices únicos (`Paciente_ci_key`, `HorarioAtencion_odontologoId_diaSemana_horaInicio_key`, `Tratamiento_nombre_key`, `Atencion_citaId_key`) y los índices de búsqueda; y, al final, añadir las claves foráneas. HorarioAtencion y Atencion usan `ON DELETE CASCADE`; las tres claves foráneas de Cita usan `ON DELETE RESTRICT`, de modo que no se puede borrar un paciente, odontólogo o tratamiento con citas. Todas usan `ON UPDATE CASCADE`. El archivo no contiene `BEGIN`/`COMMIT` explícitos ni restricciones `CHECK`.

El script se aplicó con `prisma migrate deploy` en el schema `gestion-citas-dental` de Neon (sub-historia #2) y se aplica de nuevo en cada ejecución de la suite de pruebas sobre un schema temporal `test_<timestamp>`, que se crea vacío y se borra al terminar; en la ejecución registrada en el capítulo 8 se aplicó sin errores y las 78 pruebas pasaron sobre él.

```
-- CreateTable
CREATE TABLE "Cita" (
    "id" SERIAL NOT NULL,
    "pacienteId" INTEGER NOT NULL,
    "odontologoId" INTEGER NOT NULL,
    "tratamientoId" INTEGER NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoCita" NOT NULL DEFAULT 'PENDIENTE',
    "motivo" TEXT,
    "motivoCancelacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Cita_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Cita_odontologoId_inicio_idx" ON "Cita"("odontologoId", "inicio");

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_odontologoId_fkey"
  FOREIGN KEY ("odontologoId") REFERENCES "Odontologo"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
```

Varias reglas de negocio se garantizan en la aplicación y no en la base. La tabla siguiente registra esas brechas, que no impiden el funcionamiento pero dejan la integridad en manos del código si alguien escribe en la base por otra vía.

| Regla | Dónde se garantiza hoy | Brecha en la base |
|---|---|---|
| Sin choques entre citas no canceladas del mismo odontólogo | Transacción con `pg_advisory_xact_lock` y `buscarChoque` en `lib/agenda.ts` | No hay restricción de exclusión sobre el rango [inicio, fin). |
| `fin` posterior a `inicio` e igual a inicio + duración | `calcularFin` en `lib/agenda.ts` | Sin `CHECK (fin > inicio)`. |
| Duración de 5 a 480 minutos y precio no negativo | Esquema Zod `tratamientoCrear` | Sin `CHECK`. |
| `diaSemana` entre 0 y 6, horas `HH:MM` con inicio menor que fin | Esquema Zod `horarioSchema` | Sin `CHECK`; horas guardadas como `TEXT`. |
| Bloques de horario no solapados | `superRefine` de `horariosSchema` | Solo UNIQUE (odontologoId, diaSemana, horaInicio). |
| Longitud máxima de textos | Esquemas Zod | Columnas `TEXT` sin límite. |
| Atención solo en citas no canceladas y cita ATENDIDA al registrarla | Transacción de `registrarAtencion` | Sin trigger. |

#### 6.3.2.3 Diagrama Relacional

El diagrama relacional se escribe en Mermaid `erDiagram` y contiene las 6 tablas con sus 48 columnas, con el tipo físico abreviado y las marcas PK, FK y UK; las tres columnas de la clave única compuesta de HorarioAtencion llevan UK. La cardinalidad usa `||` (exactamente uno), `o|` (cero o uno) y `o{` (cero o muchos). Todas las relaciones son no identificadoras (línea discontinua) porque cada tabla tiene su propia clave sustituta. Lo que las claves foráneas no garantizan, como que una cita ATENDIDA tenga su atención o que no haya choques, son reglas transaccionales de la aplicación (6.3.2.2).

![Diagrama relacional](../diagramas/png/relacional/er.png "Nota. Elaboración propia en Mermaid (docs/diagramas/relacional/er.mmd) a partir de prisma/schema.prisma.")

#### 6.3.2.4 Funciones

La base no tiene funciones ni procedimientos almacenados; toda la lógica está en TypeScript. La única función del sistema de PostgreSQL que se usa es `pg_advisory_xact_lock(4242, odontologoId)`, que serializa dentro de una transacción las reservas y reprogramaciones de un mismo odontólogo y se libera sola al terminar la transacción. Las siguientes funciones son propuestas y **no están implementadas**:

| Operación propuesta | Entradas y resultado esperado |
|---|---|
| `hay_choque(odontologo_id, inicio, fin, excluir_id)` | Devuelve verdadero si existe una cita no cancelada del odontólogo cuyo intervalo se cruza con [inicio, fin), excluyendo la cita indicada. |
| `cabe_en_horario(odontologo_id, inicio, fin)` | Devuelve verdadero si el intervalo, en hora de La Paz, cae completo dentro de un bloque de HorarioAtencion del día. |
| `resumen_tablero(fecha)` | Devuelve los conteos de citas del día por estado, de la semana por odontólogo y de pacientes nuevos del mes. |

#### 6.3.2.5 Triggers

La base no tiene triggers. La columna `updatedAt` la actualiza Prisma Client (`@updatedAt`) y no un trigger, por lo que una escritura directa en SQL no la modifica. Propuestas **no implementadas**:

| Responsabilidad | Evento y criterio |
|---|---|
| Marcar la cita como ATENDIDA | `AFTER INSERT` en Atencion: actualizar el estado de la cita a ATENDIDA si no está cancelada. |
| Impedir cambios en citas finales | `BEFORE UPDATE` en Cita: rechazar cambios de estado o de horario si el estado anterior es ATENDIDA o CANCELADA. |
| Mantener `updatedAt` | `BEFORE UPDATE` en todas las tablas: asignar la hora actual. |
