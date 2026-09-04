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
├─ site/                         # directorio que se publica en Cloudflare Pages
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

No hay build ni dependencias. Se puede abrir `site/index.html` directamente o servir la carpeta `site/` con cualquier servidor estático.

## Configuración comercial

Editar `site/assets/js/config.js`:

```js
window.PRIMOFFICE_SITE_CONFIG = {
  preview: false,
  whatsappNumber: "5491139149688",
  corporateEmail: "info@primoffice.com.ar"
};
```

El formulario valida los campos requeridos y abre WhatsApp con la consulta completa. El sitio no guarda la información. El email configurado se ofrece como canal alternativo mediante `mailto:`.

Aunque la configuración funcional usa `preview: false`, `site/index.html` conserva `noindex,nofollow` mientras la landing se revisa en el hostname temporal.

## Cloudflare Pages — configuración recomendada

El proyecto está preparado como HTML estático, sin framework ni paso de build.

Configuración:

- Production branch: `main`
- Framework preset: `None`
- Build command: `exit 0` (también puede quedar vacío si la interfaz lo permite)
- Build output directory: `site`
- Root directory: raíz del repo

La revisión pública actual se realiza en:

`https://primoffice-empresas.primoffice.workers.dev/`

Documentación oficial revisada para esta estructura:

- https://developers.cloudflare.com/pages/framework-guides/deploy-anything/
- https://developers.cloudflare.com/pages/get-started/git-integration/

## Subdominio definitivo

El destino planteado es:

`empresas.primoffice.com.ar`

Una vez que la vista previa esté aprobada:

**Workers & Pages → proyecto → Custom domains → Set up a domain**

Si el DNS de `primoffice.com.ar` no está administrado en la misma cuenta de Cloudflare, se deberá crear el CNAME indicado por Cloudflare para el subdominio.

Documentación oficial:

- https://developers.cloudflare.com/pages/configuration/custom-domains/

## Criterios aplicados en esta versión

- Se eliminaron del sitio público los testimonios inventados del borrador original.
- No se publicaron nombres técnicos de producto que Martín indicó que no corresponden.
- Se incorporaron las condiciones comerciales confirmadas para esta etapa desde el HTML corporativo original.
- Se usaron fotos reales recibidas en el ZIP.
- Las marcas mostradas en la galería/marquee se limitaron a marcas visibles en ese material.
- La sección de casos de éxito queda reservada hasta recibir casos reales de Martín.
- WhatsApp y email reales quedan centralizados en `config.js`.

Ver `docs/CONTENT_STATUS.md` antes de configurar el dominio definitivo.
