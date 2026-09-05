import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import {
  AHORA,
  EMAIL_GERENCIA,
  adendasIniciales,
  cierreDe,
  claveInmueble,
  desdeIso,
  asesores as asesoresSeed,
  correosIniciales,
  registrosIniciales,
  reglasIniciales,
  umbralesIniciales,
  type Adenda,
  type Asesor,
  type Correo,
  type Evento,
  type EstadoRegistro,
  type MotivoCorreo,
  type Plazo,
  type Registro,
  type Regla,
  type Umbrales,
} from "./datos";
import { CAMPO_VIGENCIA, campoVisible, plantillaPorId } from "./plantillas";

const dia = 86_400_000;

/* ── Estado ─────────────────────────────────────────────────── */

export interface Aviso {
  id: number;
  texto: string;
  tono: "neutro" | "ok" | "riesgo";
}

export interface Estado {
  ahora: number;
  registros: Registro[];
  adendas: Adenda[];
  asesores: Asesor[];
  correos: Correo[];
  reglas: Regla[];
  umbrales: Umbrales;
  avisos: Aviso[];
  yo: string;
}

const inicial: Estado = {
  ahora: AHORA,
  registros: registrosIniciales,
  adendas: adendasIniciales,
  asesores: asesoresSeed,
  correos: correosIniciales,
  reglas: reglasIniciales,
  umbrales: umbralesIniciales,
  avisos: [],
  yo: "a1",
};

/* ── Acciones ───────────────────────────────────────────────── */

export type Accion =
  | { t: "tic" }
  | { t: "yo"; asesorId: string }
  | { t: "registro.crear"; plantillaId: string; valores: Record<string, string> }
  | { t: "registro.aprobar"; registroId: string }
  | { t: "registro.pedirBaja"; registroId: string; motivo: string }
  | { t: "registro.aprobarBaja"; registroId: string }
  | { t: "notificar.adenda"; registroId: string; plazoId: string }
  | { t: "registro.estado"; registroId: string; estado: EstadoRegistro }
  | { t: "registro.nota"; registroId: string; texto: string }
  | { t: "plazo.cumplir"; registroId: string; plazoId: string }
  | { t: "plazo.mover"; registroId: string; plazoId: string; dias: number; motivo: string }
  | {
      t: "adenda.registrar";
      registroId: string;
      plazoId: string;
      dias: number;
      motivo: string;
      nuevoPrecio?: number;
      autor?: string;
      /** Desde qué día se cuenta la prórroga. Por defecto, el vencimiento vigente. */
      desde?: number;
    }
  | { t: "adenda.aprobar"; adendaId: string }
  | { t: "doc.enviar"; registroId: string; destino: "recepcion" | "cliente"; direccion: string }
  | { t: "factura.set"; asesorId: string; mes: number; monto: number }
  | { t: "factura.sumar"; asesorId: string; mes: number; monto: number }
  | { t: "umbrales.set"; cambio: Partial<Umbrales> }
  | { t: "regla.set"; id: Regla["id"]; cambio: Partial<Regla> }
  | { t: "regla.probar"; id: Regla["id"] }
  | { t: "contacto.registrar"; asesorId: string; nota: string }
  | { t: "contacto.tope"; asesorId: string; dias: number }
  | { t: "aviso.cerrar"; id: number };

let seqAviso = 1;
let seqId = 900;
/** Los expedientes siguen la numeración de la oficina, no la interna. */
let seqExpediente = 149;
const nid = (p: string) => `${p}-${++seqId}`;

function evento(ts: number, tipo: Evento["tipo"], texto: string, autor: string): Evento {
  return { id: nid("e"), ts, tipo, texto, autor };
}

function avisar(e: Estado, texto: string, tono: Aviso["tono"] = "neutro"): Aviso[] {
  return [...e.avisos, { id: seqAviso++, texto, tono }].slice(-3);
}

function mapReg(e: Estado, id: string, f: (r: Registro) => Registro): Registro[] {
  return e.registros.map((r) => (r.id === id ? f(r) : r));
}

/** Correo que la automatización dejaría en la bandeja de gerencia. */
function correo(
  e: Estado,
  motivo: MotivoCorreo,
  asunto: string,
  cuerpo: string,
  para: string[],
  oculta: string[],
  registroId?: string,
): Correo {
  return { id: nid("c"), ts: e.ahora, motivo, asunto, cuerpo, para, copiaOculta: oculta, registroId };
}

function reducir(e: Estado, a: Accion): Estado {
  switch (a.t) {
    case "tic":
      return { ...e, ahora: Date.now() };

    case "yo":
      return { ...e, yo: a.asesorId };

    case "registro.crear": {
      const pl = plantillaPorId(a.plantillaId);
      if (!pl) return e;
      const id = `RES-${String(++seqExpediente).padStart(4, "0")}`;

      // Los plazos se cuentan desde la vigencia declarada, que puede ser
      // anterior al día en que el asesor carga el documento.
      const iso = a.valores[CAMPO_VIGENCIA] ?? "";
      const desde = Number.isFinite(desdeIso(iso)) ? desdeIso(iso) : e.ahora;

      const plazos: Plazo[] = pl.plazos
        .filter((dp) => campoVisible(dp, a.valores))
        .map((dp) => {
          const d = Number(a.valores[dp.campoDias] ?? 0) || 0;
          const vence = cierreDe(desde + d * dia);
          return { id: dp.id, rotulo: dp.rotulo, vence, original: vence, cumplido: false };
        })
        .sort((x, y) => x.vence - y.vence);

      const asesor = e.asesores.find((x) => x.id === e.yo);
      const contraparte = a.valores[pl.campoContraparte] || "Sin identificar";

      // Una adenda no crea un expediente nuevo: corre el plazo del que ya existe.
      if (pl.esAdenda) {
        const padre = e.registros.find((r) => r.id === a.valores.registroPadre);
        if (!padre) return { ...e, avisos: avisar(e, "No se encontró la reserva de origen.", "riesgo") };
        // El formulario ofrece los plazos por su rótulo; acá se traduce al id.
        const plazoId =
          padre.plazos.find((p) => p.rotulo === a.valores.plazoAfectado)?.id ?? a.valores.plazoAfectado;
        const nuevoPrecio = Number(a.valores.nuevoPrecio) || undefined;
        const motivo = [a.valores.observaciones, a.valores.otrasModificaciones]
          .map((x) => (x ?? "").trim())
          .filter(Boolean)
          .join(" ") || "Prórroga de la reserva.";
        return reducir(e, {
          t: "adenda.registrar",
          registroId: padre.id,
          plazoId,
          dias: Number(a.valores.diasProrroga) || 0,
          motivo,
          nuevoPrecio,
          desde: Number.isFinite(desdeIso(iso)) ? desdeIso(iso) : e.ahora,
          autor: asesor?.nombre ?? "Asesor",
        });
      }

      const direccion = (a.valores.direccion ?? "").trim() || "Sin dirección";
      const unidad = (a.valores.unidad ?? "").trim();

      // Una propiedad no puede tener dos reservas vigentes al mismo tiempo.
      const clave = claveInmueble(direccion, unidad);
      const ocupada = e.registros.find(
        (r) => r.estado === "vigente" && claveInmueble(r.direccion, r.unidad) === clave,
      );
      if (ocupada) {
        return {
          ...e,
          avisos: avisar(
            e,
            `${direccion} ya tiene la reserva ${ocupada.id} vigente. Cerrala o dala de baja antes de tomar otra.`,
            "riesgo",
          ),
        };
      }

      const reg: Registro = {
        id,
        plantillaId: pl.id,
        direccion,
        unidad,
        jurisdiccion: pl.jurisdiccion,
        asesorId: e.yo,
        contraparte,
        generadoEn: e.ahora,
        vigenciaDesde: desde,
        valores: a.valores,
        plazos,
        estado: "vigente",
        observaciones: a.valores.observaciones ?? "",
        aprobado: false,
        historial: [
          evento(
            e.ahora,
            "generado",
            `${pl.nombre} generado y registrado. Vigencia desde el ${new Date(desde).toLocaleDateString("es-AR")}; quedan corriendo ${plazos.length} plazos. Pendiente de que gerencia le dé el alta.`,
            asesor?.nombre ?? "Asesor",
          ),
        ],
      };
      return {
        ...e,
        registros: [reg, ...e.registros],
        avisos: avisar(e, `${id} registrado, marcado como nuevo. Gerencia lo ve en Reservas para darle el alta.`, "ok"),
      };
    }

    case "registro.aprobar":
      return {
        ...e,
        registros: mapReg(e, a.registroId, (r) => ({
          ...r,
          aprobado: true,
          historial: [
            ...r.historial,
            evento(e.ahora, "estado", "Gerencia le dio el alta. Ya cuenta para las métricas.", "Gerencia"),
          ],
        })),
        avisos: avisar(e, `${a.registroId} dado de alta.`, "ok"),
      };

    case "registro.pedirBaja":
      return {
        ...e,
        registros: mapReg(e, a.registroId, (r) => ({
          ...r,
          bajaPedida: true,
          historial: [
            ...r.historial,
            evento(
              e.ahora,
              "nota",
              `El asesor pidió dar de baja el expediente. ${a.motivo}`.trim(),
              "Asesor",
            ),
          ],
        })),
        avisos: avisar(e, `Se pidió la baja de ${a.registroId}. Falta que gerencia la apruebe.`, "neutro"),
      };

    case "registro.aprobarBaja":
      return {
        ...e,
        registros: mapReg(e, a.registroId, (r) => ({
          ...r,
          estado: "eliminado",
          bajaPedida: false,
          historial: [
            ...r.historial,
            evento(
              e.ahora,
              "estado",
              "Gerencia aprobó la baja pedida por el asesor. Queda en Eliminadas, no cuenta para métricas ni datos, pero el historial se conserva.",
              "Gerencia",
            ),
          ],
        })),
        avisos: avisar(e, `${a.registroId} dado de baja (baja lógica).`, "neutro"),
      };

    case "registro.estado": {
      const rotulo: Record<EstadoRegistro, string> = {
        vigente: "reabierto",
        cerrado: "cerrado: la operación se concretó",
        caido: "dado de baja: la operación se cayó",
        eliminado: "eliminado (baja lógica): no cuenta más para métricas ni datos, pero el historial se conserva",
      };
      return {
        ...e,
        registros: mapReg(e, a.registroId, (r) => ({
          ...r,
          estado: a.estado,
          bajaPedida: a.estado === "eliminado" ? false : r.bajaPedida,
          historial: [...r.historial, evento(e.ahora, "estado", `Expediente ${rotulo[a.estado]}.`, "Gerencia")],
        })),
        avisos: avisar(
          e,
          `${a.registroId} — ${rotulo[a.estado]}.`,
          a.estado === "caido" || a.estado === "eliminado" ? "riesgo" : "ok",
        ),
      };
    }

    case "registro.nota":
      return {
        ...e,
        registros: mapReg(e, a.registroId, (r) => ({
          ...r,
          historial: [...r.historial, evento(e.ahora, "nota", a.texto, "Gerencia")],
        })),
      };

    case "plazo.cumplir":
      return {
        ...e,
        registros: mapReg(e, a.registroId, (r) => {
          const p = r.plazos.find((x) => x.id === a.plazoId);
          return {
            ...r,
            plazos: r.plazos.map((x) => (x.id === a.plazoId ? { ...x, cumplido: !x.cumplido } : x)),
            historial: [
              ...r.historial,
              evento(
                e.ahora,
                "plazo",
                p?.cumplido ? `Se reabrió el plazo «${p.rotulo}».` : `Se marcó cumplido el plazo «${p?.rotulo}».`,
                "Gerencia",
              ),
            ],
          };
        }),
      };

    case "plazo.mover":
      return {
        ...e,
        registros: mapReg(e, a.registroId, (r) => {
          const p = r.plazos.find((x) => x.id === a.plazoId);
          if (!p) return r;
          const nuevo = cierreDe(p.vence + a.dias * dia);
          return {
            ...r,
            plazos: r.plazos.map((x) =>
              x.id === a.plazoId ? { ...x, vence: nuevo, movidoPor: "Gerencia" } : x,
            ),
            historial: [
              ...r.historial,
              evento(
                e.ahora,
                "plazo",
                `Gerencia movió «${p.rotulo}» ${a.dias > 0 ? "+" : ""}${a.dias} días, al ${new Date(nuevo).toLocaleDateString("es-AR")}. ${a.motivo}`.trim(),
                "Gerencia",
              ),
            ],
          };
        }),
        avisos: avisar(e, `Plazo movido y anotado en el historial de ${a.registroId}.`, "ok"),
      };

    case "adenda.registrar": {
      const reg = e.registros.find((r) => r.id === a.registroId);
      if (!reg) return e;
      const p = reg.plazos.find((x) => x.id === a.plazoId);
      if (!p) return e;
      const autor = a.autor ?? "Gerencia";
      // Cuando la genera gerencia queda aplicada al toque; cuando la genera el
      // asesor queda pendiente hasta que gerencia le dé el alta (adenda.aprobar).
      const deGerencia = autor === "Gerencia";
      const desde = a.desde ?? e.ahora;
      const ad: Adenda = {
        id: `AD-${String(++seqExpediente).padStart(4, "0")}`,
        registroId: a.registroId,
        ts: e.ahora,
        plazoId: a.plazoId,
        diasExtension: a.dias,
        desde,
        motivo: a.motivo,
        nuevoPrecio: a.nuevoPrecio,
        autor,
        aprobado: deGerencia,
      };

      if (!deGerencia) {
        return {
          ...e,
          adendas: [ad, ...e.adendas],
          registros: mapReg(e, a.registroId, (r) => ({
            ...r,
            historial: [
              ...r.historial,
              evento(
                e.ahora,
                "adenda",
                `${autor} generó la adenda ${ad.id} sobre «${p.rotulo}» (${a.dias} días${a.nuevoPrecio ? `, nuevo precio USD ${a.nuevoPrecio.toLocaleString("es-AR")}` : ""}). Pendiente de que gerencia le dé el alta; el plazo no se movió todavía.`,
                autor,
              ),
            ],
          })),
          avisos: avisar(e, `${ad.id} generada, marcada como nueva. Gerencia la ve en el expediente para darle el alta.`, "ok"),
        };
      }

      // La prórroga del papel corre desde la firma de la adenda; cuando gerencia
      // sólo corrige una fecha, se cuenta desde el vencimiento que había. Nunca
      // se acorta un plazo por una adenda: si el cálculo da antes de lo que ya
      // estaba, se mantiene el vencimiento vigente (siempre gana el que vence después).
      const propuesto = cierreDe(desde + a.dias * dia);
      const nuevo = Math.max(propuesto, p.vence);
      return {
        ...e,
        adendas: [ad, ...e.adendas],
        registros: mapReg(e, a.registroId, (r) => ({
          ...r,
          plazos: r.plazos.map((x) => (x.id === a.plazoId ? { ...x, vence: nuevo, movidoPor: ad.id } : x)),
          valores: a.nuevoPrecio ? { ...r.valores, precioOfertado: String(a.nuevoPrecio) } : r.valores,
          historial: [
            ...r.historial,
            evento(
              e.ahora,
              "adenda",
              `${ad.id} — «${p.rotulo}» se extiende ${a.dias} días, hasta el ${new Date(nuevo).toLocaleDateString("es-AR")}.${a.nuevoPrecio ? ` Nuevo precio USD ${a.nuevoPrecio.toLocaleString("es-AR")}.` : ""} ${a.motivo}`.trim(),
              ad.autor,
            ),
          ],
        })),
        avisos: avisar(e, `${ad.id} registrada. El plazo quedó corrido ${a.dias} días.`, "ok"),
      };
    }

    case "adenda.aprobar": {
      const ad = e.adendas.find((x) => x.id === a.adendaId);
      if (!ad || ad.aprobado) return e;
      const reg = e.registros.find((r) => r.id === ad.registroId);
      if (!reg) return e;
      const p = reg.plazos.find((x) => x.id === ad.plazoId);
      if (!p) return e;
      const propuesto = cierreDe(ad.desde + ad.diasExtension * dia);
      const nuevo = Math.max(propuesto, p.vence);
      return {
        ...e,
        adendas: e.adendas.map((x) => (x.id === ad.id ? { ...x, aprobado: true } : x)),
        registros: mapReg(e, ad.registroId, (r) => ({
          ...r,
          plazos: r.plazos.map((x) => (x.id === ad.plazoId ? { ...x, vence: nuevo, movidoPor: ad.id } : x)),
          valores: ad.nuevoPrecio ? { ...r.valores, precioOfertado: String(ad.nuevoPrecio) } : r.valores,
          historial: [
            ...r.historial,
            evento(
              e.ahora,
              "adenda",
              `Gerencia dio el alta a ${ad.id}. «${p.rotulo}» queda corrido hasta el ${new Date(nuevo).toLocaleDateString("es-AR")}.${ad.nuevoPrecio ? ` Nuevo precio USD ${ad.nuevoPrecio.toLocaleString("es-AR")}.` : ""}`,
              "Gerencia",
            ),
          ],
        })),
        avisos: avisar(e, `${ad.id} dada de alta. El plazo quedó corrido.`, "ok"),
      };
    }

    case "doc.enviar": {
      const reg = e.registros.find((r) => r.id === a.registroId);
      const texto =
        a.destino === "recepcion"
          ? `Documento enviado a recepción (${a.direccion}) para imprimir.`
          : `Documento enviado por correo a ${a.direccion}.`;
      return {
        ...e,
        registros: reg
          ? mapReg(e, a.registroId, (r) => ({
              ...r,
              historial: [...r.historial, evento(e.ahora, "nota", texto, "Asesor")],
            }))
          : e.registros,
        avisos: avisar(e, texto, "ok"),
      };
    }

    case "notificar.adenda": {
      const reg = e.registros.find((r) => r.id === a.registroId);
      if (!reg) return e;
      const asesor = e.asesores.find((x) => x.id === reg.asesorId)!;
      const plazo = reg.plazos.find((p) => p.id === a.plazoId);
      const texto = `Se le pidió a ${asesor.nombre} que genere la adenda de «${plazo?.rotulo}» para dejarla registrada.`;
      return {
        ...e,
        correos: [
          correo(
            e,
            "previo",
            `Falta la adenda · ${reg.id} · ${reg.direccion}`,
            `Hola ${asesor.nombre.split(" ")[0]}, gerencia movió el vencimiento de «${plazo?.rotulo}» de ${reg.direccion} al ${plazo ? new Date(plazo.vence).toLocaleDateString("es-AR") : ""}. Generá la adenda en el sistema para que quede registrada.`,
            [asesor.email],
            [EMAIL_GERENCIA],
            reg.id,
          ),
          ...e.correos,
        ],
        registros: mapReg(e, a.registroId, (r) => ({
          ...r,
          historial: [...r.historial, evento(e.ahora, "aviso", texto, "Gerencia")],
        })),
        avisos: avisar(e, `Correo enviado a ${asesor.nombre} pidiendo la adenda.`, "ok"),
      };
    }

    case "factura.set":
    case "factura.sumar": {
      const as = e.asesores.find((x) => x.id === a.asesorId);
      const suma = a.t === "factura.sumar";
      return {
        ...e,
        asesores: e.asesores.map((x) =>
          x.id === a.asesorId
            ? {
                ...x,
                facturacion: x.facturacion.map((v, i) =>
                  i === a.mes ? Math.max(0, suma ? v + a.monto : a.monto) : v,
                ),
              }
            : x,
        ),
        avisos: avisar(
          e,
          suma
            ? `Se sumó comisión a ${as?.nombre}.`
            : `Comisión de ${as?.nombre} actualizada.`,
          "ok",
        ),
      };
    }

    case "umbrales.set":
      return { ...e, umbrales: { ...e.umbrales, ...a.cambio } };

    case "regla.set":
      return { ...e, reglas: e.reglas.map((r) => (r.id === a.id ? { ...r, ...a.cambio } : r)) };

    case "regla.probar": {
      const r = e.reglas.find((x) => x.id === a.id);
      if (!r) return e;
      const asesor = e.asesores.find((x) => x.id === e.yo)!;
      const reg = e.registros.find((x) => x.estado === "vigente");
      const plazo = reg?.plazos.find((p) => !p.cumplido);
      const destinos: string[] = [];
      if (r.aAsesor) destinos.push(asesor.email);
      if (r.aGerencia && !r.gerenciaOculta) destinos.push(EMAIL_GERENCIA);
      const ocultos = r.aGerencia && r.gerenciaOculta ? [EMAIL_GERENCIA] : [];

      const guiones: Record<Regla["id"], [string, string]> = {
        previo: [
          `Vence en ${r.diasAntes} días · ${reg?.id} · ${reg?.direccion}`,
          `Hola ${asesor.nombre.split(" ")[0]}, en ${r.diasAntes} días vence el plazo «${plazo?.rotulo}» de ${reg?.direccion}. Si ya se firmó una adenda, cargala en el sistema.`,
        ],
        vencido: [
          `Plazo vencido · ${reg?.id} · ${reg?.direccion}`,
          `El plazo «${plazo?.rotulo}» de ${reg?.direccion} venció hoy. Verificar si hay adenda firmada o si las partes quedaron liberadas.`,
        ],
        resumen: [
          "Resumen semanal de vencimientos",
          `Esta semana vencen plazos en varias reservas y hay expedientes ya vencidos. Detalle completo en el panel de gerencia.`,
        ],
        contacto: [
          `Contacto pendiente · ${asesor.nombre}`,
          `Se cumplen ${asesor.topeContactoDias} días sin contacto con ${asesor.nombre}. Este aviso no le llega al asesor.`,
        ],
      };
      const [asunto, cuerpo] = guiones[a.id];
      const motivo: MotivoCorreo =
        a.id === "contacto" ? "contactoPrevio" : (a.id as MotivoCorreo);
      return {
        ...e,
        correos: [correo(e, motivo, asunto, cuerpo, destinos, ocultos, reg?.id), ...e.correos],
        avisos: avisar(e, "Correo de prueba generado. Quedó en la bandeja.", "ok"),
      };
    }

    case "contacto.registrar": {
      const as = e.asesores.find((x) => x.id === a.asesorId);
      return {
        ...e,
        asesores: e.asesores.map((x) => (x.id === a.asesorId ? { ...x, ultimoContacto: e.ahora } : x)),
        avisos: avisar(e, `Contacto con ${as?.nombre} registrado. El contador vuelve a cero.`, "ok"),
      };
    }

    case "contacto.tope":
      return {
        ...e,
        asesores: e.asesores.map((x) =>
          x.id === a.asesorId ? { ...x, topeContactoDias: Math.max(1, a.dias) } : x,
        ),
      };

    case "aviso.cerrar":
      return { ...e, avisos: e.avisos.filter((x) => x.id !== a.id) };

    default:
      return e;
  }
}

/* ── Contexto ───────────────────────────────────────────────── */

const Ctx = createContext<{ e: Estado; d: (a: Accion) => void } | null>(null);

export function Proveedor({ children }: { children: ReactNode }) {
  const [e, d] = useReducer(reducir, inicial);

  useEffect(() => {
    const t = setInterval(() => d({ t: "tic" }), 30_000);
    return () => clearInterval(t);
  }, []);

  const v = useMemo(() => ({ e, d }), [e]);
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp fuera del Proveedor");
  return c;
}

/* ── Derivados ──────────────────────────────────────────────── */

export type Urgencia = "vencida" | "hoy" | "semana" | "ok";

export function urgenciaDe(vence: number, ahora: number): Urgencia {
  const hs = (vence - ahora) / 3_600_000;
  if (hs < 0) return "vencida";
  if (hs <= 24) return "hoy";
  if (hs <= 168) return "semana";
  return "ok";
}

export interface PlazoVivo {
  registro: Registro;
  plazo: Plazo;
  urgencia: Urgencia;
  asesor: Asesor;
}

export type Semaforo = "alto" | "medio" | "bajo";

export interface Proyeccion {
  asesor: Asesor;
  /** Acumulado de los últimos 12 meses. */
  hoy: number;
  /** Acumulado si no cierra nada nuevo, a 3, 6, 9 y 12 meses. */
  tramos: { m: number; monto: number; estado: Semaforo }[];
  estadoHoy: Semaforo;
  /** Meses hasta caer en Low Performance. null si no cae en el horizonte. */
  mesesHastaBajo: number | null;
  /** Todavía no computa para RE/MAX. */
  nuevo: boolean;
  /** Deja de ser nuevo en menos de seis meses: conviene mirarlo ya. */
  porCumplir: boolean;
  mesesParaComputar: number;
  faltaParaSostener: number;
}

export const TRAMOS = [0, 3, 6, 9, 12] as const;

export function useDerivados() {
  const { e } = useApp();

  return useMemo(() => {
    const porId = new Map(e.asesores.map((a) => [a.id, a]));

    // Lo pendiente de alta no cuenta para métricas todavía; lo eliminado (baja
    // lógica) tampoco, aunque sigue existiendo con su historial intacto.
    const plazosVivos: PlazoVivo[] = e.registros
      .filter((r) => r.estado === "vigente" && r.aprobado)
      .flatMap((r) =>
        r.plazos
          .filter((p) => !p.cumplido)
          .map((p) => ({
            registro: r,
            plazo: p,
            urgencia: urgenciaDe(p.vence, e.ahora),
            asesor: porId.get(r.asesorId)!,
          })),
      )
      .sort((a, b) => a.plazo.vence - b.plazo.vence);

    const vencidos = plazosVivos.filter((p) => p.urgencia === "vencida");
    const hoy = plazosVivos.filter((p) => p.urgencia === "hoy");
    const semana = plazosVivos.filter((p) => p.urgencia === "semana");

    /** Primer plazo sin cumplir de cada expediente: lo que define su prioridad. */
    const proximoDe = (r: Registro): Plazo | undefined =>
      [...r.plazos].filter((p) => !p.cumplido).sort((a, b) => a.vence - b.vence)[0];

    const expedientes = [...e.registros].sort((a, b) => {
      const pa = proximoDe(a)?.vence ?? Infinity;
      const pb = proximoDe(b)?.vence ?? Infinity;
      return pa - pb;
    });

    const u = e.umbrales;
    const califica = (v: number): Semaforo => (v >= u.alto ? "alto" : v >= u.bajo ? "medio" : "bajo");
    const acumuladoEn = (f: number[], k: number) => f.slice(0, Math.max(0, 12 - k)).reduce((s, x) => s + x, 0);

    const proyecciones: Proyeccion[] = e.asesores.map((a) => {
      const hoyAcum = acumuladoEn(a.facturacion, 0);
      const tramos = TRAMOS.map((m) => {
        const monto = acumuladoEn(a.facturacion, m);
        return { m, monto, estado: califica(monto) };
      });
      let mesesHastaBajo: number | null = null;
      for (let k = 0; k <= 12; k++) {
        if (acumuladoEn(a.facturacion, k) < u.bajo) {
          mesesHastaBajo = k;
          break;
        }
      }
      const nuevo = a.antiguedadMeses < u.graciaMeses;
      return {
        asesor: a,
        hoy: hoyAcum,
        tramos,
        estadoHoy: califica(hoyAcum),
        mesesHastaBajo,
        nuevo,
        porCumplir: nuevo && a.antiguedadMeses >= u.graciaMeses - 6,
        mesesParaComputar: Math.max(0, u.graciaMeses - a.antiguedadMeses),
        faltaParaSostener: Math.max(0, u.bajo - acumuladoEn(a.facturacion, 9)),
      };
    });

    const computan = proyecciones.filter((p) => !p.nuevo);
    const seApagan = computan.filter(
      (p) => p.estadoHoy !== "bajo" && p.mesesHastaBajo !== null && p.mesesHastaBajo <= 6,
    );

    const contactoVencido = e.asesores.filter(
      (a) => (e.ahora - a.ultimoContacto) / dia >= a.topeContactoDias,
    );
    const contactoPorVencer = e.asesores.filter((a) => {
      const d = (e.ahora - a.ultimoContacto) / dia;
      const regla = e.reglas.find((r) => r.id === "contacto")!;
      return d < a.topeContactoDias && d >= a.topeContactoDias - regla.diasAntes;
    });

    /** Lo que las reglas activas dispararían en los próximos días. */
    const reglaPrevio = e.reglas.find((r) => r.id === "previo")!;
    const cola = plazosVivos
      .filter((p) => {
        const dias = (p.plazo.vence - e.ahora) / dia;
        if (!reglaPrevio.activa) return dias < 0;
        return dias <= reglaPrevio.diasAntes;
      })
      .map((p) => ({
        ...p,
        motivo: (p.plazo.vence < e.ahora ? "vencido" : "previo") as "vencido" | "previo",
      }));

    const facturacion12 = proyecciones.reduce((s, p) => s + p.hoy, 0);

    /** La reserva viva de un inmueble, si es que la tiene. Sólo puede haber una. */
    const reservaVigenteDe = (direccion: string, unidad: string) => {
      const clave = claveInmueble(direccion, unidad);
      return e.registros.find(
        (r) => r.estado === "vigente" && claveInmueble(r.direccion, r.unidad) === clave,
      );
    };

    /** Direcciones ya usadas por el asesor: sirven de sugerencia al tipear. */
    const direccionesDe = (asesorId: string) =>
      [...new Set(e.registros.filter((r) => r.asesorId === asesorId).map((r) => r.direccion))].sort();

    /** Lo que gerencia todavía tiene para revisar: altas, bajas y adendas nuevas. */
    const registrosNuevos = e.registros.filter((r) => !r.aprobado);
    const bajasPedidas = e.registros.filter((r) => r.bajaPedida);
    const adendasNuevas = e.adendas.filter((a) => !a.aprobado);
    const porRevisar = registrosNuevos.length + bajasPedidas.length + adendasNuevas.length;

    return {
      reservaVigenteDe,
      direccionesDe,
      plazosVivos,
      vencidos,
      hoy,
      semana,
      expedientes,
      proximoDe,
      proyecciones,
      computan,
      seApagan,
      contactoVencido,
      contactoPorVencer,
      cola,
      facturacion12,
      registrosNuevos,
      bajasPedidas,
      adendasNuevas,
      porRevisar,
    };
  }, [e]);
}

export function useAsesor(id: string) {
  const { e } = useApp();
  return e.asesores.find((a) => a.id === id);
}

export const MESES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

/** Etiqueta del mes con desplazamiento hacia atrás desde el corriente. */
export function rotuloMes(offset: number, ahora: number) {
  const d = new Date(ahora);
  d.setMonth(d.getMonth() - offset);
  return `${MESES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}
