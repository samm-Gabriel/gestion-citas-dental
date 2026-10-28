import { PrismaClient, type EstadoCita, type Tratamiento } from "@prisma/client";
import { calcularFin } from "../lib/agenda";
import { diaSemanaDeFecha, fechaCalendario, horaAMinutos, hoyLocal, instanteLocal, minutosAHora, sumarDias } from "../lib/fechas";

const prisma = new PrismaClient();

const tratamientos = [
  { nombre: "Consulta y diagnóstico", descripcion: "Evaluación inicial, odontograma y plan de tratamiento", duracionMinutos: 30, precio: "100.00" },
  { nombre: "Limpieza dental (profilaxis)", descripcion: "Destartraje con ultrasonido y pulido", duracionMinutos: 45, precio: "200.00" },
  { nombre: "Obturación con resina", descripcion: "Restauración estética de una pieza con caries", duracionMinutos: 60, precio: "250.00" },
  { nombre: "Extracción simple", descripcion: "Exodoncia de pieza erupcionada con anestesia local", duracionMinutos: 45, precio: "300.00" },
  { nombre: "Endodoncia unirradicular", descripcion: "Tratamiento de conducto de una raíz", duracionMinutos: 90, precio: "900.00" },
  { nombre: "Blanqueamiento dental", descripcion: "Blanqueamiento en consultorio con lámpara LED", duracionMinutos: 90, precio: "1200.00" },
  { nombre: "Control de ortodoncia", descripcion: "Ajuste mensual de brackets", duracionMinutos: 30, precio: "250.00" },
  { nombre: "Radiografía periapical", descripcion: "Radiografía digital de una pieza", duracionMinutos: 15, precio: "50.00" },
];

// diaSemana: 0 = domingo ... 6 = sábado
const odontologos = [
  {
    nombre: "Dra. María Fernanda Quiroga",
    especialidad: "Odontología general",
    activo: true,
    horarios: [1, 2, 3, 4, 5].flatMap((d) => [
      { diaSemana: d, horaInicio: "08:00", horaFin: "12:00" },
      { diaSemana: d, horaInicio: "14:00", horaFin: "18:00" },
    ]),
  },
  {
    nombre: "Dr. Carlos Mamani Choque",
    especialidad: "Endodoncia",
    activo: true,
    horarios: [1, 3, 5].flatMap((d) => [
      { diaSemana: d, horaInicio: "09:00", horaFin: "13:00" },
      { diaSemana: d, horaInicio: "15:00", horaFin: "19:00" },
    ]),
  },
  {
    nombre: "Dra. Lucía Vargas Rojas",
    especialidad: "Ortodoncia",
    activo: true,
    horarios: [
      { diaSemana: 2, horaInicio: "14:00", horaFin: "20:00" },
      { diaSemana: 4, horaInicio: "14:00", horaFin: "20:00" },
      { diaSemana: 6, horaInicio: "08:00", horaFin: "12:00" },
    ],
  },
  {
    nombre: "Dr. Jorge Gutiérrez Salazar",
    especialidad: "Periodoncia",
    activo: false,
    horarios: [{ diaSemana: 2, horaInicio: "08:00", horaFin: "12:00" }],
  },
];

const pacientes = [
  { nombre: "Juan Carlos", apellido: "Pérez Flores", ci: "4567891", telefono: "+591 71234567", email: "jcperez@gmail.com", fechaNacimiento: "1985-03-14", haceDias: 0 },
  { nombre: "Ana Lucía", apellido: "Torrez Mendoza", ci: "6789123", telefono: "+591 76543210", email: "ana.torrez@hotmail.com", fechaNacimiento: "1992-07-22", haceDias: 3 },
  { nombre: "Roberto", apellido: "Condori Huanca", ci: "3456789-1A", telefono: "+591 72011223", email: null, fechaNacimiento: "1978-11-02", haceDias: 8 },
  { nombre: "Gabriela", apellido: "Rocha Villarroel", ci: "8901234", telefono: "+591 79988776", email: "gaby.rocha@gmail.com", fechaNacimiento: "2001-01-30", haceDias: 15 },
  { nombre: "Luis Fernando", apellido: "Aguilar Rojas", ci: "5678901", telefono: "+591 70112233", email: null, fechaNacimiento: null, haceDias: 40 },
  { nombre: "Carmen Rosa", apellido: "Quispe Mamani", ci: "2345678", telefono: "+591 73344556", email: "carmen.quispe@yahoo.com", fechaNacimiento: "1965-05-09", haceDias: 55 },
  { nombre: "Diego", apellido: "Fernández Ortiz", ci: "9012345", telefono: "+591 74455667", email: "diegof@gmail.com", fechaNacimiento: "2010-09-18", haceDias: 70 },
  { nombre: "María José", apellido: "Salinas Arévalo", ci: "7123456", telefono: "+591 75566778", email: null, fechaNacimiento: "1998-12-05", haceDias: 90 },
  { nombre: "Pedro", apellido: "Choque Limachi", ci: "4123987", telefono: "+591 76677889", email: "pchoque@outlook.com", fechaNacimiento: "1970-04-25", haceDias: 120 },
  { nombre: "Valeria", apellido: "Guzmán Paredes", ci: "8456123", telefono: "+591 77788990", email: "vale.guzman@gmail.com", fechaNacimiento: "1995-08-11", haceDias: 150 },
  { nombre: "Andrés", apellido: "Villca Tarqui", ci: "6234789", telefono: "+591 78899001", email: null, fechaNacimiento: "1988-02-17", haceDias: 200 },
  { nombre: "Sofía", apellido: "Mercado Lazarte", ci: "5987321", telefono: "+591 79900112", email: "sofia.mercado@gmail.com", fechaNacimiento: "2004-06-28", haceDias: 1 },
];

const diagnosticos = [
  { diagnostico: "Caries oclusal en pieza 36", tratamientoRealizado: "Obturación con resina compuesta A2", observaciones: "Control en 6 meses" },
  { diagnostico: "Gingivitis leve generalizada", tratamientoRealizado: "Profilaxis y técnica de cepillado", observaciones: "Usar hilo dental diariamente" },
  { diagnostico: "Pulpitis irreversible en pieza 21", tratamientoRealizado: "Endodoncia unirradicular", observaciones: "Requiere corona en la próxima visita" },
  { diagnostico: "Resto radicular en pieza 48", tratamientoRealizado: "Extracción simple", observaciones: "Indicado paracetamol 500 mg cada 8 h por 2 días" },
  { diagnostico: "Maloclusión clase II", tratamientoRealizado: "Cambio de arco y ligaduras", observaciones: "Siguiente control en 4 semanas" },
];

async function main() {
  const hoy = hoyLocal();
  const ahora = new Date();

  const tratamientosDb: Tratamiento[] = [];
  for (const t of tratamientos) {
    tratamientosDb.push(
      await prisma.tratamiento.upsert({ where: { nombre: t.nombre }, update: {}, create: t }),
    );
  }

  const odontologosDb = [];
  for (const { horarios, ...o } of odontologos) {
    const existente = await prisma.odontologo.findFirst({ where: { nombre: o.nombre }, include: { horarios: true } });
    odontologosDb.push(
      existente ??
        (await prisma.odontologo.create({ data: { ...o, horarios: { create: horarios } }, include: { horarios: true } })),
    );
  }

  const pacientesDb = [];
  for (const { haceDias, fechaNacimiento, ...p } of pacientes) {
    pacientesDb.push(
      await prisma.paciente.upsert({
        where: { ci: p.ci },
        update: {},
        create: {
          ...p,
          fechaNacimiento: fechaNacimiento ? fechaCalendario(fechaNacimiento) : null,
          createdAt: instanteLocal(sumarDias(hoy, -haceDias), "10:00"),
        },
      }),
    );
  }

  if ((await prisma.cita.count()) > 0) {
    console.log("Ya existen citas: se omite la generación de la agenda de ejemplo.");
    return;
  }

  const porNombre = (n: string) => tratamientosDb.find((t) => t.nombre === n)!;
  const tratamientosPorEspecialidad: Record<string, string[]> = {
    "Odontología general": ["Consulta y diagnóstico", "Limpieza dental (profilaxis)", "Obturación con resina", "Extracción simple", "Radiografía periapical"],
    Endodoncia: ["Endodoncia unirradicular", "Consulta y diagnóstico", "Radiografía periapical"],
    Ortodoncia: ["Control de ortodoncia", "Consulta y diagnóstico"],
  };

  let n = 0;
  let creadas = 0;
  for (let offset = -10; offset <= 10; offset++) {
    const fecha = sumarDias(hoy, offset);
    const dia = diaSemanaDeFecha(fecha);
    for (const o of odontologosDb.filter((x) => x.activo)) {
      const bloques = o.horarios.filter((h) => h.diaSemana === dia).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
      for (const bloque of bloques) {
        let cursor = horaAMinutos(bloque.horaInicio) + (n % 2) * 30;
        for (let k = 0; k < 2; k++) {
          const opciones = tratamientosPorEspecialidad[o.especialidad] ?? ["Consulta y diagnóstico"];
          const tratamiento = porNombre(opciones[n % opciones.length]);
          if (cursor + tratamiento.duracionMinutos > horaAMinutos(bloque.horaFin)) break;

          const inicio = instanteLocal(fecha, minutosAHora(cursor));
          const fin = calcularFin(inicio, tratamiento.duracionMinutos);
          const paciente = pacientesDb[n % pacientesDb.length];

          let estado: EstadoCita;
          if (n % 7 === 3) estado = "CANCELADA";
          else if (fin <= ahora) estado = "ATENDIDA";
          else estado = n % 2 === 0 ? "CONFIRMADA" : "PENDIENTE";

          await prisma.cita.create({
            data: {
              pacienteId: paciente.id,
              odontologoId: o.id,
              tratamientoId: tratamiento.id,
              inicio,
              fin,
              estado,
              motivo: k === 0 ? "Control programado" : "Molestia al masticar",
              motivoCancelacion: estado === "CANCELADA" ? "El paciente avisó que no podrá asistir" : null,
              ...(estado === "ATENDIDA" && { atencion: { create: diagnosticos[n % diagnosticos.length] } }),
            },
          });
          creadas++;
          n++;
          cursor += tratamiento.duracionMinutos + 30;
        }
      }
    }
  }

  console.log(
    `Seed listo: ${tratamientosDb.length} tratamientos, ${odontologosDb.length} odontólogos, ${pacientesDb.length} pacientes, ${creadas} citas.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
