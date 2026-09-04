import { useMemo, useState } from "react";
import { useApp, useDerivados, rotuloMes, TRAMOS, type Proyeccion, type Semaforo } from "../tienda";
import { ordenar, ThFijo, ThOrden, useOrden } from "../tabla";
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
  Vacio,
} from "../../components/ui";
import { Icono } from "../../lib/icons";
import { cn, usd } from "../../lib/format";

const COLOR: Record<Semaforo, string> = {
  alto: "var(--verde)",
  medio: "var(--ambar)",
  bajo: "var(--lacre)",
};
const FONDO: Record<Semaforo, string> = {
  alto: "var(--verde-tenue)",
  medio: "var(--ambar-tenue)",
  bajo: "var(--lacre-tenue)",
};
const BORDE: Record<Semaforo, string> = {
  alto: "var(--verde-borde)",
  medio: "var(--ambar-borde)",
  bajo: "var(--lacre-borde)",
};
const ETIQ: Record<Semaforo, string> = { alto: "ok", medio: "hoy", bajo: "vencida" };
const NOMBRE: Record<Semaforo, string> = {
  alto: "Alto rendimiento",
  medio: "Sostiene",
  bajo: "Low performance",
};

type Computo = "computan" | "nuevos" | "todos";
type Campo = "agente" | "antiguedad" | "acumulado" | "estado" | "cae";

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

/* ── Carga de comisiones ────────────────────────────────────── */

type Modo = "reemplazar" | "sumar";

function CargarComisiones({ cerrar }: { cerrar: () => void }) {
  const { e, d } = useApp();
  const [mes, setMes] = useState(0);
  const [modo, setModo] = useState<Modo>("sumar");
  const [borrador, setBorrador] = useState<Record<string, string>>({});

  const valorDe = (id: string) => borrador[id] ?? "";
  const numero = (id: string) => Number(valorDe(id)) || 0;
  const cargados = e.asesores.filter((a) => valorDe(a.id).trim() !== "");
  const total = cargados.reduce((s, a) => s + numero(a.id), 0);

  const guardar = () => {
    for (const a of cargados) {
      const v = numero(a.id);
      if (modo === "sumar") {
        if (v !== 0) d({ t: "factura.sumar", asesorId: a.id, mes, monto: v });
      } else if (v !== a.facturacion[mes]) {
        d({ t: "factura.set", asesorId: a.id, mes, monto: v });
      }
    }
    cerrar();
  };

  return (
    <Modal
      titulo="Cargar comisiones"
      sub="Cuando quieras y sobre el mes que quieras. Sólo se toca lo que completes."
      cerrar={cerrar}
      ancho={640}
      pie={
        <>
          <Boton onClick={cerrar}>Cancelar</Boton>
          <Boton tono="primario" onClick={guardar} disabled={cargados.length === 0}>
            {modo === "sumar" ? "Sumar" : "Reemplazar"} en {rotuloMes(mes, e.ahora)}
          </Boton>
        </>
      }
    >
      <div className="flex flex-wrap items-end gap-4">
        <label className="block">
          <span className="rotulo block mb-1">Mes</span>
          <div className="flex flex-wrap gap-1">
            {[0, 1, 2, 3].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMes(m)}
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

        <label className="block">
          <span className="rotulo block mb-1">Qué hacer con lo que ya está</span>
          <div className="flex items-center rounded-[var(--r-sm)] border border-[var(--linea-fuerte)] p-[2px]">
            {(
              [
                ["sumar", "Sumar"],
                ["reemplazar", "Reemplazar"],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                type="button"
                aria-pressed={modo === k}
                onClick={() => setModo(k)}
                className={cn(
                  "h-7 px-3 rounded-[2px] text-[12px] font-medium transition-colors",
                  modo === k
                    ? "bg-[var(--sello)] text-white"
                    : "text-[var(--tinta-suave)] hover:text-[var(--tinta)]",
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </label>
      </div>

      <p className="text-[12px] text-[var(--tinta-suave)] mt-3">
        {modo === "sumar"
          ? "El monto que escribas se agrega a lo que ya tenga cargado ese mes. Sirve para ir sumando operación por operación."
          : "El monto que escribas pisa lo que tenga cargado ese mes. Sirve para corregir un total mal cargado."}{" "}
        Lo que dejes vacío queda como está.
      </p>

      <ul className="divide-y divide-[var(--linea-suave)] border-y border-[var(--linea-suave)] mt-3">
        {e.asesores.map((a) => {
          const actual = a.facturacion[mes];
          const escrito = numero(a.id);
          const resultado = modo === "sumar" ? actual + escrito : escrito;
          const tocado = valorDe(a.id).trim() !== "";
          return (
            <li key={a.id} className="flex items-center gap-2.5 py-1.5">
              <Inicial txt={a.iniciales} s={24} />
              <span className="min-w-0 flex-1">
                <span className="block text-[12.5px] truncate">{a.nombre}</span>
                <span className="num block text-[10.5px] text-[var(--tinta-tenue)]">
                  hoy {usd(actual)}
                  {tocado && (
                    <span style={{ color: "var(--sello)" }}> → {usd(Math.max(0, resultado))}</span>
                  )}
                </span>
              </span>
              <span className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-[var(--tinta-tenue)] pointer-events-none">
                  {modo === "sumar" ? "+" : "USD"}
                </span>
                <input
                  value={valorDe(a.id)}
                  onChange={(ev) => setBorrador((b) => ({ ...b, [a.id]: ev.target.value }))}
                  inputMode="numeric"
                  placeholder="—"
                  aria-label={`Comisión de ${a.nombre}`}
                  className={cn(
                    "num w-[124px] h-8 pr-2 text-right text-[13px] rounded-[var(--r-sm)] border bg-[var(--papel-hundido)] outline-none focus:bg-[var(--papel-alto)] focus:border-[var(--sello)]",
                    modo === "sumar" ? "pl-6" : "pl-9",
                    tocado ? "border-[var(--sello-borde)]" : "border-[var(--linea-fuerte)]",
                  )}
                />
              </span>
            </li>
          );
        })}
      </ul>

      <p className="flex items-baseline gap-2 mt-3">
        <span className="rotulo">
          {modo === "sumar" ? "Se suma en total" : "Nuevo total cargado"} · {cargados.length} agentes
        </span>
        <span className="num ml-auto text-[15px] font-semibold">{usd(total)}</span>
      </p>
    </Modal>
  );
}

/* ── Configuración ──────────────────────────────────────────── */

function Configuracion({ cerrar }: { cerrar: () => void }) {
  const { e, d } = useApp();
  const u = e.umbrales;

  const campo = (
    id: keyof typeof u,
    rotulo: string,
    detalle: string,
    color: string,
    borde: string,
    paso: number,
    sufijo: string,
  ) => (
    <label className="block">
      <span className="rotulo block mb-1">{rotulo}</span>
      <span className="relative block">
        <input
          type="number"
          step={paso}
          value={u[id]}
          onChange={(ev) => d({ t: "umbrales.set", cambio: { [id]: Number(ev.target.value) || 0 } })}
          className="num w-full h-9 pl-2.5 pr-14 text-[13px] font-semibold rounded-[var(--r-sm)] border bg-[var(--papel-hundido)] outline-none focus:bg-[var(--papel-alto)]"
          style={{ borderColor: borde, color }}
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[var(--tinta-tenue)] pointer-events-none">
          {sufijo}
        </span>
      </span>
      <span className="block text-[11.5px] text-[var(--tinta-suave)] mt-1">{detalle}</span>
    </label>
  );

  return (
    <Modal
      titulo="Cómo se define el rendimiento"
      sub="Se mira siempre la comisión acumulada de los últimos 12 meses."
      cerrar={cerrar}
      ancho={480}
      pie={
        <Boton tono="primario" onClick={cerrar}>
          Listo
        </Boton>
      }
    >
      <div className="space-y-4">
        {campo(
          "alto",
          "Alto rendimiento",
          "Desde este acumulado para arriba, el agente está en verde.",
          "var(--verde)",
          "var(--verde-borde)",
          1000,
          "USD",
        )}
        {campo(
          "bajo",
          "Low performance",
          "Por debajo de este acumulado, el agente entra en low performance.",
          "var(--lacre)",
          "var(--lacre-borde)",
          1000,
          "USD",
        )}
        {campo(
          "graciaMeses",
          "Antigüedad mínima para computar",
          "Un agente con menos meses en la oficina no computa para RE/MAX y queda aparte.",
          "var(--tinta)",
          "var(--linea-fuerte)",
          1,
          "meses",
        )}
      </div>

      <p className="text-[12px] text-[var(--tinta-suave)] mt-4 pt-3 border-t border-[var(--linea-suave)]">
        La proyección repite esta misma cuenta suponiendo que el agente no cierra nada nuevo: los meses
        viejos se van saliendo de la ventana de doce y el acumulado cae solo.
      </p>
    </Modal>
  );
}

/* ── Progresión: una columna por tramo ──────────────────────── */

function Progresion({
  filas,
  ahora,
  alAbrir,
}: {
  filas: Proyeccion[];
  ahora: number;
  alAbrir: (p: Proyeccion) => void;
}) {
  return (
    <div className="overflow-x-auto scroll">
      <table className="w-full min-w-[760px] border-collapse">
        <thead>
          <tr>
            <ThFijo>Agente</ThFijo>
            <ThFijo ancho={110}>Últimos 12 meses</ThFijo>
            {TRAMOS.map((m) => (
              <ThFijo key={m} ancho={112} alDer>
                {m === 0 ? "Hoy" : `+${m} meses`}
              </ThFijo>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((p) => (
            <tr
              key={p.asesor.id}
              onClick={() => alAbrir(p)}
              className="cursor-pointer hover:bg-[var(--papel-hundido)]/40 transition-colors"
            >
              <Td>
                <span className="flex items-center gap-2.5">
                  <Inicial txt={p.asesor.iniciales} s={26} />
                  <span className="min-w-0">
                    <span className="block font-medium truncate">{p.asesor.nombre}</span>
                    <span className="num block text-[11px] text-[var(--tinta-tenue)]">
                      {p.nuevo ? `nuevo · computa en ${p.mesesParaComputar} m` : `${p.asesor.antiguedadMeses} meses`}
                    </span>
                  </span>
                </span>
              </Td>
              <Td>
                <Serie f={p.asesor.facturacion} ahora={ahora} alto={18} />
              </Td>
              {p.tramos.map((t) => (
                <td key={t.m} className="px-1.5 py-1.5 border-b border-[var(--linea-suave)]">
                  <span
                    className="flex flex-col items-end justify-center h-[42px] px-2 rounded-[var(--r-sm)] border"
                    style={
                      p.nuevo
                        ? { background: "var(--papel-hundido)", borderColor: "var(--linea)" }
                        : { background: FONDO[t.estado], borderColor: BORDE[t.estado] }
                    }
                    title={
                      p.nuevo
                        ? "Todavía no computa"
                        : `${t.m === 0 ? "Hoy" : `Dentro de ${t.m} meses`}: ${NOMBRE[t.estado]}`
                    }
                  >
                    <span
                      className="num text-[13px] font-semibold leading-none"
                      style={{ color: p.nuevo ? "var(--tinta-tenue)" : COLOR[t.estado] }}
                    >
                      {usd(t.monto)}
                    </span>
                    <span
                      className="text-[9.5px] uppercase tracking-[0.06em] mt-1 leading-none"
                      style={{ color: p.nuevo ? "var(--tinta-tenue)" : COLOR[t.estado] }}
                    >
                      {p.nuevo ? "no computa" : t.estado === "bajo" ? "low perf." : t.estado === "medio" ? "sostiene" : "alto"}
                    </span>
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Vista ──────────────────────────────────────────────────── */

export default function Facturacion() {
  const { e } = useApp();
  const { proyecciones, computan, seApagan, facturacion12 } = useDerivados();
  const orden = useOrden<Campo>("acumulado");

  const [vista, setVista] = useState<"lista" | "progresion">("lista");
  const [tramo, setTramo] = useState(0);
  const [q, setQ] = useState("");
  const [computo, setComputo] = useState<Computo>("computan");
  const [soloRiesgo, setSoloRiesgo] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [config, setConfig] = useState(false);
  const [detalle, setDetalle] = useState<Proyeccion | null>(null);

  const idx = TRAMOS.indexOf(tramo as (typeof TRAMOS)[number]);

  const filas = useMemo(() => {
    const t = q.trim().toLowerCase();
    const base = proyecciones
      .filter((p) => !t || p.asesor.nombre.toLowerCase().includes(t))
      .filter((p) => (computo === "todos" ? true : computo === "nuevos" ? p.nuevo : !p.nuevo))
      .filter((p) => !soloRiesgo || (!p.nuevo && p.tramos[idx].estado === "bajo"));

    return ordenar(base, orden, (p, campo) => {
      switch (campo) {
        case "agente":
          return p.asesor.nombre;
        case "antiguedad":
          return p.asesor.antiguedadMeses;
        case "estado":
          return p.nuevo ? 9 : ["bajo", "medio", "alto"].indexOf(p.tramos[idx].estado);
        case "cae":
          return p.mesesHastaBajo ?? 99;
        default:
          return p.tramos[idx].monto;
      }
    });
  }, [proyecciones, q, computo, soloRiesgo, idx, orden]);

  const bajos = computan.filter((p) => p.tramos[idx].estado === "bajo").length;
  const nuevos = proyecciones.filter((p) => p.nuevo).length;
  const porCumplir = proyecciones.filter((p) => p.porCumplir);

  const limpiar = () => {
    setQ("");
    setComputo("computan");
    setSoloRiesgo(false);
  };

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

      {/* Barra de trabajo */}
      <div className="shrink-0 flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-[var(--linea)] bg-[var(--papel-alto)]">
        <div className="flex items-center rounded-[var(--r-sm)] border border-[var(--linea-fuerte)] p-[2px]">
          {(
            [
              ["lista", "Lista"],
              ["progresion", "Progresión"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              type="button"
              aria-pressed={vista === k}
              onClick={() => setVista(k)}
              className={cn(
                "h-7 px-3 rounded-[2px] text-[12px] font-medium transition-colors",
                vista === k
                  ? "bg-[var(--papel-hundido)] text-[var(--tinta)]"
                  : "text-[var(--tinta-suave)] hover:text-[var(--tinta)]",
              )}
            >
              {l}
            </button>
          ))}
        </div>

        {vista === "lista" && (
          <>
            <p className="rotulo shrink-0 ml-1">Acumulado</p>
            <div className="flex items-center rounded-[var(--r-sm)] border border-[var(--linea-fuerte)] p-[2px]">
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
                  {m === 0 ? "hoy" : `+${m} m`}
                </button>
              ))}
            </div>
          </>
        )}

        <p className="text-[12px] text-[var(--tinta-suave)] hidden xl:block">
          {vista === "progresion"
            ? "Cada columna es el acumulado dentro de esos meses si no cierra nada nuevo."
            : tramo === 0
              ? "Lo que cada uno lleva acumulado en los últimos 12 meses."
              : `Dónde queda cada uno dentro de ${tramo} meses si no cierra ninguna operación nueva.`}
        </p>

        <div className="ml-auto flex items-center gap-1.5">
          <Boton chico ico="ajustes" onClick={() => setConfig(true)}>
            Configuración
          </Boton>
          <Boton chico tono="primario" ico="planilla" onClick={() => setCargando(true)}>
            Cargar comisiones
          </Boton>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scroll p-4">
        <Panel>
          <CabezaPanel
            titulo="Comisión por agente"
            cuenta={filas.length}
            extra={<Buscador valor={q} alCambiar={setQ} hint="Buscar agente…" className="w-[160px]" />}
          />

          <div className="flex flex-wrap items-center gap-1.5 px-3.5 py-2 border-b border-[var(--linea-suave)]">
            <div className="flex items-center rounded-[var(--r-sm)] border border-[var(--linea-fuerte)] p-[2px]">
              {(
                [
                  ["computan", "Computan"],
                  ["nuevos", "No computan"],
                  ["todos", "Todos"],
                ] as const
              ).map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={computo === k}
                  onClick={() => setComputo(k)}
                  className={cn(
                    "h-6 px-2.5 rounded-[2px] text-[11.5px] transition-colors",
                    computo === k
                      ? "font-medium bg-[var(--papel-hundido)] text-[var(--tinta)]"
                      : "text-[var(--tinta-suave)] hover:text-[var(--tinta)]",
                  )}
                >
                  {l}
                </button>
              ))}
            </div>

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

            <p className="text-[11.5px] text-[var(--tinta-tenue)] ml-1 hidden lg:block">
              {vista === "lista"
                ? "Tocá el nombre de una columna para ordenar por ese campo."
                : "Cada fila es un agente y cada columna un tramo de la proyección."}
            </p>
          </div>

          <PistaScroll />

          {filas.length === 0 ? (
            <Vacio titulo="Ningún agente coincide" ico="equipo" accion={{ txt: "Limpiar", al: limpiar }} />
          ) : vista === "progresion" ? (
            <Progresion filas={filas} ahora={e.ahora} alAbrir={setDetalle} />
          ) : (
            <div className="overflow-x-auto scroll">
              <table className="w-full min-w-[720px] border-collapse">
                <thead>
                  <tr>
                    <ThOrden campo="agente" orden={orden}>
                      Agente
                    </ThOrden>
                    <ThFijo ancho={120}>Últimos 12 meses</ThFijo>
                    <ThOrden campo="acumulado" orden={orden} ancho={132} alDer>
                      {tramo === 0 ? "Acumulado hoy" : `Acumulado +${tramo}m`}
                    </ThOrden>
                    <ThOrden campo="estado" orden={orden} ancho={130}>
                      Estado
                    </ThOrden>
                    <ThOrden campo="cae" orden={orden} ancho={120} alDer>
                      Cae en
                    </ThOrden>
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
            </div>
          )}
        </Panel>

        {porCumplir.length > 0 && computo !== "computan" && (
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

      {cargando && <CargarComisiones cerrar={() => setCargando(false)} />}
      {config && <Configuracion cerrar={() => setConfig(false)} />}

      {detalle && (
        <Modal
          titulo={detalle.asesor.nombre}
          sub={`${detalle.asesor.antiguedadMeses} meses en la oficina · ${detalle.asesor.email}`}
          cerrar={() => setDetalle(null)}
          ancho={520}
          pie={
            <Boton tono="primario" onClick={() => setDetalle(null)}>
              Cerrar
            </Boton>
          }
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
