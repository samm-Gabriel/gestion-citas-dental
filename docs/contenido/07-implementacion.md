# 7. FT. IMPLEMENTACIÓN

## 7.1 Herramientas de Desarrollo de la Aplicación Web

Las versiones indicadas son las instaladas en el proyecto (`node_modules`) al momento de redactar este documento.

### 7.1.1 Lenguajes de Programación

**TypeScript 5.9.3** es el lenguaje de todo el sistema: pantallas, manejadores de API, lógica de negocio, seed y pruebas. Se usa en modo estricto, y los tipos del modelo de datos los genera Prisma, de modo que un cambio en `schema.prisma` se refleja como error de compilación en el código que no lo contemple. Estado: implementado.

**SQL** aparece en el script de migración generado por Prisma y en una única sentencia escrita a mano, el bloqueo consultivo de agenda (`SELECT pg_advisory_xact_lock(...)`), ejecutada con parámetros. Estado: implementado.

**HTML y CSS** se escriben como JSX y clases de **Tailwind CSS 4.3.3** dentro de los componentes React. Estado: implementado.

### 7.1.2 Base de Datos

**PostgreSQL** alojado en **Neon**, en el schema `gestion-citas-dental`. Guarda las 6 tablas del modelo y se accede con **Prisma ORM 6.19.3** (Prisma Client y Prisma Migrate). La conexión de la aplicación usa el *pooler* de Neon y las migraciones la conexión directa. El seed (`prisma/seed.ts`) carga 12 pacientes, 4 odontólogos, 8 tratamientos, 20 bloques de horario, 114 citas y 46 atenciones. Estado: en uso desde la sub-historia #2; las pruebas usan un schema temporal aparte. Las credenciales de conexión están en `.env`, que no se versiona (`.env.example` solo lista las variables).

### 7.1.3 Entornos de Desarrollo

**Next.js 16.4.3** con App Router es el marco de la aplicación: sirve las páginas y los manejadores de API desde el mismo proyecto. El proyecto activa `cacheComponents`, por lo que cada manejador espera una petición real (`connection()`) antes de consultar la base. Se ejecuta sobre **Node.js 22.23.3** y **npm 10.9.9**, con **React 19.3.0**. La interfaz se generó con **v0** y usa componentes **shadcn** (sobre `@base-ui/react` 1.9.0), iconos **lucide-react** 1.63.0 y notificaciones **sonner** 2.0.8. La validación usa **Zod 4.6.7** con mensajes en español. El código se revisa con **ESLint 9.39.5**. Estado: `next build` termina sin errores (verificado de nuevo al cerrar este documento).

### 7.1.4 Otros

- **Git y GitHub.** Control de versiones en el repositorio `samm-gabriel/gestion-citas-dental`, rama `main`, con un commit por sub-historia (#2 a #8) y el plan en `docs/plan.md`.
- **Contrato de la API.** `docs/api/openapi.yaml` (OpenAPI 3.1.0) describe las 13 rutas, sus parámetros, respuestas y códigos de error.
- **Pruebas.** **Vitest 3.2.7** para los manejadores de la API sobre un schema PostgreSQL temporal y para las pruebas de humo de las páginas; `tsx` 4.23.15 ejecuta el seed.
- **Documentación.** PlantUML 1.2026.9 (motor de diseño *smetana*, sin Graphviz) y mermaid-cli 11.17.1 para los diagramas, y la librería `docx` 9.15.0 para generar este documento. Están en `docs/generador/`, con su propio `package.json`, fuera de las dependencias de la aplicación.
- **Despliegue.** Vercel, previsto en la sub-historia #10; no realizado.

## 7.2 Implementación de la Arquitectura del Sistema

Una petición atraviesa las capas siempre en el mismo orden. Se toma como ejemplo la operación núcleo, reservar una cita:

1. **Vista.** El componente `CitaForm` (`components/citas/cita-form.tsx`) comprueba que estén paciente, odontólogo, tratamiento, fecha y hora, y llama a `createCita` del cliente tipado `lib/api.ts`, que envía `POST /api/citas` con un cuerpo JSON.
2. **Controlador.** `app/api/citas/route.ts` exporta `POST = manejar(...)`. El envoltorio `manejar` de `lib/http.ts` espera la petición (`connection()`), lee el JSON (400 JSON_INVALIDO si no es válido) y valida el cuerpo con el esquema `citaCrear` de Zod (400 VALIDACION con el detalle por campo).
3. **Lógica de negocio.** `reservarCita` (`lib/agenda.ts`) convierte la fecha y hora locales en un instante UTC y abre una transacción con `prisma.$transaction`. Dentro, toma el bloqueo `pg_advisory_xact_lock(4242, odontologoId)`, de modo que una segunda reserva para el mismo odontólogo espera a que termine la primera; luego `validarReglasAgenda` busca paciente, odontólogo con horarios y tratamiento, calcula `fin`, rechaza el pasado y lo que no cabe en el horario y busca una cita no cancelada que se cruce (`inicio < fin` y `fin > inicio`).
4. **Acceso a datos.** Si todo pasa, Prisma inserta la cita y la transacción confirma. Si alguna regla falla, se lanza un `ApiError` (por ejemplo 409 CHOQUE_HORARIO con la cita que choca en `details`), la transacción se deshace y no queda nada escrito.
5. **Respuesta.** `manejar` convierte el `ApiError` en `{ error: { code, message, details } }` con su código HTTP, o devuelve 201 con `{ data }` y la cita serializada con `fecha`, `horaInicio` y `horaFin` locales. La vista muestra el error junto al campo o en un aviso con título según el código, o redirige al detalle de la cita.

Los errores conocidos de Prisma también se traducen: una violación de UNIQUE (P2002) responde 409 CI_DUPLICADO o NOMBRE_DUPLICADO, una de clave foránea (P2003) 409 EN_USO y un registro inexistente (P2025) 404. Cualquier otro error responde 500 ERROR_INTERNO sin exponer detalles.

## 7.3 Implementación de la Arquitectura de Subsistemas

Los subsistemas se implementaron por capas y no por ciclo: primero el modelo y la API de cada paquete (#2 a #4), luego las pantallas (#5 y #6), la integración (#7) y las pruebas (#8). La tabla relaciona cada paquete con sus componentes reales.

| Subsistema (paquete) | Orden y responsabilidad de implementación |
|---|---|
| P1 Acceso y pacientes (ciclo 1, CU01 a CU03) | #2: modelo Paciente y API `/api/pacientes` (Cpaciente). #5: pantallas `app/(panel)/pacientes/**` y `paciente-form.tsx` (Vpaciente). #6: selector de perfil `app/page.tsx` y `perfil-provider.tsx` (Vperfil, Cperfil). |
| P2 Odontólogos y tratamientos (ciclo 1, CU04 a CU06) | #2: modelos Odontologo y HorarioAtencion y API `/api/odontologos` (Codontologo). #3: modelo Tratamiento y API `/api/tratamientos` (Ctratamiento). #5: pantallas `odontologos/**`, `tratamientos/**` y sus formularios (Vodontologo, Vtratamiento). |
| P3 Agenda de citas (ciclos 1 y 2, CU07 a CU11) | #3: modelo Cita, reglas de `lib/agenda.ts` y API `/api/citas`, `/api/citas/{id}`, `/cancelar` y `/estado` (Ccita). #6: `citas/nueva`, `cita-form.tsx`, `agenda-comun.tsx`, `reprogramar-dialog.tsx`, `cancelar-dialog.tsx` y `cita-acciones.tsx` (Vcita). |
| P4 Atención y seguimiento (ciclo 2, CU12 a CU16) | #4: modelo Atencion, API `/api/citas/{id}/atencion` (Catencion), `/api/tablero` con `lib/tablero.ts` (Ctablero) e historial `/api/pacientes/{id}/citas`. #6: `citas/page.tsx`, `agenda-dia/page.tsx` (Vagenda), `atencion-dialog.tsx` (Vatencion), `tablero/page.tsx` (Vtablero) y la ficha del paciente. |
