import { useEffect, useMemo, useState } from "react";
import {
  EMAIL_RECEPCION,
  propiedades,
  type Jurisdiccion,
  type Operacion,
  type Propiedad,
  type Uso,
} from "../datos";
import {
  camposVivos,
  fechaDia,
  campoVisible,
  faltantes,
  plantillaPorId,
  plantillas,
  type Campo,
  type Plantilla,
} from "../plantillas";
import { Hoja, htmlDocumento, imprimirDocumento } from "../Documento";
import { useApp } from "../tienda";
import { useNav } from "../nav";
import { Boton, Campo as CampoTexto, Etiqueta, Panel, Selector, Vacio } from "../../components/ui";
import { Icono } from "../../lib/icons";
import { cn, usd } from "../../lib/format";

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

/* ── Paso 1 · propiedad ─────────────────────────────────────── */

function ElegirPropiedad({
  mias,
  alElegir,
  alManual,
}: {
  mias: Propiedad[];
  alElegir: (p: Propiedad) => void;
  alManual: () => void;
}) {
  const [q, setQ] = useState("");
  const filtradas = mias.filter(
    (p) =>
      !q.trim() ||
      `${p.direccion} ${p.unidad} ${p.barrio}`.toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <>
      <CampoTexto
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar entre mis propiedades…"
        aria-label="Buscar propiedad"
        className="mb-2.5"
      />
      <ul className="space-y-1.5">
        {filtradas.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => alElegir(p)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-[var(--r-sm)] border border-[var(--linea)] bg-[var(--papel-alto)] hover:border-[var(--sello)] hover:bg-[var(--sello-tenue)]/40 transition-colors"
            >
              <Icono n="edificio" s={16} className="text-[var(--tinta-tenue)]" />
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium truncate">
                  {p.direccion}
                  {p.unidad && <span className="text-[var(--tinta-suave)]"> · {p.unidad}</span>}
                </span>
                <span className="block text-[11.5px] text-[var(--tinta-tenue)]">
                  {p.barrio} · {p.jurisdiccion} · {p.operacion} {p.uso.toLowerCase()} · {usd(p.precio)}
                </span>
              </span>
              <Icono n="chevDer" s={15} className="text-[var(--tinta-tenue)]" />
            </button>
          </li>
        ))}
        {filtradas.length === 0 && (
          <li className="text-[12.5px] text-[var(--tinta-suave)] px-1 py-2">
            Ninguna propiedad coincide con esa búsqueda.
          </li>
        )}
      </ul>
      <button
        type="button"
        onClick={alManual}
        className="mt-2.5 w-full flex items-center gap-2 px-3 py-2.5 rounded-[var(--r-sm)] border border-dashed border-[var(--linea-fuerte)] text-[12.5px] text-[var(--tinta-suave)] hover:text-[var(--tinta)] hover:border-[var(--tinta-tenue)] transition-colors"
      >
        <Icono n="mas" s={14} />
        La propiedad no está cargada — escribo los datos a mano
      </button>
    </>
  );
}

/* ── Paso 2 · documento ─────────────────────────────────────── */

function ElegirDocumento({
  disponibles,
  contexto,
  alElegir,
}: {
  disponibles: Plantilla[];
  contexto: string;
  alElegir: (p: Plantilla) => void;
}) {
  return (
    <>
      <p className="flex items-start gap-1.5 text-[12px] text-[var(--tinta-suave)] mb-2.5">
        <Icono n="filtro" s={13} className="mt-[3px] shrink-0" />
        {contexto}
      </p>
      <ul className="grid gap-1.5">
        {disponibles.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => alElegir(p)}
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
  );
}

/* ── Paso 3 · las preguntas ─────────────────────────────────── */

function PreguntaCampo({
  c,
  valor,
  auto,
  opciones,
  alCambiar,
}: {
  c: Campo;
  valor: string;
  auto: boolean;
  opciones?: string[];
  alCambiar: (v: string) => void;
}) {
  const sufijo =
    c.tipo === "moneda" ? "USD" : c.tipo === "dias" ? "días" : c.tipo === "porcentaje" ? "%" : null;

  const base =
    "w-full bg-[var(--papel-hundido)] border border-[var(--linea-fuerte)] rounded-[var(--r-sm)] " +
    "px-2.5 text-[13px] text-[var(--tinta)] placeholder:text-[var(--tinta-tenue)] " +
    "focus:bg-[var(--papel-alto)] focus:border-[var(--sello)] outline-none transition-colors duration-[140ms]";

  const lista = c.opciones ?? opciones ?? [];

  return (
    <label className="block">
      <span className="flex items-baseline gap-2 mb-1">
        <span className="text-[12.5px] font-medium text-[var(--tinta)]">{c.pregunta}</span>
        {c.requerido && <span className="text-[11px] text-[var(--lacre)]">obligatorio</span>}
        {auto && (
          <span className="text-[10.5px] text-[var(--tinta-tenue)] ml-auto">viene de la propiedad</span>
        )}
      </span>
      {c.ayuda && <span className="block text-[11.5px] text-[var(--tinta-suave)] mb-1.5">{c.ayuda}</span>}

      {c.tipo === "parrafo" ? (
        <textarea
          value={valor}
          onChange={(e) => alCambiar(e.target.value)}
          rows={3}
          placeholder="Opcional. Se imprime al pie del documento."
          className={cn(base, "py-2 resize-y leading-relaxed")}
        />
      ) : c.tipo === "opcion" ? (
        <select
          value={valor}
          onChange={(e) => alCambiar(e.target.value)}
          className={cn(base, "h-9 pr-7 appearance-none cursor-pointer")}
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
      ) : (
        <span className="relative block">
          <input
            value={valor}
            onChange={(e) => alCambiar(e.target.value)}
            inputMode={c.tipo === "texto" ? undefined : "numeric"}
            className={cn(base, "h-9", sufijo && "pr-12", (c.tipo !== "texto") && "num")}
          />
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

/** Las fechas que van a quedar corriendo. Se actualiza mientras escribe. */
function PlazosPrevistos({
  plantilla,
  valores,
  ahora,
}: {
  plantilla: Plantilla;
  valores: Record<string, string>;
  ahora: number;
}) {
  const filas = plantilla.plazos
    .filter((p) => campoVisible(p, valores))
    .map((p) => ({ ...p, dias: Number(valores[p.campoDias] ?? "") }))
    .filter((p) => Number.isFinite(p.dias) && p.dias > 0)
    .sort((a, b) => a.dias - b.dias);

  if (!plantilla.plazos.length) return null;

  return (
    <div className="rounded-[var(--r-sm)] border border-[var(--sello-borde)] bg-[var(--sello-tenue)]/50 px-3 py-2.5">
      <p className="rotulo" style={{ color: "var(--sello)" }}>
        Plazos que van a quedar vigilados
      </p>
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
                {new Date(ahora + f.dias * 86_400_000).toLocaleDateString("es-AR", {
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

export default function Generador() {
  const { e, d } = useApp();
  const nav = useNav();

  const [propId, setPropId] = useState<string | null>(null);
  const [manual, setManual] = useState(false);
  const [manualJur, setManualJur] = useState<Jurisdiccion>("CABA");
  const [manualOp, setManualOp] = useState<Operacion>("Venta");
  const [manualUso, setManualUso] = useState<Uso>("Residencial");
  const [plantillaId, setPlantillaId] = useState<string | null>(null);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [enviado, setEnviado] = useState<string | null>(null);
  const [registrado, setRegistrado] = useState<string | null>(null);
  const [intento, setIntento] = useState(false);

  const yo = e.asesores.find((a) => a.id === e.yo)!;
  const mias = useMemo(
    () => propiedades.filter((p) => p.asesorId === e.yo),
    [e.yo],
  );
  const prop = propiedades.find((p) => p.id === propId) ?? null;
  const plantilla = plantillaId ? plantillaPorId(plantillaId) : null;

  /** Reservas vivas de esta propiedad: habilitan la adenda. */
  const reservasDeLaProp = useMemo(
    () =>
      e.registros.filter(
        (r) => r.estado === "vigente" && r.propiedadId === propId && r.asesorId === e.yo,
      ),
    [e.registros, propId, e.yo],
  );

  const jur = prop?.jurisdiccion ?? manualJur;
  const op = prop?.operacion ?? manualOp;
  const uso = prop?.uso ?? manualUso;

  const disponibles = useMemo(() => {
    const base = plantillas.filter(
      (p) => !p.esAdenda && p.jurisdiccion === jur && p.operacion === op && p.uso === uso,
    );
    const ad = plantillas.find((p) => p.esAdenda);
    return reservasDeLaProp.length && ad ? [...base, ad] : base;
  }, [jur, op, uso, reservasDeLaProp.length]);

  // Si gerencia mandó a generar una plantilla puntual, la dejamos lista.
  useEffect(() => {
    if (nav.plantillaSugerida) {
      setPlantillaId(nav.plantillaSugerida);
      nav.limpiarSugerida();
    }
  }, [nav]);

  function elegirPlantilla(p: Plantilla) {
    setPlantillaId(p.id);
    setIntento(false);
    const v: Record<string, string> = {};
    for (const s of p.secciones)
      for (const c of s.campos) {
        if (c.auto && prop) {
          const desde: Record<string, string> = {
            direccion: prop.direccion,
            unidad: prop.unidad,
            barrio: prop.barrio,
            propietario: prop.propietario,
            precio: String(prop.precio),
          };
          v[c.id] = desde[c.auto] ?? "";
        } else if (c.sugerido) v[c.id] = c.sugerido;
        else v[c.id] = "";
      }
    if (p.esAdenda) {
      // La adenda no pregunta por el inmueble: lo hereda de la reserva de origen.
      if (reservasDeLaProp[0]) v.registroPadre = reservasDeLaProp[0].id;
      if (prop) {
        v.direccion = prop.direccion;
        v.unidad = prop.unidad;
      }
    }
    setValores(v);
  }

  function opcionesDinamicas(c: Campo): string[] | undefined {
    if (c.id === "registroPadre") return reservasDeLaProp.map((r) => r.id);
    if (c.id === "plazoAfectado") {
      const r = e.registros.find((x) => x.id === valores.registroPadre);
      return r?.plazos.filter((p) => !p.cumplido).map((p) => p.rotulo);
    }
    return undefined;
  }

  const pendientes = plantilla ? faltantes(plantilla, valores) : [];
  const listo = plantilla !== null && pendientes.length === 0;

  function reiniciar() {
    setPropId(null);
    setManual(false);
    setPlantillaId(null);
    setValores({});
    setRegistrado(null);
    setEnviado(null);
    setIntento(false);
  }

  function registrar() {
    if (!plantilla) return;
    if (!listo) {
      setIntento(true);
      return;
    }
    const antes = e.registros.length;
    d({ t: "registro.crear", plantillaId: plantilla.id, propiedadId: propId, valores });
    // El id real lo asigna la tienda; para el acuse alcanza con marcar el envío.
    setRegistrado(plantilla.esAdenda ? "adenda" : String(antes));
  }

  const paso1Hecho = propId !== null || manual;
  const paso2Hecho = plantilla !== null;

  /* Acuse de registro */
  if (registrado !== null) {
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

            {registrado !== "adenda" && ultimo && (
              <div className="mt-4 text-left rounded-[var(--r-sm)] border border-[var(--linea)] bg-[var(--papel-hundido)]/50 px-3 py-2.5">
                <p className="exp">{ultimo.id}</p>
                <p className="text-[13px] font-medium mt-0.5">
                  {ultimo.direccion} {ultimo.unidad && `· ${ultimo.unidad}`}
                </p>
                <ul className="mt-2 space-y-1">
                  {[...ultimo.plazos]
                    .sort((a, b) => a.vence - b.vence)
                    .map((p) => (
                      <li key={p.id} className="flex items-baseline gap-2 text-[12.5px]">
                        <span className="flex-1 text-[var(--tinta-media)]">{p.rotulo}</span>
                        <span className="num font-semibold">
                          {fechaDia(p.vence)}
                        </span>
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
        {/* Columna de trabajo */}
        <Panel>
          <Paso
            n={1}
            titulo="¿Sobre qué propiedad?"
            detalle="Elegí una de tus propiedades y el documento se completa solo con sus datos."
            hecho={paso1Hecho}
            resumen={
              prop
                ? `${prop.direccion}${prop.unidad ? ` · ${prop.unidad}` : ""} — ${prop.jurisdiccion}`
                : "Datos cargados a mano"
            }
            alVolver={paso1Hecho ? reiniciar : undefined}
          >
            {!paso1Hecho && (
              <ElegirPropiedad
                mias={mias}
                alElegir={(p) => {
                  setPropId(p.id);
                  setManual(false);
                }}
                alManual={() => {
                  setManual(true);
                  setPropId(null);
                }}
              />
            )}
            {manual && !plantilla && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                <Selector
                  rotulo="Jurisdicción"
                  value={manualJur}
                  onChange={(ev) => setManualJur(ev.target.value as Jurisdiccion)}
                >
                  <option>CABA</option>
                  <option>PBA</option>
                </Selector>
                <Selector
                  rotulo="Operación"
                  value={manualOp}
                  onChange={(ev) => setManualOp(ev.target.value as Operacion)}
                >
                  <option>Venta</option>
                  <option>Alquiler</option>
                </Selector>
                <Selector rotulo="Uso" value={manualUso} onChange={(ev) => setManualUso(ev.target.value as Uso)}>
                  <option>Residencial</option>
                  <option>Comercial</option>
                </Selector>
              </div>
            )}
          </Paso>

          {paso1Hecho && (
            <Paso
              n={2}
              titulo="¿Qué documento necesitás?"
              hecho={paso2Hecho}
              resumen={plantilla?.nombre}
              alVolver={
                paso2Hecho
                  ? () => {
                      setPlantillaId(null);
                      setValores({});
                    }
                  : undefined
              }
            >
              {!paso2Hecho && (
                <ElegirDocumento
                  disponibles={disponibles}
                  contexto={`Sólo se muestran los documentos de ${jur} para ${op.toLowerCase()} ${uso.toLowerCase()}. Si la propiedad fuera de otra jurisdicción, la lista sería otra.`}
                  alElegir={elegirPlantilla}
                />
              )}
            </Paso>
          )}

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
                              auto={Boolean(c.auto && prop)}
                              opciones={opcionesDinamicas(c)}
                              alCambiar={(v) => setValores((x) => ({ ...x, [c.id]: v }))}
                            />
                          </div>
                        ))}
                      </div>
                    </fieldset>
                  );
                })}

                <PlazosPrevistos plantilla={plantilla} valores={valores} ahora={e.ahora} />

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

        {/* Columna del documento */}
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
                    d({
                      t: "doc.enviar",
                      registroId: "",
                      destino: "recepcion",
                      direccion: EMAIL_RECEPCION,
                    });
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
                paso1Hecho
                  ? "Elegí el documento y vas a ver acá cómo queda, con tus respuestas ya adentro del texto."
                  : `Empezá por la propiedad. ${yo.nombre.split(" ")[0]}, tenés ${mias.length} cargadas.`
              }
            />
          </Panel>
        )}
      </div>
    </div>
  );
}
