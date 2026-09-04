# MVP — alcance acordado

Rama `mvp`. La versión anterior queda intacta en `src/App.tsx` y en la rama `main`;
para volver a ella alcanza con cambiar el import de `src/main.tsx`.

Dos paneles: **Asesor** (unos 84 accesos) y **Gerencia** (4 o 5). El asesor entra sólo a
generar documentos y a ver los que registró. Todo lo demás es de gerencia.

## 1. Documentos y vencimientos

- El asesor elige propiedad, elige documento y contesta preguntas. La lista de documentos
  se filtra por jurisdicción, tipo de operación y uso, así que sobre una propiedad de CABA
  no aparecen los papeles de provincia.
- Lo fijo del documento no se toca. Sólo se pregunta lo variable, y cada documento tiene su
  propio juego de preguntas (`src/mvp/plantillas.ts`).
- Todos los documentos llevan un campo de **observaciones** de texto libre, que se imprime
  al pie.
- Botones al terminar: imprimir o guardar PDF, enviar a recepción, enviar por correo y
  **Registrar**. Registrar es lo único que lo manda al panel de gerencia y arranca los plazos.
- Los plazos salen de las respuestas, no están fijos por documento. La reserva de compra
  residencial de CABA tiene tres como mínimo (conformación, refuerzo, escritura) y suma un
  cuarto si la operación es con crédito hipotecario (respuesta del banco).
- Gerencia ve todo ordenado por vencimiento. Desde el expediente puede registrar una adenda
  (corre la fecha) o corregir la fecha a mano. Las dos cosas quedan en el historial con autor,
  fecha y motivo, y se guarda la fecha original.
- La adenda se cuelga de una reserva vigente de esa propiedad; no crea expediente nuevo.

## 2. Facturación

- Carga manual, una vez por mes, agente por agente. El criterio de qué cargar lo pone
  gerencia: puede sumar lo reservado que sabe que se firma y descontar lo que ya se cayó.
- Ventana móvil de 12 meses. La proyección repite la cuenta a 3, 6, 9 y 12 meses suponiendo
  que no se cierra nada nuevo, y se puede mirar cada tramo por separado.
- Semáforo de alto rendimiento / sostiene / low performance, con umbrales editables.
- Un agente con menos de 18 meses no computa. Los que están por cumplirlos aparecen aparte,
  para poder mirarlos antes de que la fecha llegue.

## 3. Avisos por correo

- Aviso previo al vencimiento: al asesor, con gerencia en copia oculta. Días configurables.
- Aviso de plazo vencido: a los dos, sin ocultar.
- Resumen semanal: sólo a gerencia.
- Último contacto con cada asesor: **sólo a gerencia**, antes y después de cumplirse el tope.
  El asesor no lo recibe.

## Definiciones que faltan

- El texto exacto de la reserva de compra residencial de CABA y de la adenda. Lo que está
  cargado es una redacción de trabajo para ver el flujo; hay que reemplazarla por la real.
- La redacción de cada pregunta. El criterio acordado es que no dejen margen de interpretación.
- Los otros documentos: son unos 40 entre CABA y PBA. Están cargados cinco como muestra.
- De dónde salen las propiedades: carga manual del agente, importación de una base o nada
  (el generador ya permite escribir los datos a mano si la propiedad no está cargada).
- Si el asesor puede editar un documento ya registrado o si siempre tiene que desestimarlo y
  generar uno nuevo. Hoy no se edita: se registra uno nuevo.
