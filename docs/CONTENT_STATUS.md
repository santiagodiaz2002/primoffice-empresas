# Estado de contenido y fuente de verdad

## Confirmado por las notas de reunión

- La landing es para empresas.
- Casos de uso: regalos corporativos, kits de bienvenida y fin de año.
- Los productos pueden llevar branding de la empresa.
- PrimOffice trabaja con producto propio.
- La cotización debe plantearse como ágil, sin fijar un plazo exacto no confirmado.
- Existe showroom.
- La landing debe explicar cómo se trabaja y por qué elegir PrimOffice.
- Deben usarse fotos reales de productos/trabajos.
- Debe existir una franja de marcas/logos en loop sobre fondo neutro.
- Los testimonios/casos de éxito inventados no se deben publicar.
- Martín debe entregar los casos de éxito reales.
- Debe existir contacto por WhatsApp, email y un formulario breve.
- El formulario debe pedir, entre otros datos, la fecha para la que se necesita el proyecto.
- El destino final debe ser un subdominio de PrimOffice.

## Evidencia visual usada

Las imágenes del ZIP muestran trabajos o productos con las siguientes marcas visibles:

- UCC / Universidad Católica de Córdoba
- Globant
- Zurich
- ArcelorMittal
- Lograr
- Corven
- Integra
- Mastercard
- Santander
- Volkswagen
- Banco Formosa

Estas marcas se usan en la vista previa porque aparecen en la evidencia visual recibida. Para producción conviene confirmar con Martín qué logos oficiales están autorizados para publicarse y reemplazar el marquee tipográfico por archivos de logo aprobados.

## Pendiente antes de producción

1. Número real de WhatsApp Business.
2. Email corporativo definitivo.
3. Casos de éxito reales, con texto y autorización de publicación.
4. Archivos oficiales de logos de clientes/marcas que se quieran mostrar.
5. Confirmación final de claims comerciales específicos si se desean agregar: cantidades mínimas, tiempos de producción, envíos, medios de pago, facturación, etc.
6. Confirmación del subdominio definitivo (`empresas.primoffice.com.ar` es la propuesta actual).
7. Definir si el formulario solo deriva a WhatsApp/email o si debe guardar leads en un backend/CRM.
8. Al pasar a producción, retirar `noindex,nofollow` del `<head>` de `site/index.html`.
9. Cambiar `preview: true` a `preview: false` en `site/assets/js/config.js`.

## No publicado deliberadamente

El borrador original incluía testimonios de ejemplo y afirmaciones comerciales exactas. No se trasladaron a esta versión porque las notas de reunión indican que los testimonios eran inventados y porque las condiciones comerciales exactas requieren confirmación actual.
