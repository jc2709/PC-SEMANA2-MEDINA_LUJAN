# Arquitectura inicial

```text
React + TypeScript (src/CanvasModelApp.tsx)
        ├── services/storage   → snapshot local versionado
        ├── services/import    → XLSX/CSV, preview y validación
        ├── services/ai        → única abstracción para IA
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
