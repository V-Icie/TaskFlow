# Звіт до практичної №8: Observability

**Студент:** _(вписати)_  
**Проєкт:** TaskFlow (сольний) + навчальний observability-demo  
**Стан:** Підготовлено; вставити фактичні скриншоти після запуску в Docker Desktop.

## Рівень 60: готовий стенд

| Скріншот | Що має бути видно | Коротке пояснення для захисту |
| --- | --- | --- |
| `evidence/01-demo-red.png` | Observability Demo / RED, Rate/Errors/Duration | RED-метрики описують кількість запитів, помилки 5xx і час відповіді demo-app. |
| `evidence/02-demo-tempo.png` | Tempo Explore, відкритий trace | Trace показує тривалість запиту та вкладені операції обробки. |
| `evidence/03-demo-loki.png` | Loki Explore, `{service="demo-app"}` | Логи показують HTTP-запити, їхній статус і час виконання. |

## Рівень 75: власний дашборд demo-app

Створено JSON `docs/observability/my-demo-red-dashboard.json` (чотири панелі, обраний час 15 хвилин). Після запуску зробити `evidence/04-my-demo-red.png`.

| Панель | PromQL / LogQL | Для чого |
| --- | --- | --- |
| Requests/s | `sum(rate(http_requests_total{job="demo-app"}[$__rate_interval]))` | Навантаження за секунду |
| Error rate % | `100 * sum(rate(http_requests_total{job="demo-app",status_code=~"5.."}[$__rate_interval])) / clamp_min(sum(rate(http_requests_total{job="demo-app"}[$__rate_interval])), 0.000001)` | Частка серверних помилок |
| Latency p95 (ms) | `histogram_quantile(0.95,sum by (le)(rate(http_request_duration_ms_bucket{job="demo-app"}[$__rate_interval])))` | Затримка, нижче якої 95% запитів |
| Logs (Loki) | `{service="demo-app"}` | Пошук подій для пояснення збоїв |

## Рівень 90: OpenTelemetry для TaskFlow

**Власний сервіс:** `taskflow-api`, endpoint `8080`, середовище Docker. Трейси: OpenTelemetry Zero-Code (`@opentelemetry/auto-instrumentations-node`), OTLP/HTTP Collector `4318`. Метрики: Prometheus `/metrics`. Логи: файл `taskflow.log`, що читається через `filelog` ресивер і надсилається в Loki.

**Ресурсні атрибути:** `service.name=taskflow-api`, `service.version=1.0.0`.  
**HTTP атрибути:** маршрут, метод, код відповіді, тривалість; у логах `request_id` для зіставлення подій. Не додаються ідентифікатори користувачів чи секретні поля.  
**Використання:** фільтрація `{service="taskflow-api"}` у Loki; пошук `taskflow-api` у Tempo; зіставлення p95 та 503 у Prometheus.

Після запуску додати реальні скриншоти: `evidence/05-taskflow-red.png`, `evidence/06-taskflow-tempo.png`, `evidence/07-taskflow-loki.png`.

## Рівень 95–100: два алерти

1. **Error rate:** 5xx понад 5% за останні 5 хвилин, оцінка щохвилини. Реакція: перевірити відповідні траси/логи, знайти endpoint і причину 5xx, відновити сервіс.
2. **Latency:** p95 понад 0,8 секунди за останні 5 хвилин. Реакція: знайти повільний endpoint, перевірити PostgreSQL або залежності та оптимізувати запит.

**Маршрут сповіщення:** Grafana notification policy → `taskflow-webhook` → локальний `taskflow-alert-sink`; результат бачимо в `docker compose logs taskflow-alert-sink`.

Скриншоти: `evidence/08-alert-rule.png` (поріг/формула), `evidence/09-alert-firing.png` (статус Firing / історія), `evidence/10-alert-list.png` (панель дашборду), за потреби `evidence/11-webhook-logs.png`.

**Фактичні результати запуску (вписати після перевірки):**
- [ ] Docker Compose запущено, доступні демо та TaskFlow API.
- [ ] RED demo-app, Tempo і Loki показують дані.
- [ ] Власний дашборд My Demo RED відображає 4 панелі.
- [ ] У Tempo/Loki видно саме `taskflow-api`.
- [ ] В обох алертів коректно налаштовано умову та notification route.
- [ ] Є хоча б одне реальне спрацювання, збережено скриншоти.

**Висновок:** TaskFlow отримав три сигнали спостережуваності (метрики, логи, трейси) і два алерти для розпізнавання помилок та деградації швидкодії. Остаточні спостереження верифікувати на локальному стенді.
