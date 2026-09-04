import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useApp } from "../state/store";
import { useNav } from "../state/nav";
import { Icono, type NombreIcono } from "../lib/icons";
import { cn, usd } from "../lib/format";

/* ── Avisos (barra inferior, con deshacer) ──────────────────── */

const TONO_AVISO: Record<string, [string, string, NombreIcono]> = {
  ok: ["var(--verde)", "var(--verde-borde)", "tilde"],
  riesgo: ["var(--lacre)", "var(--lacre-borde)", "alerta"],
  neutro: ["var(--tinta-media)", "var(--linea-fuerte)", "refrescar"],
};

export function Avisos() {
  const { e, d } = useApp();
  const timers = useRef<Map<number, number>>(new Map());

  useEffect(() => {
    for (const a of e.avisos) {
      if (timers.current.has(a.id)) continue;
      const t = window.setTimeout(() => {
        d({ t: "aviso.cerrar", id: a.id });
        timers.current.delete(a.id);
      }, 6000);
      timers.current.set(a.id, t);
    }
  }, [e.avisos, d]);

  if (!e.avisos.length) return null;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="fixed z-[60] flex flex-col gap-1.5 bottom-[70px] left-3 right-3 md:bottom-3 md:right-auto md:w-[400px]"
    >
      {e.avisos.map((a) => {
        const [color, borde, ico] = TONO_AVISO[a.tono];
        return (
          <div
            key={a.id}
            className="a-surgir flex items-center gap-2.5 h-11 pl-3 pr-1.5 bg-[var(--papel-alto)] border rounded-[var(--r-md)] alza-alta"
            style={{ borderColor: borde }}
          >
            <Icono n={ico} s={15} className="shrink-0" />
            <p className="flex-1 text-[12.5px] text-[var(--tinta)] truncate" style={{ color }}>
              {a.texto}
            </p>
            {a.deshacer && (
              <button
                type="button"
                onClick={() => d({ t: "aviso.deshacer", id: a.id })}
                className="h-7 px-2 text-[12px] font-semibold text-[var(--sello)] rounded-[var(--r-xs)] hover:bg-[var(--sello-tenue)] transition-colors"
              >
                Deshacer
              </button>
            )}
            <button
              type="button"
              aria-label="Cerrar aviso"
              onClick={() => d({ t: "aviso.cerrar", id: a.id })}
              className="size-7 grid place-items-center rounded-[var(--r-xs)] text-[var(--tinta-tenue)] hover:bg-[var(--papel-hundido)] hover:text-[var(--tinta)]"
            >
              <Icono n="cruz" s={13} />
            </button>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}

/* ── Paleta de comandos ─────────────────────────────────────── */

interface Fila {
  id: string;
  grupo: string;
  ico: NombreIcono;
  txt: string;
  sub?: string;
  al: () => void;
}

export function Paleta() {
  const { e } = useApp();
  const nav = useNav();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const lista = useRef<HTMLDivElement>(null);

  const filas = useMemo<Fila[]>(() => {
    const asesorDe = (id: string) => e.asesores.find((a) => a.id === id)?.nombre ?? "";
    const r: Fila[] = [
      { id: "n1", grupo: "Ir a", ico: "tablero", txt: "Panel de gerencia", al: () => nav.irGerencia("panel") },
      { id: "n2", grupo: "Ir a", ico: "torre", txt: "Torre de control", al: () => nav.irGerencia("torre") },
      { id: "n3", grupo: "Ir a", ico: "equipo", txt: "Equipo", al: () => nav.irGerencia("equipo") },
      { id: "n4", grupo: "Ir a", ico: "campana", txt: "Alertas", al: () => nav.irGerencia("alertas") },
      { id: "n8", grupo: "Ir a", ico: "pulso", txt: "Cadencia de contacto con el equipo", al: () => nav.irGerencia("cadencia") },
      { id: "n9", grupo: "Ir a", ico: "tendencia", txt: "Facturación y proyección por asesor", al: () => nav.irGerencia("facturacion") },
      { id: "n5", grupo: "Ir a", ico: "sol", txt: "Mi día (vista asesor)", al: () => nav.irAsesor("dia") },
      { id: "n6", grupo: "Ir a", ico: "mensaje", txt: "Consultas entrantes", al: () => nav.irAsesor("consultas") },
      { id: "n7", grupo: "Ir a", ico: "documento", txt: "Generador de documentos", al: () => nav.irAsesor("docs") },
    ];
    for (const o of e.operaciones) {
      r.push({
        id: o.id,
        grupo: "Operaciones",
        ico: "expediente",
        txt: o.propiedad,
        sub: `${o.id} · ${asesorDe(o.asesorId)} · ${usd(o.precio)}`,
        al: () => nav.abrirOp(o.id),
      });
    }
    for (const p of e.propiedades) {
      r.push({
        id: p.id,
        grupo: "Propiedades",
        ico: "edificio",
        txt: p.direccion,
        sub: `${p.barrio} · ${p.tipo} · ${usd(p.precio)}`,
        al: () => nav.abrirProp(p.id),
      });
    }
    for (const a of e.asesores.slice(0, 12)) {
      r.push({
        id: a.id,
        grupo: "Equipo",
        ico: "persona",
        txt: a.nombre,
        sub: `${a.rol} · ${a.activas} activas`,
        al: () => {
          nav.irGerencia("equipo");
          nav.abrirAsesor(a.id);
        },
      });
    }
    return r;
  }, [e.operaciones, e.propiedades, e.asesores, nav]);

  const filtradas = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return filas.slice(0, 9);
    return filas
      .filter((f) => `${f.txt} ${f.sub ?? ""} ${f.grupo}`.toLowerCase().includes(t))
      .slice(0, 24);
  }, [q, filas]);

  useEffect(() => setSel(0), [q]);

  useEffect(() => {
    lista.current?.querySelector('[data-sel="1"]')?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  if (!nav.paleta) return null;

  const cerrar = () => {
    nav.setPaleta(false);
    setQ("");
  };
  const correr = (f?: Fila) => {
    if (!f) return;
    f.al();
    cerrar();
  };

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[12vh] px-4">
      <div className="absolute inset-0 bg-[var(--tinta)]/35 a-velo" onClick={cerrar} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Buscar y ejecutar"
        className="relative w-full max-w-[560px] bg-[var(--papel-alto)] border border-[var(--linea-fuerte)] rounded-[var(--r-lg)] alza-alta a-surgir overflow-hidden"
      >
        <div className="flex items-center gap-2.5 px-3.5 h-12 border-b border-[var(--linea-suave)]">
          <Icono n="buscar" s={17} className="text-[var(--tinta-tenue)]" />
          <input
            autoFocus
            value={q}
            onChange={(ev) => setQ(ev.target.value)}
            onKeyDown={(ev) => {
              if (ev.key === "Escape") cerrar();
              if (ev.key === "ArrowDown") {
                ev.preventDefault();
                setSel((s) => Math.min(s + 1, filtradas.length - 1));
              }
              if (ev.key === "ArrowUp") {
                ev.preventDefault();
                setSel((s) => Math.max(s - 1, 0));
              }
              if (ev.key === "Enter") {
                ev.preventDefault();
                correr(filtradas[sel]);
              }
            }}
            placeholder="Buscar expediente, propiedad, asesor o acción…"
            aria-label="Buscar"
            className="flex-1 h-full bg-transparent outline-none text-[14px] placeholder:text-[var(--tinta-tenue)]"
          />
          <kbd className="num text-[10px] px-1.5 h-5 grid place-items-center rounded-[var(--r-xs)] border border-[var(--linea)] bg-[var(--papel-hundido)] text-[var(--tinta-tenue)]">
            ESC
          </kbd>
        </div>

        <div ref={lista} className="max-h-[52vh] overflow-y-auto scroll py-1">
          {filtradas.length === 0 && (
            <p className="px-4 py-6 text-center text-[12.5px] text-[var(--tinta-tenue)]">
              Nada coincide con “{q}”.
            </p>
          )}
          {filtradas.map((f, i) => {
            const cabecera = i === 0 || filtradas[i - 1].grupo !== f.grupo;
            return (
              <div key={f.grupo + f.id}>
                {cabecera && <p className="rotulo px-3.5 pt-2 pb-1">{f.grupo}</p>}
                <button
                  type="button"
                  data-sel={i === sel ? "1" : "0"}
                  onMouseEnter={() => setSel(i)}
                  onClick={() => correr(f)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3.5 h-[38px] text-left transition-colors duration-[100ms]",
                    i === sel ? "bg-[var(--sello-tenue)]" : "hover:bg-[var(--papel-hundido)]",
                  )}
                >
                  <Icono
                    n={f.ico}
                    s={15}
                    className={i === sel ? "text-[var(--sello)]" : "text-[var(--tinta-tenue)]"}
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] text-[var(--tinta)] truncate">{f.txt}</span>
                    {f.sub && (
                      <span className="block text-[11px] text-[var(--tinta-tenue)] truncate">{f.sub}</span>
                    )}
                  </span>
                  {i === sel && (
                    <Icono n="flechaDer" s={14} className="text-[var(--sello)]" />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 px-3.5 h-8 border-t border-[var(--linea-suave)] bg-[var(--papel-hundido)]/50">
          {[
            ["↑↓", "navegar"],
            ["↵", "abrir"],
          ].map(([k, v]) => (
            <span key={k} className="flex items-center gap-1 text-[10.5px] text-[var(--tinta-tenue)]">
              <kbd className="num px-1 h-4 grid place-items-center rounded-[2px] border border-[var(--linea)] bg-[var(--papel-alto)]">
                {k}
              </kbd>
              {v}
            </span>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Atajo global de teclado para abrir la paleta. */
export function useAtajoPaleta() {
  const nav = useNav();
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        nav.setPaleta(true);
      }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [nav]);
}
