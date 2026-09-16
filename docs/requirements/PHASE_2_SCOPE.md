# Alcance — Fase 2: Canvas AS IS / TO BE

## Objetivo

Implementar un Business Model Canvas funcional que permita describir el modelo actual, proponer una evolución futura, mantener versiones y visualizar brechas sin modificar silenciosamente una versión aprobada.

## Incluido

- Los nueve bloques reconocibles del Business Model Canvas.
- Elementos por bloque con título, descripción, hipótesis, evidencia, responsable, KPI relacionado, confianza, etiquetas, comentarios, fuente y fecha de actualización.
- Canvas AS IS y Canvas TO BE asociados a organización y periodo.
- Versiones con estados `BORRADOR`, `EN_REVISION`, `APROBADO` y `ARCHIVADO`.
- Flujo de revisión y aprobación.
- Clonación de AS IS hacia TO BE y clonación de versiones aprobadas para continuar trabajando.
- Escenarios `BASE`, `CONSERVADOR`, `MODERADO`, `AGRESIVO` y `PERSONALIZADO`.
- Comparación determinista con categorías `CREAR`, `MODIFICAR`, `ELIMINAR` y `MANTENER`.
- Migración compatible del estado de Fase 1 al esquema de Fase 2.

## Fuera de alcance

IA generativa aplicada al Canvas, proyectos, Gantt, KPI, predicción, simulación, reportes y exportación PPTX. Se implementarán en las fases posteriores definidas por el proyecto.

## Criterios de aceptación

1. El usuario puede abrir AS IS y ver los nueve bloques.
2. Puede agregar y editar elementos con metadatos de trazabilidad.
3. Puede crear o clonar TO BE sin alterar AS IS.
4. Una versión aprobada queda congelada y solo puede modificarse mediante clonación.
5. Dos escenarios mantienen versiones y elementos independientes.
6. La comparación muestra las cuatro categorías deterministas.
7. Los Canvas se conservan después de recargar la aplicación.
