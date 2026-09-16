# Alcance de Fase 4 — Proyectos, Gantt y seguimiento

## Objetivo

Convertir las brechas y cambios del Canvas TO BE en iniciativas ejecutables, con plan, aprobación, responsables, costos y control de avance.

## Incluye

- Proyectos vinculados a una organización y un periodo.
- Código, nombre, descripción, brecha de origen, objetivo, responsable, rango de fechas, presupuesto, prioridad, riesgos, KPI relacionado y observaciones.
- Vínculo opcional a una versión Canvas TO BE.
- Estados `NO_INICIADO`, `EN_CURSO`, `EN_RIESGO`, `RETRASADO`, `COMPLETADO` y `CANCELADO`.
- Plan de actividades con fechas, responsable, dependencia, estado, avance y costos plan/real.
- Hitos con fecha, responsable, estado y notas.
- Aprobación explícita del plan; editar un proyecto aprobado lo devuelve a borrador.
- Cortes de seguimiento con avance plan/real, costos acumulados, estado, hito, riesgos, evidencia y comentarios.
- Persistencia local versionada: estados Fase 1–3 migran a Fase 4 sin perder información.

## Fuera de alcance

La definición formal de KPI, predicciones y simulaciones queda para Fase 5. El campo KPI se conserva como vínculo textual para preparar esa integración.

## Criterios de aceptación

La aplicación debe compilar, permitir crear/editar/aprobar proyectos, mostrar su Gantt, registrar actividades e hitos, comparar seguimiento real contra plan y conservar todo después de recargar.
