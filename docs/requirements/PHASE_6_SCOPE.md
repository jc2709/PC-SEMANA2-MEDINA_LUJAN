# Alcance de Fase 6 — Dashboard y reportes

## Implementado

- Dashboard ejecutivo conectado al mismo estado persistido: organización, periodo, proyectos, riesgos, presupuesto, KPI y pronósticos.
- Comparación visible de real, meta y proyectado.
- Tarjetas, tablas, barras históricas y semáforos para facilitar la demostración.
- Módulo de reportes con vista previa del paquete de evidencia.
- Exportación local de CSV y Excel con hojas de KPI, proyectos y observaciones.
- Generación local de un archivo PPTX compatible con PowerPoint, con portada, contexto, diagnóstico, ejecución, KPI, predicción y conclusiones.

## Riesgos conocidos

El PPTX MVP usa una plantilla XML mínima y texto; no incluye gráficos embebidos ni imágenes. Los valores exportados proceden del estado activo y no están hardcodeados.
