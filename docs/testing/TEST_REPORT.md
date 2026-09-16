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
| F1-AI-01 | IA | Ejecutar sin clave Gemini | Se muestra MOCK y las funciones locales continúan | PASS — contrato del endpoint |
| F1-SEC-01 | Seguridad | Buscar clave en frontend versionado | No existe clave real ni secreto en `.env.example` | PASS — test automático |

Evidencia de cierre: `npm run build` PASS, `npm run lint` PASS, `npm test` PASS (4/4 pruebas). La prueba visual se ejecutó sobre el servidor local y no reportó errores de consola.
