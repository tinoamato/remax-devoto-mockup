import { useState } from "react";
import { EMAIL_GERENCIA, type Regla } from "../datos";
import { useApp } from "../tienda";
import { Boton, CabezaPanel, Etiqueta, Panel, Vacio } from "../../components/ui";
import { Icono } from "../../lib/icons";
import { cn, fechaHora } from "../../lib/format";

/* ── Interruptor ────────────────────────────────────────────── */

function Interruptor({
  on,
  alCambiar,
  rotulo,
}: {
  on: boolean;
  alCambiar: (v: boolean) => void;
  rotulo: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={rotulo}
      onClick={() => alCambiar(!on)}
      className={cn(
        "relative shrink-0 w-[34px] h-[19px] rounded-full border transition-colors duration-[160ms]",
        on ? "bg-[var(--sello)] border-[var(--sello)]" : "bg-[var(--papel-hundido)] border-[var(--linea-fuerte)]",
      )}
    >
      <span
        className="absolute top-[2px] size-[13px] rounded-full bg-white transition-[left] duration-[160ms]"
        style={{ left: on ? 17 : 2, boxShadow: "0 1px 2px rgb(0 0 0 / .25)" }}
      />
    </button>
  );
}

/* ── Tarjeta de regla ───────────────────────────────────────── */

function TarjetaRegla({ r }: { r: Regla }) {
  const { e, d } = useApp();
  const [abierto, setAbierto] = useState(false);
  const asesor = e.asesores[2];
  const reg = e.registros.find((x) => x.estado === "vigente");
  const plazo = reg?.plazos.find((p) => !p.cumplido);

  const destinatarios: { txt: string; oculto?: boolean }[] = [];
  if (r.aAsesor) destinatarios.push({ txt: "El agente a cargo" });
  if (r.aGerencia) destinatarios.push({ txt: "Gerencia", oculto: r.gerenciaOculta });

  const ejemplo: Record<Regla["id"], { asunto: string; cuerpo: string }> = {
    previo: {
      asunto: `Vence en ${r.diasAntes} días · ${reg?.id ?? "RES-0000"} · ${reg?.direccion ?? ""}`,
      cuerpo: `Hola ${asesor.nombre.split(" ")[0]}, en ${r.diasAntes} días vence el plazo «${plazo?.rotulo ?? "aceptación del vendedor"}» de ${reg?.direccion ?? "la propiedad"}. Si ya se firmó una adenda y todavía no la cargaste, es el momento.`,
    },
    vencido: {
      asunto: `Plazo vencido · ${reg?.id ?? "RES-0000"} · ${reg?.direccion ?? ""}`,
      cuerpo: `El plazo «${plazo?.rotulo ?? "escritura traslativa de dominio"}» venció hoy sin registrarse ninguna adenda. A partir de este momento las partes podrían quedar liberadas.`,
    },
    resumen: {
      asunto: "Resumen semanal de vencimientos",
      cuerpo:
        "Detalle de todo lo que vence en los próximos siete días, ordenado por urgencia, más lo que ya está vencido y sigue sin resolverse.",
    },
    contacto: {
      asunto: `Contacto pendiente · ${asesor.nombre}`,
      cuerpo: `Faltan ${r.diasAntes} días para cumplir el tope de ${asesor.topeContactoDias} días sin contacto con ${asesor.nombre}. Este aviso no le llega al agente.`,
    },
  };

  return (
    <li className="border-b border-[var(--linea-suave)] last:border-b-0">
      <div className="flex items-start gap-3 px-3.5 py-3">
        <Interruptor
          on={r.activa}
          rotulo={`Activar ${r.titulo}`}
          alCambiar={(v) => d({ t: "regla.set", id: r.id, cambio: { activa: v } })}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={cn("text-[13.5px] font-semibold", !r.activa && "text-[var(--tinta-tenue)]")}>
              {r.titulo}
            </h3>
            {!r.activa && <Etiqueta t="neutro">apagada</Etiqueta>}
          </div>
          <p className="text-[12px] text-[var(--tinta-suave)] mt-0.5">{r.detalle}</p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
            {r.id !== "vencido" && (
              <label className="flex items-center gap-1.5 text-[12px] text-[var(--tinta-media)]">
                <span>{r.id === "resumen" ? "Mira los próximos" : "Avisa"}</span>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={r.diasAntes}
                  onChange={(ev) =>
                    d({ t: "regla.set", id: r.id, cambio: { diasAntes: Number(ev.target.value) || 0 } })
                  }
                  aria-label="Días de anticipación"
                  className="num w-[54px] h-7 px-1.5 rounded-[var(--r-xs)] border border-[var(--linea-fuerte)] bg-[var(--papel-hundido)] text-[12.5px] font-semibold outline-none focus:bg-[var(--papel-alto)] focus:border-[var(--sello)]"
                />
                <span>{r.id === "resumen" ? "días" : "días antes"}</span>
              </label>
            )}

            <span className="flex items-center gap-1.5 text-[12px] text-[var(--tinta-media)]">
              <Icono n="correo" s={13} className="text-[var(--tinta-tenue)]" />
              {destinatarios.map((x, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <span className="text-[var(--tinta-tenue)]">+</span>}
                  {x.txt}
                  {x.oculto && (
                    <span
                      className="inline-flex items-center gap-1 text-[10.5px] px-1 h-[16px] rounded-[2px] border"
                      style={{
                        color: "var(--sello)",
                        borderColor: "var(--sello-borde)",
                        background: "var(--sello-tenue)",
                      }}
                      title="El agente no ve que gerencia está en copia"
                    >
                      <Icono n="candado" s={9} />
                      en oculto
                    </span>
                  )}
                </span>
              ))}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <Boton chico tono="fantasma" ico={abierto ? "chevArriba" : "chevAbajo"} onClick={() => setAbierto((v) => !v)}>
              {abierto ? "Ocultar el correo" : "Ver el correo que sale"}
            </Boton>
            <Boton chico ico="enviar" onClick={() => d({ t: "regla.probar", id: r.id })}>
              Probar
            </Boton>
          </div>

          {abierto && (
            <div className="mt-2 rounded-[var(--r-sm)] border border-[var(--linea)] bg-[var(--papel-hundido)]/50 overflow-hidden">
              <div className="px-3 py-2 border-b border-[var(--linea-suave)] bg-[var(--papel-alto)]">
                <p className="text-[11.5px] text-[var(--tinta-tenue)]">
                  Para:{" "}
                  <span className="text-[var(--tinta-media)]">
                    {r.aAsesor ? asesor.email : r.aGerencia && !r.gerenciaOculta ? EMAIL_GERENCIA : "—"}
                  </span>
                </p>
                {r.aGerencia && r.gerenciaOculta && (
                  <p className="text-[11.5px] text-[var(--tinta-tenue)]">
                    CCO: <span className="text-[var(--tinta-media)]">{EMAIL_GERENCIA}</span>
                  </p>
                )}
                <p className="text-[12.5px] font-semibold mt-1">{ejemplo[r.id].asunto}</p>
              </div>
              <p className="px-3 py-2.5 text-[12.5px] text-[var(--tinta-media)] leading-relaxed">
                {ejemplo[r.id].cuerpo}
              </p>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

/* ── Vista ──────────────────────────────────────────────────── */

export default function Automatizaciones() {
  const { e } = useApp();

  return (
    <div className="h-full overflow-y-auto scroll p-4">
      <div className="grid gap-4 xl:grid-cols-2 items-start max-w-[1400px] mx-auto">
        {/* Reglas */}
        <Panel>
          <CabezaPanel titulo="Qué correos salen solos" cuenta={e.reglas.filter((r) => r.activa).length} />
          <ul>
            {e.reglas.map((r) => (
              <TarjetaRegla key={r.id} r={r} />
            ))}
          </ul>
        </Panel>

        {/* Bandeja */}
        <Panel>
          <CabezaPanel titulo="Correos ya enviados" cuenta={e.correos.length} />
          {e.correos.length === 0 ? (
            <Vacio ico="correo" titulo="Todavía no salió ningún correo" />
          ) : (
            <ul className="divide-y divide-[var(--linea-suave)]">
              {e.correos.slice(0, 8).map((c) => (
                <li key={c.id} className="px-3.5 py-2.5">
                  <div className="flex items-baseline gap-2">
                    <p className="text-[12.5px] font-medium truncate flex-1">{c.asunto}</p>
                    <span className="num text-[10.5px] text-[var(--tinta-tenue)] shrink-0">
                      {fechaHora(c.ts)}
                    </span>
                  </div>
                  <p className="text-[11.5px] text-[var(--tinta-tenue)] mt-0.5 truncate">
                    Para: {c.para.join(", ") || "—"}
                    {c.copiaOculta.length > 0 && ` · CCO: ${c.copiaOculta.join(", ")}`}
                  </p>
                  <p className="text-[12px] text-[var(--tinta-media)] mt-1 line-clamp-2">{c.cuerpo}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
