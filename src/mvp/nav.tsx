import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Modo = "asesor" | "gerencia";
export type VistaAsesor = "generar" | "registros";
export type VistaGerencia = "vencimientos" | "expedientes" | "facturacion" | "automatizaciones";

interface Nav {
  modo: Modo;
  vistaAsesor: VistaAsesor;
  vistaGerencia: VistaGerencia;
  /** Expediente abierto en el cajón lateral. */
  expediente: string | null;
  /** Plantilla precargada al entrar al generador. */
  plantillaSugerida: string | null;
  irModo: (m: Modo) => void;
  irAsesor: (v: VistaAsesor) => void;
  irGerencia: (v: VistaGerencia) => void;
  abrirExpediente: (id: string | null) => void;
  generarCon: (plantillaId: string) => void;
  limpiarSugerida: () => void;
}

const Ctx = createContext<Nav | null>(null);

export function NavProveedor({ children }: { children: ReactNode }) {
  const [modo, setModo] = useState<Modo>("gerencia");
  const [vistaAsesor, setVistaAsesor] = useState<VistaAsesor>("generar");
  const [vistaGerencia, setVistaGerencia] = useState<VistaGerencia>("vencimientos");
  const [expediente, setExpediente] = useState<string | null>(null);
  const [plantillaSugerida, setSugerida] = useState<string | null>(null);

  const v = useMemo<Nav>(
    () => ({
      modo,
      vistaAsesor,
      vistaGerencia,
      expediente,
      plantillaSugerida,
      irModo: (m) => {
        setModo(m);
        setExpediente(null);
      },
      irAsesor: (x) => {
        setVistaAsesor(x);
        setModo("asesor");
        setExpediente(null);
      },
      irGerencia: (x) => {
        setVistaGerencia(x);
        setModo("gerencia");
      },
      abrirExpediente: setExpediente,
      generarCon: (id) => {
        setSugerida(id);
        setVistaAsesor("generar");
        setModo("asesor");
        setExpediente(null);
      },
      limpiarSugerida: () => setSugerida(null),
    }),
    [modo, vistaAsesor, vistaGerencia, expediente, plantillaSugerida],
  );

  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}

export function useNav() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useNav fuera del NavProveedor");
  return c;
}
