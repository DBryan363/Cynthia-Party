# 🎤 The Birthday Tour — invitación Glee × One Direction

Invitación web *mobile-first* para cumpleaños con estética de **pase VIP de concierto**, **hoja de inscripción del club glee** y **pase backstage** como agradecimiento. Sin frameworks ni dependencias: HTML + CSS + JS, y se publica gratis en GitHub Pages.

| Archivo | Qué es |
|---|---|
| `config.js` | ✏️ **Toda la información del evento** (nombre, fecha, lugar, dress code, canciones, URL de Google Sheets). Es lo único que necesitas editar. |
| `index.html` · `styles.css` · `app.js` | La invitación. |
| `google-apps-script/Code.gs` | Receptor de confirmaciones que guarda en Google Sheets. |
| `assets/og-image.png` | Imagen que aparece al compartir el link por WhatsApp. |
| `tools/` | Plantilla y script para regenerar esa imagen con tu nombre. |

## Qué incluye

- Bienvenida con disco de vinilo girando, nombre en neón, luces de escenario, ecualizador y cuenta regresiva tipo marcador.
- Cinta con canciones de la época (Glee + 1D).
- Entrada VIP con fecha, hora, lugar y dress code, botón **Cómo llegar** (Google Maps) y **Agendar** (Google Calendar en Android, archivo de calendario en iPhone).
- Formulario "Sign-up sheet": nombre, apellido, ¿asistirá?, canción opcional (con sugerencias). Si responde "No podré", el campo de canción se oculta.
- Agradecimiento personalizado: un pase backstage con su nombre que cae con "slushie" de color y confeti de estrellas (o un mensaje cariñoso si no puede ir).
- Botón fijo "Confirmar asistencia" en el celular. Después de confirmar, el formulario se limpia para anotar a otro acompañante.
- **Links personalizados**: `https://tu-sitio/?invitado=Ana` muestra "¡Ana, tu nombre está en la lista VIP!" y le prellena el nombre.
- Respeta "reducir movimiento" del sistema y es accesible con teclado y lectores de pantalla.

## 1. Editar los datos del evento

Abre `config.js` y cambia los valores. La fecha va en formato ISO con zona horaria:

```js
startISO: "2026-12-12T20:00:00-05:00", // 12 dic 2026, 8:00 PM en UTC-5
timeZone: "America/Bogota",
```

Si tienes el enlace exacto del lugar en Google Maps, pégalo en `venue.mapsUrl`.

## 2. Conectar Google Sheets (≈5 min)

1. Crea una hoja nueva en [sheets.new](https://sheets.new) (déjala **privada**, no la compartas).
2. Menú **Extensiones → Apps Script**. Borra el contenido y pega todo `google-apps-script/Code.gs`. Guarda.
3. Elige la función `setup` en la barra superior y pulsa **▶ Ejecutar**. Acepta los permisos (es tu propia cuenta). Se crean las pestañas **Respuestas** y **Resumen** (con contadores y la lista de confirmados).
4. **Implementar → Nueva implementación** → tipo **Aplicación web**:
   - *Ejecutar como*: **Yo**
   - *Quién tiene acceso*: **Cualquier usuario**
5. Copia la URL que termina en `/exec` y pégala en `config.js` → `sheetsEndpoint`.

> Si después modificas `Code.gs`, usa **Implementar → Administrar implementaciones → ✏️ → Nueva versión** para que la URL siga siendo la misma.

Mientras `sheetsEndpoint` esté vacío, la página funciona en **modo demo** (simula el envío y no guarda nada), útil para probar el diseño.

Para cerrar las confirmaciones, pon `CLOSED: true` en `Code.gs` y crea una nueva versión.

### Privacidad y seguridad

- **No hay credenciales en la página.** La URL `/exec` solo permite *enviar* una respuesta; no permite leer la hoja (`doGet` no devuelve datos). La lista de invitados solo la ves tú en tu Google Sheet.
- El servidor valida y recorta cada campo, bloquea la inyección de fórmulas (`=`, `+`, `-`, `@`), tiene campo trampa anti-bots, tiempo mínimo de llenado y límite de envíos por minuto.
- Las respuestas son **fijas**: si alguien intenta registrar un nombre y apellido que ya está en la lista, no se cambia nada y la página avisa que ya se registró.
- En el navegador del invitado solo se guarda su propia respuesta, para mostrarle su pase al volver.

## 3. Publicar en GitHub Pages

1. Sube estos archivos a la rama principal del repositorio.
2. En GitHub: **Settings → Pages → Build and deployment → Deploy from a branch**, elige la rama y la carpeta `/ (root)`.
3. En 1–2 minutos tendrás una URL como `https://usuario.github.io/repositorio/`.

**Vista previa en WhatsApp:** en `index.html`, cambia `og:image` por la URL absoluta, por ejemplo `https://usuario.github.io/repositorio/assets/og-image.png` (WhatsApp no acepta rutas relativas).

Para regenerar la imagen con el nombre de `config.js` (requiere Node y Playwright): `node tools/make-og.js`.

## Probar en tu computadora

```bash
python3 -m http.server 8000
# abre http://localhost:8000/?invitado=Ana
```

---
Proyecto fan sin afiliación oficial con Glee ni One Direction.
