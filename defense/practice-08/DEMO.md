# Google Meet: сценарій практичної №8

### Підготовка до дзвінка

1. Відкрити Docker Desktop; звільнити порт 3000 через `docker compose stop web` у корені TaskFlow.
2. Запустити `npm install`, `npm test`, виконати `.\infrastructure\observability\prepare-demo.ps1`.
3. Увімкнути TaskFlow API з OTEL:

```powershell
 docker compose -f docker-compose.yml -f docker-compose.observability.yml up -d --build db api
```

4. Запустити викладацький стенд + webhook sink:

```powershell
 docker compose -p lab08-observability -f .lab08-demo/docker-compose.yml -f .lab08-demo/compose.taskflow.yml up -d --build
```

5. Відкрити Grafana `http://localhost:3001` (admin/admin), Prometheus `http://localhost:9090/targets`, TaskFlow API `http://localhost:8080/health`.

### Демонстрація 60 балів

- Показати `docker compose ... ps` з Grafana, Loki, Tempo, collector, prometheus, app, loadgen.
- Показати оригінальний **Observability Demo / RED**, пояснити Rate, Errors, Duration.
- Показати Explore → Tempo → trace `demo-app`.
- Показати Explore → Loki → `{service="demo-app"}`.

### Демонстрація 75 балів

- Відкрити **TaskFlow Lab08 → My Demo RED**, показати 4 панелі і зміну time picker.
- Відкрити `docs/observability/my-demo-red-dashboard.json` у VS Code і показати PromQL та LogQL.

### Демонстрація 90 балів

```powershell
 docker compose -p lab08-observability -f .lab08-demo/docker-compose.yml -f .lab08-demo/compose.taskflow.yml stop loadgen
 .\scripts\lab08-traffic.ps1 -Mode normal -Count 25
 .\scripts\lab08-traffic.ps1 -Mode errors -Count 8
```

- Показати TaskFlow `/metrics` (Prometheus job `taskflow-api` у стані UP).
- Показати **TaskFlow RED + Alerts**, Tempo trace `taskflow-api`, Loki `{service="taskflow-api"}`.
- Пояснити змінні оточення `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `NODE_OPTIONS` з `docker-compose.observability.yml`.

### Демонстрація 95–100 балів

```powershell
 .\scripts\lab08-traffic.ps1 -Mode errors -Count 40
 .\scripts\lab08-traffic.ps1 -Mode slow -Count 12
```

- У Grafana Alerting показати два алерти (більше 5% 5xx і p95 > 0,8 с) та notification policy.
- Показати реальний стан Firing/історію і webhook sink логи (якщо алерт спрацював).
- Показати панель Alert list на TaskFlow дашборді.
- Пояснити, що це **навчальне** навантаження; у продакшені перевіряли б PostgreSQL, error logs, latency traces.

### Відновлення після захисту

Зупинити observability demo без видалення томів, після чого відновити `docker compose up -d --build web api db` для основного TaskFlow. `down -v` не використовувати.

**Якщо демонстрація не пройшла:** відкрити `docs/observability/README.md` і перевірити troubleshooting. Не стверджувати, що алерти чи трейси працюють, доки їх не видно у Grafana.
