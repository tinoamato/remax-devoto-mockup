import { useEffect, useState } from "react";

export type Tema = "claro" | "oscuro";

const CLAVE = "remax-devoto:tema";

function preferenciaSistema(): Tema {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "oscuro" : "claro";
}

function leerGuardado(): Tema | null {
  try {
    const v = localStorage.getItem(CLAVE);
    return v === "claro" || v === "oscuro" ? v : null;
  } catch {
    return null;
  }
}

function aplicar(t: Tema | null) {
  const raiz = document.documentElement;
  if (t) raiz.setAttribute("data-theme", t === "oscuro" ? "dark" : "light");
  else raiz.removeAttribute("data-theme");
}

/** Modo claro/oscuro: sigue el sistema hasta que el usuario elige uno manualmente. */
export function useTema() {
  const [manual, setManual] = useState<Tema | null>(() => leerGuardado());
  const [sistema, setSistema] = useState<Tema>(() => preferenciaSistema());

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const cambiar = () => setSistema(mq.matches ? "oscuro" : "claro");
    mq.addEventListener("change", cambiar);
    return () => mq.removeEventListener("change", cambiar);
  }, []);

  useEffect(() => {
    aplicar(manual);
    try {
      if (manual) localStorage.setItem(CLAVE, manual);
      else localStorage.removeItem(CLAVE);
    } catch {
      /* localStorage no disponible: el tema sigue funcionando, solo no persiste */
    }
  }, [manual]);

  const activo = manual ?? sistema;
  const alternar = () => setManual(activo === "oscuro" ? "claro" : "oscuro");

  return { activo, alternar };
}
