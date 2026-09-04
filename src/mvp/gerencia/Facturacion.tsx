import { useMemo, useState } from "react";
import { useApp, useDerivados, rotuloMes, TRAMOS, type Proyeccion, type Semaforo } from "../tienda";
import {
  Boton,
  Buscador,
  CabezaPanel,
  Etiqueta,
  Inicial,
  Modal,
  Panel,
  PistaScroll,
  Td,
  Th,
  Vacio,
} from "../../components/ui";
import { Icono } from "../../lib/icons";
import { cn, usd } from "../../lib/format";

const COLOR: Record<Semaforo, string> = {
  alto: "var(--verde)",
  medio: "var(--ambar)",
  bajo: "var(--lacre)",
};
const ETIQ: Record<Semaforo, string> = { alto: "ok", medio: "hoy", bajo: "vencida" };
const NOMBRE: Record<Semaforo, string> = {
  alto: "Alto rendimiento",
  medio: "Sostiene",
  bajo: "Low performance",
};

/* ── Serie de 12 meses ──────────────────────────────────────── */

function Serie({ f, ahora, alto = 22 }: { f: number[]; ahora: number; alto?: number }) {
  const max = Math.max(...f, 1);
  return (
    <span className="inline-flex items-end gap-[2px]" style={{ height: alto }}>
      {[...f].reverse().map((v, i) => {
        const offset = 11 - i;
        return (
          <span
            key={i}
            title={`${rotuloMes(offset, ahora)} · ${usd(v)}`}
            className="w-[5px] rounded-[1px]"
            style={{
              height: Math.max(2, (v / max) * alto),
              background: v === 0 ? "var(--linea-fuerte)" : offset === 0 ? "var(--sello)" : "var(--tinta-tenue)",
            }}
          />
        );
      })}
    </span>
  );
}

/* ── Carga mensual ──────────────────────────────────────────── */

function CargarMes({ cerrar }: { cerrar: () => void }) {
  const { e, d } = useApp();
  const [mes, setMes] = useState(0);
  const [borrador, setBorrador] = useState<Record<string, string>>(() =>
    Object.fromEntries(e.asesores.map((a) => [a.id, String(a.facturacion[0] || "")])),
  );

  const cambiarMes = (m: number) => {
    setMes(m);
    setBorrador(Object.fromEntries(e.asesores.map((a) => [a.id, String(a.facturacion[m] || "")])));
  };

  const total = Object.values(borrador).reduce((s, v) => s + (Number(v) || 0), 0);

  return (
    <Modal
      titulo="Cargar las comisiones del mes"
      sub="Una vez por mes, agente por agente. Es lo mismo que hacés hoy en la planilla."
      cerrar={cerrar}
      ancho={620}
      pie={
        <>
          <Boton onClick={cerrar}>Cancelar</Boton>
          <Boton
            tono="primario"
            onClick={() => {
              for (const a of e.asesores) {
                const v = Number(borrador[a.id]) || 0;
                if (v !== a.facturacion[mes]) d({ t: "factura.set", asesorId: a.id, mes, monto: v });
              }
              cerrar();
            }}
          >
            Guardar {rotuloMes(mes, e.ahora)}
          </Boton>
        </>
      }
    >
      <label className="block mb-3">
        <span className="rotulo block mb-1">Mes que estás cargando</span>
        <div className="flex flex-wrap gap-1">
          {[0, 1, 2].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => cambiarMes(m)}
              className={cn(
                "num h-8 px-3 rounded-[var(--r-sm)] border text-[12.5px] transition-colors",
                mes === m
                  ? "bg-[var(--sello-tenue)] border-[var(--sello)] text-[var(--sello)] font-semibold"
                  : "bg-[var(--papel-alto)] border-[var(--linea-fuerte)] hover:bg-[var(--papel-hundido)]",
              )}
            >
              {rotuloMes(m, e.ahora)}
            </button>
          ))}
        </div>
      </label>

      <p className="text-[12px] text-[var(--tinta-suave)] mb-2">
        Poné la comisión que se lleva cada uno. Si sabés que una reserva se va a firmar, cargala igual: el
        criterio lo ponés vos.
      </p>

      <ul className="divide-y divide-[var(--linea-suave)] border-y border-[var(--linea-suave)]">
        {e.asesores.map((a) => (
          <li key={a.id} className="flex items-center gap-2.5 py-1.5">
            <Inicial txt={a.iniciales} s={24} />
            <span className="text-[12.5px] flex-1 min-w-0 truncate">{a.nombre}</span>
            <span className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-[var(--tinta-tenue)] pointer-events-none">
                USD
              </span>
              <input
                value={borrador[a.id] ?? ""}
                onChange={(ev) => setBorrador((b) => ({ ...b, [a.id]: ev.target.value }))}
                inputMode="numeric"
                aria-label={`Comisión de ${a.nombre}`}
                className="num w-[124px] h-8 pl-9 pr-2 text-right text-[13px] rounded-[var(--r-sm)] border border-[var(--linea-fuerte)] bg-[var(--papel-hundido)] outline-none focus:bg-[var(--papel-alto)] focus:border-[var(--sello)]"
              />
            </span>
          </li>
        ))}
      </ul>

      <p className="flex items-baseline gap-2 mt-3">
        <span className="rotulo">Total del mes</span>
        <span className="num ml-auto text-[15px] font-semibold">{usd(total)}</span>
      </p>
    </Modal>
  );
}

/* ── Umbrales ───────────────────────────────────────────────── */

function Umbrales() {
  const { e, d } = useApp();
  const u = e.umbrales;
  const campo =
    "num inline-flex items-center h-6 w-[100px] px-1.5 rounded-[var(--r-xs)] border text-[12.5px] font-semibold outline-none bg-[var(--papel-hundido)]";

  return (
    <div className="px-4 py-3 border-b border-[var(--linea)] bg-[var(--papel-alto)] trama">
      <div className="flex items-center gap-2 mb-1.5">
        <Icono n="regla" s={14} className="text-[var(--tinta-tenue)]" />
        <p className="rotulo">Cómo se define el rendimiento</p>
      </div>
      <p className="text-[13.5px] leading-[2] text-[var(--tinta-media)]">
        Se mira la <span className="text-[var(--tinta)] font-semibold">comisión acumulada de 12 meses</span>. Es{" "}
        <span className="font-semibold" style={{ color: "var(--verde)" }}>
          alto rendimiento
        </span>{" "}
        desde{" "}
        <input
          type="number"
          step={1000}
          value={u.alto}
          aria-label="Umbral de alto rendimiento"
          onChange={(ev) => d({ t: "umbrales.set", cambio: { alto: Number(ev.target.value) || 0 } })}
          className={campo}
          style={{ borderColor: "var(--verde-borde)", color: "var(--verde)" }}
        />{" "}
        y cae en{" "}
        <span className="font-semibold" style={{ color: "var(--lacre)" }}>
          low performance
        </span>{" "}
        por debajo de{" "}
        <input
          type="number"
          step={1000}
          value={u.bajo}
          aria-label="Umbral de low performance"
          onChange={(ev) => d({ t: "umbrales.set", cambio: { bajo: Number(ev.target.value) || 0 } })}
          className={campo}
          style={{ borderColor: "var(--lacre-borde)", color: "var(--lacre)" }}
        />
        . Un agente con menos de{" "}
        <input
          type="number"
          step={1}
          value={u.graciaMeses}
          aria-label="Meses de gracia"
          onChange={(ev) => d({ t: "umbrales.set", cambio: { graciaMeses: Number(ev.target.value) || 0 } })}
          className={cn(campo, "w-[64px]")}
          style={{ borderColor: "var(--linea-fuerte)" }}
        />{" "}
        meses en la oficina todavía no computa.
      </p>
    </div>
  );
}

/* ── Vista ──────────────────────────────────────────────────── */

export default function Facturacion() {
  const { e } = useApp();
  const { proyecciones, computan, seApagan, facturacion12 } = useDerivados();
  const [tramo, setTramo] = useState(0);
  const [q, setQ] = useState("");
  const [soloRiesgo, setSoloRiesgo] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [detalle, setDetalle] = useState<Proyeccion | null>(null);

  const idx = TRAMOS.indexOf(tramo as (typeof TRAMOS)[number]);

  const filas = useMemo(() => {
    const t = q.trim().toLowerCase();
    return proyecciones
      .filter((p) => !t || p.asesor.nombre.toLowerCase().includes(t))
      .filter((p) => !soloRiesgo || (!p.nuevo && p.tramos[idx].estado === "bajo"))
      .sort((a, b) => a.tramos[idx].monto - b.tramos[idx].monto);
  }, [proyecciones, q, soloRiesgo, idx]);

  const bajos = computan.filter((p) => p.tramos[idx].estado === "bajo").length;
  const nuevos = proyecciones.filter((p) => p.nuevo).length;
  const porCumplir = proyecciones.filter((p) => p.porCumplir);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="shrink-0 grid grid-cols-2 lg:grid-cols-4 divide-x divide-[var(--linea)] border-b border-[var(--linea)] bg-[var(--papel-alto)]">
        <div className="px-4 py-3">
          <p className="rotulo">Low performance {tramo === 0 ? "hoy" : `a ${tramo} meses`}</p>
          <p
            className="num text-[30px] font-semibold leading-none mt-1.5"
            style={{ color: bajos ? "var(--lacre)" : "var(--verde)" }}
          >
            {bajos}
          </p>
          <p className="text-[11.5px] text-[var(--tinta-tenue)] mt-1.5">
            de {computan.length} agentes que computan
          </p>
        </div>
        <div className="px-4 py-3">
          <p className="rotulo">Caen antes de 6 meses</p>
          <p
            className="num text-[30px] font-semibold leading-none mt-1.5"
            style={{ color: seApagan.length ? "var(--ambar)" : "var(--verde)" }}
          >
            {seApagan.length}
          </p>
          <p className="text-[11.5px] text-[var(--tinta-tenue)] mt-1.5">hoy están bien, sin cerrar nada caen</p>
        </div>
        <div className="px-4 py-3">
          <p className="rotulo">Producción de la oficina</p>
          <p className="num text-[19px] font-semibold leading-none mt-1.5">{usd(facturacion12)}</p>
          <p className="text-[11.5px] text-[var(--tinta-tenue)] mt-1.5">
            últimos 12 meses · {proyecciones.length} agentes
          </p>
        </div>
        <div className="px-4 py-3">
          <p className="rotulo">Agentes nuevos</p>
          <p className="num text-[19px] font-semibold leading-none mt-1.5">
            {nuevos}
            <span className="text-[13px] font-normal text-[var(--tinta-tenue)]"> sin computar</span>
          </p>
          <p className="text-[11.5px] text-[var(--tinta-tenue)] mt-1.5">
            {porCumplir.length > 0
              ? `${porCumplir.length} cumplen los ${e.umbrales.graciaMeses} meses en menos de medio año`
              : `ninguno cerca de cumplir los ${e.umbrales.graciaMeses} meses`}
          </p>
        </div>
      </div>

      <Umbrales />

      {/* Tramos */}
      <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-[var(--linea)] bg-[var(--papel-alto)] overflow-x-auto sin-scroll">
        <p className="rotulo shrink-0">Ver el acumulado</p>
        <div className="flex items-center rounded-[var(--r-sm)] border border-[var(--linea-fuerte)] p-[2px] shrink-0">
          {TRAMOS.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={tramo === m}
              onClick={() => setTramo(m)}
              className={cn(
                "num h-7 px-2.5 rounded-[2px] text-[12px] font-medium transition-colors whitespace-nowrap",
                tramo === m
                  ? "bg-[var(--sello)] text-white"
                  : "text-[var(--tinta-suave)] hover:text-[var(--tinta)] hover:bg-[var(--papel-hundido)]",
              )}
            >
              {m === 0 ? "hoy" : `+${m} meses`}
            </button>
          ))}
        </div>
        <p className="text-[12px] text-[var(--tinta-suave)] shrink-0">
          {tramo === 0
            ? "Lo que cada uno lleva acumulado en los últimos 12 meses."
            : `Dónde queda cada uno dentro de ${tramo} meses si no cierra ninguna operación nueva.`}
        </p>
        <Boton chico tono="primario" ico="planilla" className="ml-auto shrink-0" onClick={() => setCargando(true)}>
          Cargar el mes
        </Boton>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scroll p-4">
        <Panel>
          <CabezaPanel
            titulo="Comisión por agente"
            cuenta={filas.length}
            extra={<Buscador valor={q} alCambiar={setQ} hint="Buscar agente…" className="w-[160px]" />}
          />

          <div className="flex flex-wrap items-center gap-1.5 px-3.5 py-2 border-b border-[var(--linea-suave)]">
            <button
              type="button"
              aria-pressed={soloRiesgo}
              onClick={() => setSoloRiesgo((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[var(--r-sm)] border text-[12px] transition-colors",
                soloRiesgo
                  ? "bg-[var(--lacre-tenue)] border-[var(--lacre)] text-[var(--lacre)]"
                  : "bg-[var(--papel-alto)] border-[var(--linea-fuerte)] hover:bg-[var(--papel-hundido)]",
              )}
            >
              <span className="size-2 rounded-[1px]" style={{ background: COLOR.bajo }} />
              <span className="num font-semibold">{bajos}</span>
              en low performance
            </button>
            <p className="text-[11.5px] text-[var(--tinta-tenue)] ml-1">
              Ordenado de menor a mayor acumulado: arriba está el que más urge mirar.
            </p>
          </div>

          <PistaScroll />

          <div className="overflow-x-auto scroll">
            {filas.length === 0 ? (
              <Vacio titulo="Ningún agente coincide" ico="equipo" accion={{ txt: "Limpiar", al: () => { setQ(""); setSoloRiesgo(false); } }} />
            ) : (
              <table className="w-full min-w-[720px] border-collapse">
                <thead>
                  <tr>
                    <Th>Agente</Th>
                    <Th ancho={120}>Últimos 12 meses</Th>
                    <Th ancho={132} alDer>
                      {tramo === 0 ? "Acumulado hoy" : `Acumulado +${tramo}m`}
                    </Th>
                    <Th ancho={130}>Estado</Th>
                    <Th ancho={120} alDer>
                      Cae en
                    </Th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((p) => {
                    const t = p.tramos[idx];
                    return (
                      <tr
                        key={p.asesor.id}
                        onClick={() => setDetalle(p)}
                        className="cursor-pointer hover:bg-[var(--papel-hundido)]/50 transition-colors"
                        style={
                          !p.nuevo && t.estado === "bajo" ? { background: "var(--lacre-tenue)" } : undefined
                        }
                      >
                        <Td>
                          <span className="flex items-center gap-2.5">
                            <span
                              className="w-[3px] h-7 rounded-[1px] shrink-0"
                              style={{ background: p.nuevo ? "var(--linea-fuerte)" : COLOR[t.estado] }}
                            />
                            <Inicial txt={p.asesor.iniciales} s={26} />
                            <span className="min-w-0">
                              <span className="block font-medium truncate">{p.asesor.nombre}</span>
                              <span className="num block text-[11px] text-[var(--tinta-tenue)]">
                                {p.asesor.antiguedadMeses} meses en la oficina
                              </span>
                            </span>
                          </span>
                        </Td>
                        <Td>
                          <Serie f={p.asesor.facturacion} ahora={e.ahora} />
                        </Td>
                        <Td alDer>
                          <span className="num text-[13.5px] font-semibold">{usd(t.monto)}</span>
                          {tramo > 0 && (
                            <span className="num block text-[10.5px] text-[var(--tinta-tenue)]">
                              hoy {usd(p.hoy)}
                            </span>
                          )}
                        </Td>
                        <Td>
                          {p.nuevo ? (
                            <span className="text-[11.5px] text-[var(--tinta-suave)]">
                              Nuevo · computa en {p.mesesParaComputar} meses
                            </span>
                          ) : (
                            <Etiqueta t={ETIQ[t.estado]}>{NOMBRE[t.estado]}</Etiqueta>
                          )}
                        </Td>
                        <Td alDer>
                          {p.nuevo ? (
                            <span className="text-[12px] text-[var(--tinta-tenue)]">—</span>
                          ) : p.mesesHastaBajo === null ? (
                            <span className="text-[12px]" style={{ color: "var(--verde)" }}>
                              aguanta
                            </span>
                          ) : p.mesesHastaBajo === 0 ? (
                            <span className="text-[12px] text-[var(--tinta-suave)]">ya cayó</span>
                          ) : (
                            <span
                              className="num text-[14px] font-semibold"
                              style={{ color: p.mesesHastaBajo <= 3 ? "var(--lacre)" : "var(--ambar)" }}
                            >
                              {p.mesesHastaBajo} meses
                            </span>
                          )}
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Panel>

        {porCumplir.length > 0 && (
          <Panel className="mt-3">
            <CabezaPanel titulo="Agentes nuevos que están por empezar a computar" cuenta={porCumplir.length} />
            <ul className="divide-y divide-[var(--linea-suave)]">
              {porCumplir.map((p) => (
                <li key={p.asesor.id} className="flex items-center gap-3 px-3.5 py-2.5">
                  <Inicial txt={p.asesor.iniciales} s={26} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium truncate">{p.asesor.nombre}</span>
                    <span className="text-[11.5px] text-[var(--tinta-suave)]">
                      Cumple los {e.umbrales.graciaMeses} meses en {p.mesesParaComputar}{" "}
                      {p.mesesParaComputar === 1 ? "mes" : "meses"}. Con lo que lleva hoy entraría como{" "}
                      <span style={{ color: COLOR[p.estadoHoy] }}>{NOMBRE[p.estadoHoy].toLowerCase()}</span>.
                    </span>
                  </span>
                  <span className="num text-[13px] font-semibold shrink-0">{usd(p.hoy)}</span>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>

      {cargando && <CargarMes cerrar={() => setCargando(false)} />}

      {detalle && (
        <Modal
          titulo={detalle.asesor.nombre}
          sub={`${detalle.asesor.antiguedadMeses} meses en la oficina · ${detalle.asesor.email}`}
          cerrar={() => setDetalle(null)}
          ancho={520}
          pie={<Boton tono="primario" onClick={() => setDetalle(null)}>Cerrar</Boton>}
        >
          <p className="rotulo mb-2">Comisión mes a mes</p>
          <ul className="grid grid-cols-2 gap-x-4">
            {detalle.asesor.facturacion.map((v, i) => (
              <li
                key={i}
                className="flex items-baseline gap-2 py-1 border-b border-[var(--linea-suave)] text-[12.5px]"
              >
                <span className="num text-[var(--tinta-suave)] w-[52px]">{rotuloMes(i, e.ahora)}</span>
                <span className={cn("num ml-auto font-medium", v === 0 && "text-[var(--tinta-tenue)]")}>
                  {v === 0 ? "—" : usd(v)}
                </span>
              </li>
            ))}
          </ul>

          <p className="rotulo mt-4 mb-2">Proyección si no cierra nada nuevo</p>
          <ul className="space-y-1">
            {detalle.tramos.map((t) => (
              <li key={t.m} className="flex items-center gap-2.5">
                <span className="num text-[12px] text-[var(--tinta-suave)] w-[64px] shrink-0">
                  {t.m === 0 ? "hoy" : `+${t.m} meses`}
                </span>
                <span className="flex-1 h-2 rounded-[1px] bg-[var(--papel-hundido)] border border-[var(--linea-suave)] overflow-hidden">
                  <span
                    className="block h-full"
                    style={{
                      width: `${Math.min(100, (t.monto / Math.max(detalle.hoy, 1)) * 100)}%`,
                      background: detalle.nuevo ? "var(--linea-fuerte)" : COLOR[t.estado],
                    }}
                  />
                </span>
                <span className="num text-[12.5px] font-semibold w-[92px] text-right">{usd(t.monto)}</span>
              </li>
            ))}
          </ul>

          {!detalle.nuevo && detalle.faltaParaSostener > 0 && (
            <p className="text-[12.5px] text-[var(--tinta-media)] mt-3">
              Para no caer en low performance dentro de nueve meses necesita cerrar{" "}
              <span className="num font-semibold">{usd(detalle.faltaParaSostener)}</span> de comisión nueva.
            </p>
          )}
          {detalle.nuevo && (
            <p className="text-[12.5px] text-[var(--tinta-media)] mt-3">
              Todavía no computa: le faltan {detalle.mesesParaComputar} meses para llegar a los{" "}
              {e.umbrales.graciaMeses}. Vale la pena mirarlo antes de que llegue.
            </p>
          )}
        </Modal>
      )}
    </div>
  );
}
