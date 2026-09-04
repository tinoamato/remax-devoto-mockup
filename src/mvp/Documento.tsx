import { campoVisible, fechaLarga, resolver, textoPlano, type Plantilla } from "./plantillas";
import { cn } from "../lib/format";

/* ─────────────────────────────────────────────────────────────
   La hoja. Lo que el asesor ve antes de imprimir y lo que
   gerencia abre desde el expediente. Texto fijo en tinta media,
   variables completadas resaltadas apenas.
   ───────────────────────────────────────────────────────────── */

/** Banda de marca del pie, la misma que llevan los papeles de la oficina. */
const PIE_MARCA = "/pie-advance.png";

const FIRMAS_POR_DEFECTO = ["FIRMA DEL OFERENTE\nACLARACIÓN", "FIRMA DE LA MARTILLERA\nACLARACIÓN"];

export function Hoja({
  plantilla,
  valores,
  ahora,
  id,
  resaltar = true,
  compacta,
}: {
  plantilla: Plantilla;
  valores: Record<string, string>;
  ahora: number;
  id?: string;
  resaltar?: boolean;
  compacta?: boolean;
}) {
  const clausulas = plantilla.cuerpo.filter((c) => campoVisible(c, valores));
  const obs = (valores.observaciones ?? "").trim();
  const firmas = plantilla.firmas ?? FIRMAS_POR_DEFECTO;

  const trozos = (texto: string) =>
    resolver(texto, valores, ahora).map((t, j) =>
      t.variable && resaltar ? (
        <span
          key={j}
          className="font-medium text-[var(--tinta)]"
          style={{ background: "var(--sello-tenue)", boxShadow: "0 1px 0 var(--sello-borde)" }}
        >
          {t.t}
        </span>
      ) : (
        <span key={j} className={t.variable ? "font-medium text-[var(--tinta)]" : undefined}>
          {t.t}
        </span>
      ),
    );

  return (
    <article
      className={cn(
        "bg-[var(--papel-alto)] text-[var(--tinta-media)] mx-auto w-full",
        compacta ? "px-5 py-5 text-[12px]" : "px-6 sm:px-10 py-7 sm:py-9 text-[12.5px]",
      )}
      style={{ maxWidth: 720, lineHeight: 1.75 }}
    >
      <header className="flex items-start justify-between gap-4 pb-3 border-b border-[var(--linea)]">
        <div className="flex items-center gap-2">
          <span className="h-[7px] w-[7px] rounded-full bg-[#A62F1C]" aria-hidden="true" />
          <span className="text-[11px] font-bold tracking-[0.1em] text-[var(--tinta)]">RE/MAX</span>
          <span className="text-[11px] text-[var(--tinta-tenue)]">Advance</span>
        </div>
        <div className="text-right">
          {id && <p className="num text-[10.5px] text-[var(--tinta-tenue)]">{id}</p>}
          <p className="num text-[10.5px] text-[var(--tinta-tenue)]">{fechaLarga(ahora)}</p>
        </div>
      </header>

      <h1 className="text-[15px] font-semibold text-[var(--tinta)] uppercase tracking-[0.06em] text-center mt-6 mb-5">
        {plantilla.titulo ?? plantilla.nombre.split("—")[0].trim()}
      </h1>

      <div className="space-y-3.5" style={{ textAlign: "justify" }}>
        {clausulas.map((c, i) =>
          c.bloque ? (
            <div key={i}>
              <p className="font-semibold text-[var(--tinta)] tracking-[0.06em] border-b border-[var(--linea)] pb-0.5 mb-1.5">
                {c.titulo}
              </p>
              <p>{trozos(c.texto)}</p>
            </div>
          ) : (
            <p key={i}>
              {c.titulo && <span className="font-semibold text-[var(--tinta)]">{c.titulo}. </span>}
              {trozos(c.texto)}
            </p>
          ),
        )}

        {obs && (
          <p className="pt-1">
            <span className="font-semibold text-[var(--tinta)]">OBSERVACIONES. </span>
            <span className="text-[var(--tinta)]">{obs}</span>
          </p>
        )}
      </div>

      <div
        className="grid gap-6 mt-12 pt-2"
        style={{ gridTemplateColumns: `repeat(${Math.min(firmas.length, 2)}, minmax(0, 1fr))` }}
      >
        {firmas.map((f) => (
          <div key={f} className="text-center">
            <div className="border-t border-[var(--linea-fuerte)] pt-1.5">
              <p className="text-[10.5px] text-[var(--tinta-tenue)] whitespace-pre-line leading-tight">{f}</p>
            </div>
          </div>
        ))}
      </div>

      <img
        src={PIE_MARCA}
        alt=""
        className="w-full mt-10 opacity-90"
        style={{ maxWidth: 460, marginInline: "auto" }}
      />
    </article>
  );
}

/* ── Impresión ──────────────────────────────────────────────── */

function escapar(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function htmlDocumento(
  plantilla: Plantilla,
  valores: Record<string, string>,
  ahora: number,
  id?: string,
) {
  const clausulas = plantilla.cuerpo
    .filter((c) => campoVisible(c, valores))
    .map((c) => {
      const cuerpo = escapar(textoPlano(c.texto, valores, ahora));
      if (c.bloque) return `<p class="apartado">${escapar(c.titulo ?? "")}</p><p>${cuerpo}</p>`;
      return `<p>${c.titulo ? `<b>${escapar(c.titulo)}.</b> ` : ""}${cuerpo}</p>`;
    })
    .join("");

  const obs = (valores.observaciones ?? "").trim();
  const firmas = plantilla.firmas ?? FIRMAS_POR_DEFECTO;
  const pie = `${location.origin}${PIE_MARCA}`;

  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>${escapar(id ? `${id} — ${plantilla.nombre}` : plantilla.nombre)}</title>
<style>
  @page { size: A4; margin: 20mm 20mm 14mm; }
  body { font-family: Georgia, 'Times New Roman', serif; font-size: 11pt; line-height: 1.65; color: #1a1917; margin: 0; }
  header { display: flex; justify-content: space-between; align-items: flex-start;
           border-bottom: 1px solid #cdc8bc; padding-bottom: 8px; font-family: Arial, sans-serif; font-size: 9pt; }
  .marca { font-weight: 700; letter-spacing: .1em; }
  h1 { font-size: 13pt; text-align: center; text-transform: uppercase; letter-spacing: .06em; margin: 24px 0 16px; }
  p { text-align: justify; margin: 0 0 10px; }
  .apartado { font-weight: 700; letter-spacing: .06em; border-bottom: 1px solid #cdc8bc;
              padding-bottom: 2px; margin: 16px 0 6px; text-align: left; }
  .firmas { display: flex; flex-wrap: wrap; gap: 32px 40px; margin-top: 52px; }
  .firmas div { flex: 1 1 40%; border-top: 1px solid #999; padding-top: 5px; text-align: center;
                font-family: Arial, sans-serif; font-size: 8.5pt; color: #555; white-space: pre-line; line-height: 1.35; }
  .pie { display: block; width: 100%; max-width: 440px; margin: 36px auto 0; }
</style></head><body>
<header><span class="marca">RE/MAX &nbsp;Advance</span><span>${escapar(id ? `${id} · ` : "")}${escapar(fechaLarga(ahora))}</span></header>
<h1>${escapar(plantilla.titulo ?? plantilla.nombre.split("—")[0].trim())}</h1>
${clausulas}
${obs ? `<p><b>OBSERVACIONES.</b> ${escapar(obs)}</p>` : ""}
<div class="firmas">${firmas.map((f) => `<div>${escapar(f)}</div>`).join("")}</div>
<img class="pie" src="${pie}" alt="">
</body></html>`;
}

/** Abre el diálogo del navegador. Desde ahí se imprime o se guarda como PDF. */
export function imprimirDocumento(html: string) {
  const marco = document.createElement("iframe");
  marco.setAttribute("aria-hidden", "true");
  Object.assign(marco.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
    opacity: "0",
  });
  document.body.appendChild(marco);
  const doc = marco.contentDocument;
  if (!doc) return;
  doc.open();
  doc.write(html);
  doc.close();
  const lanzar = () => {
    marco.contentWindow?.focus();
    marco.contentWindow?.print();
    setTimeout(() => marco.remove(), 1500);
  };
  if (doc.readyState === "complete") setTimeout(lanzar, 120);
  else marco.onload = lanzar;
}
