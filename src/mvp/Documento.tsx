import { campoVisible, fechaLarga, resolver, textoPlano, type Plantilla } from "./plantillas";
import { cn } from "../lib/format";

/* ─────────────────────────────────────────────────────────────
   La hoja. Lo que el asesor ve antes de imprimir y lo que
   gerencia abre desde el expediente. Texto fijo en tinta media,
   variables completadas resaltadas apenas.
   ───────────────────────────────────────────────────────────── */

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
          <span className="text-[11px] text-[var(--tinta-tenue)]">Devoto</span>
        </div>
        <div className="text-right">
          {id && <p className="num text-[10.5px] text-[var(--tinta-tenue)]">{id}</p>}
          <p className="num text-[10.5px] text-[var(--tinta-tenue)]">{fechaLarga(ahora)}</p>
        </div>
      </header>

      <h1 className="text-[15px] font-semibold text-[var(--tinta)] uppercase tracking-[0.06em] text-center mt-6 mb-5">
        {plantilla.nombre.split("—")[0].trim()}
      </h1>

      <div className="space-y-3.5" style={{ textAlign: "justify" }}>
        {clausulas.map((c, i) => (
          <p key={i}>
            {c.titulo && <span className="font-semibold text-[var(--tinta)]">{c.titulo}. </span>}
            {resolver(c.texto, valores, ahora).map((t, j) =>
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
            )}
          </p>
        ))}

        {obs && (
          <p className="pt-1">
            <span className="font-semibold text-[var(--tinta)]">OBSERVACIONES. </span>
            <span className="text-[var(--tinta)]">{obs}</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-8 mt-12 pt-2">
        {["Firma del oferente", "Firma del martillero"].map((r) => (
          <div key={r} className="text-center">
            <div className="border-t border-[var(--linea-fuerte)] pt-1.5">
              <p className="text-[10.5px] text-[var(--tinta-tenue)]">{r}</p>
            </div>
          </div>
        ))}
      </div>
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
    .map(
      (c) =>
        `<p>${c.titulo ? `<b>${escapar(c.titulo)}.</b> ` : ""}${escapar(textoPlano(c.texto, valores, ahora))}</p>`,
    )
    .join("");
  const obs = (valores.observaciones ?? "").trim();

  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>${escapar(id ? `${id} — ${plantilla.nombre}` : plantilla.nombre)}</title>
<style>
  @page { size: A4; margin: 22mm 20mm; }
  body { font-family: Georgia, 'Times New Roman', serif; font-size: 11.5pt; line-height: 1.7; color: #1a1917; margin: 0; }
  header { display: flex; justify-content: space-between; align-items: flex-start;
           border-bottom: 1px solid #cdc8bc; padding-bottom: 8px; font-family: Arial, sans-serif; font-size: 9pt; }
  .marca { font-weight: 700; letter-spacing: .1em; }
  h1 { font-size: 13pt; text-align: center; text-transform: uppercase; letter-spacing: .06em; margin: 26px 0 18px; }
  p { text-align: justify; margin: 0 0 11px; }
  .firmas { display: flex; gap: 40px; margin-top: 56px; }
  .firmas div { flex: 1; border-top: 1px solid #999; padding-top: 5px; text-align: center;
                font-family: Arial, sans-serif; font-size: 8.5pt; color: #666; }
</style></head><body>
<header><span class="marca">RE/MAX &nbsp;Devoto</span><span>${escapar(id ? `${id} · ` : "")}${escapar(fechaLarga(ahora))}</span></header>
<h1>${escapar(plantilla.nombre.split("—")[0].trim())}</h1>
${clausulas}
${obs ? `<p><b>OBSERVACIONES.</b> ${escapar(obs)}</p>` : ""}
<div class="firmas"><div>Firma del oferente</div><div>Firma del martillero</div></div>
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
  if (doc.readyState === "complete") setTimeout(lanzar, 60);
  else marco.onload = lanzar;
}
