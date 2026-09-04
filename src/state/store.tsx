import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import {
  alertas as alertasSeed,
  asesores as asesoresSeed,
  contactos as contactosSeed,
  leads as leadsSeed,
  operaciones as operacionesSeed,
  propiedades as propiedadesSeed,
  reglaInicial,
  tareas as tareasSeed,
  umbralesIniciales,
  type Umbrales,
  type Alerta,
  type Asesor,
  type CanalContacto,
  type Contacto,
  type Doc,
  type Lead,
  type Operacion,
  type Propiedad,
  type ReglaCadencia,
  type Tarea,
  type TipoOp,
  type Urgencia,
} from "../data/mock";

/* ── Estado ─────────────────────────────────────────────────── */

export interface Aviso {
  id: number;
  texto: string;
  tono: "neutro" | "ok" | "riesgo";
  deshacer?: Estado;
}

export interface Estado {
  ahora: number;
  operaciones: Operacion[];
  propiedades: Propiedad[];
  tareas: Tarea[];
  asesores: Asesor[];
  leads: Lead[];
  alertas: Alerta[];
  contactos: Contacto[];
  regla: ReglaCadencia;
  umbrales: Umbrales;
  avisos: Aviso[];
  yo: string;
}

const inicial: Estado = {
  ahora: Date.now(),
  operaciones: operacionesSeed,
  propiedades: propiedadesSeed,
  tareas: tareasSeed,
  asesores: asesoresSeed,
  leads: leadsSeed,
  alertas: alertasSeed,
  contactos: contactosSeed,
  regla: reglaInicial,
  umbrales: umbralesIniciales,
  avisos: [],
  yo: "a1",
};

/* ── Acciones ───────────────────────────────────────────────── */

export type Accion =
  | { t: "tic" }
  | { t: "yo"; asesorId: string }
  | { t: "tarea.marcar"; id: string }
  | { t: "tarea.posponer"; id: string; horas: number }
  | { t: "tarea.nueva"; descripcion: string; operacionId?: string; horas: number; accion?: string }
  | { t: "doc.solicitar"; opId: string; docId: string }
  | { t: "doc.cargar"; opId: string; docId: string }
  | { t: "op.avanzar"; opId: string }
  | { t: "op.retroceder"; opId: string }
  | { t: "op.reasignar"; opId: string; asesorId: string }
  | { t: "op.escalar"; opId: string; motivo: string }
  | { t: "op.desescalar"; opId: string }
  | { t: "op.plazo"; opId: string; horas: number }
  | { t: "op.nota"; opId: string; texto: string }
  | { t: "prop.precio"; propId: string; precio: number }
  | { t: "prop.portal"; propId: string; portal: string }
  | {
      t: "prop.crear";
      datos: {
        direccion: string;
        barrio: string;
        tipo: TipoOp;
        precio: number;
        ambientes: number;
        superficie: number;
        asesorId: string;
        garage: boolean;
      };
    }
  | { t: "prop.eliminar"; propId: string }
  | { t: "asesor.crear"; datos: { nombre: string; rol: string; topeDias: number } }
  | { t: "asesor.eliminar"; asesorId: string }
  | { t: "lead.asignar"; leadId: string; asesorId: string }
  | { t: "lead.estado"; leadId: string; estado: Lead["estado"] }
  | { t: "alerta.leer"; id: string }
  | { t: "alerta.resolver"; id: string }
  | { t: "alerta.leerTodas" }
  | { t: "contacto.registrar"; asesorId: string; canal: CanalContacto; nota: string }
  | { t: "contacto.tope"; asesorId: string; dias: number }
  | { t: "contacto.regla"; cambio: Partial<ReglaCadencia> }
  | { t: "contacto.avisarAsesor"; asesorId: string }
  | { t: "contacto.probarAutomatizacion"; tipo: "previo" | "vencido" | "resumen"; alcance: number }
  | { t: "umbrales.set"; cambio: Partial<Umbrales> }
  | { t: "aviso.cerrar"; id: number }
  | { t: "aviso.deshacer"; id: number };

let avisoSeq = 1;
let eventoSeq = 1;

const nuevoId = (p: string) => `${p}-${Date.now().toString(36)}-${eventoSeq++}`;

function conAviso(
  s: Estado,
  texto: string,
  tono: Aviso["tono"] = "neutro",
  anterior?: Estado,
): Estado {
  const aviso: Aviso = { id: avisoSeq++, texto, tono, deshacer: anterior };
  return { ...s, avisos: [...s.avisos.slice(-2), aviso] };
}

function anotar(
  s: Estado,
  opId: string,
  texto: string,
  autor: string,
  tipo: Operacion["actividad"][number]["tipo"] = "persona",
): Estado {
  return {
    ...s,
    operaciones: s.operaciones.map((o) =>
      o.id === opId
        ? {
            ...o,
            actividad: [
              { id: nuevoId("ev"), ts: Date.now(), texto, autor, tipo },
              ...o.actividad,
            ],
          }
        : o,
    ),
  };
}

const nombreDe = (s: Estado, id: string) =>
  s.asesores.find((a) => a.id === id)?.nombre ?? "Sistema";

function reducer(s: Estado, a: Accion): Estado {
  switch (a.t) {
    case "tic":
      return { ...s, ahora: Date.now() };

    case "yo":
      return { ...s, yo: a.asesorId };

    case "tarea.marcar": {
      const tarea = s.tareas.find((t) => t.id === a.id);
      if (!tarea) return s;
      const prev = s;
      let n: Estado = {
        ...s,
        tareas: s.tareas.map((t) => (t.id === a.id ? { ...t, hecha: !t.hecha } : t)),
      };
      if (!tarea.hecha && tarea.operacionId) {
        n = anotar(n, tarea.operacionId, `Tarea cumplida: ${tarea.descripcion}`, nombreDe(s, tarea.asesorId));
      }
      return conAviso(
        n,
        tarea.hecha ? "Tarea reabierta" : "Tarea marcada como hecha",
        tarea.hecha ? "neutro" : "ok",
        tarea.hecha ? undefined : prev,
      );
    }

    case "tarea.posponer": {
      const tarea = s.tareas.find((t) => t.id === a.id);
      if (!tarea) return s;
      const n = {
        ...s,
        tareas: s.tareas.map((t) =>
          t.id === a.id ? { ...t, vence: Math.max(t.vence, Date.now()) + a.horas * 3_600_000 } : t,
        ),
      };
      return conAviso(n, `Reprogramada ${a.horas >= 24 ? `${a.horas / 24} día(s)` : `${a.horas} h`}`, "neutro", s);
    }

    case "tarea.nueva": {
      const t: Tarea = {
        id: nuevoId("t"),
        operacionId: a.operacionId,
        asesorId: s.yo,
        descripcion: a.descripcion,
        vence: Date.now() + a.horas * 3_600_000,
        hecha: false,
        accion: a.accion ?? "Gestionar",
        tipo: "gestion",
      };
      return conAviso({ ...s, tareas: [t, ...s.tareas] }, "Tarea agregada a tu día", "ok");
    }

    case "doc.solicitar": {
      const op = s.operaciones.find((o) => o.id === a.opId);
      const d = op?.docs.find((x) => x.id === a.docId);
      if (!op || !d) return s;
      let n: Estado = {
        ...s,
        operaciones: s.operaciones.map((o) =>
          o.id === a.opId
            ? { ...o, docs: o.docs.map((x) => (x.id === a.docId ? { ...x, estado: "pendiente" as const } : x)) }
            : o,
        ),
      };
      n = anotar(n, a.opId, `Pedido enviado a ${d.responsable}: ${d.nombre}`, "Sistema", "sistema");
      return conAviso(n, `Pedido enviado a ${d.responsable}`, "ok", s);
    }

    case "doc.cargar": {
      const op = s.operaciones.find((o) => o.id === a.opId);
      const d = op?.docs.find((x) => x.id === a.docId);
      if (!op || !d) return s;
      let n: Estado = {
        ...s,
        operaciones: s.operaciones.map((o) =>
          o.id === a.opId
            ? { ...o, docs: o.docs.map((x) => (x.id === a.docId ? { ...x, estado: "completo" as const } : x)) }
            : o,
        ),
      };
      n = anotar(n, a.opId, `Documento incorporado al legajo: ${d.nombre}`, nombreDe(s, op.asesorId), "hito");
      return conAviso(n, `${d.nombre} · cargado`, "ok", s);
    }

    case "op.avanzar": {
      const op = s.operaciones.find((o) => o.id === a.opId);
      if (!op || op.etapa >= 12) return s;
      const faltanCriticos = op.docs.filter((d) => d.critico && d.estado !== "completo").length;
      let n: Estado = {
        ...s,
        operaciones: s.operaciones.map((o) =>
          o.id === a.opId ? { ...o, etapa: o.etapa + 1, vence: Date.now() + 72 * 3_600_000 } : o,
        ),
      };
      n = anotar(n, a.opId, `Avanza a ${ETAPA(op.etapa + 1)}`, nombreDe(s, op.asesorId), "hito");
      return conAviso(
        n,
        faltanCriticos > 0
          ? `Avanzada con ${faltanCriticos} documento(s) crítico(s) pendiente(s)`
          : `Avanzada a ${ETAPA(op.etapa + 1)}`,
        faltanCriticos > 0 ? "riesgo" : "ok",
        s,
      );
    }

    case "op.retroceder": {
      const op = s.operaciones.find((o) => o.id === a.opId);
      if (!op || op.etapa <= 0) return s;
      let n: Estado = {
        ...s,
        operaciones: s.operaciones.map((o) => (o.id === a.opId ? { ...o, etapa: o.etapa - 1 } : o)),
      };
      n = anotar(n, a.opId, `Retrocede a ${ETAPA(op.etapa - 1)}`, nombreDe(s, op.asesorId), "riesgo");
      return conAviso(n, `Volvió a ${ETAPA(op.etapa - 1)}`, "neutro", s);
    }

    case "op.reasignar": {
      const op = s.operaciones.find((o) => o.id === a.opId);
      if (!op || op.asesorId === a.asesorId) return s;
      const antes = nombreDe(s, op.asesorId);
      const despues = nombreDe(s, a.asesorId);
      let n: Estado = {
        ...s,
        operaciones: s.operaciones.map((o) => (o.id === a.opId ? { ...o, asesorId: a.asesorId } : o)),
        propiedades: s.propiedades.map((p) =>
          p.operacionId === a.opId ? { ...p, asesorId: a.asesorId } : p,
        ),
        tareas: s.tareas.map((t) => (t.operacionId === a.opId ? { ...t, asesorId: a.asesorId } : t)),
        asesores: s.asesores.map((x) =>
          x.id === op.asesorId
            ? { ...x, activas: Math.max(0, x.activas - 1) }
            : x.id === a.asesorId
              ? { ...x, activas: x.activas + 1 }
              : x,
        ),
      };
      n = anotar(n, a.opId, `Reasignada de ${antes} a ${despues}`, "Gerencia", "hito");
      return conAviso(n, `${op.id} pasa a ${despues}`, "ok", s);
    }

    case "op.escalar": {
      const op = s.operaciones.find((o) => o.id === a.opId);
      if (!op) return s;
      let n: Estado = {
        ...s,
        operaciones: s.operaciones.map((o) =>
          o.id === a.opId ? { ...o, escalada: true, motivoEscalada: a.motivo } : o,
        ),
        alertas: [
          {
            id: nuevoId("AL"),
            ts: Date.now(),
            severidad: "alta",
            titulo: `${op.id} escalada a gerencia`,
            detalle: a.motivo,
            refOp: op.id,
            refAsesor: op.asesorId,
            leida: false,
            resuelta: false,
          },
          ...s.alertas,
        ],
      };
      n = anotar(n, a.opId, `Escalada a gerencia — ${a.motivo}`, "Gerencia", "riesgo");
      return conAviso(n, `${op.id} escalada`, "riesgo", s);
    }

    case "op.desescalar": {
      let n: Estado = {
        ...s,
        operaciones: s.operaciones.map((o) =>
          o.id === a.opId ? { ...o, escalada: false, motivoEscalada: undefined } : o,
        ),
      };
      n = anotar(n, a.opId, "Escalamiento cerrado por gerencia", "Gerencia", "hito");
      return conAviso(n, "Escalamiento cerrado", "ok", s);
    }

    case "op.plazo": {
      const op = s.operaciones.find((o) => o.id === a.opId);
      if (!op) return s;
      let n: Estado = {
        ...s,
        operaciones: s.operaciones.map((o) =>
          o.id === a.opId ? { ...o, vence: Math.max(o.vence, Date.now()) + a.horas * 3_600_000 } : o,
        ),
      };
      n = anotar(n, a.opId, `Plazo extendido ${a.horas} h`, nombreDe(s, op.asesorId), "sistema");
      return conAviso(n, `Plazo extendido ${a.horas} h`, "neutro", s);
    }

    case "op.nota": {
      const op = s.operaciones.find((o) => o.id === a.opId);
      if (!op || !a.texto.trim()) return s;
      return anotar(s, a.opId, a.texto.trim(), nombreDe(s, s.yo), "persona");
    }

    case "prop.precio": {
      const p = s.propiedades.find((x) => x.id === a.propId);
      if (!p) return s;
      const n: Estado = {
        ...s,
        propiedades: s.propiedades.map((x) => (x.id === a.propId ? { ...x, precio: a.precio } : x)),
        operaciones: s.operaciones.map((o) =>
          o.propiedadId === a.propId ? { ...o, precio: a.precio, comision: Math.round(a.precio * 0.04) } : o,
        ),
      };
      const delta = Math.round(((a.precio - p.precio) / p.precio) * 100);
      return conAviso(n, `Precio actualizado (${delta > 0 ? "+" : ""}${delta}%)`, "ok", s);
    }

    case "prop.portal": {
      const p = s.propiedades.find((x) => x.id === a.propId);
      if (!p) return s;
      const activo = p.portales.includes(a.portal);
      const portales = activo ? p.portales.filter((x) => x !== a.portal) : [...p.portales, a.portal];
      const n: Estado = {
        ...s,
        propiedades: s.propiedades.map((x) =>
          x.id === a.propId ? { ...x, portales, publicada: portales.length > 0 } : x,
        ),
      };
      return conAviso(n, `${activo ? "Despublicada de" : "Publicada en"} ${a.portal}`, activo ? "neutro" : "ok", s);
    }

    case "prop.crear": {
      const nueva: Propiedad = {
        id: nuevoId("PROP"),
        direccion: a.datos.direccion.trim(),
        barrio: a.datos.barrio.trim(),
        tipo: a.datos.tipo,
        precio: a.datos.precio,
        precioInicial: a.datos.precio,
        ambientes: a.datos.ambientes,
        superficie: a.datos.superficie,
        estado: "Disponible",
        asesorId: a.datos.asesorId,
        publicada: false,
        portales: [],
        antiguedad: 0,
        garage: a.datos.garage,
        descripcion: "",
        visitas: 0,
        consultas: 0,
        diasEnCartera: 0,
      };
      const n: Estado = { ...s, propiedades: [nueva, ...s.propiedades] };
      return conAviso(n, `Propiedad cargada: ${nueva.direccion}`, "ok", s);
    }

    case "prop.eliminar": {
      const p = s.propiedades.find((x) => x.id === a.propId);
      if (!p) return s;
      if (p.operacionId) {
        return conAviso(s, "No podés eliminar una propiedad con una operación vinculada", "riesgo");
      }
      const n: Estado = { ...s, propiedades: s.propiedades.filter((x) => x.id !== a.propId) };
      return conAviso(n, `Propiedad eliminada: ${p.direccion}`, "neutro", s);
    }

    case "asesor.crear": {
      const nombre = a.datos.nombre.trim();
      const nuevo: Asesor = {
        id: nuevoId("a"),
        nombre,
        iniciales: nombre.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(),
        rol: a.datos.rol,
        activas: 0,
        cerradas: 0,
        tasaConversion: 50,
        tiempoPromedioDias: 45,
        comisionMes: 0,
        minRespuestaProm: 30,
        captacionesMes: 0,
        topeDias: a.datos.topeDias,
        ultimoContacto: Date.now(),
        facturacionMensual: Array(12).fill(0),
      };
      const n: Estado = { ...s, asesores: [...s.asesores, nuevo] };
      return conAviso(n, `Asesor agregado: ${nuevo.nombre}`, "ok", s);
    }

    case "asesor.eliminar": {
      const asesor = s.asesores.find((x) => x.id === a.asesorId);
      if (!asesor) return s;
      if (asesor.activas > 0) {
        return conAviso(
          s,
          `${asesor.nombre} tiene ${asesor.activas} operaciones activas — reasignalas antes de eliminarlo`,
          "riesgo",
        );
      }
      const n: Estado = { ...s, asesores: s.asesores.filter((x) => x.id !== a.asesorId) };
      return conAviso(n, `Asesor eliminado: ${asesor.nombre}`, "neutro", s);
    }

    case "lead.asignar": {
      const l = s.leads.find((x) => x.id === a.leadId);
      if (!l) return s;
      const n: Estado = {
        ...s,
        leads: s.leads.map((x) =>
          x.id === a.leadId ? { ...x, asesorId: a.asesorId, estado: "asignado" as const } : x,
        ),
      };
      return conAviso(n, `${l.nombre} → ${nombreDe(s, a.asesorId)}`, "ok", s);
    }

    case "lead.estado": {
      const n: Estado = {
        ...s,
        leads: s.leads.map((x) => (x.id === a.leadId ? { ...x, estado: a.estado } : x)),
      };
      return conAviso(n, `Consulta marcada como ${a.estado}`, "ok", s);
    }

    case "alerta.leer":
      return { ...s, alertas: s.alertas.map((x) => (x.id === a.id ? { ...x, leida: true } : x)) };

    case "alerta.leerTodas":
      return { ...s, alertas: s.alertas.map((x) => ({ ...x, leida: true })) };

    case "alerta.resolver": {
      const n: Estado = {
        ...s,
        alertas: s.alertas.map((x) => (x.id === a.id ? { ...x, resuelta: true, leida: true } : x)),
      };
      return conAviso(n, "Alerta resuelta", "ok", s);
    }

    case "contacto.registrar": {
      const asesor = s.asesores.find((x) => x.id === a.asesorId);
      if (!asesor) return s;
      const ahora = Date.now();
      const n: Estado = {
        ...s,
        asesores: s.asesores.map((x) => (x.id === a.asesorId ? { ...x, ultimoContacto: ahora } : x)),
        contactos: [
          {
            id: nuevoId("c"),
            asesorId: a.asesorId,
            ts: ahora,
            canal: a.canal,
            nota: a.nota.trim() || "Sin nota",
          },
          ...s.contactos,
        ],
      };
      return conAviso(n, `Contacto registrado con ${asesor.nombre}`, "ok", s);
    }

    case "contacto.tope": {
      const asesor = s.asesores.find((x) => x.id === a.asesorId);
      if (!asesor || asesor.topeDias === a.dias) return s;
      const n: Estado = {
        ...s,
        asesores: s.asesores.map((x) => (x.id === a.asesorId ? { ...x, topeDias: a.dias } : x)),
      };
      return conAviso(n, `${asesor.nombre}: tope cada ${a.dias} días`, "neutro", s);
    }

    case "contacto.regla":
      return conAviso({ ...s, regla: { ...s.regla, ...a.cambio } }, "Automatización actualizada", "ok", s);

    case "contacto.avisarAsesor": {
      const asesor = s.asesores.find((x) => x.id === a.asesorId);
      if (!asesor) return s;
      return conAviso(s, `Aviso enviado a ${asesor.nombre} pidiéndole que te contacte`, "ok", s);
    }

    case "contacto.probarAutomatizacion": {
      const ahora = Date.now();
      const regla =
        a.tipo === "previo"
          ? { ...s.regla, ultimoEnvioPrevio: ahora }
          : a.tipo === "vencido"
            ? { ...s.regla, ultimoEnvioVencido: ahora }
            : { ...s.regla, ultimoEnvioResumen: ahora };
      const texto =
        a.tipo === "previo"
          ? `Aviso previo enviado a ${a.alcance} asesores`
          : a.tipo === "vencido"
            ? `Aviso de vencido enviado a ${a.alcance} asesores`
            : "Resumen enviado a gerencia";
      return conAviso({ ...s, regla }, texto, "ok", s);
    }

    case "umbrales.set":
      return { ...s, umbrales: { ...s.umbrales, ...a.cambio } };

    case "aviso.cerrar":
      return { ...s, avisos: s.avisos.filter((x) => x.id !== a.id) };

    case "aviso.deshacer": {
      const av = s.avisos.find((x) => x.id === a.id);
      if (!av?.deshacer) return { ...s, avisos: s.avisos.filter((x) => x.id !== a.id) };
      return { ...av.deshacer, ahora: Date.now(), yo: s.yo, avisos: [] };
    }

    default:
      return s;
  }
}

const ETAPAS_REF = [
  "Captación", "Tasación", "Publicación", "Visitas", "Reserva",
  "Verif. documental", "Boleto de CV", "Due diligence", "Financiación",
  "Pre-escritura", "Escritura", "Entrega llaves", "Liquidación",
];
const ETAPA = (i: number) => ETAPAS_REF[Math.max(0, Math.min(12, i))];

/* ── Contexto ───────────────────────────────────────────────── */

const Ctx = createContext<{ e: Estado; d: (a: Accion) => void } | null>(null);

export function Proveedor({ children }: { children: ReactNode }) {
  const [e, d] = useReducer(reducer, inicial);
  const dRef = useRef(d);
  dRef.current = d;

  useEffect(() => {
    const id = setInterval(() => dRef.current({ t: "tic" }), 20_000);
    return () => clearInterval(id);
  }, []);

  const valor = useMemo(() => ({ e, d }), [e]);
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp fuera del Proveedor");
  return c;
}

/* ── Derivados ──────────────────────────────────────────────── */

export function urgencia(vence: number, ahora: number): Urgencia {
  const hs = (vence - ahora) / 3_600_000;
  if (hs < 0) return "vencida";
  if (hs <= 24) return "hoy";
  if (hs <= 168) return "semana";
  return "ok";
}

/** Riesgo compuesto 0-100: plazo + documentos críticos + silencio + antigüedad. */
export function riesgo(op: Operacion, ahora: number): number {
  const hs = (op.vence - ahora) / 3_600_000;
  const plazo = hs < 0 ? 40 : hs <= 24 ? 28 : hs <= 72 ? 16 : hs <= 168 ? 8 : 0;
  const criticos = op.docs.filter((d) => d.critico && d.estado !== "completo").length;
  const docs = Math.min(30, criticos * 10);
  const ultimo = op.actividad[0]?.ts ?? op.abierta;
  const dias = (ahora - ultimo) / 86_400_000;
  const silencio = dias > 7 ? 20 : dias > 4 ? 14 : dias > 2 ? 7 : 0;
  const edad = (ahora - op.abierta) / 86_400_000 > 120 ? 10 : 0;
  return Math.min(100, plazo + docs + silencio + edad + (op.escalada ? 8 : 0));
}

export type EstadoCadencia = "vencido" | "porVencer" | "alDia";

export interface Cadencia {
  asesor: Asesor;
  /** Días enteros desde el último contacto. */
  desde: number;
  /** Días de atraso respecto del tope (negativo = todavía queda margen). */
  atraso: number;
  /** Proporción del tope ya consumida, 0–1+. */
  consumo: number;
  estado: EstadoCadencia;
}

/** Traduce la regla de la oficina a un estado por asesor. */
export function cadenciaDe(a: Asesor, ahora: number, margen: number): Cadencia {
  const desde = Math.floor((ahora - a.ultimoContacto) / 86_400_000);
  const atraso = desde - a.topeDias;
  return {
    asesor: a,
    desde,
    atraso,
    consumo: desde / a.topeDias,
    estado: atraso > 0 ? "vencido" : atraso >= -margen ? "porVencer" : "alDia",
  };
}

/* ── Producción móvil de 12 meses y su decaimiento ──────────── */

export type Semaforo = "verde" | "amarillo" | "rojo";

export interface Proyeccion {
  asesor: Asesor;
  /** Producción móvil de hoy y a 3, 6 y 9 meses sin cerrar nada nuevo. */
  hoy: number;
  m3: number;
  m6: number;
  m9: number;
  estadoHoy: Semaforo;
  estado3: Semaforo;
  estado6: Semaforo;
  estado9: Semaforo;
  /** Cuántas categorías baja entre hoy y los 9 meses. */
  escalones: number;
  /**
   * En cuántos meses cae a rojo si no cierra nada: 0, 3, 6 o 9.
   * `null` significa que aguanta más allá de los 9 meses.
   * Es el número que ordena la lista: dice a quién hay que ver primero.
   */
  mesesHastaRojo: number | null;
  /** Porcentaje de la producción que se pierde por el solo paso del tiempo. */
  caida: number;
  /** Cuánto tendría que cerrar en los próximos 9 meses para sostener el verde. */
  faltanteVerde: number;
  /** Lo mínimo que tiene que cerrar para no terminar en rojo. Es el número del 1 a 1. */
  faltanteMinimo: number;
}

const RANGO: Record<Semaforo, number> = { verde: 2, amarillo: 1, rojo: 0 };

export function semaforoDe(monto: number, u: Umbrales): Semaforo {
  return monto >= u.verde ? "verde" : monto >= u.amarillo ? "amarillo" : "rojo";
}

/**
 * La producción móvil mira los últimos 12 meses. Si el asesor no cierra nada,
 * los meses viejos se van saliendo de la ventana y el acumulado cae solo.
 * A 3 meses sobreviven los meses 0–8, a 6 meses los 0–5 y a 9 meses los 0–2.
 */
export function proyeccionDe(a: Asesor, u: Umbrales): Proyeccion {
  const suma = (hasta: number) =>
    a.facturacionMensual.slice(0, hasta).reduce((s, x) => s + x, 0);
  const hoy = suma(12);
  const m3 = suma(9);
  const m6 = suma(6);
  const m9 = suma(3);
  const estadoHoy = semaforoDe(hoy, u);
  const estado3 = semaforoDe(m3, u);
  const estado6 = semaforoDe(m6, u);
  const estado9 = semaforoDe(m9, u);
  const pasos: [number, Semaforo][] = [
    [0, estadoHoy],
    [3, estado3],
    [6, estado6],
    [9, estado9],
  ];
  return {
    asesor: a,
    hoy,
    m3,
    m6,
    m9,
    estadoHoy,
    estado3,
    estado6,
    estado9,
    escalones: RANGO[estadoHoy] - RANGO[estado9],
    mesesHastaRojo: pasos.find(([, s]) => s === "rojo")?.[0] ?? null,
    caida: hoy > 0 ? (hoy - m9) / hoy : 0,
    faltanteVerde: Math.max(0, u.verde - m9),
    faltanteMinimo: Math.max(0, u.amarillo - m9),
  };
}

export function useDerivados() {
  const { e } = useApp();
  return useMemo(() => {
    const ahora = e.ahora;
    const asesorPorId = new Map(e.asesores.map((a) => [a.id, a]));
    const propPorId = new Map(e.propiedades.map((p) => [p.id, p]));
    const opsConRiesgo = e.operaciones
      .map((o) => ({ op: o, r: riesgo(o, ahora), u: urgencia(o.vence, ahora) }))
      .sort((x, y) => y.r - x.r);
    const cadencias = e.asesores
      .map((a) => cadenciaDe(a, ahora, e.regla.margenAviso))
      .sort((x, y) => y.atraso - x.atraso);
    /*
     * Orden por accionabilidad, no por gravedad: primero el que todavía se puede
     * salvar (cae en 3, 6 o 9 meses), después el que aguanta, y al final el que
     * ya está en rojo — ese problema el gerente ya lo tiene visto.
     */
    const prioridad = (m: number | null) => (m === 0 ? 100 : m === null ? 50 : m);
    const proyecciones = e.asesores
      .map((a) => proyeccionDe(a, e.umbrales))
      .sort(
        (x, y) =>
          prioridad(x.mesesHastaRojo) - prioridad(y.mesesHastaRojo) || y.hoy - x.hoy,
      );
    return {
      ahora,
      asesorPorId,
      propPorId,
      opsConRiesgo,
      cadencias,
      vencidosContacto: cadencias.filter((c) => c.estado === "vencido"),
      porVencerContacto: cadencias.filter((c) => c.estado === "porVencer"),
      proyecciones,
      /* El punto ciego: hoy no están en rojo, pero tocan fondo dentro de medio año. */
      seApagan: proyecciones.filter(
        (p) => p.estadoHoy !== "rojo" && p.mesesHastaRojo !== null && p.mesesHastaRojo <= 6,
      ),
      facturacion12: proyecciones.reduce((s, p) => s + p.hoy, 0),
      enRiesgo: opsConRiesgo.filter((x) => x.r >= 30),
      sinAsignar: e.leads.filter((l) => l.estado === "sin asignar"),
      alertasVivas: e.alertas.filter((a) => !a.resuelta),
      sinLeer: e.alertas.filter((a) => !a.leida && !a.resuelta).length,
      comisionProyectada: e.operaciones.reduce((s, o) => s + o.comision, 0),
    };
  }, [e]);
}
