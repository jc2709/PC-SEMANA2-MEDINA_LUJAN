# ADR-003 — IA como propuesta controlada

## Estado

Aceptada para Fase 3.

## Decisión

Centralizar las operaciones IA en aiService y enviar las solicitudes a POST /api/ai. El endpoint usa Gemini solo cuando existe GEMINI_API_KEY en el entorno del servidor; de lo contrario responde en modo MOCK.

Las respuestas se validan y normalizan antes de mostrarse. Toda propuesta se registra en aiHistory con organización, operación, versión de origen, modelo, respuesta y decisión.

Aceptar o editar no modifica la versión AS IS. Produce una versión TO BE nueva en BORRADOR con sourceVersionId. Rechazar no crea versiones ni cambia elementos.

## Consecuencias

- La demo funciona sin credenciales ni conexión a Gemini.
- Existe una ruta clara para reemplazar MOCK por Gemini real.
- Los resultados de IA son auditables y no se confunden con hechos.
- El usuario debe revisar las propuestas antes de aprobar el TO BE desde el módulo Canvas.
