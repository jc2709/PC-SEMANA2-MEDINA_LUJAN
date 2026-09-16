# Manual de pruebas — Fase 4

## Antes de empezar

1. Ejecuta `npm install` y luego `npm run dev`.
2. Abre `http://localhost:3000`.
3. Selecciona la organización `Comercial Andina S.A.C.` y el periodo `Septiembre 2026`.
4. La información se guarda en el navegador activo mediante localStorage. No cierres la pestaña antes de ver `● Guardado`.

## Carga rápida de casos demo

En los formularios principales encontrarás el botón `✦ Cargar caso demo`. Úsalo para rellenar un ejemplo sin escribir todos los campos y luego pulsa el botón normal de guardar. El botón no guarda automáticamente, por lo que puedes revisar o editar el ejemplo antes de confirmar.

Está disponible en Organización, Periodos, Registro manual, Canvas, Proyectos, Actividades, Hitos y Seguimiento.

## Pruebas principales

### F4-PROJ-01 — Crear y aprobar proyecto

Entra a `Proyectos`, pulsa `+ Nuevo proyecto` y completa código, nombre, descripción, brecha, objetivo, responsable, fechas, presupuesto y prioridad. Vincula un Canvas TO BE y guarda.

Resultado esperado: el proyecto aparece en el portafolio como `Borrador`. Pulsa `Aprobar plan` y verifica que cambia a `Plan aprobado`.

### F4-PROJ-02 — Editar proyecto aprobado

Pulsa `Editar`, cambia la observación o el riesgo y guarda.

Resultado esperado: se conserva el proyecto, pero vuelve a `Borrador` para que el cambio sea revisado antes de aprobarlo nuevamente.

### F4-GANTT-01 — Actividades, dependencia e hitos

Entra a `Gantt`, elige el proyecto, crea dos actividades con fechas dentro del proyecto y configura la segunda con dependencia de la primera. Agrega un hito y cambia su estado.

Resultado esperado: las actividades aparecen en la tabla y en la línea temporal; la dependencia se muestra y el hito aparece en `Fechas de control`.

### F4-TRACK-01 — Seguimiento real vs plan

Entra a `Seguimiento`, pulsa `+ Registrar seguimiento`, registra avance plan 50, avance real 40, costos plan/real, estado `EN_RIESGO`, hito, riesgo, evidencia y comentario.

Resultado esperado: las tarjetas muestran ambos avances, la desviación de `-10 puntos`, el costo real frente al plan y el corte aparece en la tabla. El avance del proyecto se actualiza a 40%.

### F4-PER-01 — Persistencia

Recarga la página o ciérrala y vuelve a abrirla en el mismo navegador.

Resultado esperado: permanecen proyecto, aprobación, actividades, hitos y cortes de seguimiento. Cambiar de organización o periodo no debe mostrar entidades de otro contexto.

### F4-VAL-01 — Validaciones

Intenta guardar un proyecto sin nombre, una actividad fuera del rango del proyecto y un hito fuera del rango.

Resultado esperado: la aplicación rechaza cada operación con un mensaje y no crea registros incompletos.

## Criterio de aprobación

La Fase 4 queda lista para aprobación cuando las pruebas automáticas están en PASS y las pruebas manuales F4-PROJ-01 a F4-PER-01 funcionan sin errores de consola. Responde `FASE 4 APROBADA` para autorizar la siguiente fase.
