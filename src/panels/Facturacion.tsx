import { useMemo, useState } from "react";
import { useApp, useDerivados, type Proyeccion, type Semaforo } from "../state/store";
import { useNav } from "../state/nav";
import { Icono } from "../lib/icons";
import { cn, usd } from "../lib/format";
import { Barra, Buscador, CabezaPanel, Etiqueta, Inicial, Panel, Td, Th, Vacio } from "../components/ui";

export const COLOR_SEM: Record<Semaforo, string> = {
  verde: "var(--verde)",
  amarillo: "var(--ambar)",
  rojo: "var(--lacre)",
};
const ETIQ_SEM: Record<Semaforo, string> = { verde: "ok", amarillo: "hoy", rojo: "vencida" };
const HITOS = ["hoy", "+3", "+6", "+9"] as const;

/**
 * Los cuatro estados de la producción móvil, uno al lado del otro.
 * De un vistazo se ve quién se apaga sin cerrar nada nuevo.
 */
export function Trayectoria({ p, alto = 22 }: { p: Proyeccion; alto?: number }) {
  const pasos: { s: Semaforo; v: number }[] = [
    { s: p.estadoHoy, v: p.hoy },
    { s: p.estado3, v: p.m3 },
    { s: p.estado6, v: p.m6 },
    { s: p.estado9, v: p.m9 },
  ];
  return (
    <span
      className="inline-flex items-stretch gap-[3px]"
      title={pasos.map((x, i) => `${HITOS[i]}: ${usd(x.v)}`).join(" · ")}
    >
      {pasos.map((x, i) => (
        <span key={i} className="flex flex-col items-center gap-[3px]">
          <span
            className="w-[26px] rounded-[2px]"
            style={{ height: alto, background: COLOR_SEM[x.s], opacity: i === 0 ? 1 : 0.82 }}
          />
          <span className="num text-[8.5px] text-[var(--tinta-tenue)] leading-none">{HITOS[i]}</span>
        </span>
      ))}
    </span>
  );
}

/* ── Los umbrales, escritos como los lee el gerente ─────────── */

function TiraUmbrales() {
  const { e, d } = useApp();
  const u = e.umbrales;
  const campo =
    "num inline-flex items-center h-6 w-[104px] px-1.5 rounded-[var(--r-xs)] border text-[12.5px] " +
    "font-semibold outline-none transition-colors bg-[var(--papel-hundido)]";

  return (
    <div className="px-4 py-3 border-b border-[var(--linea)] bg-[var(--papel-alto)] trama">
      <div className="flex items-center gap-2 mb-2">
        <Icono n="regla" s={14} className="text-[var(--tinta-tenue)]" />
        <p className="rotulo">Cómo se pinta el semáforo</p>
      </div>
      <p className="text-[13.5px] leading-[2] text-[var(--tinta-media)]">
        Se mira la <span className="text-[var(--tinta)] font-semibold">comisión de los últimos 12 meses</span>.
        Queda en{" "}
        <span className="font-semibold" style={{ color: "var(--verde)" }}>
          verde
        </span>{" "}
        desde{" "}
        <input
          type="number"
          step={5000}
          value={u.verde}
          aria-label="Umbral de verde"
          onChange={(ev) => d({ t: "umbrales.set", cambio: { verde: Number(ev.target.value) || 0 } })}
          className={cn(campo)}
          style={{ borderColor: "var(--verde-borde)", color: "var(--verde)" }}
        />
        , en{" "}
        <span className="font-semibold" style={{ color: "var(--ambar)" }}>
          amarillo
        </span>{" "}
        desde{" "}
        <input
          type="number"
          step={5000}
          value={u.amarillo}
          aria-label="Umbral de amarillo"
          onChange={(ev) => d({ t: "umbrales.set", cambio: { amarillo: Number(ev.target.value) || 0 } })}
          className={cn(campo)}
          style={{ borderColor: "var(--ambar-borde)", color: "var(--ambar)" }}
        />{" "}
        y en{" "}
        <span className="font-semibold" style={{ color: "var(--lacre)" }}>
          rojo
        </span>{" "}
        por debajo. La proyección repite la cuenta suponiendo que{" "}
        <span className="text-[var(--tinta)] font-semibold">no cierra nada nuevo</span>: los meses viejos
        se van saliendo de la ventana y el acumulado cae solo.
      </p>
    </div>
  );
}

/* ── Vista ──────────────────────────────────────────────────── */

export default function VistaFacturacion() {
  const { e } = useApp();
  const { proyecciones, seApagan, facturacion12 } = useDerivados();
  const nav = useNav();
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<"" | "apagan" | Semaforo>("");

  const filas = useMemo(() => {
    const t = q.trim().toLowerCase();
    return proyecciones
      .filter((p) => !t || p.asesor.nombre.toLowerCase().includes(t))
      .filter((p) =>
        !filtro
          ? true
          : filtro === "apagan"
            ? p.estadoHoy !== "rojo" && p.mesesHastaRojo !== null && p.mesesHastaRojo <= 6
            : p.estadoHoy === filtro,
      );
  }, [proyecciones, q, filtro]);

  const cuenta = (s: Semaforo, cuando: "hoy" | "m9") =>
    proyecciones.filter((p) => (cuando === "hoy" ? p.estadoHoy : p.estado9) === s).length;

  const evapora = proyecciones.reduce((s, p) => s + (p.hoy - p.m9), 0);
  const total = proyecciones.length;
  const aguantan = proyecciones.filter((p) => p.mesesHastaRojo === null).length;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Los cuatro números */}
      <div className="shrink-0 grid grid-cols-2 lg:grid-cols-4 divide-x divide-[var(--linea)] border-b border-[var(--linea)] bg-[var(--papel-alto)]">
        <div className="px-4 py-3">
          <p className="rotulo">Caen a rojo antes de 6 meses</p>
          <p
            className="num text-[32px] font-semibold leading-none mt-1.5"
            style={{ color: seApagan.length ? "var(--lacre)" : "var(--verde)" }}
          >
            {seApagan.length}
          </p>
          <p className="text-[11.5px] text-[var(--tinta-tenue)] mt-1.5">
            hoy no están en rojo, y sin cerrar nada tocan fondo
          </p>
        </div>
        <div className="px-4 py-3">
          <p className="rotulo">Facturación que se evapora</p>
          <p className="num text-[32px] font-semibold leading-none mt-1.5" style={{ color: "var(--ambar)" }}>
            {usd(evapora)}
          </p>
          <p className="text-[11.5px] text-[var(--tinta-tenue)] mt-1.5">
            sale de la ventana en los próximos 9 meses
          </p>
        </div>
        <div className="px-4 py-3">
          <p className="rotulo">Producción de la oficina</p>
          <p className="num text-[19px] font-semibold leading-none mt-1.5">{usd(facturacion12)}</p>
          <p className="text-[11.5px] text-[var(--tinta-tenue)] mt-1.5">últimos 12 meses · {total} asesores</p>
        </div>
        <div className="px-4 py-3">
          <p className="rotulo">Aguantan los 9 meses</p>
          <p className="num text-[19px] font-semibold leading-none mt-1.5" style={{ color: "var(--verde)" }}>
            {aguantan}
            <span className="text-[13px] font-normal text-[var(--tinta-tenue)]"> de {total}</span>
          </p>
          <div className="mt-2">
            <Barra pct={(aguantan / total) * 100} color="var(--verde)" />
          </div>
          <p className="text-[11.5px] text-[var(--tinta-tenue)] mt-1.5">no llegan a rojo en el horizonte</p>
        </div>
      </div>

      <TiraUmbrales />

      <div className="flex-1 min-h-0 overflow-y-auto scroll p-4">
        <Panel className="min-w-0">
            <CabezaPanel
              titulo="Proyección por asesor"
              cuenta={filas.length}
              extra={<Buscador valor={q} alCambiar={setQ} hint="Buscar asesor…" className="w-[180px]" />}
            />

            <div className="flex flex-wrap items-center gap-1.5 px-3.5 py-2 border-b border-[var(--linea-suave)]">
              <button
                type="button"
                aria-pressed={filtro === "apagan"}
                onClick={() => setFiltro(filtro === "apagan" ? "" : "apagan")}
                className={cn(
                  "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[var(--r-sm)] border text-[12px] transition-colors",
                  filtro === "apagan"
                    ? "bg-[var(--lacre-tenue)] border-[var(--lacre)] text-[var(--lacre)]"
                    : "bg-[var(--papel-alto)] border-[var(--linea-fuerte)] hover:bg-[var(--papel-hundido)]",
                )}
              >
                <Icono n="bajar" s={13} />
                <span className="num font-semibold">{seApagan.length}</span>
                caen a rojo en 6 meses
              </button>
              {(["verde", "amarillo", "rojo"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={filtro === s}
                  onClick={() => setFiltro(filtro === s ? "" : s)}
                  className={cn(
                    "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[var(--r-sm)] border text-[12px] transition-colors",
                    filtro === s
                      ? "bg-[var(--papel-hundido)] border-[var(--tinta-suave)]"
                      : "bg-[var(--papel-alto)] border-[var(--linea-fuerte)] hover:bg-[var(--papel-hundido)]",
                  )}
                >
                  <span className="size-2 rounded-[1px]" style={{ background: COLOR_SEM[s] }} />
                  <span className="num font-semibold">{cuenta(s, "hoy")}</span>
                  <span className="text-[var(--tinta-suave)]">hoy</span>
                </button>
              ))}
            </div>

            <div className="overflow-x-auto scroll">
              {filas.length === 0 ? (
                <Vacio
                  ico="tendencia"
                  titulo="Ningún asesor coincide"
                  detalle="Ajustá los filtros para volver a ver el equipo completo."
                  accion={{ txt: "Limpiar filtros", al: () => { setQ(""); setFiltro(""); } }}
                />
              ) : (
                <table className="w-full min-w-[620px] border-collapse">
                  <thead>
                    <tr>
                      <Th ancho={110}>Cae a rojo</Th>
                      <Th>Asesor</Th>
                      <Th ancho={140} alDer>12 meses</Th>
                      <Th ancho={140} alDer>Para no caer</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filas.map((p) => (
                      <tr
                        key={p.asesor.id}
                        onClick={() => nav.abrirAsesor(p.asesor.id)}
                        className="cursor-pointer hover:bg-[var(--papel-hundido)]/50 transition-colors duration-[120ms]"
                        style={
                          p.estadoHoy !== "rojo" && p.mesesHastaRojo !== null && p.mesesHastaRojo <= 6
                            ? { background: "var(--lacre-tenue)" }
                            : undefined
                        }
                      >
                        <Td>
                          {p.mesesHastaRojo === null ? (
                            <span className="text-[12px]" style={{ color: "var(--verde)" }}>
                              aguanta
                            </span>
                          ) : p.mesesHastaRojo === 0 ? (
                            <span className="text-[12px] text-[var(--tinta-tenue)]">ya está</span>
                          ) : (
                            <span
                              className="num text-[15px] font-semibold"
                              style={{ color: p.mesesHastaRojo <= 3 ? "var(--lacre)" : "var(--ambar)" }}
                            >
                              {p.mesesHastaRojo} meses
                            </span>
                          )}
                        </Td>
                        <Td>
                          <span className="flex items-center gap-2.5">
                            <span
                              className="w-[3px] h-7 rounded-[1px] shrink-0"
                              style={{ background: COLOR_SEM[p.estadoHoy] }}
                            />
                            <Inicial txt={p.asesor.iniciales} s={26} />
                            <span className="min-w-0">
                              <span className="block font-medium truncate">{p.asesor.nombre}</span>
                              <span className="block text-[11px] text-[var(--tinta-tenue)]">
                                {p.asesor.rol}
                              </span>
                            </span>
                          </span>
                        </Td>
                        <Td alDer>
                          <span className="num text-[13px] font-semibold">{usd(p.hoy)}</span>
                          <span className="block mt-1">
                            <Etiqueta t={ETIQ_SEM[p.estadoHoy]}>{p.estadoHoy}</Etiqueta>
                          </span>
                        </Td>
                        <Td alDer>
                          {p.faltanteMinimo > 0 ? (
                            <>
                              <span className="num text-[12.5px] font-semibold text-[var(--tinta)]">
                                {usd(p.faltanteMinimo)}
                              </span>
                              <span className="block text-[10.5px] text-[var(--tinta-tenue)]">
                                en 9 meses
                              </span>
                            </>
                          ) : (
                            <span className="text-[12px]" style={{ color: "var(--verde)" }}>
                              no cae
                            </span>
                          )}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
        </Panel>
      </div>
    </div>
  );
}
