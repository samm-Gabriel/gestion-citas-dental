# 1. PERFIL

## 1.1 INTRODUCCIÓN

La agenda es el centro de la operación de un consultorio odontológico: de ella depende que cada paciente sea atendido a la hora acordada, que el tiempo de cada odontólogo se aproveche y que quede constancia de lo que se hizo en cada consulta. Un error en la agenda se traduce en pacientes que esperan, sillones ociosos o dos personas citadas a la misma hora con el mismo profesional.

En el consultorio que motiva este trabajo la agenda se lleva en papel. La recepcionista anota las citas a mano, consulta de memoria los horarios de cada odontólogo y no tiene una forma rápida de saber si un tratamiento largo se cruza con la cita siguiente. Los datos de los pacientes y el registro de lo que se les hizo quedan dispersos entre cuadernos y fichas, y el dentista dueño no dispone de un resumen de las citas del día o de la semana.

Para resolverlo se propone el **Sistema de gestión de citas para un consultorio odontológico, una aplicación web desarrollada con Next.js 16 (App Router) y TypeScript, con una API REST validada con Zod, persistencia en PostgreSQL mediante Prisma ORM y una interfaz adaptable construida con componentes shadcn**. La base de datos se aloja en Neon y el despliegue previsto es Vercel.

El sistema registra pacientes con CI único, odontólogos con su especialidad y horario de atención y tratamientos con duración en minutos y precio. Sobre esa base permite reservar, reprogramar, confirmar y cancelar citas aplicando tres reglas: no se aceptan choques con otra cita activa del mismo odontólogo considerando la duración del tratamiento, no se aceptan citas en el pasado y no se aceptan citas fuera del horario de atención. El odontólogo consulta su agenda del día y registra el diagnóstico y las observaciones de cada atención, y un tablero resume las citas del día, las de la semana por odontólogo y los pacientes nuevos del mes. Tres perfiles organizan el uso: Recepcionista, Odontólogo y Administrador, elegidos con un selector de perfil.

A la fecha de este documento el sistema está implementado de extremo a extremo (modelo de datos, API, pantallas e integración con la base real), `next build` termina sin errores y la suite automática de 78 pruebas pasa completa. Queda pendiente el despliegue en Vercel (issue #10); por eso la arquitectura física se describe como prevista.

Con el sistema se espera reemplazar la agenda de papel por un registro único y consultable, evitar los choques de horario mediante validaciones automáticas y conservar el historial de atenciones de cada paciente.

## 1.2 OBJETIVOS

### 1.2.1 Objetivo General

Desarrollar un sistema web de gestión de citas con Next.js, TypeScript, Prisma y PostgreSQL que permita registrar pacientes, odontólogos y tratamientos, agendar citas sin choques de horario y registrar las atenciones realizadas en el consultorio odontológico.

### 1.2.2 Objetivos Específicos

- Analizar el proceso de agendamiento y atención del consultorio para identificar actores, casos de uso y reglas de negocio (capítulos 3 y 4).
- Diseñar un modelo de datos relacional normalizado para pacientes, odontólogos, horarios, tratamientos, citas y atenciones (6.3).
- Establecer un selector de perfil que muestre a Recepcionista, Odontólogo y Administrador solo los menús de su rol (CU01).
- Gestionar el registro de pacientes con CI único y su búsqueda por nombre, apellido o CI (CU02, CU03).
- Gestionar el catálogo de odontólogos con su horario de atención y el de tratamientos con duración y precio (CU04 a CU06).
- Implementar la reserva de citas con cálculo de la hora de fin y validación de choques, pasado y horario de atención (CU07, CU08).
- Controlar el ciclo de vida de la cita: reprogramación, confirmación y cancelación que libera el horario (CU09 a CU11).
- Implementar la agenda de citas filtrable y la agenda del día del odontólogo (CU12, CU13).
- Registrar la atención de cada cita con diagnóstico, tratamiento realizado y observaciones (CU14).
- Generar el historial del paciente y un tablero con las citas del día, de la semana y los pacientes nuevos del mes (CU15, CU16).
- Realizar pruebas automáticas de la API sobre un esquema de base de datos aislado y pruebas de humo de las páginas (capítulo 8).

## 1.3 DESCRIPCIÓN DEL PROBLEMA

El problema central radica en que la agenda del consultorio y la información de los pacientes se registran a mano y en lugares distintos. La recepcionista debe recordar el horario de cada odontólogo, calcular cuánto dura cada tratamiento y revisar página por página si una hora está libre, sin una regla que lo impida cuando se equivoca.

A esto se suma que la agenda de papel no conserva bien los cambios: una cita reprogramada o cancelada queda tachada o se pierde, y lo que el odontólogo hizo en la consulta no queda vinculado a la cita ni al paciente. Los problemas concretos se describen a continuación.

### 1.3.1 Choques de horario entre citas

La duración de los tratamientos varía entre 15 y 90 minutos. Cuando la recepcionista anota una cita solo con la hora de inicio, no ve que un tratamiento largo invade la hora de la cita siguiente. El efecto es que dos pacientes llegan para el mismo odontólogo a la misma hora y uno de ellos espera o pierde la cita; el proceso manual lo empeora porque no hay forma de comprobar el solape antes de confirmar.

### 1.3.2 Citas fuera del horario de atención o en fechas pasadas

Cada odontólogo atiende en días y bloques distintos. Sin el horario a la vista se agendan citas en días en que el profesional no atiende o que terminan después del cierre del bloque, y también se registran por error citas con fechas ya pasadas. El paciente descubre el error al llegar al consultorio.

### 1.3.3 Datos de pacientes duplicados y dispersos

Sin un identificador único, un mismo paciente puede quedar registrado dos veces con datos distintos. Buscar a un paciente obliga a revisar fichas físicas, y su historial de citas no se puede reconstruir con certeza.

### 1.3.4 Cambios de cita sin trazabilidad

Reprogramar o cancelar una cita en papel consiste en tachar y volver a escribir. No queda claro qué horario se liberó, por qué se canceló ni si la cita estaba confirmada, y la hora liberada puede no volver a ofrecerse.

### 1.3.5 Atenciones sin registro vinculado

El diagnóstico y las observaciones de cada consulta se anotan, cuando se anotan, fuera de la agenda. No se sabe con seguridad qué citas se atendieron ni qué se hizo en cada una, que es justamente lo que el dueño necesita saber.

### 1.3.6 Falta de una visión general de la operación

El dentista dueño no tiene un resumen de cuántas citas hay hoy y en qué estado, cómo se reparte la semana entre los odontólogos o cuántos pacientes nuevos llegaron en el mes. Obtener esos datos exige contar a mano.

### 1.3.7 Consecuencias generales del problema

- Pacientes que esperan o pierden su cita por choques de horario.
- Tiempo de los odontólogos desaprovechado por citas mal ubicadas o canceladas sin liberar el horario.
- Registros de pacientes duplicados e historial incompleto.
- Ausencia de constancia de las atenciones realizadas.
- Decisiones del dueño tomadas sin datos de la operación.

### 1.3.8 Necesidad de una solución tecnológica

Los problemas descritos tienen en común que las reglas existen pero dependen de la memoria y el cuidado de las personas. Una aplicación web puede aplicar esas reglas de forma automática en el momento de agendar y conservar un registro único de pacientes, citas y atenciones accesible desde cualquier dispositivo del consultorio. De ahí surge la pregunta que guía este trabajo: **¿cómo desarrollar un sistema web de gestión de citas que impida los choques de horario, las citas en el pasado y fuera del horario de atención, y que registre las atenciones realizadas en un consultorio odontológico?**

## 1.4 ALCANCE

El sistema se dirige a un único consultorio odontológico, con sus odontólogos, su recepcionista y su dueño, y cubre la gestión de la agenda de citas desde el registro del paciente hasta el registro de la atención. Las horas se manejan en la zona horaria America/La_Paz (UTC-4 todo el año). Los módulos incluidos son:

- **Acceso por perfil.** Selector de perfil Recepcionista, Odontólogo o Administrador que muestra solo los menús de cada uno; el odontólogo se identifica entre los activos.
- **Pacientes.** Alta, edición, eliminación (si no tiene citas), búsqueda por nombre, apellido o CI e historial de citas; CI único.
- **Odontólogos.** Especialidad, estado activo o inactivo y horario de atención por bloques día-hora.
- **Tratamientos.** Nombre único, descripción, duración en minutos (5 a 480) y precio en bolivianos.
- **Citas.** Reserva, reprogramación, confirmación y cancelación con los estados PENDIENTE, CONFIRMADA, ATENDIDA y CANCELADA y las reglas de choque, pasado y horario.
- **Atención.** Diagnóstico, tratamiento realizado y observaciones de cada cita; la cita queda ATENDIDA.
- **Tablero.** Citas de hoy por estado, citas de la semana por odontólogo y pacientes nuevos del mes.

Quedan **fuera del alcance**, por decisión explícita de la historia de usuario: pagos y facturación, recordatorios por SMS o WhatsApp e inicio de sesión con proveedores externos. Tampoco se implementa autenticación de usuarios con contraseña: el selector de perfil controla lo que muestra la interfaz, pero la API no verifica la identidad de quien la llama (ver 2.1.1 y capítulo 10). No existe bitácora de auditoría.

El catálogo contiene **16 casos de uso** agrupados en **4 paquetes** y repartidos en **2 ciclos** de 8 casos de uso y 14 puntos de complejidad cada uno. Esta entrega cubre la implementación completa de los 16 casos de uso y su verificación automática en la API; en la documentación se detallan todas las fichas y prototipos, y los diagramas de comunicación, análisis de clase y secuencia de los casos de uso núcleo de cada ciclo (CU07 Reservar cita y CU14 Registrar atención). Los diagramas de esos tipos para los demás casos de uso quedan para la siguiente entrega.
