# Google Meet — Практична №7 (CI/CD)

**Орієнтовний сценарій, 5–8 хвилин; адаптуйте до запитань викладача.**

1. Відкрийте свій GitHub-репозиторій TaskFlow → покажіть `.github/workflows/ci.yml`. Поясніть: CI на push і pull_request; publish на `workflow_dispatch` та `v*` tag.
2. Покажіть `package.json`, `package-lock.json`, `npm run lint`, `npm test`; за бажанням запустіть їх у VS Code.
3. Вкладка **Actions** → **TaskFlow CI/CD** → останній успішний запуск: job `Lint, tests & smoke test` і два job `Docker build / api`, `Docker build / web`.
4. Розгорніть крок `Install exact locked dependencies`, `JavaScript syntax check`, `Unit and HTTP integration tests`, `Start API and smoke-test HTTP endpoints`.
5. Прокрутіть до **Artifacts**: `taskflow-ci-logs`, поясніть, що там журнали збірки/тестів.
6. Покажіть **Job Summary** з описом перевірок.
7. Покажіть успішний version-tag run або вручну запущений workflow з `GHCR publish / api` та `GHCR publish / web`.
8. Відкрийте **Packages** та покажіть `taskflow-api`, `taskflow-web`; для тегового запуску покажіть `v1.0.0` та `sha-...`.
9. Відкрийте README з бейджем CI та `.github/dependabot.yml`. Поясніть Style points: semver, Dependabot, least privilege + concurrency, Job Summary.
10. Поясніть, що образ `postgres` сторонній, а власні збірки тільки API та фронтенд.

### Сценарій, якщо при викладачі інтернет повільний

Підготуйте скриншоти **реальних** зелених jobs, packages, CI badge, artifact і summary. Не заявляйте про успіх, якщо процес зупинився з помилкою.

### Корисні команди перед Google Meet

```powershell
npm run lint
npm test
git status
git log -1 --oneline
```

Щоб вручну запустити delivery, у GitHub Actions натисніть **Run workflow** на `main`, або зробіть push тега версії.
