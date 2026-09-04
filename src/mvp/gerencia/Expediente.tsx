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
import { desdeIso, type Plazo, type TipoEvento } from "../datos";

const ICONO_EVENTO: Record<TipoEvento, NombreIcono> = {
  generado: "documento",
  adenda: "agenda",
  plazo: "reloj",
  aviso: "correo",
  estado: "diana",
  nota: "mensaje",
};

/* ── Mover una fecha ────────────────────────────────────────── */

/** Cómo queda asentado el movimiento de fecha. */
type Via = "adenda" | "pedir" | "constancia";

const VIAS: { id: Via; titulo: string; detalle: string }[] = [
  {
    id: "adenda",
    titulo: "Ya hay adenda firmada",
    detalle: "Queda registrada como adenda del expediente, con su número.",
  },
  {
    id: "pedir",
    titulo: "Pedirle la adenda al agente",
    detalle: "Se mueve la fecha y le sale un correo al asesor para que la genere y quede registrada.",
  },
  {
    id: "constancia",
    titulo: "Sólo dejar constancia",
    detalle: "Corrección de gerencia, sin adenda de por medio. Va al historial con tu nombre.",
  },
];

function EditarVigencia({
  plazo,
  ultimo,
  cerrar,
  confirmar,
}: {
  plazo: Plazo;
  /** El último documento cargado del expediente: la reserva o su última adenda. */
  ultimo: string;
  cerrar: () => void;
  confirmar: (dias: number, motivo: string, via: Via) => void;
}) {
  const [dias, setDias] = useState("30");
  const [motivo, setMotivo] = useState("");
  const [via, setVia] = useState<Via>("adenda");
  const n = Number(dias) || 0;
  // La adenda es una prórroga y corre desde su firma; lo demás corrige el vencimiento.
  const base = via === "adenda" ? Date.now() : plazo.vence;
  // Una adenda nunca acorta el plazo: si la cuenta da antes de lo que ya había, gana lo que ya había.
  const nueva = new Date(Math.max(base + n * 86_400_000, plazo.vence));
  const seAcorta = via === "adenda" && base + n * 86_400_000 < plazo.vence;

  return (
    <Modal
      titulo="Editar la vigencia"
      sub={`${plazo.rotulo} · último documento cargado: ${ultimo}`}
      cerrar={cerrar}
      ancho={500}
      pie={
        <>
          <Boton onClick={cerrar}>Cancelar</Boton>
          <Boton tono="primario" onClick={() => confirmar(n, motivo.trim(), via)} disabled={n === 0}>
            {via === "adenda" ? "Registrar adenda" : via === "pedir" ? "Mover y avisar" : "Guardar la fecha"}
          </Boton>
        </>
      }
    >
      <p className="text-[12.5px] text-[var(--tinta-suave)] mb-3">
        Movés la fecha de vencimiento del último documento de este expediente. Pase lo que pase, queda
        asentado en el historial con la fecha original.
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
        <p className="text-[11.5px] text-[var(--tinta-tenue)] mt-1">
          {via === "adenda"
            ? "La prórroga se cuenta desde la firma de la adenda, que es hoy."
            : "La corrección se cuenta desde el vencimiento que hay cargado."}
        </p>
        {seAcorta && (
          <p className="text-[11.5px] text-[var(--ambar)] mt-1">
            Esos días, contados desde hoy, dan una fecha anterior a la que ya está cargada. Una adenda
            no acorta el plazo, así que se mantiene el vencimiento actual.
          </p>
        )}
      </div>

      <fieldset className="mt-3">
        <legend className="rotulo mb-1.5">¿Cómo queda registrado?</legend>
        <div className="space-y-1.5">
          {VIAS.map((v) => (
            <label
              key={v.id}
              className={cn(
                "flex items-start gap-2.5 px-2.5 py-2 rounded-[var(--r-sm)] border cursor-pointer transition-colors",
                via === v.id
                  ? "border-[var(--sello)] bg-[var(--sello-tenue)]/50"
                  : "border-[var(--linea)] hover:bg-[var(--papel-hundido)]/60",
              )}
            >
              <input
                type="radio"
                name="via"
                checked={via === v.id}
                onChange={() => setVia(v.id)}
                className="mt-[3px] accent-[var(--sello)]"
              />
              <span className="min-w-0">
                <span className="block text-[12.5px] font-medium">{v.titulo}</span>
                <span className="block text-[11.5px] text-[var(--tinta-suave)]">{v.detalle}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

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
  const [mover, setMover] = useState<Plazo | null>(null);
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
  // La vigencia que se edita es siempre la del último papel cargado.
  const ultimoDocumento = adendas[0]?.id ?? r.id;
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
          <h3 className="rotulo">Plazos del expediente</h3>
          <p className="text-[11.5px] text-[var(--tinta-tenue)] mb-2">
            Corren desde el{" "}
            <span className="num text-[var(--tinta-media)]">
              {new Date(r.vigenciaDesde).toLocaleDateString("es-AR")}
            </span>
            {Math.abs(r.vigenciaDesde - r.generadoEn) > 43_200_000 && (
              <>
                , que no es el día en que se cargó ({new Date(r.generadoEn).toLocaleDateString("es-AR")})
              </>
            )}
            .
          </p>
          <ul className="space-y-1.5">
            {plazos.map((p) => {
              const u = urgenciaDe(p.vence, e.ahora);
              const corrido = p.vence !== p.original;
              // Si se movió por una adenda registrada, movidoPor guarda su número (AD-...).
              // Si se movió a mano desde "Editar vigencia" sin ese respaldo, no hay papel todavía.
              const sinDocumentar = corrido && Boolean(p.movidoPor) && !p.movidoPor?.startsWith("AD-");
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

                  {sinDocumentar && (
                    <p className="flex items-center gap-1.5 mt-2 pl-[30px]">
                      <Etiqueta t="hoy">Sin documentación cargada</Etiqueta>
                      <span className="text-[11px] text-[var(--tinta-suave)]">
                        Gerencia corrigió esta fecha a mano; todavía no hay adenda que la respalde.
                      </span>
                    </p>
                  )}

                  {!p.cumplido && r.estado === "vigente" && (
                    <div className="flex flex-wrap gap-1.5 mt-2 pl-[30px]">
                      <Boton chico ico="agenda" onClick={() => setMover(p)}>
                        Editar vigencia
                      </Boton>
                      {u === "vencida" && (
                        <span className="inline-flex items-center text-[11.5px] text-[var(--lacre)]">
                          se puede extender igual, aunque ya esté vencido
                        </span>
                      )}
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
                        : c.tipo === "fecha"
                          ? new Date(desdeIso(r.valores[c.id])).toLocaleDateString("es-AR")
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
        <EditarVigencia
          plazo={mover}
          ultimo={ultimoDocumento}
          cerrar={() => setMover(null)}
          confirmar={(dias, motivo, via) => {
            if (via === "adenda") {
              d({
                t: "adenda.registrar",
                registroId: r.id,
                plazoId: mover.id,
                dias,
                motivo: motivo || "Adenda firmada por las partes.",
                desde: Date.now(),
              });
            } else {
              d({
                t: "plazo.mover",
                registroId: r.id,
                plazoId: mover.id,
                dias,
                motivo: motivo || "Sin motivo declarado.",
              });
              if (via === "pedir") d({ t: "notificar.adenda", registroId: r.id, plazoId: mover.id });
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
