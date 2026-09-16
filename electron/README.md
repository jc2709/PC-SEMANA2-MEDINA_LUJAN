# Contenedor Electron

La aplicación de negocio vive en `src/` y se comparte entre web, HTML y escritorio. `renderer.tsx` genera el HTML estático para Electron; `main.cjs` solo crea la ventana segura y carga ese build. No contiene lógica de dominio ni secretos.

El HTML de producción se genera con `npm run build:html` en `dist/electron/index.html`; Vite integra JavaScript y CSS en ese mismo archivo. La clave de Gemini nunca se distribuye dentro de Electron: las funciones generativas se ejecutan mediante `https://canvas-model-ia-medina-lujan.vercel.app/api/ai`. `preload.cjs` expone únicamente el origen público de API y la CSP permite ese destino.

Para generar el EXE portátil x64 usa `npm run build:exe`. `npm run build:exe:unpacked` reconstruye el respaldo en `release/win-unpacked/`. `npm run verify:exe` copia únicamente el portable a una carpeta aislada y comprueba la interfaz e IA. `npm run package:final` ejecuta el flujo de entrega completo.
