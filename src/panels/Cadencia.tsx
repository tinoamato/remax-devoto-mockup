import { useMemo, useState } from "react";
import type { CanalContacto } from "../data/mock";
import { useApp, useDerivados, type Cadencia, type EstadoCadencia } from "../state/store";
import { useNav } from "../state/nav";
import { Icono } from "../lib/icons";
import { cn, fechaCorta, hace } from "../lib/format";
import {
  Barra,
  Boton,
  Buscador,
  CabezaPanel,
  Campo,
  Etiqueta,
  Inicial,
  Modal,
  Panel,
  Selector,
  Td,
  Th,
  Vacio,
} from "../components/ui";

const TOPES = [7, 15, 30, 45, 60];
const CANALES: CanalContacto[] = ["1 a 1", "llamada", "WhatsApp", "correo", "reunión"];

const COLOR: Record<EstadoCadencia, string> = {
  vencido: "var(--lacre)",
  porVencer: "var(--ambar)",
  alDia: "var(--verde)",
};
const ROTULO: Record<EstadoCadencia, string> = {
  vencido: "Pasado de tope",
  porVencer: "Por vencer",
  alDia: "Al día",
};
const ETIQ: Record<EstadoCadencia, string> = {
  vencido: "vencida",
  porVencer: "hoy",
  alDia: "ok",
};

/* ── Registrar un contacto ──────────────────────────────────── */

export function ModalContacto({ asesorId, cerrar }: { asesorId: string; cerrar: () => void }) {
  const { e, d } = useApp();
  const a = e.asesores.find((x) => x.id === asesorId);
  const [canal, setCanal] = useState<CanalContacto>("1 a 1");
  const [nota, setNota] = useState("");
  if (!a) return null;

  return (
    <Modal
      titulo="Registrar contacto"
      sub={`${a.nombre} · tope cada ${a.topeDias} días`}
      cerrar={cerrar}
      ancho={420}
      pie={
        <>
          <Boton onClick={cerrar}>Cancelar</Boton>
          <Boton
            tono="primario"
            ico="tilde"
            onClick={() => {
              d({ t: "contacto.registrar", asesorId, canal, nota });
              cerrar();
            }}
          >
            Registrar
          </Boton>
        </>
      }
    >
      <p className="text-[12.5px] text-[var(--tinta-media)] mb-3">
        El contador vuelve a cero y queda asentado en el historial del asesor.
      </p>
      <Selector rotulo="Canal" value={canal} onChange={(ev) => setCanal(ev.target.value as CanalContacto)}>
        {CANALES.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </Selector>
      <div className="mt-3">
        <span className="rotulo block mb-1">Nota</span>
        <textarea
          value={nota}
          onChange={(ev) => setNota(ev.target.value)}
          rows={3}
          placeholder="De qué hablaron."
          className="w-full bg-[var(--papel-hundido)] border border-[var(--linea-fuerte)] rounded-[var(--r-sm)] p-2.5 text-[13px] outline-none focus:bg-[var(--papel-alto)] focus:border-[var(--sello)] transition-colors resize-none"
        />
      </div>
    </Modal>
  );
}

/* ── La regla, escrita como la lee el gerente ───────────────── */

function TiraRegla() {
  const { e, d } = useApp();
  const r = e.regla;

  const campo =
    "num inline-flex items-center h-6 px-1.5 rounded-[var(--r-xs)] border border-[var(--sello-borde)] " +
    "bg-[var(--sello-tenue)] text-[var(--sello)] text-[12.5px] font-semibold outline-none " +
    "focus:border-[var(--sello)] transition-colors";

  return (
    <div className="px-4 py-3 border-b border-[var(--linea)] bg-[var(--papel-alto)] trama">
      <div className="flex items-center gap-2 mb-2">
        <Icono n="regla" s={14} className="text-[var(--tinta-tenue)]" />
        <p className="rotulo">La regla que corre todos los días</p>
      </div>
      <p className="text-[13.5px] leading-[2] text-[var(--tinta-media)]">
        <span className="num text-[var(--tinta)] font-semibold">SI</span> los días desde el último
        contacto <span className="num text-[var(--tinta)] font-semibold">&gt;</span> el tope de ese
        asesor <span className="num text-[var(--tinta)] font-semibold">→</span> avisar por correo a{" "}
        <input
          value={r.destinatario}
          onChange={(ev) => d({ t: "contacto.regla", cambio: { destinatario: ev.target.value } })}
          aria-label="Destinatario del aviso"
          className={cn(campo, "w-[220px]")}
        />{" "}
        todos los días a las{" "}
        <input
          type="time"
          value={r.hora}
          onChange={(ev) => d({ t: "contacto.regla", cambio: { hora: ev.target.value } })}
          aria-label="Hora del aviso"
          className={cn(campo, "w-[86px]")}
        />
        , incluyendo también a los que vencen dentro de{" "}
        <input
          type="number"
          min={0}
          max={14}
          value={r.margenAviso}
          onChange={(ev) =>
            d({ t: "contacto.regla", cambio: { margenAviso: Math.max(0, Number(ev.target.value) || 0) } })
          }
          aria-label="Días de margen"
          className={cn(campo, "w-[52px]")}
        />{" "}
        días.
      </p>
    </div>
  );
}

/* ── Vista previa del correo ────────────────────────────────── */

function redactarAviso(
  vencidos: Cadencia[],
  porVencer: Cadencia[],
  regla: { destinatario: string; hora: string; margenAviso: number },
  ahora: number,
) {
  const fecha = new Date(ahora).toLocaleDateString("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
  const lineas: string[] = [];
  lineas.push(`Para:     ${regla.destinatario}`);
  lineas.push(`Asunto:   [RE/MAX Devoto] ${vencidos.length} asesores fuera de cadencia · ${fecha}`);
  lineas.push("");
  lineas.push(`PASADOS DE TOPE (${vencidos.length})`);
  if (!vencidos.length) lineas.push("  Ninguno. Toda la oficina dentro del tope acordado.");
  for (const c of vencidos.slice(0, 6)) {
    lineas.push(
      `  ${c.asesor.nombre} · ${c.asesor.rol}`,
      `    ${c.desde} días sin contacto · tope ${c.asesor.topeDias} · ${c.atraso} de atraso`,
      `    ${c.asesor.activas} operaciones activas`,
    );
  }
  if (vencidos.length > 6) lineas.push(`  … y ${vencidos.length - 6} más.`);
  if (regla.margenAviso > 0) {
    lineas.push("");
    lineas.push(`POR VENCER EN ${regla.margenAviso} DÍAS (${porVencer.length})`);
    if (!porVencer.length) lineas.push("  Ninguno.");
    for (const c of porVencer.slice(0, 5)) {
      lineas.push(
        `  ${c.asesor.nombre} · tope ${c.asesor.topeDias} · hace ${c.desde} días · vence en ${-c.atraso}`,
      );
    }
    if (porVencer.length > 5) lineas.push(`  … y ${porVencer.length - 5} más.`);
  }
  lineas.push("");
  lineas.push(`— Enviado automáticamente todos los días a las ${regla.hora}.`);
  return lineas.join("\n");
}

function PanelAviso({ vencidos, porVencer }: { vencidos: Cadencia[]; porVencer: Cadencia[] }) {
  const { e, d } = useApp();
  const texto = redactarAviso(vencidos, porVencer, e.regla, e.ahora);

  return (
    <Panel>
      <CabezaPanel
        titulo="Vista previa del aviso"
        extra={
          <>
            <Boton chico ico="clip" onClick={() => navigator.clipboard?.writeText(texto)}>
              Copiar
            </Boton>
            <Boton
              chico
              tono="primario"
              ico="enviar"
              onClick={() =>
                d({ t: "contacto.enviarAviso", vencidos: vencidos.length, porVencer: porVencer.length })
              }
            >
              Enviar ahora
            </Boton>
          </>
        }
      />
      <pre className="num text-[11px] leading-[1.75] text-[var(--tinta-media)] p-3.5 whitespace-pre-wrap break-words max-h-[420px] overflow-y-auto scroll">
        {texto}
      </pre>
      <p className="px-3.5 py-2 border-t border-[var(--linea-suave)] text-[11.5px] text-[var(--tinta-tenue)]">
        {e.regla.ultimoEnvio
          ? `Último envío ${hace(e.regla.ultimoEnvio, e.ahora)}.`
          : "Todavía no se envió hoy."}{" "}
        El próximo sale solo a las <span className="num">{e.regla.hora}</span>.
      </p>
    </Panel>
  );
}

/* ── Vista completa ─────────────────────────────────────────── */

export default function VistaCadencia() {
  const { e, d } = useApp();
  const { cadencias, vencidosContacto, porVencerContacto } = useDerivados();
  const nav = useNav();
  const [q, setQ] = useState("");
  const [fEstado, setFEstado] = useState<"" | EstadoCadencia>("");
  const [fTope, setFTope] = useState("");
  const [registrando, setRegistrando] = useState<string | null>(null);

  const filas = useMemo(() => {
    const t = q.trim().toLowerCase();
    return cadencias
      .filter((c) => !t || c.asesor.nombre.toLowerCase().includes(t))
      .filter((c) => !fEstado || c.estado === fEstado)
      .filter((c) => !fTope || c.asesor.topeDias === Number(fTope));
  }, [cadencias, q, fEstado, fTope]);

  const alDia = cadencias.length - vencidosContacto.length - porVencerContacto.length;
  const cobertura = ((cadencias.length - vencidosContacto.length) / cadencias.length) * 100;
  const peor = vencidosContacto[0];

  /* Distribución por tope: cuántos hay y cuántos están pasados en cada grupo. */
  const porTope = TOPES.map((t) => {
    const grupo = cadencias.filter((c) => c.asesor.topeDias === t);
    return { tope: t, total: grupo.length, vencidos: grupo.filter((c) => c.estado === "vencido").length };
  }).filter((g) => g.total > 0);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Los tres números */}
      <div className="shrink-0 grid grid-cols-2 lg:grid-cols-4 divide-x divide-[var(--linea)] border-b border-[var(--linea)] bg-[var(--papel-alto)]">
        <div className="px-4 py-3">
          <p className="rotulo">Pasados de tope</p>
          <p
            className="num text-[32px] font-semibold leading-none mt-1.5"
            style={{ color: vencidosContacto.length ? "var(--lacre)" : "var(--verde)" }}
          >
            {vencidosContacto.length}
          </p>
          <p className="text-[11.5px] text-[var(--tinta-tenue)] mt-1.5">
            {peor ? `el peor, ${peor.asesor.nombre} con ${peor.atraso} días` : "toda la oficina al día"}
          </p>
        </div>
        <div className="px-4 py-3">
          <p className="rotulo">Por vencer en {e.regla.margenAviso} días</p>
          <p className="num text-[32px] font-semibold leading-none mt-1.5" style={{ color: "var(--ambar)" }}>
            {porVencerContacto.length}
          </p>
          <p className="text-[11.5px] text-[var(--tinta-tenue)] mt-1.5">entran al aviso de mañana</p>
        </div>
        <div className="px-4 py-3">
          <p className="rotulo">Al día</p>
          <p className="num text-[19px] font-semibold leading-none mt-1.5">{alDia}</p>
          <p className="text-[11.5px] text-[var(--tinta-tenue)] mt-1.5">
            de {cadencias.length} asesores en la oficina
          </p>
        </div>
        <div className="px-4 py-3">
          <p className="rotulo">Dentro del tope</p>
          <p className="num text-[19px] font-semibold leading-none mt-1.5">{Math.round(cobertura)}%</p>
          <div className="mt-2">
            <Barra pct={cobertura} color={cobertura > 85 ? "var(--verde)" : "var(--ambar)"} />
          </div>
          <p className="text-[11.5px] text-[var(--tinta-tenue)] mt-1.5">
            contando también a los que están por vencer
          </p>
        </div>
      </div>

      <TiraRegla />

      <div className="flex-1 min-h-0 overflow-y-auto scroll p-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] items-start">
          {/* Comparativa */}
          <Panel className="min-w-0">
            <CabezaPanel
              titulo="Comparativa del equipo"
              cuenta={filas.length}
              extra={
                <Buscador valor={q} alCambiar={setQ} hint="Buscar asesor…" className="w-[180px]" />
              }
            />

            <div className="flex flex-wrap items-center gap-1.5 px-3.5 py-2 border-b border-[var(--linea-suave)]">
              {(["vencido", "porVencer", "alDia"] as const).map((k) => {
                const n =
                  k === "vencido"
                    ? vencidosContacto.length
                    : k === "porVencer"
                      ? porVencerContacto.length
                      : alDia;
                return (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={fEstado === k}
                    onClick={() => setFEstado(fEstado === k ? "" : k)}
                    className={cn(
                      "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[var(--r-sm)] border text-[12px] transition-colors",
                      fEstado === k
                        ? "bg-[var(--papel-hundido)] border-[var(--tinta-suave)]"
                        : "bg-[var(--papel-alto)] border-[var(--linea-fuerte)] hover:bg-[var(--papel-hundido)]",
                    )}
                  >
                    <span className="size-2 rounded-[1px]" style={{ background: COLOR[k] }} />
                    <span className="num font-semibold">{n}</span>
                    <span className="text-[var(--tinta-suave)]">{ROTULO[k].toLowerCase()}</span>
                  </button>
                );
              })}
              <Selector
                value={fTope}
                onChange={(ev) => setFTope(ev.target.value)}
                className="w-[128px] ml-auto"
              >
                <option value="">Todos los topes</option>
                {porTope.map((g) => (
                  <option key={g.tope} value={g.tope}>
                    Cada {g.tope} días
                  </option>
                ))}
              </Selector>
            </div>

            <div className="overflow-x-auto scroll">
              {filas.length === 0 ? (
                <Vacio
                  ico="pulso"
                  titulo="Ningún asesor coincide"
                  detalle="Ajustá los filtros para volver a ver el equipo completo."
                  accion={{
                    txt: "Limpiar filtros",
                    al: () => {
                      setQ("");
                      setFEstado("");
                      setFTope("");
                    },
                  }}
                />
              ) : (
                <table className="w-full min-w-[720px] border-collapse">
                  <thead>
                    <tr>
                      <Th>Asesor</Th>
                      <Th ancho={92}>Tope</Th>
                      <Th ancho={128}>Último contacto</Th>
                      <Th ancho={110} alDer>Atraso</Th>
                      <Th ancho={112} alDer>Acción</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filas.map((c) => (
                      <tr
                        key={c.asesor.id}
                        onClick={() => nav.abrirAsesor(c.asesor.id)}
                        className="cursor-pointer hover:bg-[var(--papel-hundido)]/50 transition-colors duration-[120ms]"
                        style={c.estado === "vencido" ? { background: "var(--lacre-tenue)" } : undefined}
                      >
                        <Td>
                          <span className="flex items-center gap-2.5">
                            <span
                              className="w-[3px] h-7 rounded-[1px] shrink-0"
                              style={{ background: COLOR[c.estado] }}
                            />
                            <Inicial txt={c.asesor.iniciales} s={26} />
                            <span className="min-w-0">
                              <span className="block font-medium truncate">{c.asesor.nombre}</span>
                              <span className="block text-[11px] text-[var(--tinta-tenue)]">
                                {c.asesor.rol}
                              </span>
                            </span>
                          </span>
                        </Td>
                        <Td>
                          <span onClick={(ev) => ev.stopPropagation()} className="inline-flex">
                            <select
                              value={c.asesor.topeDias}
                              aria-label={`Tope de contacto de ${c.asesor.nombre}`}
                              onChange={(ev) =>
                                d({
                                  t: "contacto.tope",
                                  asesorId: c.asesor.id,
                                  dias: Number(ev.target.value),
                                })
                              }
                              className="num h-7 pl-2 pr-1 rounded-[var(--r-sm)] border border-[var(--linea-fuerte)] bg-[var(--papel-hundido)] text-[12px] cursor-pointer outline-none focus:border-[var(--sello)]"
                            >
                              {TOPES.map((t) => (
                                <option key={t} value={t}>
                                  {t} d
                                </option>
                              ))}
                            </select>
                          </span>
                        </Td>
                        <Td>
                          <span className="num text-[12.5px] font-semibold">hace {c.desde} d</span>
                          <span className="block text-[11px] text-[var(--tinta-tenue)]">
                            {fechaCorta(c.asesor.ultimoContacto)}
                          </span>
                        </Td>
                        <Td alDer>
                          <span
                            className="num text-[13px] font-semibold"
                            style={{ color: COLOR[c.estado] }}
                          >
                            {c.atraso > 0 ? `+${c.atraso} d` : c.atraso === 0 ? "hoy" : `en ${-c.atraso} d`}
                          </span>
                          <span className="block mt-1">
                            <Etiqueta t={ETIQ[c.estado]}>{ROTULO[c.estado]}</Etiqueta>
                          </span>
                        </Td>
                        <Td alDer>
                          <span onClick={(ev) => ev.stopPropagation()} className="inline-flex">
                            <Boton
                              chico
                              tono={c.estado === "vencido" ? "primario" : "secundario"}
                              ico="telefono"
                              onClick={() => setRegistrando(c.asesor.id)}
                            >
                              Contacté
                            </Boton>
                          </span>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Panel>

          {/* Columna derecha */}
          <div className="space-y-4 min-w-0">
            <PanelAviso vencidos={vencidosContacto} porVencer={porVencerContacto} />

            <Panel>
              <CabezaPanel titulo="Cumplimiento por tope" />
              <div className="p-3.5 space-y-2.5">
                {porTope.map((g) => {
                  const ok = g.total - g.vencidos;
                  return (
                    <div key={g.tope} className="flex items-center gap-3">
                      <span className="num w-[62px] shrink-0 text-[12px] text-[var(--tinta-media)]">
                        cada {g.tope} d
                      </span>
                      <span className="flex-1">
                        <Barra
                          pct={(ok / g.total) * 100}
                          color={g.vencidos === 0 ? "var(--verde)" : "var(--ambar)"}
                        />
                      </span>
                      <span className="num w-[74px] shrink-0 text-[11.5px] text-right text-[var(--tinta-suave)]">
                        {ok}/{g.total}
                      </span>
                    </div>
                  );
                })}
                <p className="text-[11.5px] text-[var(--tinta-tenue)] pt-2 border-t border-[var(--linea-suave)]">
                  Los topes cortos concentran a los asesores nuevos: son los que más se escapan.
                </p>
              </div>
            </Panel>
          </div>
        </div>
      </div>

      {registrando && <ModalContacto asesorId={registrando} cerrar={() => setRegistrando(null)} />}
    </div>
  );
}
