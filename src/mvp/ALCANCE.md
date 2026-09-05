# MVP — alcance acordado

Rama `mvp`. La versión anterior queda intacta en `src/App.tsx` y en la rama `main`;
para volver a ella alcanza con cambiar el import de `src/main.tsx`.

Dos paneles: **Asesor** (unos 84 accesos) y **Gerencia** (4 o 5). El asesor entra sólo a
generar documentos y a ver los que registró. Todo lo demás es de gerencia.

## 1. Documentos y vencimientos

- **No se gestiona stock de propiedades.** No hay cartera que cargar ni mantener: los datos
  del inmueble son variables que el asesor completa al generar la reserva. Lo único que se
  le pregunta antes es dónde está la propiedad (jurisdicción, operación, uso), para saber qué
  documentos ofrecerle. Sobre una propiedad de CABA no aparecen los papeles de provincia.
- Lo fijo del documento no se toca. Sólo se pregunta lo variable, y cada documento tiene su
  propio juego de preguntas (`src/mvp/plantillas.ts`).
- Todos los documentos llevan un campo de **observaciones** de texto libre, que se imprime
  al pie.
- Botones al terminar: imprimir o guardar PDF, enviar a recepción, enviar por correo y
  **Registrar**. Registrar es lo único que lo manda al panel de gerencia y arranca los plazos.
- **Los plazos corren desde la fecha de vigencia que declara el asesor**, que no siempre es
  el día en que carga el documento: si la reserva se firmó el sábado y se carga el lunes, la
  vigencia arranca el sábado. Gerencia ve las dos fechas cuando difieren.
- Los plazos salen de las respuestas, no están fijos por documento. La reserva de compra
  comercial de CABA vigila dos: la aceptación del vendedor (vigencia de la reserva) y la
  escritura. El refuerzo de seña tiene monto pero no vencimiento propio: el papel lo fija en
  cinco días hábiles de notificada la conformación, un hecho que todavía no tiene fecha cierta
  cuando se genera la reserva.
- Los plazos vigentes de un expediente son siempre los de la reserva, salvo que tenga una
  adenda: ahí manda la adenda. Una adenda nunca puede acortar un plazo — si la cuenta da una
  fecha anterior a la que ya estaba cargada, se conserva la que vence después. Todo movimiento
  de fecha queda en el historial, se haga por reserva, por adenda o por una corrección de
  gerencia; no se borra nada.
- **Una propiedad tiene una sola reserva vigente a la vez.** Dos reservas son de la misma
  propiedad cuando coinciden dirección y unidad. Si el asesor intenta tomar otra sobre una
  propiedad ocupada, se le avisa antes de registrar y se le explica qué hacer.
- La **adenda** se entra siempre desde la reserva que extiende, en Mis documentos. Ahí queda
  atada: no se puede elegir otra propiedad ni otro documento. Se puede hacer antes de que el
  plazo venza y también después.
- El texto de la adenda es el del papel real de la oficina («ADENDA PRORROGA RESERVA DE
  COMPRA CABA»), transcripto tal cual. Al asesor se le pregunta qué plazo prorroga, qué día
  se firma y por cuántos días; opcionalmente también puede cambiar el precio pactado y anotar
  cualquier otra condición que varíe (forma de pago, etc.), que se agrega como cláusula extra.
  Todo lo demás — partes, DNI, domicilios electrónicos, inmueble, importes, fecha y
  vencimiento de la reserva original — lo hereda de la reserva. Los importes y los días salen
  escritos en letras, como pide el documento.
- Atención a la cuenta: el papel dice que la prórroga corre **desde la firma de la adenda**,
  no desde el vencimiento original. Así está implementado.
- Gerencia edita la vigencia del último documento cargado del expediente (la reserva o su
  última adenda) y elige cómo queda registrado: como adenda firmada, pidiéndole al agente por
  correo que la genere, o como simple constancia. Siempre queda en el historial con autor,
  motivo y la fecha original.

## 2. Altas y bajas

- **Toda reserva o adenda que carga un asesor entra pendiente.** Le aparece a gerencia marcada
  como «Nueva» en Reservas (con badge en el menú lateral) y en el expediente. No cuenta para
  vencimientos ni para ninguna métrica hasta que gerencia le da el alta con un solo click.
  Cuando la carga gerencia directamente (por ejemplo, una adenda desde «Editar vigencia»),
  queda de alta al toque.
- Una adenda pendiente no mueve el plazo todavía: el expediente sigue mostrando la fecha
  vigente hasta que gerencia le da el alta, momento en el que recién se corre (con la regla de
  que nunca se acorta un plazo ya cargado).
- **Eliminar un expediente es una baja lógica.** No se borra nada: pasa a «Eliminadas», deja
  de contar para métricas y datos, y conserva historial completo. Gerencia lo puede eliminar
  directamente en cualquier momento. El asesor sólo puede *pedir* la baja (con motivo, desde
  Mis documentos); el expediente queda marcado «Baja pedida» y sigue activo hasta que gerencia
  la aprueba.

## 3. Facturación

- Carga manual cuando gerencia quiera y sobre el mes que quiera, con dos modos: **sumar** un
  monto a lo que ya está cargado (para ir agregando operación por operación) o **reemplazar**
  el total. Sólo se toca lo que se completa.
- El criterio de qué cargar lo pone gerencia: puede sumar lo reservado que sabe que se firma
  y descontar lo que ya se cayó.
- Ventana móvil de 12 meses. La proyección repite la cuenta a 3, 6, 9 y 12 meses suponiendo
  que no se cierra nada nuevo. Dos vistas: **lista** (un tramo por vez, ordenable) y
  **progresión** (una columna por tramo, con color, para ver cómo se degrada cada uno).
- Semáforo de alto rendimiento / sostiene / low performance. Los umbrales y la antigüedad
  mínima se editan en Configuración, no en la vista.
- Un agente con menos de 18 meses no computa; hay filtro para verlos aparte. Los que están
  por cumplirlos aparecen listados, para poder mirarlos antes de que la fecha llegue.

## 4. Avisos por correo

- Aviso previo al vencimiento: al asesor, con gerencia en copia oculta. Días configurables.
- Aviso de plazo vencido: a los dos, sin ocultar.
- Resumen semanal: sólo a gerencia.
- Último contacto con cada asesor: **sólo a gerencia**, antes y después de cumplirse el tope.
  El asesor no lo recibe.

## Detalles transversales

- Las tablas de Vencimientos, Reservas y Facturación ordenan por cualquier columna con un
  click en el nombre, y cada una tiene sus propios filtros.
- La vista de gerencia que lista los documentos registrados se llama **Reservas**.

## Documentos cargados hoy

Sólo hay dos: la **reserva de compra comercial de CABA** (texto real de la oficina, «OFERTA -
RESERVA DE COMPRA COMERCIAL») y su **adenda**. No hay más — ni otra reserva, ni autorización de
venta, ni locación. Si se elige PBA en el primer paso del generador, se avisa que todavía no
hay escritos cargados para esa jurisdicción; no se ofrece ningún documento de trabajo en su
lugar.

## Definiciones que faltan

- El texto de la reserva de PBA y el de cualquier otro documento (autorización de venta,
  locación, etc.). Hasta que no esté cargado el real, esa combinación no se ofrece.
- El papel de la adenda sólo habla de prorrogar «la Oferta/Reserva». El sistema deja elegir
  cuál de los plazos se prorroga y de ahí saca los números; confirmar si eso está bien o si
  la adenda siempre debe referirse al plazo de conformación.
- La redacción de cada pregunta. El criterio acordado es que no dejen margen de interpretación.
- Si el asesor puede editar un documento ya registrado o si siempre tiene que desestimarlo y
  generar uno nuevo. Hoy no se edita: se registra uno nuevo.
