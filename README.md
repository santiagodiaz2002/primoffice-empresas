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

El formulario inicia un POST a `https://setupoficina.com.ar/api/corporate-leads` y abre WhatsApp inmediatamente con el mensaje aprobado. El backend registra la consulta en Odoo; un fallo de registro no impide abrir WhatsApp y se informa en el estado del formulario. El email configurado se ofrece como canal alternativo mediante `mailto:`.

Aunque la configuración funcional usa `preview: false`, `site/index.html` conserva `noindex,nofollow` mientras la landing se revisa en el hostname temporal.

## Cloudflare: configuración verificada

La landing está desplegada como Worker con assets estáticos, con el nombre `primoffice-empresas`, en la cuenta de PrimOffice. No es un proyecto Pages. `wrangler.jsonc` conserva el hostname temporal y publica únicamente `site/`.

- Validar antes de publicar: `npm test` y `npm run deploy:check`.
- Revisar el diff completo antes de cada publicación.
- Publicar en la cuenta verificada: `npm run deploy -- --profile primoffice`.
- Hostname actual: https://primoffice-empresas.primoffice.workers.dev/

## CRM corporativo

El endpoint independiente está en `setupoficina-landing/functions/api/corporate-leads.js`, dentro del backend Pages que ya contiene los secretos Odoo. No usa ni modifica `/api/leads`, el test, los niveles Starter/Pro/Epic ni Tiendanube.

Variables existentes requeridas en la producción de SetupOficina: `ODOO_ENABLED`, `ODOO_URL`, `ODOO_DB`, `ODOO_USERNAME`, `ODOO_API_KEY`. Empresas no requiere secretos Odoo.

El backend valida los siete campos, consulta `crm.lead.fields_get` y crea una oportunidad `{Empresa} — {Tipo de proyecto}` con la etiqueta exclusiva `Empresas - Landing`. La empresa también queda en la descripción y en `partner_name` cuando el modelo real lo admite. No se reintenta automáticamente una creación que falla, para evitar duplicados ante una respuesta incierta.

## Subdominio definitivo: pendiente

Destino: https://empresas.primoffice.com.ar/

El 10/09/2026 la zona `primoffice.com.ar` no estaba disponible en las cuentas Cloudflare autenticadas y sus DNS autoritativos estaban en AWS. No se modificaron registros ni nameservers.

Se debe habilitar la zona para asociar un **Custom Domain del Worker** en la cuenta de PrimOffice. No crear un CNAME manual hacia workers.dev. La gestión de la zona queda fuera de esta publicación.

Solo después de asociar el dominio y verificar HTTPS, HTTP 200, assets, navegación y formulario en desktop/mobile, retirar `noindex,nofollow` de `site/index.html` y agregar `<link rel="canonical" href="https://empresas.primoffice.com.ar/">`. Mientras tanto, conservar noindex.

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
