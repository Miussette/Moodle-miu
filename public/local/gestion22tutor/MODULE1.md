# Módulo 1 · Gestión22 Interactive Learning

Implementado como complemento del plugin existente, con TypeScript estricto, CSS y PHP.
La primera sección vacía posterior a Introducción del curso local 2 ahora se llama **Módulo 1**
(ID de sección local: 2) y contiene el acceso a la experiencia interactiva.

- Curso: http://localhost:8080/course/view.php?id=2
- Experiencia: http://localhost:8080/local/gestion22tutor/module1.php?courseid=2
- Revisión docente: http://localhost:8080/local/gestion22tutor/review_module1.php?courseid=2

## Alcance académico y publicación

Las seis actividades son formativas y no calificadas. Los contenidos, opciones, decisiones
correctas y explicaciones están en `gestion22-ai-api/data/module1.json`, basados en el prompt suministrado.
Gemini no determina respuestas correctas ni evalúa las decisiones del caso.

El contenido clínico **queda en vista previa docente**, porque el prompt exige revisión antes
de publicarlo a estudiantes. Una cuenta matriculada con `local/gestion22tutor:manage` puede
revisar todas las actividades y luego aprobar desde «Revisión docente y publicación del módulo».
El formulario exige sesskey y guarda la aprobación únicamente para ese curso y para el hash
del contenido revisado. Un cambio del JSON invalida la aprobación y vuelve a exigir revisión.
No se ha marcado el material como clínicamente aprobado durante la implementación.

Las cuentas sin matrícula, sin capacidad de uso o de cursos sin asociación no acceden.
Antes de la aprobación se exige además la capacidad de gestión. Se conserva el contrato
seguro navegador → PHP → backend interno; el navegador no recibe secretos.

## Actividades

1. **Anatomía**: diagrama propio con capas seleccionables, componentes, funciones y tres
   preguntas de comprensión con retroalimentación. No se copian imágenes oficiales.
2. **Riesgos**: seis asociaciones accesibles mediante selectores, feedback y reintento;
   se explicita que son ejemplos simplificados y no diagnósticos deterministas.
3. **Valoración**: esquema SVG propio con vistas frontal/posterior y nueve zonas seleccionables;
   hallazgos ficticios, leyenda textual y colores, observaciones y zonas de especial atención.
4. **Checklist**: paciente/evaluador ficticios, fecha, servicio simulado, quince aspectos,
   ubicación, observaciones, plan y reevaluación. Validación, confirmación de datos ficticios,
   resumen, reinicio y exportación `.txt` marcada **SIMULACIÓN EDUCATIVA — NO VÁLIDA COMO
   REGISTRO CLÍNICO**. Los textos del formulario no se guardan ni se envían al tutor.
5. **Caso ramificado**: escenario ficticio SIM-076 con cinco etapas; decisiones erróneas
   llevan a reflexión, las correctas permiten avanzar. Permite volver, revisar y reiniciar.
6. **Autoevaluación**: seis preguntas de selección, verdadero/falso, asociación, identificación
   anatómica y situación simulada; explicación, resumen y recomendaciones de repaso.

Los títulos de materiales complementarios se conservan como referencia y se informa que
no se dispone de sus PDF. No se inventa su contenido completo ni se intenta acceder a recursos
protegidos de producción. Los originales no se modifican.

## Videos y progreso

Se utilizan exclusivamente los reproductores oficiales de Vimeo:
1216493119, 1216599778, 1216599800 y 1216720782. Se conservan los enlaces originales como
alternativa ante restricciones. El SDK oficial se solicita a través del cargador AMD de Moodle;
se observan `play`, `pause`, `timeupdate`, `ended` y `error` cuando Vimeo permite conectarse.

Cada video se marca como visto al cubrir al menos el **80% de su duración** mediante
tramos reproducidos (`getPlayed()` y `getDuration()` del SDK de Vimeo). Los intervalos se
unen sin contar repeticiones y se conservan al recargar. Adelantar la posición o recibir
`ended` no completa por sí solo el video. No existe confirmación manual. Si Vimeo no
permite verificar el avance, el video permanece pendiente. Las marcas de videos del
formato anterior se descartan; el avance de ejercicios se conserva. El registro sigue
siendo local al navegador y no constituye una finalización oficial en Moodle.

Los cuatro videos tienen `segments: []`: no se inventaron marcas de tiempo ni correspondencias
temáticas entre actividades y videos. Tras cada finalización o confirmación se ofrecen las
actividades generales del módulo. En el futuro, solo después de validar los segmentos,
se pueden configurar `{ "atSeconds": 120, "activityId": "anatomy" }` (ejemplo de formato,
no marca temporal existente). El controlador permite pausar, abrir la actividad y continuar
el video al completarla.

El avance usa localStorage con clave por sitio/cuenta/curso (sin el ID de usuario en claro).
Guarda únicamente estados de videos, IDs/estados de actividades e IDs de preguntas respondidas;
no guarda hallazgos, nombres, observaciones, planes ni texto de consultas. Si el almacenamiento
falla, continúa en memoria. No es una acreditación oficial de asistencia ni una calificación.

## Tutor IA

Los botones de ayuda abren el chat existente y preparan una pregunta, sin enviarla automáticamente.
El estudiante revisa y pulsa Enviar. Solo se transmiten curso, pregunta, ID de actividad y
concepto de una lista cerrada; PHP valida matrícula, capacidades y acceso a la vista previa.
No se incluyen los valores del checklist ni de la valoración.

`gestion22-ai-api/src/module1-context.ts` selecciona fragmentos de `tutorContexts` del JSON
compartido en montaje de solo lectura, solo para el contexto de curso explícitamente asociado.
Se mantiene `grounded: false`: no hay RAG ni transcripciones/PDF procesados. Se conservan las
advertencias clínicas y la protección de evaluaciones oficiales. PHP limita a 20 consultas
por minuto por sesión autenticada, sin registrar las preguntas.

## Archivos y compilación

Nuevos: `module1.php`, `review_module1.php`, `module1.css`,
`classes/local/module1_access.php`, `cli/setup_module1.php`, `tsconfig.module1.json`,
`ts/module1/{types,dom,progress,question,main,video-player,anatomy,risk-factors,skin-assessment,
clinical-checklist,branching-case,quiz-practice}.ts`, compilado `amd/build/module1.min.js`
y su mapa, pruebas `tests/module1.test.cjs`, `tests/module1-browser.cjs`, `tests/module1-access.php`.
Backend: `src/module1-context.ts`, `data/module1.json` y `tests/module1.test.ts`.

Actualizados: `chat.php`, `ts/{chat,api,types}.ts`, compilados del chat, `package.json`,
`tsconfig.json`, `tests/browser.cjs`, `compose.yaml` y `gestion22-ai-api/src/index.ts`.

Desde el directorio del plugin:

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd run typecheck
npm.cmd test
npm.cmd run watch:module1
```

El último comando permanece activo. El chat y Módulo 1 se compilan a bundles AMD separados
con módulos nombrados y sus mapas; no se escribe JavaScript de producción manualmente.
Se carga `local_gestion22tutor/module1` mediante `js_call_amd`. No se agregaron frameworks
ni dependencias de frontend. El SDK de Vimeo es externo y opcional para verificar reproducción.

Preparación explícita del curso local, desde la raíz:

```powershell
docker compose cp gestion22-ai-api/config/course-bindings.local.json web:/tmp/gestion22-bindings.json
docker compose exec -T -u www-data web php public/local/gestion22tutor/cli/setup_module1.php --courseid=2 --bindings=/tmp/gestion22-bindings.json
docker compose up -d --build gestion22-ai
docker compose exec -T -u www-data web php admin/cli/purge_caches.php
```

El script reutiliza únicamente una sección vacía posterior a Introducción, conserva secciones
con contenido y reconoce la configuración ya creada al repetirlo. Verifica que no cambien
los registros de evaluaciones, elementos de calificación ni restricciones preexistentes.
No se modifica el curso de producción, la evaluación diagnóstica, el quiz ni el examen final.

## Pruebas ejecutadas y límites

- Compilación y tipos de ambos bundles TypeScript: correctos.
- Seis pruebas Node del frontend: correctas; incluyen AMD, datos runtime, progreso y almacenamiento.
- Tipos backend y siete pruebas de contexto: correctos; incluyen separación entre cursos/actividades.
- Sintaxis de archivos PHP: correcta.
- Preparación repetida: sin duplicados y con comprobación de conservación de evaluaciones/restricciones.
- Navegador autenticado: sección en índice lateral, página, cuatro iframes/enlaces, anatomía,
  asociaciones, valoración, validación/exportación, ramas del caso, autoevaluación y móvil: correctos.
- Consulta real de actividad → PHP → Gemini: correcta; `grounded: false`, sin datos del checklist.
- Vista previa docente y rechazo de curso no asociado: correctos. No había una cuenta estudiante
  matriculada de prueba; no se afirma haber ejecutado la prueba de denegación con ese rol.
- Vimeo real: los cuatro reproductores resultaron **no verificables desde el entorno automatizado**;
  no se confirmó reproducción ni eventos reales. Se comprobó el camino de error y la revisión
  autodeclarada, y se conservan alternativas externas. No se modificó privacidad ni se evadieron
  restricciones de Vimeo. Se requiere comprobación de reproducción en un navegador normal.
- No se aprobaron/publicaron contenidos clínicos a estudiantes, ni se utilizó un teléfono físico.

Pruebas de navegador (requieren Edge y la instalación opcional Playwright ya descrita en README):

```powershell
node public/local/gestion22tutor/tests/browser.cjs --module1
node public/local/gestion22tutor/tests/browser.cjs --module1-vimeo
docker compose exec -T -u www-data web php public/local/gestion22tutor/tests/module1-access.php
```

La primera consume una consulta real a Gemini. Las capturas de escritorio y móvil se guardan
en `.cache/` de la raíz. Para cambios del JSON, reiniciar `gestion22-ai` para recargar fragmentos
y volver a realizar revisión docente si se pretende habilitar el contenido a estudiantes.

El JSON educativo se monta fuera del webroot en `/var/www/gestion22-content/module1.json`, mediante `GESTION22_MODULE1_CONTENT_FILE`, y se comparte con el backend en modo de solo lectura. No se sirve como recurso JSON público; Moodle lo incorpora en la página solo después de comprobar permisos y revisión.
# Accesos rápidos en el índice del curso

`cli/setup_module1.php` crea recursos URL nativos independientes para los cuatro
videos, valoración cutánea, anatomía, checklist, prevención, caso ficticio,
materiales complementarios y autoevaluación. Cada recurso abre el apartado
correspondiente y mueve el foco al contenido. Conserva el recorrido completo.
La ejecución repetida no duplica recursos ni cambia restricciones existentes.

«Quiz Módulo 1 (aula de producción)» abre
`https://aulavirtual.gestion22.cl/mod/quiz/view.php?id=24059`, según la elección
explícita del usuario. No copia preguntas, intentos ni calificaciones al Moodle
local; el aula de producción aplica sus propios permisos. Los materiales sin
archivo original continúan siendo descripciones, no descargas ficticias.

Verificación: `node tests/browser.cjs --module1-quicklinks`.

