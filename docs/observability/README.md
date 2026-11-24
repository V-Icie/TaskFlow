# Практична №8: Observability (TaskFlow + навчальний observability-demo)

Оригінал вимог: практикум, с. 29–38. Навчальний стенд викладача: https://github.com/vivalafit/observability-demo

## Два сервіси, два набори дашбордів

- `demo-app` — **вихідний навчальний застосунок** викладача; API `http://localhost:3000`, Grafana `http://localhost:3001`, RED dashboard **Observability Demo / RED** (60 балів).
- **My Demo RED** — власний JSON-дашборд студента для `demo-app`: запити за секунду, відсоток 5xx, p95 і логи Loki (75 балів).
- `taskflow-api` — **власний API** TaskFlow на `http://localhost:8080`, відправляє OpenTelemetry-трейси в OTEL Collector; надає Prometheus `/metrics`; пише структуровані JSON-логи до каталогу, який підбирає файловий ресивер колектора (90 балів).
- **TaskFlow RED + Alerts** — окремий дашборд для TaskFlow з 5 панелями, включно з Alert list.
- Два Grafana alert rules для `taskflow-api`: 5xx rate > 5%, p95 > 0,8 с за останні 5 хвилин; webhook receiver `taskflow-alert-sink` (бонус 100 балів, після фактичного спрацювання й скриншотів).

### Як пов'язані частини

```text
Демо (порт 3000) → Prometheus (scrape demo-app) → Grafana
                 → OTEL Collector → Tempo (traces)
                 → /data/logs/app.log → Collector filelog → Loki

TaskFlow API (порт 8080) → /metrics → Prometheus (scrape host.docker.internal:8080)
                         → OTLP/HTTP host.docker.internal:4318 → Collector → Tempo
                         → /var/log/demo/taskflow.log → Collector filelog → Loki
Grafana → 2 alert rules → webhook → taskflow-alert-sink (Docker logs)
```

У реальному захисті TaskFlow web-контейнер тимчасово зупиняється, бо порт 3000 займає `demo-app`. Бекенд TaskFlow й PostgreSQL не зупиняються, дані зберігаються.

## Кроки на Windows 11 (PowerShell, корінь TaskFlow)

Переконайтеся, що Docker Desktop має статус *Engine running*. Оновлення №8 вже скопійоване у клон TaskFlow; `.git` та `.env` не перезаписані.

```powershell
npm install
npm run lint
npm test
```

`npm install` оновить **локальний** `package-lock.json` через нову залежність OpenTelemetry. Додайте оновлений lock до наступного коміту, інакше GitHub Actions `npm ci` не пройде.

```powershell
# Підготувати офіційний стенд у git-ігнорованій папці .lab08-demo
.\infrastructure\observability\prepare-demo.ps1

# Звільнити порт 3000: зупинити лише TaskFlow frontend
# ЗБЕРІГАЄ Postgres volume; не використовуйте down -v
 docker compose stop web

# Перезапустити ТІЛЬКИ TaskFlow API+Postgres з OpenTelemetry
 docker compose -f docker-compose.yml -f docker-compose.observability.yml up -d --build db api

# Запустити початковий демостенд + невеликий alert receiver
 docker compose -p lab08-observability -f .lab08-demo/docker-compose.yml -f .lab08-demo/compose.taskflow.yml up -d --build
```

> Якщо PowerShell не дозволяє виконувати свій перевірений `.ps1`, дотримуйтесь локальної політики безпеки. Для попередніх робіт ви вже використовували тимчасовий Process scope; системну політику міняти не потрібно. Не запускайте невідомі скрипти.

### URL

| Сервіс | URL |
| --- | --- |
| Демо API | http://localhost:3000 |
| **TaskFlow API** | http://localhost:8080/health |
| TaskFlow metrics | http://localhost:8080/metrics |
| Grafana | http://localhost:3001 (`admin`/`admin`, лише локальний навчальний стенд) |
| Prometheus | http://localhost:9090/targets |
| Loki | http://localhost:3100/ready |
| Tempo | http://localhost:3200/ready |
| Alert sink | http://localhost:8099/health |

### Перевірка даних

1. Залишити демо `loadgen` для 60–75 балів. У Grafana відкрити **Observability Demo / RED**, **TaskFlow Lab08 / My Demo RED**. В інтерфейсі мають бути поточні дані `demo-app` (якщо ні, перевірити `Prometheus → Targets`).
2. В **Explore → Tempo** вибрати реальний trace `demo-app`; в **Explore → Loki** виконати `{service="demo-app"}`. Зберегти 3 скріншоти із поясненнями у REPORT.md.
3. Для TaskFlow зупинити лише генератор демо-навантаження (за методичкою):

```powershell
 docker compose -p lab08-observability -f .lab08-demo/docker-compose.yml -f .lab08-demo/compose.taskflow.yml stop loadgen
 .\scripts\lab08-traffic.ps1 -Mode normal -Count 25
```

4. Відкрити **TaskFlow Lab08 / TaskFlow RED + Alerts**; в **Explore → Tempo** шукати `taskflow-api` (успішні запити можуть семплюватися колектором; 503 і повільні запити зберігаються пріоритетно); в **Explore → Loki** виконати `{service="taskflow-api"}`. Переконатися, що `http://localhost:8080/metrics` містить `http_requests_total` та гістограму.
5. Для демонстрації алертів використати **лише локальні демонстраційні URL**, доступні тільки з `OBSERVABILITY_DEMO_FAILURES=1`:

```powershell
 .\scripts\lab08-traffic.ps1 -Mode errors -Count 40
 .\scripts\lab08-traffic.ps1 -Mode slow -Count 12
```

6. У Grafana → Alerting переглянути два алерти TaskFlow і спрацьовування. Якщо з'являється стан `Firing`, зберегти скриншот; Grafana надсилає webhook до `taskflow-alert-sink`. Перевірити лог:

```powershell
 docker compose -p lab08-observability -f .lab08-demo/docker-compose.yml -f .lab08-demo/compose.taskflow.yml logs --tail 40 taskflow-alert-sink
```

Алерти можуть показувати `No Data` на порожніх графіках; для їхньої оцінки потрібні кілька успішних Prometheus scrape і достатня кількість запитів. Якщо правило provisioned не завантажилося, перевірте логи Grafana перед ручним налаштуванням; не позначайте завдання виконаним без перевірки.

### Як вимкнути

```powershell
# Зупинити лише навчальний моніторинг (без -v, без видалення TaskFlow DB)
 docker compose -p lab08-observability -f .lab08-demo/docker-compose.yml -f .lab08-demo/compose.taskflow.yml down

# Повернути звичайні контейнери TaskFlow (frontend знову на :3000)
 docker compose up -d --build web api db
```

НЕ використовуйте `docker compose down -v` у робочому TaskFlow: це може видалити PostgreSQL volume й дані попередніх практичних. `observability-demo` у методичці використовує `down -v`, але в нашому спільному проєкті вибрано безпечніше вимкнення без видалення томів.

## Конфігурації та діагностика

- Автоматична OpenTelemetry інструментація Node: `NODE_OPTIONS=--require @opentelemetry/auto-instrumentations-node/register`. Використовує OTLP HTTP/protobuf і `OTEL_SERVICE_NAME=taskflow-api`, endpoint `http://host.docker.internal:4318` із Docker Desktop. Автоінструментація трасує HTTP/Express/DB. Без прапорця `OBSERVABILITY_ENABLED=1` `/metrics` і демонстраційні помилки не додаються.
- Метрики RED: `http_requests_total` — counter за status; `http_request_duration_seconds` — histogram; вони створені у `src/observability/metrics.js`. Динамічні ID і URL query НЕ потрапляють у metric label, щоб не роздувати cardinality.
- Логи: JSON з `ts`, `service`, `level`, `method`, `route`, `request_id`, `status_code`, `duration_ms`; **тіло запиту й секрети не записуються**. Файловий collector із демостенда підхоплює `taskflow.log` і передає в Loki. Це другий тип сигналу поряд із трасами.
- `infrastructure/observability/prepare-demo.ps1` клонує викладацький репозиторій, робить локальний backup `prometheus.yml.before-taskflow`, дописує scrape job TaskFlow, додає provisioning, не завантажує чужий код у TaskFlow Git.
- Дашборди: `docs/observability/my-demo-red-dashboard.json` (4 панелі, демо 75 балів) та `taskflow-red-dashboard.json` (5 панелей, власний сервіс). Усі графіки використовують загальний time picker.
- Алерти: `infrastructure/observability/grafana/alerting/taskflow.yml`, пороги >5% 5xx та >0.8s p95, вікно 5m, contact point webhook на `taskflow-alert-sink`. У реальній системі команда шукала б причину 5xx у логах і трейcах та аналізувала б повільні залежності; в цьому навчальному стенді тільки локальна симуляція.

## Відомі обмеження та чесна перевірка

- Docker Engine та зовнішній `observability-demo` неможливо було запустити в середовищі складання. Конфігурації перевірені статично, перевірка **на Windows обов'язкова**.
- Протокол і формат трейсів забезпечує офіційна бібліотека OpenTelemetry. `/metrics` та JSON-логи виконані без додаткових бібліотек.
- Оригінальний демостенд використовує старі зафіксовані версії Grafana/Collector. Під час першого запуску потрібне завантаження Docker-образів і npm залежностей. Не підмінюйте неуспішний запуск фейковими скриншотами.
- Якщо `taskflow-api` не знаходиться в Tempo, перевірте `docker compose ... logs api`, `docker compose ... logs collector`, доступність OTLP 4318 та згенеруйте `errors` / `slow` запити; у демостенді ввімкнене tail sampling.
