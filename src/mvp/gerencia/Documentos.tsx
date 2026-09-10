import { useMemo, useState, type MouseEvent } from "react";
import { useApp, useDerivados } from "../tienda";
import { useNav } from "../nav";
import { plantillaPorId } from "../plantillas";
import { Boton, Buscador, CabezaPanel, Etiqueta, Inicial, Panel, Vacio } from "../../components/ui";
import { Icono } from "../../lib/icons";
import { fechaHora, hace } from "../../lib/format";
import type { Adenda, Asesor, Registro } from "../datos";

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

  const nombreAgente = (asesorId: string) => e.asesores.find((a) => a.id === asesorId)?.nombre ?? "";

  const registros = useMemo(() => {
    const t = q.trim().toLowerCase();
    return [...registrosNuevos]
      .filter(
        (r) =>
          !t ||
          `${r.id} ${r.direccion} ${r.unidad} ${r.contraparte} ${nombreAgente(r.asesorId)}`.toLowerCase().includes(t),
      )
      .sort((a, b) => b.generadoEn - a.generadoEn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registrosNuevos, q, e.asesores]);

  const adendas = useMemo(() => {
    const t = q.trim().toLowerCase();
    return adendasNuevas
      .map((ad) => ({ ad, reg: e.registros.find((r) => r.id === ad.registroId) }))
      .filter((x): x is { ad: Adenda; reg: Registro } => Boolean(x.reg))
      .filter(
        ({ ad, reg }) =>
          !t || `${ad.id} ${reg.id} ${reg.direccion} ${nombreAgente(reg.asesorId)}`.toLowerCase().includes(t),
      )
      .sort((a, b) => b.ad.ts - a.ad.ts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adendasNuevas, q, e.registros, e.asesores]);

  const total = registros.length + adendas.length;

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

        {total === 0 ? (
          <Vacio
            ico="documento"
            titulo="No hay documentos pendientes de validar"
            detalle="Cuando un agente registre una reserva o una adenda, va a aparecer acá."
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
