# Alcance de Fase 5 — KPI, predicción y simulación

## Implementado

- Catálogo de KPI por organización con nombre, descripción, fórmula, unidad, periodicidad, baseline, meta, tolerancia, responsable, fuente y dirección de cumplimiento.
- Reutilización de las observaciones históricas existentes, sin duplicar la fuente de datos.
- Pronóstico mes +1 con modelos locales: último valor, media móvil, tendencia lineal y suavización exponencial.
- Selección automática por MAE cuando hay historial suficiente.
- Rango esperado, tendencia, fecha de corte, parámetros, cantidad de observaciones y explicación.
- Regla explícita `HISTORIAL INSUFICIENTE` para menos de tres observaciones; el resultado se presenta como escenario estimado.
- Semáforos deterministas: verde cumple, ámbar está dentro de tolerancia, rojo supera la desviación y gris no tiene datos.
- Simulador BASE vs ESCENARIO con marketing, conversión, precio, costos, retraso de proyecto y capacidad.
- Persistencia versionada de KPI, pronósticos y escenarios en el schema 4.

## Fuera de alcance

No se presenta una confianza estadística artificial ni se usa Gemini para calcular el pronóstico final. Las reglas del simulador son transparentes y deben validarse con datos operativos reales.
