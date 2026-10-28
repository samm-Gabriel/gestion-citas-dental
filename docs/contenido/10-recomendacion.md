# 10. RECOMENDACIÓN

La primera recomendación, por su impacto, es añadir autenticación y autorización en el servidor antes de exponer el sistema en Internet con el despliegue de la sub-historia #10. Hoy el selector de perfil solo decide qué muestra la interfaz y cualquier persona que conozca la URL de la API puede crear, modificar o eliminar datos. Basta una tabla de usuarios con contraseñas guardadas con un *hash* lento y una verificación del rol en `manejar()` para cada ruta; mientras tanto, conviene restringir el acceso al despliegue (por ejemplo, con la protección por contraseña de Vercel).

En segundo lugar, se recomienda llevar a la base las reglas que hoy solo garantiza el código, empezando por la más crítica: una restricción de exclusión sobre el rango [inicio, fin) por odontólogo para citas no canceladas (extensión `btree_gist`), que complementaría el bloqueo consultivo. Después, restricciones `CHECK` para `fin > inicio`, la duración de 5 a 480 minutos, el precio no negativo y `diaSemana` entre 0 y 6. Cada cambio debe ir en una migración nueva y con su prueba.

En tercer lugar, completar la verificación: una prueba de concurrencia que lance dos reservas simultáneas que se cruzan, pruebas de extremo a extremo en el navegador para los flujos de cada perfil y una auditoría de accesibilidad de las 16 páginas. Tras el despliegue, repetir contra producción la integración manual de #7 y registrar la URL en el issue #10.

En cuarto lugar, completar la documentación de la siguiente entrega con los diagramas de comunicación, análisis de clase y secuencia de los 14 casos de uso restantes, empezando por CU09 Reprogramar cita y CU10 Cancelar cita, que comparten reglas con el núcleo. Conviene también completar los datos de la carátula y actualizar el índice en Word.

Finalmente, cuando el consultorio lo requiera, evaluar una bitácora de auditoría de cambios de estado de las citas (quién canceló o reprogramó y cuándo), que depende de tener usuarios autenticados, y los módulos que hoy están fuera de alcance, como los recordatorios a pacientes.
