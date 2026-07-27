# YT Media Downloader v1.2.4

## 🐛 Bugfixes & Improvements (v1.2.4)

### Bugs Corregidos
- **Fix: Botón "Descargar" no funcionaba** — La variable `prefix` no estaba declarada en `download.js`, causando un `ReferenceError` que impedía iniciar cualquier descarga.
- **Fix: Botón "Abrir Carpeta" no funcionaba** — El endpoint POST `/open_folder` no existía en el servidor companion. Se implementó para abrir la carpeta de descargas con el explorador de archivos del sistema operativo.
- **Fix: Descarga siempre en 360p aunque se seleccione 1080p** — El comando de descarga tenía `--extractor-args "youtube:player_client=android,web"` hardcodeado, lo que restringía los formatos DASH a solo 360p. Se eliminó del comando de descarga y se usa el campo `quality` (ej. `1080p`) enviado por la extensión para construir el especificador `-f "bestvideo[height<=1080]+bestaudio"`.
- **Fix: Ventanas CMD emergentes** — Cada llamada a yt-dlp o ffmpeg abría una ventana de consola visible en Windows. Se agregó `subprocess.CREATE_NO_WINDOW` a todas las llamadas `subprocess.run()` y `subprocess.Popen()`.

### Mejoras
- **Soporte de Cookies de YouTube** — El servidor companion ahora detecta automáticamente cookies del navegador para autenticarse con YouTube, evitando bloqueos por CAPTCHA/bot detection y habilitando todas las calidades de video (1080p, 720p, 480p, etc.). Se soportan Chrome, Edge, Firefox, Brave, Opera y Vivaldi.
- **Instalador pide cerrar navegadores** — El Setup de Windows ahora requiere cerrar todos los navegadores antes de instalar. Esto permite extraer las cookies de YouTube automáticamente durante la instalación para garantizar la descarga en HD.
- **Grid de calidades siempre completo** — La cuadrícula de calidades (1080p, 720p, 480p, 360p, 240p, 144p) ahora siempre muestra todas las opciones, incluso cuando yt-dlp no devuelve formatos específicos para una resolución.

### Archivos Modificados
- `content/download.js` — Fix variable `prefix` y envío de campo `quality`
- `content/video-data.js` — Render completo de la cuadrícula de calidades
- `linux-host/ytdl_host.py` — CREATE_NO_WINDOW, cookies, `/open_folder`, format specifier por altura
- `scripts/installer.iss` — Cierre obligatorio de navegadores + exportación automática de cookies
