import { useMemo, useState } from "react";
import { useApp, useDerivados, type PlazoVivo, type Urgencia } from "../tienda";
import { useNav } from "../nav";
import { ordenar, ThOrden, useOrden } from "../tabla";
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
import { cn, hace } from "../../lib/format";

function Cifra({
  rotulo,
  valor,
  color,
  pie,
  activo,
  alTocar,
}: {
  rotulo: string;
  valor: number;
  color?: string;
  pie: string;
  activo?: boolean;
  alTocar?: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={alTocar}
      className={cn(
        "px-4 py-3 text-left transition-colors",
        alTocar && "hover:bg-[var(--papel-hundido)]/60",
        activo && "bg-[var(--papel-hundido)]",
      )}
    >
      <p className="rotulo flex items-center gap-1.5">
        {activo && <span className="size-1.5 rounded-full bg-[var(--sello)]" />}
        {rotulo}
      </p>
      <p className="num text-[30px] font-semibold leading-none mt-1.5" style={{ color: color ?? "var(--tinta)" }}>
        {valor}
      </p>
      <p className="text-[11.5px] text-[var(--tinta-tenue)] mt-1.5">{pie}</p>
    </button>
  );
}

const PESO_URGENCIA: Record<Urgencia, number> = { vencida: 0, hoy: 1, semana: 2, ok: 3 };

type Campo = "vence" | "urgencia" | "plazo" | "asesor" | "contraparte" | "generado";

export default function Vencimientos() {
  const { e } = useApp();
  const nav = useNav();
  const { plazosVivos, vencidos, hoy, semana } = useDerivados();
  const [q, setQ] = useState("");
  const [asesorId, setAsesorId] = useState("");
  const [foco, setFoco] = useState<"" | "vencida" | "hoy" | "semana">("");
  const orden = useOrden<Campo>("vence");

  const filas = useMemo(() => {
    const t = q.trim().toLowerCase();
    const base = plazosVivos
      .filter((p) => !asesorId || p.registro.asesorId === asesorId)
      .filter((p) => !foco || p.urgencia === foco)
      .filter(
        (p) =>
          !t ||
          `${p.registro.direccion} ${p.registro.contraparte} ${p.registro.id} ${p.asesor.nombre} ${p.plazo.rotulo}`
            .toLowerCase()
            .includes(t),
      );

    return ordenar(base, orden, (p, campo) => {
      switch (campo) {
        case "urgencia":
          return PESO_URGENCIA[p.urgencia];
        case "plazo":
          return `${p.plazo.rotulo} ${p.registro.direccion}`;
        case "asesor":
          return p.asesor.nombre;
        case "contraparte":
          return p.registro.contraparte;
        case "generado":
          return p.registro.generadoEn;
        default:
          return p.plazo.vence;
      }
    });
  }, [plazosVivos, q, asesorId, foco, orden]);

  const vigentes = e.registros.filter((r) => r.estado === "vigente").length;
  const conAsesor = (id: string) => e.asesores.find((a) => a.id === id);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="shrink-0 grid grid-cols-2 lg:grid-cols-4 divide-x divide-[var(--linea)] border-b border-[var(--linea)] bg-[var(--papel-alto)]">
        <Cifra
          rotulo="Plazos vencidos"
          valor={vencidos.length}
          color={vencidos.length ? "var(--lacre)" : "var(--verde)"}
          pie="ya pasaron y nadie los cerró"
          activo={foco === "vencida"}
          alTocar={() => setFoco(foco === "vencida" ? "" : "vencida")}
        />
        <Cifra
          rotulo="Vencen hoy"
          valor={hoy.length}
          color={hoy.length ? "var(--ambar)" : undefined}
          pie="quedan menos de 24 horas"
          activo={foco === "hoy"}
          alTocar={() => setFoco(foco === "hoy" ? "" : "hoy")}
        />
        <Cifra
          rotulo="Esta semana"
          valor={semana.length}
          pie="vencen dentro de los 7 días"
          activo={foco === "semana"}
          alTocar={() => setFoco(foco === "semana" ? "" : "semana")}
        />
        <Cifra rotulo="Expedientes vigentes" valor={vigentes} pie={`${plazosVivos.length} plazos vigilados`} />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scroll p-4">
        <Panel>
          <CabezaPanel
            titulo="Todo lo que vence"
            cuenta={filas.length}
            extra={
              <>
                <select
                  value={asesorId}
                  onChange={(ev) => setAsesorId(ev.target.value)}
                  aria-label="Filtrar por asesor"
                  className="h-7 pl-2 pr-6 text-[12px] rounded-[var(--r-sm)] border border-[var(--linea-fuerte)] bg-[var(--papel-alto)] outline-none focus:border-[var(--sello)] appearance-none cursor-pointer"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2378746A' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='m4 6.5 4 4 4-4'/></svg>\")",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 5px center",
                  }}
                >
                  <option value="">Todos los asesores</option>
                  {e.asesores.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}
                    </option>
                  ))}
                </select>
                <Buscador valor={q} alCambiar={setQ} hint="Buscar…" className="w-[150px] hidden sm:block" />
              </>
            }
          />

          {(foco || asesorId || q) && (
            <div className="flex items-center gap-2 px-3.5 py-2 border-b border-[var(--linea-suave)] bg-[var(--sello-tenue)]/40">
              <Icono n="filtro" s={13} className="text-[var(--sello)]" />
              <p className="text-[12px] text-[var(--tinta-media)]">
                Filtrando
                {foco && ` · ${foco === "vencida" ? "vencidos" : foco === "hoy" ? "vencen hoy" : "esta semana"}`}
                {asesorId && ` · ${conAsesor(asesorId)?.nombre}`}
                {q && ` · “${q}”`}
              </p>
              <Boton
                chico
                tono="fantasma"
                className="ml-auto"
                onClick={() => {
                  setFoco("");
                  setAsesorId("");
                  setQ("");
                }}
              >
                Ver todo
              </Boton>
            </div>
          )}

          <p className="px-3.5 py-2 border-b border-[var(--linea-suave)] text-[11.5px] text-[var(--tinta-tenue)]">
            Del más urgente al que puede esperar. Tocá el nombre de una columna para ordenar por ese campo, o
            una fila para abrir la reserva.
          </p>

          <PistaScroll />

          <div className="overflow-x-auto scroll">
            {filas.length === 0 ? (
              <Vacio
                ico="tilde"
                titulo="No hay nada por vencer con ese recorte"
                detalle="Sacá los filtros para ver el tablero completo."
                accion={{
                  txt: "Ver todo",
                  al: () => {
                    setFoco("");
                    setAsesorId("");
                    setQ("");
                  },
                }}
              />
            ) : (
              <table className="w-full min-w-[760px] border-collapse">
                <thead>
                  <tr>
                    <ThOrden campo="vence" orden={orden} ancho={116}>
                      Vence en
                    </ThOrden>
                    <ThOrden campo="urgencia" orden={orden} ancho={104}>
                      Estado
                    </ThOrden>
                    <ThOrden campo="plazo" orden={orden}>
                      Plazo y propiedad
                    </ThOrden>
                    <ThOrden campo="asesor" orden={orden} ancho={168}>
                      Asesor
                    </ThOrden>
                    <ThOrden campo="contraparte" orden={orden} ancho={150}>
                      Otra parte
                    </ThOrden>
                    <ThOrden campo="generado" orden={orden} ancho={116} alDer>
                      Registrado
                    </ThOrden>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f: PlazoVivo) => (
                    <tr
                      key={`${f.registro.id}-${f.plazo.id}`}
                      onClick={() => nav.abrirExpediente(f.registro.id)}
                      className="cursor-pointer hover:bg-[var(--papel-hundido)]/50 transition-colors duration-[120ms]"
                      style={f.urgencia === "vencida" ? { background: "var(--lacre-tenue)" } : undefined}
                    >
                      <Td>
                        <Cuenta vence={f.plazo.vence} ahora={e.ahora} />
                        <span className="num block text-[10.5px] text-[var(--tinta-tenue)] mt-0.5">
                          {new Date(f.plazo.vence).toLocaleDateString("es-AR", {
                            weekday: "short",
                            day: "2-digit",
                            month: "2-digit",
                          })}
                        </span>
                      </Td>
                      <Td>
                        <EtiquetaUrgencia u={f.urgencia} />
                      </Td>
                      <Td>
                        <span className="block text-[13px] font-medium">{f.plazo.rotulo}</span>
                        <span className="block text-[11.5px] text-[var(--tinta-suave)] truncate">
                          {f.registro.direccion}
                          {f.registro.unidad && ` · ${f.registro.unidad}`}
                          <span className="exp ml-1.5">{f.registro.id}</span>
                        </span>
                        {f.plazo.movidoPor && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[10.5px] text-[var(--tinta-tenue)]">
                            <Icono n="historial" s={11} />
                            plazo extendido ({f.plazo.movidoPor})
                          </span>
                        )}
                      </Td>
                      <Td>
                        <span className="flex items-center gap-2 min-w-0">
                          <Inicial txt={f.asesor.iniciales} s={24} />
                          <span className="text-[12.5px] truncate">{f.asesor.nombre}</span>
                        </span>
                      </Td>
                      <Td>
                        <span className="text-[12.5px] truncate block">{f.registro.contraparte}</span>
                      </Td>
                      <Td alDer>
                        <span className="text-[11.5px] text-[var(--tinta-suave)]">
                          {hace(f.registro.generadoEn, e.ahora)}
                        </span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Panel>

        {vencidos.length > 0 && (
          <p className="flex items-start gap-2 mt-3 px-1 text-[12px] text-[var(--tinta-suave)]">
            <Icono n="alerta" s={14} className="mt-[2px] shrink-0 text-[var(--lacre)]" />
            <span>
              Cuando un plazo se vence, las partes quedan liberadas. Entrá al expediente y fijate si hay una
              adenda firmada que todavía no se cargó: desde ahí podés extender la fecha y queda anotado en el
              historial. <Etiqueta t="vencida">{vencidos.length} sin resolver</Etiqueta>
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
