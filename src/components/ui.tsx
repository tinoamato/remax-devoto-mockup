import {
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { Icono, type NombreIcono } from "../lib/icons";
import { cn, plazo } from "../lib/format";
import type { Urgencia } from "../data/mock";

/* ── Botón ──────────────────────────────────────────────────── */

type Tono = "primario" | "secundario" | "fantasma" | "peligro";

const TONOS: Record<Tono, string> = {
  primario:
    "bg-[var(--sello)] text-white border-[var(--sello)] hover:bg-[var(--sello-alto)] hover:border-[var(--sello-alto)]",
  secundario:
    "bg-[var(--papel-alto)] text-[var(--tinta)] border-[var(--linea-fuerte)] hover:bg-[var(--papel-hundido)]",
  fantasma:
    "bg-transparent text-[var(--tinta-media)] border-transparent hover:bg-[var(--papel-hundido)] hover:text-[var(--tinta)]",
  peligro:
    "bg-[var(--papel-alto)] text-[var(--lacre)] border-[var(--lacre-borde)] hover:bg-[var(--lacre-tenue)]",
};

export function Boton({
  tono = "secundario",
  ico,
  chico,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  tono?: Tono;
  ico?: NombreIcono;
  chico?: boolean;
}) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-[var(--r-sm)] border font-medium",
        "transition-[background-color,border-color,color,transform] duration-[140ms] ease-out",
        "active:scale-[0.975] disabled:opacity-40 disabled:pointer-events-none select-none",
        chico ? "h-7 px-2 text-[12px]" : "h-9 px-3 text-[13px]",
        TONOS[tono],
        className,
      )}
    >
      {ico && <Icono n={ico} s={chico ? 13 : 15} />}
      {children}
    </button>
  );
}

export function BotonIcono({
  ico,
  rotulo,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { ico: NombreIcono; rotulo: string }) {
  return (
    <button
      type="button"
      aria-label={rotulo}
      title={rotulo}
      {...rest}
      className={cn(
        "inline-flex items-center justify-center size-9 rounded-[var(--r-sm)]",
        "text-[var(--tinta-suave)] hover:text-[var(--tinta)] hover:bg-[var(--papel-hundido)]",
        "transition-colors duration-[140ms] active:scale-[0.97]",
        className,
      )}
    >
      <Icono n={ico} s={17} />
    </button>
  );
}

/* ── Etiqueta de carpeta (reemplaza los pills) ──────────────── */

const ETIQ: Record<string, [string, string, string]> = {
  vencida: ["var(--lacre)", "var(--lacre-tenue)", "var(--lacre-borde)"],
  hoy: ["var(--ambar)", "var(--ambar-tenue)", "var(--ambar-borde)"],
  semana: ["var(--tinta-media)", "var(--papel-hundido)", "var(--linea)"],
  ok: ["var(--verde)", "var(--verde-tenue)", "var(--verde-borde)"],
  sello: ["var(--sello)", "var(--sello-tenue)", "var(--sello-borde)"],
  neutro: ["var(--tinta-suave)", "var(--papel-hundido)", "var(--linea)"],
};

export function Etiqueta({
  t = "neutro",
  children,
  className,
}: {
  t?: keyof typeof ETIQ | string;
  children: ReactNode;
  className?: string;
}) {
  const [fg, bg, bd] = ETIQ[t] ?? ETIQ.neutro;
  return (
    <span
      className={cn(
        "inline-flex items-center h-[19px] pl-1.5 pr-2 text-[10.5px] font-semibold uppercase",
        "tracking-[0.05em] rounded-[var(--r-xs)] border border-l-[3px] whitespace-nowrap",
        className,
      )}
      style={{ color: fg, background: bg, borderColor: bd, borderLeftColor: fg }}
    >
      {children}
    </span>
  );
}

const ROTULO_URGENCIA: Record<Urgencia, string> = {
  vencida: "Vencida",
  hoy: "Vence hoy",
  semana: "Esta semana",
  ok: "Al día",
};

export function EtiquetaUrgencia({ u }: { u: Urgencia }) {
  return <Etiqueta t={u}>{ROTULO_URGENCIA[u]}</Etiqueta>;
}

/* ── Cuenta regresiva ───────────────────────────────────────── */

export function Cuenta({
  vence,
  ahora,
  grande,
}: {
  vence: number;
  ahora: number;
  grande?: boolean;
}) {
  const hs = (vence - ahora) / 3_600_000;
  const color =
    hs < 0 ? "var(--lacre)" : hs <= 24 ? "var(--ambar)" : hs <= 168 ? "var(--tinta-media)" : "var(--verde)";
  return (
    <span
      className={cn("num font-semibold whitespace-nowrap", grande ? "text-[22px] leading-none" : "text-[12.5px]")}
      style={{ color }}
    >
      {plazo(vence, ahora)}
    </span>
  );
}

/* ── Superficies ────────────────────────────────────────────── */

export function Panel({
  children,
  className,
  plano,
}: {
  children: ReactNode;
  className?: string;
  plano?: boolean;
}) {
  return (
    <section
      className={cn(
        "bg-[var(--papel-alto)] border border-[var(--linea)] rounded-[var(--r-md)] overflow-hidden",
        !plano && "alza",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CabezaPanel({
  titulo,
  extra,
  cuenta,
}: {
  titulo: string;
  extra?: ReactNode;
  cuenta?: number;
}) {
  return (
    <header className="flex items-center gap-2 h-9 px-3 border-b border-[var(--linea-suave)] bg-[var(--papel-hundido)]/60">
      <h2 className="rotulo">{titulo}</h2>
      {cuenta !== undefined && <span className="num text-[11px] text-[var(--tinta-tenue)]">{cuenta}</span>}
      <div className="ml-auto flex items-center gap-1">{extra}</div>
    </header>
  );
}

/* ── Avatar ─────────────────────────────────────────────────── */

export function Inicial({
  txt,
  s = 26,
  oscuro,
}: {
  txt: string;
  s?: number;
  oscuro?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-[var(--r-xs)] font-semibold shrink-0"
      style={{
        width: s,
        height: s,
        fontSize: Math.round(s * 0.4),
        background: oscuro ? "var(--tinta)" : "var(--sello-tenue)",
        color: oscuro ? "var(--papel)" : "var(--sello)",
        border: `1px solid ${oscuro ? "var(--tinta)" : "var(--sello-borde)"}`,
      }}
    >
      {txt}
    </span>
  );
}

/* ── Campos ─────────────────────────────────────────────────── */

const CAMPO_BASE =
  "w-full bg-[var(--papel-hundido)] border border-[var(--linea-fuerte)] rounded-[var(--r-sm)] " +
  "px-2.5 text-[13px] text-[var(--tinta)] placeholder:text-[var(--tinta-tenue)] " +
  "focus:bg-[var(--papel-alto)] focus:border-[var(--sello)] outline-none transition-colors duration-[140ms]";

export function Campo({
  rotulo,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { rotulo?: string }) {
  return (
    <label className="block">
      {rotulo && <span className="rotulo block mb-1">{rotulo}</span>}
      <input {...rest} className={cn(CAMPO_BASE, "h-9", className)} />
    </label>
  );
}

export function Selector({
  rotulo,
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { rotulo?: string }) {
  return (
    <label className="block">
      {rotulo && <span className="rotulo block mb-1">{rotulo}</span>}
      <select {...rest} className={cn(CAMPO_BASE, "h-9 pr-7 appearance-none cursor-pointer", className)}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2378746A' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='m4 6.5 4 4 4-4'/></svg>\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 7px center",
        }}
      >
        {children}
      </select>
    </label>
  );
}

export function Buscador({
  valor,
  alCambiar,
  hint = "Buscar…",
  className,
}: {
  valor: string;
  alCambiar: (v: string) => void;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Icono
        n="buscar"
        s={15}
        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--tinta-tenue)] pointer-events-none"
      />
      <input
        value={valor}
        onChange={(e) => alCambiar(e.target.value)}
        placeholder={hint}
        aria-label={hint}
        className={cn(CAMPO_BASE, "h-9 pl-8")}
      />
      {valor && (
        <button
          type="button"
          aria-label="Limpiar búsqueda"
          onClick={() => alCambiar("")}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 size-6 grid place-items-center rounded-[var(--r-xs)] text-[var(--tinta-tenue)] hover:text-[var(--tinta)] hover:bg-[var(--papel-hundido)]"
        >
          <Icono n="cruz" s={13} />
        </button>
      )}
    </div>
  );
}

/* ── Barra de progreso ──────────────────────────────────────── */

export function Barra({ pct, color = "var(--sello)" }: { pct: number; color?: string }) {
  return (
    <div className="h-1 w-full bg-[var(--papel-hundido)] border border-[var(--linea-suave)] rounded-[1px] overflow-hidden">
      <div
        className="h-full transition-[width] duration-[240ms] ease-out"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }}
      />
    </div>
  );
}

/* ── Riel de etapas (elemento firma) ────────────────────────── */

export function RielEtapas({
  etapas,
  actual,
  compacto,
  alElegir,
}: {
  etapas: string[];
  actual: number;
  compacto?: boolean;
  alElegir?: (i: number) => void;
}) {
  const rielRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (compacto) return;
    const el = rielRef.current?.children[actual] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [actual, compacto]);

  if (compacto) {
    return (
      <div className="flex items-end gap-[2px]" aria-label={`Etapa ${actual + 1} de ${etapas.length}`}>
        {etapas.map((_, i) => (
          <span
            key={i}
            className="w-[5px] rounded-[1px]"
            style={{
              height: i === actual ? 14 : 9,
              background:
                i < actual ? "var(--verde-borde)" : i === actual ? "var(--sello)" : "var(--linea)",
            }}
          />
        ))}
      </div>
    );
  }
  return (
    <div ref={rielRef} className="flex overflow-x-auto sin-scroll border-y border-[var(--linea-suave)] bg-[var(--papel-alto)]">
      {etapas.map((e, i) => {
        const pasada = i < actual;
        const viva = i === actual;
        const Elem = alElegir ? "button" : "div";
        return (
          <Elem
            key={e}
            {...(alElegir ? { type: "button" as const, onClick: () => alElegir(i) } : {})}
            aria-current={viva ? "step" : undefined}
            className={cn(
              "group relative shrink-0 min-w-[86px] px-2.5 py-2 text-left border-r border-[var(--linea-suave)] last:border-r-0",
              alElegir && "hover:bg-[var(--papel-hundido)] cursor-pointer",
            )}
          >
            <span
              className="absolute inset-x-0 top-0 h-[3px]"
              style={{
                background: pasada ? "var(--verde-borde)" : viva ? "var(--sello)" : "var(--linea)",
              }}
            />
            <span className="num block text-[10px] text-[var(--tinta-tenue)] mt-1">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span
              className={cn(
                "block text-[11.5px] leading-tight mt-0.5",
                viva ? "font-semibold text-[var(--tinta)]" : pasada ? "text-[var(--tinta-media)]" : "text-[var(--tinta-tenue)]",
              )}
            >
              {e}
            </span>
          </Elem>
        );
      })}
    </div>
  );
}

/* ── Medidor de riesgo ──────────────────────────────────────── */

export function Riesgo({ v, conNumero = true }: { v: number; conNumero?: boolean }) {
  const color = v >= 60 ? "var(--lacre)" : v >= 35 ? "var(--ambar)" : "var(--verde)";
  return (
    <span className="inline-flex items-center gap-1.5" title={`Índice de riesgo ${v} de 100`}>
      <span className="flex items-end gap-[2px] h-3" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="w-[3px] rounded-[1px]"
            style={{
              height: 4 + i * 2,
              background: v / 20 > i ? color : "var(--linea)",
            }}
          />
        ))}
      </span>
      {conNumero && (
        <span className="num text-[11.5px] font-semibold" style={{ color }}>
          {v}
        </span>
      )}
    </span>
  );
}

/* ── Estado vacío: siempre con una acción ───────────────────── */

export function Vacio({
  ico = "expediente",
  titulo,
  detalle,
  accion,
}: {
  ico?: NombreIcono;
  titulo: string;
  detalle?: string;
  accion?: { txt: string; al: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-14 gap-2">
      <span className="grid place-items-center size-11 rounded-[var(--r-md)] border border-[var(--linea)] bg-[var(--papel-hundido)] text-[var(--tinta-tenue)]">
        <Icono n={ico} s={20} />
      </span>
      <p className="text-[13.5px] font-semibold text-[var(--tinta-media)] mt-1">{titulo}</p>
      {detalle && <p className="text-[12.5px] text-[var(--tinta-tenue)] max-w-[38ch]">{detalle}</p>}
      {accion && (
        <Boton tono="secundario" className="mt-2" onClick={accion.al}>
          {accion.txt}
        </Boton>
      )}
    </div>
  );
}

/* ── Modal ──────────────────────────────────────────────────── */

export function Modal({
  titulo,
  sub,
  cerrar,
  children,
  pie,
  ancho = 460,
}: {
  titulo: string;
  sub?: string;
  cerrar: () => void;
  children: ReactNode;
  pie?: ReactNode;
  ancho?: number;
}) {
  const caja = useRef<HTMLDivElement>(null);
  const previo = useRef<Element | null>(null);

  useEffect(() => {
    previo.current = document.activeElement;
    const t = setTimeout(() => {
      const f = caja.current?.querySelector<HTMLElement>(
        "input,select,textarea,button:not([data-cerrar])",
      );
      (f ?? caja.current)?.focus();
    }, 0);
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        ev.stopPropagation();
        cerrar();
      }
      if (ev.key === "Tab" && caja.current) {
        const fs = [
          ...caja.current.querySelectorAll<HTMLElement>(
            'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
          ),
        ];
        if (!fs.length) return;
        const primero = fs[0];
        const ultimo = fs[fs.length - 1];
        if (ev.shiftKey && document.activeElement === primero) {
          ev.preventDefault();
          ultimo.focus();
        } else if (!ev.shiftKey && document.activeElement === ultimo) {
          ev.preventDefault();
          primero.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey, true);
      (previo.current as HTMLElement | null)?.focus?.();
    };
  }, [cerrar]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="absolute inset-0 bg-[var(--tinta)]/35 a-velo" onClick={cerrar} aria-hidden="true" />
      <div
        ref={caja}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        style={{ maxWidth: ancho }}
        className="relative w-full bg-[var(--papel-alto)] border border-[var(--linea-fuerte)] rounded-t-[var(--r-lg)] sm:rounded-[var(--r-lg)] alza-alta a-surgir max-h-[92dvh] flex flex-col"
      >
        <header className="flex items-start gap-3 px-4 py-3 border-b border-[var(--linea-suave)]">
          <div className="min-w-0 flex-1">
            <h2 className="text-[14px] font-semibold leading-tight">{titulo}</h2>
            {sub && <p className="text-[12px] text-[var(--tinta-suave)] mt-0.5">{sub}</p>}
          </div>
          <BotonIcono ico="cruz" rotulo="Cerrar" data-cerrar onClick={cerrar} className="-mr-1.5 -mt-1" />
        </header>
        <div className="px-4 py-3.5 overflow-y-auto scroll flex-1">{children}</div>
        {pie && (
          <footer className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[var(--linea-suave)] bg-[var(--papel-hundido)]/50">
            {pie}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}

/* ── Cajón lateral ──────────────────────────────────────────── */

export function Cajon({
  cerrar,
  children,
  ancho = 560,
}: {
  cerrar: () => void;
  children: ReactNode;
  ancho?: number;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [cerrar]);

  return createPortal(
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-[var(--tinta)]/25 a-velo" onClick={cerrar} aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        style={{ maxWidth: ancho }}
        className="relative w-full h-full bg-[var(--papel)] border-l border-[var(--linea-fuerte)] alza-alta a-deslizar flex flex-col"
      >
        {children}
      </aside>
    </div>,
    document.body,
  );
}

/* ── Menú desplegable simple ────────────────────────────────── */

export function Menu({
  disparador,
  children,
  alineado = "der",
}: {
  disparador: (abrir: () => void, abierto: boolean) => ReactNode;
  children: (cerrar: () => void) => ReactNode;
  alineado?: "izq" | "der";
}) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", esc);
    };
  }, [abierto]);

  return (
    <div ref={caja} className="relative">
      {disparador(() => setAbierto((v) => !v), abierto)}
      {abierto && (
        <div
          className={cn(
            "absolute top-[calc(100%+4px)] z-30 min-w-[190px] py-1 a-surgir",
            "bg-[var(--papel-alto)] border border-[var(--linea-fuerte)] rounded-[var(--r-md)] alza-alta",
            alineado === "der" ? "right-0" : "left-0",
          )}
          style={{ transformOrigin: alineado === "der" ? "top right" : "top left" }}
        >
          {children(() => setAbierto(false))}
        </div>
      )}
    </div>
  );
}

export function ItemMenu({
  ico,
  children,
  peligro,
  onClick,
}: {
  ico?: NombreIcono;
  children: ReactNode;
  peligro?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-2.5 h-8 text-[12.5px] text-left transition-colors duration-[120ms]",
        peligro
          ? "text-[var(--lacre)] hover:bg-[var(--lacre-tenue)]"
          : "text-[var(--tinta-media)] hover:bg-[var(--papel-hundido)] hover:text-[var(--tinta)]",
      )}
    >
      {ico && <Icono n={ico} s={14} />}
      {children}
    </button>
  );
}

/* ── Tabla ──────────────────────────────────────────────────── */

export function Th({
  children,
  ancho,
  alDer,
}: {
  children: ReactNode;
  ancho?: number | string;
  alDer?: boolean;
}) {
  return (
    <th
      scope="col"
      style={{ width: ancho }}
      className={cn(
        "rotulo font-semibold px-3 h-8 border-b border-[var(--linea)] bg-[var(--papel-hundido)]/70",
        alDer ? "text-right" : "text-left",
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  alDer,
}: {
  children: ReactNode;
  className?: string;
  alDer?: boolean;
}) {
  return (
    <td
      className={cn(
        "px-3 py-2 border-b border-[var(--linea-suave)] text-[13px] align-middle",
        alDer && "text-right",
        className,
      )}
    >
      {children}
    </td>
  );
}
