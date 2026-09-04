import { useMemo, useState, type ReactNode } from "react";
import { Icono } from "../lib/icons";
import { cn } from "../lib/format";

/* ─────────────────────────────────────────────────────────────
   Encabezados que ordenan. Un click ordena, otro invierte.
   ───────────────────────────────────────────────────────────── */

export type Direccion = "asc" | "desc";

export interface Orden<K extends string> {
  campo: K;
  dir: Direccion;
  alternar: (c: K) => void;
}

export function useOrden<K extends string>(campoInicial: K, dirInicial: Direccion = "asc"): Orden<K> {
  const [campo, setCampo] = useState<K>(campoInicial);
  const [dir, setDir] = useState<Direccion>(dirInicial);

  return useMemo(
    () => ({
      campo,
      dir,
      alternar: (c: K) => {
        if (c === campo) setDir((x) => (x === "asc" ? "desc" : "asc"));
        else {
          setCampo(c);
          setDir("asc");
        }
      },
    }),
    [campo, dir],
  );
}

/** Compara según el tipo del valor, dejando los vacíos siempre al final. */
export function comparar(a: unknown, b: unknown, dir: Direccion) {
  const signo = dir === "asc" ? 1 : -1;
  const vacio = (x: unknown) => x === null || x === undefined || x === "";
  if (vacio(a) && vacio(b)) return 0;
  if (vacio(a)) return 1;
  if (vacio(b)) return -1;
  if (typeof a === "number" && typeof b === "number") return (a - b) * signo;
  return String(a).localeCompare(String(b), "es") * signo;
}

/** Ordena una lista por la clave que devuelve `valor`. */
export function ordenar<T, K extends string>(lista: T[], orden: Orden<K>, valor: (x: T, campo: K) => unknown) {
  return [...lista].sort((a, b) => comparar(valor(a, orden.campo), valor(b, orden.campo), orden.dir));
}

export function ThOrden<K extends string>({
  campo,
  orden,
  ancho,
  alDer,
  children,
}: {
  campo: K;
  orden: Orden<K>;
  ancho?: number | string;
  alDer?: boolean;
  children: ReactNode;
}) {
  const activo = orden.campo === campo;
  return (
    <th
      scope="col"
      style={{ width: ancho }}
      aria-sort={activo ? (orden.dir === "asc" ? "ascending" : "descending") : "none"}
      className="p-0 border-b border-[var(--linea)] bg-[var(--papel-hundido)]/70"
    >
      <button
        type="button"
        onClick={() => orden.alternar(campo)}
        className={cn(
          "rotulo font-semibold w-full h-8 px-3 flex items-center gap-1 transition-colors",
          "hover:text-[var(--tinta)] hover:bg-[var(--papel-hundido)]",
          alDer && "justify-end",
          activo && "text-[var(--tinta)]",
        )}
      >
        {children}
        <Icono
          n={activo && orden.dir === "desc" ? "chevAbajo" : "chevArriba"}
          s={11}
          className={activo ? "text-[var(--sello)]" : "text-[var(--tinta-tenue)] opacity-30"}
        />
      </button>
    </th>
  );
}

/** Encabezado que no ordena por nada, para columnas de puro adorno. */
export function ThFijo({
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
