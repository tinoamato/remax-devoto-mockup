import { useMemo, useState } from "react";
import { BLOQUES, ETAPAS, objetivoMes, type Asesor } from "../data/mock";
import { cadenciaDe, proyeccionDe, riesgo, urgencia, useApp, useDerivados } from "../state/store";
import { useNav } from "../state/nav";
import { Icono } from "../lib/icons";
import { cn, fechaCorta, hace, usd } from "../lib/format";
import VistaCadencia, { ModalContacto } from "./Cadencia";
import VistaAutomatizaciones from "./Automatizaciones";
import VistaFacturacion, { COLOR_SEM, Trayectoria } from "./Facturacion";
import {
  Barra,
  Boton,
  Buscador,
  Cajon,
  CabezaPanel,
  Cuenta,
  Etiqueta,
  EtiquetaUrgencia,
  Inicial,
  ItemMenu,
  Menu,
  Panel,
  Riesgo,
  Selector,
  Td,
  Th,
  Vacio,
  BotonIcono,
} from "../components/ui";

/* ═══ Panel principal ═══════════════════════════════════════ */

function Dato({
  rotulo,
  valor,
  pie,
  color,
  grande,
  pctBarra,
}: {
  rotulo: string;
  valor: string;
  pie?: string;
  color?: string;
  grande?: boolean;
  pctBarra?: number;
}) {
  return (
    <div className="px-4 py-3">
      <p className="rotulo">{rotulo}</p>
      <p
        className={cn("num font-semibold leading-none mt-1.5", grande ? "text-[32px]" : "text-[19px]")}
        style={{ color: color ?? "var(--tinta)" }}
      >
        {valor}
      </p>
      {pie && <p className="text-[11.5px] text-[var(--tinta-tenue)] mt-1.5">{pie}</p>}
      {pctBarra !== undefined && (
        <div className="mt-1.5">
          <Barra pct={pctBarra} />
        </div>
      )}
    </div>
  );
}

function VistaPanel() {
  const { e, d } = useApp();
  const { opsConRiesgo, enRiesgo, asesorPorId, comisionProyectada, vencidosContacto } = useDerivados();
  const nav = useNav();

  const montoEnRiesgo = enRiesgo.reduce((s, x) => s + x.op.precio, 0);
  const pipeline = BLOQUES.map((b) => {
    const ops = e.operaciones.filter((o) => b.etapas.includes(o.etapa));
    return { ...b, n: ops.length, monto: ops.reduce((s, o) => s + o.precio, 0) };
  });
  /* Escritura, entrega de llaves o liquidación: la operación ya está cerrando. */
  const enCierre = e.operaciones.filter((o) => o.etapa >= 10);
  const montoEnCierre = enCierre.reduce((s, o) => s + o.precio, 0);
  const maxMonto = Math.max(...pipeline.map((p) => p.monto), 1);
  const ranking = [...e.asesores].sort((a, b) => b.comisionMes - a.comisionMes).slice(0, 6);
  const pctObjetivo = Math.round((comisionProyectada / objetivoMes) * 100);

  return (
    <div className="h-full overflow-y-auto scroll">
      {/* Franja dominante: lo que está en juego ahora */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-[var(--linea)] border-b border-[var(--linea)] bg-[var(--papel-alto)] trama">
        <Dato
          grande
          rotulo="Operaciones en riesgo"
          valor={String(enRiesgo.length)}
          pie={`${usd(montoEnRiesgo)} en juego`}
          color={enRiesgo.length > 3 ? "var(--lacre)" : "var(--ambar)"}
        />
        <Dato
          grande
          rotulo="En etapa de cierre"
          valor={String(enCierre.length)}
          pie={enCierre.length ? `${usd(montoEnCierre)} en escritura o liquidación` : "nada cerrando esta semana"}
          color="var(--verde)"
        />
        <Dato
          rotulo="Comisión proyectada"
          valor={usd(comisionProyectada)}
          pie={`${pctObjetivo}% del objetivo · ${usd(objetivoMes)}`}
          pctBarra={pctObjetivo}
        />
        <Dato
          rotulo="Pipeline activo"
          valor={String(e.operaciones.length)}
          pie={`${usd(e.operaciones.reduce((s, o) => s + o.precio, 0))} en cartera`}
        />
      </div>

      <div className="p-4 grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] xl:items-stretch">
        {/* Cola de riesgo — el foco de la pantalla */}
        <div className="flex flex-col min-w-0">
          <Panel className="xl:flex-1 xl:flex xl:flex-col">
            <CabezaPanel
              titulo="Cola de riesgo"
              cuenta={opsConRiesgo.length}
              extra={
                <Boton chico ico="torre" onClick={() => nav.irGerencia("torre")}>
                  Torre completa
                </Boton>
              }
            />
            <ul>
              {opsConRiesgo.slice(0, 8).map(({ op, r, u }) => {
                const a = asesorPorId.get(op.asesorId);
                const crit = op.docs.filter((x) => x.critico && x.estado !== "completo").length;
                return (
                  <li
                    key={op.id}
                    className="group flex items-center gap-3 px-3.5 py-2.5 border-b border-[var(--linea-suave)] last:border-b-0 hover:bg-[var(--papel-hundido)]/50 transition-colors duration-[120ms]"
                  >
                    <button
                      type="button"
                      onClick={() => nav.abrirOp(op.id)}
                      className="flex items-center gap-3 min-w-0 flex-1 text-left"
                    >
                      <Riesgo v={r} conNumero={false} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="text-[13px] font-medium truncate">{op.propiedad}</span>
                          {op.escalada && <Etiqueta t="vencida">Esc.</Etiqueta>}
                        </span>
                        <span className="flex items-center gap-1.5 mt-0.5 min-w-0">
                          <Inicial txt={a?.iniciales ?? "??"} s={16} />
                          <span className="hidden sm:inline text-[11.5px] text-[var(--tinta-suave)] truncate">
                            {a?.nombre}
                          </span>
                          <span className="exp truncate">
                            {op.id} · {usd(op.precio)}
                          </span>
                        </span>
                      </span>
                      <span className="hidden sm:block shrink-0 w-[112px] text-[12px] text-[var(--tinta-media)] truncate">
                        {ETAPAS[op.etapa]}
                        {crit > 0 && (
                          <span style={{ color: "var(--lacre)" }}> · {crit} crít.</span>
                        )}
                      </span>
                      <span className="shrink-0 text-right w-[86px]">
                        <Cuenta vence={op.vence} ahora={e.ahora} />
                        <span className="block mt-1">
                          <EtiquetaUrgencia u={u} />
                        </span>
                      </span>
                    </button>
                    <Menu
                      disparador={(abrir) => (
                        <BotonIcono ico="puntos" rotulo={`Acciones de ${op.id}`} onClick={abrir} className="size-7 shrink-0" />
                      )}
                    >
                      {(cerrarMenu) => (
                        <>
                          <ItemMenu ico="expediente" onClick={() => { nav.abrirOp(op.id); cerrarMenu(); }}>
                            Abrir expediente
                          </ItemMenu>
                          <ItemMenu ico="reloj" onClick={() => { d({ t: "op.plazo", opId: op.id, horas: 48 }); cerrarMenu(); }}>
                            Extender plazo 48 h
                          </ItemMenu>
                          {op.escalada ? (
                            <ItemMenu ico="tilde" onClick={() => { d({ t: "op.desescalar", opId: op.id }); cerrarMenu(); }}>
                              Cerrar escalamiento
                            </ItemMenu>
                          ) : (
                            <ItemMenu
                              ico="alerta"
                              peligro
                              onClick={() => {
                                d({ t: "op.escalar", opId: op.id, motivo: "Escalada desde la cola de riesgo" });
                                cerrarMenu();
                              }}
                            >
                              Escalar a gerencia
                            </ItemMenu>
                          )}
                        </>
                      )}
                    </Menu>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>

        {/* Columna derecha */}
        <div className="flex flex-col gap-4 min-w-0 xl:justify-between">
          {/* Camino al cierre — etapa y documentación, sin datos de clientes */}
          <Panel>
            <CabezaPanel titulo="Camino al cierre" cuenta={enCierre.length} />
            {enCierre.length === 0 ? (
              <Vacio
                ico="tilde"
                titulo="Nada en escritura o liquidación"
                detalle="Cuando una operación llegue a la etapa final aparece acá."
              />
            ) : (
              [...enCierre]
                .sort((a, b) => a.vence - b.vence)
                .map((op) => {
                  const ok = op.docs.filter((x) => x.estado === "completo").length;
                  const crit = op.docs.filter((x) => x.critico && x.estado !== "completo").length;
                  return (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => nav.abrirOp(op.id)}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 border-b border-[var(--linea-suave)] last:border-b-0 hover:bg-[var(--papel-hundido)]/50 transition-colors text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[12.5px] font-medium truncate">{op.propiedad}</p>
                        <p className="text-[11px] text-[var(--tinta-tenue)] truncate">
                          {ETAPAS[op.etapa]} · {ok}/{op.docs.length} doc.
                          {crit > 0 && <span style={{ color: "var(--lacre)" }}> · {crit} crít.</span>}
                        </p>
                      </div>
                      <Cuenta vence={op.vence} ahora={e.ahora} />
                    </button>
                  );
                })
            )}
          </Panel>

          {/* Equipo — lo urgente de producción, cadencia y respuesta en un solo lugar */}
          <Panel className={vencidosContacto.length ? "border-[var(--lacre-borde)]" : undefined}>
            <CabezaPanel
              titulo="Equipo"
              extra={
                <Boton chico onClick={() => nav.irGerencia("equipo")}>
                  Ver equipo
                </Boton>
              }
            />
            {ranking[0] && (
              <button
                type="button"
                onClick={() => {
                  nav.irGerencia("equipo");
                  nav.abrirAsesor(ranking[0].id);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 border-b border-[var(--linea-suave)] hover:bg-[var(--papel-hundido)]/50 transition-colors text-left"
              >
                <Inicial txt={ranking[0].iniciales} s={24} />
                <span className="flex-1 min-w-0">
                  <span className="block text-[12.5px] font-medium truncate">{ranking[0].nombre}</span>
                  <span className="block text-[10.5px] text-[var(--tinta-tenue)]">Líder del mes</span>
                </span>
                <span className="num text-[12.5px] font-semibold">{usd(ranking[0].comisionMes)}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => nav.irGerencia("cadencia")}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-[var(--papel-hundido)]/50 transition-colors text-left"
            >
              <span
                className="grid place-items-center size-6 rounded-[var(--r-xs)] shrink-0"
                style={{
                  background: vencidosContacto.length ? "var(--lacre-tenue)" : "var(--verde-tenue)",
                  color: vencidosContacto.length ? "var(--lacre)" : "var(--verde)",
                }}
              >
                <Icono n="pulso" s={13} />
              </span>
              <span className="flex-1 min-w-0 text-[12.5px]">
                {vencidosContacto.length
                  ? `${vencidosContacto.length} sin contacto del gerente`
                  : "Cadencia al día"}
              </span>
              {vencidosContacto.length > 0 && (
                <span className="num text-[12.5px] font-semibold" style={{ color: "var(--lacre)" }}>
                  +{vencidosContacto[0].atraso} d
                </span>
              )}
            </button>
          </Panel>

          {/* Pipeline */}
          <Panel>
            <CabezaPanel titulo="Pipeline por bloque" />
            <div className="p-3.5 space-y-2">
              {pipeline.map((b) => (
                <div key={b.label} className="flex items-center gap-3">
                  <span className="w-[92px] shrink-0 text-[12px] text-[var(--tinta-media)]">{b.label}</span>
                  <span className="num w-6 shrink-0 text-[12px] font-semibold text-right">{b.n}</span>
                  <span className="flex-1 h-4 bg-[var(--papel-hundido)] border border-[var(--linea-suave)] rounded-[2px] overflow-hidden">
                    <span
                      className="block h-full transition-[width] duration-[280ms] ease-out"
                      style={{ width: `${(b.monto / maxMonto) * 100}%`, background: b.color }}
                    />
                  </span>
                  <span className="num w-[104px] shrink-0 text-[12px] text-right text-[var(--tinta-media)]">
                    {b.monto ? usd(b.monto) : "—"}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ═══ Torre de control ══════════════════════════════════════ */

type Orden = "riesgo" | "plazo" | "monto" | "etapa";

function VistaTorre() {
  const { e, d } = useApp();
  const { asesorPorId } = useDerivados();
  const nav = useNav();
  const [q, setQ] = useState("");
  const [fAsesor, setFAsesor] = useState("");
  const [fEstado, setFEstado] = useState("");
  const [soloEscaladas, setSoloEscaladas] = useState(false);
  const [orden, setOrden] = useState<Orden>("riesgo");

  const filas = useMemo(() => {
    const t = q.trim().toLowerCase();
    let xs = e.operaciones.map((op) => ({
      op,
      r: riesgo(op, e.ahora),
      u: urgencia(op.vence, e.ahora),
    }));
    if (t) xs = xs.filter((x) => `${x.op.propiedad} ${x.op.id} ${x.op.barrio}`.toLowerCase().includes(t));
    if (fAsesor) xs = xs.filter((x) => x.op.asesorId === fAsesor);
    if (fEstado) xs = xs.filter((x) => x.u === fEstado);
    if (soloEscaladas) xs = xs.filter((x) => x.op.escalada);
    const cmp: Record<Orden, (a: typeof xs[number], b: typeof xs[number]) => number> = {
      riesgo: (a, b) => b.r - a.r,
      plazo: (a, b) => a.op.vence - b.op.vence,
      monto: (a, b) => b.op.precio - a.op.precio,
      etapa: (a, b) => b.op.etapa - a.op.etapa,
    };
    return xs.sort(cmp[orden]);
  }, [e.operaciones, e.ahora, q, fAsesor, fEstado, soloEscaladas, orden]);

  const conOps = e.asesores.filter((a) => e.operaciones.some((o) => o.asesorId === a.id));

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="shrink-0 flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-[var(--linea)] bg-[var(--papel-alto)]">
        <Buscador valor={q} alCambiar={setQ} hint="Buscar expediente o dirección…" className="w-[260px]" />
        <Selector value={fAsesor} onChange={(ev) => setFAsesor(ev.target.value)} className="w-[172px]">
          <option value="">Todos los asesores</option>
          {conOps.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </Selector>
        <Selector value={fEstado} onChange={(ev) => setFEstado(ev.target.value)} className="w-[150px]">
          <option value="">Todos los plazos</option>
          <option value="vencida">Vencidas</option>
          <option value="hoy">Vencen hoy</option>
          <option value="semana">Esta semana</option>
          <option value="ok">Al día</option>
        </Selector>
        <button
          type="button"
          aria-pressed={soloEscaladas}
          onClick={() => setSoloEscaladas((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1.5 h-9 px-2.5 rounded-[var(--r-sm)] border text-[12.5px] font-medium transition-colors",
            soloEscaladas
              ? "bg-[var(--lacre-tenue)] border-[var(--lacre-borde)] text-[var(--lacre)]"
              : "bg-[var(--papel-alto)] border-[var(--linea-fuerte)] text-[var(--tinta-media)] hover:bg-[var(--papel-hundido)]",
          )}
        >
          <Icono n="alerta" s={14} />
          Escaladas
        </button>
        <Selector value={orden} onChange={(ev) => setOrden(ev.target.value as Orden)} className="w-[136px] ml-auto">
          <option value="riesgo">Orden: riesgo</option>
          <option value="plazo">Orden: plazo</option>
          <option value="monto">Orden: monto</option>
          <option value="etapa">Orden: etapa</option>
        </Selector>
        <span className="num text-[11.5px] text-[var(--tinta-tenue)]">{filas.length}</span>
      </div>

      <div className="flex-1 overflow-auto scroll">
        {filas.length === 0 ? (
          <Vacio
            titulo="Ningún expediente coincide"
            detalle="Ajustá los filtros para volver a ver la cartera completa."
            accion={{
              txt: "Limpiar filtros",
              al: () => {
                setQ("");
                setFAsesor("");
                setFEstado("");
                setSoloEscaladas(false);
              },
            }}
          />
        ) : (
          <table className="w-full min-w-[900px] border-collapse">
            <thead className="sticky top-0 z-10">
              <tr>
                <Th ancho={38}>Rgo</Th>
                <Th>Expediente</Th>
                <Th ancho={160}>Asesor</Th>
                <Th ancho={168}>Etapa</Th>
                <Th ancho={104} alDer>Monto</Th>
                <Th ancho={104} alDer>Plazo</Th>
                <Th ancho={110}>Documentos</Th>
                <Th ancho={44} alDer>·</Th>
              </tr>
            </thead>
            <tbody>
              {filas.map(({ op, r, u }) => {
                const a = asesorPorId.get(op.asesorId);
                const ok = op.docs.filter((x) => x.estado === "completo").length;
                const crit = op.docs.filter((x) => x.critico && x.estado !== "completo").length;
                return (
                  <tr
                    key={op.id}
                    onClick={() => nav.abrirOp(op.id)}
                    className="cursor-pointer hover:bg-[var(--papel-hundido)]/50 transition-colors duration-[120ms]"
                    style={op.escalada ? { background: "var(--lacre-tenue)" } : undefined}
                  >
                    <Td>
                      <Riesgo v={r} conNumero={false} />
                    </Td>
                    <Td>
                      <span className="flex items-center gap-1.5">
                        <span className="font-medium truncate max-w-[240px]">{op.propiedad}</span>
                        {op.escalada && <Etiqueta t="vencida">Esc.</Etiqueta>}
                      </span>
                      <span className="exp block mt-0.5">
                        {op.id} · {op.barrio} · {op.tipo}
                      </span>
                    </Td>
                    <Td>
                      <span className="flex items-center gap-1.5">
                        <Inicial txt={a?.iniciales ?? "??"} s={22} />
                        <span className="text-[12px] truncate">{a?.nombre}</span>
                      </span>
                    </Td>
                    <Td className="text-[var(--tinta-media)]">
                      {op.etapa + 1}/13 · {ETAPAS[op.etapa]}
                    </Td>
                    <Td alDer className="num font-semibold">
                      {usd(op.precio)}
                    </Td>
                    <Td alDer>
                      <Cuenta vence={op.vence} ahora={e.ahora} />
                      <span className="block mt-1">
                        <EtiquetaUrgencia u={u} />
                      </span>
                    </Td>
                    <Td>
                      <span className={crit > 0 ? undefined : "text-[var(--tinta-media)]"} style={crit > 0 ? { color: "var(--lacre)" } : undefined}>
                        {ok}/{op.docs.length} doc.
                        {crit > 0 && ` · ${crit} crít.`}
                      </span>
                    </Td>
                    <Td alDer>
                      <span onClick={(ev) => ev.stopPropagation()} className="inline-flex">
                        <Menu
                          disparador={(abrir) => (
                            <BotonIcono ico="puntos" rotulo="Acciones" onClick={abrir} className="size-7" />
                          )}
                        >
                          {(cerrar) => (
                            <>
                              <ItemMenu
                                ico="expediente"
                                onClick={() => {
                                  nav.abrirOp(op.id);
                                  cerrar();
                                }}
                              >
                                Abrir expediente
                              </ItemMenu>
                              <ItemMenu
                                ico="reloj"
                                onClick={() => {
                                  d({ t: "op.plazo", opId: op.id, horas: 48 });
                                  cerrar();
                                }}
                              >
                                Extender plazo 48 h
                              </ItemMenu>
                              {op.escalada ? (
                                <ItemMenu
                                  ico="tilde"
                                  onClick={() => {
                                    d({ t: "op.desescalar", opId: op.id });
                                    cerrar();
                                  }}
                                >
                                  Cerrar escalamiento
                                </ItemMenu>
                              ) : (
                                <ItemMenu
                                  ico="alerta"
                                  peligro
                                  onClick={() => {
                                    d({
                                      t: "op.escalar",
                                      opId: op.id,
                                      motivo: "Escalada desde la torre de control",
                                    });
                                    cerrar();
                                  }}
                                >
                                  Escalar a gerencia
                                </ItemMenu>
                              )}
                            </>
                          )}
                        </Menu>
                      </span>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ═══ Equipo ════════════════════════════════════════════════ */

/** Semáforo del asesor: operaciones cerradas, no datos de consultas ni de contacto con el cliente. */
function perfDe(a: Asesor) {
  if (a.cerradas >= 9) return "verde";
  if (a.cerradas <= 3) return "rojo";
  return "ambar";
}

const PERF_COLOR = { verde: "var(--verde)", ambar: "var(--ambar)", rojo: "var(--lacre)" } as const;

function FichaAsesor({ id, cerrar }: { id: string; cerrar: () => void }) {
  const { e } = useApp();
  const nav = useNav();
  const [registrando, setRegistrando] = useState(false);
  const a = e.asesores.find((x) => x.id === id);
  if (!a) return null;
  const ops = e.operaciones.filter((o) => o.asesorId === id);
  const tareas = e.tareas.filter((t) => t.asesorId === id && !t.hecha);
  const vencidas = tareas.filter((t) => t.vence < e.ahora).length;
  const perf = perfDe(a);
  const cad = cadenciaDe(a, e.ahora, e.regla.margenAviso);
  const proy = proyeccionDe(a, e.umbrales);
  const maxMes = Math.max(...a.facturacionMensual, 1);
  const historial = e.contactos.filter((c) => c.asesorId === id).sort((x, y) => y.ts - x.ts);
  const colorCad =
    cad.estado === "vencido" ? "var(--lacre)" : cad.estado === "porVencer" ? "var(--ambar)" : "var(--verde)";

  return (
    <Cajon cerrar={cerrar} ancho={520}>
      <header className="shrink-0 px-4 py-3.5 border-b border-[var(--linea)] bg-[var(--papel-alto)] flex items-center gap-3">
        <Inicial txt={a.iniciales} s={40} />
        <div className="min-w-0 flex-1">
          <h2 className="text-[16px] font-semibold leading-tight truncate">{a.nombre}</h2>
          <p className="text-[12px] text-[var(--tinta-suave)]">{a.rol}</p>
        </div>
        <Etiqueta t={perf === "verde" ? "ok" : perf === "ambar" ? "hoy" : "vencida"}>
          {perf === "verde" ? "Al día" : perf === "ambar" ? "Observación" : "En alerta"}
        </Etiqueta>
        <BotonIcono ico="cruz" rotulo="Cerrar" onClick={cerrar} />
      </header>

      <div className="flex-1 overflow-y-auto scroll">
        <div className="grid grid-cols-5 divide-x divide-[var(--linea)] border-b border-[var(--linea)] bg-[var(--papel-alto)]">
          <Dato rotulo="Comisión mes" valor={usd(a.comisionMes)} color={PERF_COLOR[perf]} />
          <Dato rotulo="Activas" valor={String(a.activas)} />
          <Dato rotulo="Cerradas" valor={String(a.cerradas)} />
          <Dato rotulo="Ciclo prom." valor={`${a.tiempoPromedioDias} d`} />
          <Dato rotulo="Captaciones" valor={String(a.captacionesMes)} />
        </div>

        <Panel plano className="m-3">
          <CabezaPanel
            titulo="Producción móvil de 12 meses"
            extra={
              <Boton chico ico="tendencia" onClick={() => nav.irGerencia("facturacion")}>
                Ver la tabla
              </Boton>
            }
          />
          <div className="p-3.5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="num text-[26px] font-semibold leading-none" style={{ color: COLOR_SEM[proy.estadoHoy] }}>
                  {usd(proy.hoy)}
                </p>
                <p className="text-[11.5px] text-[var(--tinta-tenue)] mt-1.5">
                  facturado en los últimos 12 meses
                </p>
              </div>
              <Trayectoria p={proy} />
            </div>

            {/* Doce meses, el más reciente a la izquierda */}
            <div className="flex items-end gap-[3px] h-12 mt-4">
              {a.facturacionMensual.map((m, i) => (
                <span
                  key={i}
                  className="flex-1 rounded-[1px]"
                  style={{
                    height: `${Math.max(4, (m / maxMes) * 100)}%`,
                    background: i < 3 ? "var(--sello)" : i < 6 ? "var(--sello-borde)" : "var(--linea-fuerte)",
                  }}
                  title={`${i === 0 ? "Mes en curso" : `Hace ${i} meses`}: ${usd(m)}`}
                />
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-[var(--tinta-tenue)] mt-1">
              <span>mes en curso</span>
              <span>hace 11 meses</span>
            </div>

            <p
              className="text-[12.5px] mt-3 pt-3 border-t border-[var(--linea-suave)]"
              style={{ color: proy.escalones > 0 ? "var(--lacre)" : "var(--tinta-media)" }}
            >
              {proy.escalones > 0 ? (
                <>
                  Sin cerrar nada nuevo pasa de <strong>{proy.estadoHoy}</strong> a{" "}
                  <strong>{proy.estado9}</strong> en 9 meses: pierde{" "}
                  <span className="num">{usd(proy.hoy - proy.m9)}</span> por ventas que se salen de la
                  ventana.
                </>
              ) : (
                <>
                  Sostiene la categoría <strong>{proy.estadoHoy}</strong> a 9 meses aunque no cierre nada
                  nuevo.
                </>
              )}
              {proy.faltanteMinimo > 0 && (
                <>
                  {" "}
                  Para no terminar en rojo tiene que cerrar{" "}
                  <span className="num font-semibold">{usd(proy.faltanteMinimo)}</span> en los próximos 9
                  meses, y <span className="num">{usd(proy.faltanteVerde)}</span> para volver al verde.
                </>
              )}
            </p>
          </div>
        </Panel>

        <Panel plano className="m-3">
          <CabezaPanel
            titulo="Cadencia de contacto"
            extra={
              <Boton chico tono="primario" ico="telefono" onClick={() => setRegistrando(true)}>
                Registrar contacto
              </Boton>
            }
          />
          <div className="p-3.5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="num text-[26px] font-semibold leading-none" style={{ color: colorCad }}>
                  {cad.desde} días
                </p>
                <p className="text-[11.5px] text-[var(--tinta-tenue)] mt-1.5">
                  desde el último contacto · tope cada {a.topeDias} días
                </p>
              </div>
              <div className="text-right">
                <Etiqueta t={cad.estado === "vencido" ? "vencida" : cad.estado === "porVencer" ? "hoy" : "ok"}>
                  {cad.estado === "vencido"
                    ? `${cad.atraso} días de atraso`
                    : cad.atraso === 0
                      ? "Vence hoy"
                      : cad.estado === "porVencer"
                        ? `Vence en ${-cad.atraso} días`
                        : "Al día"}
                </Etiqueta>
              </div>
            </div>
            <div className="mt-3">
              <Barra pct={Math.min(100, cad.consumo * 100)} color={colorCad} />
            </div>
          </div>

          <p className="rotulo px-3.5 py-1.5 bg-[var(--papel-hundido)]/60 border-y border-[var(--linea-suave)]">
            Historial · {historial.length}
          </p>
          {historial.length === 0 ? (
            <Vacio ico="historial" titulo="Sin contactos registrados" />
          ) : (
            <ol className="p-3.5 pl-6 relative">
              <span
                className="absolute left-[19px] top-5 bottom-5 w-px bg-[var(--linea)]"
                aria-hidden="true"
              />
              {historial.slice(0, 8).map((c) => (
                <li key={c.id} className="relative pb-3 last:pb-0">
                  <span
                    className="absolute -left-[10px] top-[6px] size-[7px] rounded-[2px] border-2 border-[var(--papel)]"
                    style={{ background: "var(--sello)" }}
                    aria-hidden="true"
                  />
                  <p className="text-[12.5px] leading-snug">{c.nota}</p>
                  <p className="text-[11px] text-[var(--tinta-tenue)] mt-0.5">
                    <span className="num">{fechaCorta(c.ts)}</span> · {c.canal} · {hace(c.ts, e.ahora)}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel plano className="m-3">
          <CabezaPanel titulo="Expedientes a cargo" cuenta={ops.length} />
          {ops.length === 0 ? (
            <Vacio titulo="Sin expedientes cargados" detalle="Este asesor no tiene operaciones activas en el sistema." />
          ) : (
            ops.map((op) => (
              <button
                key={op.id}
                type="button"
                onClick={() => {
                  nav.abrirOp(op.id);
                  cerrar();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 border-b border-[var(--linea-suave)] last:border-b-0 hover:bg-[var(--papel-hundido)]/50 transition-colors text-left"
              >
                <Riesgo v={riesgo(op, e.ahora)} conNumero={false} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] font-medium truncate">{op.propiedad}</span>
                  <span className="exp block">{ETAPAS[op.etapa]}</span>
                </span>
                <Cuenta vence={op.vence} ahora={e.ahora} />
              </button>
            ))
          )}
        </Panel>

        <Panel plano className="m-3">
          <CabezaPanel
            titulo="Tareas abiertas"
            cuenta={tareas.length}
            extra={
              vencidas > 0 ? <Etiqueta t="vencida">{vencidas} vencidas</Etiqueta> : undefined
            }
          />
          {tareas.length === 0 ? (
            <Vacio ico="tilde" titulo="Sin tareas pendientes" />
          ) : (
            tareas.slice(0, 8).map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-2.5 px-3.5 py-2 border-b border-[var(--linea-suave)] last:border-b-0"
              >
                <span className="min-w-0 flex-1 text-[12.5px] truncate">{t.descripcion}</span>
                <Cuenta vence={t.vence} ahora={e.ahora} />
              </div>
            ))
          )}
        </Panel>
      </div>

      {registrando && <ModalContacto asesorId={a.id} cerrar={() => setRegistrando(false)} />}
    </Cajon>
  );
}

function VistaEquipo() {
  const { e } = useApp();
  const nav = useNav();
  const [q, setQ] = useState("");
  const [fPerf, setFPerf] = useState("");
  const [pag, setPag] = useState(0);
  const porPag = 14;

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase();
    return e.asesores
      .filter((a) => !t || a.nombre.toLowerCase().includes(t))
      .filter((a) => !fPerf || perfDe(a) === fPerf)
      .sort((a, b) => b.comisionMes - a.comisionMes);
  }, [e.asesores, q, fPerf]);

  const resumen = {
    verde: e.asesores.filter((a) => perfDe(a) === "verde").length,
    ambar: e.asesores.filter((a) => perfDe(a) === "ambar").length,
    rojo: e.asesores.filter((a) => perfDe(a) === "rojo").length,
  };
  const paginas = Math.max(1, Math.ceil(filtrados.length / porPag));
  const pagina = Math.min(pag, paginas - 1);
  const vista = filtrados.slice(pagina * porPag, (pagina + 1) * porPag);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="shrink-0 flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-[var(--linea)] bg-[var(--papel-alto)]">
        {(
          [
            ["verde", "al día", resumen.verde],
            ["ambar", "en observación", resumen.ambar],
            ["rojo", "en alerta", resumen.rojo],
          ] as const
        ).map(([k, l, n]) => (
          <button
            key={k}
            type="button"
            aria-pressed={fPerf === k}
            onClick={() => {
              setFPerf(fPerf === k ? "" : k);
              setPag(0);
            }}
            className={cn(
              "inline-flex items-center gap-1.5 h-9 px-2.5 rounded-[var(--r-sm)] border text-[12.5px] transition-colors",
              fPerf === k
                ? "bg-[var(--papel-hundido)] border-[var(--tinta-suave)]"
                : "bg-[var(--papel-alto)] border-[var(--linea-fuerte)] hover:bg-[var(--papel-hundido)]",
            )}
          >
            <span className="size-2 rounded-[1px]" style={{ background: PERF_COLOR[k] }} />
            <span className="num font-semibold">{n}</span>
            <span className="text-[var(--tinta-suave)]">{l}</span>
          </button>
        ))}
        <Buscador
          valor={q}
          alCambiar={(v) => {
            setQ(v);
            setPag(0);
          }}
          hint="Buscar asesor…"
          className="w-[220px] ml-auto"
        />
      </div>

      <div className="flex-1 overflow-auto scroll">
        <table className="w-full min-w-[880px] border-collapse">
          <thead className="sticky top-0 z-10">
            <tr>
              <Th>Asesor</Th>
              <Th ancho={70} alDer>Activas</Th>
              <Th ancho={80} alDer>Cerradas</Th>
              <Th ancho={92} alDer>Ciclo</Th>
              <Th ancho={112} alDer>Comisión</Th>
            </tr>
          </thead>
          <tbody>
            {vista.map((a) => {
              const perf = perfDe(a);
              return (
                <tr
                  key={a.id}
                  onClick={() => nav.abrirAsesor(a.id)}
                  className="cursor-pointer hover:bg-[var(--papel-hundido)]/50 transition-colors duration-[120ms]"
                >
                  <Td>
                    <span className="flex items-center gap-2.5">
                      <span className="w-[3px] h-7 rounded-[1px]" style={{ background: PERF_COLOR[perf] }} />
                      <Inicial txt={a.iniciales} s={26} />
                      <span className="min-w-0">
                        <span className="block font-medium truncate">{a.nombre}</span>
                        <span className="block text-[11px] text-[var(--tinta-tenue)]">{a.rol}</span>
                      </span>
                    </span>
                  </Td>
                  <Td alDer className="num font-semibold">
                    {a.activas}
                  </Td>
                  <Td alDer className="num text-[var(--tinta-media)]">
                    {a.cerradas}
                  </Td>
                  <Td alDer className="num text-[var(--tinta-media)]">
                    {a.tiempoPromedioDias} d
                  </Td>
                  <Td alDer className="num font-semibold">
                    {usd(a.comisionMes)}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-t border-[var(--linea)] bg-[var(--papel-alto)]">
        <p className="num text-[11.5px] text-[var(--tinta-tenue)]">
          {pagina * porPag + 1}–{Math.min((pagina + 1) * porPag, filtrados.length)} de {filtrados.length}
        </p>
        <div className="ml-auto flex gap-1">
          <Boton chico ico="chevIzq" disabled={pagina === 0} onClick={() => setPag(pagina - 1)}>
            Anterior
          </Boton>
          <Boton chico disabled={pagina >= paginas - 1} onClick={() => setPag(pagina + 1)}>
            Siguiente
          </Boton>
        </div>
      </div>
    </div>
  );
}

/* ═══ Cartera ═══════════════════════════════════════════════ */

function VistaCartera() {
  const { e } = useApp();
  const { asesorPorId } = useDerivados();
  const nav = useNav();
  const [q, setQ] = useState("");
  const [fEstado, setFEstado] = useState("");
  const [fTipo, setFTipo] = useState("");

  const filas = useMemo(() => {
    const t = q.trim().toLowerCase();
    return e.propiedades
      .filter((p) => !t || `${p.direccion} ${p.barrio}`.toLowerCase().includes(t))
      .filter((p) => !fEstado || p.estado === fEstado)
      .filter((p) => !fTipo || p.tipo === fTipo)
      .sort((a, b) => b.diasEnCartera - a.diasEnCartera);
  }, [e.propiedades, q, fEstado, fTipo]);

  const estancadas = filas.filter((p) => p.diasEnCartera > 120 && p.estado === "Disponible").length;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="shrink-0 flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-[var(--linea)] bg-[var(--papel-alto)]">
        <Buscador valor={q} alCambiar={setQ} hint="Buscar dirección o barrio…" className="w-[250px]" />
        <Selector value={fTipo} onChange={(ev) => setFTipo(ev.target.value)} className="w-[130px]">
          <option value="">Venta y alquiler</option>
          <option value="Venta">Venta</option>
          <option value="Alquiler">Alquiler</option>
        </Selector>
        <Selector value={fEstado} onChange={(ev) => setFEstado(ev.target.value)} className="w-[150px]">
          <option value="">Todos los estados</option>
          {["Disponible", "Reservada", "En escritura", "Alquilada", "Vendida"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </Selector>
        {estancadas > 0 && (
          <span
            className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-[var(--r-sm)] border text-[12px]"
            style={{
              color: "var(--lacre)",
              background: "var(--lacre-tenue)",
              borderColor: "var(--lacre-borde)",
            }}
          >
            <Icono n="alerta" s={14} />
            {estancadas} con más de 120 días en cartera
          </span>
        )}
        <span className="num text-[11.5px] text-[var(--tinta-tenue)] ml-auto">{filas.length}</span>
      </div>

      <div className="flex-1 overflow-auto scroll">
        <table className="w-full min-w-[900px] border-collapse">
          <thead className="sticky top-0 z-10">
            <tr>
              <Th>Propiedad</Th>
              <Th ancho={120}>Estado</Th>
              <Th ancho={112} alDer>Precio</Th>
              <Th ancho={82} alDer>Días</Th>
              <Th ancho={124}>Embudo</Th>
              <Th ancho={150}>Asesor</Th>
              <Th ancho={140}>Portales</Th>
            </tr>
          </thead>
          <tbody>
            {filas.map((p) => {
              const a = asesorPorId.get(p.asesorId);
              const conv = p.consultas ? Math.round((p.visitas / p.consultas) * 100) : 0;
              return (
                <tr
                  key={p.id}
                  onClick={() => nav.abrirProp(p.id)}
                  className="cursor-pointer hover:bg-[var(--papel-hundido)]/50 transition-colors duration-[120ms]"
                >
                  <Td>
                    <span className="font-medium truncate block max-w-[260px]">{p.direccion}</span>
                    <span className="exp block mt-0.5">
                      {p.barrio} · {p.ambientes} amb · {p.superficie} m²
                    </span>
                  </Td>
                  <Td>
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
                  </Td>
                  <Td alDer className="num font-semibold">
                    {usd(p.precio)}
                    {p.precio < p.precioInicial && (
                      <span className="block text-[10.5px] font-normal" style={{ color: "var(--ambar)" }}>
                        {Math.round(((p.precio - p.precioInicial) / p.precioInicial) * 100)}%
                      </span>
                    )}
                  </Td>
                  <Td alDer>
                    <span
                      className="num font-semibold"
                      style={{ color: p.diasEnCartera > 120 ? "var(--lacre)" : "var(--tinta-media)" }}
                    >
                      {p.diasEnCartera}
                    </span>
                  </Td>
                  <Td>
                    <span className="num text-[11.5px] text-[var(--tinta-media)]">
                      {p.consultas} → {p.visitas}
                    </span>
                    <span className="block mt-1">
                      <Barra pct={conv} color={conv < 20 ? "var(--lacre)" : "var(--verde)"} />
                    </span>
                  </Td>
                  <Td>
                    <span className="flex items-center gap-1.5">
                      <Inicial txt={a?.iniciales ?? "??"} s={22} />
                      <span className="text-[12px] truncate">{a?.nombre}</span>
                    </span>
                  </Td>
                  <Td>
                    {p.portales.length ? (
                      <span className="flex flex-wrap gap-1">
                        {p.portales.map((x) => (
                          <span
                            key={x}
                            className="text-[10px] px-1.5 h-[17px] inline-flex items-center rounded-[2px] border border-[var(--linea)] bg-[var(--papel-hundido)] text-[var(--tinta-suave)]"
                          >
                            {x}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className="text-[11.5px]" style={{ color: "var(--lacre)" }}>
                        sin publicar
                      </span>
                    )}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══ Alertas ═══════════════════════════════════════════════ */

function VistaAlertas() {
  const { e, d } = useApp();
  const nav = useNav();
  const [verResueltas, setVerResueltas] = useState(false);
  const lista = e.alertas.filter((a) => verResueltas || !a.resuelta);
  const SEV: Record<string, [string, string, string]> = {
    alta: ["var(--lacre)", "var(--lacre-tenue)", "var(--lacre-borde)"],
    media: ["var(--ambar)", "var(--ambar-tenue)", "var(--ambar-borde)"],
    baja: ["var(--tinta-suave)", "var(--papel-hundido)", "var(--linea)"],
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-[var(--linea)] bg-[var(--papel-alto)]">
        <Boton chico ico="tilde" onClick={() => d({ t: "alerta.leerTodas" })}>
          Marcar todo como leído
        </Boton>
        <button
          type="button"
          aria-pressed={verResueltas}
          onClick={() => setVerResueltas((v) => !v)}
          className={cn(
            "h-7 px-2.5 rounded-[var(--r-sm)] border text-[12px] transition-colors",
            verResueltas
              ? "bg-[var(--papel-hundido)] border-[var(--tinta-suave)]"
              : "bg-[var(--papel-alto)] border-[var(--linea-fuerte)] text-[var(--tinta-suave)]",
          )}
        >
          Incluir resueltas
        </button>
        <span className="num text-[11.5px] text-[var(--tinta-tenue)] ml-auto">{lista.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto scroll p-4">
        {lista.length === 0 ? (
          <Vacio
            ico="tilde"
            titulo="Bandeja limpia"
            detalle="No hay alertas abiertas en la oficina."
            accion={{ txt: "Ver el panel", al: () => nav.irGerencia("panel") }}
          />
        ) : (
          <ul className="space-y-2 max-w-[900px]">
            {lista.map((a) => {
              const [fg, bg, bd] = SEV[a.severidad];
              return (
                <li
                  key={a.id}
                  className={cn(
                    "flex items-start gap-3 p-3.5 bg-[var(--papel-alto)] border rounded-[var(--r-md)] transition-opacity",
                    a.resuelta && "opacity-55",
                  )}
                  style={{ borderColor: a.leida ? "var(--linea)" : bd, borderLeft: `3px solid ${fg}` }}
                >
                  <span className="mt-[2px] shrink-0" style={{ color: fg }}>
                    <Icono n={a.severidad === "baja" ? "campana" : "alerta"} s={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {!a.leida && !a.resuelta && (
                        <span className="size-1.5 rounded-full" style={{ background: fg }} aria-label="Sin leer" />
                      )}
                      <p className="text-[13.5px] font-semibold leading-tight">{a.titulo}</p>
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wider px-1.5 rounded-[2px]"
                        style={{ color: fg, background: bg }}
                      >
                        {a.severidad}
                      </span>
                      {a.resuelta && <Etiqueta t="ok">Resuelta</Etiqueta>}
                    </div>
                    <p className="text-[12.5px] text-[var(--tinta-media)] mt-1">{a.detalle}</p>
                    <p className="text-[11px] text-[var(--tinta-tenue)] mt-1.5">{hace(a.ts, e.ahora)}</p>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {a.refOp && (
                      <Boton
                        chico
                        onClick={() => {
                          d({ t: "alerta.leer", id: a.id });
                          nav.abrirOp(a.refOp!);
                        }}
                      >
                        Abrir {a.refOp}
                      </Boton>
                    )}
                    {a.refAsesor && (
                      <Boton
                        chico
                        onClick={() => {
                          nav.irGerencia("equipo");
                          nav.abrirAsesor(a.refAsesor!);
                        }}
                      >
                        Ver asesor
                      </Boton>
                    )}
                    {!a.resuelta && (
                      <Boton chico ico="tilde" onClick={() => d({ t: "alerta.resolver", id: a.id })}>
                        Resolver
                      </Boton>
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

/* ═══ Contenedor ════════════════════════════════════════════ */

export default function GerenciaPanel() {
  const nav = useNav();
  return (
    <>
      {nav.vistaGerencia === "panel" && <VistaPanel />}
      {nav.vistaGerencia === "torre" && <VistaTorre />}
      {nav.vistaGerencia === "equipo" && <VistaEquipo />}
      {nav.vistaGerencia === "cartera" && <VistaCartera />}
      {nav.vistaGerencia === "alertas" && <VistaAlertas />}
      {nav.vistaGerencia === "cadencia" && <VistaCadencia />}
      {nav.vistaGerencia === "automatizaciones" && <VistaAutomatizaciones />}
      {nav.vistaGerencia === "facturacion" && <VistaFacturacion />}
      {/* La ficha del asesor se abre desde cualquier vista, no sólo desde Equipo. */}
      {nav.asesor && <FichaAsesor id={nav.asesor} cerrar={() => nav.abrirAsesor(null)} />}
    </>
  );
}
