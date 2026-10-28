# Generador de la documentación

Copia esta carpeta a `docs/generador/` del proyecto y corre una vez:

```sh
cd docs/generador && PUPPETEER_SKIP_DOWNLOAD=1 npm install
```

`PUPPETEER_SKIP_DOWNLOAD=1` evita bajar un Chrome entero: `render.mjs` usa el Chrome del sistema (`/usr/bin/google-chrome`) o el de `PUPPETEER_EXECUTABLE_PATH`.

```sh
node docs/generador/render.mjs   # diagramas → PNG
node docs/generador/build.mjs    # PNG + capítulos → docs/<slug>.docx
```

Los dos scripts toman la carpeta `docs/` como la carpeta padre de donde viven. Para otra ruta: `--docs <carpeta>`.

## Diagramas

| Fuente | Herramienta | Salida |
| --- | --- | --- |
| `docs/diagramas/<tipo>/*.puml` | PlantUML (Java). El `.jar` se descarga una vez a `~/.cache/garness/` (o `PLANTUML_JAR`). | `docs/diagramas/png/<tipo>/<nombre>.png` |
| `docs/diagramas/<tipo>/*.mmd` | mermaid-cli | `docs/diagramas/png/<tipo>/<archivo>.png` |

- `<nombre>` es el de `@startuml <nombre>`; si no lo hay, el del archivo.
- Sin Graphviz (`dot`), PlantUML usa el motor `smetana` solo. No hace falta añadir el pragma.
- Si un diagrama falla, `render.mjs` sale con código 1 e imprime el error.

## `docs/documento.json`

```json
{
  "slug": "gestion-citas",
  "sistema": "Sistema de gestión de citas odontológicas",
  "nombreCorto": "Gestión de citas",
  "universidad": "Universidad …",
  "facultad": "Facultad de …",
  "grupo": "GRUPO #1",
  "escudo": "escudo.png",
  "integrantes": [{ "nombre": "Gabriel …", "registro": "2020…" }],
  "materia": "…",
  "sigla": "…",
  "grupoMateria": "SA",
  "docente": "…",
  "ciudad": "Santa Cruz",
  "fecha": "10/2026",
  "capitulos": ["01-perfil.md", "02-marco-teorico.md"]
}
```

`escudo` es opcional y relativo a `docs/`. Sin `capitulos`, se usan todos los `docs/contenido/*.md` en orden alfabético.

## Capítulos (`docs/contenido/*.md`)

Markdown acotado. Lo que no está en esta lista se trata como párrafo.

| Escribes | Sale en el DOCX |
| --- | --- |
| `# 1. PERFIL` | Título 1 (salto de página, línea inferior, 16 pt `0B2A6F`) |
| `## 1.1 INTRODUCCIÓN` … `##### …` | Títulos 2 a 5 con su color |
| `#### CU09 Reservar cita` | Título de CU (negrita cursiva `1F2937`) al nivel que le pongas |
| Párrafo | Arial 11, justificado, interlineado 1.25 |
| `**negrita**`, `*cursiva*`, `` `código` `` | Formato en línea |
| `- viñeta` (2 espacios = nivel 2) | Viñeta `•` |
| `1. paso` | Lista numerada (cada lista reinicia en 1) |
| Tabla con `\|` | Tabla a todo el ancho, encabezado azul con texto blanco que se repite por página |
| `<!-- ficha -->` justo antes de una tabla de 2 columnas | Ficha de CU (2100/7260, clave sobre `E3EBF7`). Una fila `\| ![](ruta.png) \|` mete la imagen en la fila superior combinada. `<br>` parte líneas dentro de la celda. |
| `![Título](../diagramas/png/actividad/proceso.png "Nota. Elaboración propia en PlantUML (docs/diagramas/actividad/proceso.puml).")` | `Figura N` + título en cursiva + imagen centrada (máx. 620 px) + nota |
| `!pendiente` o `!pendiente: Espacio para el diagrama de secuencia (cu09.puml).` | Párrafo en cursiva gris (el título se conserva) |
| ```` ``` ```` … ```` ``` ```` | Courier New 9 pt |
| `<!-- salto -->` | Salto de página |
| `<!-- casos_uso:actores -->`, `listado`, `priorizacion`, `paquetes` | Tabla generada desde `docs/casos_uso.js` |

Las rutas de imagen se resuelven primero contra la carpeta del `.md` y luego contra `docs/`. Si falta una figura, `build.mjs` sale con código 1.

El índice `CONTENIDO` es un campo de Word: al abrir el documento, Word pide actualizar campos y llena las páginas.

## `docs/casos_uso.js`

Única fuente de actores, CU y paquetes:

```js
export default {
  actores: [{ nombre: "Recepcionista", descripcion: "Registra pacientes y agenda citas." }],
  paquetes: [{ id: "P1", nombre: "P1 Gestión de pacientes", responsabilidad: "…", ciclo: "C1" }],
  casosUso: [
    {
      id: "CU01", nombre: "Gestionar pacientes", actores: ["Recepcionista"],
      descripcion: "…", relacion: "—", paquete: "P1", ciclo: "C1",
      prioridad: "Crítica", riesgo: "Significativo", estado: "Incluido",
    },
  ],
};
```
