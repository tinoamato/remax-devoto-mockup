/* ─────────────────────────────────────────────────────────────
   MVP — modelo de datos
   Tres piezas: documentos con plazos, facturación mensual y
   avisos por correo. Nada más. Todo dato es ficticio.
   ───────────────────────────────────────────────────────────── */

export const AHORA = Date.now();
const dia = 86_400_000;

/** Un plazo vence el día, no la hora: siempre al cierre de esa jornada. */
export function cierreDe(ts: number) {
  const d = new Date(ts);
  d.setHours(23, 59, 0, 0);
  return d.getTime();
}

export const enDias = (n: number) => cierreDe(AHORA + n * dia);

/** aaaa-mm-dd, que es lo que espera un input de tipo fecha. */
export function isoDia(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Lee un aaaa-mm-dd como día local, sin correrse por zona horaria. */
export function desdeIso(iso: string) {
  const [a, m, d] = iso.split("-").map(Number);
  if (!a || !m || !d) return NaN;
  return new Date(a, m - 1, d, 0, 0, 0, 0).getTime();
}

export type Jurisdiccion = "CABA" | "PBA";
export type Operacion = "Venta" | "Alquiler";
export type Uso = "Residencial" | "Comercial";

/* ── Asesores ───────────────────────────────────────────────── */

export interface Asesor {
  id: string;
  nombre: string;
  iniciales: string;
  email: string;
  /** Meses en la oficina. Por debajo de 18 no computa para RE/MAX. */
  antiguedadMeses: number;
  /** Comisión cobrada por mes, índice 0 = mes corriente, 11 = hace 11 meses. */
  facturacion: number[];
  /** Días máximos sin contacto de gerencia antes de que salte el aviso. */
  topeContactoDias: number;
  ultimoContacto: number;
  /** Falso cuando gerencia le dio de baja: deja de recibir correos y de sumar al equipo activo. */
  activo: boolean;
}

const ini = (n: string) =>
  n
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const correo = (n: string) =>
  `${n
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, ".")}@remaxdevoto.com.ar`;

/** Serie mensual verosímil: base con estacionalidad y meses en cero. */
function serie(base: number, semilla: number, sequia = 0): number[] {
  const out: number[] = [];
  for (let m = 0; m < 12; m++) {
    if (m < sequia) {
      out.push(0);
      continue;
    }
    const onda = 1 + 0.42 * Math.sin((m + semilla) * 1.1);
    const ruido = ((semilla * 37 + m * 91) % 23) / 100;
    const v = base * onda * (0.8 + ruido);
    out.push(v < base * 0.35 ? 0 : Math.round(v / 100) * 100);
  }
  return out;
}

const crudos: [string, number, number, number, number, number][] = [
  // nombre, base mensual, semilla, antigüedad, meses secos recientes, tope contacto
  ["Martín Gutiérrez", 4200, 1, 74, 0, 45],
  ["Sofía Pereyra", 5100, 3, 96, 0, 45],
  ["Lucas Fernández", 1150, 5, 31, 3, 15],
  ["Valentina Sosa", 3100, 2, 52, 0, 30],
  ["Diego Romero", 900, 7, 27, 4, 15],
  ["Natalia Crespo", 2600, 4, 44, 0, 30],
  ["Sebastián Molina", 620, 9, 11, 2, 15],
  ["Carolina Ríos", 3800, 6, 88, 0, 45],
  ["Facundo Leiva", 1900, 8, 23, 1, 30],
  ["Andrea Suárez", 1400, 10, 39, 2, 30],
  ["Pablo Herrera", 700, 11, 8, 1, 15],
  ["Florencia Acosta", 4600, 0, 103, 0, 45],
  ["Eugenio Blanco", 2200, 12, 19, 0, 30],
  ["Juana Blanco", 1050, 13, 16, 3, 15],
  ["Marcelo Martín", 2900, 14, 61, 0, 45],
  ["Camila Cabrera", 1750, 15, 34, 1, 30],
];

export const asesores: Asesor[] = crudos.map(([nombre, base, semilla, ant, seq, tope], i) => ({
  id: `a${i + 1}`,
  nombre,
  iniciales: ini(nombre),
  email: correo(nombre),
  antiguedadMeses: ant,
  facturacion: serie(base, semilla, seq),
  topeContactoDias: tope,
  ultimoContacto: AHORA - Math.round(tope * (0.35 + ((i * 17) % 13) / 10)) * dia,
  activo: true,
}));

/* ── Historial de contacto con gerencia ─────────────────────── */

export interface ContactoRegistro {
  id: string;
  asesorId: string;
  ts: number;
  canal: string;
  nota: string;
}

export const CANALES_CONTACTO = ["Llamada", "Reunión", "WhatsApp", "Visita a la oficina", "Videollamada"];

/**
 * Camina hacia atrás desde el último contacto real, con intervalos que a
 * veces respetan el tope y a veces se lo saltean bastante, para que el
 * historial de 12 meses tenga ejemplos verosímiles de ambos casos.
 */
function historialDe(asesorId: string, tope: number, ultimo: number, semilla: number): ContactoRegistro[] {
  const out: ContactoRegistro[] = [{ id: `${asesorId}-c0`, asesorId, ts: ultimo, canal: CANALES_CONTACTO[semilla % CANALES_CONTACTO.length], nota: "" }];
  const limite = AHORA - 365 * dia;
  let ts = ultimo;
  let k = 1;
  while (true) {
    const factor = 0.4 + ((semilla * 13 + k * 29) % 17) / 10; // entre 0.4x y 2.0x el tope
    const gap = Math.max(2, Math.round(tope * factor));
    ts -= gap * dia;
    if (ts < limite) break;
    out.push({
      id: `${asesorId}-c${k}`,
      asesorId,
      ts,
      canal: CANALES_CONTACTO[(semilla + k * 7) % CANALES_CONTACTO.length],
      nota: "",
    });
    k++;
  }
  return out;
}

export const contactosIniciales: ContactoRegistro[] = asesores.flatMap((a, i) =>
  historialDe(a.id, a.topeContactoDias, a.ultimoContacto, i + 1),
);

/* ── Propiedades ────────────────────────────────────────────── */

/** Sólo se usa para armar los registros de demostración. */
interface Propiedad {
  id: string;
  direccion: string;
  unidad: string;
  barrio: string;
  jurisdiccion: Jurisdiccion;
  operacion: Operacion;
  uso: Uso;
  precio: number;
  propietario: string;
  asesorId: string;
}

/** Semilla nada más: no hay cartera de propiedades que gestionar.
    Los datos del inmueble se escriben al generar cada reserva. */
const inmueblesSemilla: Propiedad[] = [
  { id: "P-1041", direccion: "Av. Francisco Beiró 3456", unidad: "4° B", barrio: "Villa Devoto", jurisdiccion: "CABA", operacion: "Venta", uso: "Residencial", precio: 185000, propietario: "Elena Bustos", asesorId: "a1" },
  { id: "P-1042", direccion: "Yerbal 4123", unidad: "1° C", barrio: "Villa Devoto", jurisdiccion: "CABA", operacion: "Venta", uso: "Residencial", precio: 310000, propietario: "Roberto Salgado", asesorId: "a1" },
  { id: "P-1043", direccion: "Nogoyá 4590", unidad: "6° F", barrio: "Villa Devoto", jurisdiccion: "CABA", operacion: "Venta", uso: "Residencial", precio: 172000, propietario: "Marta Iriarte", asesorId: "a1" },
  { id: "P-1044", direccion: "Chivilcoy 3781", unidad: "2° B", barrio: "Villa Devoto", jurisdiccion: "CABA", operacion: "Venta", uso: "Residencial", precio: 265000, propietario: "Hugo Peralta", asesorId: "a1" },
  { id: "P-1045", direccion: "Mercedes 3120", unidad: "casa", barrio: "Villa Devoto", jurisdiccion: "CABA", operacion: "Venta", uso: "Residencial", precio: 540000, propietario: "Familia Ledesma", asesorId: "a1" },
  { id: "P-1046", direccion: "Av. Nazca 2210", unidad: "local", barrio: "Villa del Parque", jurisdiccion: "CABA", operacion: "Alquiler", uso: "Comercial", precio: 1450, propietario: "Inversiones Nazca SRL", asesorId: "a1" },
  { id: "P-1047", direccion: "Rojas 2891", unidad: "PB", barrio: "Villa del Parque", jurisdiccion: "CABA", operacion: "Alquiler", uso: "Residencial", precio: 850, propietario: "Silvia Roldán", asesorId: "a2" },
  { id: "P-1048", direccion: "Sanabria 1205", unidad: "2° A", barrio: "Floresta", jurisdiccion: "CABA", operacion: "Venta", uso: "Residencial", precio: 220000, propietario: "Jorge Etchart", asesorId: "a3" },
  { id: "P-1049", direccion: "Bmé. Mitre 1840", unidad: "casa", barrio: "Ramos Mejía", jurisdiccion: "PBA", operacion: "Venta", uso: "Residencial", precio: 198000, propietario: "Cristina Vega", asesorId: "a1" },
  { id: "P-1050", direccion: "Av. Rivadavia 14320", unidad: "3° D", barrio: "Ramos Mejía", jurisdiccion: "PBA", operacion: "Venta", uso: "Residencial", precio: 132000, propietario: "Néstor Aguirre", asesorId: "a4" },
  { id: "P-1051", direccion: "Cuzco 2567", unidad: "3° B", barrio: "Caballito", jurisdiccion: "CABA", operacion: "Alquiler", uso: "Residencial", precio: 1200, propietario: "Ana Lupori", asesorId: "a4" },
  { id: "P-1052", direccion: "Joaquín V. González 1890", unidad: "PH", barrio: "Villa del Parque", jurisdiccion: "CABA", operacion: "Venta", uso: "Residencial", precio: 420000, propietario: "Daniel Ferreyra", asesorId: "a2" },
  { id: "P-1053", direccion: "Pedernera 1456", unidad: "3° C", barrio: "Villa del Parque", jurisdiccion: "CABA", operacion: "Alquiler", uso: "Residencial", precio: 950, propietario: "Gabriel Ocampo", asesorId: "a8" },
  { id: "P-1054", direccion: "Boyacá 3102", unidad: "1° A", barrio: "Caballito", jurisdiccion: "CABA", operacion: "Venta", uso: "Residencial", precio: 195000, propietario: "Liliana Farías", asesorId: "a12" },
  { id: "P-1055", direccion: "Neuquén 3344", unidad: "5° A", barrio: "Villa Devoto", jurisdiccion: "CABA", operacion: "Venta", uso: "Residencial", precio: 145000, propietario: "Oscar Benítez", asesorId: "a15" },
];

/* ── Documentos registrados ─────────────────────────────────── */

/**
 * Identidad del inmueble. No hay catálogo de propiedades: dos reservas hablan
 * del mismo inmueble cuando coinciden dirección y unidad, más allá de cómo las
 * haya tipeado cada uno. Sobre esta clave se apoya la regla de una sola reserva
 * vigente por propiedad.
 */
export function claveInmueble(direccion: string, unidad: string) {
  const limpiar = (s: string) =>
    s
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  return `${limpiar(direccion)}|${limpiar(unidad)}`;
}

/** "eliminado" es una baja lógica: no se borra nada, sólo deja de contar. */
export type EstadoRegistro = "vigente" | "cerrado" | "caido" | "eliminado";

export interface Plazo {
  id: string;
  rotulo: string;
  vence: number;
  /** Fecha que puso el asesor al generar. No se pisa nunca. */
  original: number;
  cumplido: boolean;
  /** Quién movió la fecha, si es que alguien la movió. */
  movidoPor?: string;
}

export interface Adenda {
  id: string;
  registroId: string;
  ts: number;
  plazoId: string;
  diasExtension: number;
  /** Fecha desde la que se cuenta la prórroga. Se aplica recién al aprobarse. */
  desde: number;
  motivo: string;
  nuevoPrecio?: number;
  autor: string;
  /** Si la generó el asesor, queda pendiente hasta que gerencia le dé el alta. */
  aprobado: boolean;
}

export type TipoEvento = "generado" | "adenda" | "plazo" | "aviso" | "estado" | "nota";

export interface Evento {
  id: string;
  ts: number;
  tipo: TipoEvento;
  texto: string;
  autor: string;
}

export interface Registro {
  id: string;
  plantillaId: string;
  direccion: string;
  unidad: string;
  jurisdiccion: Jurisdiccion;
  asesorId: string;
  contraparte: string;
  /** Cuándo se armó el documento. */
  generadoEn: number;
  /** Desde cuándo corren los plazos. No siempre es el día en que se generó. */
  vigenciaDesde: number;
  valores: Record<string, string>;
  plazos: Plazo[];
  historial: Evento[];
  estado: EstadoRegistro;
  observaciones: string;
  /** Todavía no le dio el alta gerencia: no cuenta para métricas hasta ese click. */
  aprobado: boolean;
  /** El asesor pidió la baja; falta que gerencia la apruebe. */
  bajaPedida?: boolean;
}

/* ── Correos disparados por las automatizaciones ────────────── */

export type MotivoCorreo = "previo" | "vencido" | "resumen" | "contactoPrevio" | "contactoVencido";

export interface Correo {
  id: string;
  ts: number;
  motivo: MotivoCorreo;
  para: string[];
  copiaOculta: string[];
  asunto: string;
  cuerpo: string;
  registroId?: string;
}

export interface Regla {
  id: "previo" | "vencido" | "resumen" | "contacto";
  titulo: string;
  detalle: string;
  activa: boolean;
  diasAntes: number;
  aAsesor: boolean;
  aGerencia: boolean;
  gerenciaOculta: boolean;
}

export const reglasIniciales: Regla[] = [
  {
    id: "previo",
    titulo: "Aviso previo al vencimiento",
    detalle:
      "Sale una vez por cada plazo, tantos días antes de que venza. Sirve para preguntar si hay una adenda firmada que todavía no se cargó.",
    activa: true,
    diasAntes: 3,
    aAsesor: true,
    aGerencia: true,
    gerenciaOculta: true,
  },
  {
    id: "vencido",
    titulo: "Aviso de plazo vencido",
    detalle: "Sale el mismo día en que el plazo se cumplió sin cerrarse. Confirma que las partes quedaron liberadas.",
    activa: true,
    diasAntes: 0,
    aAsesor: true,
    aGerencia: true,
    gerenciaOculta: false,
  },
  {
    id: "resumen",
    titulo: "Resumen semanal a gerencia",
    detalle: "Los lunes a las 9:00, todo lo que vence en los próximos siete días y todo lo que ya está vencido.",
    activa: true,
    diasAntes: 7,
    aAsesor: false,
    aGerencia: true,
    gerenciaOculta: false,
  },
  {
    id: "contacto",
    titulo: "Último contacto con el agente",
    detalle:
      "Avisa cuando se está por cumplir el tope de días sin contacto con un agente, y cuando ya se cumplió. Este no le llega al agente.",
    activa: true,
    diasAntes: 3,
    aAsesor: false,
    aGerencia: true,
    gerenciaOculta: false,
  },
];

export const EMAIL_GERENCIA = "gerencia@remaxdevoto.com.ar";
export const EMAIL_RECEPCION = "recepcion@remaxdevoto.com.ar";

/* ── Umbrales de facturación ────────────────────────────────── */

export interface Umbrales {
  /** Comisión acumulada de 12 meses para quedar en verde. */
  alto: number;
  /** Por debajo de este número es Low Performance. */
  bajo: number;
  /** Meses de antigüedad antes de los cuales el asesor no computa. */
  graciaMeses: number;
}

export const umbralesIniciales: Umbrales = { alto: 30000, bajo: 14000, graciaMeses: 18 };

/* ── Semilla de registros ya cargados ───────────────────────── */

let seq = 140;
const nid = () => `RES-${String(++seq).padStart(4, "0")}`;

function ev(ts: number, tipo: TipoEvento, texto: string, autor: string): Evento {
  return { id: `e${Math.round(ts)}-${Math.random().toString(36).slice(2, 7)}`, ts, tipo, texto, autor };
}

interface Semilla {
  propiedadId: string;
  asesorId: string;
  contraparte: string;
  generadoHace: number;
  /** La vigencia puede haber arrancado otro día que el de la generación. */
  vigenciaHace?: number;
  conformarEn: number;
  escrituraEn: number;
  reserva: number;
  oferta: number;
  refuerzo: number;
  pago: string;
  obs?: string;
  estado?: EstadoRegistro;
  /** Recién generada por el asesor: todavía no le dio el alta gerencia. */
  pendiente?: boolean;
  /** El asesor ya pidió la baja; falta que gerencia la apruebe. */
  bajaPedida?: boolean;
}

const semillas: Semilla[] = [
  { propiedadId: "P-1041", asesorId: "a1", contraparte: "Camila Cabrera", generadoHace: 8, vigenciaHace: 10, conformarEn: -2, escrituraEn: 52, reserva: 5000, oferta: 178000, refuerzo: 12000, pago: "Contado", obs: "El oferente viaja el jueves. Firma su hermana con poder." },
  { propiedadId: "P-1043", asesorId: "a1", contraparte: "Pedro Nogués", generadoHace: 4, conformarEn: 1, escrituraEn: 58, reserva: 3000, oferta: 165000, refuerzo: 9000, pago: "Crédito hipotecario", obs: "Crédito Banco Nación en trámite. El banco tiene que informar antes del refuerzo." },
  { propiedadId: "P-1048", asesorId: "a3", contraparte: "Rodrigo Vera", generadoHace: 12, conformarEn: 0, escrituraEn: 48, reserva: 4000, oferta: 210000, refuerzo: 15000, pago: "Tracto abreviado", obs: "El comprador se bajó de la operación. Pedí dar de baja el expediente.", bajaPedida: true },
  { propiedadId: "P-1052", asesorId: "a2", contraparte: "Estudio Márquez SA", generadoHace: 21, conformarEn: -6, escrituraEn: 39, reserva: 9000, oferta: 405000, refuerzo: 30000, pago: "Contado", obs: "Sucesión en trámite en el juzgado. Puede estirarse." },
  { propiedadId: "P-1050", asesorId: "a4", contraparte: "Mariela Ponce", generadoHace: 3, conformarEn: 2, escrituraEn: 61, reserva: 2500, oferta: 126000, refuerzo: 8000, pago: "Crédito hipotecario", obs: "" },
  { propiedadId: "P-1054", asesorId: "a12", contraparte: "Gustavo Iriondo", generadoHace: 30, conformarEn: -14, escrituraEn: 26, reserva: 4500, oferta: 188000, refuerzo: 14000, pago: "Contado", obs: "Ya se hizo una adenda por 30 días. Se podría estar por caer otra vez." },
  { propiedadId: "P-1055", asesorId: "a1", contraparte: "Norma Salcedo", generadoHace: 1, conformarEn: 6, escrituraEn: 74, reserva: 2000, oferta: 139000, refuerzo: 7000, pago: "Contado", obs: "", pendiente: true },
  { propiedadId: "P-1042", asesorId: "a1", contraparte: "Leandro Quiroga", generadoHace: 45, conformarEn: -38, escrituraEn: 12, reserva: 8000, oferta: 298000, refuerzo: 25000, pago: "Contado", obs: "Operación vieja, ya conformada y con refuerzo pagado. Queda la escritura.", estado: "vigente" },
  { propiedadId: "P-1044", asesorId: "a1", contraparte: "Silvana Toledo", generadoHace: 60, conformarEn: -55, escrituraEn: -9, reserva: 6000, oferta: 255000, refuerzo: 18000, pago: "Tracto abreviado", obs: "Se venció el tope de escritura y nadie avisó nada.", estado: "vigente" },
];

function armarRegistro(s: Semilla): Registro {
  const p = inmueblesSemilla.find((x) => x.id === s.propiedadId)!;
  const gen = AHORA - s.generadoHace * dia;
  const desde = AHORA - (s.vigenciaHace ?? s.generadoHace) * dia;
  const id = nid();
  const plazo = (pid: string, rotulo: string, enD: number, cumplido: boolean): Plazo => ({
    id: pid,
    rotulo,
    vence: enDias(enD),
    original: enDias(enD),
    cumplido,
  });

  const conformado = s.conformarEn < 0 && s.generadoHace > 20;

  // Sólo hay dos plazos vigilados: la aceptación del vendedor y la escritura.
  // El refuerzo tiene monto pero no vencimiento propio (el papel lo fija en
  // cinco días hábiles de notificada la conformación, sin fecha cierta todavía).
  const plazos: Plazo[] = [
    plazo("conformar", "Aceptación del vendedor (vigencia de la reserva)", s.conformarEn, conformado),
    plazo("escritura", "Escritura traslativa de dominio", s.escrituraEn, false),
  ];

  const historial: Evento[] = [
    ev(gen, "generado", `Documento generado y registrado por el agente.`, "Agente"),
  ];
  if (!s.pendiente) {
    historial.push(ev(gen + 1800_000, "estado", "Gerencia validó el documento. Ya cuenta para las métricas.", "Gerencia"));
  }
  if (s.bajaPedida) {
    historial.push(
      ev(gen + 2 * dia, "nota", "El agente pidió dar de baja el expediente, pendiente de que gerencia lo apruebe.", "Agente"),
    );
  }
  if (s.generadoHace > 25) {
    historial.push(
      ev(gen + 3 * dia, "aviso", "Aviso previo enviado al agente, con copia oculta a gerencia.", "Automatización"),
      ev(gen + 6 * dia, "adenda", "Adenda por 30 días sobre la aceptación de la reserva.", "Gerencia"),
    );
  }

  return {
    id,
    // Hoy sólo hay una reserva real (CABA); las semillas de PBA la usan igual,
    // es sólo texto de demo.
    plantillaId: "reserva-caba",
    direccion: p.direccion,
    unidad: p.unidad,
    jurisdiccion: p.jurisdiccion,
    asesorId: s.asesorId,
    contraparte: s.contraparte,
    generadoEn: gen,
    vigenciaDesde: desde,
    estado: s.estado ?? "vigente",
    observaciones: s.obs ?? "",
    aprobado: !s.pendiente,
    bajaPedida: s.bajaPedida,
    plazos,
    historial,
    valores: {
      oferente: s.contraparte,
      dniOferente: String(20000000 + Math.round(Math.random() * 19000000)),
      estadoCivilOferente: "Soltero/a",
      domicilioOferente: "Av. Beiró 2200, CABA",
      emailOferente: correo(s.contraparte).replace("remaxdevoto.com.ar", "gmail.com"),
      propietario: p.propietario,
      dniPropietario: String(11000000 + Math.round(Math.random() * 20000000)),
      emailPropietario: correo(p.propietario).replace("remaxdevoto.com.ar", "gmail.com"),
      localidad: p.barrio,
      vigenciaDesde: isoDia(desde),
      direccion: p.direccion,
      unidad: p.unidad,
      montoReserva: String(s.reserva),
      precioOfertado: String(s.oferta),
      montoRefuerzo: String(s.refuerzo),
      formaPagoDetalle:
        s.pago.startsWith("Crédito")
          ? `${s.pago}, sujeto a la aprobación del banco.`
          : `${s.pago}, al momento de la escritura.`,
      diasConformar: String(Math.max(1, s.conformarEn + s.generadoHace)),
      diasEscritura: String(Math.max(1, s.escrituraEn + s.generadoHace)),
      observaciones: s.obs ?? "",
    },
  };
}

export const registrosIniciales: Registro[] = semillas.map(armarRegistro);

export const adendasIniciales: Adenda[] = [
  {
    id: "AD-0007",
    registroId: registrosIniciales[5].id,
    ts: AHORA - 24 * dia,
    plazoId: "conformar",
    diasExtension: 30,
    desde: AHORA - 24 * dia,
    motivo: "El comprador espera la resolución del crédito. Se extiende la conformación.",
    autor: "Gerencia",
    aprobado: true,
  },
];

/* ── Cola de correos ya enviados ────────────────────────────── */

export const correosIniciales: Correo[] = [
  {
    id: "c1",
    ts: AHORA - 2 * dia,
    motivo: "previo",
    para: [asesores[0].email],
    copiaOculta: [EMAIL_GERENCIA],
    asunto: `Vence en 3 días · ${registrosIniciales[0].id} · ${registrosIniciales[0].direccion}`,
    cuerpo:
      "Hola Martín, en 3 días vence el plazo de aceptación del vendedor de Av. Francisco Beiró 3456. Si ya se firmó una adenda, cargala en el sistema.",
    registroId: registrosIniciales[0].id,
  },
  {
    id: "c2",
    ts: AHORA - 6 * 3_600_000,
    motivo: "vencido",
    para: [asesores[1].email, EMAIL_GERENCIA],
    copiaOculta: [],
    asunto: `Plazo vencido · ${registrosIniciales[3].id} · ${registrosIniciales[3].direccion}`,
    cuerpo:
      "El plazo de escritura de Joaquín V. González 1890 venció ayer. Verificar si hay adenda firmada o si la operación quedó liberada.",
    registroId: registrosIniciales[3].id,
  },
];
