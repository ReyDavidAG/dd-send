# dd-send · Plantilla de invitación romántica

Invitación de una sola vista (Astro + Tailwind CSS v4) para desplegar en
GitHub Pages. Pensada como **plantilla reutilizable**: para una nueva
invitación solo editas un archivo.

## Personalizar (lo único que necesitas tocar)

1. **`src/data/invitation.ts`** — nombres, película, fecha/hora, enlace de
   videollamada, textos, música y número de WhatsApp del RSVP.
2. **`public/images/`** — tus fotos (`foto-1.jpg`, `foto-2.jpg`, `foto-3.jpg`).
3. **`public/music/`** — la canción de fondo (`cancion.mp3`), opcional.
4. **Colores y tipografías** — en `src/styles/global.css` (bloque `@theme`).

Nada más. Los componentes leen todo desde `invitation.ts`.

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:4321/dd-send
npm run build    # genera dist/
```

## Desplegar en GitHub Pages

1. En **`astro.config.mjs`** ajusta dos líneas:
   - `site`: `https://TU-USUARIO.github.io`
   - `base`: `/NOMBRE-DEL-REPO/` (por defecto `/dd-send/`). Si usas dominio
     propio o un repo `usuario.github.io`, pon `base: '/'`.
2. Sube el repo a GitHub.
3. En **Settings → Pages → Build and deployment**, elige **GitHub Actions**.
4. Cada `push` a `main` publica automáticamente
   (`.github/workflows/deploy.yml`).

## Estructura

```
src/
  data/invitation.ts   ← edita esto por invitación
  layouts/Base.astro   ← <head>, fuentes, música, animaciones globales
  pages/index.astro    ← compone las secciones
  components/          ← OpeningScreen, Message, DateDetails,
                         Countdown, Rsvp, MusicToggle, Reveal
  styles/global.css    ← paleta y tipografías
```
