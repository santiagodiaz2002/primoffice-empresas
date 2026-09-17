# Preparación de campañas — QA local 2026-09-17

## Preflight, antes de editar

Frontend: `C:/Users/Santi/Documents/GitHub/primoffice-empresas`.
Branch `main`, HEAD `8462b102dc5d835bf83d756ac1cad97ba5b1a3dd`, upstream `origin/main`, ahead/behind `0/0`.
`git status --short`, `git diff` y `git diff --cached`: vacíos.

Backend: `C:/Users/Santi/Documents/GitHub/setupoficina-corporate-leads`.
Branch `codex/corporate-leads`, HEAD `644313ab21e7e6c29ff6f5a7bfd6572d38334ab3`, sin upstream; ahead/behind no aplicable.
`git status --short`, `git diff` y `git diff --cached`: vacíos.

La búsqueda de `corporate-leads` en `C:/Users/Santi/Documents/GitHub` encontró una única implementación:
`functions/api/corporate-leads.js`. `_routes.json` incluye `/api/*`, `.wrangler/cache/pages.json`
identifica `setupoficina-landing` y `docs/CORPORATE_LEADS.md` documenta el endpoint y su verificación publicada.
`.git` y `git worktree list` confirman que es un worktree de `setupoficina-landing`.
Persistencia corporativa original: creación directa de `crm.lead` por XML-RPC/Odoo; no D1.

## Alcance y preservación

Cambios puntuales de contenido, estilos del hero/componentes nuevos, formulario, atribución y eventos.
Sin cambios en assets, configuración de contactos, hosting, canonical, carrusel o lightbox.
Comparación contra el preflight: imágenes y dimensiones, ocho proyectos en su orden, logos,
proceso, diferenciales, nueve FAQ y textos/nombres de los dos testimonios preservados.

Durante la tarea aparecieron dos ediciones concurrentes ajenas en los cargos de las reseñas:
Catalina: `Ejecutiva de cuentas en Global Events Organization`;
Micaela: `Cliente de Íntegra`. Se conservaron. No fueron introducidas por la preparación Ads.

## Pruebas

- Frontend: `npm test`, 9/9.
- Backend específico y defensivo: `node --test tests/corporate-leads.test.mjs tests/leads-defensive.test.mjs`, 23/23.
- Backend completo: 130/133. Se mantienen tres fallos ajenos ya documentados en el repo:
  Retry-After/content-type/tamaño (`tiendanube-client.test.mjs`) y dos pruebas de navegación/resultados
  del carrito (`tiendanube-nubesdk.test.mjs`). Estos módulos no fueron modificados.
- JS y CSS parseados con esbuild ya instalado; backend compilado como bundle ESM para navegador/Workers.
- HTML: anidamiento de etiquetas, unicidad de IDs/H1/tag, referencias locales y anchors comprobados.
- `git diff --check` pasa en ambos repositorios; no eliminaciones ni reformat global ni secretos nuevos.

## Flujo funcional en Chrome

Harness: `node tests/qa-server.mjs ../setupoficina-corporate-leads`.
Sirve la landing local y ejecuta el endpoint real contra XML-RPC/Odoo simulado en memoria.
Analytics se sustituye en la respuesta local; una CSP impide conexiones a servicios de leads/Analytics.
WhatsApp/email se interceptan. No se crearon leads, mensajes ni conversiones reales.

Se comprobó en navegador:

- Todos los campos requeridos, email personal admitido, teléfono separado, cantidad y fecha utilizables.
- Siete preselecciones, incluyendo las cuatro requeridas y showroom.
- Doble submit pendiente: un request; ningún evento de lead antes de la respuesta.
- Odoo simulado confirma: un registro con email/phone, ocho campos Ads/UTM, URL/referrer iniciales,
  timestamp servidor, estado new y tres importes null; luego un generate_lead y confirmación con focus.
- Clic posterior de WhatsApp: solo whatsapp_click y una apertura explícita interceptada.
  Mensaje preparado conservado en memoria; href/eventos sin datos del formulario.
- Error del backend: form_error, sin éxito ni generate_lead; reintento habilitado y exitoso.
- Validación: form_error; interacción real: form_start una vez; enlace email: email_click.
- Anchors, recarga y volver atrás no emiten una conversión adicional y conservan atribución.

## Visual y performance

Desktop 1440×900 y mobile 390×844 revisados visualmente: hero, B2B, fin de año, formulario y confirmación.
En mobile el CTA principal empieza aproximadamente en y=421 y los beneficios terminan en y=598.
Campos de 52 px de alto; sin overflow horizontal. Botón posterior dentro de la tarjeta, sin superposición.
Los ocho trabajos abren/cerran en lightbox; animaciones de trabajos/logos preservadas, FAQ desplegables,
menú y enlace Maps conservados. Todos los recursos locales referenciados respondieron 200.
Consola normal sin errores; el escenario de fallo produce únicamente el 503 simulado esperado.

Lighthouse mobile local (sin Analytics real): accesibilidad 97, buenas prácticas 100, SEO 92.
Se detectaron contrastes/etiqueta de marca preexistentes y ausencia de robots.txt en la vista local.
Se corrigió el contraste del CTA/número nuevos de fin de año sin alterar la paleta global.
La herramienta disponible no calcula puntuación de performance: esa puntuación queda PENDIENTE.
Traza DevTools a 390×844, CPU 1× y red sin limitación: LCP 108 ms, CLS 0.00.
Son resultados locales, no métricas de producción ni CrUX. Hero sin lazy y con fetchpriority high;
dimensiones y WebP existentes conservados, sin compresión ni sustitución de imágenes.

## Publicación separada

La arquitectura actual NO requiere migración Odoo ni custom field. La descripción comercial
se conserva en `crm.lead.description` y se agrega el bloque `PRIMOFFICE CORPORATE DATA v1`:
JSON recuperable con Ads/UTMs, landing/referrer, `captured_at`, `status: "new"` e importes
`estimated_value`, `quoted_value`, `final_sale_value` como `null`. No crea otra base ni modifica D1.
El harness usa solo campos nativos y muestra el bloque persistido en la descripción del lead simulado.
Una segunda etapa podrá migrarlo a campos propios si se desea; no hay importación offline.
Orden futuro: backend compatible y frontend; sin migración de esquema previa.

RIESGO PREEXISTENTE: odoo.setupoficina.com.ar actualmente solo expone HTTP públicamente; su remediación de infraestructura queda fuera de esta entrega.

Commit, push, deploy y migraciones de producción: NO.
Sin Google Ads API/importación offline, automatizaciones comerciales ni panel nuevo.

## Validación posterior: persistencia sin migración — 2026-09-17

Esta revisión parte de los cambios Ads existentes, sin reemplazar archivos del sitio.
HTML, CSS, main.js, config.js y tests/form.test.mjs conservan sus hashes iniciales.
Se actualizaron únicamente README, este documento y el harness de QA del frontend.
Frontend: 9/9 tests; backend corporativo/CRM defensivo: 24/24; suite completa: 131/134,
con los mismos tres fallos Tiendanube preexistentes, sin repetir investigación baseline.
La integración local del frontend actual y endpoint real contra Odoo simulado verificó el
bloque recuperable en description, todos los Ads/UTMs, estados/importes, espera del ID,
doble submit, generate_lead una vez, WhatsApp opcional y error/reintento sin falso éxito.
Bundle backend compilado en memoria y git diff --check aprobados. Producción no se probó ni modificó.
