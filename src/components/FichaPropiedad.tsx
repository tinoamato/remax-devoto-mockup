import { useState } from "react";
import { ETAPAS, PORTALES } from "../data/mock";
import { urgencia, useApp } from "../state/store";
import { useNav } from "../state/nav";
import { Icono } from "../lib/icons";
import { cn, pesos, usd } from "../lib/format";
import { Boton, BotonIcono, Cajon, Cuenta, Etiqueta, EtiquetaUrgencia, Inicial } from "./ui";

const ESTADO_T: Record<string, string> = {
  Disponible: "ok",
  Reservada: "hoy",
  "En escritura": "sello",
  Alquilada: "sello",
  Vendida: "neutro",
};

export function FichaPropiedad() {
  const { e, d } = useApp();
  const nav = useNav();
  const [editando, setEditando] = useState(false);
  const [precio, setPrecio] = useState("");

  const p = e.propiedades.find((x) => x.id === nav.prop);
  if (!p) return null;

  const op = e.operaciones.find((o) => o.id === p.operacionId);
  const asesor = e.asesores.find((a) => a.id === p.asesorId);
  const leads = e.leads.filter((l) => l.propiedadId === p.id);
  const bajada = Math.round(((p.precio - p.precioInicial) / p.precioInicial) * 100);
  const cerrar = () => nav.abrirProp(null);
  const tasaVisita = p.consultas ? Math.round((p.visitas / p.consultas) * 100) : 0;
  const stats =
    nav.modo === "asesor"
      ? [
          { v: p.diasEnCartera, l: "días en cartera", alerta: p.diasEnCartera > 120 },
          { v: p.consultas, l: "consultas" },
          { v: p.visitas, l: "visitas" },
          { v: `${tasaVisita}%`, l: "consulta→visita", alerta: tasaVisita < 20 },
        ]
      : [
          { v: p.diasEnCartera, l: "días en cartera", alerta: p.diasEnCartera > 120 },
          { v: p.visitas, l: "visitas" },
        ];

  return (
    <Cajon cerrar={cerrar} ancho={560}>
      <header className="shrink-0 px-4 py-3 border-b border-[var(--linea)] bg-[var(--papel-alto)]">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="exp">{p.id}</span>
              <Etiqueta t={ESTADO_T[p.estado]}>{p.estado}</Etiqueta>
              <Etiqueta t={p.tipo === "Venta" ? "sello" : "neutro"}>{p.tipo}</Etiqueta>
            </div>
            <h2 className="text-[16px] font-semibold leading-tight mt-1">{p.direccion}</h2>
            <p className="text-[12px] text-[var(--tinta-suave)] mt-0.5">
              {p.barrio} · {p.ambientes} amb · {p.superficie} m² · {p.antiguedad} años
              {p.garage && " · cochera"}
            </p>
          </div>
          <BotonIcono ico="cruz" rotulo="Cerrar ficha" onClick={cerrar} className="-mr-1.5 -mt-1" />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto scroll p-3 space-y-3">
        {/* Precio */}
        <section className="bg-[var(--papel-alto)] border border-[var(--linea)] rounded-[var(--r-md)] p-3.5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="rotulo">Precio de publicación</p>
              <p className="num text-[26px] font-semibold leading-none mt-1">
                {usd(p.precio)}
                {p.tipo === "Alquiler" && (
                  <span className="text-[13px] font-normal text-[var(--tinta-tenue)]"> /mes</span>
                )}
              </p>
              {bajada !== 0 && (
                <p className="text-[11.5px] mt-1.5" style={{ color: "var(--ambar)" }}>
                  {bajada}% respecto del precio inicial ({usd(p.precioInicial)})
                </p>
              )}
            </div>
            {!editando ? (
              <Boton chico ico="ajustes" onClick={() => { setPrecio(String(p.precio)); setEditando(true); }}>
                Ajustar
              </Boton>
            ) : (
              <div className="flex gap-1.5 items-end">
                <label className="block">
                  <span className="rotulo block mb-1">Nuevo precio</span>
                  <input
                    autoFocus
                    type="number"
                    value={precio}
                    onChange={(ev) => setPrecio(ev.target.value)}
                    className="num w-28 h-8 px-2 bg-[var(--papel-hundido)] border border-[var(--linea-fuerte)] rounded-[var(--r-sm)] text-[13px] outline-none focus:border-[var(--sello)]"
                  />
                </label>
                <Boton
                  chico
                  tono="primario"
                  onClick={() => {
                    const n = Number(precio);
                    if (n > 0) d({ t: "prop.precio", propId: p.id, precio: n });
                    setEditando(false);
                  }}
                >
                  Guardar
                </Boton>
                <Boton chico onClick={() => setEditando(false)}>
                  Cancelar
                </Boton>
              </div>
            )}
          </div>
          {p.expensas ? (
            <p className="text-[11.5px] text-[var(--tinta-tenue)] mt-3 pt-3 border-t border-[var(--linea-suave)]">
              Expensas <span className="num text-[var(--tinta-media)]">{pesos(p.expensas)}</span> por mes
            </p>
          ) : null}
        </section>

        {/* Rendimiento de la publicación */}
        <section className="bg-[var(--papel-alto)] border border-[var(--linea)] rounded-[var(--r-md)]">
          <div className={cn("grid divide-x divide-[var(--linea-suave)]", nav.modo === "asesor" ? "grid-cols-4" : "grid-cols-2")}>
            {stats.map((s) => (
              <div key={s.l} className="px-2 py-2.5 text-center">
                <p
                  className="num text-[17px] font-semibold leading-none"
                  style={{ color: s.alerta ? "var(--lacre)" : "var(--tinta)" }}
                >
                  {s.v}
                </p>
                <p className="text-[10px] text-[var(--tinta-tenue)] mt-1 leading-tight">{s.l}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Portales */}
        <section className="bg-[var(--papel-alto)] border border-[var(--linea)] rounded-[var(--r-md)] p-3.5">
          <p className="rotulo mb-2">Publicación en portales</p>
          <div className="flex flex-wrap gap-1.5">
            {PORTALES.map((portal) => {
              const on = p.portales.includes(portal);
              return (
                <button
                  key={portal}
                  type="button"
                  aria-pressed={on}
                  onClick={() => d({ t: "prop.portal", propId: p.id, portal })}
                  className={cn(
                    "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[var(--r-sm)] border text-[12px] font-medium transition-colors duration-[140ms] active:scale-[0.97]",
                    on
                      ? "bg-[var(--sello-tenue)] border-[var(--sello-borde)] text-[var(--sello)]"
                      : "bg-[var(--papel-alto)] border-[var(--linea-fuerte)] text-[var(--tinta-tenue)] hover:text-[var(--tinta-media)]",
                  )}
                >
                  <Icono n={on ? "tilde" : "mas"} s={12} />
                  {portal}
                </button>
              );
            })}
          </div>
          {!p.publicada && (
            <p className="flex items-center gap-1.5 text-[11.5px] mt-2.5" style={{ color: "var(--lacre)" }}>
              <Icono n="alerta" s={13} />
              Sin publicar en ningún portal
            </p>
          )}
        </section>

        {/* Operación vinculada */}
        {op && (
          <button
            type="button"
            onClick={() => nav.abrirOp(op.id)}
            className="w-full text-left bg-[var(--papel-alto)] border border-[var(--linea)] rounded-[var(--r-md)] p-3.5 hover:border-[var(--linea-fuerte)] hover:bg-[var(--papel-hundido)]/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <p className="rotulo">Operación vinculada</p>
              <span className="exp">{op.id}</span>
              <EtiquetaUrgencia u={urgencia(op.vence, e.ahora)} />
              <Icono n="flechaDer" s={14} className="ml-auto text-[var(--tinta-tenue)]" />
            </div>
            <div className="flex items-end justify-between mt-2">
              <div>
                <p className="text-[13.5px] font-semibold">{ETAPAS[op.etapa]}</p>
                <p className="text-[11.5px] text-[var(--tinta-tenue)] mt-0.5">
                  {op.docs.filter((x) => x.estado === "completo").length}/{op.docs.length} documentos ·{" "}
                  {op.docs.filter((x) => x.critico && x.estado !== "completo").length} críticos pendientes
                </p>
              </div>
              <Cuenta vence={op.vence} ahora={e.ahora} />
            </div>
          </button>
        )}

        {/* Consultas — quién está interesado es información del asesor, no de gerencia */}
        {nav.modo === "asesor" && (
          <section className="bg-[var(--papel-alto)] border border-[var(--linea)] rounded-[var(--r-md)]">
            <div className="flex items-center gap-2 px-3.5 h-9 border-b border-[var(--linea-suave)]">
              <p className="rotulo">Consultas recibidas</p>
              <span className="num text-[11px] text-[var(--tinta-tenue)]">{leads.length}</span>
            </div>
            {leads.length === 0 ? (
              <p className="px-3.5 py-4 text-[12.5px] text-[var(--tinta-tenue)]">
                Sin consultas registradas para esta propiedad.
              </p>
            ) : (
              leads.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-[var(--linea-suave)] last:border-b-0"
                >
                  <Inicial txt={l.nombre.slice(0, 2).toUpperCase()} s={24} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] truncate">{l.nombre}</p>
                    <p className="text-[11px] text-[var(--tinta-tenue)]">{l.origen}</p>
                  </div>
                  <Etiqueta t={l.estado === "sin asignar" ? "vencida" : "neutro"}>{l.estado}</Etiqueta>
                </div>
              ))
            )}
          </section>
        )}

        {/* Descripción */}
        <section className="bg-[var(--papel-alto)] border border-[var(--linea)] rounded-[var(--r-md)] p-3.5">
          <p className="rotulo mb-1.5">Descripción</p>
          <p className="text-[13px] leading-relaxed text-[var(--tinta-media)]">{p.descripcion}</p>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--linea-suave)]">
            <Inicial txt={asesor?.iniciales ?? "??"} s={24} />
            <span className="text-[12px] text-[var(--tinta-media)]">{asesor?.nombre}</span>
            <span className="text-[11px] text-[var(--tinta-tenue)] ml-auto">Asesor a cargo</span>
          </div>
        </section>

        {nav.modo === "gerencia" && (
          <Boton
            tono="peligro"
            ico="cruz"
            className="w-full"
            onClick={() => {
              d({ t: "prop.eliminar", propId: p.id });
              if (!p.operacionId) cerrar();
            }}
          >
            Eliminar propiedad
          </Boton>
        )}
      </div>
    </Cajon>
  );
}
