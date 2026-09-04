import type { ReactNode } from "react";
import type { FrecuenciaResumen } from "../data/mock";
import { useDerivados, useApp } from "../state/store";
import { cn, emailDe, hace } from "../lib/format";
import { Icono } from "../lib/icons";
import { Boton, CabezaPanel, Panel, Selector } from "../components/ui";

const DIAS_OPCIONES = [1, 2, 3, 5, 7];

const CAMPO_HORA =
  "num h-7 px-2 rounded-[var(--r-sm)] border border-[var(--linea-fuerte)] bg-[var(--papel-hundido)] " +
  "text-[12px] outline-none focus:border-[var(--sello)] transition-colors";

function Interruptor({ activo, onClick }: { activo: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={cn(
        "h-7 px-2.5 rounded-[var(--r-sm)] border text-[12px] font-medium transition-colors",
        activo
          ? "bg-[var(--verde-tenue)] border-[var(--verde-borde)] text-[var(--verde)]"
          : "bg-[var(--papel-alto)] border-[var(--linea-fuerte)] text-[var(--tinta-suave)]",
      )}
    >
      {activo ? "Activa" : "Apagada"}
    </button>
  );
}

function Vista({
  titulo,
  activo,
  alAlternar,
  ultimoEnvio,
  ahora,
  asunto,
  cuerpo,
  destinatarioEjemplo,
  etiquetaDestino = "Así le llega al asesor",
  onProbar,
  deshabilitado = false,
  lineaEstado,
  config,
}: {
  titulo: string;
  activo: boolean;
  alAlternar: () => void;
  ultimoEnvio: number | null;
  ahora: number;
  asunto: string;
  cuerpo: string;
  destinatarioEjemplo: string;
  etiquetaDestino?: string;
  onProbar: () => void;
  deshabilitado?: boolean;
  lineaEstado: ReactNode;
  config?: ReactNode;
}) {
  return (
    <Panel>
      <CabezaPanel titulo={titulo} extra={<Interruptor activo={activo} onClick={alAlternar} />} />
      <div className="p-3.5 space-y-3">
        {config}
        <div className="bg-[var(--papel-hundido)] border border-[var(--linea-suave)] rounded-[var(--r-sm)] p-3">
          <p className="rotulo mb-1.5">{etiquetaDestino}</p>
          <p className="text-[11px] text-[var(--tinta-tenue)]">Para: {destinatarioEjemplo}</p>
          <p className="text-[13px] font-medium mt-1">{asunto}</p>
          <p className="text-[12.5px] text-[var(--tinta-media)] mt-1 leading-snug">{cuerpo}</p>
        </div>
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-[11.5px] text-[var(--tinta-tenue)]">
            {lineaEstado}
            {ultimoEnvio && ` Último envío ${hace(ultimoEnvio, ahora)}.`}
          </p>
          <Boton chico ico="enviar" disabled={!activo || deshabilitado} onClick={onProbar}>
            Enviar ahora
          </Boton>
        </div>
      </div>
    </Panel>
  );
}

export default function VistaAutomatizaciones() {
  const { e, d } = useApp();
  const { cadencias } = useDerivados();
  const r = e.regla;

  const previo = cadencias.filter((c) => c.estado === "porVencer");
  const vencido = cadencias.filter((c) => c.estado === "vencido");
  const ejemploPrevio = previo[0]?.asesor.nombre ?? "un asesor";
  const ejemploVencido = vencido[0]?.asesor.nombre ?? "un asesor";

  return (
    <div className="h-full overflow-y-auto scroll p-4 space-y-4">
      <p className="text-[12.5px] text-[var(--tinta-media)] max-w-[74ch] flex items-start gap-2">
        <Icono n="rayo" s={14} className="text-[var(--tinta-tenue)] mt-0.5 shrink-0" />
        Estos avisos van directo al correo del asesor, sin pasar por gerencia — la idea es que cada uno
        se entere solo de que se acerca (o ya pasó) su tope de contacto, sin que el gerente tenga que
        avisarle uno por uno.
      </p>

      <Vista
        titulo="Aviso previo"
        activo={r.avisoPrevioActivo}
        alAlternar={() => d({ t: "contacto.regla", cambio: { avisoPrevioActivo: !r.avisoPrevioActivo } })}
        deshabilitado={previo.length === 0}
        lineaEstado={
          <>
            Hoy alcanzaría a <strong className="num text-[var(--tinta)]">{previo.length}</strong>{" "}
            {previo.length === 1 ? "asesor" : "asesores"}.
          </>
        }
        ultimoEnvio={r.ultimoEnvioPrevio}
        ahora={e.ahora}
        destinatarioEjemplo={emailDe(ejemploPrevio)}
        asunto={`Te quedan ${r.margenAviso} días para contactar a gerencia`}
        cuerpo={`Hola ${ejemploPrevio.split(" ")[0]}, tu tope de contacto con gerencia vence en ${r.margenAviso} días. Coordiná una charla antes de esa fecha.`}
        onProbar={() => d({ t: "contacto.probarAutomatizacion", tipo: "previo", alcance: previo.length })}
        config={
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-[var(--tinta-media)]">
            <span className="inline-flex items-center gap-2">
              Avisar
              <Selector
                value={r.margenAviso}
                onChange={(ev) =>
                  d({ t: "contacto.regla", cambio: { margenAviso: Number(ev.target.value) } })
                }
                className="w-[118px]"
              >
                {DIAS_OPCIONES.map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "día antes" : "días antes"}
                  </option>
                ))}
              </Selector>
            </span>
            <span className="inline-flex items-center gap-2">
              todos los días a las
              <input
                type="time"
                value={r.hora}
                onChange={(ev) => d({ t: "contacto.regla", cambio: { hora: ev.target.value } })}
                aria-label="Hora del envío"
                className={CAMPO_HORA}
              />
            </span>
          </div>
        }
      />

      <Vista
        titulo="Aviso de tope vencido"
        activo={r.avisoVencidoActivo}
        alAlternar={() =>
          d({ t: "contacto.regla", cambio: { avisoVencidoActivo: !r.avisoVencidoActivo } })
        }
        deshabilitado={vencido.length === 0}
        lineaEstado={
          <>
            Hoy alcanzaría a <strong className="num text-[var(--tinta)]">{vencido.length}</strong>{" "}
            {vencido.length === 1 ? "asesor" : "asesores"}.
          </>
        }
        ultimoEnvio={r.ultimoEnvioVencido}
        ahora={e.ahora}
        destinatarioEjemplo={emailDe(ejemploVencido)}
        asunto="Estás fuera de tope de contacto con gerencia"
        cuerpo={`Hola ${ejemploVencido.split(" ")[0]}, ya pasaron más días de los que tenés de tope sin contacto con gerencia. Contactate a la brevedad.`}
        onProbar={() =>
          d({ t: "contacto.probarAutomatizacion", tipo: "vencido", alcance: vencido.length })
        }
      />

      <p className="text-[12.5px] text-[var(--tinta-media)] max-w-[74ch] flex items-start gap-2 pt-1">
        <Icono n="rayo" s={14} className="text-[var(--tinta-tenue)] mt-0.5 shrink-0" />
        Este último es al revés: un resumen para vos, no para el equipo.
      </p>

      <Vista
        titulo="Resumen para gerencia"
        activo={r.resumenActivo}
        alAlternar={() => d({ t: "contacto.regla", cambio: { resumenActivo: !r.resumenActivo } })}
        lineaEstado={
          r.resumenFrecuencia === "diario" ? "Sale todos los días." : "Sale una vez por semana."
        }
        ultimoEnvio={r.ultimoEnvioResumen}
        ahora={e.ahora}
        destinatarioEjemplo="gerencia@remaxdevoto.com.ar"
        etiquetaDestino="Así te llega a vos"
        asunto={`${vencido.length} pasados de tope, ${previo.length} por vencer`}
        cuerpo="Resumen de cadencia del equipo: quién está pasado de tope, quién por vencer y a quién ya contactaste."
        onProbar={() =>
          d({
            t: "contacto.probarAutomatizacion",
            tipo: "resumen",
            alcance: cadencias.length,
          })
        }
        config={
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-[var(--tinta-media)]">
            <span className="inline-flex items-center gap-2">
              Enviar
              <Selector
                value={r.resumenFrecuencia}
                onChange={(ev) =>
                  d({
                    t: "contacto.regla",
                    cambio: { resumenFrecuencia: ev.target.value as FrecuenciaResumen },
                  })
                }
                className="w-[150px]"
              >
                <option value="diario">todos los días</option>
                <option value="semanal">una vez por semana</option>
              </Selector>
            </span>
            <span className="inline-flex items-center gap-2">
              a las
              <input
                type="time"
                value={r.resumenHora}
                onChange={(ev) => d({ t: "contacto.regla", cambio: { resumenHora: ev.target.value } })}
                aria-label="Hora del resumen"
                className={CAMPO_HORA}
              />
            </span>
          </div>
        }
      />
    </div>
  );
}
