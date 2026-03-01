param(
  [string]$BackendApp = "boardly-backend",
  [string]$FrontendApp = "boardly-frontend",
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

function Get-RequiredSecret {
  param([string]$Name)

  $value = [Environment]::GetEnvironmentVariable($Name)
  if ([string]::IsNullOrWhiteSpace($value)) {
    throw "Missing required environment variable: $Name"
  }
  return $value
}

function Get-OptionalSecret {
  param([string]$Name)

  $value = [Environment]::GetEnvironmentVariable($Name)
  if ([string]::IsNullOrWhiteSpace($value)) {
    return $null
  }
  return $value
}

$flyctl = Resolve-Flyctl -Candidate $FlyctlPath

$requiredBackendSecrets = @(
  "SENTRY_DSN",
  "SENTRY_TRACES_SAMPLE_RATE",
  "CHANNEL_REDIS_URL"
)
$optionalBackendSecrets = @(
  "EMAIL_HOST_USER",
  "EMAIL_HOST_PASSWORD",
  "DEFAULT_FROM_EMAIL"
)
$requiredFrontendSecrets = @(
  "REACT_APP_SENTRY_DSN",
  "REACT_APP_SENTRY_ENV",
  "REACT_APP_SENTRY_TRACES_SAMPLE_RATE"
)

$backendSetArgs = @()
foreach ($name in $requiredBackendSecrets) {
  $backendSetArgs += "$name=$(Get-RequiredSecret -Name $name)"
}

$appliedOptionalBackend = @()
foreach ($name in $optionalBackendSecrets) {
  $value = Get-OptionalSecret -Name $name
  if ($null -ne $value) {
    $backendSetArgs += "$name=$value"
    $appliedOptionalBackend += $name
  }
}

$frontendSetArgs = @()
foreach ($name in $requiredFrontendSecrets) {
  $frontendSetArgs += "$name=$(Get-RequiredSecret -Name $name)"
}

Write-Host "Updating Fly backend secrets for app '$BackendApp'..."
& $flyctl secrets set --app $BackendApp @backendSetArgs
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Host "Updating Fly frontend secrets for app '$FrontendApp'..."
& $flyctl secrets set --app $FrontendApp @frontendSetArgs
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

if ($appliedOptionalBackend.Count -gt 0) {
  Write-Host "Also updated optional SMTP-related backend secrets: $($appliedOptionalBackend -join ', ')"
} else {
  Write-Host "Optional SMTP-related backend secrets were not provided in the current environment."
}

Write-Host "Done."
