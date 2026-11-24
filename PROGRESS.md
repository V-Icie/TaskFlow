# Прогрес TaskFlow

Індивідуальний навчальний проєкт.

Останнє оновлення: 24.11.2026.

## Практичні роботи

| Практична | Статус реалізації | Фактичний результат |
|---|---|---|
| №1 | Реалізовано та перевірено | Express, SQLite, frontend, GET /items, GitHub |
| №2 | Документацію підготовлено | Business document, архітектурна діаграма, roadmap |
| №3 | Реалізовано та перевірено | DDD, сутності, glossary, context map, доменні тести |
| №4 | Реалізовано та перевірено | Модульний моноліт, CRUD, ADR, OpenAPI, Swagger screenshots |
| №5 | Реалізовано та перевірено | Idempotency, retry, timeout, rate limit, degraded mode, HTTP integration tests |
| №6 | Реалізовано та перевірено | Docker Compose, Nginx, PostgreSQL, persistent volume, All checks passed |
| №7 | Перевірено на GitHub | CI/CD, Docker builds, GHCR api/web, v1.0.0, artifacts, навчальний fork |
| №8 | Реалізовано та перевірено | RED, Tempo, Loki, OpenTelemetry, два Firing alerts, webhook, 14 скриншотів |
| №9 | Документацію підготовлено | Архітектура Kubernetes, diagram PNG/SVG/Draw.io |
| №10 | Реалізовано та перевірено | Minikube, ConfigMap, Secret, probes, Ingress, self-healing, TaskFlow Deployment, PostgreSQL/PVC, 26 скриншотів |

Технічний прогрес: 10/10 практичних.

Статус реалізації не означає автоматичного отримання оцінки. Остаточна здача залежить від захисту та вимог викладача.

## Автоматизоване тестування

Остання локальна перевірка: 24.11.2026.

| Перевірка | Результат |
|---|---|
| JavaScript syntax lint | 29 файлів PASS |
| Automated tests | 36 PASS |
| Failed tests | 0 |
| Skipped tests | 0 |
| package-lock.json | Збережено в Git |

## CI/CD

- [x] Workflow для push та pull_request.
- [x] Node.js 22, npm cache та npm ci.
- [x] Unit та HTTP integration tests.
- [x] HTTP smoke test.
- [x] Docker build для API та frontend.
- [x] GHCR publish для двох власних образів.
- [x] Семантичний тег v1.0.0.
- [x] Dependabot.
- [x] Permissions та concurrency.
- [x] Job Summary та artifacts.
- [x] CI badge.
- [x] Навчальний fork ci-cd-demo.
- [x] Два Jest-тести навчального fork успішно виконано локально.
- [x] GitHub Actions навчального fork завершився успішно.

Посилання:

- https://github.com/V-Icie/TaskFlow/actions
- https://github.com/V-Icie/ci-cd-demo/actions
- https://github.com/V-Icie?tab=packages

## Observability

- [x] Навчальний стенд запущено.
- [x] Demo RED, Tempo та Loki перевірено.
- [x] My Demo RED створено та перевірено.
- [x] TaskFlow інтегровано з OpenTelemetry.
- [x] Метрики, логи та трейси TaskFlow підтверджено.
- [x] Виконано 25 звичайних, 40 помилкових та 12 повільних запитів.
- [x] Обидва правила Alerting перейшли у Firing.
- [x] Обидва правила повернулися до Normal.
- [x] Webhook Firing та Resolved отримано, HTTP 204.
- [x] Виправлено Alert List.
- [x] Зібрано 14 скриншотів.
- [x] Оформлено звіт та чекліст.

Коміт: `a153eaa`.

[Звіт](docs/observability/REPORT.md)

## Kubernetes

- [x] Fork k8s-demo.
- [x] Локальні endpoint-и та Docker-запуск.
- [x] Minikube Deployment, ReplicaSet та Service.
- [x] ConfigMap та Secret.
- [x] Rollout restart.
- [x] Liveness та readiness probes.
- [x] Ingress через k8s-demo.local.
- [x] Діагностика DNS.
- [x] Self-healing після видалення pod-а.
- [x] Власний образ TaskFlow.
- [x] TaskFlow Deployment: 2/2 Ready.
- [x] PostgreSQL StatefulSet: 1/1 Ready.
- [x] PersistentVolumeClaim: 1 Gi, Bound.
- [x] Port-forward та API endpoints.
- [x] CRUD та ідемпотентність.
- [x] Діагностика проблеми підключення до PostgreSQL після перезапуску.
- [x] Автоматичне відновлення TaskFlow.
- [x] Зібрано 26 скриншотів.
- [x] Оформлено звіт та чекліст.

Коміт TaskFlow: `ecc2acc`.

Коміт навчального fork: `3ca58ab`.

[Звіт](docs/kubernetes/REPORT.md)

## Основні етапи Git

| Коміт | Етап |
|---|---|
| 49d7f9f | Practice 04: CRUD API and architecture |
| e3c3b7f | Practice 05: resilient HTTP |
| 2ef406a | Practice 06: Docker Compose and PostgreSQL |
| 7c7e305 | Practice 07: GitHub Actions CI CD |
| df4c9fb | Practice 09: Kubernetes architecture; файли Observability |
| acf5511 | Practice 10: Kubernetes deployment |
| a153eaa | Practice 08: Observability report and evidence |
| ecc2acc | Practice 10: Kubernetes report and evidence |
| 1033472 | Practice 10: defense checklist |

## Фінальні завдання

- [x] Технічна реалізація практичних №1–10.
- [x] Документація та звіти.
- [x] Завантаження результатів на GitHub.
- [x] Актуалізація README та PROGRESS.
- [ ] Фінальна перевірка запуску.
- [ ] Перевірка останнього GitHub Actions run.
- [ ] Остаточна підготовка до захисту.
- [ ] Погодження індивідуального формату командних завдань.
- [ ] Захист та отримання оцінок.
- [ ] Оформлення курсової роботи.

## Репозиторії

- https://github.com/V-Icie/TaskFlow
- https://github.com/V-Icie/ci-cd-demo
- https://github.com/V-Icie/k8s-demo