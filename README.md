# PrimOffice Empresas — landing corporativa

Proyecto preparado a partir del ZIP `Subdominio.zip` y de las notas de la reunión con Martín.

## Objetivo

Landing B2B para un subdominio de PrimOffice, orientada a:

- regalos corporativos;
- kits de bienvenida;
- regalos de fin de año;
- productos personalizados con branding de empresa;
- proyectos especiales;
- captación de consultas mediante formulario, WhatsApp y email.

## Estructura del repo

```text
primoffice-empresas/
├─ site/                         # assets estáticos del Worker de Cloudflare
│  ├─ index.html
│  ├─ _headers
│  └─ assets/
│     ├─ css/styles.css
│     ├─ js/config.js
│     ├─ js/main.js
│     └─ images/                # imágenes optimizadas para web
├─ docs/
│  ├─ CONTENT_STATUS.md
│  ├─ SOURCE_MANIFEST.md
│  └─ primofficelandingcorporativa-original.html
├─ .editorconfig
├─ .gitignore
└─ README.md
```

## Vista local

La landing no necesita build. Para servirla con la misma plataforma de producción: `npm ci` y `npm run dev`. Las pruebas del formulario se ejecutan con `npm test`.

## Configuración comercial

Editar `site/assets/js/config.js`:

```js
window.PRIMOFFICE_SITE_CONFIG = {
  preview: false,
  whatsappNumber: "5491139149688",
  corporateEmail: "info@primoffice.com.ar"
};
```

El formulario envía email y WhatsApp separados, cantidad obligatoria y atribución de sesión a `https://setupoficina.com.ar/api/corporate-leads`. Espera una respuesta HTTP exitosa con `{ok: true, id}` antes de emitir `generate_lead` y mostrar «Recibimos tu consulta». WhatsApp queda como acción opcional posterior con el mensaje preparado. Los fallos conservan los datos y permiten reintentar; no hay reintentos automáticos.

El mensaje personalizado de WhatsApp se conserva en memoria y se abre únicamente con el clic del usuario. El enlace visible mantiene un mensaje genérico, sin datos del formulario, para evitar que la medición automática de enlaces capture PII en `link_url`. Los eventos manuales solo incluyen el nombre del evento y, para errores, `error_type`.

La configuración funcional usa `preview: false`; el HTML actual es indexable y conserva el canonical `https://empresas.primoffice.com.ar/`.

## Cloudflare: configuración verificada

La landing está desplegada como Worker con assets estáticos, con el nombre `primoffice-empresas`, en la cuenta de PrimOffice. No es un proyecto Pages. `wrangler.jsonc` conserva el hostname temporal y publica únicamente `site/`.

- Validar antes de publicar: `npm test` y `npm run deploy:check`.
- Revisar el diff completo antes de cada publicación.
- Publicar en la cuenta verificada: `npm run deploy -- --profile primoffice`.
- Hostname actual: https://primoffice-empresas.primoffice.workers.dev/

## CRM corporativo

El endpoint independiente está en `setupoficina-landing/functions/api/corporate-leads.js`, dentro del backend Pages que ya contiene los secretos Odoo. No usa ni modifica `/api/leads`, el test, los niveles Starter/Pro/Epic ni Tiendanube.

Variables existentes requeridas en la producción de SetupOficina: `ODOO_ENABLED`, `ODOO_URL`, `ODOO_DB`, `ODOO_USERNAME`, `ODOO_API_KEY`. Empresas no requiere secretos Odoo.

La implementación vigente está en el worktree hermano `setupoficina-corporate-leads`, branch `codex/corporate-leads`, del mismo repositorio `setupoficina-landing`. El backend valida los ocho campos comerciales, consulta `crm.lead.fields_get` y crea una oportunidad `{Empresa} — {Tipo de proyecto}` con la etiqueta exclusiva `Empresas - Landing`. Guarda email en `email_from`, WhatsApp en `phone` y el registro estructurado completo en el campo existente `description`, después del texto comercial, delimitado por `--- PRIMOFFICE CORPORATE DATA v1 ---` y `--- END PRIMOFFICE CORPORATE DATA ---`. NO requiere migración Odoo ni custom field. Conserva click IDs, UTMs, landing/referrer iniciales, timestamp servidor, `status: "new"` y `estimated_value`, `quoted_value`, `final_sale_value` como `null`. Una segunda etapa podrá migrar el bloque a campos propios si se desea; no hay importación offline en esta entrega. No modifica la persistencia D1 de otros endpoints.

RIESGO PREEXISTENTE: odoo.setupoficina.com.ar actualmente solo expone HTTP públicamente; su remediación de infraestructura queda fuera de esta entrega.

## QA del flujo de campañas (local)

`npm test` cubre eventos con `gtag` simulado, atribución, validación, errores y envíos simultáneos. Para comprobar ambos repositorios en un navegador: `node tests/qa-server.mjs ../setupoficina-corporate-leads`, luego abrir `http://127.0.0.1:8787/`. Este harness ejecuta el endpoint real con XML-RPC/Odoo simulado en memoria. Sustituye únicamente el transporte de Analytics y del endpoint en la respuesta local, bloquea conexiones externas y evita navegar a WhatsApp/email. No se publica: el Worker sirve solo `site/`.

`GET /__qa/state` permite inspeccionar requests y registros locales, incluida la descripción con el bloque JSON; `POST /__qa/fail-next` simula un fallo de creación. Reiniciar el harness borra sus datos. No usar producción para estas pruebas. Publicar primero el backend compatible y luego el frontend en una etapa de publicación explícitamente autorizada, sin migración Odoo previa.

## Subdominio definitivo

Destino: https://empresas.primoffice.com.ar/

El canonical ya está presente en el código actual y permanece intacto. La preparación de campañas no cambia DNS, dominios ni configuración de hosting. La verificación de cambios publicados se hará después de revisar los diffs y autorizar una publicación.

Referencia: https://developers.cloudflare.com/workers/configuration/routing/custom-domains/

## Criterios aplicados en esta versión

- Se eliminaron del sitio público los testimonios inventados del borrador original.
- No se publicaron nombres técnicos de producto que Martín indicó que no corresponden.
- Se incorporaron las condiciones comerciales confirmadas para esta etapa desde el HTML corporativo original.
- Se usaron fotos reales recibidas en el ZIP.
- Las marcas mostradas en la galería/marquee se limitaron a marcas visibles en ese material.
- La sección de casos de éxito queda reservada hasta recibir casos reales de Martín.
- WhatsApp y email reales quedan centralizados en `config.js`.

Ver `docs/CONTENT_STATUS.md` antes de configurar el dominio definitivo.
