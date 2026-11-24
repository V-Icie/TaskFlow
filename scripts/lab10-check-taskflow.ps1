# Run with TaskFlow service port-forward active in a separate terminal.
param([ValidateRange(1,65535)][int]$Port = 8082)
$ErrorActionPreference = 'Stop'
$base = "http://127.0.0.1:$Port"
$health = Invoke-RestMethod "$base/health"
if ($health.status -ne 'ok') { throw 'Health failed' }
Write-Host 'PASS: health'
$items = Invoke-RestMethod "$base/items"
if ($items.Count -lt 4) { throw 'Expected seeded items' }
Write-Host "PASS: $($items.Count) items"
$key = [guid]::NewGuid().ToString()
$headers = @{'Idempotency-Key' = $key}
$body = @{title='Lab10 Kubernetes smoke test'} | ConvertTo-Json -Compress
$task = $null
try {
    $task = Invoke-RestMethod "$base/tasks" -Method Post -Headers $headers -ContentType 'application/json' -Body $body
    $replay = Invoke-RestMethod "$base/tasks" -Method Post -Headers $headers -ContentType 'application/json' -Body $body
    if ($null -eq $task.id -or $task.id -ne $replay.id) { throw 'Idempotency failed' }
    Write-Host "PASS: create and replay (id=$($task.id))"
    $updated = Invoke-RestMethod "$base/tasks/$($task.id)" -Method Patch -ContentType 'application/json' -Body '{"status":"done"}'
    if ($updated.status -ne 'done') { throw 'Update failed' }
    Write-Host 'PASS: update'
} finally {
    if ($null -ne $task -and $null -ne $task.id) {
        Invoke-RestMethod "$base/tasks/$($task.id)" -Method Delete | Out-Null
        Write-Host 'PASS: delete'
    }
}
Write-Host 'All TaskFlow Kubernetes checks passed' -ForegroundColor Green
