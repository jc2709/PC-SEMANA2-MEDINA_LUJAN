# Contenedor Electron

La aplicación de negocio vive en `src/` y se comparte entre web y escritorio. `main.cjs` solo crea la ventana segura y carga el build web; no contiene lógica de dominio ni secretos.

El empaquetado del instalable pertenece a la Fase 7. La clave de Gemini nunca se distribuye dentro de Electron: las funciones generativas se ejecutan mediante el endpoint seguro `/api/ai`.
