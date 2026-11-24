# Перед захистом №8

## Код і GitHub
- [ ] `npm install`, актуальний `package-lock.json` доданий до Git.
- [ ] `npm test` без помилок; `npm run lint` без помилок.
- [ ] `git status` чистий після commit/push; CI GitHub Actions зелений.

## Рівень 60
- [x] Офіційний `observability-demo` запущено і працює.
- [x] Оригінальний RED-дашборд показує графіки demo-app.
- [x] У Tempo видно demo-app trace, у Loki — demo-app logs.
- [x] Збережено 3 справжні скриншоти з поясненнями у REPORT.md.

## Рівень 75
- [x] `My Demo RED` має 4 панелі та показує live data.
- [ ] Панелі реагують на перемикання часу.
- [x] JSON у `docs/observability/my-demo-red-dashboard.json`, збережено 2 скриншоти.

## Рівень 90
- [ ] Prometheus job taskflow-api UP; /metrics містить RED-метрики.
- [x] Tempo service.name taskflow-api; Loki `{service="taskflow-api"}`.
- [x] Власний TaskFlow RED має окремі метрики, зафіксовано скриншоти.

## Рівень 95–100
- [x] Два Grafana alert rules завантажено.
- [x] Є contact point, notification route та webhook sink.
- [x] Під час демонстраційних запитів обидва правила перейшли у Firing.
- [x] Підтверджено автоматичне повернення обох правил до Normal.
- [x] Підтверджено доставку Firing та Resolved через webhook, HTTP 204.
- [x] Скриншоти умов обох алертів, статусу і Alert List.
- [x] Виправлено конфігурацію панелі Alert List.

## Документація
- [x] Заповнено `docs/observability/REPORT.md` фактичними результатами.
- [x] Збережено 14 скриншотів у `evidence/`.
- [x] Додано посилання на скриншоти у звіті.

## Безпека
- [ ] Після захисту demo зупинено без `-v`; TaskFlow web повернуто на порт 3000.
- [ ] У Git не потрапили `.env`, `.lab08-demo/`, node_modules чи БД.