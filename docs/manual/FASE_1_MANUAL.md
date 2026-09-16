# Manual de prueba — Fase 1

1. Ejecuta `npm install` y luego `npm run dev`.
2. Abre la URL local mostrada por vinext.
3. En **Organización**, crea una organización adicional; selecciónala desde el selector superior.
4. Agrega un periodo, por ejemplo `2026-11`, con fechas válidas.
5. En **Datos**, registra una observación manual y comprueba que aparece en el histórico.
6. Importa `test-data/DATA_PRUEBA_CANVAS_MODEL_IA.csv`. Revisa la vista previa y confirma solo después de comprobar las filas válidas.
7. Cambia organización y periodo en el selector superior: observa que los históricos permanecen aislados.
8. Recarga o cierra y vuelve a abrir el navegador. El indicador debe mostrar **Guardado** y los registros deben permanecer.
9. En Dashboard, pulsa **Probar asistente IA · MOCK**. La pantalla debe indicar **Modo demostración / MOCK**; la aplicación no debe bloquearse.
10. Revisa Configuración para ver persistencia, modo offline y separación servidor/cliente de la clave IA.
11. En Organización pulsa **Editar** sobre una organización o periodo y verifica que los cambios permanecen después de recargar.
12. En Datos pulsa **Editar** sobre una observación, cambia su KPI/valor/fuente o periodo y recarga para confirmar que el dato actualizado permanece.

Los módulos Canvas y de analítica muestran deliberadamente que pertenecen a fases posteriores.
