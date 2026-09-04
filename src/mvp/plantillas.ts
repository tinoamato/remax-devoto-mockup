/* ─────────────────────────────────────────────────────────────
   Plantillas de documentos
   Cada documento es una lista de preguntas y un cuerpo fijo con
   variables. Lo fijo no se toca; lo variable se pregunta. De las
   respuestas salen los plazos que después vigila gerencia.
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

const oferente: Seccion = {
  id: "oferente",
  titulo: "Quién ofrece",
  campos: [
    { id: "oferente", pregunta: "Nombre y apellido del oferente", tipo: "texto", requerido: true },
    { id: "dniOferente", pregunta: "DNI del oferente", tipo: "texto", requerido: true },
    {
      id: "domicilioOferente",
      pregunta: "Domicilio que constituye para esta operación",
      ayuda: "Es el domicilio al que se le van a mandar las comunicaciones fehacientes.",
      tipo: "texto",
      requerido: true,
    },
    { id: "telefonoOferente", pregunta: "Teléfono de contacto", tipo: "texto", requerido: true },
    { id: "emailOferente", pregunta: "Correo electrónico", tipo: "texto", requerido: true },
  ],
};

const inmueble = (conUso = true): Seccion => ({
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
    { id: "unidad", pregunta: "Unidad funcional, piso o departamento", tipo: "texto" },
    { id: "propietario", pregunta: "Nombre del propietario", tipo: "texto", requerido: true },
    ...(conUso
      ? [
          { id: "localidad", pregunta: "Barrio o localidad", tipo: "texto" as const, requerido: true },
          {
            id: "dniPropietario",
            pregunta: "DNI o CUIT del propietario",
            tipo: "texto" as const,
            requerido: true,
          },
          {
            id: "emailPropietario",
            pregunta: "Domicilio electrónico del propietario",
            ayuda: "El correo donde el propietario acepta recibir las comunicaciones.",
            tipo: "texto" as const,
            requerido: true,
          },
          {
            id: "estadoEntrega" as const,
            pregunta: "¿En qué estado se entrega?",
            tipo: "opcion" as const,
            opciones: ["Desocupado y libre de ocupantes", "Ocupado por el propietario, se desocupa a la firma", "Con contrato de alquiler vigente"],
            requerido: true,
            sugerido: "Desocupado y libre de ocupantes",
          },
        ]
      : []),
  ],
});

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

/* ── 1. Reserva de compra — Residencial CABA ────────────────── */

const reservaCaba: Plantilla = {
  id: "reserva-caba",
  nombre: "Reserva de compra — Residencial CABA",
  jurisdiccion: "CABA",
  operacion: "Venta",
  uso: "Residencial",
  resumen: "El documento con el que se toma una reserva sobre una propiedad de Capital. Es el que más se usa.",
  campoContraparte: "oferente",
  secciones: [
    inmueble(),
    oferente,
    {
      id: "dinero",
      titulo: "La plata",
      campos: [
        {
          id: "montoReserva",
          pregunta: "¿Cuánto deja en concepto de reserva?",
          ayuda: "En dólares. Es la seña que se toma en este acto.",
          tipo: "moneda",
          requerido: true,
        },
        { id: "precioOfertado", pregunta: "¿Por qué monto total ofrece la propiedad?", tipo: "moneda", requerido: true },
        {
          id: "montoRefuerzo",
          pregunta: "¿Cuánto va a integrar como refuerzo de seña?",
          ayuda: "Es el pago que hace después, una vez que salen los informes de dominio e inhibición.",
          tipo: "moneda",
          requerido: true,
        },
        {
          id: "comision",
          pregunta: "¿Qué comisión abona el oferente?",
          tipo: "porcentaje",
          requerido: true,
          sugerido: "4",
        },
      ],
    },
    {
      id: "modalidad",
      titulo: "Cómo se paga",
      campos: [
        {
          id: "formaPago",
          pregunta: "¿Cómo se cancela el saldo de precio?",
          tipo: "opcion",
          opciones: ["Contado", "Crédito hipotecario", "Tracto abreviado", "Crédito hipotecario y tracto abreviado"],
          requerido: true,
          sugerido: "Contado",
        },
        {
          id: "banco",
          pregunta: "¿Con qué banco tramita el crédito?",
          tipo: "texto",
          requerido: true,
          visibleSi: { campo: "formaPago", valores: ["Crédito hipotecario", "Crédito hipotecario y tracto abreviado"] },
        },
        {
          id: "diasBanco",
          pregunta: "¿Cuántos días tiene el banco para informar si aprueba el crédito?",
          tipo: "dias",
          requerido: true,
          sugerido: "20",
          visibleSi: { campo: "formaPago", valores: ["Crédito hipotecario", "Crédito hipotecario y tracto abreviado"] },
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
          pregunta: "¿Cuántos días de vigencia tiene esta reserva para ser conformada?",
          ayuda: "Días corridos. Vencido el plazo sin conformación, las partes quedan liberadas.",
          tipo: "dias",
          requerido: true,
          sugerido: "3",
        },
        {
          id: "diasRefuerzo",
          pregunta: "¿Dentro de cuántos días se integra el refuerzo de seña?",
          tipo: "dias",
          requerido: true,
          sugerido: "10",
        },
        {
          id: "diasEscritura",
          pregunta: "¿Cuál es la fecha tope para la firma del boleto o la escritura?",
          ayuda: "Días corridos desde hoy.",
          tipo: "dias",
          requerido: true,
          sugerido: "60",
        },
      ],
    },
    observaciones,
  ],
  plazos: [
    { id: "conformar", rotulo: "Conformación de la oferta", campoDias: "diasConformar" },
    {
      id: "banco",
      rotulo: "Respuesta del banco",
      campoDias: "diasBanco",
      visibleSi: { campo: "formaPago", valores: ["Crédito hipotecario", "Crédito hipotecario y tracto abreviado"] },
    },
    { id: "refuerzo", rotulo: "Refuerzo de seña", campoDias: "diasRefuerzo" },
    { id: "escritura", rotulo: "Firma de boleto o escritura", campoDias: "diasEscritura" },
  ],
  cuerpo: [
    {
      texto:
        "En la Ciudad Autónoma de Buenos Aires, a los {{hoy}}, {{oferente}}, DNI {{dniOferente}}, con domicilio constituido en {{domicilioOferente}}, en adelante EL OFERENTE, entrega en este acto a RE/MAX Devoto, en su carácter de intermediario, la suma de USD {{montoReserva}} en concepto de RESERVA sobre el inmueble sito en {{direccion}}, {{unidad}}, propiedad de {{propietario}}.",
    },
    {
      titulo: "PRIMERA — Oferta",
      texto:
        "La presente reserva se formula como oferta irrevocable de compra por la suma total de USD {{precioOfertado}}, sujeta a la aceptación del propietario. El saldo de precio se cancelará bajo la modalidad {{formaPago}}.",
    },
    {
      titulo: "SEGUNDA — Vigencia",
      texto:
        "La presente oferta mantendrá su vigencia por el término de {{diasConformar}} días corridos contados desde el {{vigenciaDesde}}. Vencido dicho plazo sin que la oferta haya sido conformada por el propietario, las partes quedarán automáticamente liberadas de todo compromiso, sin derecho a reclamo alguno, y se procederá a la devolución del importe entregado.",
    },
    {
      titulo: "TERCERA — Refuerzo de seña",
      texto:
        "De no surgir impedimento de los informes de dominio e inhibición, EL OFERENTE integrará un refuerzo de seña de USD {{montoRefuerzo}} dentro de los {{diasRefuerzo}} días corridos de conformada la presente.",
    },
    {
      titulo: "CUARTA — Crédito hipotecario",
      texto:
        "La operación se instrumenta con crédito hipotecario otorgado por {{banco}}. EL OFERENTE deberá acreditar la aprobación definitiva del crédito dentro de los {{diasBanco}} días corridos. De no obtenerse la aprobación en dicho plazo, cualquiera de las partes podrá dejar sin efecto la operación.",
      visibleSi: { campo: "formaPago", valores: ["Crédito hipotecario", "Crédito hipotecario y tracto abreviado"] },
    },
    {
      titulo: "QUINTA — Escrituración",
      texto:
        "La fecha tope para la firma del boleto de compraventa o de la escritura traslativa de dominio se fija en {{diasEscritura}} días corridos contados desde el {{vigenciaDesde}}, ante el escribano que designe la parte compradora.",
    },
    {
      titulo: "SEXTA — Comisión",
      texto:
        "EL OFERENTE abonará en concepto de comisión el {{comision}}% del precio total de la operación, con más el impuesto al valor agregado, al momento de la conformación de la presente.",
    },
    {
      titulo: "SÉPTIMA — Estado del inmueble",
      texto:
        "El inmueble se transfiere {{estadoEntrega}}, libre de deudas por impuestos, tasas y contribuciones, y libre de gravámenes, todo ello a la fecha de la escrituración.",
    },
    {
      titulo: "OCTAVA — Domicilios",
      texto:
        "Para todos los efectos derivados del presente, las partes constituyen domicilio en los indicados, donde se tendrán por válidas todas las comunicaciones que se cursen.",
    },
  ],
};

/* ── 2. Reserva de compra — Residencial PBA ─────────────────── */

const reservaPba: Plantilla = {
  ...reservaCaba,
  id: "reserva-pba",
  nombre: "Reserva de compra — Residencial PBA",
  jurisdiccion: "PBA",
  resumen: "La misma reserva, con las cláusulas propias de Provincia de Buenos Aires.",
  cuerpo: reservaCaba.cuerpo.map((c, i) =>
    i === 0
      ? {
          ...c,
          texto: c.texto.replace(
            "En la Ciudad Autónoma de Buenos Aires",
            "En la Provincia de Buenos Aires",
          ),
        }
      : c,
  ),
};

/* ── 3. Adenda de reserva ───────────────────────────────────── */

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
  uso: "Residencial",
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

/* ── 4. Autorización de venta exclusiva ─────────────────────── */

const autorizacion: Plantilla = {
  id: "autorizacion-caba",
  nombre: "Autorización de venta exclusiva — CABA",
  jurisdiccion: "CABA",
  operacion: "Venta",
  uso: "Residencial",
  resumen: "La firma el propietario para que la oficina comercialice la propiedad en exclusiva.",
  campoContraparte: "propietario",
  secciones: [
    inmueble(false),
    {
      id: "propietarioDatos",
      titulo: "Datos del propietario",
      campos: [
        { id: "dniPropietario", pregunta: "DNI o CUIT del propietario", tipo: "texto", requerido: true },
        { id: "domicilioPropietario", pregunta: "Domicilio del propietario", tipo: "texto", requerido: true },
        { id: "telefonoPropietario", pregunta: "Teléfono de contacto", tipo: "texto", requerido: true },
      ],
    },
    {
      id: "condiciones",
      titulo: "Condiciones de la autorización",
      campos: [
        campoVigencia,
        { id: "precioPublicacion", pregunta: "¿A qué precio se publica?", tipo: "moneda", requerido: true },
        { id: "comision", pregunta: "¿Qué comisión abona el propietario?", tipo: "porcentaje", requerido: true, sugerido: "3" },
        {
          id: "diasVigencia",
          pregunta: "¿Cuántos días dura la exclusividad?",
          tipo: "dias",
          requerido: true,
          sugerido: "180",
        },
      ],
    },
    observaciones,
  ],
  plazos: [{ id: "exclusividad", rotulo: "Vencimiento de la exclusividad", campoDias: "diasVigencia" }],
  cuerpo: [
    {
      texto:
        "En la Ciudad Autónoma de Buenos Aires, a los {{hoy}}, {{propietario}}, DNI/CUIT {{dniPropietario}}, con domicilio en {{domicilioPropietario}}, autoriza a RE/MAX Devoto a comercializar en forma EXCLUSIVA el inmueble sito en {{direccion}}, {{unidad}}.",
    },
    {
      titulo: "PRIMERA — Precio",
      texto: "El inmueble se ofrecerá al público por la suma de USD {{precioPublicacion}}.",
    },
    {
      titulo: "SEGUNDA — Plazo",
      texto:
        "La presente autorización se otorga por el término de {{diasVigencia}} días corridos, renovable de común acuerdo entre las partes.",
    },
    {
      titulo: "TERCERA — Honorarios",
      texto:
        "El propietario abonará en concepto de honorarios el {{comision}}% del precio efectivo de venta, con más el impuesto al valor agregado.",
    },
  ],
};

/* ── 5. Reserva de locación comercial ───────────────────────── */

const locacionComercial: Plantilla = {
  id: "locacion-comercial-caba",
  nombre: "Reserva de locación comercial — CABA",
  jurisdiccion: "CABA",
  operacion: "Alquiler",
  uso: "Comercial",
  resumen: "Reserva sobre un local o inmueble con destino comercial en Capital.",
  campoContraparte: "oferente",
  secciones: [
    inmueble(false),
    { ...oferente, titulo: "Quién alquila" },
    {
      id: "dinero",
      titulo: "La plata",
      campos: [
        { id: "montoReserva", pregunta: "¿Cuánto deja en concepto de reserva?", tipo: "moneda", requerido: true },
        { id: "canonMensual", pregunta: "¿Cuál es el canon locativo mensual ofrecido?", tipo: "moneda", requerido: true },
        { id: "meses", pregunta: "¿Cuántos meses dura el contrato?", tipo: "numero", requerido: true, sugerido: "36" },
        { id: "destino", pregunta: "¿Qué destino comercial va a tener?", tipo: "texto", requerido: true },
      ],
    },
    {
      id: "plazos",
      titulo: "Los plazos",
      campos: [
        campoVigencia,
        { id: "diasConformar", pregunta: "¿Cuántos días de vigencia tiene esta reserva?", tipo: "dias", requerido: true, sugerido: "5" },
        { id: "diasGarantias", pregunta: "¿Dentro de cuántos días presenta las garantías?", tipo: "dias", requerido: true, sugerido: "10" },
        { id: "diasFirma", pregunta: "¿Cuál es la fecha tope para la firma del contrato?", tipo: "dias", requerido: true, sugerido: "30" },
      ],
    },
    observaciones,
  ],
  plazos: [
    { id: "conformar", rotulo: "Conformación de la oferta", campoDias: "diasConformar" },
    { id: "garantias", rotulo: "Presentación de garantías", campoDias: "diasGarantias" },
    { id: "firma", rotulo: "Firma del contrato", campoDias: "diasFirma" },
  ],
  cuerpo: [
    {
      texto:
        "En la Ciudad Autónoma de Buenos Aires, a los {{hoy}}, {{oferente}}, DNI {{dniOferente}}, con domicilio constituido en {{domicilioOferente}}, entrega la suma de USD {{montoReserva}} en concepto de reserva del inmueble sito en {{direccion}}, {{unidad}}, con destino {{destino}}.",
    },
    {
      titulo: "PRIMERA — Oferta",
      texto:
        "Se ofrece un canon locativo mensual de USD {{canonMensual}} por un plazo contractual de {{meses}} meses, sujeto a la aceptación del propietario {{propietario}}.",
    },
    {
      titulo: "SEGUNDA — Vigencia",
      texto:
        "La presente reserva tendrá vigencia de {{diasConformar}} días corridos. Vencido el plazo sin conformación, las partes quedarán liberadas.",
    },
    {
      titulo: "TERCERA — Garantías",
      texto:
        "El locatario deberá presentar las garantías requeridas dentro de los {{diasGarantias}} días corridos, y suscribir el contrato de locación dentro de los {{diasFirma}} días corridos.",
    },
  ],
};

export const plantillas: Plantilla[] = [
  reservaCaba,
  reservaPba,
  adenda,
  autorizacion,
  locacionComercial,
];

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

const CAMPOS_MONTO = new Set([
  "montoReserva",
  "precioOfertado",
  "montoRefuerzo",
  "nuevoPrecio",
  "precioPublicacion",
  "canonMensual",
]);

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

  if (clave.endsWith("Letras")) return enLetras(v[clave.slice(0, -6)] ?? "");

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
