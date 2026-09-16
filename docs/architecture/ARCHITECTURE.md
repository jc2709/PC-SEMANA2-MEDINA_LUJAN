# Arquitectura inicial

```text
React + TypeScript (src/CanvasModelApp.tsx)
        ├── services/storage   → snapshot local versionado
        ├── services/import    → XLSX/CSV, preview y validación
        ├── services/ai        → única abstracción para IA
        ├── modules/canvas     → AS IS, TO BE, escenarios y comparación
        └── types              → contratos de dominio

Web (vinext/Vite) ───────────────┐
                                ├── misma lógica React y de dominio
Electron (electron/main.cjs) ──┘

aiService → POST /api/ai → Gemini solo en servidor / MOCK sin clave
```

Se conserva `vinext` porque el repositorio ya lo usa como runtime Vite compatible con el starter y con el despliegue existente. No se incorpora una base de datos remota en esta fase: el requisito prioritario es operación offline y persistencia local entre sesiones.

## Aislamiento de contexto

Cada periodo almacena `organizationId`; cada observación almacena `organizationId` y `periodId`. Las vistas filtran por ambos identificadores, por lo que cambiar organización o periodo no mezcla históricos.

## Seguridad IA

El navegador llama a `/api/ai`, nunca a Gemini directamente. La ruta valida operación, organización y contexto; si `GEMINI_API_KEY` no existe o el proveedor falla, responde en modo MOCK. No se agregan buscadores ni scraping.

## Canvas y versionado

## Flujo de propuestas IA — Fase 3

La pantalla Análisis IA construye un contexto con organización, periodo, observaciones y una versión AS IS. aiService envía ese contexto a POST /api/ai. La ruta valida la operación y la respuesta se normaliza antes de renderizarla.

El modo MOCK se genera localmente con reglas deterministas cuando Gemini no está configurado o no responde. Para una respuesta real, la clave permanece en el servidor y Gemini recibe instrucciones para devolver JSON estructurado. La respuesta nunca se aplica automáticamente.

Aceptar o editar una propuesta usa el AS IS como origen y crea una nueva versión TO BE en BORRADOR. Rechazar solo actualiza el historial IA. La referencia entre versiones se conserva mediante sourceVersionId y la decisión mediante decision y decisionAt.

`CanvasVersion` pertenece a una organización y periodo, y contiene elementos de uno de los nueve bloques. AS IS y TO BE son tipos independientes. Un elemento clonado conserva `sourceElementId` para que la comparación pueda clasificarlo como `MODIFICAR` o `MANTENER`; los elementos sin origen se clasifican como `CREAR` y los ausentes en TO BE como `ELIMINAR`.

Los estados siguen el flujo `BORRADOR → EN_REVISION → APROBADO`. Una versión aprobada no muestra controles de edición; para modificarla se crea una copia editable con una nueva versión. Los escenarios también pertenecen al contexto organización-periodo y no comparten elementos entre sí.
