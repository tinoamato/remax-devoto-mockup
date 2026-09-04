/* Set de íconos: trazo 1.5, grilla 24, sin relleno. Reemplaza todo emoji. */

const P: Record<string, string> = {
  agenda: "M8 2v3M16 2v3M3.5 9h17M4.5 5h15a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z",
  edificio: "M3 21h18M5 21V4a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v17M14 9h4a1 1 0 0 1 1 1v11M8 7h3M8 11h3M8 15h3M17 13h.01M17 17h.01",
  expediente: "M3 7.5V19a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1h-8.6a1 1 0 0 1-.8-.4L9.4 5.4a1 1 0 0 0-.8-.4H4a1 1 0 0 0-1 1v1.5Z",
  documento: "M14 3v4.5a1 1 0 0 0 1 1h4.5M14 3H6.5a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V8.5L14 3ZM9 12h6M9 16h4",
  persona: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20a7.5 7.5 0 0 1 15 0",
  equipo: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8",
  tablero: "M4 3h6v8H4zM14 3h6v5h-6zM14 12h6v9h-6zM4 15h6v6H4z",
  torre: "M12 21V9M12 9 5 4M12 9l7-5M6.5 13H3M21 13h-3.5M8 21h8M12 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  radar: "M12 3a9 9 0 1 0 9 9M12 7.5a4.5 4.5 0 1 0 4.5 4.5M12 12l7.5-7.5",
  buscar: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.4-4.4",
  campana: "M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9ZM10 18a2 2 0 0 0 4 0",
  tilde: "m4.5 12.5 5 5 10-11",
  cruz: "M6 6l12 12M18 6 6 18",
  reloj: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5.2l3.2 2",
  alerta: "M12 4.5 2.8 20h18.4L12 4.5ZM12 10v4.5M12 17.6h.01",
  chevIzq: "m14.5 5-7 7 7 7",
  chevDer: "m9.5 5 7 7-7 7",
  chevAbajo: "m5 9.5 7 7 7-7",
  chevArriba: "m5 14.5 7-7 7 7",
  mas: "M12 5v14M5 12h14",
  menos: "M5 12h14",
  subir: "M12 17V4M7 9l5-5 5 5M4 20h16",
  bajar: "M12 4v13M7 12l5 5 5-5M4 20h16",
  telefono: "M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A17.5 17.5 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5Z",
  correo: "M3.5 6h17a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-17a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1ZM3 7l9 6.5L21 7",
  mensaje: "M4 4h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4V5a1 1 0 0 1 1-1ZM8 9h8M8 12.5h5",
  flechaDer: "M4 12h15M13 6l6 6-6 6",
  flechaSalida: "M8 16 16 8M9.5 8H16v6.5",
  puntos: "M6 12h.01M12 12h.01M18 12h.01",
  filtro: "M3 5h18l-7 8v6l-4 2v-8L3 5Z",
  dinero: "M2.5 6.5h19a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-19a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  tendencia: "M3 17.5 9.5 11l4 4L21 7.5M21 7.5h-5M21 7.5v5",
  llave: "M15.5 3a5.5 5.5 0 1 1-4.6 8.5L3.5 19v2h3v-2h2v-2h2l1.4-1.4A5.5 5.5 0 0 1 15.5 3ZM17 8h.01",
  pin: "M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  refrescar: "M20 12a8 8 0 1 1-2.6-5.9M20 3v5h-5",
  deshacer: "M4 10h10a5 5 0 0 1 0 10h-4M4 10l4-4M4 10l4 4",
  enviar: "m4 12 16-8-6.5 16-2.5-6-7-2Z",
  clip: "M20 11.5 12 19.5a5 5 0 0 1-7-7l8-8a3.5 3.5 0 0 1 5 5l-7.7 7.7a2 2 0 0 1-3-3l7-7",
  descargar: "M12 4v11M7.5 10.5 12 15l4.5-4.5M4 20h16",
  imprimir: "M7 8V3h10v5M7 18H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2M7 14h10v7H7z",
  rayo: "M13 2 4.5 13.5H11L10 22l8.5-11.5H12L13 2Z",
  diana: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM12 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
  ajustes: "M4 7h10M18 7h2M4 17h2M10 17h10M16 4.5v5M8 14.5v5",
  candado: "M7 10V7a5 5 0 0 1 10 0v3M5.5 10h13a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z",
  usuarioMas: "M10 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2.5 20a7.5 7.5 0 0 1 12-6M18 14v6M15 17h6",
  sol: "M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  planilla: "M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1ZM3 9.5h18M9 9.5V20M3 15h18",
  visita: "M3 20V9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z",
  balanza: "M12 3v18M7 21h10M12 6 5 9M12 6l7 3M5 9 2.5 15a2.5 2.5 0 0 0 5 0L5 9ZM19 9l-2.5 6a2.5 2.5 0 0 0 5 0L19 9Z",
  archivo: "M3 7h18v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7ZM2 3h20v4H2zM9.5 11h5",
  pulso: "M2 12h4l2.4-6.5 4.2 13L15 12h7",
  historial: "M3.5 12a8.5 8.5 0 1 0 2.6-6.1M3 4v4h4M12 7.5V12l3 1.8",
  regla: "M3 8.5h18a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1ZM7 8.5v3M11 8.5v4M15 8.5v3M19 8.5v4",
};

export type NombreIcono = keyof typeof P | string;

export function Icono({
  n,
  s = 16,
  className = "",
  grosor = 1.5,
}: {
  n: NombreIcono;
  s?: number;
  className?: string;
  grosor?: number;
}) {
  const d = P[n];
  if (!d) return null;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <path d={d} />
    </svg>
  );
}
