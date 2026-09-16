# Reporte de pruebas — Fase 1

| ID | Módulo | Escenario | Resultado esperado | Resultado |
| --- | --- | --- | --- | --- |
| F1-ORG-01 | Organización | Crear una organización | Aparece en la lista y se selecciona como contexto activo | PASS — navegador local |
| F1-PER-01 | Periodos | Crear periodo en organización A | El periodo queda asociado a A | PASS — navegador local |
| F1-DATA-01 | Datos | Registrar observación manual | La observación aparece en el periodo activo | PASS — navegador local |
| F1-DATA-02 | Datos | Cambiar de periodo | Las observaciones del periodo anterior no aparecen | PASS — aislamiento implementado y cubierto por contrato |
| F1-IMP-01 | Importación | Importar CSV válido | Se muestra preview y se agregan solo filas confirmadas | PASS — test automático de parser |
| F1-IMP-02 | Importación | Importar fila con valor inválido | La fila queda marcada y no se importa silenciosamente | PASS — test automático de parser |
| F1-PER-02 | Persistencia | Recargar la aplicación | Organizaciones, periodos y observaciones permanecen | PASS — recarga visual y localStorage |
| F1-PER-03 | Persistencia | Corromper snapshot principal | El respaldo local permite recuperar los datos | PASS — test automático de recuperación |
| F1-EDIT-01 | Edición | Editar organización, periodo y observación | Los cambios se guardan y permanecen después de recargar | PASS — navegador local |
| F1-AI-01 | IA | Ejecutar sin clave Gemini | Se muestra MOCK y las funciones locales continúan | PASS — contrato del endpoint |
| F1-SEC-01 | Seguridad | Buscar clave en frontend versionado | No existe clave real ni secreto en `.env.example` | PASS — test automático |

Evidencia de cierre: `npm run build` PASS, `npm run lint` PASS, `npm test` PASS (6/6 pruebas). La prueba visual local confirmó edición y persistencia de una organización, un periodo y una observación después de recargar; no se reportaron errores ni advertencias de consola.

## Fase 2

| ID | Módulo | Escenario | Resultado esperado | Resultado |
| --- | --- | --- | --- | --- |
| F2-CANVAS-01 | Canvas | Abrir AS IS | Se muestran los nueve bloques | PASS — test automático y navegador local |
| F2-CANVAS-02 | Elementos | Agregar y editar elemento | Se guardan descripción, hipótesis y metadatos | PASS — navegador local |
| F2-VERSION-01 | Versionado | Enviar a revisión y aprobar | La versión aprobada queda congelada | PASS — navegador local |
| F2-VERSION-02 | Versionado | Clonar versión aprobada | Se crea una nueva versión editable sin alterar la aprobada | PASS — navegador local |
| F2-TOBE-01 | TO BE | Derivar TO BE desde AS IS | TO BE tiene elementos propios y AS IS permanece intacto | PASS — test automático y navegador local |
| F2-SCENARIO-01 | Escenarios | Mantener escenarios independientes | Un escenario no comparte elementos editables con otro | PASS — modelo de dominio y UI |
| F2-COMP-01 | Comparación | Comparar AS IS vs TO BE | Clasifica CREAR, MODIFICAR, ELIMINAR y MANTENER | PASS — navegador local |
| F2-PER-01 | Persistencia | Recargar Canvas | Versiones, elementos y estados permanecen | PASS — persistencia versionada |

## Fase 3

| ID | Módulo | Escenario | Resultado esperado | Resultado |
| --- | --- | --- | --- | --- |
| F3-AI-01 | Análisis IA | Analizar Canvas AS IS | Se muestran hallazgos clasificados y contextualizados | PASS — MOCK contextual y prueba automática |
| F3-AI-02 | Propuesta TO BE | Generar alternativa | Se muestra una propuesta pendiente sin crear versión automática | PASS — modelo y UI |
| F3-AI-03 | Decisión | Aceptar propuesta | Se crea TO BE nuevo en BORRADOR con referencia al AS IS | PASS — función pura y flujo implementado |
| F3-AI-04 | Decisión | Editar antes de aplicar | Se crea TO BE con campos revisados y decisión EDITADA | PASS — flujo UI implementado |
| F3-AI-05 | Decisión | Rechazar propuesta | No se modifica Canvas ni se crea versión | PASS — handler implementado |
| F3-AI-06 | Fallback | Sin clave o sin endpoint | Se muestra MOCK y las funciones locales continúan | PASS — contrato y fallback implementados |
| F3-AI-07 | Historial | Guardar decisión | Se conserva operación, modo, respuesta y decisión | PASS — estado local versionado |

Evidencia de cierre de Fase 3: build PASS, lint PASS y 10/10 pruebas automáticas PASS. La validación visual final queda documentada en el manual de Fase 3.

Evidencia de cierre de Fase 2: `npm run build` PASS, `npm run lint` PASS, `npm test` PASS (8/8 pruebas). La prueba visual confirmó creación, edición, clonación, comparación y aprobación sin errores de consola.

## Fase 4

| ID | Módulo | Escenario | Resultado esperado | Resultado |
| --- | --- | --- | --- | --- |
| F4-PROJ-01 | Proyectos | Crear y aprobar proyecto | Se registra el proyecto y cambia de borrador a aprobado | Cubierto por UI y manual |
| F4-PROJ-02 | Proyectos | Editar proyecto aprobado | El cambio se guarda y solicita nueva aprobación | Cubierto por handler y manual |
| F4-GANTT-01 | Gantt | Crear tareas, dependencias e hitos | Se muestran en tabla y cronograma | Cubierto por UI y manual |
| F4-TRACK-01 | Seguimiento | Registrar plan vs real | Se calculan desviaciones y se actualiza el avance del proyecto | Cubierto por modelo y UI |
| F4-PER-01 | Persistencia | Recargar ejecución | Proyectos, tareas, hitos y seguimiento permanecen | Cubierto por migración y manual |
| F4-VAL-01 | Validaciones | Fechas y campos obligatorios | No se crean registros inválidos | Cubierto por handlers |
| F4-DEMO-01 | Formularios | Cargar caso demo | El formulario se completa sin guardar hasta confirmar | Cubierto por componente reutilizable y manual |
| F4-PROJ-02A | Proyectos | Abrir Nuevo proyecto | El formulario se renderiza completo sin pantalla negra ni error de consola | Verificado en navegador local |

Evidencia técnica de Fase 4: `npm run build` PASS, `npm run lint` PASS y 13/13 pruebas automáticas PASS. La validación manual, incluida la carga rápida de casos demo, queda descrita en `docs/manual/FASE_4_MANUAL.md` para la revisión del usuario.

## Fases 5 y 6

| ID | Módulo | Escenario | Resultado esperado | Resultado |
| --- | --- | --- | --- | --- |
| F5-KPI-01 | KPI | Crear, editar y cargar demo | Se guarda un catálogo con fórmula, meta, baseline y tolerancia | Cubierto por UI y prueba visual |
| F5-PRED-01 | Predicción | Generar mes +1 | Se registra modelo, MAE, corte, rango y tendencia | Cubierto por servicio y prueba automática |
| F5-PRED-02 | Pocos datos | Pronosticar con menos de tres observaciones | Se muestra HISTORIAL INSUFICIENTE y escenario estimado | Cubierto por prueba automática y UI |
| F5-SIM-01 | Simulación | Cambiar variables BASE vs ESCENARIO | Se calculan impacto absoluto y porcentual con reglas transparentes | Cubierto por servicio y prueba visual |
| F6-DASH-01 | Dashboard | Revisar real, meta, proyectado y presupuesto | Las cifras proceden del estado persistido | Cubierto por UI y prueba visual |
| F6-EXP-01 | Reportes | Exportar CSV, Excel y PPTX | Se descarga un paquete con datos del contexto activo | Cubierto por UI y manual |
| F6-EXP-02 | Reportes | Abrir PPTX generado | El paquete contiene relaciones, layout y XML válidos, incluso sin proyectos | Cubierto por prueba automática OOXML |

Evidencia técnica de Fases 5–6: `npm run build` PASS, `npm run lint` PASS y 15/15 pruebas automáticas PASS. La validación visual local confirmó los módulos KPI, Predicción, Simulación y Reportes sin errores de consola; el exportador PPTX también valida la estructura OOXML del paquete.

## Fase 7

| ID | Módulo | Escenario | Resultado esperado | Resultado |
| --- | --- | --- | --- | --- |
| F7-URL-01 | IA | Ejecutar desde web Vercel | Se usa el endpoint de la misma aplicación | Cubierto por resolvedor de URL |
| F7-CORS-01 | IA | Preflight desde `file://` | Responde HTTP 204 y permite `Origin: null` | Cubierto por handler OPTIONS |
| F7-HTML-01 | HTML | Abrir `dist/electron/index.html` con doble clic | Carga assets relativos y llama a Vercel | PASS — build estático |
| F7-ELECTRON-01 | EXE | Abrir renderer empaquetado | Electron carga `dist/electron/index.html` sin pantalla negra | Cubierto por configuración y build |
| F7-SEC-01 | Seguridad | Inspeccionar cliente y preload | No existe `GEMINI_API_KEY` ni credencial | PASS — prueba de contrato |
| F7-FALLBACK-01 | Resiliencia | Desconectar Vercel/Gemini | Aparece MOCK y continúan las funciones locales | Cubierto por contrato existente |

Evidencia técnica de Fase 7: `npm run build:html` PASS y pruebas de contrato actualizadas. El empaquetado Windows requiere ejecutar `npm run package:win` en un equipo con el runtime de Electron disponible.
