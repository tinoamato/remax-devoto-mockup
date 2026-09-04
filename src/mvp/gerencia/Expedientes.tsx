import { useMemo, useState } from "react";
import { useApp, useDerivados, urgenciaDe } from "../tienda";
import { useNav } from "../nav";
import { plantillaPorId, plantillas } from "../plantillas";
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
  Th,
  Vacio,
} from "../../components/ui";
import { fechaHora, hace } from "../../lib/format";
import type { EstadoRegistro } from "../datos";

const ESTADOS: [EstadoRegistro | "", string][] = [
  ["", "Todos"],
  ["vigente", "Vigentes"],
  ["cerrado", "Cerrados"],
  ["caido", "Caídos"],
];

export default function Expedientes() {
  const { e } = useApp();
  const nav = useNav();
  const { expedientes, proximoDe } = useDerivados();
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<EstadoRegistro | "">("");
  const [tipo, setTipo] = useState("");

  const filas = useMemo(() => {
    const t = q.trim().toLowerCase();
    return expedientes
      .filter((r) => !estado || r.estado === estado)
      .filter((r) => !tipo || r.plantillaId === tipo)
      .filter(
        (r) =>
          !t ||
          `${r.id} ${r.direccion} ${r.contraparte} ${e.asesores.find((a) => a.id === r.asesorId)?.nombre}`
            .toLowerCase()
            .includes(t),
      );
  }, [expedientes, q, estado, tipo, e.asesores]);

  const usadas = plantillas.filter((p) => e.registros.some((r) => r.plantillaId === p.id));

  return (
    <div className="h-full overflow-y-auto scroll p-4">
      <Panel>
        <CabezaPanel
          titulo="Todo lo que se registró"
          cuenta={filas.length}
          extra={<Buscador valor={q} alCambiar={setQ} hint="Buscar…" className="w-[160px]" />}
        />

        <div className="flex flex-wrap items-center gap-1.5 px-3.5 py-2 border-b border-[var(--linea-suave)]">
          <div className="flex items-center rounded-[var(--r-sm)] border border-[var(--linea-fuerte)] p-[2px]">
            {ESTADOS.map(([k, l]) => (
              <button
                key={k || "todos"}
                type="button"
                aria-pressed={estado === k}
                onClick={() => setEstado(k)}
                className={
                  estado === k
                    ? "h-6 px-2.5 rounded-[2px] text-[11.5px] font-medium bg-[var(--papel-hundido)] text-[var(--tinta)]"
                    : "h-6 px-2.5 rounded-[2px] text-[11.5px] text-[var(--tinta-suave)] hover:text-[var(--tinta)]"
                }
              >
                {l}
              </button>
            ))}
          </div>
          <select
            value={tipo}
            onChange={(ev) => setTipo(ev.target.value)}
            aria-label="Filtrar por documento"
            className="h-7 pl-2 pr-6 text-[12px] rounded-[var(--r-sm)] border border-[var(--linea-fuerte)] bg-[var(--papel-alto)] outline-none focus:border-[var(--sello)] appearance-none cursor-pointer"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2378746A' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='m4 6.5 4 4 4-4'/></svg>\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 5px center",
            }}
          >
            <option value="">Todos los documentos</option>
            {usadas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>

        <PistaScroll />

        <div className="overflow-x-auto scroll">
          {filas.length === 0 ? (
            <Vacio
              ico="expediente"
              titulo="No hay expedientes con ese recorte"
              accion={{ txt: "Ver todo", al: () => { setQ(""); setEstado(""); setTipo(""); } }}
            />
          ) : (
            <table className="w-full min-w-[820px] border-collapse">
              <thead>
                <tr>
                  <Th ancho={150}>Expediente</Th>
                  <Th>Propiedad y documento</Th>
                  <Th ancho={160}>Asesor</Th>
                  <Th ancho={140}>Otra parte</Th>
                  <Th ancho={150}>Próximo plazo</Th>
                  <Th ancho={128} alDer>
                    Generado
                  </Th>
                </tr>
              </thead>
              <tbody>
                {filas.map((r) => {
                  const prox = proximoDe(r);
                  const asesor = e.asesores.find((a) => a.id === r.asesorId)!;
                  const adendas = e.adendas.filter((a) => a.registroId === r.id).length;
                  return (
                    <tr
                      key={r.id}
                      onClick={() => nav.abrirExpediente(r.id)}
                      className="cursor-pointer hover:bg-[var(--papel-hundido)]/50 transition-colors"
                    >
                      <Td>
                        <span className="exp block">{r.id}</span>
                        <span className="block mt-1">
                          {r.estado === "vigente" ? (
                            <Etiqueta t="sello">Vigente</Etiqueta>
                          ) : (
                            <Etiqueta t={r.estado === "cerrado" ? "ok" : "neutro"}>
                              {r.estado === "cerrado" ? "Cerrado" : "Caído"}
                            </Etiqueta>
                          )}
                        </span>
                      </Td>
                      <Td>
                        <span className="block text-[13px] font-medium truncate">
                          {r.direccion}
                          {r.unidad && <span className="text-[var(--tinta-suave)]"> · {r.unidad}</span>}
                        </span>
                        <span className="block text-[11.5px] text-[var(--tinta-suave)] truncate">
                          {plantillaPorId(r.plantillaId)?.nombre}
                          {adendas > 0 && ` · ${adendas} adenda${adendas > 1 ? "s" : ""}`}
                        </span>
                      </Td>
                      <Td>
                        <span className="flex items-center gap-2 min-w-0">
                          <Inicial txt={asesor.iniciales} s={24} />
                          <span className="text-[12.5px] truncate">{asesor.nombre}</span>
                        </span>
                      </Td>
                      <Td>
                        <span className="text-[12.5px] truncate block">{r.contraparte}</span>
                      </Td>
                      <Td>
                        {prox && r.estado === "vigente" ? (
                          <>
                            <span className="block text-[11.5px] text-[var(--tinta-suave)] truncate">
                              {prox.rotulo}
                            </span>
                            <span className="flex items-center gap-1.5 mt-0.5">
                              <Cuenta vence={prox.vence} ahora={e.ahora} />
                              <EtiquetaUrgencia u={urgenciaDe(prox.vence, e.ahora)} />
                            </span>
                          </>
                        ) : (
                          <span className="text-[12px] text-[var(--tinta-tenue)]">sin plazos abiertos</span>
                        )}
                      </Td>
                      <Td alDer>
                        <span className="block text-[11.5px] text-[var(--tinta-suave)]">
                          {hace(r.generadoEn, e.ahora)}
                        </span>
                        <span className="num block text-[10.5px] text-[var(--tinta-tenue)]">
                          {fechaHora(r.generadoEn)}
                        </span>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Panel>

      <p className="text-[11.5px] text-[var(--tinta-tenue)] mt-3 px-1">
        Cada fila salió de un asesor que apretó Registrar. Entrá para ver el documento, los plazos, las adendas
        y todo el historial.{" "}
        <Boton chico tono="fantasma" onClick={() => nav.irGerencia("vencimientos")}>
          Ir al tablero de vencimientos
        </Boton>
      </p>
    </div>
  );
}
