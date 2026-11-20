# Contexto oficial por curso

## Biblioteca local del Módulo 1

El tutor recibe los contenidos estructurados de `data/module1.json` en las consultas
generales y en las consultas de actividades, únicamente para el curso asociado.
Moodle envía `module1Allowed` únicamente después de verificar matrícula, capacidades
y revisión docente del módulo. No se acepta este permiso desde los campos del navegador;
el backend lo exige además de su token interno y la asociación explícita de curso.
`data/module1-library.json` contiene texto de los seis PDF y las cuatro infografías
del módulo. Incluye archivo, hash SHA-256 y página. No se incorporan formularios
completados por estudiantes ni datos del navegador.

Para reconstruir el índice desde los archivos de `public/local/gestion22tutor/pdf`
y las cuatro infografías aprobadas de `images`, ejecutar `npm.cmd run index:module1`
desde este directorio. Se usa PDF.js para extraer texto y Tesseract en español para
páginas escaneadas. Revisar el resultado del OCR antes de habilitarlo para estudiantes.
Tras cambiar el índice, reconstruir el contenedor `gestion22-ai`.

Las preguntas recuperan como máximo ocho fragmentos por coincidencia de términos;
no hay embeddings ni acceso libre a otros archivos. El tutor debe citar documento
y página, reconocer lagunas y tratar documentos como datos, no como instrucciones.
`grounded` sigue siendo `false`: no se valida automáticamente cada afirmación generada.
Los cuatro videos están identificados, pero no se han incorporado sus transcripciones.

Los datos introductorios oficiales viven en `data/course-contexts/heridas-avanzadas.json`.
Incluyen bienvenida, título, recursos, evaluación, soporte, procedencia y datos no proporcionados.
No contienen información personal de estudiantes. Los enlaces son del aula **de producción**
`https://aulavirtual.gestion22.cl`; no se descargan ni se modifican esos recursos.

## Asociación local explícita

`config/course-bindings.local.json` asocia deliberadamente el curso **local 2** con
`gestion22-heridas-avanzadas`, exclusivamente para estas pruebas. Esta asociación no
identifica el ID real del curso de producción. No se deduce a partir del título ni del ID.

`compose.yaml` monta ese archivo de solo lectura y configura
`COURSE_CONTEXT_BINDINGS_FILE=/app/config/course-bindings.local.json`.
Sin esa variable no se asocia ningún curso, ni siquiera el 2. Un ID no asociado recibe
instrucciones para reconocer que no hay información oficial, sin recibir datos de otros cursos.
Para cambiar la asociación, editar `courses` en el archivo; para quitarla, dejar `"courses": {}`.
Reiniciar el backend tras modificar asociaciones. En otro despliegue, configurar expresamente
su propio archivo; no reutilizar el archivo local por defecto.

## Estructura y límites

`src/course-context.ts` carga los JSON y los valida con Zod al iniciar. Una asociación a un
contexto desconocido, datos malformados o enlaces fuera de los or?genes HTTPS permitidos impiden
iniciar con una configuración incorrecta. Para incorporar otro contexto, agregar otro JSON
con un ID único al directorio y asociar únicamente los cursos autorizados.

`src/index.ts` recupera el contexto a partir del `courseId` recibido del PHP autenticado y
construye la instrucción **por solicitud**. El contenido no se incorpora al prompt global.
Se conservan autenticación interna, validación, modelo, reintentos y controles clínicos.
No se envían identidad, nombre ni correo del estudiante como campos adicionales.

Las respuestas sobre introducción, evaluación, enlaces y soporte se generan con Gemini bajo
instrucciones para utilizar exclusivamente los datos oficiales y reconocer datos ausentes.
El nombre/correo personal de la docente, código oficial del curso, video y reglas adicionales
del examen no fueron proporcionados. El tutor no debe inventarlos. El estudiante debe incluir
su nombre completo y código del curso **en su correo a soporte**, no en el chat.

`documents: []` queda reservado para una futura recuperación de documentos autorizados;
actualmente no hay RAG. No se presentan documentos clínicos como fuentes ni se cambia
`grounded: false`. El chat TypeScript y el intermediario PHP mantienen su contrato actual.
No se modifica el libro de calificaciones, el examen ni los recursos originales de Moodle.

## Ejecución y pruebas

Desde la raíz del proyecto:

```powershell
docker compose up -d --build gestion22-ai
docker compose exec -T gestion22-ai npm run check
docker compose cp gestion22-ai-api/tests gestion22-ai:/app/tests
docker compose exec -T gestion22-ai npm test
```

Alternativa desde `gestion22-ai-api`, con Node y npm disponibles:

```powershell
npm.cmd ci
npm.cmd run check
npm.cmd test
```

Prueba real en navegador, con Edge y la dependencia opcional Playwright del plugin:

```powershell
node public/local/gestion22tutor/tests/browser.cjs --course-context
```

Usa las credenciales locales existentes sin imprimirlas y consume consultas reales a Gemini.
Se comprobaron las siete preguntas solicitadas, el mensaje de bienvenida, datos de docente ausentes y enlace de video, una petición de contradecir los datos oficiales y ausencia de filtración hacia el curso 3.
También pasaron cinco pruebas unitarias de validación/aislamiento, tipos del backend y del
frontend, y las pruebas AMD existentes.

Para probar manualmente, entrar con una cuenta autorizada y matriculada al curso local:
`http://localhost:8080/course/view.php?id=2`, abrir Tutor IA y preguntar:

- ¿De qué trata este curso?
- ¿Dónde encuentro la ficha técnica?
- ¿Cómo puedo contactar a la docente?
- ¿Cuánto vale el examen final? → 100 %.
- ¿Las evaluaciones formativas tienen nota? → No inciden en la calificación final.
- ¿Dónde encuentro el examen final?
- ¿A quién escribo si tengo problemas con Moodle?

Debe entregar los enlaces absolutos de producción, remitir preguntas académicas al foro y
problemas técnicos/administrativos a `aulavirtual@gestion22.cl`. No debe inventar datos ausentes.
No hace falta purgar Moodle para cambiar este contexto: lo carga el backend al iniciar.

## Archivos de esta incorporación

Creados: `src/course-context.ts`, `data/course-contexts/heridas-avanzadas.json`,
`config/course-bindings.local.json`, `tests/course-context.test.ts`, `package-lock.json`,
`.dockerignore`, `.gitignore` y este `README.md` dentro del backend.
Modificados: `src/index.ts`, `package.json`, `Dockerfile` y `compose.yaml` de la raíz.
En el plugin: actualizado `tests/browser.cjs`, agregado `tests/course-context-browser.cjs`
y ampliado `README.md`. No se modificó el código frontend ni el endpoint PHP.

El video de introducci?n est? alojado en Vimeo: https://vimeo.com/1216289858?fl=pl&fe=cm . Se incorpor? el enlace proporcionado; no se dispone de transcripci?n ni se infiere el contenido del video.
