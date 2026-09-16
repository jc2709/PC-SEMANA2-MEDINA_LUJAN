# Canvas Model IA

Sistema local y web para formular y evolucionar el Business Model Canvas. Incluye las Fases 1–6 y la Fase 7 de entrega: núcleo de datos, Canvas AS IS/TO BE, ejecución, analítica, reportes, conexión IA segura y contenedor Electron.

El repositorio conserva `vinext` porque ya era el runtime React + TypeScript + Vite del proyecto y ofrece una ruta compatible con el endpoint Vercel preparado en `app/api/ai`.

## Prerequisites

- Node.js `>=22.13.0`

## Quick Start

```bash
npm install
npm run dev
npm run build
npm run build:html
```

This starter does not use `wrangler.jsonc`.

## Fases incluidas

La Fase 3 añade análisis contextual, propuestas TO BE, revisión humana, historial de decisiones y fallback MOCK. La IA nunca modifica automáticamente una versión aprobada.

- `src/types/`: contratos de dominio.
- `src/services/storage/`: persistencia local versionada.
- `src/services/import/`: lectura XLSX/CSV, preview y validación por fila.
- `src/services/ai/`: abstracción única de IA con fallback MOCK.
- `src/modules/canvas/`: nueve bloques, elementos, versiones, escenarios, aprobación y comparación.
- `app/api/ai/`: endpoint server-side preparado para Gemini.
- `electron/`: renderer HTML independiente, `preload` seguro y ventana Electron para el EXE.
- `test-data/`: dataset CSV reproducible de demostración.
- `docs/`: alcance, arquitectura, manual y evidencias.

El endpoint IA solo lee `GEMINI_API_KEY` en Vercel. El cliente web, el HTML local y Electron nunca reciben esa clave: llaman a `/api/ai` en el dominio de Vercel. Si Vercel o Gemini no están disponibles, la aplicación conserva el modo MOCK y las funciones locales.

## Fase 7: web, HTML y EXE

`npm run build` genera la aplicación web para Vercel. `npm run build:html` genera `dist/electron/index.html` como un único archivo con JavaScript y CSS integrados. Al abrirse desde `file://`, el cliente usa el endpoint público de Vercel y la CSP autoriza ese dominio en `connect-src`.

`npm run build:exe` genera `release/Canvas-Model-IA-portable-0.1.0-x64.exe`: un EXE portátil que puede moverse solo a otra carpeta. El build también conserva `release/win-unpacked/` como respaldo. `npm run build:exe:unpacked` reconstruye únicamente ese respaldo. `npm run verify:exe` copia solo el EXE a una carpeta aislada, abre la aplicación, recorre sus módulos y comprueba que el análisis IA obtiene HTTP 200 y una respuesta REAL. `npm run package:final` construye y verifica todo. Electron usa `contextIsolation`, `nodeIntegration: false` y expone únicamente `apiBaseUrl`, nunca una credencial.

Variables opcionales de ejecución de escritorio:

- `CANVAS_MODEL_IA_URL`: URL de la aplicación que Electron carga en desarrollo.
- `CANVAS_MODEL_IA_API_URL`: origen de API no secreto; por defecto es la producción de Vercel.

## Workspace Auth Headers

Signed-in visitors receive both `oai-authenticated-user-id` and `oai-authenticated-user-email`. Private Sites require every visitor to sign in; public Sites may also have anonymous visitors, for whom neither header is present.

The user ID is stable for the same user on the same Site and different across Sites. Email and name are intended for display or contact purposes.

SIWC-authenticated workspace sites may also receive
`oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty
`name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by
`oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const userId = requestHeaders.get("oai-authenticated-user-id");
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs
optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send
  anonymous visitors through Sign in with ChatGPT.
- Use `chatGPTSignInPath(returnTo)` and `chatGPTSignOutPath(returnTo)` for
  browser links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in
  or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because
  they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the
OAuth cookies, and identity header injection. Do not implement app routes for
those reserved paths. Routes that do not import and call the helper remain
anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the
Sites hosting platform's access policy controls for workspace-wide restrictions,
or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write
actions tied to the current ChatGPT user. Leave public content anonymous.

## Useful Commands

- `npm run dev`: start local development
- `npm run build`: verify the vinext build output
- `npm run build:html`: generar un único HTML standalone para `file://` y Electron
- `npm run electron:dev`: abrir el contenedor Electron
- `npm run build:exe`: generar el EXE portátil x64 y `win-unpacked`
- `npm run build:exe:unpacked`: regenerar el respaldo desempaquetado
- `npm run verify:exe`: probar el EXE como único archivo en una carpeta aislada
- `npm run package:final`: construir y verificar la entrega
- `npm test`: build web, build HTML y pruebas automáticas de Fases 1–7
- `npm run db:generate`: generate Drizzle migrations after schema changes

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
