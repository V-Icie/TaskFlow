# Перед захистом №8

## Код і GitHub
- [ ] `npm install`, актуальний `package-lock.json` доданий до Git.
- [ ] `npm test` без помилок; `npm run lint` без помилок.
- [ ] `git status` чистий після commit/push; CI GitHub Actions зелений.

## Рівень 60
- [ ] Офіційний `observability-demo` запущено і працює.
- [ ] Оригінальний RED-дашборд показує графіки demo-app.
- [ ] У Tempo видно demo-app trace, у Loki — demo-app logs.
- [ ] 3 справжні скриншоти + 1–2 речення для кожного.

## Рівень 75
- [ ] `My Demo RED` має 4 панелі, показує live data.
- [ ] Панелі реагують на перемикання часу.
- [ ] JSON у `docs/observability/my-demo-red-dashboard.json`, 1–2 скриншоти.

## Рівень 90
- [ ] Prometheus job taskflow-api UP; /metrics містить RED-метрики.
- [ ] Tempo service.name taskflow-api; Loki `{service="taskflow-api"}`.
- [ ] Власний TaskFlow RED має окремі метрики, зафіксовано скриншоти.

## Рівень 95–100
- [ ] Два Grafana alert rules завантажено.
- [ ] Є contact point, notification route та webhook sink.
- [ ] Під час демонстраційних запитів Firing / історія спрацьовувань підтверджена.
- [ ] Скриншоти умов алерту, статусу і Alert list.

## Безпека
- [ ] Після захисту demo зупинено **без `-v`**; TaskFlow web повернуто на порт 3000.
- [ ] У Git не потрапили `.env`, `.lab08-demo/`, node_modules чи БД.
