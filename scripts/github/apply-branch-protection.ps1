param(
  [string]$Repo = "Timurc390/Boardly",
  [string[]]$Branches = @("main", "master")
)

$payload = @{
  required_status_checks = @{
    strict = $true
    contexts = @(
      "Backend CI / checks",
      "Frontend CI / lint-build",
      "Frontend CI / public-mobile-smoke",
      "Secret Scan / gitleaks"
    )
  }
  enforce_admins = $true
  required_pull_request_reviews = @{
    dismissal_restrictions = @{}
    dismiss_stale_reviews = $true
    require_code_owner_reviews = $false
    required_approving_review_count = 1
    require_last_push_approval = $false
  }
  restrictions = $null
  required_linear_history = $true
  allow_force_pushes = $false
  allow_deletions = $false
  block_creations = $false
  required_conversation_resolution = $true
  lock_branch = $false
  allow_fork_syncing = $false
}

$tmp = New-TemporaryFile
$payload | ConvertTo-Json -Depth 10 | Set-Content -Path $tmp -Encoding UTF8

foreach ($branch in $Branches) {
  Write-Host "Applying protection for ${Repo}:${branch}"
  gh api -X PUT "repos/$Repo/branches/$branch/protection" --input $tmp
  if ($LASTEXITCODE -ne 0) {
    Remove-Item $tmp -Force
    exit $LASTEXITCODE
  }
}

Remove-Item $tmp -Force
