/* ─────────────────────────────────────────────────────────────
   Números en letras. Los documentos escriben los importes y los
   plazos con palabras y después repiten la cifra entre paréntesis,
   así que hace falta convertir.
   ───────────────────────────────────────────────────────────── */

const UNIDADES = [
  "cero",
  "uno",
  "dos",
  "tres",
  "cuatro",
  "cinco",
  "seis",
  "siete",
  "ocho",
  "nueve",
  "diez",
  "once",
  "doce",
  "trece",
  "catorce",
  "quince",
  "dieciséis",
  "diecisiete",
  "dieciocho",
  "diecinueve",
  "veinte",
  "veintiuno",
  "veintidós",
  "veintitrés",
  "veinticuatro",
  "veinticinco",
  "veintiséis",
  "veintisiete",
  "veintiocho",
  "veintinueve",
];

const DECENAS = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];

const CENTENAS = [
  "",
  "ciento",
  "doscientos",
  "trescientos",
  "cuatrocientos",
  "quinientos",
  "seiscientos",
  "setecientos",
  "ochocientos",
  "novecientos",
];

function menorAMil(n: number): string {
  if (n < 30) return UNIDADES[n];
  if (n < 100) {
    const d = Math.floor(n / 10);
    const u = n % 10;
    return DECENAS[d] + (u ? ` y ${UNIDADES[u]}` : "");
  }
  if (n === 100) return "cien";
  const c = Math.floor(n / 100);
  const r = n % 100;
  return CENTENAS[c] + (r ? ` ${menorAMil(r)}` : "");
}

/** «uno» se apocopa cuando multiplica: veintiún mil, treinta y un millones. */
function apocopar(s: string) {
  return s.replace(/uno$/, "ún");
}

export function enLetras(valor: number | string): string {
  const n = Math.floor(Number(valor));
  if (!Number.isFinite(n) || n < 0) return "";
  if (n === 0) return "cero";
  if (n < 1000) return menorAMil(n);

  if (n < 1_000_000) {
    const miles = Math.floor(n / 1000);
    const resto = n % 1000;
    const cabeza = miles === 1 ? "mil" : `${apocopar(menorAMil(miles))} mil`;
    return resto ? `${cabeza} ${menorAMil(resto)}` : cabeza;
  }

  const millones = Math.floor(n / 1_000_000);
  const resto = n % 1_000_000;
  const cabeza = millones === 1 ? "un millón" : `${apocopar(enLetras(millones))} millones`;
  return resto ? `${cabeza} ${enLetras(resto)}` : cabeza;
}

const MESES_LARGOS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export function mesLargo(ts: number) {
  return MESES_LARGOS[new Date(ts).getMonth()];
}
