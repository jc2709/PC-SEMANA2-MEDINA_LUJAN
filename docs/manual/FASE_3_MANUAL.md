# Manual de prueba — Fase 3

## Preparación

1. Abrir una terminal en la carpeta del repositorio.
2. Ejecutar npm run dev.
3. Abrir http://localhost:3000.
4. Mantener la aplicación sin GEMINI_API_KEY para probar el modo MOCK.
5. Seleccionar Comercial Andina S.A.C. y Septiembre 2026, o una organización y periodo que tengan un Canvas AS IS.

## Prueba A — Análisis AS IS

1. Abrir Análisis IA desde el menú lateral.
2. Seleccionar una versión AS IS.
3. Pulsar Analizar AS IS.
4. Confirmar que aparece la etiqueta MODO DEMOSTRACIÓN / MOCK.
5. Confirmar que aparecen hallazgos con tipo, motivo, evidencia, recomendación y confianza.

Resultado esperado: se muestra una respuesta estructurada y no se modifica el Canvas.

## Prueba B — Generar una propuesta TO BE

1. En Análisis IA seleccionar la versión AS IS.
2. Pulsar Generar propuesta TO BE.
3. Revisar los cambios sugeridos, el bloque, la acción y la hipótesis.
4. Verificar que todavía no aparece una nueva versión TO BE.

Resultado esperado: la propuesta permanece pendiente y muestra IA propone · usuario decide.

## Prueba C — Aceptar

1. Generar una propuesta TO BE.
2. Pulsar Aceptar propuesta y crear TO BE.
3. Abrir Canvas TO BE.
4. Verificar que aparece una nueva versión en BORRADOR.
5. Verificar que conserva sourceVersionId hacia el AS IS.
6. Verificar que el AS IS original sigue igual.

Resultado esperado: se crea un TO BE nuevo, editable y trazable.

## Prueba D — Editar antes de aplicar

1. Generar otra propuesta TO BE.
2. Pulsar Editar antes de aplicar.
3. Cambiar el título o descripción de una propuesta.
4. Pulsar Guardar cambios y crear TO BE.
5. Abrir Canvas TO BE y verificar el texto cambiado.
6. Abrir Historial IA y verificar decisión EDITADA.

Resultado esperado: se crea una versión nueva con el contenido revisado por el usuario.

## Prueba E — Rechazar

1. Generar otra propuesta TO BE.
2. Pulsar Rechazar propuesta.
3. Revisar Canvas TO BE y el Historial IA.

Resultado esperado: no se crea una nueva versión y el historial muestra RECHAZADA.

## Prueba F — Fallback offline

1. Ejecutar una propuesta con la aplicación local levantada.
2. Detener el servidor o bloquear temporalmente el acceso al endpoint.
3. Volver a ejecutar Análisis AS IS.
4. Confirmar que aparece la advertencia de servicio no disponible.
5. Comprobar que la pantalla, Canvas guardados y datos locales siguen disponibles.

Resultado esperado: se recibe MOCK contextual y la aplicación no queda bloqueada.

## Prueba G — Persistencia del historial

1. Ejecutar un análisis.
2. Aceptar, editar o rechazar una propuesta.
3. Recargar la página.
4. Abrir Historial IA.

Resultado esperado: la interacción, el modo y la decisión permanecen guardados.

## Criterio PASS de la fase

Las pruebas A, B, C, D, E, F y G deben cumplir el resultado esperado. Una respuesta MOCK no es un error: es el modo de demostración previsto cuando Gemini no está configurado.
