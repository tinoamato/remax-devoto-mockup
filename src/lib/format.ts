export function cn(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

export function usd(n: number) {
  return `USD ${n.toLocaleString("es-AR")}`;
}

export function pesos(n: number) {
  return `$ ${n.toLocaleString("es-AR")}`;
}

/** "2 d 04 h" · "18 h 40 m" · "-1 d 22 h" */
export function plazo(vence: number, ahora: number) {
  const ms = vence - ahora;
  const neg = ms < 0;
  const abs = Math.abs(ms);
  const d = Math.floor(abs / 86_400_000);
  const hs = Math.floor((abs % 86_400_000) / 3_600_000);
  const m = Math.floor((abs % 3_600_000) / 60_000);
  const s = d > 0 ? `${d} d ${String(hs).padStart(2, "0")} h` : `${hs} h ${String(m).padStart(2, "0")} m`;
  return (neg ? "−" : "") + s;
}

/** "hace 12 min" · "hace 3 h" · "hace 4 d" */
export function hace(ts: number, ahora: number) {
  const m = Math.round((ahora - ts) / 60_000);
  if (m < 1) return "recién";
  if (m < 60) return `hace ${m} min`;
  const hs = Math.round(m / 60);
  if (hs < 24) return `hace ${hs} h`;
  const d = Math.round(hs / 24);
  return `hace ${d} d`;
}

export function fechaCorta(ts: number) {
  return new Date(ts).toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}

export function fechaHora(ts: number) {
  return new Date(ts).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function iniciales(nombre: string) {
  return nombre
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
