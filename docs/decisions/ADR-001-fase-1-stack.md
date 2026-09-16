# ADR-001 — Stack y persistencia de Fase 1

**Estado:** aceptada como decisión de implementación inicial.

**Contexto:** el repositorio recibido ya es un starter `vinext` con React, TypeScript, Vite y rutas estilo Next. Migrarlo a otra base elevaría el riesgo sin aportar valor a la Fase 1.

**Decisión:** mantener `vinext` y usar una única aplicación React. Persistir el MVP con un snapshot JSON versionado en `localStorage`, manteniendo las funciones de dominio separadas para poder sustituir el adaptador por IndexedDB o una base local de Electron en una fase posterior.

**Consecuencias:** el núcleo funciona offline y entre sesiones; el almacenamiento está limitado al navegador/dispositivo hasta una futura migración. La clave IA solo se lee en el endpoint servidor mediante `process.env.GEMINI_API_KEY`.
