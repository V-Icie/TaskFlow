# Safe, repeatable setup; only modifies the git-ignored .lab08-demo clone.
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$demo = Join-Path $root '.lab08-demo'
if (-not (Test-Path (Join-Path $demo 'docker-compose.yml'))) {
    if (Test-Path $demo) { throw '.lab08-demo exists but is not the expected demo repository. Inspect it manually.' }
    git clone https://github.com/vivalafit/observability-demo.git $demo
    if ($LASTEXITCODE -ne 0) { throw 'Cannot clone the official demo. Check Git / Internet.' }
}
$logs = Join-Path $demo 'data\logs'
New-Item -ItemType Directory -Force $logs | Out-Null
$prom = Join-Path $demo 'prometheus.yml'
$current = [IO.File]::ReadAllText($prom)
if (-not $current.Contains('job_name: taskflow-api')) {
    [IO.File]::Copy($prom, "$prom.before-taskflow", $true)
    $fragment = @'

  # Lab 8 integration: Docker Desktop host port exposed by TaskFlow API.
  - job_name: taskflow-api
    scrape_interval: 5s
    metrics_path: /metrics
    static_configs:
      - targets: ['host.docker.internal:8080']
        labels:
          service_name: taskflow-api
'@
    [IO.File]::AppendAllText($prom, "$fragment`n", (New-Object System.Text.UTF8Encoding $false))
}
# The demo mounts the full provisioning directory into Grafana, so adding
# separate files will not interfere with its original data sources or dashboard.
$src = Join-Path $root 'infrastructure\observability\grafana'
$dst = Join-Path $demo 'grafana\provisioning'
foreach ($pair in @(
    @{ source = 'datasources\taskflow.yml'; target = 'datasources\taskflow.yml' },
    @{ source = 'dashboards\taskflow-provider.yml'; target = 'dashboards\taskflow-provider.yml' },
    @{ source = 'alerting\taskflow.yml'; target = 'alerting\taskflow.yml' }
)) {
    $target = Join-Path $dst $pair.target
    New-Item -ItemType Directory -Force (Split-Path $target) | Out-Null
    Copy-Item -Force (Join-Path $src $pair.source) $target
}
$dashdir = Join-Path $demo 'grafana\dashboards\taskflow'
New-Item -ItemType Directory -Force $dashdir | Out-Null
Copy-Item -Force (Join-Path $root 'docs\observability\my-demo-red-dashboard.json') (Join-Path $dashdir 'demo-red.json')
Copy-Item -Force (Join-Path $root 'docs\observability\taskflow-red-dashboard.json') (Join-Path $dashdir 'taskflow-red.json')
# Use demo clone's own Compose file as source. Overlay adds alert webhook receiver.
Copy-Item -Force (Join-Path $root 'infrastructure\observability\compose.demo-extra.yml') (Join-Path $demo 'compose.taskflow.yml')
Write-Host 'Demo prepared in .lab08-demo (git-ignored). Run the commands from defense/practice-08/DEMO.md' -ForegroundColor Green
