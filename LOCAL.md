# Moodle local en Windows

Requiere Docker Desktop iniciado con contenedores Linux.

Desde PowerShell, en esta carpeta:

```powershell
docker compose up -d --build
powershell -ExecutionPolicy Bypass -File docker/local/sync-code.ps1
docker compose exec web composer install --no-dev --classmap-authoritative
```

Abre http://localhost:8080 e inicia sesión con el usuario `admin`.
La contraseña inicial está guardada como `MOODLE_ADMIN_PASSWORD` en `.env`.
El correo inicial es `admin@example.com`: cámbialo en el perfil.

La base de datos usa MariaDB 11.4 y PHP usa la versión 8.3.
Las contraseñas de la base de datos están en `.env`, que se excluye de Git.
El código se sirve desde `public`; los archivos subidos, la base de datos y las dependencias se guardan en volúmenes separados.
El servicio `cron` ejecuta las tareas programadas cada minuto.

Para evitar la lentitud de las carpetas compartidas de Windows, el código se ejecuta desde un volumen Docker. Después de editar archivos aquí, sincronízalos:

```powershell
powershell -ExecutionPolicy Bypass -File docker/local/sync-code.ps1
```

La sincronización copia archivos nuevos y modificados; los archivos eliminados del equipo deben eliminarse también del contenedor.

Para detener y volver a iniciar sin borrar los datos:

```powershell
docker compose stop
docker compose start
```

Para ejecutar tareas programadas durante las pruebas:

```powershell
docker compose exec --user www-data web php admin/cli/cron.php
```

Este entorno está configurado exclusivamente para desarrollo local.
