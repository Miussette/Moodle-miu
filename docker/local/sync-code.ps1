$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$archivePath = Join-Path ([System.IO.Path]::GetTempPath()) ('moodle-source-' + [guid]::NewGuid().ToString('N') + '.tar')
Push-Location $projectRoot
try {
    & git archive --format=tar "--output=$archivePath" HEAD
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo empaquetar el código.' }
    & docker compose cp $archivePath web:/tmp/moodle-source.tar
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo copiar el código a Docker.' }
    & docker compose exec -T web tar -xf /tmp/moodle-source.tar -C /var/www/html
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo extraer el código.' }
    & docker compose exec -T web rm /tmp/moodle-source.tar
    $changedFiles = @(& git -c core.quotepath=false diff --name-only --diff-filter=ACMRT HEAD)
    $changedFiles += @(& git -c core.quotepath=false ls-files --others --exclude-standard)
    $changedFiles += 'config.php'
    foreach ($relativePath in ($changedFiles | Sort-Object -Unique)) {
        if (-not $relativePath) { continue }
        $hostFile = Join-Path $projectRoot $relativePath
        if (-not (Test-Path -LiteralPath $hostFile -PathType Leaf)) { continue }
        $containerFile = '/var/www/html/' + $relativePath.Replace('\', '/')
        $containerParent = $containerFile.Substring(0, $containerFile.LastIndexOf('/'))
        & docker compose exec -T web mkdir -p $containerParent
        if ($LASTEXITCODE -ne 0) { throw "No se pudo crear $containerParent" }
        & docker compose cp $hostFile "web:$containerFile"
        if ($LASTEXITCODE -ne 0) { throw "No se pudo copiar $relativePath" }
    }
    Write-Host 'Código sincronizado con Docker.'
} finally {
    Pop-Location
    if (Test-Path -LiteralPath $archivePath) { Remove-Item -LiteralPath $archivePath }
}
