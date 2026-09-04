/* ─────────────────────────────────────────────────────────────
   Plantillas de documentos
   Cada documento es una lista de preguntas y un cuerpo fijo con
   variables. Lo fijo no se toca; lo variable se pregunta. De las
   respuestas salen los plazos que después vigila gerencia.

   Hoy sólo hay dos documentos: la reserva (con el texto real de
   la oficina) y su adenda. No hay más cargados.
   ───────────────────────────────────────────────────────────── */

import { desdeIso, type Jurisdiccion, type Operacion, type Uso } from "./datos";
import { enLetras, mesLargo } from "./letras";

export type TipoCampo =
  | "texto"
  | "numero"
  | "moneda"
  | "dias"
  | "porcentaje"
  | "opcion"
  | "parrafo"
  | "fecha";

/** Campo que fija desde cuándo corren los plazos. Vive en todas las plantillas
    que tienen vencimientos, y no siempre coincide con el día de la carga. */
export const CAMPO_VIGENCIA = "vigenciaDesde";

export interface Campo {
  id: string;
  pregunta: string;
  ayuda?: string;
  tipo: TipoCampo;
  opciones?: string[];
  requerido?: boolean;
  /** Sólo aparece si otro campo tiene alguno de estos valores. */
  visibleSi?: { campo: string; valores: string[] };
  sugerido?: string;
}

export interface Seccion {
  id: string;
  titulo: string;
  campos: Campo[];
}

export interface DefPlazo {
  id: string;
  rotulo: string;
  /** Campo de días desde el que se calcula el vencimiento. */
  campoDias: string;
  visibleSi?: { campo: string; valores: string[] };
}

export interface Clausula {
  titulo?: string;
  texto: string;
  /** El título va en su propio renglón, como los apartados de los papeles reales. */
  bloque?: boolean;
  visibleSi?: { campo: string; valores: string[] };
}

export interface Plantilla {
  id: string;
  nombre: string;
  /** Encabezado impreso, cuando no alcanza con el nombre interno. */
  titulo?: string;
  /** Pies de firma del documento. Por defecto, oferente y martillera. */
  firmas?: string[];
  jurisdiccion: Jurisdiccion;
  operacion: Operacion;
  uso: Uso;
  resumen: string;
  /** Cómo se nombra a la otra parte en los listados de gerencia. */
  campoContraparte: string;
  /** Las adendas se cuelgan de una reserva ya registrada. */
  esAdenda?: boolean;
  secciones: Seccion[];
  plazos: DefPlazo[];
  cuerpo: Clausula[];
}

/* ── Bloques reutilizados entre plantillas ──────────────────── */

const observaciones: Seccion = {
  id: "cierre",
  titulo: "Observaciones",
  campos: [
    {
      id: "observaciones",
      pregunta: "¿Querés dejar alguna observación en el documento?",
      ayuda: "Texto libre. Se imprime al pie, después de las cláusulas. Si no hay nada que aclarar, dejalo vacío.",
      tipo: "parrafo",
    },
  ],
};

/** Los días de cada plazo se cuentan desde acá, no desde el día de la carga. */
const campoVigencia: Campo = {
  id: CAMPO_VIGENCIA,
  pregunta: "¿Desde qué día corre la vigencia?",
  ayuda: "Suele ser hoy. Si el documento se firmó otro día, poné esa fecha: todos los plazos se cuentan desde ahí.",
  tipo: "fecha",
  requerido: true,
};

/* ── 1. Oferta - Reserva de compra comercial — CABA ─────────────
   Transcripción del papel real de la oficina («OFERTA - RESERVA
   DE COMPRA COMERCIAL»). El texto fijo va tal cual; los puntos
   suspensivos del Word son las variables. La comisión (5% + IVA)
   y los cinco días hábiles del refuerzo están fijos en el papel,
   no se preguntan. */

const reservaCaba: Plantilla = {
  id: "reserva-caba",
  nombre: "Reserva de compra comercial — CABA",
  titulo: "OFERTA - RESERVA DE COMPRA COMERCIAL",
  jurisdiccion: "CABA",
  operacion: "Venta",
  uso: "Comercial",
  resumen: "El documento real de la oficina para tomar una reserva de compra sobre un inmueble comercial de Capital.",
  campoContraparte: "oferente",
  firmas: ["FIRMA DEL OFERENTE\nACLARACIÓN · DNI", "BLANCO-VÁZQUEZ SRL\nMaría Eugenia Blanco · CUCICBA 7834"],
  secciones: [
    {
      id: "inmueble",
      titulo: "Sobre el inmueble",
      campos: [
        {
          id: "direccion",
          pregunta: "Dirección del inmueble",
          ayuda: "Calle y altura. Si ya generaste algo sobre esta propiedad, te la sugiere mientras escribís.",
          tipo: "texto",
          requerido: true,
        },
        { id: "unidad", pregunta: "Local, piso o unidad", tipo: "texto" },
        { id: "localidad", pregunta: "Barrio o localidad", tipo: "texto", requerido: true },
      ],
    },
    {
      id: "vendedor",
      titulo: "Quién vende",
      campos: [
        {
          id: "propietario",
          pregunta: "Nombre y apellido del propietario",
          ayuda: "No se imprime en esta reserva, pero hace falta si más adelante se genera una adenda.",
          tipo: "texto",
          requerido: true,
        },
        { id: "dniPropietario", pregunta: "DNI o CUIT del propietario", tipo: "texto", requerido: true },
        {
          id: "emailPropietario",
          pregunta: "Domicilio electrónico del propietario",
          ayuda: "El correo donde el propietario acepta recibir comunicaciones, para cuando haga falta.",
          tipo: "texto",
          requerido: true,
        },
      ],
    },
    {
      id: "oferente",
      titulo: "Quién ofrece",
      campos: [
        { id: "oferente", pregunta: "Nombre y apellido del oferente", tipo: "texto", requerido: true },
        { id: "dniOferente", pregunta: "DNI del oferente", tipo: "texto", requerido: true },
        { id: "estadoCivilOferente", pregunta: "Estado civil del oferente", tipo: "texto", requerido: true },
        {
          id: "domicilioOferente",
          pregunta: "Domicilio del oferente",
          ayuda: "Calle, número y localidad.",
          tipo: "texto",
          requerido: true,
        },
        {
          id: "emailOferente",
          pregunta: "Correo electrónico",
          ayuda: "Es el domicilio especial donde se le van a mandar las notificaciones.",
          tipo: "texto",
          requerido: true,
        },
      ],
    },
    {
      id: "dinero",
      titulo: "La plata",
      campos: [
        {
          id: "montoReserva",
          pregunta: "¿Cuánto deja en concepto de reserva?",
          ayuda: "En dólares. Es lo que queda en custodia de Blanco-Vázquez SRL en este acto.",
          tipo: "moneda",
          requerido: true,
        },
        { id: "precioOfertado", pregunta: "¿Por qué monto total ofrece la propiedad?", tipo: "moneda", requerido: true },
        {
          id: "montoRefuerzo",
          pregunta: "¿Cuánto va a integrar como refuerzo de seña?",
          ayuda: "Se paga dentro de los cinco días hábiles de notificada la conformación del vendedor.",
          tipo: "moneda",
          requerido: true,
        },
      ],
    },
    {
      id: "modalidad",
      titulo: "Cómo se paga",
      campos: [
        {
          id: "formaPagoDetalle",
          pregunta: "¿Cómo se abona el precio total ofertado?",
          ayuda: "Se imprime tal cual en el documento: contado, en cuotas, con crédito, etc.",
          tipo: "parrafo",
          requerido: true,
        },
      ],
    },
    {
      id: "plazos",
      titulo: "Los plazos",
      campos: [
        campoVigencia,
        {
          id: "diasConformar",
          pregunta: "¿Dentro de cuántos días hábiles tiene el vendedor para aceptar la reserva?",
          ayuda: "Si no la acepta en ese plazo, la reserva se devuelve al oferente dentro de las 72 horas hábiles siguientes.",
          tipo: "dias",
          requerido: true,
          sugerido: "5",
        },
        {
          id: "diasEscritura",
          pregunta: "¿Cuál es el plazo para la escritura traslativa de dominio?",
          ayuda: "Días corridos, contados desde que el vendedor conforma la reserva.",
          tipo: "dias",
          requerido: true,
          sugerido: "60",
        },
      ],
    },
    observaciones,
  ],
  plazos: [
    { id: "conformar", rotulo: "Aceptación del vendedor (vigencia de la reserva)", campoDias: "diasConformar" },
    { id: "escritura", rotulo: "Escritura traslativa de dominio", campoDias: "diasEscritura" },
  ],
  cuerpo: [
    {
      texto:
        "Recibimos del Sr/a {{oferente}}, DNI {{dniOferente}}, estado civil {{estadoCivilOferente}}, con domicilio en {{domicilioOferente}}, constituyendo dirección especial de correo electrónico a los efectos de la presente en {{emailOferente}}, donde se tendrán por eficaces y válidas todas las notificaciones cursadas, en adelante EL OFERENTE, la cantidad de Dólares Estadounidenses U$S {{montoReserva}} en concepto de Reserva de Precio y Condiciones de Pago, quedando dicho monto en custodia de Blanco-Vázquez SRL, María Eugenia Blanco CUCICBA 7834 / Andrea Vázquez CUCICBA 7860, por la compra del inmueble ubicado en la calle {{direccion}} de la {{localidad}}, en las condiciones vistas en que se encuentra, que el OFERENTE declara conocer y aceptar.",
    },
    {
      texto:
        "El Precio Ofertado asciende a la suma de Dólares Estadounidenses Billetes {{precioOfertadoLetras}} (U$D {{precioOfertado}}) pagaderos en esa moneda.",
    },
    {
      texto: "Forma de Pago y Plazos: el precio total ofertado será abonado de la siguiente manera: {{formaPagoDetalle}}.",
    },
    {
      texto:
        "El plazo para la Escritura Traslativa de Dominio será dentro de los {{diasEscritura}} ({{diasEscrituraLetras}}) días corridos a partir de la conformidad de la presente.",
    },
    {
      texto:
        "Queda establecido que la presente venta se realizará en Dólares Billetes Estadounidenses que EL OFERENTE declara poseer, no aceptándose ningún otro medio o forma de pago conforme lo previsto en los arts. 765 y 766 del Código Civil y Comercial de la Nación, conforme DNU 70/2023. EL OFERENTE declara bajo juramento que a la fecha de la firma del presente posee los billetes dólares estadounidenses necesarios y la libre disponibilidad de los mismos, o el medio para conseguirlos, y en consecuencia hace expresa renuncia a la posibilidad de invocar imprevisión y/o caso fortuito o fuerza mayor establecidas en los arts. 1091 y 1730 del Código Civil y Comercial de la Nación.",
    },
    {
      texto:
        "Vigencia de la Reserva: esta Oferta / Reserva de Compra se toma AD-REFERENDUM de la aprobación del VENDEDOR dentro de los {{diasConformar}} ({{diasConformarLetras}}) días hábiles contados a partir de la presente; de lo contrario se le restituirá al OFERENTE, dentro del plazo de 72 horas hábiles del vencimiento de la misma, el importe que en este acto se entrega, sin intereses, cargo o incremento alguno.",
    },
    {
      texto:
        "Aceptada por EL VENDEDOR, la presente reserva quedará firme y EL OFERENTE deberá abonar a María Eugenia Blanco CUCICBA 7834 / Andrea Vázquez CMCPSI 6257, en representación de Blanco-Vázquez SRL (sociedad legalmente constituida e inscripta en IGJ bajo el N° 1956793), al momento de firmar el boleto o la escritura traslativa de dominio y posesión, lo primero que ocurra, el valor que corresponda al cinco por ciento (5%) más IVA (21%) sobre el precio de venta total, en concepto de honorarios. EL OFERENTE declara que el pago de los honorarios lo realizará en Dólares Estadounidenses Billetes. De los importes recibidos en concepto de reserva y refuerzo se descontará la suma equivalente a los honorarios convenidos con ambas partes, y se llevará únicamente el saldo no compensado al lugar de la firma del boleto de compraventa o escritura, lo que ocurra primero.",
    },
    {
      texto:
        "Una vez conformada la presente reserva por EL VENDEDOR y verificado que no surgen impedimentos de los informes de dominio e inhibición expedidos por el Registro de la Propiedad correspondiente, la presente quedará firme y de cumplimiento obligatorio, debiendo EL OFERENTE, dentro de los cinco (5) días hábiles de notificada dicha conformación, realizar un refuerzo de reserva por un importe de Dólares Estadounidenses Billetes {{montoRefuerzoLetras}} (U$S {{montoRefuerzo}}), quedando dicho monto en custodia de Blanco-Vázquez SRL, consolidando así la operación en curso. Es obligación del VENDEDOR entregar inmediatamente la documentación completa al escribano designado, dentro de los cinco (5) días hábiles. El VENDEDOR fijará el lugar donde se llevará a cabo la Escritura Traslativa de Dominio.",
    },
    {
      texto:
        "El plazo establecido tendrá carácter firme y resolutorio, con caducidad. Si EL OFERENTE no se presentare a la firma en la fecha fijada, faculta a que se lo tenga por arrepentido, con pérdida de los importes entregados en concepto de reserva y refuerzo, sin necesidad de notificación alguna; en ese caso el presente recibo quedará sin valor legal y EL OFERENTE no tendrá derecho a reclamar suma alguna, entregándose lo percibido al VENDEDOR. Si en cambio el VENDEDOR, habiendo conformado la presente, no se presentase a la firma en el plazo establecido, quedará obligado a reintegrar al OFERENTE, dentro de los tres días posteriores a la fecha prevista para firmar, las sumas recibidas incluyendo el refuerzo, más otro monto igual en concepto de única y total indemnización.",
    },
    {
      texto:
        "Los gastos de escrituración serán soportados por ambas partes según usos y costumbres. En caso de que la presente operación estuviere gravada por impuesto de sellos, el importe será abonado en partes iguales por EL OFERENTE y EL VENDEDOR.",
    },
    {
      texto:
        "En caso de mediar incumplimiento de alguna de las partes una vez conformada la reserva, la parte incumplidora estará obligada a abonar a Blanco-Vázquez SRL, María Eugenia Blanco CUCICBA 7834 / Andrea Vázquez CMCPSI 6257, el importe correspondiente a los honorarios pactados de ambas partes, en concepto de indemnización por los honorarios que por su culpa se han dejado de percibir, sin necesidad de formalidad judicial alguna.",
    },
    {
      texto:
        "La Escritura Traslativa de Dominio y Posesión se otorgará en base a títulos perfectos, libre de gravámenes, restricciones e interdicciones y con todos los impuestos, tasas y contribuciones que afecten al inmueble pagos hasta la entrega de la posesión, que se efectivizará simultáneamente con el otorgamiento de la escritura, totalmente libre de ocupantes y sin oposición de terceros.",
    },
    {
      texto:
        "En caso de utilización de la firma electrónica con identificación biométrica provista por la herramienta “Contractia”, las partes aceptan sus términos y condiciones renunciando a desconocer su firma electrónica en el futuro.",
    },
  ],
};

/* ── 2. Adenda de reserva ───────────────────────────────────── */

/**
 * Transcripción del documento real de la oficina
 * («ADENDA PRORROGA RESERVA DE COMPRA CABA»). El texto fijo va tal cual;
 * lo que en el Word son puntos suspensivos son las variables.
 *
 * Ojo con la cuenta: el papel dice que la prórroga corre «a partir de la firma
 * del presente convenio», no desde el vencimiento original. Por eso la fecha de
 * firma es una pregunta y el nuevo vencimiento sale de ahí.
 */
const adenda: Plantilla = {
  id: "adenda",
  nombre: "Adenda — Prórroga de reserva de compra CABA",
  titulo: "ADENDA A LA RESERVA DE COMPRA CABA",
  jurisdiccion: "CABA",
  operacion: "Venta",
  uso: "Comercial",
  resumen: "Prorroga una reserva ya registrada. Los datos de las partes y del inmueble los trae de ella.",
  campoContraparte: "oferente",
  esAdenda: true,
  firmas: [
    "FIRMA PROPIETARIO\nACLARACIÓN",
    "FIRMA OFERENTE RESERVANTE\nACLARACIÓN",
    "FIRMA MARTILLERA Y CORREDORA PÚBLICA\nMaría Eugenia Blanco · CUCICBA 7834",
  ],
  secciones: [
    {
      id: "vinculo",
      titulo: "Sobre qué reserva",
      campos: [
        {
          id: "registroPadre",
          pregunta: "¿A qué reserva corresponde esta adenda?",
          ayuda: "Viene de la reserva desde la que entraste. De ella salen las partes, el inmueble y los montos.",
          tipo: "opcion",
          opciones: [],
          requerido: true,
        },
        {
          id: "plazoAfectado",
          pregunta: "¿Qué plazo se prorroga?",
          tipo: "opcion",
          opciones: [],
          requerido: true,
        },
      ],
    },
    {
      id: "prorroga",
      titulo: "La prórroga",
      campos: [
        {
          id: CAMPO_VIGENCIA,
          pregunta: "¿Qué día se firma esta adenda?",
          ayuda: "La prórroga se cuenta desde la firma, así que de esta fecha sale el nuevo vencimiento.",
          tipo: "fecha",
          requerido: true,
        },
        {
          id: "diasProrroga",
          pregunta: "¿Por cuántos días corridos se prorroga?",
          tipo: "dias",
          requerido: true,
          sugerido: "30",
        },
      ],
    },
    observaciones,
  ],
  plazos: [],
  cuerpo: [
    {
      texto:
        "En Buenos Aires, a los {{vigenciaDesdeDia}} días del mes de {{vigenciaDesdeMes}} de {{vigenciaDesdeAnio}}.",
    },
    {
      titulo: "REUNIDOS",
      bloque: true,
      texto:
        "El Sr/a {{propietario}} DNI N° {{dniPropietario}} constituyendo domicilio electrónico {{emailPropietario}}, en adelante el PROPIETARIO y por la otra parte Sr/a {{oferente}} DNI {{dniOferente}} constituyendo domicilio electrónico {{emailOferente}}, en adelante el OFERENTE-RESERVANTE y la Martillera y Corredora Pública María Eugenia Blanco CUCICBA 7834.",
    },
    {
      titulo: "EXPONEN",
      bloque: true,
      texto:
        "Que el día {{fechaReserva}} PROPIETARIO y OFERENTE celebraron de común acuerdo una Oferta/Reserva sobre la propiedad de la calle {{direccion}} {{unidad}} localidad {{localidad}} CABA por un plazo de {{diasPlazoOriginal}} días con un importe de Dólares Estadounidenses Billetes {{montoReservaLetras}} (U$S {{montoReserva}}) con vencimiento el día {{vencimientoOriginal}} cuyo valor de venta se fijó de común acuerdo por el precio total y definitivo de Dólares Estadounidenses Billetes {{precioOfertadoLetras}} (U$S {{precioOfertado}}).",
    },
    {
      titulo: "ACUERDAN",
      bloque: true,
      texto:
        "Encontrándose conformada la Reserva de Compra las partes convienen en celebrar en este acto una Prórroga de la Reserva por un plazo de {{diasProrrogaLetras}} ({{diasProrroga}}) días corridos contados a partir de la firma del presente convenio cuyo vencimiento opera indefectiblemente el día {{nuevoVencimiento}}.",
    },
    {
      texto:
        "Las partes firmantes ratifican aceptar de común acuerdo esta ADENDA prestando total conformidad manteniendo al propio tiempo plenamente vigentes las cláusulas términos y condiciones de la OFERTA RESERVA mencionada que no se reiteran en este documento.",
    },
    {
      texto:
        "En caso de utilización de la firma electrónica con identificación biométrica provista por la herramienta “Contractia” las partes aceptan sus términos y condiciones renunciando a desconocer su firma electrónica en el futuro.",
    },
    {
      texto: "En prueba de ello se firma dos ejemplares de un mismo tenor y a un solo efecto.",
    },
  ],
};

export const plantillas: Plantilla[] = [reservaCaba, adenda];

export const plantillaPorId = (id: string) => plantillas.find((p) => p.id === id);

/* ── Utilidades de resolución ───────────────────────────────── */

export function campoVisible(c: { visibleSi?: { campo: string; valores: string[] } }, v: Record<string, string>) {
  if (!c.visibleSi) return true;
  return c.visibleSi.valores.includes(v[c.visibleSi.campo] ?? "");
}

/** Todos los campos de la plantilla que hoy corresponde mostrar. */
export function camposVivos(p: Plantilla, v: Record<string, string>): Campo[] {
  return p.secciones.flatMap((s) => s.campos.filter((c) => campoVisible(c, v)));
}

export function faltantes(p: Plantilla, v: Record<string, string>): Campo[] {
  return camposVivos(p, v).filter((c) => c.requerido && !(v[c.id] ?? "").trim());
}

const fmtMonto = (s: string) => {
  const n = Number(s);
  return Number.isFinite(n) && s.trim() !== "" ? n.toLocaleString("es-AR") : s;
};

const CAMPOS_MONTO = new Set(["montoReserva", "precioOfertado", "montoRefuerzo", "nuevoPrecio"]);

/** Los campos de tipo fecha de todas las plantillas, para saber cómo imprimirlos. */
let camposFecha: Set<string> | null = null;
function esFecha(id: string) {
  camposFecha ??= new Set(
    plantillas.flatMap((p) => p.secciones.flatMap((s) => s.campos.filter((c) => c.tipo === "fecha").map((c) => c.id))),
  );
  return camposFecha.has(id);
}

export function fechaLarga(ts: number) {
  return new Date(ts).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
}

export function fechaCorta(ts: number) {
  return new Date(ts).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Un aaaa-mm-dd escrito en el documento como corresponde. */
export function fechaDesdeIso(iso: string) {
  const ts = desdeIso(iso);
  return Number.isFinite(ts) ? fechaLarga(ts) : "";
}

/**
 * Cómo se resuelve cada `{{clave}}`:
 *   hoy                → la fecha de emisión, en letra larga
 *   <campo>Letras      → el número del campo, escrito con palabras
 *   <fecha>Dia/Mes/Anio→ una parte suelta de una fecha
 *   campo de fecha     → dd/mm/aaaa
 *   campo de monto     → con separador de miles
 */
function valorDe(clave: string, v: Record<string, string>, ahora: number): string {
  if (clave === "hoy") return fechaLarga(ahora);

  if (clave.endsWith("Letras")) {
    const bruto = v[clave.slice(0, -6)] ?? "";
    return bruto.trim() ? enLetras(bruto) : "";
  }

  for (const [sufijo, parte] of [
    ["Dia", "dia"],
    ["Mes", "mes"],
    ["Anio", "anio"],
  ] as const) {
    if (clave.endsWith(sufijo)) {
      const base = clave.slice(0, -sufijo.length);
      if (!esFecha(base)) continue;
      const ts = desdeIso(v[base] ?? "");
      if (!Number.isFinite(ts)) return "";
      const d = new Date(ts);
      return parte === "dia" ? String(d.getDate()) : parte === "mes" ? mesLargo(ts) : String(d.getFullYear());
    }
  }

  const bruto = v[clave] ?? "";
  if (esFecha(clave)) return bruto ? fechaCorta(desdeIso(bruto)) : "";
  return CAMPOS_MONTO.has(clave) ? fmtMonto(bruto) : bruto;
}

/** Parte el texto en trozos, marcando cuáles vinieron de una respuesta. */
export function resolver(
  texto: string,
  v: Record<string, string>,
  ahora: number,
): { t: string; variable: boolean }[] {
  const out: { t: string; variable: boolean }[] = [];
  const re = /\{\{(\w+)\}\}/g;
  let ult = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto))) {
    if (m.index > ult) out.push({ t: texto.slice(ult, m.index), variable: false });
    out.push({ t: valorDe(m[1], v, ahora) || "………………", variable: true });
    ult = m.index + m[0].length;
  }
  if (ult < texto.length) out.push({ t: texto.slice(ult), variable: false });
  return out;
}

export function textoPlano(texto: string, v: Record<string, string>, ahora: number) {
  return resolver(texto, v, ahora)
    .map((x) => x.t)
    .join("");
}

/** dd/mm con cero adelante: en los listados las fechas tienen que alinearse. */
export function fechaDia(ts: number) {
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}
