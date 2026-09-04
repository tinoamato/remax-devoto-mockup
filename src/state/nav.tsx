import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Modo = "asesor" | "gerencia";
export type VistaAsesor = "dia" | "cartera" | "consultas" | "docs" | "perfil";
export type VistaGerencia = "panel" | "torre" | "equipo" | "cartera" | "alertas" | "cadencia" | "facturacion";

export interface Nav {
  modo: Modo;
  vistaAsesor: VistaAsesor;
  vistaGerencia: VistaGerencia;
  op: string | null;
  prop: string | null;
  asesor: string | null;
  paleta: boolean;
  irModo: (m: Modo) => void;
  irAsesor: (v: VistaAsesor) => void;
  irGerencia: (v: VistaGerencia) => void;
  abrirOp: (id: string | null) => void;
  abrirProp: (id: string | null) => void;
  abrirAsesor: (id: string | null) => void;
  setPaleta: (v: boolean) => void;
}

const Ctx = createContext<Nav | null>(null);

export function NavProveedor({ children }: { children: ReactNode }) {
  const [modo, setModo] = useState<Modo>("gerencia");
  const [vistaAsesor, setVistaAsesor] = useState<VistaAsesor>("dia");
  const [vistaGerencia, setVistaGerencia] = useState<VistaGerencia>("panel");
  const [op, setOp] = useState<string | null>(null);
  const [prop, setProp] = useState<string | null>(null);
  const [asesor, setAsesor] = useState<string | null>(null);
  const [paleta, setPaleta] = useState(false);

  const v = useMemo<Nav>(
    () => ({
      modo,
      vistaAsesor,
      vistaGerencia,
      op,
      prop,
      asesor,
      paleta,
      irModo: (m) => {
        setModo(m);
        setOp(null);
        setProp(null);
        setAsesor(null);
      },
      irAsesor: (x) => {
        setVistaAsesor(x);
        setModo("asesor");
      },
      irGerencia: (x) => {
        setVistaGerencia(x);
        setModo("gerencia");
      },
      abrirOp: (id) => {
        setOp(id);
        if (id) setProp(null);
      },
      abrirProp: (id) => {
        setProp(id);
        if (id) setOp(null);
      },
      abrirAsesor: setAsesor,
      setPaleta,
    }),
    [modo, vistaAsesor, vistaGerencia, op, prop, asesor, paleta],
  );

  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}

export function useNav() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useNav fuera del NavProveedor");
  return c;
}
