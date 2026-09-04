import { useMemo, useState } from "react";
import { useApp, urgenciaDe, type Urgencia } from "../tienda";
import { useNav } from "../nav";
import { fechaDia, plantillaPorId, plantillas } from "../plantillas";
import { Hoja, htmlDocumento, imprimirDocumento } from "../Documento";
import { Boton, Cuenta, Etiqueta, EtiquetaUrgencia, Modal, Panel, Vacio } from "../../components/ui";
import { Icono } from "../../lib/icons";
import { cn } from "../../lib/format";
import type { Registro } from "../datos";

const ORDEN: Record<Urgencia, number> = { vencida: 0, hoy: 1, semana: 2, ok: 3 };

export default function MisRegistros() {
  const { e } = useApp();
  const nav = useNav();
  const [verDoc, setVerDoc] = useState<Registro | null>(null);
  const [filtro, setFiltro] = useState<"vivos" | "todos">("vivos");

  const mios = useMemo(() => {
    const lista = e.registros.filter((r) => r.asesorId === e.yo);
    const proximo = (r: Registro) =>
      [...r.plazos].filter((p) => !p.cumplido).sort((a, b) => a.vence - b.vence)[0];
    return lista
      .filter((r) => (filtro === "vivos" ? r.estado === "vigente" : true))
      .sort((a, b) => (proximo(a)?.vence ?? Infinity) - (proximo(b)?.vence ?? Infinity));
  }, [e.registros, e.yo, filtro]);

  const adenda = plantillas.find((p) => p.esAdenda);

  return (
    <div className="h-full overflow-y-auto scroll p-4">
      <div className="max-w-[860px] mx-auto">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center rounded-[var(--r-sm)] border border-[var(--linea-fuerte)] p-[2px] bg-[var(--papel-alto)]">
            {(
              [
                ["vivos", "Vigentes"],
                ["todos", "Todos"],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                type="button"
                aria-pressed={filtro === k}
                onClick={() => setFiltro(k)}
                className={cn(
                  "h-6 px-2.5 rounded-[2px] text-[11.5px] font-medium transition-colors",
                  filtro === k
                    ? "bg-[var(--papel-hundido)] text-[var(--tinta)]"
                    : "text-[var(--tinta-suave)] hover:text-[var(--tinta)]",
                )}
              >
                {l}
              </button>
            ))}
          </div>
          <span className="num text-[11.5px] text-[var(--tinta-tenue)]">{mios.length}</span>
          <Boton chico tono="primario" ico="mas" className="ml-auto" onClick={() => nav.irAsesor("generar")}>
            Generar documento
          </Boton>
        </div>

        {mios.length === 0 ? (
          <Panel>
            <Vacio
              ico="expediente"
              titulo="Todavía no registraste ningún documento"
              detalle="Cuando generes una reserva y le des Registrar, va a aparecer acá con sus plazos corriendo."
              accion={{ txt: "Generar el primero", al: () => nav.irAsesor("generar") }}
            />
          </Panel>
        ) : (
          <ul className="space-y-2.5">
            {mios.map((r) => {
              const vivos = [...r.plazos].filter((p) => !p.cumplido).sort((a, b) => a.vence - b.vence);
              const prox = vivos[0];
              const u = prox ? urgenciaDe(prox.vence, e.ahora) : "ok";
              const pl = plantillaPorId(r.plantillaId);
              return (
                <li key={r.id}>
                  <Panel
                    className={cn(
                      ORDEN[u] === 0 && "border-l-[3px] border-l-[var(--lacre)]",
                      ORDEN[u] === 1 && "border-l-[3px] border-l-[var(--ambar)]",
                    )}
                  >
                    <div className="px-3.5 py-3">
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="exp">
                            {r.id} · {pl?.nombre}
                          </p>
                          <h3 className="text-[13.5px] font-semibold mt-0.5 truncate">
                            {r.direccion}
                            {r.unidad && <span className="text-[var(--tinta-suave)]"> · {r.unidad}</span>}
                          </h3>
                          <p className="text-[12px] text-[var(--tinta-suave)]">{r.contraparte}</p>
                        </div>
                        <div className="text-right shrink-0">
                          {r.estado !== "vigente" ? (
                            <Etiqueta t={r.estado === "cerrado" ? "ok" : "neutro"}>
                              {r.estado === "cerrado" ? "Cerrado" : "Caído"}
                            </Etiqueta>
                          ) : (
                            <>
                              <EtiquetaUrgencia u={u} />
                              {prox && (
                                <p className="mt-1">
                                  <Cuenta vence={prox.vence} ahora={e.ahora} />
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {vivos.length > 0 && (
                        <ul className="mt-2.5 grid gap-1 sm:grid-cols-2">
                          {vivos.map((p) => (
                            <li
                              key={p.id}
                              className="flex items-baseline gap-2 text-[12px] px-2 py-1 rounded-[var(--r-xs)] bg-[var(--papel-hundido)]/60"
                            >
                              <span className="flex-1 min-w-0 truncate text-[var(--tinta-media)]">
                                {p.rotulo}
                              </span>
                              {p.movidoPor && (
                                <Icono
                                  n="historial"
                                  s={11}
                                  className="text-[var(--tinta-tenue)]"
                                />
                              )}
                              <span className="num text-[11.5px] font-semibold">
                                {fechaDia(p.vence)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        <Boton chico ico="documento" onClick={() => setVerDoc(r)}>
                          Ver documento
                        </Boton>
                        {r.estado === "vigente" && adenda && (
                          <Boton chico ico="agenda" onClick={() => nav.generarAdenda(adenda.id, r.id)}>
                            Extender con adenda
                          </Boton>
                        )}
                      </div>
                    </div>
                  </Panel>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {verDoc && (
        <Modal
          titulo={`${verDoc.id} · ${verDoc.direccion}`}
          sub={plantillaPorId(verDoc.plantillaId)?.nombre}
          cerrar={() => setVerDoc(null)}
          ancho={760}
          pie={
            <>
              <Boton
                ico="imprimir"
                onClick={() => {
                  const p = plantillaPorId(verDoc.plantillaId);
                  if (p) imprimirDocumento(htmlDocumento(p, verDoc.valores, verDoc.generadoEn, verDoc.id));
                }}
              >
                Imprimir o guardar PDF
              </Boton>
              <Boton tono="primario" onClick={() => setVerDoc(null)}>
                Cerrar
              </Boton>
            </>
          }
        >
          {(() => {
            const p = plantillaPorId(verDoc.plantillaId);
            return p ? (
              <div className="border border-[var(--linea)] rounded-[var(--r-sm)] overflow-hidden">
                <Hoja
                  plantilla={p}
                  valores={verDoc.valores}
                  ahora={verDoc.generadoEn}
                  id={verDoc.id}
                  resaltar={false}
                />
              </div>
            ) : null;
          })()}
        </Modal>
      )}
    </div>
  );
}
