import { useMemo, useState, type MouseEvent } from "react";
import { useApp, useDerivados } from "../tienda";
import { useNav } from "../nav";
import { plantillaPorId, plantillas } from "../plantillas";
import { Boton, Buscador, CabezaPanel, Etiqueta, Inicial, Panel, Vacio } from "../../components/ui";
import { Icono } from "../../lib/icons";
import { fechaHora, hace } from "../../lib/format";
import type { Adenda, Asesor, Registro } from "../datos";

const ID_PLANTILLA_ADENDA = plantillas.find((p) => p.esAdenda)?.id ?? "adenda";

const selector =
  "h-7 pl-2 pr-6 text-[12px] rounded-[var(--r-sm)] border border-[var(--linea-fuerte)] bg-[var(--papel-alto)] outline-none focus:border-[var(--sello)] appearance-none cursor-pointer";
const flecha = {
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2378746A' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='m4 6.5 4 4 4-4'/></svg>\")",
  backgroundRepeat: "no-repeat" as const,
  backgroundPosition: "right 5px center",
};

function FilaRegistro({
  r,
  asesor,
  ahora,
  onClick,
  onValidar,
}: {
  r: Registro;
  asesor: Asesor;
  ahora: number;
  onClick: () => void;
  onValidar: (ev: MouseEvent) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-3.5 py-3 hover:bg-[var(--papel-hundido)]/50 transition-colors">
      <button type="button" onClick={onClick} className="flex-1 min-w-0 flex items-center gap-3 text-left">
        <span className="grid place-items-center size-9 rounded-[var(--r-sm)] bg-[var(--sello-tenue)] text-[var(--sello)] shrink-0">
          <Icono n="documento" s={16} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="exp">{r.id}</span>
            <Etiqueta t="hoy">Reserva nueva</Etiqueta>
          </span>
          <span className="block text-[13px] font-medium truncate mt-0.5">
            {r.direccion}
            {r.unidad && <span className="text-[var(--tinta-suave)]"> · {r.unidad}</span>}
          </span>
          <span className="block text-[11.5px] text-[var(--tinta-suave)] truncate">
            {plantillaPorId(r.plantillaId)?.nombre} · {r.contraparte}
          </span>
        </span>
        <span className="hidden sm:flex items-center gap-2 shrink-0">
          <Inicial txt={asesor.iniciales} s={24} />
          <span className="text-[12.5px]">{asesor.nombre}</span>
        </span>
        <span className="hidden md:block text-right shrink-0 w-[130px]">
          <span className="block text-[11.5px] text-[var(--tinta-suave)]">Vigencia</span>
          <span className="num block text-[12px]">{new Date(r.vigenciaDesde).toLocaleDateString("es-AR")}</span>
        </span>
        <span className="hidden lg:block text-right shrink-0 w-[110px]">
          <span className="block text-[11.5px] text-[var(--tinta-suave)]">{hace(r.generadoEn, ahora)}</span>
          <span className="num block text-[10.5px] text-[var(--tinta-tenue)]">{fechaHora(r.generadoEn)}</span>
        </span>
      </button>
      <Boton chico tono="primario" ico="tilde" onClick={onValidar}>
        Validar
      </Boton>
    </div>
  );
}

function FilaAdenda({
  ad,
  reg,
  asesor,
  ahora,
  onClick,
  onValidar,
}: {
  ad: Adenda;
  reg: Registro;
  asesor: Asesor;
  ahora: number;
  onClick: () => void;
  onValidar: (ev: MouseEvent) => void;
}) {
  const plazo = reg.plazos.find((p) => p.id === ad.plazoId);
  return (
    <div className="flex items-center gap-3 px-3.5 py-3 hover:bg-[var(--papel-hundido)]/50 transition-colors">
      <button type="button" onClick={onClick} className="flex-1 min-w-0 flex items-center gap-3 text-left">
        <span className="grid place-items-center size-9 rounded-[var(--r-sm)] bg-[var(--ambar-tenue)] text-[var(--ambar)] shrink-0">
          <Icono n="agenda" s={16} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="exp">{ad.id}</span>
            <Etiqueta t="hoy">Adenda nueva</Etiqueta>
            <span className="text-[11px] text-[var(--tinta-tenue)]">sobre {reg.id}</span>
          </span>
          <span className="block text-[13px] font-medium truncate mt-0.5">
            {reg.direccion}
            {reg.unidad && <span className="text-[var(--tinta-suave)]"> · {reg.unidad}</span>}
          </span>
          <span className="block text-[11.5px] text-[var(--tinta-suave)] truncate">
            «{plazo?.rotulo}» +{ad.diasExtension} días · {ad.motivo}
          </span>
        </span>
        <span className="hidden sm:flex items-center gap-2 shrink-0">
          <Inicial txt={asesor.iniciales} s={24} />
          <span className="text-[12.5px]">{asesor.nombre}</span>
        </span>
        <span className="hidden lg:block text-right shrink-0 w-[110px]">
          <span className="block text-[11.5px] text-[var(--tinta-suave)]">{hace(ad.ts, ahora)}</span>
          <span className="num block text-[10.5px] text-[var(--tinta-tenue)]">{fechaHora(ad.ts)}</span>
        </span>
      </button>
      <Boton chico tono="primario" ico="tilde" onClick={onValidar}>
        Validar
      </Boton>
    </div>
  );
}

export default function Documentos() {
  const { e, d } = useApp();
  const nav = useNav();
  const { registrosNuevos, adendasNuevas } = useDerivados();
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState("");
  const [asesorId, setAsesorId] = useState("");

  const nombreAgente = (id: string) => e.asesores.find((a) => a.id === id)?.nombre ?? "";

  const registros = useMemo(() => {
    const t = q.trim().toLowerCase();
    return [...registrosNuevos]
      .filter((r) => !tipo || r.plantillaId === tipo)
      .filter((r) => !asesorId || r.asesorId === asesorId)
      .filter(
        (r) =>
          !t ||
          `${r.id} ${r.direccion} ${r.unidad} ${r.contraparte} ${nombreAgente(r.asesorId)}`.toLowerCase().includes(t),
      )
      .sort((a, b) => b.generadoEn - a.generadoEn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registrosNuevos, q, tipo, asesorId, e.asesores]);

  const adendas = useMemo(() => {
    const t = q.trim().toLowerCase();
    return adendasNuevas
      .map((ad) => ({ ad, reg: e.registros.find((r) => r.id === ad.registroId) }))
      .filter((x): x is { ad: Adenda; reg: Registro } => Boolean(x.reg))
      .filter(() => !tipo || tipo === ID_PLANTILLA_ADENDA)
      .filter(({ reg }) => !asesorId || reg.asesorId === asesorId)
      .filter(
        ({ ad, reg }) =>
          !t || `${ad.id} ${reg.id} ${reg.direccion} ${nombreAgente(reg.asesorId)}`.toLowerCase().includes(t),
      )
      .sort((a, b) => b.ad.ts - a.ad.ts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adendasNuevas, q, tipo, asesorId, e.registros, e.asesores]);

  const total = registros.length + adendas.length;
  const hayPendientes = registrosNuevos.length + adendasNuevas.length > 0;
  const hayFiltro = Boolean(q || tipo || asesorId);
  const limpiar = () => {
    setQ("");
    setTipo("");
    setAsesorId("");
  };

  const idsPendientes = new Set<string>([
    ...registrosNuevos.map((r) => r.plantillaId),
    ...(adendasNuevas.length > 0 ? [ID_PLANTILLA_ADENDA] : []),
  ]);
  const usadas = plantillas.filter((p) => idsPendientes.has(p.id));

  const agentesConPendientes = new Set<string>([
    ...registrosNuevos.map((r) => r.asesorId),
    ...adendasNuevas.map((ad) => e.registros.find((r) => r.id === ad.registroId)?.asesorId).filter((x): x is string => Boolean(x)),
  ]);
  const agentes = e.asesores.filter((a) => agentesConPendientes.has(a.id));

  return (
    <div className="h-full overflow-y-auto scroll p-4">
      <Panel>
        <CabezaPanel
          titulo="Documentos generados, pendientes de validar"
          cuenta={total}
          extra={<Buscador valor={q} alCambiar={setQ} hint="Buscar…" className="w-[160px]" />}
        />

        <p className="px-3.5 py-2 border-b border-[var(--linea-suave)] text-[11.5px] text-[var(--tinta-tenue)]">
          Los plazos de cada documento ya están calculados desde la vigencia que cargó el agente, pero no
          corren (no cuentan para Vencimientos ni métricas) hasta que lo validés acá.
        </p>

        {hayPendientes && (
          <div className="flex flex-wrap items-center gap-1.5 px-3.5 py-2 border-b border-[var(--linea-suave)]">
            <select value={tipo} onChange={(ev) => setTipo(ev.target.value)} aria-label="Filtrar por tipo de documento" className={selector} style={flecha}>
              <option value="">Todos los documentos</option>
              {usadas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>

            <select value={asesorId} onChange={(ev) => setAsesorId(ev.target.value)} aria-label="Filtrar por agente" className={selector} style={flecha}>
              <option value="">Todos los agentes</option>
              {agentes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>

            {hayFiltro && (
              <Boton chico tono="fantasma" ico="cruz" className="ml-auto" onClick={limpiar}>
                Limpiar
              </Boton>
            )}
          </div>
        )}

        {total === 0 ? (
          <Vacio
            ico="documento"
            titulo={hayFiltro ? "No hay documentos con ese filtro" : "No hay documentos pendientes de validar"}
            detalle={
              hayFiltro
                ? undefined
                : "Cuando un agente registre una reserva o una adenda, va a aparecer acá."
            }
            accion={hayFiltro ? { txt: "Ver todo", al: limpiar } : undefined}
          />
        ) : (
          <div className="divide-y divide-[var(--linea-suave)]">
            {registros.map((r) => (
              <FilaRegistro
                key={r.id}
                r={r}
                asesor={e.asesores.find((a) => a.id === r.asesorId)!}
                ahora={e.ahora}
                onClick={() => nav.abrirExpediente(r.id)}
                onValidar={(ev) => {
                  ev.stopPropagation();
                  d({ t: "registro.aprobar", registroId: r.id });
                }}
              />
            ))}
            {adendas.map(({ ad, reg }) => (
              <FilaAdenda
                key={ad.id}
                ad={ad}
                reg={reg}
                asesor={e.asesores.find((a) => a.id === reg.asesorId)!}
                ahora={e.ahora}
                onClick={() => nav.abrirExpediente(reg.id)}
                onValidar={(ev) => {
                  ev.stopPropagation();
                  d({ t: "adenda.aprobar", adendaId: ad.id });
                }}
              />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
