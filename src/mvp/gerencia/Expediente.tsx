import { useState } from "react";
import { useApp, urgenciaDe } from "../tienda";
import { useNav } from "../nav";
import { camposVivos, plantillaPorId } from "../plantillas";
import { Hoja, htmlDocumento, imprimirDocumento } from "../Documento";
import {
  Boton,
  BotonIcono,
  Cajon,
  Cuenta,
  Etiqueta,
  EtiquetaUrgencia,
  Inicial,
  Menu,
  ItemMenu,
  Modal,
} from "../../components/ui";
import { Icono, type NombreIcono } from "../../lib/icons";
import { cn, fechaHora, hace } from "../../lib/format";
import type { Plazo, TipoEvento } from "../datos";

const ICONO_EVENTO: Record<TipoEvento, NombreIcono> = {
  generado: "documento",
  adenda: "agenda",
  plazo: "reloj",
  aviso: "correo",
  estado: "diana",
  nota: "mensaje",
};

/* ── Mover una fecha ────────────────────────────────────────── */

function MoverPlazo({
  plazo,
  modo,
  cerrar,
  confirmar,
}: {
  plazo: Plazo;
  modo: "adenda" | "correccion";
  cerrar: () => void;
  confirmar: (dias: number, motivo: string) => void;
}) {
  const [dias, setDias] = useState(modo === "adenda" ? "30" : "7");
  const [motivo, setMotivo] = useState("");
  const n = Number(dias) || 0;
  const nueva = new Date(plazo.vence + n * 86_400_000);

  return (
    <Modal
      titulo={modo === "adenda" ? "Registrar adenda" : "Corregir la fecha"}
      sub={plazo.rotulo}
      cerrar={cerrar}
      pie={
        <>
          <Boton onClick={cerrar}>Cancelar</Boton>
          <Boton tono="primario" onClick={() => confirmar(n, motivo.trim())} disabled={n === 0}>
            {modo === "adenda" ? "Registrar adenda" : "Guardar la fecha"}
          </Boton>
        </>
      }
    >
      <p className="text-[12.5px] text-[var(--tinta-suave)] mb-3">
        {modo === "adenda"
          ? "Se firmó una adenda en papel y hay que reflejarla acá. La fecha se corre y queda asentada en el historial del expediente."
          : "Corrección hecha desde gerencia, sin adenda de por medio. Queda registrada con tu nombre en el historial."}
      </p>

      <label className="block">
        <span className="rotulo block mb-1">Días de extensión</span>
        <span className="flex items-center gap-2">
          {[7, 15, 30, 60].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setDias(String(v))}
              className={cn(
                "num h-8 px-2.5 rounded-[var(--r-sm)] border text-[12.5px] transition-colors",
                Number(dias) === v
                  ? "bg-[var(--sello-tenue)] border-[var(--sello)] text-[var(--sello)] font-semibold"
                  : "bg-[var(--papel-alto)] border-[var(--linea-fuerte)] hover:bg-[var(--papel-hundido)]",
              )}
            >
              +{v}
            </button>
          ))}
          <input
            value={dias}
            onChange={(ev) => setDias(ev.target.value)}
            inputMode="numeric"
            aria-label="Días de extensión"
            className="num w-[76px] h-8 px-2 rounded-[var(--r-sm)] border border-[var(--linea-fuerte)] bg-[var(--papel-hundido)] text-[13px] outline-none focus:border-[var(--sello)] focus:bg-[var(--papel-alto)]"
          />
        </span>
      </label>

      <div className="mt-3 rounded-[var(--r-sm)] border border-[var(--linea)] bg-[var(--papel-hundido)]/60 px-3 py-2">
        <p className="text-[12px] text-[var(--tinta-suave)]">
          Hoy vence el{" "}
          <span className="num text-[var(--tinta)]">
            {new Date(plazo.vence).toLocaleDateString("es-AR")}
          </span>
          . Pasa a vencer el{" "}
          <span className="num font-semibold" style={{ color: "var(--sello)" }}>
            {nueva.toLocaleDateString("es-AR", { weekday: "long", day: "2-digit", month: "long" })}
          </span>
          .
        </p>
      </div>

      <label className="block mt-3">
        <span className="rotulo block mb-1">Motivo</span>
        <textarea
          value={motivo}
          onChange={(ev) => setMotivo(ev.target.value)}
          rows={2}
          placeholder="Por ejemplo: el banco todavía no informó la aprobación del crédito."
          className="w-full bg-[var(--papel-hundido)] border border-[var(--linea-fuerte)] rounded-[var(--r-sm)] px-2.5 py-2 text-[13px] outline-none focus:bg-[var(--papel-alto)] focus:border-[var(--sello)] resize-y"
        />
      </label>
    </Modal>
  );
}

/* ── Cajón ──────────────────────────────────────────────────── */

export default function Expediente() {
  const { e, d } = useApp();
  const nav = useNav();
  const [mover, setMover] = useState<{ plazo: Plazo; modo: "adenda" | "correccion" } | null>(null);
  const [verDoc, setVerDoc] = useState(false);
  const [nota, setNota] = useState("");

  const r = e.registros.find((x) => x.id === nav.expediente);
  if (!r) return null;

  const asesor = e.asesores.find((a) => a.id === r.asesorId)!;
  const pl = plantillaPorId(r.plantillaId);
  const plazos = [...r.plazos].sort((a, b) => a.vence - b.vence);
  const vivos = plazos.filter((p) => !p.cumplido);
  const prox = vivos[0];
  const adendas = e.adendas.filter((a) => a.registroId === r.id);
  const cerrar = () => nav.abrirExpediente(null);

  const respuestas = pl
    ? camposVivos(pl, r.valores).filter((c) => c.tipo !== "parrafo" && (r.valores[c.id] ?? "").trim())
    : [];

  return (
    <Cajon cerrar={cerrar} ancho={620}>
      {/* Cabecera */}
      <header className="shrink-0 px-4 py-3 border-b border-[var(--linea)] bg-[var(--papel-alto)]">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="exp">
              {r.id} · {pl?.nombre}
            </p>
            <h2 className="text-[15px] font-semibold leading-tight mt-0.5">
              {r.direccion}
              {r.unidad && <span className="text-[var(--tinta-suave)]"> · {r.unidad}</span>}
            </h2>
            <p className="text-[12.5px] text-[var(--tinta-suave)] mt-0.5">
              {r.contraparte} · registrado {hace(r.generadoEn, e.ahora)}
            </p>
          </div>
          <Menu
            disparador={(abrir) => <BotonIcono ico="puntos" rotulo="Más acciones" onClick={abrir} />}
          >
            {(cerrarMenu) => (
              <>
                <ItemMenu
                  ico="tilde"
                  onClick={() => {
                    d({ t: "registro.estado", registroId: r.id, estado: "cerrado" });
                    cerrarMenu();
                  }}
                >
                  Marcar como cerrada
                </ItemMenu>
                <ItemMenu
                  ico="cruz"
                  peligro
                  onClick={() => {
                    d({ t: "registro.estado", registroId: r.id, estado: "caido" });
                    cerrarMenu();
                  }}
                >
                  La operación se cayó
                </ItemMenu>
                {r.estado !== "vigente" && (
                  <ItemMenu
                    ico="refrescar"
                    onClick={() => {
                      d({ t: "registro.estado", registroId: r.id, estado: "vigente" });
                      cerrarMenu();
                    }}
                  >
                    Reabrir el expediente
                  </ItemMenu>
                )}
              </>
            )}
          </Menu>
          <BotonIcono ico="cruz" rotulo="Cerrar" onClick={cerrar} />
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-2.5">
          <span className="flex items-center gap-1.5">
            <Inicial txt={asesor.iniciales} s={22} />
            <span className="text-[12.5px]">{asesor.nombre}</span>
          </span>
          {r.estado === "vigente" ? (
            prox && <EtiquetaUrgencia u={urgenciaDe(prox.vence, e.ahora)} />
          ) : (
            <Etiqueta t={r.estado === "cerrado" ? "ok" : "neutro"}>
              {r.estado === "cerrado" ? "Cerrada" : "Caída"}
            </Etiqueta>
          )}
          {adendas.length > 0 && (
            <Etiqueta t="sello">
              {adendas.length} adenda{adendas.length > 1 ? "s" : ""}
            </Etiqueta>
          )}
          <Boton chico ico="documento" className="ml-auto" onClick={() => setVerDoc(true)}>
            Ver documento
          </Boton>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto scroll">
        {/* Plazos */}
        <section className="px-4 py-3 border-b border-[var(--linea)]">
          <h3 className="rotulo mb-2">Plazos del expediente</h3>
          <ul className="space-y-1.5">
            {plazos.map((p) => {
              const u = urgenciaDe(p.vence, e.ahora);
              const corrido = p.vence !== p.original;
              return (
                <li
                  key={p.id}
                  className={cn(
                    "rounded-[var(--r-sm)] border bg-[var(--papel-alto)] px-3 py-2.5",
                    p.cumplido
                      ? "border-[var(--linea)] opacity-70"
                      : u === "vencida"
                        ? "border-[var(--lacre-borde)]"
                        : "border-[var(--linea)]",
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      aria-label={p.cumplido ? "Reabrir plazo" : "Marcar cumplido"}
                      title={p.cumplido ? "Reabrir plazo" : "Marcar cumplido"}
                      onClick={() => d({ t: "plazo.cumplir", registroId: r.id, plazoId: p.id })}
                      className={cn(
                        "grid place-items-center size-5 rounded-[var(--r-xs)] border shrink-0 transition-colors",
                        p.cumplido
                          ? "bg-[var(--verde)] border-[var(--verde)] text-white"
                          : "border-[var(--linea-fuerte)] hover:border-[var(--tinta-suave)]",
                      )}
                    >
                      {p.cumplido && <Icono n="tilde" s={12} />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-[13px] font-medium leading-tight",
                          p.cumplido && "line-through text-[var(--tinta-suave)]",
                        )}
                      >
                        {p.rotulo}
                      </p>
                      <p className="num text-[11px] text-[var(--tinta-tenue)] mt-0.5">
                        {new Date(p.vence).toLocaleDateString("es-AR", {
                          weekday: "short",
                          day: "2-digit",
                          month: "2-digit",
                          year: "2-digit",
                        })}
                        {corrido && (
                          <span className="ml-1.5">
                            · original {new Date(p.original).toLocaleDateString("es-AR")}
                          </span>
                        )}
                      </p>
                    </div>

                    {!p.cumplido && <Cuenta vence={p.vence} ahora={e.ahora} />}
                  </div>

                  {!p.cumplido && r.estado === "vigente" && (
                    <div className="flex flex-wrap gap-1.5 mt-2 pl-[30px]">
                      <Boton chico ico="agenda" onClick={() => setMover({ plazo: p, modo: "adenda" })}>
                        Registrar adenda
                      </Boton>
                      <Boton chico tono="fantasma" ico="reloj" onClick={() => setMover({ plazo: p, modo: "correccion" })}>
                        Corregir fecha
                      </Boton>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {/* Adendas */}
        {adendas.length > 0 && (
          <section className="px-4 py-3 border-b border-[var(--linea)]">
            <h3 className="rotulo mb-2">Adendas</h3>
            <ul className="space-y-1.5">
              {adendas.map((a) => (
                <li
                  key={a.id}
                  className="rounded-[var(--r-sm)] border border-[var(--sello-borde)] bg-[var(--sello-tenue)]/40 px-3 py-2"
                >
                  <p className="flex items-baseline gap-2">
                    <span className="exp" style={{ color: "var(--sello)" }}>
                      {a.id}
                    </span>
                    <span className="num text-[11px] text-[var(--tinta-tenue)]">{fechaHora(a.ts)}</span>
                    <span className="num ml-auto text-[12px] font-semibold" style={{ color: "var(--sello)" }}>
                      +{a.diasExtension} días
                    </span>
                  </p>
                  <p className="text-[12.5px] text-[var(--tinta-media)] mt-1">{a.motivo}</p>
                  {a.nuevoPrecio && (
                    <p className="num text-[12px] text-[var(--tinta)] mt-1">
                      Nuevo precio: USD {a.nuevoPrecio.toLocaleString("es-AR")}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Respuestas del documento */}
        <section className="px-4 py-3 border-b border-[var(--linea)]">
          <h3 className="rotulo mb-2">Lo que se completó al generarlo</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
            {respuestas.map((c) => (
              <div key={c.id} className="flex items-baseline gap-2 border-b border-[var(--linea-suave)] pb-1">
                <dt className="text-[11.5px] text-[var(--tinta-suave)] flex-1 min-w-0">{c.pregunta}</dt>
                <dd
                  className={cn(
                    "text-[12.5px] font-medium text-right",
                    c.tipo !== "texto" && c.tipo !== "opcion" && "num",
                  )}
                >
                  {c.tipo === "moneda"
                    ? `USD ${Number(r.valores[c.id]).toLocaleString("es-AR")}`
                    : c.tipo === "porcentaje"
                      ? `${r.valores[c.id]}%`
                      : c.tipo === "dias"
                        ? `${r.valores[c.id]} días`
                        : r.valores[c.id]}
                </dd>
              </div>
            ))}
          </dl>
          {r.observaciones && (
            <div className="mt-3 rounded-[var(--r-sm)] border border-[var(--ambar-borde)] bg-[var(--ambar-tenue)]/60 px-3 py-2">
              <p className="rotulo" style={{ color: "var(--ambar)" }}>
                Observaciones del asesor
              </p>
              <p className="text-[12.5px] text-[var(--tinta-media)] mt-1">{r.observaciones}</p>
            </div>
          )}
        </section>

        {/* Historial */}
        <section className="px-4 py-3">
          <h3 className="rotulo mb-2">Historial</h3>
          <ol className="relative pl-5">
            <span className="absolute left-[7px] top-1.5 bottom-1.5 w-px bg-[var(--linea)]" aria-hidden="true" />
            {[...r.historial]
              .sort((a, b) => b.ts - a.ts)
              .map((ev) => (
                <li key={ev.id} className="relative pb-3 last:pb-0">
                  <span className="absolute -left-5 top-[3px] grid place-items-center size-[15px] rounded-full bg-[var(--papel)] border border-[var(--linea-fuerte)] text-[var(--tinta-suave)]">
                    <Icono n={ICONO_EVENTO[ev.tipo]} s={9} />
                  </span>
                  <p className="text-[12.5px] text-[var(--tinta-media)] leading-snug">{ev.texto}</p>
                  <p className="num text-[10.5px] text-[var(--tinta-tenue)] mt-0.5">
                    {fechaHora(ev.ts)} · {ev.autor}
                  </p>
                </li>
              ))}
          </ol>

          <div className="flex gap-2 mt-3">
            <input
              value={nota}
              onChange={(ev) => setNota(ev.target.value)}
              placeholder="Anotar algo en el historial…"
              aria-label="Anotar en el historial"
              className="flex-1 h-8 px-2.5 text-[12.5px] rounded-[var(--r-sm)] border border-[var(--linea-fuerte)] bg-[var(--papel-hundido)] outline-none focus:bg-[var(--papel-alto)] focus:border-[var(--sello)]"
            />
            <Boton
              chico
              disabled={!nota.trim()}
              onClick={() => {
                d({ t: "registro.nota", registroId: r.id, texto: nota.trim() });
                setNota("");
              }}
            >
              Anotar
            </Boton>
          </div>
        </section>
      </div>

      {mover && (
        <MoverPlazo
          plazo={mover.plazo}
          modo={mover.modo}
          cerrar={() => setMover(null)}
          confirmar={(dias, motivo) => {
            if (mover.modo === "adenda") {
              d({
                t: "adenda.registrar",
                registroId: r.id,
                plazoId: mover.plazo.id,
                dias,
                motivo: motivo || "Adenda firmada por las partes.",
              });
            } else {
              d({
                t: "plazo.mover",
                registroId: r.id,
                plazoId: mover.plazo.id,
                dias,
                motivo: motivo || "Sin motivo declarado.",
              });
            }
            setMover(null);
          }}
        />
      )}

      {verDoc && pl && (
        <Modal
          titulo={`${r.id} · ${r.direccion}`}
          sub={pl.nombre}
          cerrar={() => setVerDoc(false)}
          ancho={760}
          pie={
            <>
              <Boton
                ico="imprimir"
                onClick={() => imprimirDocumento(htmlDocumento(pl, r.valores, r.generadoEn, r.id))}
              >
                Imprimir o guardar PDF
              </Boton>
              <Boton tono="primario" onClick={() => setVerDoc(false)}>
                Cerrar
              </Boton>
            </>
          }
        >
          <div className="border border-[var(--linea)] rounded-[var(--r-sm)] overflow-hidden">
            <Hoja plantilla={pl} valores={r.valores} ahora={r.generadoEn} id={r.id} resaltar={false} />
          </div>
        </Modal>
      )}
    </Cajon>
  );
}
