# Política de IA — Canvas Model IA

## Principio

La IA propone y el usuario decide. Ninguna respuesta se incorpora automáticamente al modelo de negocio.

## Contexto permitido

El servicio recibe la organización activa, el periodo activo, la versión AS IS seleccionada, sus elementos y las observaciones históricas del periodo. No se integra búsqueda web, scraping ni fuentes externas.

## Clasificación

- HECHO: información directamente presente en el contexto.
- HIPOTESIS: supuesto que necesita validación.
- RECOMENDACION: acción sugerida por el análisis.
- INFERENCIA: interpretación derivada del contexto, no un hecho confirmado.

## Ciclo de una propuesta

1. aiService solicita análisis o generación.
2. El endpoint valida la operación y el contexto.
3. Gemini o el MOCK devuelve JSON estructurado.
4. La aplicación normaliza la respuesta.
5. El usuario revisa hallazgos y propuestas.
6. El usuario acepta, edita o rechaza.
7. Aceptar o editar crea un TO BE en BORRADOR.
8. Rechazar solo actualiza el historial.

## Persistencia y seguridad

El historial se guarda junto al estado local de la aplicación. La API key solo se lee en el endpoint mediante process.env.GEMINI_API_KEY. El frontend no recibe ni almacena el secreto. Las respuestas no se ejecutan como código ni se insertan como HTML.

## Fallback

Cuando la clave no existe, Gemini responde con error o el endpoint no está disponible, se utiliza una respuesta MOCK contextual y se informa: Servicio de IA no disponible. Las funciones locales continúan operativas.
