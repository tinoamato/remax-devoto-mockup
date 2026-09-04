import { useMemo, useState } from "react";
import { ETAPAS, type Doc, type EstadoDoc } from "../data/mock";
import { riesgo, urgencia, useApp } from "../state/store";
import { useNav } from "../state/nav";
import { Icono } from "../lib/icons";
import { cn, fechaHora, hace, iniciales, usd } from "../lib/format";
import {
  Barra,
  Boton,
  BotonIcono,
  Buscador,
  Cajon,
  Campo,
  Cuenta,
  Etiqueta,
  EtiquetaUrgencia,
  Inicial,
  ItemMenu,
  Menu,
  Modal,
  RielEtapas,
  Riesgo,
  Selector,
} from "./ui";

/* ── Estado de documento ────────────────────────────────────── */

const DOC_VIS: Record<EstadoDoc, { ico: "tilde" | "reloj" | "alerta"; color: string; txt: string }> = {
  completo: { ico: "tilde", color: "var(--verde)", txt: "En el legajo" },
  pendiente: { ico: "reloj", color: "var(--ambar)", txt: "Solicitado" },
  faltante: { ico: "alerta", color: "var(--lacre)", txt: "Falta" },
};

function FilaDoc({ d, opId }: { d: Doc; opId: string }) {
  const { d: dispatch } = useApp();
  const v = DOC_VIS[d.estado];
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-[var(--linea-suave)] last:border-b-0 hover:bg-[var(--papel-hundido)]/40 transition-colors duration-[120ms]">
      <span className="shrink-0 flex" style={{ color: v.color }}>
        <Icono n={v.ico} s={15} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-tight text-[var(--tinta)] flex items-center gap-1.5">
          <span className="truncate">{d.nombre}</span>
          {d.critico && (
            <span
              className="shrink-0 num text-[9px] px-1 rounded-[2px] border"
              style={{
                color: "var(--lacre)",
                borderColor: "var(--lacre-borde)",
                background: "var(--lacre-tenue)",
              }}
              title="Bloquea el avance de etapa"
            >
              CRÍT
            </span>
          )}
        </p>
        <p className="text-[11px] text-[var(--tinta-tenue)] mt-0.5">
          {v.txt} · responsable: {d.responsable}
        </p>
      </div>
      {d.estado === "faltante" && (
        <div className="flex gap-1.5 shrink-0">
          <Boton chico onClick={() => dispatch({ t: "doc.solicitar", opId, docId: d.id })}>
            Pedir
          </Boton>
          <Boton chico tono="primario" onClick={() => dispatch({ t: "doc.cargar", opId, docId: d.id })}>
            Cargar
          </Boton>
        </div>
      )}
      {d.estado === "pendiente" && (
        <Boton chico tono="primario" onClick={() => dispatch({ t: "doc.cargar", opId, docId: d.id })}>
          Recibido
        </Boton>
      )}
    </div>
  );
}

/* ── Modal: reasignar ───────────────────────────────────────── */

function ModalReasignar({ opId, cerrar }: { opId: string; cerrar: () => void }) {
  const { e, d } = useApp();
  const [q, setQ] = useState("");
  const op = e.operaciones.find((o) => o.id === opId)!;
  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    return e.asesores
      .filter((a) => a.id !== op.asesorId && (!t || a.nombre.toLowerCase().includes(t)))
      .sort((a, b) => a.activas - b.activas || b.cerradas - a.cerradas)
      .slice(0, 40);
  }, [q, e.asesores, op.asesorId]);

  return (
    <Modal titulo="Reasignar operación" sub={`${op.id} · ${op.propiedad}`} cerrar={cerrar} ancho={480}>
      <Buscador valor={q} alCambiar={setQ} hint="Buscar asesor…" />
      <p className="text-[11.5px] text-[var(--tinta-tenue)] mt-2 mb-1">
        Ordenados por carga: primero quien tiene menos operaciones activas.
      </p>
      <div className="max-h-[46vh] overflow-y-auto scroll -mx-1">
        {lista.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => {
              d({ t: "op.reasignar", opId, asesorId: a.id });
              cerrar();
            }}
            className="w-full flex items-center gap-2.5 px-1 py-2 rounded-[var(--r-sm)] text-left hover:bg-[var(--papel-hundido)] transition-colors duration-[120ms]"
          >
            <Inicial txt={a.iniciales} />
            <span className="flex-1 min-w-0">
              <span className="block text-[13px] truncate">{a.nombre}</span>
              <span className="block text-[11px] text-[var(--tinta-tenue)]">{a.rol}</span>
            </span>
            <span className="text-right">
              <span className="num block text-[12px] font-semibold">{a.activas}</span>
              <span className="block text-[10px] text-[var(--tinta-tenue)]">activas</span>
            </span>
            <span className="text-right w-14">
              <span
                className="num block text-[12px] font-semibold"
                style={{
                  color:
                    a.cerradas >= 9 ? "var(--verde)" : a.cerradas >= 4 ? "var(--ambar)" : "var(--lacre)",
                }}
              >
                {a.cerradas}
              </span>
              <span className="block text-[10px] text-[var(--tinta-tenue)]">cerradas</span>
            </span>
          </button>
        ))}
        {lista.length === 0 && (
          <p className="text-center text-[12.5px] text-[var(--tinta-tenue)] py-8">Ningún asesor coincide.</p>
        )}
      </div>
    </Modal>
  );
}

/* ── Modal: escalar ─────────────────────────────────────────── */

const MOTIVOS = [
  "Plazo vencido sin contacto con el cliente",
  "Documentación crítica trabada",
  "Conflicto entre las partes",
  "Riesgo de caída de la operación",
  "Requiere decisión de gerencia",
];

function ModalEscalar({ opId, cerrar }: { opId: string; cerrar: () => void }) {
  const { e, d } = useApp();
  const op = e.operaciones.find((o) => o.id === opId)!;
  const [motivo, setMotivo] = useState(MOTIVOS[0]);
  const [detalle, setDetalle] = useState("");

  return (
    <Modal
      titulo="Escalar a gerencia"
      sub={`${op.id} · ${op.propiedad}`}
      cerrar={cerrar}
      ancho={440}
      pie={
        <>
          <Boton onClick={cerrar}>Cancelar</Boton>
          <Boton
            tono="primario"
            ico="alerta"
            onClick={() => {
              d({ t: "op.escalar", opId, motivo: detalle.trim() ? `${motivo} — ${detalle.trim()}` : motivo });
              cerrar();
            }}
          >
            Escalar
          </Boton>
        </>
      }
    >
      <p className="text-[12.5px] text-[var(--tinta-media)] mb-3">
        Se crea una alerta de severidad alta para gerencia y queda asentado en la actividad del expediente.
      </p>
      <Selector rotulo="Motivo" value={motivo} onChange={(ev) => setMotivo(ev.target.value)}>
        {MOTIVOS.map((m) => (
          <option key={m}>{m}</option>
        ))}
      </Selector>
      <div className="mt-3">
        <span className="rotulo block mb-1">Detalle (opcional)</span>
        <textarea
          value={detalle}
          onChange={(ev) => setDetalle(ev.target.value)}
          rows={3}
          placeholder="Qué necesitás que resuelva gerencia."
          className="w-full bg-[var(--papel-hundido)] border border-[var(--linea-fuerte)] rounded-[var(--r-sm)] p-2.5 text-[13px] outline-none focus:bg-[var(--papel-alto)] focus:border-[var(--sello)] transition-colors resize-none"
        />
      </div>
    </Modal>
  );
}

/* ── Cajón principal del expediente ─────────────────────────── */

export function Expediente() {
  const { e, d } = useApp();
  const nav = useNav();
  const [tab, setTab] = useState<"docs" | "partes" | "acta">("docs");
  const [nota, setNota] = useState("");
  const [modal, setModal] = useState<"reasignar" | "escalar" | null>(null);

  const op = e.operaciones.find((o) => o.id === nav.op);
  if (!op) return null;

  const asesor = e.asesores.find((a) => a.id === op.asesorId);
  const prop = e.propiedades.find((p) => p.id === op.propiedadId);
  const u = urgencia(op.vence, e.ahora);
  const r = riesgo(op, e.ahora);
  const completos = op.docs.filter((x) => x.estado === "completo").length;
  const criticosFaltan = op.docs.filter((x) => x.critico && x.estado !== "completo");
  const cerrar = () => nav.abrirOp(null);

  return (
    <Cajon cerrar={cerrar} ancho={640}>
      {/* Encabezado */}
      <header
        className="shrink-0 px-4 pt-3 pb-3 border-b border-[var(--linea)] bg-[var(--papel-alto)]"
        style={{
          borderTop: `3px solid ${u === "vencida" ? "var(--lacre)" : u === "hoy" ? "var(--ambar)" : "var(--sello)"}`,
        }}
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="exp">{op.id}</span>
              <EtiquetaUrgencia u={u} />
              {op.escalada && <Etiqueta t="vencida">Escalada</Etiqueta>}
            </div>
            <h2 className="text-[16px] font-semibold leading-tight mt-1 truncate">{op.propiedad}</h2>
            <p className="text-[12px] text-[var(--tinta-suave)] mt-0.5">
              {op.barrio} · {op.tipo} · {op.ambientes} amb · {op.superficie} m²
            </p>
          </div>
          <div className="text-right shrink-0">
            <Cuenta vence={op.vence} ahora={e.ahora} grande />
            <p className="text-[10.5px] text-[var(--tinta-tenue)] mt-0.5">
              {u === "vencida" ? "de atraso" : "para el próximo hito"}
            </p>
          </div>
          <BotonIcono ico="cruz" rotulo="Cerrar expediente" onClick={cerrar} className="-mr-1.5 -mt-1" />
        </div>

        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--linea-suave)]">
          <div>
            <p className="rotulo">Precio</p>
            <p className="num text-[15px] font-semibold mt-0.5">{usd(op.precio)}</p>
          </div>
          <div>
            <p className="rotulo">Comisión</p>
            <p className="num text-[15px] font-semibold mt-0.5 text-[var(--sello)]">{usd(op.comision)}</p>
          </div>
          <div>
            <p className="rotulo">Riesgo</p>
            <div className="mt-1">
              <Riesgo v={r} />
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              nav.irGerencia("equipo");
              nav.abrirAsesor(op.asesorId);
              cerrar();
            }}
            className="ml-auto flex items-center gap-2 h-9 px-2 rounded-[var(--r-sm)] hover:bg-[var(--papel-hundido)] transition-colors"
          >
            <Inicial txt={asesor?.iniciales ?? "??"} />
            <span className="text-left">
              <span className="block text-[12px] font-medium">{asesor?.nombre}</span>
              <span className="block text-[10.5px] text-[var(--tinta-tenue)]">{asesor?.rol}</span>
            </span>
          </button>
        </div>
      </header>

      {/* Riel de etapas */}
      <div className="shrink-0">
        <RielEtapas etapas={ETAPAS} actual={op.etapa} />
        <div className="flex items-center gap-2 px-4 py-2 bg-[var(--papel-alto)] border-b border-[var(--linea)]">
          <Boton
            chico
            ico="chevIzq"
            disabled={op.etapa === 0}
            onClick={() => d({ t: "op.retroceder", opId: op.id })}
          >
            Atrás
          </Boton>
          <Boton
            chico
            tono="primario"
            disabled={op.etapa >= 12}
            onClick={() => d({ t: "op.avanzar", opId: op.id })}
          >
            Avanzar a {ETAPAS[Math.min(12, op.etapa + 1)]}
          </Boton>
          {criticosFaltan.length > 0 && (
            <span
              className="flex items-center gap-1 text-[11.5px]"
              style={{ color: "var(--lacre)" }}
              title={criticosFaltan.map((x) => x.nombre).join(", ")}
            >
              <Icono n="alerta" s={13} />
              {criticosFaltan.length} crítico(s) sin resolver
            </span>
          )}
          <div className="ml-auto flex gap-1.5">
            <Menu
              disparador={(abrir) => (
                <BotonIcono ico="puntos" rotulo="Más acciones" onClick={abrir} className="size-7" />
              )}
            >
              {(cerrarMenu) => (
                <>
                  <ItemMenu
                    ico="reloj"
                    onClick={() => {
                      d({ t: "op.plazo", opId: op.id, horas: 48 });
                      cerrarMenu();
                    }}
                  >
                    Extender plazo 48 h
                  </ItemMenu>
                  <ItemMenu
                    ico="usuarioMas"
                    onClick={() => {
                      setModal("reasignar");
                      cerrarMenu();
                    }}
                  >
                    Reasignar asesor
                  </ItemMenu>
                  {prop && (
                    <ItemMenu
                      ico="edificio"
                      onClick={() => {
                        nav.abrirProp(prop.id);
                        cerrarMenu();
                      }}
                    >
                      Ver la propiedad
                    </ItemMenu>
                  )}
                  {op.escalada ? (
                    <ItemMenu
                      ico="tilde"
                      onClick={() => {
                        d({ t: "op.desescalar", opId: op.id });
                        cerrarMenu();
                      }}
                    >
                      Cerrar escalamiento
                    </ItemMenu>
                  ) : (
                    <ItemMenu
                      ico="alerta"
                      peligro
                      onClick={() => {
                        setModal("escalar");
                        cerrarMenu();
                      }}
                    >
                      Escalar a gerencia
                    </ItemMenu>
                  )}
                </>
              )}
            </Menu>
          </div>
        </div>
      </div>

      {op.escalada && op.motivoEscalada && (
        <div
          className="shrink-0 flex items-start gap-2 px-4 py-2 text-[12px]"
          style={{ background: "var(--lacre-tenue)", color: "var(--lacre)" }}
        >
          <Icono n="alerta" s={14} className="mt-[1px]" />
          <span className="flex-1">{op.motivoEscalada}</span>
        </div>
      )}

      {/* Pestañas */}
      <div className="shrink-0 flex border-b border-[var(--linea)] bg-[var(--papel-alto)] px-2">
        {(
          [
            ["docs", `Documentos · ${completos}/${op.docs.length}`],
            ["partes", `Partes · ${op.partes.length}`],
            ["acta", `Actividad · ${op.actividad.length}`],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            aria-current={tab === k ? "page" : undefined}
            className={cn(
              "relative px-3 h-9 text-[12.5px] font-medium transition-colors duration-[140ms]",
              tab === k ? "text-[var(--tinta)]" : "text-[var(--tinta-tenue)] hover:text-[var(--tinta-media)]",
            )}
          >
            {l}
            {tab === k && (
              <span className="absolute inset-x-2 -bottom-px h-[2px] bg-[var(--sello)] rounded-[1px]" />
            )}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto scroll">
        {tab === "docs" && (
          <>
            <div className="px-3.5 py-2.5 flex items-center gap-3 bg-[var(--papel-alto)]/60">
              <div className="flex-1">
                <Barra
                  pct={(completos / op.docs.length) * 100}
                  color={criticosFaltan.length ? "var(--ambar)" : "var(--verde)"}
                />
              </div>
              <span className="num text-[11.5px] text-[var(--tinta-suave)]">
                {completos}/{op.docs.length}
              </span>
            </div>
            <div className="bg-[var(--papel-alto)] border-y border-[var(--linea)]">
              {op.docs.map((doc) => (
                <FilaDoc key={doc.id} d={doc} opId={op.id} />
              ))}
            </div>
          </>
        )}

        {tab === "partes" && (
          <div className="p-3 space-y-2">
            {op.partes.map((p) => (
              <div
                key={p.rol + p.nombre}
                className="bg-[var(--papel-alto)] border border-[var(--linea)] rounded-[var(--r-md)] p-3"
              >
                <div className="flex items-center gap-2.5">
                  <Inicial txt={iniciales(p.nombre)} s={30} />
                  <div className="min-w-0 flex-1">
                    <p className="rotulo">{p.rol}</p>
                    <p className="text-[13.5px] font-semibold leading-tight truncate">{p.nombre}</p>
                  </div>
                </div>
                <div className="flex gap-1.5 mt-2.5">
                  <a
                    href={`tel:${p.telefono.replace(/-/g, "")}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 rounded-[var(--r-sm)] border border-[var(--linea-fuerte)] bg-[var(--papel-alto)] text-[12px] hover:bg-[var(--papel-hundido)] transition-colors"
                  >
                    <Icono n="telefono" s={13} />
                    {p.telefono}
                  </a>
                  <a
                    href={`mailto:${p.email}`}
                    aria-label={`Escribir a ${p.nombre}`}
                    className="inline-flex items-center justify-center size-8 rounded-[var(--r-sm)] border border-[var(--linea-fuerte)] hover:bg-[var(--papel-hundido)] transition-colors"
                  >
                    <Icono n="correo" s={14} />
                  </a>
                  <a
                    href={`https://wa.me/54911${p.telefono.replace(/\D/g, "").slice(-8)}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`WhatsApp a ${p.nombre}`}
                    className="inline-flex items-center justify-center size-8 rounded-[var(--r-sm)] border border-[var(--linea-fuerte)] hover:bg-[var(--papel-hundido)] transition-colors"
                  >
                    <Icono n="mensaje" s={14} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "acta" && (
          <div className="p-3">
            <form
              onSubmit={(ev) => {
                ev.preventDefault();
                d({ t: "op.nota", opId: op.id, texto: nota });
                setNota("");
              }}
              className="flex gap-1.5 mb-3"
            >
              <Campo
                value={nota}
                onChange={(ev) => setNota(ev.target.value)}
                placeholder="Asentar una gestión en el expediente…"
                aria-label="Nueva nota"
              />
              <Boton tono="primario" ico="enviar" disabled={!nota.trim()} onClick={() => {
                d({ t: "op.nota", opId: op.id, texto: nota });
                setNota("");
              }}>
                Asentar
              </Boton>
            </form>
            <ol className="relative pl-4">
              <span className="absolute left-[3px] top-1.5 bottom-1.5 w-px bg-[var(--linea)]" aria-hidden="true" />
              {op.actividad.map((ev) => {
                const c =
                  ev.tipo === "riesgo"
                    ? "var(--lacre)"
                    : ev.tipo === "hito"
                      ? "var(--verde)"
                      : ev.tipo === "sistema"
                        ? "var(--tinta-tenue)"
                        : "var(--sello)";
                return (
                  <li key={ev.id} className="relative pb-3.5">
                    <span
                      className="absolute -left-4 top-1.5 size-[7px] rounded-[2px] border-2 border-[var(--papel)]"
                      style={{ background: c }}
                      aria-hidden="true"
                    />
                    <p className="text-[13px] leading-snug">{ev.texto}</p>
                    <p className="text-[11px] text-[var(--tinta-tenue)] mt-0.5">
                      {hace(ev.ts, e.ahora)} · {ev.autor} · <span className="num">{fechaHora(ev.ts)}</span>
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </div>

      {/* Pie de acciones */}
      <footer className="shrink-0 flex items-center gap-2 px-4 py-2.5 border-t border-[var(--linea)] bg-[var(--papel-alto)]">
        <Boton ico="usuarioMas" onClick={() => setModal("reasignar")}>
          Reasignar
        </Boton>
        {!op.escalada ? (
          <Boton tono="peligro" ico="alerta" onClick={() => setModal("escalar")}>
            Escalar
          </Boton>
        ) : (
          <Boton ico="tilde" onClick={() => d({ t: "op.desescalar", opId: op.id })}>
            Cerrar escalamiento
          </Boton>
        )}
        <Boton
          className="ml-auto"
          ico="documento"
          onClick={() => {
            nav.irAsesor("docs");
            cerrar();
          }}
        >
          Generar documento
        </Boton>
      </footer>

      {modal === "reasignar" && <ModalReasignar opId={op.id} cerrar={() => setModal(null)} />}
      {modal === "escalar" && <ModalEscalar opId={op.id} cerrar={() => setModal(null)} />}
    </Cajon>
  );
}
