# Manual de validación — Fase 7

## Objetivo

Comprobar que web, HTML y EXE comparten la interfaz y pueden solicitar IA a Vercel sin exponer `GEMINI_API_KEY`. La clave real solo se configura en Vercel como variable de entorno del servidor.

## 1. Validar la web

1. Ejecuta `npm install` y `npm run dev`.
2. Abre la URL local indicada por Vite/Vinext.
3. Pulsa `Cargar caso demo` en un módulo con IA.
4. Ejecuta una operación de análisis o recomendación.
5. Comprueba que aparece una respuesta `REAL` si Vercel/Gemini están disponibles; si no, aparece `MOCK` con advertencia y la aplicación sigue funcionando.

## 2. Validar el HTML standalone

1. Ejecuta `npm run build:html`.
2. Abre `dist/electron/index.html` directamente con doble clic, de modo que la URL comience por `file://`.
3. Carga el caso demo y ejecuta una operación IA.
4. En las herramientas del navegador, la petición debe ser `https://canvas-model-ia-medina-lujan.vercel.app/api/ai` y no `file:///api/ai`.
5. La petición debe completar con `REAL` o fallback `MOCK`; no debe aparecer un error de CORS.

## 3. Validar el EXE

1. Ejecuta `npm run package:final`.
2. Copia únicamente `release/Canvas-Model-IA-portable-0.1.0-x64.exe` a otra carpeta y ábrelo. No copies `win-unpacked`.
3. Repite la carga demo y la operación IA.
4. Cierra y vuelve a abrir la aplicación; confirma que la organización, observaciones, Canvas y decisiones siguen presentes.
5. Si Vercel no responde, confirma que los módulos locales aún permiten editar, guardar, exportar y consultar el modo MOCK.

El EXE incluye Electron y no requiere instalar Node.js, npm o Python en la computadora de destino. `release/win-unpacked/` queda como respaldo para diagnóstico.

## 4. Validar el preflight

Desde PowerShell:

```powershell
$headers = @{
  Origin = "null"
  "Access-Control-Request-Method" = "POST"
  "Access-Control-Request-Headers" = "content-type"
}
Invoke-WebRequest -Method Options `
  -Uri "https://canvas-model-ia-medina-lujan.vercel.app/api/ai" `
  -Headers $headers
```

Resultado esperado: HTTP `204`, `Access-Control-Allow-Origin: null`, métodos `POST, OPTIONS` y header permitido `Content-Type`.

## 5. Criterios de rechazo

- Se solicita `file:///api/ai`.
- El navegador muestra un bloqueo CORS.
- El EXE muestra una pantalla negra, exige copiar `win-unpacked` o deja archivos auxiliares visibles junto al portable.
- `GEMINI_API_KEY` aparece en HTML, JavaScript cliente, `preload`, Electron o Git.
- Una falla de Vercel impide usar las funciones locales o el fallback MOCK.
