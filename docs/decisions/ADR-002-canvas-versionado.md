# ADR-002 — Versionado y comparación del Canvas

## Estado

Aceptada para Fase 2.

## Decisión

Guardar AS IS y TO BE como `CanvasVersion` independientes, asociados siempre a organización y periodo. Cada versión contiene sus propios elementos. La edición solo está habilitada en `BORRADOR`; una versión `APROBADO` se congela y se continúa mediante clonación.

## Consecuencias

- El historial de versiones queda disponible sin sobrescribir el modelo anterior.
- La clonación conserva el vínculo `sourceElementId` para comparar cambios materiales.
- La comparación puede ser determinista y auditable, sin depender de IA.
- El almacenamiento local aumenta su esquema de 1 a 2 mediante migración compatible.
