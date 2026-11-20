# Gestión22 Tutor IA

Chat flotante nativo para Moodle 5.3+ (instalación verificada: 5.3+, build 20261030).
Frontend TypeScript estricto y CSS, intermediario PHP y backend Node.js existente sin modificaciones.

## Compilación

Desde `public/local/gestion22tutor`:

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd run typecheck
npm.cmd test
npm.cmd run watch
```

En Linux/macOS usar `npm`. `watch` permanece activo; los otros comandos terminan.
El único código fuente del frontend está en `ts/types.ts`, `ts/api.ts` y `ts/chat.ts`.
`tsc` con `module: amd` y `outFile` reúne los módulos AMD nombrados en
`amd/build/chat.min.js`; el módulo público es `local_gestion22tutor/chat`, con exportación `init`.
El sufijo `.min.js` sigue la convención del cargador Moodle; tsc no minifica.
No se necesita un empaquetador adicional. No editar los archivos generados.
Conservar y distribuir tanto el JavaScript como `chat.min.js.map`: Moodle 5.3 utiliza
el mapa para servir el compilado en desarrollo sin necesitar `amd/src/chat.js`.
El mapa incluye las fuentes TypeScript, que no contienen secretos.

## Docker y configuración

`compose.yaml` monta únicamente el plugin local, de solo lectura, sobre el volumen
`source` de web y cron. No sustituye datos de Moodle. PHP recibe `INTERNAL_API_TOKEN`
desde el `.env` raíz ignorado por Git. Se reutilizó el valor del `.env` del backend,
sin copiar la clave Gemini. Si se rota el token, mantener ambos valores sincronizados.
El navegador solo recibe endpoint Moodle, curso, sesskey y opciones de interfaz.

Desde la raíz del proyecto:

```powershell
docker compose up -d web cron
docker compose exec -T -u www-data web php admin/cli/upgrade.php --non-interactive
docker compose exec -T -u www-data web php admin/cli/purge_caches.php
```

La actualización y la purga ya se ejecutaron durante esta implementación.
También se puede purgar desde Administración del sitio > Desarrollo > Purgar cachés.
La opción del plugin en Administración del sitio > Plugins > Plugins locales permite deshabilitarlo.

## Seguridad y comportamiento

El hook de cabecera registra CSS antes de generar recursos. El hook de pie inserta
un contenedor único y carga `init` con `js_call_amd`.
Se exige usuario autenticado, matrícula activa y `local/gestion22tutor:use` en el curso.
Se excluyen invitados y portada. PHP repite las comprobaciones en cada POST,
verifica sesskey y limita preguntas a 3–2000 caracteres.
La sesión se libera antes de esperar al modelo. Timeout PHP: 90 segundos;
frontend configurable: 95 segundos por defecto. Se deshabilita enviar durante la consulta.
Errores de HTTP, conexión y timeout permiten reintentar sin perder la pregunta.

Moodle bloquea normalmente URLs internas. Solo el cliente del endpoint fijo
`http://gestion22-ai:3001/api/chat` omite esa lista; no admite URLs del navegador
ni sigue redirecciones. No se modificó la política global de Moodle.
Respuestas y errores se insertan con nodos de texto. No se ejecuta HTML de Gemini.
No hay persistencia de conversaciones ni envío de identidad de usuario al modelo.
El proveedor de privacidad declara el envío del texto de preguntas al servicio externo.
No hay RAG: se mantienen `sources: []` y `grounded: false`.

## Archivos

Creados: `package.json`, `package-lock.json`, `tsconfig.json`, `.gitignore`,
`ts/types.ts`, `ts/api.ts`, `ts/chat.ts`, `amd/build/chat.min.js`,
`amd/build/chat.min.js.map`, `chat.php`, `styles.css`, `db/hooks.php`,
`classes/local/hook_callbacks.php`, `tests/amd.test.cjs`, `tests/integration.php`.
Actualizados: `index.php`, `version.php`, `classes/privacy/provider.php`,
`lang/en/local_gestion22tutor.php`, `lang/es/local_gestion22tutor.php`, este README,
`compose.yaml` y el `.env` raíz (solo token interno; no publicar).
Se conservaron `settings.php`, `db/access.php` y el backend Gemini.

## Verificaciones realizadas

- Instalación de dependencias: sin vulnerabilidades reportadas.
- Compilación y typecheck estrictos: correctos.
- Tres pruebas Node: exportación y dependencias AMD, validación de datos,
  campos POST, curso de respuesta, errores 429/502/503 y timeout.
- Sintaxis de todos los archivos PHP: correcta.
- Registro/upgrade del plugin y purga de cachés: correctos.
- Hook con usuario matriculado en curso 2 y descubrimiento AMD: correctos.
- Módulo servido por HTTP en desarrollo y producción: correcto.
- HTTP GET al endpoint devuelve 405; POST anónimo devuelve 401.
- Integración CLI con sesión Moodle: rechazo de CSRF inválido, invitado,
  portada no permitida y pregunta demasiado corta.
- Health interno desde PHP: HTTP 200.
- Consulta real con usuario matriculado, atravesando `chat.php` y backend existente:
  respuesta correcta de Gemini, curso 2, `grounded: false`.

Repetir pruebas de integración (no crean usuarios; requieren matrícula con permiso en curso 2):

```powershell
docker compose exec -T -u www-data web php public/local/gestion22tutor/tests/integration.php hook
docker compose exec -T -u www-data web php public/local/gestion22tutor/tests/integration.php network
docker compose exec -T -u www-data web php public/local/gestion22tutor/tests/integration.php csrf
docker compose exec -T -u www-data web php public/local/gestion22tutor/tests/integration.php guest
docker compose exec -T -u www-data web php public/local/gestion22tutor/tests/integration.php permission
docker compose exec -T -u www-data web php public/local/gestion22tutor/tests/integration.php validation
docker compose exec -T -u www-data web php public/local/gestion22tutor/tests/integration.php gemini
```

La última prueba consume una consulta real al proveedor.
No se realizó una prueba visual en navegador autenticado ni con un teléfono real.
Verificar manualmente con un estudiante matriculado:
`http://localhost:8080/course/view.php?id=2` o
`http://localhost:8080/local/gestion22tutor/index.php?courseid=2`.
Abrir/cerrar, Escape y retorno de foco, enviar una pregunta y revisar el diseño
con ancho móvil. El historial se mantiene únicamente durante la página actual.

## Correcci?n del panel de ayuda de Boost

El hook de pie de Moodle 5.3 aparece dentro del contenido que Boost copia al abrir su panel de ayuda. El chat ahora mueve su contenedor a `document.body` antes de renderizar; as? conserva eventos y no se duplica. El CSS lo sit?a sobre el popover y separado del bot?n de ayuda. Fuentes y compilados actualizados, cach?s purgadas.

Prueba de regresi?n opcional con Edge instalado, desde el directorio del plugin:

```powershell
npm.cmd install --no-save --package-lock=false playwright
node tests/browser.cjs
```

La prueba usa la contrase?a administradora del `.env` local, sin imprimirla ni guardarla, y consume una consulta real a Gemini. Genera capturas en `.cache/` de la ra?z del proyecto.

## Contexto introductorio oficial por curso

El backend incorpora ahora el contexto oficial de Manejo Avanzado de Heridas, con una
asociación explícita del curso local 2 en `gestion22-ai-api/config/course-bindings.local.json`.
El contexto se selecciona en cada solicitud a partir del curso que PHP ya ha autorizado.
No se aplica a otros cursos y no modifica evaluaciones ni recursos. Los enlaces siguen
apuntando al aula de producción. Instrucciones y pruebas en `gestion22-ai-api/README.md`.

## Apartado visible «Introducción»

Se creó en el curso local 2 una sección Moodle nativa en primera posición tras General,
con bienvenida, sistema de evaluación, soporte y cuatro recursos URL. Los enlaces al aula
original se identifican como «aula de producción» y el video como Vimeo. No se crea un
examen ni un foro nuevo: son enlaces a los originales. No se reemplazan secciones existentes.

Acceso directo local: http://localhost:8080/course/section.php?id=6

La preparación se realiza con `cli/create_introduction.php`, solo desde CLI y con una
asociación explícita que debe coincidir con el curso y la URL de la instalación. Al repetirlo
reconoce la sección creada y no duplica ni sobrescribe su contenido.

```powershell
docker compose cp gestion22-ai-api/data/course-contexts/heridas-avanzadas.json web:/tmp/gestion22-introduction.json
docker compose cp gestion22-ai-api/config/course-bindings.local.json web:/tmp/gestion22-bindings.json
docker compose exec -T -u www-data web php public/local/gestion22tutor/cli/create_introduction.php --courseid=2 --context=/tmp/gestion22-introduction.json --bindings=/tmp/gestion22-bindings.json
node public/local/gestion22tutor/tests/browser.cjs --introduction
```

Comprobado con sesión iniciada: sección visible en índice lateral, título del curso,
bienvenida, ponderación del examen, correo de soporte y los cuatro recursos. El script
verifica que la cantidad de exámenes y de elementos de calificación permanezca igual.

### Presentación del curso integrada

La sección Introducción ahora comienza con «Presentación del Curso» y un iframe nativo
Vimeo para el video 1216289858, adaptable en proporción 16:9, con pantalla completa y
sin reproducción automática. Debajo conserva el enlace «Abrir el video en Vimeo»,
la bienvenida, evaluación, soporte y los recursos originales.

Para aplicar expresamente este diseño a la sección ya creada se utiliza el mismo comando
CLI con `--update`. Esta opción actualiza el resumen de esa sección; úsala solamente cuando
se quiera regenerar su contenido desde el contexto oficial. No duplica los recursos existentes.

```powershell
docker compose exec -T -u www-data web php public/local/gestion22tutor/cli/create_introduction.php --courseid=2 --context=/tmp/gestion22-introduction.json --bindings=/tmp/gestion22-bindings.json --update
```

Verificado en navegador: iframe presente y visible, URL correcta, proporción 16:9 en
escritorio y móvil, sin desbordamiento horizontal. Vimeo restringió la conexión automatizada
del entorno de prueba ("We couldn't verify the security of your connection"); por ello no
se confirmó la reproducción desde ese entorno. El enlace directo queda disponible como
alternativa y no se alteró la configuración de privacidad del video.

### Formato seguro de respuestas del Tutor IA

`ts/format.ts` interpreta un subconjunto de Markdown con nodos DOM: negritas, cursivas,
párrafos, saltos de línea, listas, código en línea y enlaces. Los enlaces aceptan únicamente
HTTP, HTTPS o mailto y abren con `noopener noreferrer`. HTML generado se conserva como
texto; no se utiliza `innerHTML` ni se aceptan enlaces javascript/data. Los mensajes del
estudiante conservan su texto literal. No se agregaron dependencias de frontend.

Se actualizaron `ts/chat.ts`, `styles.css`, los compilados AMD y los mapas de fuentes.
Pasaron compilación, tipos, pruebas AMD y la prueba de navegador con respuestas simuladas
que verifica formato, enlaces oficiales, diseño móvil y rechazo de HTML/enlaces peligrosos.

```powershell
node public/local/gestion22tutor/tests/browser.cjs --formatting
```

### Enlace del tutor al video dentro de Introducción

El intermediario PHP resuelve las recomendaciones del video oficial a la sección Introducción
del mismo curso. `classes/local/course_navigation.php` comprueba que la sección asociada
sea accesible al usuario y sustituye únicamente la URL del video registrado para ese curso.
Los recursos de producción y otros videos conservan sus enlaces originales. La fuente oficial
mantiene la URL Vimeo y el reproductor sigue integrado en la sección.

El script de preparación guarda `introductionvideo_ID` junto con `introductionsection_ID`.
Se verificó una respuesta real de Gemini, el enlace renderizado y su apertura en la sección
local con el reproductor. Pruebas:

```powershell
docker compose exec -T -u www-data web php public/local/gestion22tutor/tests/integration.php navigation
node public/local/gestion22tutor/tests/browser.cjs --video-navigation
```

Los mensajes que ya estaban abiertos conservan su contenido en memoria; volver a consultar
para recibir el enlace actualizado.

## Módulo 1 interactivo

La primera sección vacía después de Introducción del curso local 2 se llama ahora Módulo 1.
Incluye una experiencia TypeScript con cuatro videos originales, seis actividades formativas,
progreso local y ayuda del Tutor IA. Está en vista previa docente hasta la revisión clínica
requerida por el prompt. Documentación completa, archivos, comandos y límites de pruebas:
[MODULE1.md](MODULE1.md).
