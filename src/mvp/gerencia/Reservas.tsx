import { useMemo, useState } from "react";
import { useApp, useDerivados, urgenciaDe } from "../tienda";
import { useNav } from "../nav";
import { plantillaPorId, plantillas } from "../plantillas";
import { ordenar, ThFijo, ThOrden, useOrden } from "../tabla";
import {
  Boton,
  Buscador,
  CabezaPanel,
  Cuenta,
  Etiqueta,
  EtiquetaUrgencia,
  Inicial,
  Panel,
  PistaScroll,
  Td,
  Vacio,
} from "../../components/ui";
import { Icono } from "../../lib/icons";
import { cn, fechaHora, hace } from "../../lib/format";
import type { EstadoRegistro, Jurisdiccion, Registro } from "../datos";

type FiltroEstado = EstadoRegistro | "";

const ESTADOS: [FiltroEstado, string][] = [
  ["", "Todas"],
  ["vigente", "Vigentes"],
  ["cerrado", "Cerradas"],
  ["caido", "Caídas"],
  ["eliminado", "Eliminadas"],
];

type Campo = "id" | "direccion" | "asesor" | "contraparte" | "vence" | "generado" | "vigencia";

export default function Reservas() {
  const { e, d } = useApp();
  const nav = useNav();
  const { expedientes, proximoDe, bajasPedidas } = useDerivados();
  const orden = useOrden<Campo>("vence");

  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<FiltroEstado>("");
  const [tipo, setTipo] = useState("");
  const [asesorId, setAsesorId] = useState("");
  const [jur, setJur] = useState<Jurisdiccion | "">("");

  const nombreAsesor = (r: Registro) => e.asesores.find((a) => a.id === r.asesorId)?.nombre ?? "";

  const filas = useMemo(() => {
    const t = q.trim().toLowerCase();
    const base = expedientes
      .filter((r) => r.aprobado)
      .filter((r) => !estado || r.estado === estado)
      .filter((r) => !tipo || r.plantillaId === tipo)
      .filter((r) => !asesorId || r.asesorId === asesorId)
      .filter((r) => !jur || r.jurisdiccion === jur)
      .filter(
        (r) => !t || `${r.id} ${r.direccion} ${r.unidad} ${r.contraparte} ${nombreAsesor(r)}`.toLowerCase().includes(t),
      );

    return ordenar(base, orden, (r, campo) => {
      switch (campo) {
        case "id":
          return r.id;
        case "direccion":
          return r.direccion;
        case "asesor":
          return nombreAsesor(r);
        case "contraparte":
          return r.contraparte;
        case "generado":
          return r.generadoEn;
        case "vigencia":
          return r.vigenciaDesde;
        default:
          return proximoDe(r)?.vence ?? Number.MAX_SAFE_INTEGER;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expedientes, q, estado, tipo, asesorId, jur, orden, proximoDe, e.asesores]);

  const usadas = plantillas.filter((p) => e.registros.some((r) => r.plantillaId === p.id));
  const hayFiltro = Boolean(q || estado || tipo || asesorId || jur);
  const limpiar = () => {
    setQ("");
    setEstado("");
    setTipo("");
    setAsesorId("");
    setJur("");
  };

  const selector =
    "h-7 pl-2 pr-6 text-[12px] rounded-[var(--r-sm)] border border-[var(--linea-fuerte)] bg-[var(--papel-alto)] outline-none focus:border-[var(--sello)] appearance-none cursor-pointer";
  const flecha = {
    backgroundImage:
      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2378746A' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='m4 6.5 4 4 4-4'/></svg>\")",
    backgroundRepeat: "no-repeat" as const,
    backgroundPosition: "right 5px center",
  };

  return (
    <div className="h-full overflow-y-auto scroll p-4">
      <Panel>
        <CabezaPanel
          titulo="Todas las reservas registradas"
          cuenta={filas.length}
          extra={<Buscador valor={q} alCambiar={setQ} hint="Buscar…" className="w-[160px]" />}
        />

        {bajasPedidas.length > 0 && (
          <div className="flex items-center gap-2 px-3.5 py-2 border-b border-[var(--lacre-borde)] bg-[var(--lacre-tenue)]/50">
            <Icono n="alerta" s={14} className="text-[var(--lacre)] shrink-0" />
            <p className="text-[12px] text-[var(--tinta-media)]">
              {bajasPedidas.length} expediente{bajasPedidas.length > 1 ? "s" : ""} con baja pedida por el agente,
              esperando que gerencia la apruebe.
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1.5 px-3.5 py-2 border-b border-[var(--linea-suave)]">
          <div className="flex items-center rounded-[var(--r-sm)] border border-[var(--linea-fuerte)] p-[2px]">
            {ESTADOS.map(([k, l]) => (
              <button
                key={k || "todas"}
                type="button"
                aria-pressed={estado === k}
                onClick={() => setEstado(k)}
                className={cn(
                  "h-6 px-2.5 rounded-[2px] text-[11.5px] transition-colors",
                  estado === k
                    ? "font-medium bg-[var(--papel-hundido)] text-[var(--tinta)]"
                    : "text-[var(--tinta-suave)] hover:text-[var(--tinta)]",
                )}
              >
                {l}
              </button>
            ))}
          </div>

          <select value={asesorId} onChange={(ev) => setAsesorId(ev.target.value)} aria-label="Filtrar por agente" className={selector} style={flecha}>
            <option value="">Todos los agentes</option>
            {e.asesores.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>

          <select value={tipo} onChange={(ev) => setTipo(ev.target.value)} aria-label="Filtrar por documento" className={selector} style={flecha}>
            <option value="">Todos los documentos</option>
            {usadas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>

          <select
            value={jur}
            onChange={(ev) => setJur(ev.target.value as Jurisdiccion | "")}
            aria-label="Filtrar por jurisdicción"
            className={selector}
            style={flecha}
          >
            <option value="">CABA y PBA</option>
            <option value="CABA">CABA</option>
            <option value="PBA">PBA</option>
          </select>

          {hayFiltro && (
            <Boton chico tono="fantasma" ico="cruz" className="ml-auto" onClick={limpiar}>
              Limpiar
            </Boton>
          )}
        </div>

        <p className="px-3.5 py-2 border-b border-[var(--linea-suave)] text-[11.5px] text-[var(--tinta-tenue)]">
          Tocá el nombre de una columna para ordenar por ese campo.
        </p>

        <PistaScroll />

        <div className="overflow-x-auto scroll">
          {filas.length === 0 ? (
            <Vacio
              ico="expediente"
              titulo="No hay reservas con ese recorte"
              accion={{ txt: "Ver todo", al: limpiar }}
            />
          ) : (
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr>
                  <ThOrden campo="id" orden={orden} ancho={150}>
                    Reserva
                  </ThOrden>
                  <ThOrden campo="direccion" orden={orden}>
                    Propiedad y documento
                  </ThOrden>
                  <ThOrden campo="asesor" orden={orden} ancho={160}>
                    Agente
                  </ThOrden>
                  <ThOrden campo="contraparte" orden={orden} ancho={140}>
                    Otra parte
                  </ThOrden>
                  <ThOrden campo="vence" orden={orden} ancho={150}>
                    Próximo plazo
                  </ThOrden>
                  <ThOrden campo="vigencia" orden={orden} ancho={104}>
                    Vigencia
                  </ThOrden>
                  <ThOrden campo="generado" orden={orden} ancho={124} alDer>
                    Generada
                  </ThOrden>
                  <ThFijo ancho={44}> </ThFijo>
                </tr>
              </thead>
              <tbody>
                {filas.map((r) => {
                  const prox = proximoDe(r);
                  const asesor = e.asesores.find((a) => a.id === r.asesorId)!;
                  const adendas = e.adendas.filter((a) => a.registroId === r.id).length;
                  return (
                    <tr
                      key={r.id}
                      onClick={() => nav.abrirExpediente(r.id)}
                      className="cursor-pointer hover:bg-[var(--papel-hundido)]/50 transition-colors"
                    >
                      <Td>
                        <span className="exp block">{r.id}</span>
                        <span className="flex flex-wrap items-center gap-1 mt-1">
                          {r.estado === "vigente" ? (
                            <Etiqueta t="sello">Vigente</Etiqueta>
                          ) : (
                            <Etiqueta t={r.estado === "cerrado" ? "ok" : "neutro"}>
                              {r.estado === "cerrado" ? "Cerrada" : r.estado === "caido" ? "Caída" : "Eliminada"}
                            </Etiqueta>
                          )}
                          {r.bajaPedida && <Etiqueta t="vencida">Baja pedida</Etiqueta>}
                        </span>
                        {r.bajaPedida && (
                          <Boton
                            chico
                            tono="primario"
                            ico="tilde"
                            className="mt-1.5"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              d({ t: "registro.aprobarBaja", registroId: r.id });
                            }}
                          >
                            Aprobar baja
                          </Boton>
                        )}
                      </Td>
                      <Td>
                        <span className="block text-[13px] font-medium truncate">
                          {r.direccion}
                          {r.unidad && <span className="text-[var(--tinta-suave)]"> · {r.unidad}</span>}
                        </span>
                        <span className="block text-[11.5px] text-[var(--tinta-suave)] truncate">
                          {plantillaPorId(r.plantillaId)?.nombre}
                          {adendas > 0 && ` · ${adendas} adenda${adendas > 1 ? "s" : ""}`}
                        </span>
                      </Td>
                      <Td>
                        <span className="flex items-center gap-2 min-w-0">
                          <Inicial txt={asesor.iniciales} s={24} />
                          <span className="text-[12.5px] truncate">{asesor.nombre}</span>
                        </span>
                      </Td>
                      <Td>
                        <span className="text-[12.5px] truncate block">{r.contraparte}</span>
                      </Td>
                      <Td>
                        {prox && r.estado === "vigente" ? (
                          <>
                            <span className="block text-[11.5px] text-[var(--tinta-suave)] truncate">
                              {prox.rotulo}
                            </span>
                            <span className="flex items-center gap-1.5 mt-0.5">
                              <Cuenta vence={prox.vence} ahora={e.ahora} />
                              <EtiquetaUrgencia u={urgenciaDe(prox.vence, e.ahora)} />
                            </span>
                          </>
                        ) : (
                          <span className="text-[12px] text-[var(--tinta-tenue)]">sin plazos abiertos</span>
                        )}
                      </Td>
                      <Td>
                        <span className="num text-[12px]">
                          {new Date(r.vigenciaDesde).toLocaleDateString("es-AR")}
                        </span>
                        {Math.abs(r.vigenciaDesde - r.generadoEn) > 43_200_000 && (
                          <span
                            className="block text-[10.5px] text-[var(--tinta-tenue)]"
                            title="La vigencia arrancó otro día que el de la carga"
                          >
                            distinta de la carga
                          </span>
                        )}
                      </Td>
                      <Td alDer>
                        <span className="block text-[11.5px] text-[var(--tinta-suave)]">
                          {hace(r.generadoEn, e.ahora)}
                        </span>
                        <span className="num block text-[10.5px] text-[var(--tinta-tenue)]">
                          {fechaHora(r.generadoEn)}
                        </span>
                      </Td>
                      <Td>
                        <Icono n="chevDer" s={15} className="text-[var(--tinta-tenue)]" />
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Panel>

      <p className="text-[11.5px] text-[var(--tinta-tenue)] mt-3 px-1">
        Cada fila salió de un agente que apretó Registrar y ya fue validada por gerencia. Una propiedad no
        puede tener dos reservas vigentes al mismo tiempo.{" "}
        <Boton chico tono="fantasma" onClick={() => nav.irGerencia("documentos")}>
          Ver documentos por validar
        </Boton>{" "}
        <Boton chico tono="fantasma" onClick={() => nav.irGerencia("vencimientos")}>
          Ir al tablero de vencimientos
        </Boton>
      </p>
    </div>
  );
}
