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

Evidencia de cierre de Fase 2: `npm run build` PASS, `npm run lint` PASS, `npm test` PASS (8/8 pruebas). La prueba visual confirmó creación, edición, clonación, comparación y aprobación sin errores de consola.
