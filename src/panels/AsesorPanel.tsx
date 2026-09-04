import { useMemo, useState } from "react";
import { CLAUSULAS, ETAPAS, PLANTILLAS, type Lead, type Tarea } from "../data/mock";
import { riesgo, urgencia, useApp, useDerivados } from "../state/store";
import { useNav } from "../state/nav";
import { Icono } from "../lib/icons";
import { cn, fechaCorta, hace, usd } from "../lib/format";
import {
  Barra,
  Boton,
  Buscador,
  CabezaPanel,
  Campo,
  Cuenta,
  Etiqueta,
  EtiquetaUrgencia,
  Inicial,
  ItemMenu,
  Menu,
  Panel,
  RielEtapas,
  Riesgo,
  Selector,
  Vacio,
} from "../components/ui";

/* ═══ Mi día ════════════════════════════════════════════════ */

function FilaTarea({ t }: { t: Tarea }) {
  const { e, d } = useApp();
  const nav = useNav();
  const u = urgencia(t.vence, e.ahora);
  const op = e.operaciones.find((o) => o.id === t.operacionId);

  return (
    <div
      className={cn(
        "group flex items-center gap-2.5 px-3.5 py-2.5 border-b border-[var(--linea-suave)] last:border-b-0",
        "hover:bg-[var(--papel-hundido)]/40 transition-colors duration-[120ms]",
        t.hecha && "opacity-50",
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={t.hecha}
        aria-label={t.hecha ? `Reabrir: ${t.descripcion}` : `Marcar hecha: ${t.descripcion}`}
        onClick={() => d({ t: "tarea.marcar", id: t.id })}
        className={cn(
          "shrink-0 grid place-items-center size-[18px] rounded-[var(--r-xs)] border transition-colors duration-[140ms] active:scale-95",
          t.hecha
            ? "bg-[var(--verde)] border-[var(--verde)] text-white"
            : "border-[var(--linea-fuerte)] bg-[var(--papel-alto)] hover:border-[var(--sello)]",
        )}
      >
        {t.hecha && <Icono n="tilde" s={12} grosor={2.4} />}
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn("text-[13px] leading-snug", t.hecha && "line-through")}>{t.descripcion}</p>
        <p className="text-[11px] text-[var(--tinta-tenue)] mt-0.5 flex items-center gap-1.5">
          {op && (
            <button
              type="button"
              onClick={() => nav.abrirOp(op.id)}
              className="exp hover:text-[var(--sello)] transition-colors"
            >
              {op.id}
            </button>
          )}
          <span className="capitalize">{t.tipo}</span>
        </p>
      </div>

      {!t.hecha && (
        <>
          <Cuenta vence={t.vence} ahora={e.ahora} />
          <div className="flex items-center gap-1 shrink-0">
            <Menu
              disparador={(abrir) => (
                <button
                  type="button"
                  aria-label="Reprogramar"
                  onClick={abrir}
                  className="size-7 grid place-items-center rounded-[var(--r-xs)] text-[var(--tinta-tenue)] hover:bg-[var(--papel-hundido)] hover:text-[var(--tinta)] transition-colors"
                >
                  <Icono n="reloj" s={15} />
                </button>
              )}
            >
              {(cerrar) => (
                <>
                  {[
                    ["Hoy más tarde", 4],
                    ["Mañana", 24],
                    ["En 3 días", 72],
                    ["La semana que viene", 168],
                  ].map(([l, hs]) => (
                    <ItemMenu
                      key={l as string}
                      ico="reloj"
                      onClick={() => {
                        d({ t: "tarea.posponer", id: t.id, horas: hs as number });
                        cerrar();
                      }}
                    >
                      {l}
                    </ItemMenu>
                  ))}
                </>
              )}
            </Menu>
            <Boton chico tono={u === "vencida" ? "primario" : "secundario"} onClick={() => op && nav.abrirOp(op.id)}>
              {t.accion}
            </Boton>
          </div>
        </>
      )}
      {t.hecha && <Etiqueta t="ok">Hecha</Etiqueta>}
    </div>
  );
}

function VistaDia() {
  const { e, d } = useApp();
  const nav = useNav();
  const [nueva, setNueva] = useState("");

  const mis = e.tareas.filter((t) => t.asesorId === e.yo);
  const abiertas = mis.filter((t) => !t.hecha).sort((a, b) => a.vence - b.vence);
  const hechas = mis.filter((t) => t.hecha);
  const misOps = e.operaciones.filter((o) => o.asesorId === e.yo);
  const proxima = abiertas[0];
  const vencidas = abiertas.filter((t) => t.vence < e.ahora).length;
  const hoy = abiertas.filter((t) => {
    const hs = (t.vence - e.ahora) / 3_600_000;
    return hs >= 0 && hs <= 24;
  }).length;
  const comision = misOps.reduce((s, o) => s + o.comision, 0);
  const opProxima = proxima ? e.operaciones.find((o) => o.id === proxima.operacionId) : undefined;

  return (
    <div className="h-full overflow-y-auto scroll">
      {/* Foco: la próxima acción */}
      {proxima ? (
        <div
          className="px-4 py-4 border-b border-[var(--linea)] bg-[var(--papel-alto)] trama"
          style={{
            borderTop: `3px solid ${proxima.vence < e.ahora ? "var(--lacre)" : "var(--sello)"}`,
          }}
        >
          <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
            <div className="min-w-0 flex-1">
              <p className="rotulo">Lo próximo</p>
              <h2 className="text-[19px] font-semibold leading-tight mt-1.5 max-w-[54ch]">
                {proxima.descripcion}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <EtiquetaUrgencia u={urgencia(proxima.vence, e.ahora)} />
                {opProxima && (
                  <>
                    <span className="exp">{opProxima.id}</span>
                    <span className="text-[12px] text-[var(--tinta-suave)]">{ETAPAS[opProxima.etapa]}</span>
                  </>
                )}
              </div>
            </div>
            <div className="text-right">
              <Cuenta vence={proxima.vence} ahora={e.ahora} grande />
              <p className="text-[10.5px] text-[var(--tinta-tenue)] mt-0.5">
                {proxima.vence < e.ahora ? "de atraso" : "restante"}
              </p>
            </div>
            <div className="flex gap-2">
              <Boton tono="primario" ico="flechaDer" onClick={() => opProxima && nav.abrirOp(opProxima.id)}>
                {proxima.accion}
              </Boton>
              <Boton ico="tilde" onClick={() => d({ t: "tarea.marcar", id: proxima.id })}>
                Ya está
              </Boton>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 py-6 border-b border-[var(--linea)] bg-[var(--papel-alto)]">
          <p className="rotulo">Lo próximo</p>
          <h2 className="text-[19px] font-semibold mt-1.5">Terminaste todo lo del día.</h2>
          <p className="text-[13px] text-[var(--tinta-suave)] mt-1">
            Buen momento para captar: hay {e.leads.filter((l) => l.estado === "sin asignar").length} consultas
            sin asignar en la oficina.
          </p>
          <Boton className="mt-3" ico="mensaje" onClick={() => nav.irAsesor("consultas")}>
            Ver consultas
          </Boton>
        </div>
      )}

      <div className="grid grid-cols-3 divide-x divide-[var(--linea)] border-b border-[var(--linea)] bg-[var(--papel-alto)]">
        {[
          { l: "Vencidas", v: vencidas, c: vencidas ? "var(--lacre)" : "var(--tinta-tenue)" },
          { l: "Vencen hoy", v: hoy, c: hoy ? "var(--ambar)" : "var(--tinta-tenue)" },
          { l: "Comisión proyectada", v: usd(comision), c: "var(--tinta)" },
        ].map((s) => (
          <div key={s.l} className="px-4 py-2.5">
            <p className="rotulo">{s.l}</p>
            <p className="num text-[18px] font-semibold mt-1" style={{ color: s.c }}>
              {s.v}
            </p>
          </div>
        ))}
      </div>

      <div className="p-4 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] items-start">
        <Panel>
          <CabezaPanel titulo="Tareas de hoy" cuenta={abiertas.length} />
          <form
            onSubmit={(ev) => {
              ev.preventDefault();
              if (!nueva.trim()) return;
              d({ t: "tarea.nueva", descripcion: nueva.trim(), horas: 24 });
              setNueva("");
            }}
            className="flex gap-1.5 px-3.5 py-2.5 border-b border-[var(--linea-suave)]"
          >
            <Campo
              value={nueva}
              onChange={(ev) => setNueva(ev.target.value)}
              placeholder="Agregar una tarea al día…"
              aria-label="Nueva tarea"
            />
            <Boton tono="primario" ico="mas" disabled={!nueva.trim()} type="submit">
              Agregar
            </Boton>
          </form>
          {abiertas.length === 0 && hechas.length === 0 ? (
            <Vacio ico="tilde" titulo="Sin tareas" detalle="Agregá la primera desde el campo de arriba." />
          ) : (
            <>
              {abiertas.map((t) => (
                <FilaTarea key={t.id} t={t} />
              ))}
              {hechas.length > 0 && (
                <>
                  <p className="rotulo px-3.5 py-1.5 bg-[var(--papel-hundido)]/50 border-y border-[var(--linea-suave)]">
                    Hechas · {hechas.length}
                  </p>
                  {hechas.map((t) => (
                    <FilaTarea key={t.id} t={t} />
                  ))}
                </>
              )}
            </>
          )}
        </Panel>

        <Panel>
          <CabezaPanel titulo="Mis expedientes" cuenta={misOps.length} />
          {misOps.length === 0 ? (
            <Vacio titulo="Sin expedientes" detalle="Todavía no tenés operaciones asignadas." />
          ) : (
            misOps
              .map((o) => ({ o, r: riesgo(o, e.ahora) }))
              .sort((a, b) => b.r - a.r)
              .map(({ o, r }) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => nav.abrirOp(o.id)}
                  className="w-full text-left px-3.5 py-3 border-b border-[var(--linea-suave)] last:border-b-0 hover:bg-[var(--papel-hundido)]/40 transition-colors"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium truncate">{o.propiedad}</p>
                      <p className="exp mt-0.5">
                        {o.id} · {usd(o.precio)} · comisión {usd(o.comision)}
                      </p>
                    </div>
                    <Cuenta vence={o.vence} ahora={e.ahora} />
                  </div>
                  <div className="flex items-center gap-2.5 mt-2">
                    <RielEtapas etapas={ETAPAS} actual={o.etapa} compacto />
                    <span className="text-[11.5px] text-[var(--tinta-suave)]">{ETAPAS[o.etapa]}</span>
                    <span className="ml-auto">
                      <Riesgo v={r} />
                    </span>
                  </div>
                </button>
              ))
          )}
        </Panel>
      </div>
    </div>
  );
}

/* ═══ Consultas entrantes ═══════════════════════════════════ */

const ORIGEN_ICO: Record<Lead["origen"], string> = {
  ZonaProp: "ZP",
  Argenprop: "AP",
  "Mercado Libre": "ML",
  "Web RE/MAX": "RX",
  Cartel: "CA",
  Referido: "RF",
  WhatsApp: "WA",
};

function VistaConsultas() {
  const { e, d } = useApp();
  const nav = useNav();
  const [filtro, setFiltro] = useState<"todas" | "sin asignar" | "mias">("sin asignar");

  const lista = useMemo(() => {
    const xs =
      filtro === "sin asignar"
        ? e.leads.filter((l) => l.estado === "sin asignar")
        : filtro === "mias"
          ? e.leads.filter((l) => l.asesorId === e.yo)
          : e.leads;
    return [...xs].sort((a, b) => b.ingreso - a.ingreso);
  }, [e.leads, e.yo, filtro]);

  const sinAsignar = e.leads.filter((l) => l.estado === "sin asignar").length;
  const fueraDeSla = e.leads.filter(
    (l) => l.estado === "sin asignar" && (e.ahora - l.ingreso) / 60000 > 15,
  ).length;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="shrink-0 grid grid-cols-3 divide-x divide-[var(--linea)] border-b border-[var(--linea)] bg-[var(--papel-alto)]">
        {[
          { l: "Sin asignar", v: sinAsignar, c: sinAsignar ? "var(--lacre)" : "var(--verde)" },
          { l: "Fuera del acuerdo de 15 min", v: fueraDeSla, c: fueraDeSla ? "var(--lacre)" : "var(--verde)" },
          { l: "Entradas hoy", v: e.leads.filter((l) => e.ahora - l.ingreso < 86_400_000).length },
        ].map((s) => (
          <div key={s.l} className="px-4 py-2.5">
            <p className="rotulo">{s.l}</p>
            <p className="num text-[20px] font-semibold mt-1" style={{ color: s.c ?? "var(--tinta)" }}>
              {s.v}
            </p>
          </div>
        ))}
      </div>

      <div className="shrink-0 flex items-center gap-1 px-4 py-2 border-b border-[var(--linea)] bg-[var(--papel-alto)]">
        {(["sin asignar", "mias", "todas"] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={filtro === k}
            onClick={() => setFiltro(k)}
            className={cn(
              "h-7 px-2.5 rounded-[var(--r-sm)] text-[12.5px] font-medium transition-colors capitalize",
              filtro === k
                ? "bg-[var(--sello-tenue)] text-[var(--sello)]"
                : "text-[var(--tinta-suave)] hover:bg-[var(--papel-hundido)]",
            )}
          >
            {k === "mias" ? "Mías" : k}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scroll p-4">
        {lista.length === 0 ? (
          <Vacio
            ico="tilde"
            titulo="Nada en la bandeja"
            detalle="Cuando entre una consulta de los portales aparece acá con su reloj."
            accion={{ txt: "Ver todas", al: () => setFiltro("todas") }}
          />
        ) : (
          <ul className="space-y-2 max-w-[880px]">
            {lista.map((l) => {
              const p = e.propiedades.find((x) => x.id === l.propiedadId);
              const min = Math.round((e.ahora - l.ingreso) / 60000);
              const tarde = l.estado === "sin asignar" && min > 15;
              return (
                <li
                  key={l.id}
                  className="bg-[var(--papel-alto)] border rounded-[var(--r-md)] p-3.5"
                  style={{
                    borderColor: tarde ? "var(--lacre-borde)" : "var(--linea)",
                    borderLeft: `3px solid ${tarde ? "var(--lacre)" : l.estado === "sin asignar" ? "var(--ambar)" : "var(--linea-fuerte)"}`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="num shrink-0 grid place-items-center size-8 rounded-[var(--r-sm)] border text-[10px] font-semibold"
                      style={{
                        borderColor: "var(--linea)",
                        background: "var(--papel-hundido)",
                        color: "var(--tinta-suave)",
                      }}
                      title={l.origen}
                    >
                      {ORIGEN_ICO[l.origen]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[13.5px] font-semibold">{l.nombre}</p>
                        <span className="exp">{l.id}</span>
                        <Etiqueta t={l.estado === "sin asignar" ? (tarde ? "vencida" : "hoy") : "neutro"}>
                          {l.estado}
                        </Etiqueta>
                        {l.presupuesto && (
                          <span className="num text-[11.5px] text-[var(--tinta-suave)]">
                            presupuesto {usd(l.presupuesto)}
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] text-[var(--tinta-media)] mt-1">“{l.consulta}”</p>
                      <button
                        type="button"
                        onClick={() => p && nav.abrirProp(p.id)}
                        className="flex items-center gap-1.5 text-[11.5px] text-[var(--tinta-tenue)] mt-1.5 hover:text-[var(--sello)] transition-colors"
                      >
                        <Icono n="edificio" s={12} />
                        {p?.direccion} · {p ? usd(p.precio) : ""}
                      </button>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className="num text-[15px] font-semibold"
                        style={{ color: tarde ? "var(--lacre)" : "var(--tinta-media)" }}
                      >
                        {min < 60 ? `${min} min` : hace(l.ingreso, e.ahora).replace("hace ", "")}
                      </p>
                      <p className="text-[10.5px] text-[var(--tinta-tenue)]">desde el ingreso</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[var(--linea-suave)]">
                    <a
                      href={`https://wa.me/54911${l.telefono.replace(/\D/g, "").slice(-8)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[var(--r-sm)] border border-[var(--linea-fuerte)] text-[12px] hover:bg-[var(--papel-hundido)] transition-colors"
                    >
                      <Icono n="mensaje" s={13} />
                      WhatsApp
                    </a>
                    <a
                      href={`tel:${l.telefono.replace(/-/g, "")}`}
                      className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[var(--r-sm)] border border-[var(--linea-fuerte)] text-[12px] hover:bg-[var(--papel-hundido)] transition-colors"
                    >
                      <Icono n="telefono" s={13} />
                      {l.telefono}
                    </a>
                    {l.estado === "sin asignar" ? (
                      <Menu
                        alineado="izq"
                        disparador={(abrir) => (
                          <Boton chico tono="primario" ico="usuarioMas" onClick={abrir}>
                            Asignar
                          </Boton>
                        )}
                      >
                        {(cerrar) => (
                          <>
                            <ItemMenu
                              ico="persona"
                              onClick={() => {
                                d({ t: "lead.asignar", leadId: l.id, asesorId: e.yo });
                                cerrar();
                              }}
                            >
                              Tomarla yo
                            </ItemMenu>
                            {[...e.asesores]
                              .filter((a) => a.id !== e.yo)
                              .sort((a, b) => a.minRespuestaProm - b.minRespuestaProm)
                              .slice(0, 5)
                              .map((a) => (
                                <ItemMenu
                                  key={a.id}
                                  ico="persona"
                                  onClick={() => {
                                    d({ t: "lead.asignar", leadId: l.id, asesorId: a.id });
                                    cerrar();
                                  }}
                                >
                                  {a.nombre}
                                </ItemMenu>
                              ))}
                          </>
                        )}
                      </Menu>
                    ) : (
                      <>
                        <Boton
                          chico
                          onClick={() => d({ t: "lead.estado", leadId: l.id, estado: "contactado" })}
                        >
                          Contactado
                        </Boton>
                        <Boton
                          chico
                          tono="primario"
                          ico="agenda"
                          onClick={() => d({ t: "lead.estado", leadId: l.id, estado: "visita agendada" })}
                        >
                          Agendar visita
                        </Boton>
                      </>
                    )}
                    {l.asesorId && (
                      <span className="ml-auto flex items-center gap-1.5 text-[11.5px] text-[var(--tinta-tenue)]">
                        <Inicial txt={e.asesores.find((a) => a.id === l.asesorId)?.iniciales ?? "??"} s={20} />
                        {e.asesores.find((a) => a.id === l.asesorId)?.nombre}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ═══ Mi cartera ════════════════════════════════════════════ */

function VistaCarteraAsesor() {
  const { e } = useApp();
  const nav = useNav();
  const [q, setQ] = useState("");
  const [soloMias, setSoloMias] = useState(true);

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    return e.propiedades
      .filter((p) => !soloMias || p.asesorId === e.yo)
      .filter((p) => !t || `${p.direccion} ${p.barrio}`.toLowerCase().includes(t));
  }, [e.propiedades, e.yo, q, soloMias]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-[var(--linea)] bg-[var(--papel-alto)]">
        <Buscador valor={q} alCambiar={setQ} hint="Buscar dirección o barrio…" className="w-[260px]" />
        <button
          type="button"
          aria-pressed={soloMias}
          onClick={() => setSoloMias((v) => !v)}
          className={cn(
            "h-9 px-2.5 rounded-[var(--r-sm)] border text-[12.5px] transition-colors",
            soloMias
              ? "bg-[var(--sello-tenue)] border-[var(--sello-borde)] text-[var(--sello)]"
              : "bg-[var(--papel-alto)] border-[var(--linea-fuerte)] text-[var(--tinta-suave)]",
          )}
        >
          Solo las mías
        </button>
        <span className="num text-[11.5px] text-[var(--tinta-tenue)] ml-auto">{lista.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto scroll p-4">
        {lista.length === 0 ? (
          <Vacio
            ico="edificio"
            titulo="Ninguna propiedad coincide"
            detalle="Probá quitando el filtro para ver toda la cartera de la oficina."
            accion={{ txt: "Ver toda la oficina", al: () => setSoloMias(false) }}
          />
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {lista.map((p) => {
              const op = e.operaciones.find((o) => o.id === p.operacionId);
              const conv = p.consultas ? Math.round((p.visitas / p.consultas) * 100) : 0;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => nav.abrirProp(p.id)}
                  className="text-left bg-[var(--papel-alto)] border border-[var(--linea)] rounded-[var(--r-md)] p-3.5 hover:border-[var(--linea-fuerte)] alza transition-colors duration-[140ms]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-semibold leading-tight truncate">{p.direccion}</p>
                      <p className="exp mt-0.5">
                        {p.barrio} · {p.ambientes} amb · {p.superficie} m²
                      </p>
                    </div>
                    <Etiqueta
                      t={
                        p.estado === "Disponible"
                          ? "ok"
                          : p.estado === "Reservada"
                            ? "hoy"
                            : p.estado === "Vendida"
                              ? "neutro"
                              : "sello"
                      }
                    >
                      {p.estado}
                    </Etiqueta>
                  </div>

                  <p className="num text-[19px] font-semibold mt-2.5">
                    {usd(p.precio)}
                    {p.tipo === "Alquiler" && (
                      <span className="text-[12px] font-normal text-[var(--tinta-tenue)]"> /mes</span>
                    )}
                  </p>

                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[var(--linea-suave)]">
                    {[
                      { l: "días", v: p.diasEnCartera, alerta: p.diasEnCartera > 120 },
                      { l: "consultas", v: p.consultas },
                      { l: "visitas", v: p.visitas, alerta: conv < 20 },
                    ].map((s) => (
                      <div key={s.l}>
                        <p
                          className="num text-[14px] font-semibold"
                          style={{ color: s.alerta ? "var(--lacre)" : "var(--tinta)" }}
                        >
                          {s.v}
                        </p>
                        <p className="text-[10px] text-[var(--tinta-tenue)]">{s.l}</p>
                      </div>
                    ))}
                  </div>

                  {op && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--linea-suave)]">
                      <RielEtapas etapas={ETAPAS} actual={op.etapa} compacto />
                      <span className="text-[11px] text-[var(--tinta-suave)] truncate">{ETAPAS[op.etapa]}</span>
                      <span className="ml-auto">
                        <Cuenta vence={op.vence} ahora={e.ahora} />
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══ Generador de documentos ═══════════════════════════════ */

function redactar(
  plantillaId: string,
  op: { propiedad: string; barrio: string; precio: number; partes: { rol: string; nombre: string }[] },
  clausulas: string[],
  extras: Record<string, string>,
) {
  const d = new Date();
  const dia = d.getDate();
  const mes = d.toLocaleDateString("es-AR", { month: "long" });
  const hoy = `${dia === 1 ? "al 1 día" : `a los ${dia} días`} del mes de ${mes} de ${d.getFullYear()}`;
  const parte = (r: RegExp) => op.partes.find((p) => r.test(p.rol))?.nombre ?? "________________";
  const vendedor = parte(/vendedor|propietari/i);
  const comprador = parte(/comprador|inquilin|cesionari/i);
  const titulo = PLANTILLAS.find((p) => p.id === plantillaId)?.nombre ?? "";

  const cuerpo: string[] = [
    `En la Ciudad Autónoma de Buenos Aires, ${hoy}, entre ${vendedor}, en adelante «LA PARTE VENDEDORA», y ${comprador}, en adelante «LA PARTE COMPRADORA», con la intervención de RE/MAX Devoto en su carácter de intermediaria, se conviene lo siguiente:`,
    `PRIMERA — OBJETO. El presente instrumento tiene por objeto el inmueble sito en ${op.propiedad}, barrio de ${op.barrio}, Ciudad Autónoma de Buenos Aires.`,
    `SEGUNDA — PRECIO. Las partes fijan el precio en la suma de ${usd(op.precio)}, pagaderos según las condiciones que se detallan a continuación.`,
  ];

  if (plantillaId === "reserva") {
    cuerpo.push(
      `TERCERA — SEÑA. La parte compradora entrega en este acto la suma de ${extras.sena || "USD 10.000"} en concepto de seña, imputable a cuenta de precio, que la intermediaria recibe en depósito con cargo de rendición.`,
      `CUARTA — PLAZO. La presente reserva mantiene su vigencia por el término de ${extras.plazo || "10"} días corridos, vencido el cual queda automáticamente sin efecto.`,
    );
  }
  if (plantillaId === "boleto") {
    cuerpo.push(
      `TERCERA — ESCRITURACIÓN. La escritura traslativa de dominio se otorgará el ${extras.fecha || "__/__/____"} ante ${extras.escribano || "la escribanía designada por la parte compradora"}.`,
      `CUARTA — POSESIÓN. La posesión será entregada en el mismo acto de escrituración, libre de ocupantes, intrusos y deudas por impuestos, tasas y expensas.`,
    );
  }
  if (plantillaId === "alquiler") {
    cuerpo.push(
      `TERCERA — PLAZO. El plazo de locación se fija en ${extras.plazo || "36"} meses, conforme lo dispuesto por la Ley 27.551.`,
      `CUARTA — AJUSTE. El canon locativo se actualizará conforme el índice de contratos de locación (ICL) publicado por el BCRA, con la periodicidad que la normativa vigente establezca.`,
      `QUINTA — GARANTÍA. La parte locataria constituye la garantía indicada como ${extras.garantia || "garantía propietaria"}, cuya documentación integra el legajo del presente.`,
    );
  }
  if (plantillaId === "mandato") {
    cuerpo.push(
      `TERCERA — MANDATO. La parte propietaria confiere a RE/MAX Devoto autorización ${extras.exclusiva === "no" ? "no exclusiva" : "exclusiva"} para la comercialización del inmueble por el término de ${extras.plazo || "180"} días.`,
      `CUARTA — HONORARIOS. Se conviene una comisión del ${extras.comision || "4"}% sobre el precio efectivo de venta, a cargo de la parte propietaria, exigible al momento de la firma del boleto o instrumento equivalente.`,
    );
  }
  if (plantillaId === "cesion") {
    cuerpo.push(
      `TERCERA — CESIÓN. La parte cedente transfiere a la cesionaria la totalidad de los derechos y obligaciones emergentes del boleto de compraventa referido, quien los acepta de conformidad.`,
      `CUARTA — CONFORMIDAD. La presente cesión se perfecciona con la conformidad expresa de la parte vendedora original, que se agrega como anexo.`,
    );
  }

  if (clausulas.length) {
    cuerpo.push("CLÁUSULAS ADICIONALES CONVENIDAS ENTRE LAS PARTES:");
    clausulas.forEach((c, i) => cuerpo.push(`${i + 1}. ${c}.`));
  }

  cuerpo.push(
    `En prueba de conformidad se firman ${plantillaId === "mandato" ? "dos" : "tres"} ejemplares de un mismo tenor y a un solo efecto, en el lugar y fecha arriba indicados.`,
  );

  return { titulo, cuerpo };
}

function VistaDocs() {
  const { e } = useApp();
  const nav = useNav();
  const [paso, setPaso] = useState(0);
  const [opId, setOpId] = useState(e.operaciones[0]?.id ?? "");
  const [plantilla, setPlantilla] = useState("");
  const [clausulas, setClausulas] = useState<string[]>([]);
  const [extras, setExtras] = useState<Record<string, string>>({});
  const [listo, setListo] = useState(false);

  const op = e.operaciones.find((o) => o.id === opId);
  const doc = op && plantilla ? redactar(plantilla, op, clausulas, extras) : null;
  const pasos = ["Expediente y plantilla", "Datos del instrumento", "Cláusulas"];

  const campos =
    plantilla === "reserva"
      ? [
          { k: "sena", l: "Seña", ph: "USD 10.000" },
          { k: "plazo", l: "Vigencia (días)", ph: "10" },
        ]
      : plantilla === "boleto"
        ? [
            { k: "fecha", l: "Fecha de escritura", ph: "15/10/2026" },
            { k: "escribano", l: "Escribanía", ph: "Dr. Pablo Méndez" },
          ]
        : plantilla === "alquiler"
          ? [
              { k: "plazo", l: "Plazo (meses)", ph: "36" },
              { k: "garantia", l: "Tipo de garantía", ph: "Garantía propietaria" },
            ]
          : plantilla === "mandato"
            ? [
                { k: "plazo", l: "Vigencia (días)", ph: "180" },
                { k: "comision", l: "Comisión (%)", ph: "4" },
              ]
            : [];

  if (listo && doc && op) {
    return (
      <div className="h-full overflow-y-auto scroll p-4">
        <div className="max-w-[760px] mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Etiqueta t="ok">Documento listo</Etiqueta>
            <span className="exp">{op.id}</span>
            <div className="ml-auto flex gap-1.5">
              <Boton
                ico="clip"
                onClick={() => navigator.clipboard?.writeText([doc.titulo, ...doc.cuerpo].join("\n\n"))}
              >
                Copiar texto
              </Boton>
              <Boton ico="imprimir" onClick={() => window.print()}>
                Imprimir
              </Boton>
              <Boton
                tono="primario"
                ico="refrescar"
                onClick={() => {
                  setListo(false);
                  setPaso(0);
                  setPlantilla("");
                  setClausulas([]);
                  setExtras({});
                }}
              >
                Otro documento
              </Boton>
            </div>
          </div>
          <article className="bg-[var(--papel-alto)] border border-[var(--linea)] rounded-[var(--r-md)] alza px-8 py-9 trama">
            <h2 className="text-center text-[15px] font-semibold uppercase tracking-[0.14em]">{doc.titulo}</h2>
            <p className="text-center exp mt-1">
              RE/MAX Devoto · {op.id} · {op.propiedad}
            </p>
            <div className="mt-7 space-y-4">
              {doc.cuerpo.map((p, i) => (
                <p key={i} className="text-[13px] leading-[1.75] text-[var(--tinta-media)] text-justify">
                  {p}
                </p>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-10 mt-14 pt-2">
              {["Parte vendedora", "Parte compradora"].map((r) => (
                <div key={r} className="text-center">
                  <div className="border-t border-[var(--tinta-suave)]" />
                  <p className="rotulo mt-1.5">{r}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="shrink-0 flex items-center gap-0 px-4 py-2.5 border-b border-[var(--linea)] bg-[var(--papel-alto)]">
        {pasos.map((s, i) => (
          <div key={s} className="flex items-center">
            <button
              type="button"
              onClick={() => i < paso && setPaso(i)}
              disabled={i > paso}
              className={cn(
                "flex items-center gap-2 h-8 px-2.5 rounded-[var(--r-sm)] text-[12.5px] transition-colors",
                i === paso
                  ? "bg-[var(--sello-tenue)] text-[var(--sello)] font-semibold"
                  : i < paso
                    ? "text-[var(--tinta-media)] hover:bg-[var(--papel-hundido)]"
                    : "text-[var(--tinta-tenue)]",
              )}
            >
              <span
                className="num grid place-items-center size-[18px] rounded-[2px] text-[10px] font-semibold"
                style={{
                  background: i < paso ? "var(--verde)" : i === paso ? "var(--sello)" : "var(--linea)",
                  color: i <= paso ? "#fff" : "var(--tinta-tenue)",
                }}
              >
                {i < paso ? "✓" : i + 1}
              </span>
              {s}
            </button>
            {i < pasos.length - 1 && <span className="w-5 h-px bg-[var(--linea)]" />}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-hidden grid lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <div className="overflow-y-auto scroll p-4">
          {paso === 0 && (
            <div className="space-y-4 max-w-[560px]">
              <Selector rotulo="Expediente" value={opId} onChange={(ev) => setOpId(ev.target.value)}>
                {e.operaciones.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.id} · {o.propiedad}
                  </option>
                ))}
              </Selector>
              <div>
                <p className="rotulo mb-2">Instrumento a generar</p>
                <div className="space-y-1.5">
                  {PLANTILLAS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlantilla(p.id)}
                      aria-pressed={plantilla === p.id}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-[var(--r-sm)] border text-left transition-colors duration-[140ms]",
                        plantilla === p.id
                          ? "border-[var(--sello)] bg-[var(--sello-tenue)]"
                          : "border-[var(--linea)] bg-[var(--papel-alto)] hover:border-[var(--linea-fuerte)]",
                      )}
                    >
                      <span
                        className="grid place-items-center size-8 rounded-[var(--r-sm)] border shrink-0"
                        style={{
                          borderColor: plantilla === p.id ? "var(--sello-borde)" : "var(--linea)",
                          color: plantilla === p.id ? "var(--sello)" : "var(--tinta-tenue)",
                          background: "var(--papel-alto)",
                        }}
                      >
                        <Icono n="documento" s={16} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-semibold">{p.nombre}</span>
                        <span className="block text-[11.5px] text-[var(--tinta-tenue)]">{p.desc}</span>
                      </span>
                      {plantilla === p.id && (
                        <Icono n="tilde" s={16} className="ml-auto text-[var(--sello)]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {paso === 1 && op && (
            <div className="space-y-3 max-w-[520px]">
              <div className="bg-[var(--papel-alto)] border border-[var(--linea)] rounded-[var(--r-md)] p-3.5">
                <p className="rotulo mb-2">Datos tomados del expediente</p>
                <dl className="space-y-1.5">
                  {[
                    ["Inmueble", `${op.propiedad}, ${op.barrio}`],
                    ["Precio", usd(op.precio)],
                    ...op.partes.map((p) => [p.rol, p.nombre] as [string, string]),
                  ].map(([k, v]) => (
                    <div key={k} className="flex gap-3 text-[12.5px]">
                      <dt className="text-[var(--tinta-tenue)] w-[130px] shrink-0">{k}</dt>
                      <dd className="text-[var(--tinta)] font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              {campos.length > 0 && (
                <div className="grid grid-cols-2 gap-2.5">
                  {campos.map((c) => (
                    <Campo
                      key={c.k}
                      rotulo={c.l}
                      placeholder={c.ph}
                      value={extras[c.k] ?? ""}
                      onChange={(ev) => setExtras((x) => ({ ...x, [c.k]: ev.target.value }))}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {paso === 2 && (
            <div className="max-w-[560px]">
              <p className="rotulo mb-2">Cláusulas adicionales</p>
              <div className="space-y-1.5">
                {CLAUSULAS.map((c) => {
                  const on = clausulas.includes(c.texto);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() =>
                        setClausulas((xs) =>
                          xs.includes(c.texto) ? xs.filter((x) => x !== c.texto) : [...xs, c.texto],
                        )
                      }
                      className={cn(
                        "w-full flex items-center gap-2.5 p-2.5 rounded-[var(--r-sm)] border text-left transition-colors duration-[140ms]",
                        on
                          ? "border-[var(--sello)] bg-[var(--sello-tenue)]"
                          : "border-[var(--linea)] bg-[var(--papel-alto)] hover:border-[var(--linea-fuerte)]",
                      )}
                    >
                      <span
                        className={cn(
                          "grid place-items-center size-[17px] rounded-[var(--r-xs)] border shrink-0",
                          on
                            ? "bg-[var(--sello)] border-[var(--sello)] text-white"
                            : "border-[var(--linea-fuerte)] bg-[var(--papel-alto)]",
                        )}
                      >
                        {on && <Icono n="tilde" s={11} grosor={2.6} />}
                      </span>
                      <span className="flex-1 text-[12.5px]">{c.texto}</span>
                      <Etiqueta t={c.riesgo === "alto" ? "vencida" : c.riesgo === "medio" ? "hoy" : "neutro"}>
                        riesgo {c.riesgo}
                      </Etiqueta>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Vista previa viva */}
        <aside className="hidden lg:flex flex-col border-l border-[var(--linea)] bg-[var(--papel-hundido)]/40 overflow-hidden">
          <div className="shrink-0 px-3.5 h-9 flex items-center border-b border-[var(--linea)]">
            <p className="rotulo">Vista previa</p>
          </div>
          <div className="flex-1 overflow-y-auto scroll p-4">
            {doc ? (
              <div className="bg-[var(--papel-alto)] border border-[var(--linea)] rounded-[var(--r-sm)] p-5 alza">
                <p className="text-center text-[11px] font-semibold uppercase tracking-[0.12em]">{doc.titulo}</p>
                <p className="text-center exp mt-1">{op?.propiedad}</p>
                <div className="mt-4 space-y-2.5">
                  {doc.cuerpo.map((p, i) => (
                    <p key={i} className="text-[10.5px] leading-[1.7] text-[var(--tinta-suave)] text-justify">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <Vacio
                ico="documento"
                titulo="Elegí una plantilla"
                detalle="La vista previa se arma sola con los datos del expediente."
              />
            )}
          </div>
        </aside>
      </div>

      <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 border-t border-[var(--linea)] bg-[var(--papel-alto)]">
        {paso > 0 && (
          <Boton ico="chevIzq" onClick={() => setPaso((p) => p - 1)}>
            Atrás
          </Boton>
        )}
        <span className="text-[12px] text-[var(--tinta-tenue)]">
          {plantilla ? PLANTILLAS.find((p) => p.id === plantilla)?.nombre : "Ningún instrumento elegido"}
          {clausulas.length > 0 && ` · ${clausulas.length} cláusula(s)`}
        </span>
        <Boton
          className="ml-auto"
          tono="primario"
          ico={paso === 2 ? "documento" : "flechaDer"}
          disabled={paso === 0 && !plantilla}
          onClick={() => (paso < 2 ? setPaso((p) => p + 1) : setListo(true))}
        >
          {paso === 2 ? "Generar documento" : "Continuar"}
        </Boton>
        {op && (
          <Boton onClick={() => nav.abrirOp(op.id)}>Ver expediente</Boton>
        )}
      </div>
    </div>
  );
}

/* ═══ Perfil ════════════════════════════════════════════════ */

function VistaPerfil() {
  const { e, d } = useApp();
  const yo = e.asesores.find((a) => a.id === e.yo)!;
  const misOps = e.operaciones.filter((o) => o.asesorId === e.yo);
  const misTareas = e.tareas.filter((t) => t.asesorId === e.yo && !t.hecha);

  return (
    <div className="h-full overflow-y-auto scroll p-4">
      <div className="max-w-[720px] space-y-4">
        <Panel>
          <div className="flex items-center gap-3.5 p-4">
            <Inicial txt={yo.iniciales} s={48} />
            <div className="min-w-0 flex-1">
              <h2 className="text-[17px] font-semibold leading-tight">{yo.nombre}</h2>
              <p className="text-[12.5px] text-[var(--tinta-suave)]">{yo.rol} · RE/MAX Devoto</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-[var(--linea)] border-t border-[var(--linea)]">
            {[
              ["Activas", String(misOps.length)],
              ["Cerradas", String(yo.cerradas)],
              ["Conversión", `${yo.tasaConversion}%`],
              ["Comisión mes", usd(yo.comisionMes)],
            ].map(([l, v]) => (
              <div key={l} className="px-3.5 py-3">
                <p className="rotulo">{l}</p>
                <p className="num text-[17px] font-semibold mt-1">{v}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <CabezaPanel titulo="Simulación de la demo" />
          <div className="p-3.5 space-y-3">
            <p className="text-[12.5px] text-[var(--tinta-media)]">
              Cambiá de asesor para ver cómo se reordena todo el sistema: tareas, expedientes, consultas y
              comisiones se recalculan en el momento.
            </p>
            <Selector
              rotulo="Estoy viendo el sistema como"
              value={e.yo}
              onChange={(ev) => d({ t: "yo", asesorId: ev.target.value })}
              className="max-w-[300px]"
            >
              {e.asesores.slice(0, 12).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre} · {a.rol}
                </option>
              ))}
            </Selector>
            <p className="text-[11.5px] text-[var(--tinta-tenue)]">
              {misTareas.length} tareas abiertas · {misOps.length} expedientes ·{" "}
              {e.leads.filter((l) => l.asesorId === e.yo).length} consultas asignadas
            </p>
          </div>
        </Panel>

        <Panel>
          <CabezaPanel titulo="Mis próximos vencimientos" cuenta={misTareas.length} />
          {misTareas.length === 0 ? (
            <Vacio ico="tilde" titulo="Nada vence próximamente" />
          ) : (
            [...misTareas]
              .sort((a, b) => a.vence - b.vence)
              .slice(0, 6)
              .map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-[var(--linea-suave)] last:border-b-0"
                >
                  <span className="num text-[11px] text-[var(--tinta-tenue)] w-14">{fechaCorta(t.vence)}</span>
                  <span className="flex-1 min-w-0 text-[12.5px] truncate">{t.descripcion}</span>
                  <Cuenta vence={t.vence} ahora={e.ahora} />
                </div>
              ))
          )}
        </Panel>
      </div>
    </div>
  );
}

/* ═══ Contenedor ════════════════════════════════════════════ */

export default function AsesorPanel() {
  const nav = useNav();
  return (
    <>
      {nav.vistaAsesor === "dia" && <VistaDia />}
      {nav.vistaAsesor === "cartera" && <VistaCarteraAsesor />}
      {nav.vistaAsesor === "consultas" && <VistaConsultas />}
      {nav.vistaAsesor === "docs" && <VistaDocs />}
      {nav.vistaAsesor === "perfil" && <VistaPerfil />}
    </>
  );
}
