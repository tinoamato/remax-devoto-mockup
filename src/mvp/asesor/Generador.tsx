import { useEffect, useMemo, useState } from "react";
import { EMAIL_RECEPCION, isoDia, type Jurisdiccion, type Operacion, type Registro, type Uso } from "../datos";
import {
  CAMPO_VIGENCIA,
  campoVisible,
  faltantes,
  fechaDia,
  plantillaPorId,
  plantillas,
  type Campo,
  type Plantilla,
} from "../plantillas";
import { Hoja, htmlDocumento, imprimirDocumento } from "../Documento";
import { useApp, useDerivados } from "../tienda";
import { useNav } from "../nav";
import { Boton, Etiqueta, Panel, Selector, Vacio } from "../../components/ui";
import { Icono } from "../../lib/icons";
import { cn } from "../../lib/format";

/* ── Encabezado de paso ─────────────────────────────────────── */

function Paso({
  n,
  titulo,
  detalle,
  hecho,
  resumen,
  alVolver,
  children,
}: {
  n: number;
  titulo: string;
  detalle?: string;
  hecho?: boolean;
  resumen?: string;
  alVolver?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <section className="border-b border-[var(--linea)] last:border-b-0">
      <header className="flex items-center gap-3 px-4 sm:px-5 py-3">
        <span
          className={cn(
            "num grid place-items-center size-6 rounded-full text-[11px] font-semibold shrink-0 border",
            hecho
              ? "bg-[var(--verde-tenue)] border-[var(--verde-borde)] text-[var(--verde)]"
              : "bg-[var(--sello-tenue)] border-[var(--sello-borde)] text-[var(--sello)]",
          )}
        >
          {hecho ? <Icono n="tilde" s={13} /> : n}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[13.5px] font-semibold leading-tight">{titulo}</h2>
          {hecho && resumen ? (
            <p className="text-[12px] text-[var(--tinta-media)] truncate">{resumen}</p>
          ) : (
            detalle && <p className="text-[12px] text-[var(--tinta-suave)]">{detalle}</p>
          )}
        </div>
        {hecho && alVolver && (
          <Boton chico tono="fantasma" onClick={alVolver}>
            Cambiar
          </Boton>
        )}
      </header>
      {children && <div className="px-4 sm:px-5 pb-4">{children}</div>}
    </section>
  );
}

/* ── Campo ──────────────────────────────────────────────────── */

const BASE_CAMPO =
  "w-full bg-[var(--papel-hundido)] border border-[var(--linea-fuerte)] rounded-[var(--r-sm)] " +
  "px-2.5 text-[13px] text-[var(--tinta)] placeholder:text-[var(--tinta-tenue)] " +
  "focus:bg-[var(--papel-alto)] focus:border-[var(--sello)] outline-none transition-colors duration-[140ms]";

function PreguntaCampo({
  c,
  valor,
  bloqueado,
  opciones,
  sugerencias,
  alCambiar,
}: {
  c: Campo;
  valor: string;
  bloqueado?: boolean;
  opciones?: string[];
  sugerencias?: string[];
  alCambiar: (v: string) => void;
}) {
  const sufijo =
    c.tipo === "moneda" ? "USD" : c.tipo === "dias" ? "días" : c.tipo === "porcentaje" ? "%" : null;
  // Las opciones dinámicas mandan: las de la plantilla pueden venir vacías a propósito.
  const lista = opciones ?? c.opciones ?? [];
  const listaId = sugerencias?.length ? `sug-${c.id}` : undefined;

  return (
    <label className="block">
      <span className="flex items-baseline gap-2 mb-1">
        <span className="text-[12.5px] font-medium text-[var(--tinta)]">{c.pregunta}</span>
        {c.requerido && !bloqueado && <span className="text-[11px] text-[var(--lacre)]">obligatorio</span>}
        {bloqueado && <span className="text-[10.5px] text-[var(--tinta-tenue)] ml-auto">viene de la reserva</span>}
      </span>
      {c.ayuda && <span className="block text-[11.5px] text-[var(--tinta-suave)] mb-1.5">{c.ayuda}</span>}

      {c.tipo === "parrafo" ? (
        <textarea
          value={valor}
          onChange={(ev) => alCambiar(ev.target.value)}
          rows={3}
          placeholder="Opcional. Se imprime al pie del documento."
          className={cn(BASE_CAMPO, "py-2 resize-y leading-relaxed")}
        />
      ) : c.tipo === "opcion" ? (
        <select
          value={valor}
          disabled={bloqueado}
          onChange={(ev) => alCambiar(ev.target.value)}
          className={cn(BASE_CAMPO, "h-9 pr-7 appearance-none cursor-pointer disabled:opacity-70")}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2378746A' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='m4 6.5 4 4 4-4'/></svg>\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 7px center",
          }}
        >
          <option value="">Elegí una opción…</option>
          {lista.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : c.tipo === "fecha" ? (
        <input
          type="date"
          value={valor}
          onChange={(ev) => alCambiar(ev.target.value)}
          className={cn(BASE_CAMPO, "num h-9")}
        />
      ) : (
        <span className="relative block">
          <input
            value={valor}
            list={listaId}
            readOnly={bloqueado}
            onChange={(ev) => alCambiar(ev.target.value)}
            inputMode={c.tipo === "texto" ? undefined : "numeric"}
            className={cn(
              BASE_CAMPO,
              "h-9",
              sufijo && "pr-12",
              c.tipo !== "texto" && "num",
              bloqueado && "opacity-70 cursor-default",
            )}
          />
          {listaId && (
            <datalist id={listaId}>
              {sugerencias!.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          )}
          {sufijo && (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[var(--tinta-tenue)] pointer-events-none">
              {sufijo}
            </span>
          )}
        </span>
      )}
    </label>
  );
}

/* ── Plazos previstos ───────────────────────────────────────── */

function PlazosPrevistos({
  plantilla,
  valores,
  desde,
}: {
  plantilla: Plantilla;
  valores: Record<string, string>;
  desde: number;
}) {
  if (!plantilla.plazos.length) return null;

  const filas = plantilla.plazos
    .filter((p) => campoVisible(p, valores))
    .map((p) => ({ ...p, dias: Number(valores[p.campoDias] ?? "") }))
    .filter((p) => Number.isFinite(p.dias) && p.dias > 0)
    .sort((a, b) => a.dias - b.dias);

  const hoy = new Date().setHours(0, 0, 0, 0);
  const retro = desde < hoy;

  return (
    <div className="rounded-[var(--r-sm)] border border-[var(--sello-borde)] bg-[var(--sello-tenue)]/50 px-3 py-2.5">
      <p className="rotulo" style={{ color: "var(--sello)" }}>
        Plazos que van a quedar vigilados
      </p>
      {retro && (
        <p className="text-[11.5px] text-[var(--ambar)] mt-1">
          La vigencia arranca antes de hoy, así que parte del plazo ya corrió.
        </p>
      )}
      {filas.length === 0 ? (
        <p className="text-[12px] text-[var(--tinta-suave)] mt-1">
          Completá los días y acá vas a ver las fechas exactas.
        </p>
      ) : (
        <ul className="mt-1.5 space-y-1">
          {filas.map((f) => (
            <li key={f.id} className="flex items-baseline gap-2 text-[12.5px]">
              <span className="text-[var(--tinta-media)] flex-1 min-w-0 truncate">{f.rotulo}</span>
              <span className="num text-[var(--tinta-tenue)]">{f.dias} d</span>
              <span className="num font-semibold text-[var(--tinta)]">
                {new Date(desde + f.dias * 86_400_000).toLocaleDateString("es-AR", {
                  weekday: "short",
                  day: "2-digit",
                  month: "2-digit",
                })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── Vista ──────────────────────────────────────────────────── */

const JURISDICCIONES: Jurisdiccion[] = ["CABA", "PBA"];
const OPERACIONES: Operacion[] = ["Venta", "Alquiler"];
const USOS: Uso[] = ["Residencial", "Comercial"];

export default function Generador() {
  const { e, d } = useApp();
  const nav = useNav();
  const { reservaVigenteDe, direccionesDe } = useDerivados();

  const [jur, setJur] = useState<Jurisdiccion>("CABA");
  const [op, setOp] = useState<Operacion>("Venta");
  const [uso, setUso] = useState<Uso>("Residencial");
  const [contextoListo, setContextoListo] = useState(false);
  const [plantillaId, setPlantillaId] = useState<string | null>(null);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [enviado, setEnviado] = useState<string | null>(null);
  const [registrado, setRegistrado] = useState<"documento" | "adenda" | null>(null);
  const [intento, setIntento] = useState(false);
  /** Reserva madre cuando se entra a hacer una adenda. */
  const [reservaMadre, setReservaMadre] = useState<Registro | null>(null);

  const yo = e.asesores.find((a) => a.id === e.yo)!;
  const plantilla = plantillaId ? plantillaPorId(plantillaId) : null;
  const sugerencias = useMemo(() => direccionesDe(e.yo), [direccionesDe, e.yo]);

  const disponibles = useMemo(
    () =>
      plantillas.filter(
        (p) => !p.esAdenda && p.jurisdiccion === jur && p.operacion === op && p.uso === uso,
      ),
    [jur, op, uso],
  );

  function precargar(p: Plantilla, madre: Registro | null) {
    const v: Record<string, string> = {};
    for (const s of p.secciones)
      for (const c of s.campos) v[c.id] = c.tipo === "fecha" ? isoDia(Date.now()) : (c.sugerido ?? "");
    if (madre) {
      v.registroPadre = madre.id;
      v.direccion = madre.direccion;
      v.unidad = madre.unidad;
      v.oferente = madre.contraparte;
    }
    setValores(v);
  }

  function elegirPlantilla(p: Plantilla) {
    setPlantillaId(p.id);
    setIntento(false);
    precargar(p, null);
  }

  // Entrada por "extender con adenda": documento y reserva quedan fijos.
  useEffect(() => {
    if (!nav.encargo) return;
    const p = plantillaPorId(nav.encargo.plantillaId);
    const madre = e.registros.find((r) => r.id === nav.encargo!.registroId) ?? null;
    nav.limpiarEncargo();
    if (!p || !madre) return;
    setReservaMadre(madre);
    setJur(madre.jurisdiccion);
    setContextoListo(true);
    setPlantillaId(p.id);
    setRegistrado(null);
    setIntento(false);
    precargar(p, madre);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav.encargo]);

  const esAdenda = Boolean(plantilla?.esAdenda);

  function opcionesDinamicas(c: Campo): string[] | undefined {
    if (c.id === "registroPadre") return reservaMadre ? [reservaMadre.id] : [];
    if (c.id === "plazoAfectado")
      return reservaMadre?.plazos.filter((p) => !p.cumplido).map((p) => p.rotulo);
    return undefined;
  }

  const desdeVigencia = useMemo(() => {
    const iso = valores[CAMPO_VIGENCIA];
    if (!iso) return Date.now();
    const [a, m, dd] = iso.split("-").map(Number);
    return a && m && dd ? new Date(a, m - 1, dd).getTime() : Date.now();
  }, [valores]);

  /** El choque de reservas se avisa antes de registrar, no después. */
  const choque = useMemo(() => {
    if (!plantilla || esAdenda) return null;
    const dir = (valores.direccion ?? "").trim();
    if (!dir) return null;
    return reservaVigenteDe(dir, (valores.unidad ?? "").trim()) ?? null;
  }, [plantilla, esAdenda, valores.direccion, valores.unidad, reservaVigenteDe]);

  const pendientes = plantilla ? faltantes(plantilla, valores) : [];
  const listo = plantilla !== null && pendientes.length === 0 && !choque;

  function reiniciar() {
    setContextoListo(false);
    setPlantillaId(null);
    setValores({});
    setRegistrado(null);
    setEnviado(null);
    setIntento(false);
    setReservaMadre(null);
  }

  function registrar() {
    if (!plantilla) return;
    if (!listo) {
      setIntento(true);
      return;
    }
    d({ t: "registro.crear", plantillaId: plantilla.id, valores });
    setRegistrado(esAdenda ? "adenda" : "documento");
  }

  /* Acuse */
  if (registrado) {
    const ultimo = e.registros[0];
    return (
      <div className="h-full overflow-y-auto scroll p-4">
        <Panel className="max-w-[560px] mx-auto">
          <div className="px-5 py-6 text-center">
            <span className="grid place-items-center size-11 mx-auto rounded-full bg-[var(--verde-tenue)] border border-[var(--verde-borde)] text-[var(--verde)]">
              <Icono n="tilde" s={20} />
            </span>
            <h2 className="text-[15px] font-semibold mt-3">
              {registrado === "adenda" ? "Adenda registrada" : "Documento registrado"}
            </h2>
            <p className="text-[12.5px] text-[var(--tinta-suave)] mt-1 max-w-[42ch] mx-auto">
              {registrado === "adenda"
                ? "El plazo de la reserva quedó corrido y anotado en el historial. Gerencia lo ve al instante."
                : "Gerencia ya lo ve en el panel de vencimientos, con la propiedad, tu nombre y los plazos corriendo."}
            </p>

            {registrado === "documento" && ultimo && (
              <div className="mt-4 text-left rounded-[var(--r-sm)] border border-[var(--linea)] bg-[var(--papel-hundido)]/50 px-3 py-2.5">
                <p className="exp">{ultimo.id}</p>
                <p className="text-[13px] font-medium mt-0.5">
                  {ultimo.direccion} {ultimo.unidad && `· ${ultimo.unidad}`}
                </p>
                <p className="num text-[11px] text-[var(--tinta-tenue)] mt-0.5">
                  Vigencia desde el {new Date(ultimo.vigenciaDesde).toLocaleDateString("es-AR")}
                </p>
                <ul className="mt-2 space-y-1">
                  {[...ultimo.plazos]
                    .sort((a, b) => a.vence - b.vence)
                    .map((p) => (
                      <li key={p.id} className="flex items-baseline gap-2 text-[12.5px]">
                        <span className="flex-1 text-[var(--tinta-media)]">{p.rotulo}</span>
                        <span className="num font-semibold">{fechaDia(p.vence)}</span>
                      </li>
                    ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
              <Boton tono="primario" ico="mas" onClick={reiniciar}>
                Generar otro documento
              </Boton>
              <Boton ico="expediente" onClick={() => nav.irAsesor("registros")}>
                Ver mis documentos
              </Boton>
            </div>
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scroll">
      <div className="p-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] items-start max-w-[1280px] mx-auto">
        <Panel>
          {/* Paso 1 — contexto */}
          {reservaMadre ? (
            <Paso
              n={1}
              titulo="Adenda sobre una reserva"
              hecho
              resumen={`${reservaMadre.id} · ${reservaMadre.direccion}${reservaMadre.unidad ? ` · ${reservaMadre.unidad}` : ""}`}
              alVolver={reiniciar}
            >
              <p className="flex items-start gap-1.5 text-[12px] text-[var(--tinta-suave)]">
                <Icono n="candado" s={13} className="mt-[2px] shrink-0" />
                La adenda queda atada a esta reserva. No se puede cambiar la propiedad ni elegir otro documento.
              </p>
            </Paso>
          ) : (
            <Paso
              n={1}
              titulo="¿Dónde está la propiedad?"
              detalle="Con esto sabemos qué documentos ofrecerte. Los datos del inmueble se completan más abajo."
              hecho={contextoListo}
              resumen={`${jur} · ${op} ${uso.toLowerCase()}`}
              alVolver={contextoListo ? reiniciar : undefined}
            >
              {!contextoListo && (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <Selector
                      rotulo="Jurisdicción"
                      value={jur}
                      onChange={(ev) => setJur(ev.target.value as Jurisdiccion)}
                    >
                      {JURISDICCIONES.map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </Selector>
                    <Selector rotulo="Operación" value={op} onChange={(ev) => setOp(ev.target.value as Operacion)}>
                      {OPERACIONES.map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </Selector>
                    <Selector rotulo="Uso" value={uso} onChange={(ev) => setUso(ev.target.value as Uso)}>
                      {USOS.map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </Selector>
                  </div>
                  <Boton tono="primario" className="mt-3 w-full" onClick={() => setContextoListo(true)}>
                    Ver los documentos de {jur}
                  </Boton>
                </>
              )}
            </Paso>
          )}

          {/* Paso 2 — documento */}
          {contextoListo && (
            <Paso
              n={2}
              titulo="¿Qué documento necesitás?"
              hecho={plantilla !== null}
              resumen={plantilla?.nombre}
              alVolver={
                plantilla !== null && !reservaMadre
                  ? () => {
                      setPlantillaId(null);
                      setValores({});
                    }
                  : undefined
              }
            >
              {plantilla === null && (
                <>
                  <p className="flex items-start gap-1.5 text-[12px] text-[var(--tinta-suave)] mb-2.5">
                    <Icono n="filtro" s={13} className="mt-[3px] shrink-0" />
                    Sólo se muestran los documentos de {jur} para {op.toLowerCase()} {uso.toLowerCase()}.
                    Para extender una reserva con adenda, entrá desde Mis documentos.
                  </p>
                  <ul className="grid gap-1.5">
                    {disponibles.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => elegirPlantilla(p)}
                          className="w-full flex items-start gap-3 px-3 py-2.5 text-left rounded-[var(--r-sm)] border border-[var(--linea)] bg-[var(--papel-alto)] hover:border-[var(--sello)] hover:bg-[var(--sello-tenue)]/40 transition-colors"
                        >
                          <Icono n="documento" s={16} className="text-[var(--tinta-tenue)] mt-[2px]" />
                          <span className="min-w-0 flex-1">
                            <span className="block text-[13px] font-medium">{p.nombre}</span>
                            <span className="block text-[11.5px] text-[var(--tinta-tenue)]">{p.resumen}</span>
                          </span>
                          <Icono n="chevDer" s={15} className="text-[var(--tinta-tenue)] mt-[2px]" />
                        </button>
                      </li>
                    ))}
                    {disponibles.length === 0 && (
                      <li className="text-[12.5px] text-[var(--tinta-suave)]">
                        No hay documentos cargados para esta combinación todavía.
                      </li>
                    )}
                  </ul>
                </>
              )}
            </Paso>
          )}

          {/* Paso 3 — preguntas */}
          {plantilla && (
            <Paso
              n={3}
              titulo="Completá los datos"
              detalle="Las preguntas cambian según el documento. Lo que ya viene cargado no hace falta tocarlo."
            >
              <div className="space-y-5">
                {plantilla.secciones.map((s) => {
                  const campos = s.campos.filter((c) => campoVisible(c, valores));
                  if (!campos.length) return null;
                  return (
                    <fieldset key={s.id}>
                      <legend className="rotulo mb-2">{s.titulo}</legend>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {campos.map((c) => (
                          <div key={c.id} className={c.tipo === "parrafo" ? "sm:col-span-2" : undefined}>
                            <PreguntaCampo
                              c={c}
                              valor={valores[c.id] ?? ""}
                              bloqueado={
                                Boolean(reservaMadre) &&
                                ["registroPadre", "direccion", "unidad"].includes(c.id)
                              }
                              opciones={opcionesDinamicas(c)}
                              sugerencias={c.id === "direccion" && !reservaMadre ? sugerencias : undefined}
                              alCambiar={(v) => setValores((x) => ({ ...x, [c.id]: v }))}
                            />
                          </div>
                        ))}
                      </div>
                    </fieldset>
                  );
                })}

                {choque && (
                  <div className="rounded-[var(--r-sm)] border border-[var(--lacre-borde)] bg-[var(--lacre-tenue)] px-3 py-2.5">
                    <p className="flex items-start gap-1.5 text-[12.5px] text-[var(--lacre)] font-medium">
                      <Icono n="alerta" s={14} className="mt-[2px] shrink-0" />
                      Esa propiedad ya tiene la reserva {choque.id} vigente
                    </p>
                    <p className="text-[12px] text-[var(--tinta-media)] mt-1">
                      Una propiedad sólo puede tener una reserva a la vez. Si la operación anterior se cayó,
                      gerencia tiene que darla de baja. Si lo que querés es correr el plazo, hacé una adenda.
                    </p>
                    <Boton chico ico="agenda" className="mt-2" onClick={() => nav.irAsesor("registros")}>
                      Ir a mis documentos
                    </Boton>
                  </div>
                )}

                <PlazosPrevistos plantilla={plantilla} valores={valores} desde={desdeVigencia} />

                {intento && pendientes.length > 0 && (
                  <p className="flex items-start gap-1.5 text-[12.5px] text-[var(--lacre)]">
                    <Icono n="alerta" s={14} className="mt-[2px] shrink-0" />
                    Faltan {pendientes.length} respuestas: {pendientes.map((p) => p.pregunta).join(" · ")}
                  </p>
                )}
              </div>
            </Paso>
          )}
        </Panel>

        {/* Documento */}
        {plantilla ? (
          <Panel className="lg:sticky lg:top-0">
            <header className="flex items-center gap-2 h-9 px-3 border-b border-[var(--linea-suave)] bg-[var(--papel-hundido)]/60">
              <h2 className="rotulo">Así queda el documento</h2>
              {pendientes.length > 0 ? (
                <Etiqueta t="hoy" className="ml-auto">
                  faltan {pendientes.length}
                </Etiqueta>
              ) : (
                <Etiqueta t="ok" className="ml-auto">
                  completo
                </Etiqueta>
              )}
            </header>

            <div className="max-h-[52vh] lg:max-h-[calc(100dvh-260px)] overflow-y-auto scroll bg-[var(--papel-hundido)]/40 p-3">
              <div className="alza rounded-[var(--r-sm)] overflow-hidden">
                <Hoja plantilla={plantilla} valores={valores} ahora={e.ahora} compacta />
              </div>
            </div>

            <footer className="border-t border-[var(--linea-suave)] p-3 bg-[var(--papel-alto)]">
              <div className="flex flex-wrap gap-1.5">
                <Boton
                  chico
                  ico="imprimir"
                  onClick={() => imprimirDocumento(htmlDocumento(plantilla, valores, e.ahora))}
                >
                  Imprimir o guardar PDF
                </Boton>
                <Boton
                  chico
                  ico="enviar"
                  onClick={() => {
                    setEnviado(EMAIL_RECEPCION);
                    d({ t: "doc.enviar", registroId: "", destino: "recepcion", direccion: EMAIL_RECEPCION });
                  }}
                >
                  Enviar a recepción
                </Boton>
                <Boton
                  chico
                  ico="correo"
                  onClick={() => {
                    const dir = valores.emailOferente || "el cliente";
                    setEnviado(dir);
                    d({ t: "doc.enviar", registroId: "", destino: "cliente", direccion: dir });
                  }}
                >
                  Enviar por correo
                </Boton>
              </div>

              {enviado && (
                <p className="flex items-center gap-1.5 text-[11.5px] text-[var(--verde)] mt-2">
                  <Icono n="tilde" s={12} />
                  Enviado a {enviado}.
                </p>
              )}

              <div className="mt-3 pt-3 border-t border-[var(--linea-suave)]">
                <Boton tono="primario" ico="expediente" className="w-full" onClick={registrar}>
                  Registrar
                </Boton>
                <p className="text-[11.5px] text-[var(--tinta-suave)] mt-1.5 leading-snug">
                  Registrar es lo que hace que gerencia vea la operación y que empiecen a correr los plazos.
                  Imprimir o enviar por correo no la registra.
                </p>
              </div>
            </footer>
          </Panel>
        ) : (
          <Panel className="hidden lg:block">
            <Vacio
              ico="documento"
              titulo="Todavía no hay documento"
              detalle={
                contextoListo
                  ? "Elegí el documento y vas a ver acá cómo queda, con tus respuestas ya adentro del texto."
                  : `${yo.nombre.split(" ")[0]}, decinos dónde está la propiedad y te mostramos los documentos que corresponden.`
              }
            />
          </Panel>
        )}
      </div>
    </div>
  );
}
