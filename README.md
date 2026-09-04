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

## Configuración comercial antes de publicar

Editar `site/assets/js/config.js`:

```js
window.PRIMOFFICE_SITE_CONFIG = {
  preview: false,
  whatsappNumber: "549...",
  corporateEmail: "...@primoffice.com.ar"
};
```

Mientras `preview` sea `true`, la web muestra un aviso de vista previa y el formulario no intenta enviar datos a un canal no configurado.

## GitHub Desktop

1. Descomprimir este proyecto en la carpeta definitiva.
2. En GitHub Desktop: **File → Add local repository**.
3. Si todavía no existe `.git`, usar **Create a New Repository on your hard drive** apuntando a esta carpeta.
4. Hacer el commit inicial.
5. **Publish repository** para subirlo a GitHub.

## Cloudflare Pages — configuración recomendada

El proyecto está preparado como HTML estático, sin framework ni paso de build.

Configuración:

- Production branch: `main`
- Framework preset: `None`
- Build command: `exit 0` (también puede quedar vacío si la interfaz lo permite)
- Build output directory: `site`
- Root directory: raíz del repo

Cloudflare Pages entrega automáticamente una URL `*.pages.dev` después del primer deploy.

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
- No se conservaron promesas comerciales exactas como plazos, mínimos o condiciones que no quedaron confirmadas en las notas.
- Se usaron fotos reales recibidas en el ZIP.
- Las marcas mostradas en la galería/marquee se limitaron a marcas visibles en ese material.
- La sección de casos de éxito queda reservada hasta recibir casos reales de Martín.
- WhatsApp y email quedan desacoplados en `config.js` para no hardcodear datos no confirmados.

Ver `docs/CONTENT_STATUS.md` antes de pasar de preview a producción.
