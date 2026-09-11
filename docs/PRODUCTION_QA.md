# Validación de publicación — 10–11/09/2026

## Arquitectura y publicación

- Empresas conserva su Worker con assets estáticos: `primoffice-empresas.primoffice.workers.dev`.
- Formulario conectado a `https://setupoficina.com.ar/api/corporate-leads`, endpoint independiente en el proyecto Pages de SetupOficina.
- No hay secretos Odoo en Empresas. El backend reutiliza `ODOO_ENABLED`, `ODOO_URL`, `ODOO_DB`, `ODOO_USERNAME` y `ODOO_API_KEY` existentes en SetupOficina.
- WhatsApp conserva el texto, número, URL y parámetros de apertura originales. La solicitud al CRM se inicia sin esperar la respuesta antes de `window.open`.

## QA público en el hostname actual

- HTTPS y HTTP 200.
- HTML publicado idéntico al archivo local; 29 assets referenciados responden 200 y coinciden byte a byte con los archivos locales.
- Desktop 1440 y mobile 390: inspección visual, formulario legible, sin desborde horizontal ni imágenes rotas.
- Navegación a contacto y menú mobile verificados (abre, navega y cierra).
- Preflight del backend: 204, CORS permite el hostname de Empresas.
- Envío desktop con email: lead 75. Envío mobile con teléfono: lead 76. Ambos verificados en Odoo con todos los datos, empresa y etiqueta exclusiva `Empresas - Landing`.
- Prueba directa del endpoint: lead 74. Los tres leads de prueba se archivaron y se verificó `active=false`.
- WhatsApp abrió en pestaña nueva con el mensaje completo en desktop y mobile. No se enviaron mensajes desde WhatsApp.
- Sin errores de consola en el flujo válido.
- Rechazo controlado del contacto por el backend: WhatsApp igualmente abrió y el formulario informó que el registro había fallado, sin crear un lead adicional.
- `npm test`: 5 pruebas del formulario aprobadas; `npm run deploy:check`: correcto.
- HTML comercial, CSS, imágenes, soluciones, portfolio, logos, proceso y FAQ sin modificaciones; el único cambio HTML es la nota de tratamiento de datos.

## Bloqueo del dominio definitivo

`empresas.primoffice.com.ar` todavía no resuelve. `primoffice.com.ar` tiene DNS autoritativo en AWS y no aparece como zona en las cuentas Cloudflare verificadas. No se modificó DNS ni se asoció un dominio distinto.

Acción de Santiago: coordinar con el administrador DNS actual la habilitación de `primoffice.com.ar` como zona activa en la cuenta Cloudflare de PrimOffice, preservando los registros existentes. Cuando esté disponible se podrá asociar `empresas.primoffice.com.ar` mediante Custom Domain del Worker.

Se conserva `noindex,nofollow` y no se agrega canonical. Retirar esa directiva y agregar `https://empresas.primoffice.com.ar/` como canonical solamente después de validar HTTPS, assets, navegación y formulario en el dominio definitivo.
