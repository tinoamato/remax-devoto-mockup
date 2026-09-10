import { useMemo, useState } from "react";
import { useApp, useDerivados, type ResumenContacto } from "../tienda";
import { Boton, CabezaPanel, Etiqueta, Inicial, Panel, Selector, Vacio, Barra } from "../../components/ui";
import { Icono } from "../../lib/icons";
import { cn, fechaCorta, fechaHora, hace } from "../../lib/format";

const dia = 86_400_000;

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

const ESTADO_ETIQ = { vencido: "vencida", porVencer: "hoy", ok: "ok" } as const;
const ESTADO_ROTULO = { vencido: "Pasado de tope", porVencer: "Por vencer", ok: "Al día" } as const;
const ESTADO_COLOR = {
  vencido: "var(--lacre)",
  porVencer: "var(--ambar)",
  ok: "var(--verde)",
} as const;

function FilaAgente({ r, ahora }: { r: ResumenContacto; ahora: number }) {
  const { d } = useApp();
  const [abierto, setAbierto] = useState(false);
  const { asesor: a } = r;
  const consumo = Math.min(100, Math.max(0, (r.diasSinContacto / a.topeContactoDias) * 100));
  const ultimoCanal = r.historial[0]?.canal;

  return (
    <li className="border-b border-[var(--linea-suave)] last:border-b-0">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4 px-4 py-3.5">
        <div className="flex items-start gap-3 min-w-0 lg:w-[280px] lg:shrink-0">
          <Inicial txt={a.iniciales} s={36} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-[14px] font-semibold truncate">{a.nombre}</h3>
              <Etiqueta t={ESTADO_ETIQ[r.estado]}>{ESTADO_ROTULO[r.estado]}</Etiqueta>
            </div>
            <p className="text-[12px] text-[var(--tinta-suave)] mt-0.5">
              Último contacto {fechaCorta(a.ultimoContacto)} · {hace(a.ultimoContacto, ahora)}
              {ultimoCanal && ` · ${ultimoCanal}`}
            </p>
          </div>
        </div>

        <div className="flex-1 min-w-0 max-w-[420px]">
          <div className="flex items-center justify-between text-[11px] text-[var(--tinta-tenue)] mb-1">
            <span className="num">
              {Math.floor(r.diasSinContacto)} de {a.topeContactoDias} días
            </span>
            <span className="num" style={{ color: r.diasParaLimite < 0 ? "var(--lacre)" : "var(--tinta-tenue)" }}>
              {r.diasParaLimite >= 0
                ? `${Math.ceil(r.diasParaLimite)} días para el tope`
                : `${Math.abs(Math.floor(r.diasParaLimite))} días pasado el tope`}
            </span>
          </div>
          <Barra pct={consumo} color={ESTADO_COLOR[r.estado]} />
          <label className="flex items-center gap-1.5 text-[11px] text-[var(--tinta-tenue)] mt-1.5">
            Tope
            <input
              type="number"
              min={1}
              value={a.topeContactoDias}
              onChange={(ev) => d({ t: "contacto.tope", asesorId: a.id, dias: Number(ev.target.value) || 1 })}
              aria-label={`Tope de días para ${a.nombre}`}
              className="num w-[46px] h-6 px-1 rounded-[2px] border border-[var(--linea-fuerte)] bg-[var(--papel-hundido)] text-[11px] outline-none focus:border-[var(--sello)]"
            />
            días sin contacto
          </label>
        </div>

        <div className="flex items-center gap-4 lg:gap-5 shrink-0">
          <div className="text-right w-[92px]">
            <p className="rotulo">Pasó el tope · 12 m</p>
            <p
              className="num text-[20px] font-semibold leading-none mt-1"
              style={{ color: r.pasados12m > 0 ? "var(--lacre)" : "var(--verde)" }}
            >
              {r.pasados12m}
            </p>
            <p className="text-[10.5px] text-[var(--tinta-tenue)] mt-0.5">
              {r.pasados12m === 0 ? "nunca" : r.pasados12m === 1 ? "una vez" : "veces"}
            </p>
          </div>

          <div className="text-right w-[168px]">
            <p className="rotulo">Próximo aviso automático</p>
            {r.proximoDisparo === null ? (
              <p className="text-[12px] text-[var(--tinta-tenue)] mt-1">Automatización apagada</p>
            ) : (
              <p
                className="text-[12px] font-medium mt-1"
                style={{ color: r.proximoDisparo.ts < ahora ? "var(--lacre)" : "var(--tinta-media)" }}
              >
                {r.proximoDisparo.tipo === "previo" ? "Aviso previo" : "Aviso de vencido"}
                <span className="block text-[11px] font-normal text-[var(--tinta-tenue)]">
                  {r.proximoDisparo.ts < ahora
                    ? `ya debería haber salido · ${hace(r.proximoDisparo.ts, ahora)}`
                    : `${fechaCorta(r.proximoDisparo.ts)} · en ${Math.ceil((r.proximoDisparo.ts - ahora) / dia)} d`}
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 lg:ml-auto">
          <Boton
            chico
            tono="fantasma"
            ico={abierto ? "chevArriba" : "chevAbajo"}
            onClick={() => setAbierto((v) => !v)}
          >
            Historial · {r.historial.length}
          </Boton>
          <Boton
            chico
            tono="primario"
            ico="telefono"
            onClick={() => d({ t: "contacto.registrar", asesorId: a.id, nota: "" })}
          >
            Registrar contacto
          </Boton>
        </div>
      </div>

      {abierto && (
        <div className="px-4 pb-3.5 pl-[64px]">
          {r.historial.length === 0 ? (
            <p className="text-[12px] text-[var(--tinta-tenue)] py-2">Sin contactos registrados todavía.</p>
          ) : (
            <ol className="relative pl-4 border-l border-[var(--linea)] space-y-2.5 py-1 max-h-[280px] overflow-y-auto scroll">
              {r.historial.map((c) => {
                const gapDias =
                  r.historial.indexOf(c) < r.historial.length - 1
                    ? Math.round((c.ts - r.historial[r.historial.indexOf(c) + 1].ts) / dia)
                    : null;
                return (
                  <li key={c.id} className="relative">
                    <span
                      className="absolute -left-[21px] top-[3px] size-[7px] rounded-full border-2 border-[var(--papel-alto)]"
                      style={{ background: "var(--sello)" }}
                      aria-hidden="true"
                    />
                    <p className="text-[12px]">
                      <span className="font-medium">{fechaHora(c.ts)}</span>
                      <span className="text-[var(--tinta-suave)]"> · {c.canal}</span>
                    </p>
                    {gapDias !== null && (
                      <p
                        className="text-[10.5px] mt-0.5"
                        style={{ color: gapDias > a.topeContactoDias ? "var(--lacre)" : "var(--tinta-tenue)" }}
                      >
                        {gapDias} días desde el contacto anterior
                        {gapDias > a.topeContactoDias && " · pasó el tope"}
                      </p>
                    )}
                    {c.nota && <p className="text-[11.5px] text-[var(--tinta-media)] mt-0.5">{c.nota}</p>}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
    </li>
  );
}

type Orden = "diasSinContacto" | "diasParaLimite";
type Foco = "" | "vencido" | "porVencer" | "ok";

export default function Contacto() {
  const { e } = useApp();
  const { resumenContacto } = useDerivados();
  const [foco, setFoco] = useState<Foco>("");
  const [orden, setOrden] = useState<Orden>("diasSinContacto");

  const pasados = resumenContacto.filter((r) => r.estado === "vencido");
  const porVencer = resumenContacto.filter((r) => r.estado === "porVencer");
  const alDia = resumenContacto.filter((r) => r.estado === "ok");

  const filas = useMemo(() => {
    const base = foco ? resumenContacto.filter((r) => r.estado === foco) : resumenContacto;
    return [...base].sort((x, y) =>
      orden === "diasSinContacto" ? y.diasSinContacto - x.diasSinContacto : x.diasParaLimite - y.diasParaLimite,
    );
  }, [resumenContacto, foco, orden]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="shrink-0 grid grid-cols-2 lg:grid-cols-4 divide-x divide-[var(--linea)] border-b border-[var(--linea)] bg-[var(--papel-alto)]">
        <Cifra
          rotulo="Pasados de tope"
          valor={pasados.length}
          color={pasados.length ? "var(--lacre)" : "var(--verde)"}
          pie="ya superaron los días sin contacto"
          activo={foco === "vencido"}
          alTocar={() => setFoco(foco === "vencido" ? "" : "vencido")}
        />
        <Cifra
          rotulo="Por vencer"
          valor={porVencer.length}
          color={porVencer.length ? "var(--ambar)" : undefined}
          pie="entran en la ventana de aviso previo"
          activo={foco === "porVencer"}
          alTocar={() => setFoco(foco === "porVencer" ? "" : "porVencer")}
        />
        <Cifra
          rotulo="Al día"
          valor={alDia.length}
          pie="todavía lejos del tope"
          activo={foco === "ok"}
          alTocar={() => setFoco(foco === "ok" ? "" : "ok")}
        />
        <Cifra
          rotulo="Pasaron el tope, 12 m"
          valor={resumenContacto.reduce((s, r) => s + r.pasados12m, 0)}
          pie="entre todo el equipo"
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scroll p-4">
        <Panel>
          <CabezaPanel
            titulo="Último contacto con cada agente"
            cuenta={filas.length}
            extra={
              <>
                {(foco || orden !== "diasSinContacto") && (
                  <Boton
                    chico
                    tono="fantasma"
                    onClick={() => {
                      setFoco("");
                      setOrden("diasSinContacto");
                    }}
                  >
                    Limpiar
                  </Boton>
                )}
                <span className="inline-flex items-center gap-1.5 text-[11.5px] text-[var(--tinta-media)]">
                  <Icono n="filtro" s={13} className="text-[var(--tinta-tenue)]" />
                  Ordenar por
                  <Selector value={orden} onChange={(ev) => setOrden(ev.target.value as Orden)} className="w-[220px]">
                    <option value="diasSinContacto">Más días sin contacto primero</option>
                    <option value="diasParaLimite">Menos días para el tope primero</option>
                  </Selector>
                </span>
              </>
            }
          />
          {filas.length === 0 ? (
            <Vacio ico="tilde" titulo="Nadie en este filtro" detalle="Probá con otro estado." />
          ) : (
            <ul>
              {filas.map((r) => (
                <FilaAgente key={r.asesor.id} r={r} ahora={e.ahora} />
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
