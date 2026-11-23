# Практична №7: GitHub Actions CI/CD

## Відповідність вимогам PDF

| Вимога | Реалізація | Доказ |
|---|---|---|
| CI для власного репозиторію | `.github/workflows/ci.yml`, job `ci` | Green run у GitHub Actions |
| push і pull_request | Події в `ci.yml` | Перегляд YAML, запуск на main/PR |
| checkout, runtime, cache, install, test, lint | `checkout@v7`, `setup-node@v7` Node 22 npm cache, `npm ci`, `npm run lint`, `npm test` | Logs `ci` |
| Не менше одного тесту | Наявні unit та HTTP integration тести | `npm test` logs |
| Артефакти | `taskflow-ci-logs` із logs/HTTP results | Actions → Artifacts |
| Delivery всіх власних сервісів | jobs `docker-build` і `publish`, matrix `api`, `web` | Packages `taskflow-api`, `taskflow-web` у GHCR |
| Бейдж CI | README, реальний URL з git remote через `node scripts/set-ci-badge.js` | README на GitHub |
| Semver і sha | Метадані `metadata-action` (`vX.Y.Z` + `sha-commit`) | GHCR tags після version-tag run |
| Style points | Dependabot, permissions/concurrency, summary + semver | `.github/` та Summary |

## Архітектура виконання

1. `git push` → GitHub Actions `ci`: checkout, Node.js 22/npm cache, `npm ci`, синтаксичний lint, 33 тести (очікування, кількість залежить від версії тестів), HTTP smoke test (`/health`, `/items`), лог-артефакт.
2. `ci` успішний → матриця `docker-build`: побудова Docker-образів `api` та `web` із файлів практичної №6.
3. `git push` тега `vX.Y.Z` або `Run workflow` → матриця `publish`: логін у `ghcr.io` за допомогою `GITHUB_TOKEN`, публікація двох образів.

**На звичайному push job publish не запускається, і це очікувано.**

## Перша підготовка на Windows

```powershell
cd C:\Users\user\Downloads\WebLabs\TaskFlow
npm install
node scripts/set-ci-badge.js
npm run check:lock
npm run lint
npm test
git status
```

`package-lock.json` повинен бути згенерований/оновлений локально. Не видаляйте його, він потрібний `npm ci` на GitHub. Не додавайте `node_modules`.

## Теги і доступ до GHCR

- `ghcr.io/owner/repo-api:sha-<40-symbol SHA>`
- `ghcr.io/owner/repo-web:sha-<40-symbol SHA>`
- `ghcr.io/owner/repo-api:v1.0.0` після тегового запуску
- `ghcr.io/owner/repo-web:v1.0.0` після тегового запуску

`owner/repo` автоматично переводяться у нижній регістр. Два образи збираються з того ж вихідного коду, що й Docker Compose. PostgreSQL береться з офіційного образу як зовнішня залежність.

## Типові помилки

- **`npm ci` fails**: немає/застарів `package-lock.json`. Виконати `npm install` локально, `git add package-lock.json`, commit і push.
- **Workflow not running**: файл має лежати точно в `.github/workflows/ci.yml` на default branch. Перевірити вкладку Actions та налаштування дозволів Actions.
- **`Resource not accessible by integration` / 403 у GHCR**: перевірити `packages: write` у `publish`, дозволи GitHub Actions/організації, належність пакета до репозиторію.
- **`publish` skipped після звичайного push**: очікувано; потрібен `workflow_dispatch` або `v*` tag.
- **GHCR private**: зробити пакети Public, якщо викладачеві потрібен зовнішній доступ.
- **Скріншоти**: тільки справжні, з вашого GitHub. Не підміняйте їх прикладами.

## Документи методички

Практична №7, сторінки 24–28 PDF. Для 90–100 потрібно CI для власного репозиторію, delivery всіх сервісів і не менше 2 Style points. Результат оцінює викладач після захисту.
