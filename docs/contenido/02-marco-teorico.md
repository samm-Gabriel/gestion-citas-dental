# 2. MARCO TEÓRICO

## 2.1 Fundamento Teórico

El sistema sigue el Proceso Unificado de Desarrollo de Software (Jacobson, Booch y Rumbaugh, 1999): está dirigido por casos de uso, centrado en la arquitectura e iterativo e incremental. Los casos de uso del capítulo 4 se reparten en dos ciclos y se trazan hasta los paquetes, las clases de análisis, los diagramas de secuencia y las pruebas. Los diagramas se expresan en UML con PlantUML y el modelo relacional en Mermaid.

### 2.1.1 Arquitectura de Back-end

El back-end se organiza en capas. La **capa de controladores** está formada por los manejadores de rutas de Next.js (*Route Handlers*), un archivo `route.ts` por recurso bajo `app/api/`, que exportan funciones `GET`, `POST`, `PATCH` y `DELETE` (Vercel, s. f.). Cada manejador se envuelve en la función `manejar()` de `lib/http.ts`, que convierte cualquier error en una respuesta JSON uniforme `{ error: { code, message, details } }`. La **capa de servicio o lógica de negocio** vive en `lib/agenda.ts` y `lib/tablero.ts`: ahí están las reglas de agenda (cálculo de la hora de fin, solape de intervalos, horario de atención, transiciones de estado). La **capa de acceso a datos** es Prisma Client, un ORM con tipos generados a partir de `prisma/schema.prisma` (Prisma Data, s. f.).

El lenguaje es TypeScript en modo estricto. Prisma envía las consultas a PostgreSQL como sentencias parametrizadas, de modo que los valores que llegan del usuario nunca se concatenan al SQL; la única consulta escrita a mano, el bloqueo de agenda, usa la plantilla etiquetada `$executeRaw`, que también parametriza. Antes de llegar a la base, todo cuerpo y parámetro de consulta se valida con esquemas Zod (`lib/validators.ts`), que normalizan los datos (por ejemplo, el CI a mayúsculas) y devuelven mensajes en español por campo (Zod, s. f.).

El **modelo relacional** organiza los datos en tablas con clave primaria (PK) que identifica cada fila, claves foráneas (FK) que garantizan que una referencia apunte a una fila existente, restricciones de unicidad (UNIQUE) que impiden duplicados y restricciones de verificación (CHECK) que limitan los valores admitidos (The PostgreSQL Global Development Group, s. f.). En este sistema la base garantiza PK, FK y UNIQUE (CI del paciente, nombre del tratamiento, bloque de horario, una atención por cita); los rangos de valores se validan en la aplicación, como se detalla en 6.3.2.2.

Se distingue entre **autenticación**, que comprueba quién es el usuario, y **autorización**, que decide qué puede hacer. Cuando hay contraseñas, estas se almacenan solo como un *hash* con sal mediante un algoritmo lento diseñado para ello (bcrypt, scrypt o Argon2), nunca en texto plano (OWASP Foundation, s. f.). La historia de usuario de este sistema excluye el inicio de sesión y lo sustituye por un selector de perfil; por eso el sistema no almacena contraseñas y su control de acceso es solo de presentación (el menú y los botones visibles dependen del perfil), sin autorización en la API.

### 2.1.2 Arquitectura de Front-end (Web)

La interfaz se construye con React 19 dentro del App Router de Next.js: cada carpeta de `app/(panel)/` es una ruta y su `page.tsx` es la pantalla (Vercel, s. f.). Los componentes de interfaz (botones, tablas, diálogos) provienen de shadcn y se estilan con Tailwind CSS 4. Las pantallas son componentes de cliente que consultan la API a través de un cliente tipado (`lib/api.ts`), de modo que los tipos de las respuestas coinciden con el contrato `docs/api/openapi.yaml`.

La **navegación por perfil** se resuelve con un contexto de React (`components/perfil-provider.tsx`) que guarda el perfil en `localStorage` y define el menú de cada uno; un panel común redirige a la pantalla de selección si no hay perfil.

La **validación** se hace en dos lugares con propósitos distintos. En el cliente se comprueban los campos obligatorios para dar respuesta inmediata («Elige un paciente», «Completa al menos uno de los tres campos.»). En el servidor se aplican todas las reglas, porque el cliente puede omitirse: formatos con Zod y reglas de negocio en `lib/agenda.ts`. Los errores del servidor vuelven con un código (`CHOQUE_HORARIO`, `CI_DUPLICADO`…) y, cuando corresponde, con el campo afectado, y el formulario los muestra junto al campo o en un aviso con un título según el código.

En cuanto a **accesibilidad y diseño adaptable**, los campos tienen etiqueta asociada, la navegación principal tiene `aria-label`, el enlace activo usa `aria-current` y la interfaz está en español (`lang="es"`). En pantallas pequeñas el menú lateral se convierte en un panel deslizable y las tablas pasan a listas de tarjetas. Estas prácticas siguen las pautas WCAG 2.2 (W3C, 2023), aunque no se ha realizado una auditoría formal de accesibilidad.
