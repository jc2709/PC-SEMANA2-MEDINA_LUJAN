# Alcance — Fase 3: Inteligencia Artificial

## Objetivo

Incorporar un asistente IA que analice el Canvas AS IS y genere propuestas TO BE trazables, sin aplicar cambios de manera autónoma.

## Incluido

- Servicio centralizado aiService.
- Endpoint server-side POST /api/ai.
- Gemini mediante GEMINI_API_KEY únicamente en el servidor.
- Modo MOCK contextual cuando no existe la clave o el servicio no está disponible.
- Análisis AS IS con hallazgos clasificados como HECHO, HIPOTESIS, RECOMENDACION o INFERENCIA.
- Evidencia, motivo, recomendación y confianza para cada hallazgo.
- Propuestas TO BE estructuradas con acción CREAR o MODIFICAR.
- Revisión y edición de propuestas antes de aplicarlas.
- Decisiones ACEPTADA, EDITADA y RECHAZADA.
- Historial IA por organización, versión de origen, respuesta y decisión.
- Creación de un TO BE nuevo únicamente después de aceptar o editar una propuesta.

## Reglas de seguridad y producto

1. La IA recibe solo organización, periodo, observaciones y Canvas seleccionados.
2. No se usan buscadores ni fuentes externas.
3. Una respuesta siempre tiene estado PROPUESTA.
4. Una versión AS IS aprobada nunca se modifica.
5. Rechazar una propuesta no altera ningún Canvas.
6. El modo MOCK se identifica visualmente y no se presenta como respuesta real.
7. Si Gemini falla, las funciones locales y la persistencia continúan operativas.

## Fuera de alcance

Proyectos, Gantt, seguimiento, KPI, predicción, simulación, dashboard, reportes y exportación PPTX corresponden a fases posteriores.

## Criterios de aceptación

1. El usuario puede ejecutar un análisis y ver hallazgos estructurados.
2. El usuario puede generar una propuesta TO BE sin que se cree una versión automáticamente.
3. Aceptar crea una nueva versión TO BE en BORRADOR con referencia al AS IS.
4. Editar y aplicar conserva la decisión EDITADA y los campos cambiados.
5. Rechazar conserva la decisión RECHAZADA y no agrega una versión.
6. El historial registra modo, operación, respuesta y decisión.
7. Sin GEMINI_API_KEY, la demostración funciona en modo MOCK.
