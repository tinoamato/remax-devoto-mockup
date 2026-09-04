/* Datos de demostración. Los plazos se anclan al momento de carga
   para que las cuentas regresivas corran de verdad. */

export const T0 = Date.now();
const h = (n: number) => T0 + n * 3_600_000;

export type Urgencia = "vencida" | "hoy" | "semana" | "ok";
export type TipoOp = "Venta" | "Alquiler";
export type EstadoProp = "Disponible" | "Reservada" | "En escritura" | "Alquilada" | "Vendida";
export type EstadoDoc = "completo" | "pendiente" | "faltante";

export interface Parte {
  rol: string;
  nombre: string;
  telefono: string;
  email: string;
}

export interface Doc {
  id: string;
  nombre: string;
  estado: EstadoDoc;
  responsable: string;
  critico: boolean;
}

export interface Evento {
  id: string;
  ts: number;
  texto: string;
  autor: string;
  tipo: "sistema" | "persona" | "hito" | "riesgo";
}

export interface Operacion {
  id: string;
  propiedadId: string;
  propiedad: string;
  barrio: string;
  tipo: TipoOp;
  precio: number;
  etapa: number;
  asesorId: string;
  vence: number;
  comision: number;
  superficie: number;
  ambientes: number;
  partes: Parte[];
  docs: Doc[];
  actividad: Evento[];
  escalada: boolean;
  motivoEscalada?: string;
  abierta: number;
}

export interface Propiedad {
  id: string;
  direccion: string;
  barrio: string;
  tipo: TipoOp;
  precio: number;
  precioInicial: number;
  ambientes: number;
  superficie: number;
  estado: EstadoProp;
  asesorId: string;
  publicada: boolean;
  portales: string[];
  antiguedad: number;
  expensas?: number;
  garage: boolean;
  descripcion: string;
  operacionId?: string;
  visitas: number;
  consultas: number;
  diasEnCartera: number;
}

export interface Tarea {
  id: string;
  operacionId?: string;
  propiedadId?: string;
  asesorId: string;
  descripcion: string;
  vence: number;
  hecha: boolean;
  accion: string;
  tipo: "documento" | "contacto" | "visita" | "gestion" | "cierre";
}

export interface Asesor {
  id: string;
  nombre: string;
  iniciales: string;
  rol: string;
  activas: number;
  cerradas: number;
  tasaConversion: number;
  tiempoPromedioDias: number;
  comisionMes: number;
  minRespuestaProm: number;
  captacionesMes: number;
  /** Cada cuántos días como máximo el gerente debe contactar a este asesor. */
  topeDias: number;
  /** Momento del último contacto registrado. */
  ultimoContacto: number;
  /**
   * Comisión facturada mes a mes en los últimos 12 meses.
   * El índice 0 es el mes en curso y el 11 el de hace once meses.
   * De acá sale la producción móvil y su proyección.
   */
  facturacionMensual: number[];
}

type Base = Omit<Asesor, "facturacionMensual">;

/** Forma de la curva de facturación de los últimos 12 meses. */
export type FormaFacturacion = "constante" | "declive" | "reciente";

/** Umbrales de la oficina sobre la producción móvil de 12 meses. */
export interface Umbrales {
  verde: number;
  amarillo: number;
}

export const umbralesIniciales: Umbrales = { verde: 45_000, amarillo: 18_000 };

export type CanalContacto = "1 a 1" | "llamada" | "WhatsApp" | "correo" | "reunión";

export interface Contacto {
  id: string;
  asesorId: string;
  ts: number;
  canal: CanalContacto;
  nota: string;
}

/** Automatizaciones de contacto: avisos por correo directo a cada asesor. */
export interface ReglaCadencia {
  /** Días de anticipación del aviso previo. */
  margenAviso: number;
  hora: string;
  avisoPrevioActivo: boolean;
  avisoVencidoActivo: boolean;
  ultimoEnvioPrevio: number | null;
  ultimoEnvioVencido: number | null;
}

export const reglaInicial: ReglaCadencia = {
  margenAviso: 3,
  hora: "08:00",
  avisoPrevioActivo: true,
  avisoVencidoActivo: true,
  ultimoEnvioPrevio: null,
  ultimoEnvioVencido: null,
};

export interface Lead {
  id: string;
  nombre: string;
  telefono: string;
  origen: "ZonaProp" | "Argenprop" | "Mercado Libre" | "Web RE/MAX" | "Cartel" | "Referido" | "WhatsApp";
  propiedadId: string;
  consulta: string;
  ingreso: number;
  asesorId: string | null;
  estado: "sin asignar" | "asignado" | "contactado" | "visita agendada" | "descartado";
  presupuesto?: number;
}

export interface Alerta {
  id: string;
  ts: number;
  severidad: "alta" | "media" | "baja";
  titulo: string;
  detalle: string;
  refOp?: string;
  refAsesor?: string;
  leida: boolean;
  resuelta: boolean;
}

export const ETAPAS = [
  "Captación", "Tasación", "Publicación", "Visitas", "Reserva",
  "Verif. documental", "Boleto de CV", "Due diligence", "Financiación",
  "Pre-escritura", "Escritura", "Entrega llaves", "Liquidación",
];

/* Bloques del pipeline — la agrupación que mira gerencia */
export const BLOQUES: { label: string; etapas: number[]; color: string }[] = [
  { label: "Captación", etapas: [0, 1], color: "var(--tinta-tenue)" },
  { label: "Mercado", etapas: [2, 3], color: "var(--sello-borde)" },
  { label: "Reserva", etapas: [4, 5], color: "var(--sello)" },
  { label: "Boleto", etapas: [6, 7], color: "var(--ambar-borde)" },
  { label: "Financiación", etapas: [8, 9], color: "var(--ambar)" },
  { label: "Escritura", etapas: [10, 11], color: "var(--verde-borde)" },
  { label: "Liquidación", etapas: [12], color: "var(--verde)" },
];

export const PORTALES = ["ZonaProp", "Argenprop", "Mercado Libre", "Web RE/MAX"];

const doc = (id: string, nombre: string, estado: EstadoDoc, responsable: string, critico = false): Doc =>
  ({ id, nombre, estado, responsable, critico });

/** Días atrás, en milisegundos absolutos. */
const dias = (n: number) => h(-n * 24);

const asesoresBase: Base[] = [
  { id: "a1", nombre: "Martín Gutiérrez", iniciales: "MG", rol: "Asesor Senior", activas: 8, cerradas: 14, tasaConversion: 71, tiempoPromedioDias: 42, comisionMes: 24800, minRespuestaProm: 12, captacionesMes: 3, topeDias: 45, ultimoContacto: dias(6) },
  { id: "a2", nombre: "Sofía Pereyra", iniciales: "SP", rol: "Asesora Senior", activas: 6, cerradas: 18, tasaConversion: 75, tiempoPromedioDias: 38, comisionMes: 31200, minRespuestaProm: 8, captacionesMes: 4, topeDias: 45, ultimoContacto: dias(12) },
  { id: "a3", nombre: "Lucas Fernández", iniciales: "LF", rol: "Asesor", activas: 12, cerradas: 5, tasaConversion: 43, tiempoPromedioDias: 68, comisionMes: 11000, minRespuestaProm: 210, captacionesMes: 1, topeDias: 7, ultimoContacto: dias(11) },
  { id: "a4", nombre: "Valentina Sosa", iniciales: "VS", rol: "Asesora", activas: 5, cerradas: 11, tasaConversion: 69, tiempoPromedioDias: 45, comisionMes: 18400, minRespuestaProm: 19, captacionesMes: 2, topeDias: 15, ultimoContacto: dias(4) },
  { id: "a5", nombre: "Diego Romero", iniciales: "DR", rol: "Asesor", activas: 9, cerradas: 7, tasaConversion: 44, tiempoPromedioDias: 61, comisionMes: 9600, minRespuestaProm: 96, captacionesMes: 1, topeDias: 30, ultimoContacto: dias(28) },
  { id: "a6", nombre: "Natalia Crespo", iniciales: "NC", rol: "Asesora", activas: 3, cerradas: 9, tasaConversion: 75, tiempoPromedioDias: 40, comisionMes: 15200, minRespuestaProm: 14, captacionesMes: 2, topeDias: 15, ultimoContacto: dias(12) },
  { id: "a7", nombre: "Sebastián Molina", iniciales: "SM", rol: "Asesor Junior", activas: 7, cerradas: 3, tasaConversion: 30, tiempoPromedioDias: 90, comisionMes: 4800, minRespuestaProm: 320, captacionesMes: 0, topeDias: 7, ultimoContacto: dias(19) },
  { id: "a8", nombre: "Carolina Ríos", iniciales: "CR", rol: "Asesora Senior", activas: 6, cerradas: 13, tasaConversion: 68, tiempoPromedioDias: 44, comisionMes: 22000, minRespuestaProm: 11, captacionesMes: 3, topeDias: 45, ultimoContacto: dias(20) },
  { id: "a9", nombre: "Facundo Leiva", iniciales: "FL", rol: "Asesor", activas: 4, cerradas: 6, tasaConversion: 60, tiempoPromedioDias: 52, comisionMes: 12800, minRespuestaProm: 46, captacionesMes: 1, topeDias: 15, ultimoContacto: dias(13) },
  { id: "a10", nombre: "Andrea Suárez", iniciales: "AS", rol: "Asesora", activas: 10, cerradas: 8, tasaConversion: 44, tiempoPromedioDias: 58, comisionMes: 13600, minRespuestaProm: 62, captacionesMes: 2, topeDias: 30, ultimoContacto: dias(31) },
  { id: "a11", nombre: "Pablo Herrera", iniciales: "PH", rol: "Asesor Junior", activas: 2, cerradas: 4, tasaConversion: 40, tiempoPromedioDias: 75, comisionMes: 6200, minRespuestaProm: 155, captacionesMes: 0, topeDias: 7, ultimoContacto: dias(6) },
  { id: "a12", nombre: "Florencia Acosta", iniciales: "FA", rol: "Asesora Senior", activas: 7, cerradas: 16, tasaConversion: 70, tiempoPromedioDias: 41, comisionMes: 27600, minRespuestaProm: 9, captacionesMes: 4, topeDias: 45, ultimoContacto: dias(2) },
];

const nombresPila = ["Juan", "María", "Carlos", "Ana", "Luis", "Patricia", "Roberto", "Laura", "Miguel", "Sandra", "Fernando", "Claudia", "Gustavo", "Verónica", "Hernán", "Silvina", "Marcelo", "Gabriela"];
const apellidos = ["González", "Rodríguez", "López", "Martínez", "Pérez", "Sánchez", "Díaz", "Morales", "Torres", "Vega", "Ramos", "Reyes", "Cruz", "Flores", "Jiménez", "Cabrera", "Ibáñez", "Ortiz"];

const N = nombresPila.length;
for (let i = 13; i <= 80; i++) {
  const k = i - 13;
  // Producto cartesiano: garantiza que no se repita ningún nombre completo.
  const nombre = `${nombresPila[k % N]} ${apellidos[(Math.floor(k / N) * 5 + k) % N]}`;
  const tasa = 34 + ((i * 13) % 46);
  // El tiempo de respuesta correlaciona con la conversión: quien contesta antes, cierra más.
  const resp = Math.max(5, Math.min(320, Math.round(240 - tasa * 2.6) + ((i * 11) % 50) - 25));
  const junior = i % 5 === 0;
  const senior = i % 7 === 0;
  // El tope de contacto lo fija la antigüedad: al que recién arranca se lo ve seguido.
  const tope = junior ? 7 : senior ? 45 : i % 3 === 0 ? 15 : 30;
  // Tres bandas, para que la oficina se vea sana pero con trabajo pendiente:
  // ~72% al día, ~17% por vencer, ~11% pasado de tope.
  const p = (i * 17) % 100;
  const proporcion = p < 72 ? 0.1 + p / 103 : p < 89 ? 0.9 + (p - 72) / 170 : 1.03 + (p - 89) / 20;
  const desde = Math.round(tope * proporcion);
  const femenino = nombre.split(" ")[0].endsWith("a");
  asesoresBase.push({
    id: `a${i}`,
    nombre,
    iniciales: nombre.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(),
    rol: `${femenino ? "Asesora" : "Asesor"}${junior ? " Junior" : senior ? " Senior" : ""}`,
    activas: (i % 9) + 1,
    cerradas: i % 13,
    tasaConversion: tasa,
    tiempoPromedioDias: 30 + (i % 60),
    comisionMes: 3800 + (i % 20) * 1450,
    minRespuestaProm: resp,
    captacionesMes: i % 4,
    topeDias: tope,
    ultimoContacto: dias(desde),
  });
}

/* ── Facturación de los últimos 12 meses ───────────────────────
   Cada asesor tiene una forma de curva. La que importa para la
   demo es "declive": factura bien en el acumulado por ventas
   viejas que están por salirse de la ventana móvil.             */

const FORMA_FIJA: Record<string, FormaFacturacion> = {
  a1: "constante",
  a2: "constante",
  a3: "declive",
  a4: "reciente",
  a5: "declive",
  a6: "constante",
  a7: "declive",
  a8: "declive",
  a9: "reciente",
  a10: "constante",
  a11: "reciente",
  a12: "reciente",
};

const RUEDA: FormaFacturacion[] = [
  "constante", "constante", "constante", "constante",
  "declive", "declive", "declive",
  "reciente", "reciente", "reciente",
];

/** Reparte 1 entre los 12 meses según la forma elegida. */
function pesosMensuales(forma: FormaFacturacion, semilla: number): number[] {
  const crudo = Array.from({ length: 12 }, (_, i) =>
    forma === "declive"
      ? 1 + i * 0.22 // el peso crece hacia atrás: lo bueno ya pasó
      : forma === "reciente"
        ? 1 + (11 - i) * 0.22 // el peso se concentra en los meses recientes
        : 1 + ((semilla + i) % 5) / 12,
  );
  const total = crudo.reduce((s, x) => s + x, 0);
  return crudo.map((x) => x / total);
}

export const asesores: Asesor[] = asesoresBase.map((a, idx) => {
  const forma = FORMA_FIJA[a.id] ?? RUEDA[(idx * 7) % RUEDA.length];
  // La facturación anual sale de la conversión y la antigüedad, no del mes suelto:
  // un senior que convierte al 75% ronda los USD 100.000 al año en comisiones.
  const porRol = a.rol.includes("Senior") ? 1.5 : a.rol.includes("Junior") ? 0.55 : 1;
  const jitter = 0.85 + ((idx * 23) % 30) / 100;
  const anual = (9000 + Math.max(0, a.tasaConversion - 28) * 1200) * porRol * jitter;
  const mensual = pesosMensuales(forma, idx).map((w) => Math.round((anual * w) / 100) * 100);
  // El mes en curso sale de la misma curva: quien viene en declive tiene un mes flojo.
  return { ...a, comisionMes: mensual[0], facturacionMensual: mensual };
});

/* ── Historial de contactos ────────────────────────────────────
   Se reconstruye hacia atrás desde el último contacto de cada
   asesor, con una cadencia parecida a su tope.                  */

const CANALES: CanalContacto[] = ["1 a 1", "llamada", "WhatsApp", "correo", "reunión"];
const NOTAS = [
  "Repaso de la cartera y próximos cierres",
  "Objetivos del mes y pipeline",
  "Consulta por una operación trabada",
  "Seguimiento de captaciones",
  "Devolución sobre una visita",
  "Revisión de precios de su cartera",
  "Charla de seguimiento general",
  "Planificación de la semana",
  "Revisión de prioridades de la semana",
  "Acompañamiento en una negociación",
];

export const contactos: Contacto[] = [];
asesores.forEach((a, idx) => {
  let ts = a.ultimoContacto;
  const cuantos = 3 + (idx % 3);
  for (let j = 0; j < cuantos; j++) {
    contactos.push({
      id: `c-${a.id}-${j}`,
      asesorId: a.id,
      ts,
      canal: CANALES[(idx + j * 3) % CANALES.length],
      nota: NOTAS[(idx * 3 + j * 7) % NOTAS.length],
    });
    ts -= (a.topeDias * (0.7 + ((idx + j) % 5) / 10)) * 86_400_000;
  }
});

export const propiedades: Propiedad[] = [
  { id: "PROP-001", direccion: "Av. Francisco Beiró 3456, 4°B", barrio: "Villa Devoto", tipo: "Venta", precio: 185000, precioInicial: 199000, ambientes: 3, superficie: 72, estado: "En escritura", asesorId: "a1", publicada: true, portales: ["ZonaProp", "Argenprop", "Web RE/MAX"], antiguedad: 15, expensas: 85000, garage: false, descripcion: "Tres ambientes luminosos, cocina separada, balcón corrido con vista al parque. Edificio con amenities.", operacionId: "OP-2847", visitas: 14, consultas: 38, diasEnCartera: 96 },
  { id: "PROP-002", direccion: "Rojas 2891, PB", barrio: "Villa del Parque", tipo: "Alquiler", precio: 850, precioInicial: 900, ambientes: 2, superficie: 58, estado: "Reservada", asesorId: "a2", publicada: true, portales: ["ZonaProp", "Mercado Libre"], antiguedad: 8, expensas: 55000, garage: false, descripcion: "Dos ambientes en planta baja, patio propio de 20 m², cocina actualizada. Excelente iluminación.", operacionId: "OP-2831", visitas: 9, consultas: 51, diasEnCartera: 34 },
  { id: "PROP-003", direccion: "Sanabria 1205, 2°A", barrio: "Floresta", tipo: "Venta", precio: 220000, precioInicial: 240000, ambientes: 4, superficie: 90, estado: "Reservada", asesorId: "a3", publicada: true, portales: ["ZonaProp", "Argenprop"], antiguedad: 20, expensas: 110000, garage: true, descripcion: "Cuatro ambientes amplios con garage doble. Ideal familias. Barrio tranquilo cerca de Av. Gaona.", operacionId: "OP-2839", visitas: 21, consultas: 44, diasEnCartera: 128 },
  { id: "PROP-004", direccion: "Yerbal 4123, 1°C", barrio: "Villa Devoto", tipo: "Venta", precio: 310000, precioInicial: 310000, ambientes: 4, superficie: 115, estado: "Disponible", asesorId: "a1", publicada: true, portales: ["ZonaProp", "Argenprop", "Mercado Libre", "Web RE/MAX"], antiguedad: 5, expensas: 142000, garage: true, descripcion: "Unidad de categoría en edificio nuevo. Cuatro ambientes con suite, vestidor y terraza propia de 18 m².", operacionId: "OP-2844", visitas: 3, consultas: 12, diasEnCartera: 11 },
  { id: "PROP-005", direccion: "Cuzco 2567, 3°B", barrio: "Caballito", tipo: "Alquiler", precio: 1200, precioInicial: 1200, ambientes: 3, superficie: 65, estado: "Disponible", asesorId: "a4", publicada: true, portales: ["ZonaProp"], antiguedad: 12, expensas: 78000, garage: false, descripcion: "Tres ambientes con muy buena luminosidad, baño completo y toilette. A metros del Parque Rivadavia.", operacionId: "OP-2835", visitas: 6, consultas: 29, diasEnCartera: 22 },
  { id: "PROP-006", direccion: "Joaquín V. González 1890, PH", barrio: "Villa del Parque", tipo: "Venta", precio: 420000, precioInicial: 450000, ambientes: 5, superficie: 140, estado: "En escritura", asesorId: "a2", publicada: false, portales: [], antiguedad: 18, expensas: 195000, garage: true, descripcion: "Penthouse de cinco ambientes con terraza de 60 m², parrilla y jacuzzi. Vista panorámica.", operacionId: "OP-2850", visitas: 18, consultas: 33, diasEnCartera: 152 },
  { id: "PROP-007", direccion: "Neuquén 3344, 5°A", barrio: "Villa Devoto", tipo: "Venta", precio: 145000, precioInicial: 165000, ambientes: 2, superficie: 52, estado: "Disponible", asesorId: "a5", publicada: true, portales: ["ZonaProp", "Argenprop"], antiguedad: 30, expensas: 62000, garage: false, descripcion: "Dos ambientes reformados con separación living-dormitorio. Edificio con portero 24 hs.", visitas: 2, consultas: 8, diasEnCartera: 187 },
  { id: "PROP-008", direccion: "Gualeguaychú 2012, PB", barrio: "Floresta", tipo: "Alquiler", precio: 680, precioInicial: 680, ambientes: 3, superficie: 70, estado: "Alquilada", asesorId: "a6", publicada: false, portales: [], antiguedad: 22, expensas: 68000, garage: true, descripcion: "Planta baja con jardín de 35 m². Tres ambientes, cocina-comedor integrados. Garage simple.", visitas: 11, consultas: 40, diasEnCartera: 19 },
  { id: "PROP-009", direccion: "Av. Rivadavia 9821, 8°D", barrio: "Floresta", tipo: "Venta", precio: 98000, precioInicial: 118000, ambientes: 1, superficie: 38, estado: "Disponible", asesorId: "a3", publicada: true, portales: ["ZonaProp"], antiguedad: 40, expensas: 45000, garage: false, descripcion: "Monoambiente en planta alta con vista a la avenida. Edificio con ascensor, muy bien mantenido.", visitas: 1, consultas: 5, diasEnCartera: 241 },
  { id: "PROP-010", direccion: "Chivilcoy 3781, 2°B", barrio: "Villa Devoto", tipo: "Venta", precio: 265000, precioInicial: 265000, ambientes: 3, superficie: 85, estado: "Vendida", asesorId: "a1", publicada: false, portales: [], antiguedad: 10, expensas: 98000, garage: true, descripcion: "Tres ambientes con garage, escritura reciente. Excelentes terminaciones.", visitas: 16, consultas: 47, diasEnCartera: 63 },
  { id: "PROP-011", direccion: "Pedernera 1456, 3°C", barrio: "Villa del Parque", tipo: "Alquiler", precio: 950, precioInicial: 950, ambientes: 4, superficie: 95, estado: "Disponible", asesorId: "a8", publicada: true, portales: ["ZonaProp", "Argenprop", "Mercado Libre"], antiguedad: 7, expensas: 115000, garage: false, descripcion: "Cuatro ambientes amplios, cocina equipada, dos baños completos. Apto profesional.", visitas: 7, consultas: 26, diasEnCartera: 28 },
  { id: "PROP-012", direccion: "Boyacá 3102, 1°A", barrio: "Caballito", tipo: "Venta", precio: 195000, precioInicial: 210000, ambientes: 3, superficie: 78, estado: "Disponible", asesorId: "a4", publicada: true, portales: ["ZonaProp", "Web RE/MAX"], antiguedad: 16, expensas: 88000, garage: false, descripcion: "Tres ambientes bien distribuidos, balcón y dependencia de servicio. Sobre calle tranquila.", visitas: 5, consultas: 17, diasEnCartera: 71 },
  { id: "PROP-013", direccion: "Nogoyá 4590, 6°F", barrio: "Villa Devoto", tipo: "Venta", precio: 172000, precioInicial: 172000, ambientes: 3, superficie: 68, estado: "Reservada", asesorId: "a7", publicada: true, portales: ["ZonaProp", "Argenprop"], antiguedad: 25, expensas: 74000, garage: false, descripcion: "Tres ambientes al frente con balcón, sobre avenida arbolada. Cochera opcional en el edificio.", operacionId: "OP-2858", visitas: 4, consultas: 21, diasEnCartera: 45 },
  { id: "PROP-014", direccion: "Mercedes 3120, casa", barrio: "Villa Devoto", tipo: "Venta", precio: 540000, precioInicial: 540000, ambientes: 6, superficie: 210, estado: "Disponible", asesorId: "a12", publicada: true, portales: ["ZonaProp", "Argenprop", "Web RE/MAX"], antiguedad: 35, expensas: 0, garage: true, descripcion: "Casa en lote propio de 8,66 × 30. Seis ambientes en dos plantas, jardín con parrilla y pileta.", operacionId: "OP-2856", visitas: 12, consultas: 58, diasEnCartera: 39 },
];

export const operaciones: Operacion[] = [
  {
    id: "OP-2847", propiedadId: "PROP-001", propiedad: "Av. Francisco Beiró 3456, 4°B", barrio: "Villa Devoto",
    tipo: "Venta", precio: 185000, etapa: 10, asesorId: "a1", vence: h(3), comision: 7400,
    superficie: 72, ambientes: 3, escalada: false, abierta: h(-96 * 24),
    partes: [
      { rol: "Vendedor", nombre: "Roberto Almada", telefono: "11-4523-8891", email: "r.almada@gmail.com" },
      { rol: "Compradora", nombre: "Camila Torres", telefono: "11-6712-3340", email: "camila.torres@outlook.com" },
      { rol: "Escribano", nombre: "Dr. Pablo Méndez", telefono: "11-4921-0034", email: "escribania.mendez@fca.com.ar" },
      { rol: "Inmob. contraparte", nombre: "Adrián Casas RE", telefono: "11-3310-2200", email: "info@adriancasas.com" },
    ],
    docs: [
      doc("d1", "DNI vendedor", "completo", "Vendedor"),
      doc("d2", "DNI compradora", "completo", "Compradora"),
      doc("d3", "Escritura antecedente", "completo", "Vendedor", true),
      doc("d4", "Certificado de inhibición · vendedor", "completo", "Escribanía", true),
      doc("d5", "Certificado de inhibición · compradora", "pendiente", "Escribanía", true),
      doc("d6", "Libre deuda ABL", "faltante", "Asesor", true),
      doc("d7", "Libre deuda de expensas", "faltante", "Administración", true),
      doc("d8", "Plano de mensura", "completo", "Vendedor"),
    ],
    actividad: [
      { id: "e1", ts: h(-2), texto: "Escribanía confirmó turno de escritura para el jueves 11:00", autor: "Martín Gutiérrez", tipo: "hito" },
      { id: "e2", ts: h(-19), texto: "La compradora transfirió los fondos a la cuenta de la escribanía", autor: "Sistema", tipo: "sistema" },
      { id: "e3", ts: h(-52), texto: "Libre deuda ABL solicitado al GCBA — sin respuesta hace 2 días", autor: "Martín Gutiérrez", tipo: "riesgo" },
    ],
  },
  {
    id: "OP-2831", propiedadId: "PROP-002", propiedad: "Rojas 2891, PB", barrio: "Villa del Parque",
    tipo: "Alquiler", precio: 850, etapa: 5, asesorId: "a2", vence: h(-48), comision: 850,
    superficie: 58, ambientes: 2, escalada: true, motivoEscalada: "Garantía sin resolver hace 5 días", abierta: h(-34 * 24),
    partes: [
      { rol: "Propietario", nombre: "Néstor Villalba", telefono: "11-4788-1122", email: "n.villalba@hotmail.com" },
      { rol: "Inquilina", nombre: "Luciana Páez", telefono: "11-5534-9981", email: "lu.paez@gmail.com" },
      { rol: "Garante", nombre: "Jorge Páez", telefono: "11-4923-5510", email: "j.paez@yahoo.com" },
    ],
    docs: [
      doc("d1", "DNI inquilina", "completo", "Inquilina"),
      doc("d2", "DNI garante", "completo", "Garante"),
      doc("d3", "Recibos de sueldo inquilina (3)", "faltante", "Inquilina", true),
      doc("d4", "Recibos de sueldo garante (3)", "faltante", "Garante", true),
      doc("d5", "Título de propiedad del garante", "pendiente", "Garante", true),
      doc("d6", "Constancia de CUIT del propietario", "completo", "Propietario"),
      doc("d7", "Póliza de caución (alternativa)", "faltante", "Inquilina"),
    ],
    actividad: [
      { id: "e1", ts: h(-6), texto: "Tercer recordatorio automático enviado a la inquilina por WhatsApp", autor: "Sistema", tipo: "sistema" },
      { id: "e2", ts: h(-30), texto: "Documentación parcial recibida — falta el 60% del legajo", autor: "Sofía Pereyra", tipo: "persona" },
      { id: "e3", ts: h(-48), texto: "Plazo de reserva vencido. El propietario ya consultó por el estado.", autor: "Sistema", tipo: "riesgo" },
    ],
  },
  {
    id: "OP-2839", propiedadId: "PROP-003", propiedad: "Sanabria 1205, 2°A", barrio: "Floresta",
    tipo: "Venta", precio: 220000, etapa: 4, asesorId: "a3", vence: h(70), comision: 8800,
    superficie: 90, ambientes: 4, escalada: false, abierta: h(-128 * 24),
    partes: [
      { rol: "Vendedora", nombre: "Patricia Giménez", telefono: "11-4602-7733", email: "p.gimenez@gmail.com" },
      { rol: "Comprador", nombre: "Rodrigo Delgado", telefono: "11-6120-4455", email: "r.delgado@empresa.com" },
      { rol: "Escribana", nombre: "Dra. Inés Solano", telefono: "11-4831-6600", email: "solano@escribanos.ar" },
    ],
    docs: [
      doc("d1", "Comprobante de seña", "completo", "Comprador", true),
      doc("d2", "Contrato de reserva firmado", "completo", "Ambas partes", true),
      doc("d3", "DNI vendedora", "completo", "Vendedora"),
      doc("d4", "DNI comprador", "pendiente", "Comprador"),
      doc("d5", "Cédula catastral", "faltante", "Asesor", true),
      doc("d6", "Reglamento de copropiedad", "faltante", "Administración"),
    ],
    actividad: [
      { id: "e1", ts: h(-26), texto: "Seña de USD 10.000 recibida y depositada", autor: "Lucas Fernández", tipo: "hito" },
      { id: "e2", ts: h(-74), texto: "Oferta aceptada por la vendedora", autor: "Lucas Fernández", tipo: "hito" },
    ],
  },
  {
    id: "OP-2844", propiedadId: "PROP-004", propiedad: "Yerbal 4123, 1°C", barrio: "Villa Devoto",
    tipo: "Venta", precio: 310000, etapa: 1, asesorId: "a1", vence: h(160), comision: 12400,
    superficie: 115, ambientes: 4, escalada: false, abierta: h(-11 * 24),
    partes: [{ rol: "Propietario", nombre: "Alejandro Ruiz", telefono: "11-4799-3312", email: "a.ruiz@gmail.com" }],
    docs: [
      doc("d1", "Autorización de venta firmada", "completo", "Propietario", true),
      doc("d2", "DNI propietario", "completo", "Propietario"),
      doc("d3", "Escritura de dominio", "pendiente", "Propietario", true),
      doc("d4", "Fotos profesionales", "faltante", "Asesor"),
    ],
    actividad: [
      { id: "e1", ts: h(-4), texto: "Tasación cerrada en USD 310.000 sobre 6 comparables de la zona", autor: "Martín Gutiérrez", tipo: "hito" },
    ],
  },
  {
    id: "OP-2835", propiedadId: "PROP-005", propiedad: "Cuzco 2567, 3°B", barrio: "Caballito",
    tipo: "Alquiler", precio: 1200, etapa: 2, asesorId: "a4", vence: h(92), comision: 1200,
    superficie: 65, ambientes: 3, escalada: false, abierta: h(-22 * 24),
    partes: [{ rol: "Propietaria", nombre: "Marcela Bravo", telefono: "11-5522-0011", email: "m.bravo@gmail.com" }],
    docs: [
      doc("d1", "Autorización de alquiler", "completo", "Propietaria", true),
      doc("d2", "Planos vigentes", "faltante", "Propietaria"),
      doc("d3", "Último recibo de expensas", "faltante", "Propietaria"),
    ],
    actividad: [
      { id: "e1", ts: h(-27), texto: "Publicación activa en ZonaProp", autor: "Sistema", tipo: "sistema" },
    ],
  },
  {
    id: "OP-2850", propiedadId: "PROP-006", propiedad: "Joaquín V. González 1890, PH", barrio: "Villa del Parque",
    tipo: "Venta", precio: 420000, etapa: 8, asesorId: "a2", vence: h(16), comision: 16800,
    superficie: 140, ambientes: 5, escalada: false, abierta: h(-152 * 24),
    partes: [
      { rol: "Vendedor", nombre: "Hugo Ferreyra", telefono: "11-4501-2234", email: "h.ferreyra@gmail.com" },
      { rol: "Compradora", nombre: "Julieta Ovando", telefono: "11-6644-9012", email: "j.ovando@gmail.com" },
      { rol: "Banco", nombre: "Banco Hipotecario", telefono: "0800-999-1234", email: "hipotecas@bhi.com.ar" },
    ],
    docs: [
      doc("d1", "Tasación del banco aprobada", "completo", "Banco", true),
      doc("d2", "Certificado de deuda hipotecaria", "pendiente", "Banco", true),
      doc("d3", "Aprobación crediticia definitiva", "faltante", "Banco", true),
      doc("d4", "Seguro de vida del tomador", "faltante", "Compradora"),
    ],
    actividad: [
      { id: "e1", ts: h(-9), texto: "El banco pidió documentación adicional a la compradora", autor: "Sistema", tipo: "riesgo" },
      { id: "e2", ts: h(-33), texto: "El tasador del banco realizó la visita al inmueble", autor: "Sofía Pereyra", tipo: "hito" },
    ],
  },
  {
    id: "OP-2856", propiedadId: "PROP-014", propiedad: "Mercedes 3120, casa", barrio: "Villa Devoto",
    tipo: "Venta", precio: 540000, etapa: 3, asesorId: "a12", vence: h(44), comision: 21600,
    superficie: 210, ambientes: 6, escalada: false, abierta: h(-39 * 24),
    partes: [{ rol: "Propietaria", nombre: "Elsa Barrientos", telefono: "11-4761-8890", email: "elsa.barrientos@gmail.com" }],
    docs: [
      doc("d1", "Autorización exclusiva", "completo", "Propietaria", true),
      doc("d2", "Plano municipal", "pendiente", "Propietaria"),
      doc("d3", "Certificado de amoblamiento", "faltante", "Asesor"),
    ],
    actividad: [
      { id: "e1", ts: h(-12), texto: "Tercera visita de la semana — interés firme de dos familias", autor: "Florencia Acosta", tipo: "persona" },
    ],
  },
  {
    id: "OP-2858", propiedadId: "PROP-013", propiedad: "Nogoyá 4590, 6°F", barrio: "Villa Devoto",
    tipo: "Venta", precio: 172000, etapa: 6, asesorId: "a7", vence: h(-14), comision: 6880,
    superficie: 68, ambientes: 3, escalada: false, abierta: h(-45 * 24),
    partes: [
      { rol: "Vendedor", nombre: "Óscar Peralta", telefono: "11-4585-2201", email: "o.peralta@gmail.com" },
      { rol: "Compradora", nombre: "Mariana Klein", telefono: "11-6033-7781", email: "m.klein@gmail.com" },
    ],
    docs: [
      doc("d1", "Boleto redactado", "pendiente", "Asesor", true),
      doc("d2", "DNI compradora", "completo", "Compradora"),
      doc("d3", "Constancia de origen de fondos", "faltante", "Compradora", true),
    ],
    actividad: [
      { id: "e1", ts: h(-14), texto: "Fecha comprometida de firma de boleto vencida sin aviso al cliente", autor: "Sistema", tipo: "riesgo" },
    ],
  },
];

export const tareas: Tarea[] = [
  { id: "t1", operacionId: "OP-2847", asesorId: "a1", descripcion: "Retirar el libre deuda de ABL en la sede del GCBA", vence: h(3), hecha: false, accion: "Gestionar", tipo: "documento" },
  { id: "t2", operacionId: "OP-2831", asesorId: "a2", descripcion: "Llamar al garante por los recibos de sueldo", vence: h(-48), hecha: false, accion: "Llamar", tipo: "contacto" },
  { id: "t3", operacionId: "OP-2839", asesorId: "a3", descripcion: "Pedir la cédula catastral a la escribanía", vence: h(70), hecha: false, accion: "Solicitar", tipo: "documento" },
  { id: "t4", operacionId: "OP-2844", asesorId: "a1", descripcion: "Cargar la escritura de dominio al legajo", vence: h(118), hecha: false, accion: "Cargar", tipo: "documento" },
  { id: "t5", operacionId: "OP-2850", asesorId: "a2", descripcion: "Confirmar la aprobación crediticia con el Hipotecario", vence: h(16), hecha: false, accion: "Verificar", tipo: "gestion" },
  { id: "t6", operacionId: "OP-2847", asesorId: "a1", descripcion: "Coordinar la entrega de llaves posterior a la escritura", vence: h(52), hecha: false, accion: "Coordinar", tipo: "cierre" },
  { id: "t7", propiedadId: "PROP-004", asesorId: "a1", descripcion: "Sesión de fotos profesional en Yerbal 4123", vence: h(28), hecha: false, accion: "Agendar", tipo: "visita" },
  { id: "t8", operacionId: "OP-2858", asesorId: "a7", descripcion: "Redactar el boleto de compraventa de Nogoyá 4590", vence: h(-14), hecha: false, accion: "Redactar", tipo: "documento" },
  { id: "t9", propiedadId: "PROP-007", asesorId: "a5", descripcion: "Revisar precio: 187 días en cartera sin ofertas", vence: h(20), hecha: false, accion: "Revisar", tipo: "gestion" },
  { id: "t10", operacionId: "OP-2856", asesorId: "a12", descripcion: "Enviar el informe semanal a la propietaria", vence: h(6), hecha: false, accion: "Enviar", tipo: "contacto" },
];

export const leads: Lead[] = [
  { id: "L-401", nombre: "Gonzalo Ledesma", telefono: "11-6234-9087", origen: "ZonaProp", propiedadId: "PROP-014", consulta: "Quisiera coordinar una visita este fin de semana.", ingreso: h(-0.4), asesorId: null, estado: "sin asignar", presupuesto: 500000 },
  { id: "L-400", nombre: "Rocío Miranda", telefono: "11-5590-2213", origen: "Mercado Libre", propiedadId: "PROP-011", consulta: "¿Acepta garantía propietaria de provincia?", ingreso: h(-1.2), asesorId: null, estado: "sin asignar" },
  { id: "L-399", nombre: "Familia Sartori", telefono: "11-4477-1120", origen: "Cartel", propiedadId: "PROP-004", consulta: "Vimos el cartel en Yerbal, ¿sigue disponible?", ingreso: h(-2.8), asesorId: null, estado: "sin asignar", presupuesto: 300000 },
  { id: "L-398", nombre: "Damián Vera", telefono: "11-6712-0034", origen: "Argenprop", propiedadId: "PROP-013", consulta: "Consulta por expensas y si acepta permuta.", ingreso: h(-5.5), asesorId: "a3", estado: "asignado" },
  { id: "L-397", nombre: "Paula Anzoátegui", telefono: "11-3390-5566", origen: "Web RE/MAX", propiedadId: "PROP-012", consulta: "Interesada, tengo el 70% en efectivo.", ingreso: h(-9), asesorId: "a4", estado: "contactado", presupuesto: 200000 },
  { id: "L-396", nombre: "Estudio Marchetti", telefono: "11-4890-3311", origen: "Referido", propiedadId: "PROP-011", consulta: "Buscamos oficina apto profesional en la zona.", ingreso: h(-14), asesorId: "a8", estado: "visita agendada" },
  { id: "L-395", nombre: "Nicolás Prieto", telefono: "11-5511-8842", origen: "WhatsApp", propiedadId: "PROP-009", consulta: "¿Cuál es el precio final con gastos incluidos?", ingreso: h(-26), asesorId: "a3", estado: "asignado" },
  { id: "L-394", nombre: "Verónica Duarte", telefono: "11-6001-2299", origen: "ZonaProp", propiedadId: "PROP-005", consulta: "Necesito mudarme antes de fin de mes.", ingreso: h(-31), asesorId: "a4", estado: "contactado" },
];

export const alertas: Alerta[] = [
  { id: "AL-1", ts: h(-0.2), severidad: "alta", titulo: "3 consultas sin asignar hace más de 20 minutos", detalle: "Villa Devoto y Villa del Parque. El estándar de la oficina es 15 minutos.", leida: false, resuelta: false },
  { id: "AL-2", ts: h(-1), severidad: "alta", titulo: "OP-2858 pasó la fecha de boleto sin aviso al cliente", detalle: "Sebastián Molina no registra contacto con las partes desde hace 4 días.", refOp: "OP-2858", refAsesor: "a7", leida: false, resuelta: false },
  { id: "AL-3", ts: h(-3), severidad: "media", titulo: "Lucas Fernández: conversión del 43%, la más baja de la oficina", detalle: "12 operaciones activas y sólo 5 cerradas en el año.", refAsesor: "a3", leida: false, resuelta: false },
  { id: "AL-4", ts: h(-8), severidad: "alta", titulo: "OP-2831 vencida hace 2 días", detalle: "Garantía del alquiler sin resolver. El propietario ya consultó dos veces.", refOp: "OP-2831", refAsesor: "a2", leida: true, resuelta: false },
  { id: "AL-5", ts: h(-20), severidad: "media", titulo: "Neuquén 3344: 187 días en cartera", detalle: "2 visitas en 6 meses. Precio 18% arriba del comparable de la zona.", leida: true, resuelta: false },
  { id: "AL-6", ts: h(-30), severidad: "baja", titulo: "Joaquín V. González 1890 quedó sin publicar", detalle: "Operación en financiación pero la ficha se despublicó de todos los portales.", refOp: "OP-2850", leida: true, resuelta: true },
];

export const objetivoMes = 350000;

export const PLANTILLAS = [
  { id: "reserva", nombre: "Contrato de reserva", desc: "Reserva con seña imputada a cuenta de precio" },
  { id: "boleto", nombre: "Boleto de compraventa", desc: "Con plazo de escritura y condiciones suspensivas" },
  { id: "alquiler", nombre: "Contrato de locación", desc: "Ley 27.551 con ajuste por ICL" },
  { id: "mandato", nombre: "Autorización de venta", desc: "Mandato de comercialización con exclusividad" },
  { id: "cesion", nombre: "Cesión de boleto", desc: "Transferencia de posición contractual" },
];

export const CLAUSULAS: { id: string; texto: string; riesgo: "bajo" | "medio" | "alto" }[] = [
  { id: "c1", texto: "Cláusula penal por incumplimiento (10% del precio)", riesgo: "bajo" },
  { id: "c2", texto: "Multa diaria por mora en la escrituración", riesgo: "medio" },
  { id: "c3", texto: "Ajuste por índice ICL del BCRA", riesgo: "bajo" },
  { id: "c4", texto: "Prórroga automática por 3 meses", riesgo: "medio" },
  { id: "c5", texto: "Prohibición de subalquiler y cesión", riesgo: "bajo" },
  { id: "c6", texto: "Condición suspensiva por crédito hipotecario", riesgo: "alto" },
  { id: "c7", texto: "Garantía real adicional sobre inmueble del garante", riesgo: "alto" },
];
