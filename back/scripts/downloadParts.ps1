$ErrorActionPreference = 'Stop'
$catalogRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\.local\buildcores'))
New-Item -ItemType Directory -Path $catalogRoot -Force | Out-Null
$commit = Invoke-RestMethod -Uri 'https://api.github.com/repos/buildcores/buildcores-open-db/commits/main' -TimeoutSec 30
$revision = [string]$commit.sha
if ($revision -notmatch '^[a-f0-9]{40}$') { throw 'Invalid source revision' }
$archive = Join-Path $catalogRoot "$revision.tar.gz"
if (-not (Test-Path -LiteralPath $archive)) {
    Invoke-WebRequest -Uri "https://codeload.github.com/buildcores/buildcores-open-db/tar.gz/$revision" -OutFile $archive -TimeoutSec 180
}
$sourceRoot = Join-Path $catalogRoot "buildcores-open-db-$revision"
$entries = & tar -tzf $archive
if ($LASTEXITCODE -ne 0) { throw 'Cannot read source archive' }
foreach ($entry in $entries) {
    if ($entry -notlike "buildcores-open-db-$revision/*" -or $entry -match '(^|/)\.\.(/|$)' -or $entry.Contains('\')) { throw 'Unsafe archive path' }
}
& tar -xzf $archive -C $catalogRoot
if ($LASTEXITCODE -ne 0) { throw 'Cannot extract source archive' }
@{ revision = $revision; downloadedAt = [DateTime]::UtcNow.ToString('o'); sourceRoot = $sourceRoot; source = 'https://github.com/buildcores/buildcores-open-db'; sha256 = (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $catalogRoot 'source.json') -Encoding utf8
Get-ChildItem -LiteralPath (Join-Path $sourceRoot 'open-db') -Directory | ForEach-Object {
    [PSCustomObject]@{ category = $_.Name; files = @(Get-ChildItem -LiteralPath $_.FullName -Filter '*.json' -File).Count }
} | Format-Table -AutoSize
Write-Output "Source revision: $revision"
