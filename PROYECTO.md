# Moodle Gestión22 con Tutor IA

Este repositorio contiene el código completo de Moodle 5.3 del proyecto, el plugin `local_gestion22tutor`, su API Gemini, la configuración Docker y la plantilla reutilizable Aula Verde. La documentación del tutor está en [TUTOR-IA-FUNCIONAMIENTO.md](TUTOR-IA-FUNCIONAMIENTO.md).

## Contenido

- Moodle: código en la raíz y `public/`.
- Tutor Moodle: `public/local/gestion22tutor/`.
- API Node/Gemini: `gestion22-ai-api/`.
- Entorno local: `compose.yaml`, `docker/local/` y `LOCAL.md`.
- Plantilla editable: `plantilla-moodle/` y `plantilla-moodle.zip`.

No se incluyen credenciales, `.env` privados, `config.php` local, `node_modules`, `vendor`, cachés, base de datos ni volúmenes de archivos subidos. Los PDF e imágenes que forman parte del material del tutor sí están incluidos. El repositorio contiene una instantánea del código, sin importar todo el historial de desarrollo del repositorio oficial de Moodle.

## Preparar una copia nueva

Requiere Git, Docker Desktop con contenedores Linux y PowerShell en Windows.

```powershell
git clone https://github.com/Miussette/Moodle-miu.git
cd Moodle-miu
Copy-Item .env.example .env
Copy-Item gestion22-ai-api/.env.example gestion22-ai-api/.env
Copy-Item docker/local/config.example.php config.php
```

Edita ambos `.env`: define contraseñas propias, configura `GEMINI_API_KEY` y usa el mismo `INTERNAL_API_TOKEN` en ambos archivos. No publiques esos archivos.

```powershell
docker compose up -d --build web
powershell -ExecutionPolicy Bypass -File docker/local/sync-code.ps1
docker compose exec web composer install --no-dev --classmap-authoritative
```

Abre http://localhost:8080 y completa el instalador de Moodle para una base nueva. `MOODLE_ADMIN_PASSWORD` en el archivo de entorno es una referencia para la configuración local: no crea automáticamente un administrador ni establece su contraseña al arrancar Docker. En una base ya instalada, usa las credenciales existentes.

Cuando Moodle esté instalado:

```powershell
docker compose up -d --build gestion22-ai cron
```

El tutor requiere además habilitar el plugin, asignar matrícula y permisos y configurar el contexto del curso correcto. El ID 2 del archivo de asociaciones es específico del entorno original: no demuestra que el curso 2 de otra base sea el mismo. Consulta [TUTOR-IA-FUNCIONAMIENTO.md](TUTOR-IA-FUNCIONAMIENTO.md) y los README del plugin y la API antes de asociar cursos o publicar materiales.

## Instalar la plantilla de diseño

Con Moodle instalado y Docker activo:

```powershell
powershell -ExecutionPolicy Bypass -File plantilla-moodle/INSTALAR-LOCAL.ps1
```

El instalador activa Aula Verde y crea un curso de ejemplo oculto. El CSS se puede editar desde la configuración del tema en Moodle o desde `plantilla-moodle/theme/aulaverde/custom.css`. Más detalles en [plantilla-moodle/README.md](plantilla-moodle/README.md).

Para reproducir exactamente los cursos y usuarios de una instalación existente se necesita una copia independiente de su base de datos y de `moodledata`; esos datos no forman parte de este repositorio.
