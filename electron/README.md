# Contenedor Electron

La aplicación de negocio vive en `src/` y se comparte entre web, HTML y escritorio. `renderer.tsx` genera el HTML estático para Electron; `main.cjs` solo crea la ventana segura y carga ese build. No contiene lógica de dominio ni secretos.

El HTML de producción se genera con `npm run build:html` en `dist/electron/`. La clave de Gemini nunca se distribuye dentro de Electron: las funciones generativas se ejecutan mediante `https://canvas-model-ia-medina-lujan.vercel.app/api/ai`. `preload.cjs` expone únicamente el origen público de API.

Para generar el instalador Windows usa `npm run package:win`. Para una versión desempaquetada de QA usa `npm run package:win:dir`.
