# Run after: docker compose up -d --build (from the TaskFlow root).
$ErrorActionPreference = 'Stop'
$base = 'http://localhost:3000'
$direct = 'http://localhost:8080'

Write-Host '1) Docker services:' -ForegroundColor Cyan
docker compose ps
if ($LASTEXITCODE -ne 0) { throw 'Docker Compose is not available.' }

Write-Host '2) API health via direct and Nginx reverse proxy:' -ForegroundColor Cyan
foreach ($url in @("$direct/health", "$base/health")) {
  $health = Invoke-RestMethod -Uri $url
  if ($health.status -ne 'ok') { throw "Health failed: $url" }
  Write-Host "PASS: $url -> $($health.status)"
}

Write-Host '3) GET /items from PostgreSQL via Nginx:' -ForegroundColor Cyan
$items = Invoke-RestMethod -Uri "$base/items"

if ($items.Count -lt 4) {
    throw 'Expected four seeded items.'
}

Write-Host "PASS: $($items.Count) items"

Write-Host '4) Real POST + Idempotency-Key replay and cleanup:' -ForegroundColor Cyan
$key = [guid]::NewGuid().ToString()
$headers = @{ 'Idempotency-Key' = $key }
$payload = @{ title = 'Docker smoke test' } | ConvertTo-Json -Compress
$createdId = $null
try {
  $first = Invoke-RestMethod -Uri "$base/tasks" -Method Post -ContentType 'application/json' -Headers $headers -Body $payload
  $createdId = $first.id
  $second = Invoke-RestMethod -Uri "$base/tasks" -Method Post -ContentType 'application/json' -Headers $headers -Body $payload
  if ($first.id -ne $second.id) { throw 'Idempotency is broken.' }
  Write-Host "PASS: same task id $createdId for repeated POST"
  $updated = Invoke-RestMethod -Uri "$base/tasks/$createdId" -Method Patch -ContentType 'application/json' -Body (@{title='Docker smoke test edited'} | ConvertTo-Json)
  if ($updated.title -ne 'Docker smoke test edited') { throw 'PATCH failed.' }
  Write-Host 'PASS: PATCH'
} finally {
  if ($null -ne $createdId) {
    try {
      Invoke-RestMethod -Uri "$base/tasks/$createdId" -Method Delete | Out-Null
      Write-Host 'PASS: DELETE cleanup'
    } catch { Write-Warning "Cleanup failed for task id $createdId : $_" }
  }
}

Write-Host '5) PostgreSQL table:' -ForegroundColor Cyan
docker compose exec -T db psql -U taskflow -d taskflow -c 'SELECT COUNT(*) AS task_count FROM tasks;'
if ($LASTEXITCODE -ne 0) { throw 'Database command failed.' }
Write-Host 'ALL CHECKS PASSED (local machine)' -ForegroundColor Green
