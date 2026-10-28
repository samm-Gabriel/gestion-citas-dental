# 8. FT. PRUEBAS

Las pruebas automáticas usan Vitest 3.2.7 y se ejecutan con `npm test`. Los manejadores de la API se llaman directamente, como funciones, sobre un schema PostgreSQL temporal `test_<timestamp>` que `tests/global-setup.ts` crea en la misma base con `prisma migrate deploy` y borra al final con `DROP SCHEMA … CASCADE`; el schema de la aplicación no se toca. Los archivos se ejecutan en serie porque comparten ese schema y lo limpian entre pruebas.

La última ejecución registrada corresponde al commit 191a9bb (sub-historia #8): **6 archivos, 78 de 78 pruebas aprobadas, en 286 segundos**. Esa ejecución no se repitió al redactar este documento, que no modifica código de la aplicación ni pruebas; sí se repitió `next build`.

| Revisión ejecutada | Resultado observado |
|---|---|
| `tests/api/citas.test.ts` (24 pruebas; CU07, CU09 a CU14) | Cita válida 201 con horaFin calculada; VALIDACION 400; JSON_INVALIDO 400; paciente inexistente 404; CHOQUE_HORARIO 409 a la misma hora y por solape de duración en ambos sentidos; empezar justo al terminar otra 201; otro odontólogo a la misma hora 201; CITA_EN_PASADO 422; FUERA_DE_HORARIO 422 por día, por hora de cierre y por duración que excede el cierre; cancelar 200 libera el horario; cancelar una ATENDIDA 422 ESTADO_INVALIDO; reprogramar 200 recalcula horaFin y libera el horario anterior; reprogramar a un horario ocupado 409; mover dentro del propio horario 200; atención 201 deja la cita ATENDIDA y una segunda atención 409; PATCH de estado a CONFIRMADA 200; GET inexistente 404; id no numérico 400; DELETE 200; filtros `?q=` y `?estado=`. Todas aprobadas. |
| `tests/api/pacientes.test.ts` (10 pruebas; CU02, CU03, CU15) | Crear 201 con el CI en mayúsculas; 400 por datos inválidos; CI_DUPLICADO 409 al crear y al editar; 404; actualizar 200; eliminar 200; EN_USO 409 con citas; búsqueda por apellido y por CI; historial 200 y 404. Todas aprobadas. |
| `tests/api/odontologos.test.ts` (8 pruebas; CU04, CU05) | Horarios solapados o invertidos 400; INACTIVO 422 al agendar con un odontólogo inactivo; `pageSize=100` devuelve un arreglo; EN_USO 409 al eliminar con citas. Todas aprobadas. |
| `tests/api/tratamientos.test.ts` (7 pruebas; CU06) | NOMBRE_DUPLICADO 409; duración y precio inválidos 400. Todas aprobadas. |
| `tests/api/tablero.test.ts` (3 pruebas; CU16) | 200; con `?fecha=` cuenta las citas por estado; fecha inválida 400. Todas aprobadas. |
| `tests/smoke/pages.test.ts` (26 pruebas; todas las pantallas) | Las 16 páginas `page.tsx` exportan un componente, más la comprobación del total; 9 rutas responden 200 con `next start` en el puerto 3088. Todas aprobadas. |
| Integración manual contra Neon (#7) | Alta de paciente 201, CI repetido 409, cita 201, choque 409, cita en el pasado 422, fuera de horario 422, reprogramar 200, atender 201, cancelar 200, cancelar una atendida 422, tablero 200 y las 16 páginas 200. |
| `next build` (al cerrar este documento) | Compilación sin errores: 16 páginas y 13 rutas de API. |
| Render de diagramas (`docs/generador/render.mjs`) | 36 de 36 fuentes renderizadas a PNG (38 imágenes, por las dos páginas de cada secuencia). |

Lo que **no se ha verificado**: la concurrencia real de dos reservas simultáneas para el mismo odontólogo (el bloqueo consultivo está implementado, pero ninguna prueba lanza peticiones en paralelo); el rendimiento con volúmenes mayores que el seed; la accesibilidad con herramientas de auditoría o lectores de pantalla; el comportamiento en navegadores distintos de Chrome; y el sistema desplegado en Vercel, que aún no existe.

| CU / área | Prueba prevista y resultado esperado |
|---|---|
| CU07 y CU09 (concurrencia) | Enviar en paralelo dos reservas que se cruzan para el mismo odontólogo: exactamente una responde 201 y la otra 409 CHOQUE_HORARIO. |
| CU01 a CU03 (interfaz) | Prueba de extremo a extremo en el navegador: elegir cada perfil, comprobar su menú, registrar un paciente y ver el mensaje de CI repetido junto al campo. |
| CU04 a CU06 (interfaz) | Crear un odontólogo con dos bloques solapados y comprobar el aviso del formulario; desactivar un tratamiento y comprobar que no aparece en «Nueva cita». |
| CU07 a CU11 (interfaz) | Reservar, confirmar, reprogramar y cancelar desde la agenda y comprobar los textos de éxito y de cada error de agenda. |
| CU12 a CU16 (interfaz) | Agenda del día con el perfil Odontólogo, registro y corrección de la atención, historial del paciente y tablero con fecha de referencia. |
| Despliegue (#10) | Repetir la integración manual de #7 contra la URL de producción. |
| Accesibilidad y móvil | Auditoría automática de accesibilidad de las 16 páginas y revisión en un celular real. |

Cada prueba futura registrará la entrada, los pasos, el resultado esperado, el resultado obtenido y la evidencia (salida de la herramienta o captura).
