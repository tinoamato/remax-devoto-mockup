import { useMemo, useState } from "react";
import { CANALES_CONTACTO } from "../datos";
import { useApp, useDerivados, type ResumenContacto } from "../tienda";
import {
  Barra,
  Boton,
  BotonIcono,
  CabezaPanel,
  Cajon,
  Etiqueta,
  Inicial,
  Modal,
  Panel,
  Selector,
  Vacio,
} from "../../components/ui";
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

/* ── Registrar contacto ─────────────────────────────────────── */

function ModalRegistrarContacto({ r, cerrar }: { r: ResumenContacto; cerrar: () => void }) {
  const { d } = useApp();
  const [canal, setCanal] = useState(r.historial[0]?.canal ?? CANALES_CONTACTO[0]);
  const [nota, setNota] = useState("");

  const guardar = () => {
    d({ t: "contacto.registrar", asesorId: r.asesor.id, canal, nota: nota.trim() });
    cerrar();
  };

  return (
    <Modal
      titulo="Registrar contacto"
      sub={r.asesor.nombre}
      cerrar={cerrar}
      ancho={420}
      pie={
        <>
          <Boton onClick={cerrar}>Cancelar</Boton>
          <Boton tono="primario" ico="telefono" onClick={guardar}>
            Registrar
          </Boton>
        </>
      }
    >
      <fieldset>
        <legend className="rotulo mb-1.5">Tipo de contacto</legend>
        <div className="flex flex-wrap gap-1.5">
          {CANALES_CONTACTO.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={canal === c}
              onClick={() => setCanal(c)}
              className={cn(
                "h-8 px-2.5 rounded-[var(--r-sm)] border text-[12.5px] font-medium transition-colors",
                canal === c
                  ? "bg-[var(--sello-tenue)] border-[var(--sello)] text-[var(--sello)]"
                  : "bg-[var(--papel-alto)] border-[var(--linea-fuerte)] text-[var(--tinta-media)] hover:bg-[var(--papel-hundido)]",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="block mt-3.5">
        <span className="rotulo block mb-1">Comentario (opcional)</span>
        <textarea
          value={nota}
          onChange={(ev) => setNota(ev.target.value)}
          rows={3}
          placeholder="Por ejemplo: comprometió cerrar dos operaciones este mes."
          className="w-full bg-[var(--papel-hundido)] border border-[var(--linea-fuerte)] rounded-[var(--r-sm)] px-2.5 py-2 text-[13px] outline-none focus:bg-[var(--papel-alto)] focus:border-[var(--sello)] resize-y"
        />
      </label>

      <p className="text-[11.5px] text-[var(--tinta-tenue)] mt-3">
        Queda con la fecha y hora de hoy. El contador de días sin contacto vuelve a cero.
      </p>
    </Modal>
  );
}

/* ── Historial completo, en un cajón lateral ────────────────── */

function CajonHistorial({
  r,
  ahora,
  cerrar,
  alRegistrar,
}: {
  r: ResumenContacto;
  ahora: number;
  cerrar: () => void;
  alRegistrar: () => void;
}) {
  const { asesor: a } = r;
  const consumo = Math.min(100, Math.max(0, (r.diasSinContacto / a.topeContactoDias) * 100));

  return (
    <Cajon cerrar={cerrar} ancho={480}>
      <header className="shrink-0 px-4 py-3.5 border-b border-[var(--linea)] bg-[var(--papel-alto)] flex items-center gap-3">
        <Inicial txt={a.iniciales} s={36} />
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold leading-tight truncate">{a.nombre}</h2>
          <p className="text-[12px] text-[var(--tinta-suave)]">
            Último contacto {fechaCorta(a.ultimoContacto)} · {hace(a.ultimoContacto, ahora)}
          </p>
        </div>
        <Etiqueta t={ESTADO_ETIQ[r.estado]}>{ESTADO_ROTULO[r.estado]}</Etiqueta>
        <BotonIcono ico="cruz" rotulo="Cerrar" onClick={cerrar} />
      </header>

      <div className="shrink-0 px-4 py-3 border-b border-[var(--linea)] bg-[var(--papel-hundido)]/40">
        <div className="flex items-center justify-between text-[11px] text-[var(--tinta-tenue)] mb-1">
          <span className="num">
            {Math.floor(r.diasSinContacto)} de {a.topeContactoDias} días sin contacto
          </span>
          <span className="num" style={{ color: r.diasParaLimite < 0 ? "var(--lacre)" : "var(--tinta-tenue)" }}>
            {r.diasParaLimite >= 0
              ? `${Math.ceil(r.diasParaLimite)} días para el tope`
              : `${Math.abs(Math.floor(r.diasParaLimite))} días pasado el tope`}
          </span>
        </div>
        <Barra pct={consumo} color={ESTADO_COLOR[r.estado]} />

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <p className="rotulo">Pasó el tope · 12 m</p>
            <p
              className="num text-[18px] font-semibold leading-none mt-1"
              style={{ color: r.pasados12m > 0 ? "var(--lacre)" : "var(--verde)" }}
            >
              {r.pasados12m} {r.pasados12m === 1 ? "vez" : "veces"}
            </p>
          </div>
          <div>
            <p className="rotulo">Próximo aviso automático</p>
            {r.proximoDisparo === null ? (
              <p className="text-[12px] text-[var(--tinta-tenue)] mt-1">Automatización apagada</p>
            ) : (
              <p
                className="text-[12px] font-medium mt-1"
                style={{ color: r.proximoDisparo.ts < ahora ? "var(--lacre)" : "var(--tinta-media)" }}
              >
                {r.proximoDisparo.tipo === "previo" ? "Aviso previo" : "Aviso de vencido"}
                {" · "}
                {r.proximoDisparo.ts < ahora
                  ? `hace ${hace(r.proximoDisparo.ts, ahora).replace("hace ", "")}`
                  : `en ${Math.ceil((r.proximoDisparo.ts - ahora) / dia)} d`}
              </p>
            )}
          </div>
        </div>

        <Boton chico tono="primario" ico="telefono" className="w-full mt-3" onClick={alRegistrar}>
          Registrar contacto
        </Boton>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scroll">
        <p className="rotulo px-4 py-2 bg-[var(--papel-hundido)]/60 border-b border-[var(--linea-suave)] sticky top-0">
          Historial · {r.historial.length}
        </p>
        {r.historial.length === 0 ? (
          <Vacio ico="historial" titulo="Sin contactos registrados" />
        ) : (
          <ol className="p-4 pl-6 relative">
            <span
              className="absolute left-[27px] top-5 bottom-5 w-px bg-[var(--linea)]"
              aria-hidden="true"
            />
            {r.historial.map((c, i) => {
              const anterior = r.historial[i + 1];
              const gapDias = anterior ? Math.round((c.ts - anterior.ts) / dia) : null;
              const pasoTope = gapDias !== null && gapDias > a.topeContactoDias;
              return (
                <li key={c.id} className="relative pb-4 last:pb-0">
                  <span
                    className="absolute -left-[10px] top-[6px] size-[7px] rounded-[2px] border-2 border-[var(--papel)]"
                    style={{ background: pasoTope ? "var(--lacre)" : "var(--sello)" }}
                    aria-hidden="true"
                  />
                  <p className="text-[12.5px]">
                    <span className="num font-medium">{fechaHora(c.ts)}</span>
                    <span className="text-[var(--tinta-suave)]"> · {c.canal}</span>
                  </p>
                  {gapDias !== null && (
                    <p className="text-[11px] mt-0.5" style={{ color: pasoTope ? "var(--lacre)" : "var(--tinta-tenue)" }}>
                      {gapDias} días desde el contacto anterior{pasoTope && " · pasó el tope"}
                    </p>
                  )}
                  {c.nota && <p className="text-[12px] text-[var(--tinta-media)] mt-1 leading-snug">{c.nota}</p>}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </Cajon>
  );
}

/* ── Fila de la lista ───────────────────────────────────────── */

function FilaAgente({
  r,
  ahora,
  onHistorial,
  onRegistrar,
}: {
  r: ResumenContacto;
  ahora: number;
  onHistorial: () => void;
  onRegistrar: () => void;
}) {
  const { d } = useApp();
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
          <Boton chico tono="fantasma" ico="historial" onClick={onHistorial}>
            Historial · {r.historial.length}
          </Boton>
          <Boton chico tono="primario" ico="telefono" onClick={onRegistrar}>
            Registrar contacto
          </Boton>
        </div>
      </div>
    </li>
  );
}

/* ── Vista ──────────────────────────────────────────────────── */

type Orden = "diasSinContacto" | "diasParaLimite";
type Foco = "" | "vencido" | "porVencer" | "ok";

export default function Contacto() {
  const { e } = useApp();
  const { resumenContacto } = useDerivados();
  const [foco, setFoco] = useState<Foco>("");
  const [orden, setOrden] = useState<Orden>("diasSinContacto");
  const [historialId, setHistorialId] = useState<string | null>(null);
  const [registrarId, setRegistrarId] = useState<string | null>(null);

  const pasados = resumenContacto.filter((r) => r.estado === "vencido");
  const porVencer = resumenContacto.filter((r) => r.estado === "porVencer");
  const alDia = resumenContacto.filter((r) => r.estado === "ok");

  const filas = useMemo(() => {
    const base = foco ? resumenContacto.filter((r) => r.estado === foco) : resumenContacto;
    return [...base].sort((x, y) =>
      orden === "diasSinContacto" ? y.diasSinContacto - x.diasSinContacto : x.diasParaLimite - y.diasParaLimite,
    );
  }, [resumenContacto, foco, orden]);

  const rHistorial = historialId ? resumenContacto.find((r) => r.asesor.id === historialId) ?? null : null;
  const rRegistrar = registrarId ? resumenContacto.find((r) => r.asesor.id === registrarId) ?? null : null;

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
                <FilaAgente
                  key={r.asesor.id}
                  r={r}
                  ahora={e.ahora}
                  onHistorial={() => setHistorialId(r.asesor.id)}
                  onRegistrar={() => setRegistrarId(r.asesor.id)}
                />
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {rHistorial && (
        <CajonHistorial
          r={rHistorial}
          ahora={e.ahora}
          cerrar={() => setHistorialId(null)}
          alRegistrar={() => setRegistrarId(rHistorial.asesor.id)}
        />
      )}
      {rRegistrar && <ModalRegistrarContacto r={rRegistrar} cerrar={() => setRegistrarId(null)} />}
    </div>
  );
}
