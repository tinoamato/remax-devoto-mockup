import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Modo = "asesor" | "gerencia";
export type VistaAsesor = "generar" | "registros";
export type VistaGerencia =
  | "vencimientos"
  | "reservas"
  | "facturacion"
  | "automatizaciones"
  | "contacto"
  | "equipo";

/** Cuando se entra a hacer una adenda, el generador arranca atado a una reserva. */
export interface Encargo {
  plantillaId: string;
  registroId: string;
}

interface Nav {
  modo: Modo;
  vistaAsesor: VistaAsesor;
  vistaGerencia: VistaGerencia;
  /** Expediente abierto en el cajón lateral. */
  expediente: string | null;
  encargo: Encargo | null;
  irModo: (m: Modo) => void;
  irAsesor: (v: VistaAsesor) => void;
  irGerencia: (v: VistaGerencia) => void;
  abrirExpediente: (id: string | null) => void;
  /** Manda al generador con la adenda ya elegida y la reserva fijada. */
  generarAdenda: (plantillaId: string, registroId: string) => void;
  limpiarEncargo: () => void;
}

const Ctx = createContext<Nav | null>(null);

export function NavProveedor({ children }: { children: ReactNode }) {
  const [modo, setModo] = useState<Modo>("gerencia");
  const [vistaAsesor, setVistaAsesor] = useState<VistaAsesor>("generar");
  const [vistaGerencia, setVistaGerencia] = useState<VistaGerencia>("vencimientos");
  const [expediente, setExpediente] = useState<string | null>(null);
  const [encargo, setEncargo] = useState<Encargo | null>(null);

  const v = useMemo<Nav>(
    () => ({
      modo,
      vistaAsesor,
      vistaGerencia,
      expediente,
      encargo,
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
      generarAdenda: (plantillaId, registroId) => {
        setEncargo({ plantillaId, registroId });
        setVistaAsesor("generar");
        setModo("asesor");
        setExpediente(null);
      },
      limpiarEncargo: () => setEncargo(null),
    }),
    [modo, vistaAsesor, vistaGerencia, expediente, encargo],
  );

  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}

export function useNav() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useNav fuera del NavProveedor");
  return c;
}
