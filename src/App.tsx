import { Expediente } from "./components/Expediente";
import { FichaPropiedad } from "./components/FichaPropiedad";
import { Avisos, Paleta, useAtajoPaleta } from "./components/Sistema";
import { Inicial } from "./components/ui";
import { Icono, type NombreIcono } from "./lib/icons";
import { cn } from "./lib/format";
import AsesorPanel from "./panels/AsesorPanel";
import GerenciaPanel from "./panels/GerenciaPanel";
import { NavProveedor, useNav, type VistaAsesor, type VistaGerencia } from "./state/nav";
import { Proveedor, useApp, useDerivados } from "./state/store";

const NAV_GERENCIA: { id: VistaGerencia; l: string; corto: string; i: NombreIcono }[] = [
  { id: "panel", l: "Panel", corto: "Panel", i: "tablero" },
  { id: "torre", l: "Torre de control", corto: "Torre", i: "torre" },
  { id: "alertas", l: "Alertas", corto: "Alertas", i: "campana" },
  { id: "cadencia", l: "Cadencia", corto: "Cadencia", i: "pulso" },
  { id: "facturacion", l: "Facturación", corto: "Facturac.", i: "tendencia" },
  { id: "equipo", l: "Equipo", corto: "Equipo", i: "equipo" },
  { id: "cartera", l: "Cartera", corto: "Cartera", i: "edificio" },
];

const NAV_ASESOR: { id: VistaAsesor; l: string; corto: string; i: NombreIcono }[] = [
  { id: "dia", l: "Mi día", corto: "Mi día", i: "sol" },
  { id: "consultas", l: "Consultas", corto: "Consultas", i: "mensaje" },
  { id: "cartera", l: "Propiedades", corto: "Propied.", i: "edificio" },
  { id: "docs", l: "Documentos", corto: "Docs", i: "documento" },
  { id: "perfil", l: "Perfil", corto: "Perfil", i: "persona" },
];

const TITULOS: Record<string, string> = {
  panel: "Panel de gerencia",
  torre: "Torre de control",
  alertas: "Alertas de la oficina",
  cadencia: "Cadencia de contacto con el equipo",
  facturacion: "Facturación y proyección por asesor",
  equipo: "Equipo",
  cartera: "Cartera de propiedades",
  dia: "Mi día",
  consultas: "Consultas entrantes",
  docs: "Generador de documentos",
  perfil: "Mi perfil",
};

function Marca() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="h-[7px] w-[7px] rounded-full bg-[#A62F1C]" aria-hidden="true" />
      <span className="text-[12.5px] font-bold tracking-[0.08em] text-white">RE/MAX</span>
      <span className="hidden sm:inline text-[12px] text-white/35">·</span>
      <span className="hidden sm:inline text-[12px] text-white/60">Devoto</span>
      <span
        className="num ml-1 px-1.5 h-[17px] inline-flex items-center rounded-[2px] border border-white/20 text-[9.5px] tracking-[0.09em] text-white/55"
        title="Maqueta de demostración. Todos los datos son inventados."
      >
        PROTOTIPO · DATOS FICTICIOS
      </span>
    </div>
  );
}

function BarraSuperior() {
  const nav = useNav();
  const { e } = useApp();
  const { sinLeer, sinAsignar } = useDerivados();
  const yo = e.asesores.find((a) => a.id === e.yo);

  return (
    <header className="shrink-0 flex items-center gap-3 h-11 px-3 bg-[var(--papel-marca)]">
      <Marca />

      <div className="ml-3 flex items-center rounded-[var(--r-sm)] border border-white/12 p-[2px]">
        {(
          [
            ["gerencia", "Gerencia"],
            ["asesor", "Asesor"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            type="button"
            aria-pressed={nav.modo === k}
            onClick={() => nav.irModo(k)}
            className={cn(
              "h-6 px-2.5 rounded-[2px] text-[11.5px] font-semibold transition-colors duration-[140ms]",
              nav.modo === k ? "bg-white text-[var(--papel-marca)]" : "text-white/55 hover:text-white",
            )}
          >
            {l}
          </button>
        ))}
      </div>

      <button
        type="button"
        aria-label="Buscar o ejecutar"
        onClick={() => nav.setPaleta(true)}
        className="ml-auto hidden sm:flex items-center gap-2 h-7 pl-2.5 pr-1.5 rounded-[var(--r-sm)] border border-white/12 text-white/50 hover:text-white hover:border-white/25 transition-colors w-[240px]"
      >
        <Icono n="buscar" s={14} />
        <span className="text-[12px] truncate">Buscar o ejecutar…</span>
        <kbd className="num ml-auto text-[9.5px] px-1 h-4 grid place-items-center rounded-[2px] border border-white/15">
          ⌘K
        </kbd>
      </button>

      <button
        type="button"
        aria-label="Buscar o ejecutar"
        onClick={() => nav.setPaleta(true)}
        className="ml-auto sm:hidden size-8 grid place-items-center rounded-[var(--r-sm)] text-white/55 hover:text-white hover:bg-white/8 transition-colors"
      >
        <Icono n="buscar" s={16} />
      </button>

      <button
        type="button"
        aria-label={`Alertas${sinLeer ? `, ${sinLeer} sin leer` : ""}`}
        onClick={() => nav.irGerencia("alertas")}
        className="relative size-8 grid place-items-center rounded-[var(--r-sm)] text-white/55 hover:text-white hover:bg-white/8 transition-colors"
      >
        <Icono n="campana" s={16} />
        {sinLeer > 0 && (
          <span className="num absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-1 grid place-items-center rounded-full bg-[#D62B34] text-white text-[9px] font-bold">
            {sinLeer}
          </span>
        )}
      </button>

      {sinAsignar.length > 0 && (
        <button
          type="button"
          onClick={() => nav.irAsesor("consultas")}
          className="hidden sm:flex items-center gap-1.5 h-7 px-2 rounded-[var(--r-sm)] bg-white/8 text-white/75 hover:bg-white/14 transition-colors"
        >
          <span className="size-1.5 rounded-full bg-[#D62B34]" />
          <span className="num text-[11.5px]">{sinAsignar.length}</span>
          <span className="text-[11.5px]">sin asignar</span>
        </button>
      )}

      <span className="hidden md:flex items-center gap-2 pl-2 border-l border-white/12">
        <Inicial txt={yo?.iniciales ?? "GG"} s={24} oscuro={false} />
        <span className="text-[11.5px] text-white/65">{nav.modo === "gerencia" ? "Gerencia" : yo?.nombre}</span>
      </span>
    </header>
  );
}

function Lateral() {
  const nav = useNav();
  const { sinLeer, sinAsignar, enRiesgo, vencidosContacto, seApagan } = useDerivados();
  const items = nav.modo === "gerencia" ? NAV_GERENCIA : NAV_ASESOR;
  const activa = nav.modo === "gerencia" ? nav.vistaGerencia : nav.vistaAsesor;

  const insignia = (id: string) =>
    id === "alertas"
      ? sinLeer
      : id === "consultas"
        ? sinAsignar.length
        : id === "torre"
          ? enRiesgo.length
          : id === "cadencia"
            ? vencidosContacto.length
            : id === "facturacion"
              ? seApagan.length
              : 0;

  return (
    <nav className="hidden md:flex flex-col w-[188px] shrink-0 border-r border-[var(--linea)] bg-[var(--papel-alto)]">
      <ul className="py-2">
        {items.map((it) => {
          const on = activa === it.id;
          const n = insignia(it.id);
          return (
            <li key={it.id}>
              <button
                type="button"
                aria-current={on ? "page" : undefined}
                onClick={() =>
                  nav.modo === "gerencia"
                    ? nav.irGerencia(it.id as VistaGerencia)
                    : nav.irAsesor(it.id as VistaAsesor)
                }
                className={cn(
                  "relative w-full flex items-center gap-2.5 h-9 pl-3.5 pr-2.5 text-[13px] transition-colors duration-[140ms]",
                  on
                    ? "text-[var(--tinta)] font-medium bg-[var(--papel-hundido)]"
                    : "text-[var(--tinta-suave)] hover:text-[var(--tinta)] hover:bg-[var(--papel-hundido)]/60",
                )}
              >
                {on && <span className="absolute left-0 inset-y-[6px] w-[2px] bg-[var(--sello)] rounded-r-[1px]" />}
                <Icono n={it.i} s={16} className={on ? "text-[var(--sello)]" : ""} />
                <span className="flex-1 text-left">{it.l}</span>
                {n > 0 && (
                  <span
                    className="num text-[10px] font-bold px-1.5 h-[17px] grid place-items-center rounded-[var(--r-xs)]"
                    style={{ background: "var(--lacre-tenue)", color: "var(--lacre)" }}
                  >
                    {n}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto p-3 border-t border-[var(--linea-suave)]">
        <p className="rotulo">Atajos</p>
        <ul className="mt-1.5 space-y-1">
          {[
            ["⌘K", "buscar y ejecutar"],
            ["Esc", "cerrar el expediente"],
          ].map(([k, v]) => (
            <li key={k} className="flex items-center gap-1.5 text-[11px] text-[var(--tinta-tenue)]">
              <kbd className="num px-1 h-[16px] grid place-items-center rounded-[2px] border border-[var(--linea)] bg-[var(--papel-hundido)]">
                {k}
              </kbd>
              {v}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

function NavInferior() {
  const nav = useNav();
  const { sinLeer, sinAsignar, vencidosContacto } = useDerivados();
  const items = nav.modo === "gerencia" ? NAV_GERENCIA : NAV_ASESOR;
  const activa = nav.modo === "gerencia" ? nav.vistaGerencia : nav.vistaAsesor;

  return (
    <nav
      className="md:hidden shrink-0 flex border-t border-[var(--linea)] bg-[var(--papel-alto)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {items.map((it) => {
        const on = activa === it.id;
        const n =
          it.id === "alertas"
            ? sinLeer
            : it.id === "consultas"
              ? sinAsignar.length
              : it.id === "cadencia"
                ? vencidosContacto.length
                : 0;
        return (
          <button
            key={it.id}
            type="button"
            aria-current={on ? "page" : undefined}
            onClick={() =>
              nav.modo === "gerencia"
                ? nav.irGerencia(it.id as VistaGerencia)
                : nav.irAsesor(it.id as VistaAsesor)
            }
            className={cn(
              "relative flex-1 flex flex-col items-center justify-center gap-1 min-h-[54px] transition-colors",
              on ? "text-[var(--sello)]" : "text-[var(--tinta-tenue)]",
            )}
          >
            {on && <span className="absolute top-0 inset-x-4 h-[2px] bg-[var(--sello)] rounded-b-[1px]" />}
            <Icono n={it.i} s={18} />
            <span className="text-[10px] font-medium">{it.corto}</span>
            {n > 0 && (
              <span className="num absolute top-1.5 right-[22%] min-w-[14px] h-[14px] px-1 grid place-items-center rounded-full bg-[var(--lacre)] text-white text-[9px] font-bold">
                {n}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

function Cuerpo() {
  const nav = useNav();
  const { e } = useApp();
  useAtajoPaleta();
  const vista = nav.modo === "gerencia" ? nav.vistaGerencia : nav.vistaAsesor;
  const fecha = new Date(e.ahora).toLocaleDateString("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const hora = new Date(e.ahora).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-[var(--papel)]">
      <BarraSuperior />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <Lateral />

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="shrink-0 flex items-center gap-3 h-[42px] px-4 border-b border-[var(--linea)] bg-[var(--papel-alto)]">
            <h1 className="text-[13.5px] font-semibold">{TITULOS[vista]}</h1>
            <span className="num ml-auto text-[11.5px] text-[var(--tinta-tenue)]">
              {fecha} · {hora}
            </span>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            {nav.modo === "gerencia" ? <GerenciaPanel /> : <AsesorPanel />}
          </div>
        </main>
      </div>

      <NavInferior />

      {nav.op && <Expediente />}
      {nav.prop && <FichaPropiedad />}
      <Paleta />
      <Avisos />
    </div>
  );
}

export default function App() {
  return (
    <Proveedor>
      <NavProveedor>
        <Cuerpo />
      </NavProveedor>
    </Proveedor>
  );
}
