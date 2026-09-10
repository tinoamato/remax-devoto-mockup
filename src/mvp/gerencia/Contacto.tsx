import { useApp, useDerivados } from "../tienda";
import { Boton, CabezaPanel, Inicial, Panel, Vacio } from "../../components/ui";
import { hace } from "../../lib/format";

/* ── Vista ──────────────────────────────────────────────────── */

export default function Contacto() {
  const { e, d } = useApp();
  const { contactoVencido, contactoPorVencer } = useDerivados();
  const dia = 86_400_000;

  return (
    <div className="h-full overflow-y-auto scroll p-4">
      <div className="max-w-[720px] mx-auto">
        <Panel>
          <CabezaPanel
            titulo="Último contacto con cada agente"
            cuenta={contactoVencido.length + contactoPorVencer.length}
            extra={
              <span className="text-[11px] text-[var(--tinta-tenue)]">
                {contactoVencido.length} pasados · {contactoPorVencer.length} por vencer
              </span>
            }
          />
          {contactoVencido.length + contactoPorVencer.length === 0 ? (
            <Vacio ico="tilde" titulo="Todo el equipo está al día" />
          ) : (
            <ul className="divide-y divide-[var(--linea-suave)]">
              {[...contactoVencido, ...contactoPorVencer].map((a) => {
                const dias = Math.floor((e.ahora - a.ultimoContacto) / dia);
                const pasado = dias >= a.topeContactoDias;
                return (
                  <li key={a.id} className="flex items-center gap-2.5 px-3.5 py-2.5">
                    <Inicial txt={a.iniciales} s={26} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12.5px] font-medium truncate">{a.nombre}</span>
                      <span className="block text-[11.5px] text-[var(--tinta-suave)]">
                        {hace(a.ultimoContacto, e.ahora)} · tope{" "}
                        <input
                          type="number"
                          min={1}
                          value={a.topeContactoDias}
                          onClick={(ev) => ev.stopPropagation()}
                          onChange={(ev) =>
                            d({ t: "contacto.tope", asesorId: a.id, dias: Number(ev.target.value) || 1 })
                          }
                          aria-label={`Tope de días para ${a.nombre}`}
                          className="num w-[44px] h-5 px-1 mx-0.5 rounded-[2px] border border-[var(--linea-fuerte)] bg-[var(--papel-hundido)] text-[11px] outline-none focus:border-[var(--sello)]"
                        />
                        días
                      </span>
                    </span>
                    <span
                      className="num text-[13px] font-semibold shrink-0"
                      style={{ color: pasado ? "var(--lacre)" : "var(--ambar)" }}
                    >
                      {dias} d
                    </span>
                    <Boton chico onClick={() => d({ t: "contacto.registrar", asesorId: a.id, nota: "" })}>
                      Registrar contacto
                    </Boton>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
