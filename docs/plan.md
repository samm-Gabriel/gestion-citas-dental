# Plan: Sistema de gestión de citas odontológicas

Historia de usuario: #1

| # | Sub-historia | Etapa | Issue | Estado |
|---|---|---|---|---|
| 1 | Modelo de datos y API de pacientes y odontólogos | backend | #2 | hecha |
| 2 | API de tratamientos y citas con reglas de agenda | backend | #3 | hecha |
| 3 | API de atención y tablero | backend | #4 | hecha |
| 4 | Pantallas de pacientes, odontólogos y tratamientos | frontend | #5 | hecha |
| 5 | Pantallas de agenda de citas, atención y tablero con selector de perfil | frontend | #6 | hecha |
| 6 | Conectar la UI con la API real y dejar el build en verde | integracion | #7 | hecha |
| 7 | Pruebas automáticas de la API y smoke de páginas | pruebas | #8 | pendiente |
| 8 | Documento del sistema con diagramas | docs | #9 | pendiente |
| 9 | Despliegue en Vercel con PostgreSQL | deploy | #10 | pendiente |

## Criterios de aceptación por sub-historia

1. **Modelo de datos y API de pacientes y odontólogos**
   - Esquema Prisma con Paciente, Odontologo (especialidad y horario de atención), Tratamiento, Cita y Atencion; migración aplicada y seed.
   - CRUD de pacientes con búsqueda por nombre o CI; el CI es único (409 si se repite).
   - Historial de citas de un paciente.
   - CRUD de odontólogos con especialidad y horario de atención.
2. **API de tratamientos y citas con reglas de agenda**
   - CRUD de tratamientos con duración en minutos y precio.
   - Reservar cita con paciente, odontólogo, tratamiento, fecha y hora; estados pendiente, confirmada, atendida y cancelada.
   - Rechaza choques con otra cita activa del mismo odontólogo considerando la duración del tratamiento.
   - Rechaza citas en el pasado o fuera del horario del odontólogo.
   - Reprogramar y cancelar; una cita cancelada libera el horario.
   - Listado de citas filtrable por fecha, odontólogo, paciente y estado.
3. **API de atención y tablero**
   - Registrar la atención de una cita (diagnóstico y observaciones) y marcarla como atendida.
   - Tablero: citas de hoy, citas de la semana por odontólogo y pacientes nuevos del mes.
   - Contrato completo en `docs/api/openapi.yaml`.
4. **Pantallas de pacientes, odontólogos y tratamientos**
   - Listados filtrables y formularios de alta y edición, en español y adaptados al celular.
   - Ficha del paciente con su historial de citas.
5. **Pantallas de agenda de citas, atención y tablero con selector de perfil**
   - Selector de perfil (recepcionista, odontólogo, administrador) que muestra los menús de cada uno.
   - Agenda con reserva, reprogramación y cancelación; agenda del día del odontólogo con registro de atención.
   - Tablero con los tres indicadores.
6. **Conectar la UI con la API real**
   - `lib/api.ts` usa las rutas reales; sin mocks.
   - Los errores de validación de la API (choques, CI repetido, fuera de horario) se muestran en los formularios.
   - `next build` en verde contra la base real.
7. **Pruebas automáticas**
   - Vitest para los handlers de la API sobre un schema de prueba aislado, cubriendo las reglas de agenda y el CI único.
   - Smoke de las páginas principales.
8. **Documento del sistema**
   - Documento según el Proceso Unificado con diagramas PlantUML y ER en Mermaid renderizados a PNG, en `docs/`.
9. **Despliegue**
   - Proyecto en Vercel con `DATABASE_URL` de producción, migraciones aplicadas y URL pública funcionando.
