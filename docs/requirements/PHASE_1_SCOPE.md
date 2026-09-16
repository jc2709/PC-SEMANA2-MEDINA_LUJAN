# Fase 1 — Preparación, núcleo y datos

## Alcance implementado

- Organizaciones múltiples con sector, tamaño, moneda, descripción, estado y fecha de creación.
- Periodos múltiples asociados a una organización; el contexto activo determina el conjunto de datos visible.
- Observaciones históricas con KPI, valor, unidad, fuente, calidad y fecha.
- Registro manual y exportación CSV.
- Importación XLSX/CSV con vista previa, detección de columnas, validación por fila, errores y confirmación explícita.
- Persistencia local versionada mediante `localStorage` con manejo de memoria temporal si el navegador no está disponible.
- Abstracción central `aiService` y endpoint `/api/ai` con modo MOCK por defecto.
- Estructura inicial Electron sin lógica de negocio duplicada.

## Fuera de alcance

Canvas AS IS/TO BE, versionado Canvas, comparación, proyectos, Gantt, KPI avanzado, predicción, simulación, dashboard analítico y exportación PPTX. Esos módulos solo muestran su límite de fase y se implementarán después de una aprobación explícita.
