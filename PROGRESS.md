# Прогрес TaskFlow (індивідуальний проєкт)

| Практична | Статус | Коментар |
|---|---|---|
| №1 | Локально підтверджено користувачем | `GET /items` і SQLite; GitHub завантажено |
| №2 | Підготовлено | Документація та архітектурна схема |
| №3 | VERIFIED (користувач) | 7 тестів пройдено на Windows |
| №4 | VERIFIED локально користувачем (за повідомленням) | 11 тестів, CRUD-кнопки та /items працюють; реальні Swagger-скриншоти додано до docs/api |
| №5 | Браузерну демонстрацію підтвердив студент; 27 тестів PASS, 2 HTTP SKIP тут | Потрібне повне локальне npm test для підтвердження HTTP тестів |
| №6 | VERIFIED локально користувачем | Docker Engine, web/api/PostgreSQL, health, 4 items, ідемпотентність; `check-docker.ps1` після виправлення: All checks passed |
| №7 | IMPLEMENTED, очікує GitHub перевірки | Workflow, lint, tests, 2 Docker builds, GHCR delivery, Dependabot, badge |
| №8–10 | NOT STARTED | Моніторинг і Kubernetes |

**Захист:** за відповідями викладача практичні треба захищати для оцінки вище 60 балів; викладача слід попереджати завчасно. Формат сольної роботи/заміни командних fork та PR слід погодити окремо.

**Перевірки №6:** студент повідомив `All checks passed` у `scripts/check-docker.ps1` на Windows. У середовищі складання пройшов 31 тест, 2 HTTP інтеграційні були пропущені через відсутність Express; скриншоти захисту слід зберегти з реального ПК.


## Практична №7 — CI/CD (ПІДГОТОВЛЕНО, НЕ ВЕРИФІКОВАНО НА GITHUB)

- [x] CI workflow на `push`, `pull_request`, `workflow_dispatch`, `v*` tags.
- [x] Node.js 22, npm lock/cache, локальний синтаксичний lint, тести, API smoke test.
- [x] Збірка власних сервісів `api` та `web` у Docker.
- [x] GHCR publish для `api` та `web` (ручний запуск або тег версії).
- [x] Style points: semver+SHA, Dependabot, least privilege/concurrency, Job Summary.
- [x] Матеріали для захисту в `defense/practice-07/`.
- [ ] Локально оновити та закомітити `package-lock.json` після `npm install`.
- [ ] Згенерувати реальний CI badge через `node scripts/set-ci-badge.js`.
- [ ] GitHub Actions CI + Docker build повинні завершитися зеленим статусом.
- [ ] Опублікувати GHCR обидва образи, зберегти посилання/скриншоти.

Не позначати №7 зданою до реальної демонстрації.
