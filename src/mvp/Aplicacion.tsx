import { createPortal } from "react-dom";
import { Icono, type NombreIcono } from "../lib/icons";
import { cn } from "../lib/format";
import { Inicial, Menu, ItemMenu } from "../components/ui";
import { NavProveedor, useNav, type VistaAsesor, type VistaGerencia } from "./nav";
import { Proveedor, useApp, useDerivados } from "./tienda";
import Generador from "./asesor/Generador";
import MisRegistros from "./asesor/MisRegistros";
import Vencimientos from "./gerencia/Vencimientos";
import Reservas from "./gerencia/Reservas";
import Facturacion from "./gerencia/Facturacion";
import Automatizaciones from "./gerencia/Automatizaciones";
import Expediente from "./gerencia/Expediente";

const NAV_GERENCIA: { id: VistaGerencia; l: string; corto: string; i: NombreIcono }[] = [
  { id: "vencimientos", l: "Vencimientos", corto: "Vencim.", i: "reloj" },
  { id: "reservas", l: "Reservas", corto: "Reservas", i: "expediente" },
  { id: "facturacion", l: "Facturación", corto: "Facturac.", i: "tendencia" },
  { id: "automatizaciones", l: "Automatizaciones", corto: "Avisos", i: "rayo" },
];

const NAV_ASESOR: { id: VistaAsesor; l: string; corto: string; i: NombreIcono }[] = [
  { id: "generar", l: "Generar documento", corto: "Generar", i: "documento" },
  { id: "registros", l: "Mis documentos", corto: "Mis docs", i: "expediente" },
];

const TITULOS: Record<string, string> = {
  vencimientos: "Vencimientos",
  reservas: "Reservas registradas",
  facturacion: "Facturación y proyección por agente",
  automatizaciones: "Avisos automáticos por correo",
  generar: "Generar un documento",
  registros: "Mis documentos registrados",
};

/* ── Avisos ─────────────────────────────────────────────────── */

function Avisos() {
  const { e, d } = useApp();
  if (!e.avisos.length) return null;

  return createPortal(
    <div className="fixed z-[60] bottom-4 left-1/2 -translate-x-1/2 w-[min(440px,calc(100vw-24px))] space-y-2">
      {e.avisos.map((a) => (
        <div
          key={a.id}
          role="status"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--r-md)] border alza-alta a-surgir bg-[var(--papel-alto)]"
          style={{
            borderColor:
              a.tono === "ok" ? "var(--verde-borde)" : a.tono === "riesgo" ? "var(--lacre-borde)" : "var(--linea-fuerte)",
          }}
        >
          <Icono
            n={a.tono === "riesgo" ? "alerta" : "tilde"}
            s={15}
            className={a.tono === "riesgo" ? "text-[var(--lacre)]" : "text-[var(--verde)]"}
          />
          <p className="text-[12.5px] flex-1">{a.texto}</p>
          <button
            type="button"
            aria-label="Cerrar aviso"
            onClick={() => d({ t: "aviso.cerrar", id: a.id })}
            className="size-6 grid place-items-center rounded-[var(--r-xs)] text-[var(--tinta-tenue)] hover:text-[var(--tinta)] hover:bg-[var(--papel-hundido)]"
          >
            <Icono n="cruz" s={12} />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}

/* ── Chrome ─────────────────────────────────────────────────── */

function BarraSuperior() {
  const nav = useNav();
  const { e, d } = useApp();
  const yo = e.asesores.find((a) => a.id === e.yo)!;

  return (
    <header className="shrink-0 flex items-center gap-2 sm:gap-3 h-11 px-3 bg-[var(--papel-marca)]">
      <div className="flex items-center gap-2.5">
        <span className="h-[7px] w-[7px] rounded-full bg-[#A62F1C]" aria-hidden="true" />
        <span className="text-[12.5px] font-bold tracking-[0.08em] text-white">RE/MAX</span>
        <span className="hidden sm:inline text-[12px] text-white/35">·</span>
        <span className="hidden sm:inline text-[12px] text-white/60">Devoto</span>
        <span
          className="hidden md:inline-flex num ml-1 px-1.5 h-[17px] items-center rounded-[2px] border border-white/20 text-[9.5px] tracking-[0.09em] text-white/55 whitespace-nowrap"
          title="Maqueta de demostración. Todos los datos son inventados."
        >
          MVP · DATOS FICTICIOS
        </span>
      </div>

      <div className="ml-1 sm:ml-3 flex items-center rounded-[var(--r-sm)] border border-white/12 p-[2px]">
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

      <div className="ml-auto flex items-center gap-2">
        {nav.modo === "asesor" ? (
          <Menu
            disparador={(abrir) => (
              <button
                type="button"
                onClick={abrir}
                className="flex items-center gap-2 h-8 pl-1.5 pr-2 rounded-[var(--r-sm)] hover:bg-white/10 transition-colors"
              >
                <Inicial txt={yo.iniciales} s={24} oscuro={false} />
                <span className="hidden sm:inline text-[11.5px] text-white/75">{yo.nombre}</span>
                <Icono n="chevAbajo" s={13} className="text-white/50" />
              </button>
            )}
          >
            {(cerrar) => (
              <>
                <p className="px-2.5 py-1.5 rotulo">Entrar como</p>
                {e.asesores.slice(0, 8).map((a) => (
                  <ItemMenu
                    key={a.id}
                    ico={a.id === e.yo ? "tilde" : undefined}
                    onClick={() => {
                      d({ t: "yo", asesorId: a.id });
                      cerrar();
                    }}
                  >
                    {a.nombre}
                  </ItemMenu>
                ))}
              </>
            )}
          </Menu>
        ) : (
          <span className="flex items-center gap-2 pl-2 border-l border-white/12">
            <Inicial txt="GG" s={24} oscuro={false} />
            <span className="hidden sm:inline text-[11.5px] text-white/65">Gerencia</span>
          </span>
        )}
      </div>
    </header>
  );
}

function Lateral() {
  const nav = useNav();
  const { vencidos, hoy, seApagan, contactoVencido, porRevisar } = useDerivados();
  const { e } = useApp();
  const items = nav.modo === "gerencia" ? NAV_GERENCIA : NAV_ASESOR;
  const activa = nav.modo === "gerencia" ? nav.vistaGerencia : nav.vistaAsesor;

  const mios = e.registros.filter(
    (r) => r.asesorId === e.yo && r.estado === "vigente",
  ).length;

  const insignia = (id: string) =>
    id === "vencimientos"
      ? vencidos.length + hoy.length
      : id === "reservas"
        ? porRevisar
        : id === "facturacion"
          ? seApagan.length
          : id === "automatizaciones"
            ? contactoVencido.length
            : id === "registros"
              ? mios
              : 0;

  return (
    <nav className="hidden md:flex flex-col w-[196px] shrink-0 border-r border-[var(--linea)] bg-[var(--papel-alto)]">
      <ul className="py-2">
        {items.map((it) => {
          const on = activa === it.id;
          const n = insignia(it.id);
          const alerta =
            nav.modo === "gerencia" &&
            ((it.id === "vencimientos" && vencidos.length > 0) || (it.id === "reservas" && porRevisar > 0));
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
                    style={
                      alerta
                        ? { background: "var(--lacre-tenue)", color: "var(--lacre)" }
                        : { background: "var(--papel-hundido)", color: "var(--tinta-suave)" }
                    }
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
        <p className="rotulo">Alcance del MVP</p>
        <ul className="mt-1.5 space-y-1 text-[11px] text-[var(--tinta-tenue)] leading-snug">
          <li>Documentos con seguimiento de vencimientos</li>
          <li>Facturación y proyección por agente</li>
          <li>Avisos automáticos por correo</li>
        </ul>
      </div>
    </nav>
  );
}

function NavInferior() {
  const nav = useNav();
  const { vencidos } = useDerivados();
  const items = nav.modo === "gerencia" ? NAV_GERENCIA : NAV_ASESOR;
  const activa = nav.modo === "gerencia" ? nav.vistaGerencia : nav.vistaAsesor;

  return (
    <nav
      className="md:hidden shrink-0 flex border-t border-[var(--linea)] bg-[var(--papel-alto)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {items.map((it) => {
        const on = activa === it.id;
        const n = it.id === "vencimientos" ? vencidos.length : 0;
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
            <h1 className="text-[13.5px] font-semibold truncate">{TITULOS[vista]}</h1>
            <span className="num ml-auto text-[11.5px] text-[var(--tinta-tenue)] whitespace-nowrap">
              {fecha} · {hora}
            </span>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            {nav.modo === "gerencia" ? (
              nav.vistaGerencia === "vencimientos" ? (
                <Vencimientos />
              ) : nav.vistaGerencia === "reservas" ? (
                <Reservas />
              ) : nav.vistaGerencia === "facturacion" ? (
                <Facturacion />
              ) : (
                <Automatizaciones />
              )
            ) : nav.vistaAsesor === "generar" ? (
              <Generador />
            ) : (
              <MisRegistros />
            )}
          </div>
        </main>
      </div>

      <NavInferior />

      {nav.expediente && <Expediente />}
      <Avisos />
    </div>
  );
}

export default function Aplicacion() {
  return (
    <Proveedor>
      <NavProveedor>
        <Cuerpo />
      </NavProveedor>
    </Proveedor>
  );
}
