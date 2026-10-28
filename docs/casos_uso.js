// Catálogo único de actores, casos de uso, paquetes y ciclos del sistema.
// El documento (docs/contenido), las tablas generadas y los diagramas
// (docs/diagramas) se derivan de aquí: si cambia un CU, cambia en todos lados.

const actores = [
  {
    nombre: "Usuario",
    descripcion:
      "Actor abstracto que generaliza a los tres perfiles. Elige su perfil en la pantalla inicial y busca pacientes y consulta su historial. No existe como cuenta: el perfil se guarda en el navegador.",
  },
  {
    nombre: "Recepcionista",
    descripcion:
      "Registra y edita pacientes, reserva, reprograma, confirma y cancela citas y consulta la agenda y el tablero. No gestiona odontólogos ni tratamientos ni registra atenciones.",
  },
  {
    nombre: "Odontólogo",
    descripcion:
      "Se identifica entre los odontólogos activos, consulta su agenda del día y registra o corrige la atención de sus citas. Consulta pacientes en modo lectura.",
  },
  {
    nombre: "Administrador",
    descripcion:
      "Dentista dueño del consultorio. Gestiona odontólogos, horarios y tratamientos, consulta el tablero y tiene además todas las opciones de los otros dos perfiles.",
  },
];

const paquetes = [
  {
    id: "P1",
    nombre: "P1 Acceso y pacientes",
    responsabilidad: "Selección de perfil y registro, edición, eliminación y búsqueda de pacientes (CI único).",
    ciclo: "C1",
  },
  {
    id: "P2",
    nombre: "P2 Odontólogos y tratamientos",
    responsabilidad: "Catálogo de odontólogos con su horario de atención y catálogo de tratamientos con duración y precio.",
    ciclo: "C1",
  },
  {
    id: "P3",
    nombre: "P3 Agenda de citas",
    responsabilidad:
      "Reserva, disponibilidad, reprogramación, cancelación y confirmación de citas con las reglas de agenda (choques, pasado, horario).",
    ciclo: "C1 y C2",
  },
  {
    id: "P4",
    nombre: "P4 Atención y seguimiento",
    responsabilidad: "Listado de citas, agenda del día, registro de la atención, historial del paciente y tablero de indicadores.",
    ciclo: "C2",
  },
];

const R = ["Recepcionista", "Administrador"];
const O = ["Odontólogo", "Administrador"];
const TODOS = ["Recepcionista", "Odontólogo", "Administrador"];

// complejidad: A = 3 (varias tablas, transacción), M = 2 (gestión con validaciones), B = 1 (consulta simple)
const casosUso = [
  {
    id: "CU01", nombre: "Seleccionar perfil", actores: ["Usuario"], paquete: "P1", ciclo: "C1",
    descripcion: "Elegir Recepcionista, Odontólogo (identificándose entre los activos) o Administrador para ver el menú del perfil.",
    relacion: "Generalización de actores hacia Usuario", prioridad: "Crítica", riesgo: "Medio", complejidad: "B",
  },
  {
    id: "CU02", nombre: "Gestionar pacientes", actores: R, paquete: "P1", ciclo: "C1",
    descripcion: "Registrar, editar y eliminar pacientes; el CI es único y no se elimina un paciente con citas.",
    relacion: "—", prioridad: "Crítica", riesgo: "Significativo", complejidad: "M",
  },
  {
    id: "CU03", nombre: "Buscar paciente", actores: TODOS, paquete: "P1", ciclo: "C1",
    descripcion: "Filtrar pacientes por nombre, apellido o CI con paginación.",
    relacion: "—", prioridad: "Importante", riesgo: "Ordinario", complejidad: "B",
  },
  {
    id: "CU04", nombre: "Gestionar odontólogos", actores: ["Administrador"], paquete: "P2", ciclo: "C1",
    descripcion: "Registrar, editar, activar o desactivar y eliminar odontólogos con su especialidad.",
    relacion: "Extendido por CU05", prioridad: "Crítica", riesgo: "Significativo", complejidad: "M",
  },
  {
    id: "CU05", nombre: "Definir horario de atención", actores: ["Administrador"], paquete: "P2", ciclo: "C1",
    descripcion: "Agregar, modificar o quitar bloques día-hora del odontólogo sin solapes ni horas invertidas.",
    relacion: "«extend» CU04", prioridad: "Crítica", riesgo: "Significativo", complejidad: "M",
  },
  {
    id: "CU06", nombre: "Gestionar tratamientos", actores: ["Administrador"], paquete: "P2", ciclo: "C1",
    descripcion: "Registrar, editar, desactivar y eliminar tratamientos con duración en minutos y precio; nombre único.",
    relacion: "—", prioridad: "Crítica", riesgo: "Medio", complejidad: "M",
  },
  {
    id: "CU07", nombre: "Reservar cita", actores: R, paquete: "P3", ciclo: "C1",
    descripcion: "Agendar paciente, odontólogo, tratamiento, fecha y hora; calcula la hora de fin y rechaza choques, pasado y fuera de horario.",
    relacion: "«include» CU08", prioridad: "Crítica", riesgo: "Crítico", complejidad: "A",
  },
  {
    id: "CU08", nombre: "Consultar disponibilidad del odontólogo", actores: R, paquete: "P3", ciclo: "C1",
    descripcion: "Mostrar los bloques de atención del día elegido y las horas ya reservadas del odontólogo.",
    relacion: "Incluido por CU07 y CU09", prioridad: "Importante", riesgo: "Medio", complejidad: "B",
  },
  {
    id: "CU09", nombre: "Reprogramar cita", actores: R, paquete: "P3", ciclo: "C2",
    descripcion: "Cambiar fecha, hora, odontólogo o tratamiento de una cita activa con las mismas reglas de agenda.",
    relacion: "«include» CU08", prioridad: "Crítica", riesgo: "Crítico", complejidad: "A",
  },
  {
    id: "CU10", nombre: "Cancelar cita", actores: R, paquete: "P3", ciclo: "C2",
    descripcion: "Cancelar una cita pendiente o confirmada con motivo opcional; el horario queda libre.",
    relacion: "—", prioridad: "Crítica", riesgo: "Significativo", complejidad: "M",
  },
  {
    id: "CU11", nombre: "Confirmar cita", actores: R, paquete: "P3", ciclo: "C2",
    descripcion: "Pasar una cita de PENDIENTE a CONFIRMADA o devolverla a PENDIENTE.",
    relacion: "—", prioridad: "Media", riesgo: "Ordinario", complejidad: "B",
  },
  {
    id: "CU12", nombre: "Consultar agenda de citas", actores: R, paquete: "P4", ciclo: "C2",
    descripcion: "Listar citas por rango de fechas, odontólogo, estado y texto del paciente, navegando por semanas.",
    relacion: "—", prioridad: "Importante", riesgo: "Ordinario", complejidad: "B",
  },
  {
    id: "CU13", nombre: "Consultar agenda del día", actores: O, paquete: "P4", ciclo: "C2",
    descripcion: "Ver las citas de un odontólogo en una fecha (por defecto, hoy y el odontólogo del perfil).",
    relacion: "Extendido por CU14", prioridad: "Importante", riesgo: "Ordinario", complejidad: "B",
  },
  {
    id: "CU14", nombre: "Registrar atención", actores: O, paquete: "P4", ciclo: "C2",
    descripcion: "Registrar diagnóstico, tratamiento realizado y observaciones; la cita queda ATENDIDA. Permite corregir la atención.",
    relacion: "«extend» CU13", prioridad: "Crítica", riesgo: "Significativo", complejidad: "A",
  },
  {
    id: "CU15", nombre: "Consultar historial del paciente", actores: TODOS, paquete: "P4", ciclo: "C2",
    descripcion: "Ver la ficha del paciente con sus citas y atenciones, filtrable por estado.",
    relacion: "—", prioridad: "Importante", riesgo: "Ordinario", complejidad: "B",
  },
  {
    id: "CU16", nombre: "Consultar tablero", actores: R, paquete: "P4", ciclo: "C2",
    descripcion: "Ver citas de hoy por estado, citas de la semana por odontólogo y pacientes nuevos del mes.",
    relacion: "—", prioridad: "Importante", riesgo: "Medio", complejidad: "M",
  },
].map((c) => ({ estado: "Incluido", ...c }));

export const PUNTOS = { A: 3, M: 2, B: 1 };

export function distribucion() {
  const out = {};
  for (const ciclo of ["C1", "C2"]) {
    const cu = casosUso.filter((c) => c.ciclo === ciclo);
    const cuenta = (k) => cu.filter((c) => c.complejidad === k).length;
    out[ciclo] = {
      cu: cu.length,
      paquetes: [...new Set(cu.map((c) => c.paquete))],
      A: cuenta("A"),
      M: cuenta("M"),
      B: cuenta("B"),
      puntos: cu.reduce((s, c) => s + PUNTOS[c.complejidad], 0),
    };
  }
  return out;
}

// El reparto tiene que ser parejo: mismos CU por ciclo, diferencia de puntos <= 2,
// cada CU en un único paquete y paquetes que se emparejan (P1=P2, P3=P4).
function verificar() {
  const ids = new Set();
  for (const c of casosUso) {
    if (ids.has(c.id)) throw new Error(`casos_uso.js: ${c.id} repetido`);
    ids.add(c.id);
    if (!paquetes.some((p) => p.id === c.paquete)) throw new Error(`casos_uso.js: ${c.id} sin paquete válido`);
    if (!PUNTOS[c.complejidad]) throw new Error(`casos_uso.js: ${c.id} sin complejidad A/M/B`);
  }
  const d = distribucion();
  if (d.C1.cu !== d.C2.cu) throw new Error(`casos_uso.js: ciclos dispares (${d.C1.cu} vs ${d.C2.cu} CU)`);
  if (Math.abs(d.C1.puntos - d.C2.puntos) > 2) {
    throw new Error(`casos_uso.js: puntos desequilibrados (${d.C1.puntos} vs ${d.C2.puntos})`);
  }
  const n = (id) => casosUso.filter((c) => c.paquete === id).length;
  if (n("P1") !== n("P2") || n("P3") !== n("P4")) {
    throw new Error("casos_uso.js: los paquetes de cada capa deben tener el mismo número de CU");
  }
}
verificar();

export default { actores, paquetes, casosUso };
