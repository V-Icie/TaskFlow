# Generate monitoring events against ONLY the local demo-enabled TaskFlow API.
param([ValidateSet('normal','errors','slow')][string]$Mode = 'normal', [int]$Count = 25)
$ErrorActionPreference='Stop'
if ($Count -lt 1 -or $Count -gt 100) { throw 'Count must be between 1 and 100' }
$base='http://localhost:8080'
$health=Invoke-RestMethod "$base/health"
if ($health.status -ne 'ok') { throw 'TaskFlow API is not healthy' }
$path=switch($Mode) {'errors' {'/observability/demo-error'} 'slow' {'/observability/demo-slow'} default {'/items'}}
Write-Host "Generating $Count local requests to $path" -ForegroundColor Cyan
for($i=0;$i -lt $Count;$i++) {
 try { $response=Invoke-WebRequest -Uri "$base$path" -UseBasicParsing -TimeoutSec 15; Write-Host "$($i+1) HTTP $($response.StatusCode)" }
 catch { Write-Host "$($i+1) expected simulated response or connection error: $($_.Exception.Message)" }
 Start-Sleep -Milliseconds 150
}
Write-Host 'Open Grafana and inspect RED metrics, traces (Tempo) and logs (Loki).' -ForegroundColor Green
