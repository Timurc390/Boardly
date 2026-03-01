param(
  [string]$Repo = "Timurc390/Boardly"
)

gh api -X PATCH "repos/$Repo" `
  -f security_and_analysis.secret_scanning.status=enabled `
  -f security_and_analysis.secret_scanning_push_protection.status=enabled `
  -f security_and_analysis.dependabot_security_updates.status=enabled
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}
