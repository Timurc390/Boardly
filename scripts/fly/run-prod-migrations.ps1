param(
  [string]$BackendApp = "boardly-backend",
  [string]$FlyctlPath = "flyctl"
)

function Resolve-Flyctl {
  param([string]$Candidate)

  $cmd = Get-Command $Candidate -ErrorAction SilentlyContinue
  if ($cmd) {
    return $cmd.Source
  }

  $wingetPath = Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Packages\Fly-io.flyctl_Microsoft.Winget.Source_8wekyb3d8bbwe\flyctl.exe"
  if (Test-Path $wingetPath) {
    return $wingetPath
  }

  throw "flyctl was not found. Install it or pass -FlyctlPath."
}

$flyctl = Resolve-Flyctl -Candidate $FlyctlPath

Write-Host "Running migrations on Fly app '$BackendApp'..."
& $flyctl ssh console --app $BackendApp --command "cd /app && python manage.py migrate --noinput"
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Host "Verifying migration core.0023 is applied..."
$showMigrationsOutput = & $flyctl ssh console --app $BackendApp --command "cd /app && python manage.py showmigrations core"
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

$showMigrationsText = ($showMigrationsOutput -join "`n")
if ($showMigrationsText -notmatch "\[X\]\s+0023") {
  Write-Error "Migration core.0023 is not marked as applied."
  exit 1
}

Write-Host "Migration core.0023 is applied."
