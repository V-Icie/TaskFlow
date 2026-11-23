# TaskFlow — курсова на основі практичних №1–7

**Тема:** базовий клієнт — бекенд — база даних.  
**Тема індивідуального проєкту:** TaskFlow, система керування завданнями. **Формат виконання: сольний проєкт, без вигаданих учасників чи PR.** Практичні послідовно доповнюють одну курсову роботу.

## Що реалізовано

- Node.js + Express сервер, `GET /items`.
- SQLite (`data/taskflow.sqlite`) з таблицею `items (id, name)` і чотирма тестовими записами.
- HTML/CSS/JavaScript сторінка з кнопкою **Load items**.
- `fetch('/items')` для завантаження й відображення даних як списку.
- Готова початкова структура для розвитку командного проєкту.

## Вимоги

- **Node.js 22.13+** (рекомендовано поточну LTS-версію).
- npm та доступ до npm registry **для першого встановлення Express**.
- Docker і PostgreSQL не потрібні для локального режиму SQLite. Для практичної №6 Docker Desktop потрібен; PostgreSQL запускається контейнером, без локального встановлення.

SQLite використовується через вбудований модуль `node:sqlite`, доступний у зазначеній версії Node.js. На деяких версіях Node 22 може з'являтися попередження про експериментальний API: для навчального стенду це допустимо.

## Запуск у Windows PowerShell

Розпакуйте архів, відкрийте термінал **у кореневій папці TaskFlow**:

```powershell
node -v
npm -v
npm install
npm start
```

У браузері відкрийте **http://localhost:3000/** і натисніть **Load items**.

API окремо: **http://localhost:3000/items**. Він повертає JSON-масив об'єктів `[{"id":1,"name":"..."}, ...]`.

Команда перевірки API в іншому вікні PowerShell:

```powershell
Invoke-RestMethod http://localhost:3000/items | Format-Table
```

Тести бази даних:

```powershell
npm test
```

Зупинка сервера: `Ctrl+C` у терміналі сервера.

### Якщо порт 3000 зайнятий

```powershell
$env:PORT=3001
npm start
```

Тоді адреса: http://localhost:3001/.

### Якщо `npm install` не працює

Перевірте з'єднання з інтернетом та доступ до https://registry.npmjs.org/. Без встановленого Express сервер не стартує. Пакет `node_modules` у ZIP не додається навмисно.

## Як це працює

1. `src/server.js` запускає Express.
2. `src/db.js` створює локальну SQLite базу, таблицю `items` та заповнює її тестовими даними, якщо вона порожня.
3. `src/app.js` обробляє `GET /items`, виконує SQL-запит через `readItems(db)` і повертає JSON.
4. `public/app.js` викликає API з браузера, будує HTML-список та показує статус.

Архітектура: **браузер → Express API → SQLite → JSON → браузер**.

## Git, fork і pull request (частина практичної)

**Зверніть увагу:** робота в команді не може бути автоматично підтверджена лише файлами ZIP. Якщо у вас є команда, потрібно виконати ці дії реально в GitHub.

1. Лідер створює **публічний або приватний** (за вимогами викладача) репозиторій `taskflow-team`.
2. Лідер додає проєкт і робить стартовий commit.
3. Кожен учасник створює **fork** основного репозиторію у власному GitHub-акаунті.
4. Кожен працює у власній гілці свого fork.
5. Кожен відкриває **pull request** до головного репозиторію лідера; лідер проводить review та merge.
6. Для дистанційної здачі збережіть URL репозиторію та URL хоча б одного реально створеного PR від кожного учасника.

Приклад команд для лідера **після створення порожнього GitHub-репозиторію**:

```powershell
git init
git add .
git commit -m "feat: initial TaskFlow client backend SQLite"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/taskflow-team.git
git push -u origin main
```

Замініть `YOUR_USERNAME` власним логіном. Після форку інші учасники працюють у **своїх** репозиторіях, відкриваючи PR на `main` головного.

Якщо працюєте самостійно, узгодьте з викладачем порядок виконання командної частини. **Не створюйте фіктивні PR від вигаданих людей.**

## Захист через Google Meet

Дивіться `defense/practice-01/DEMO.md`, `QUESTIONS.md`, `CHECKLIST.md`.

## Що буде далі

У практичній №2 до цього самого проєкту додамо бізнес-документ, архітектурну діаграму й roadmap. Наступні роботи розвиватимуть цей код, не замінюючи його окремими застосунками.


---

## Практична №2: бізнес-документ і архітектура

До проєкту додано документальну частину (код сервера й клієнта залишився без змін):

- [Бізнес-документ](docs/business_doc.md) — користувачі, сценарії, вимоги й обмеження.
- [Архітектурна діаграма](docs/architecture_diagram.png) і [пояснення](docs/architecture_diagram.md) — клієнт, бекенд, SQLite, заплановані модулі.
- [Roadmap](docs/roadmap.md) — чотири наступні навчальні тижні.
- [Матеріали захисту](defense/practice-02/README.md) — сценарій Google Meet, питання та чекліст.

Документацію можна переглядати без Node.js і Docker. Командні fork/pull request/merge мають бути виконані реально або узгоджені з викладачем для індивідуальної здачі.


## Практична №3 — DDD (нове)

- [`docs/domain/entities.md`](docs/domain/entities.md) — домен, піддомени, атрибути сутностей.
- [`docs/domain/glossary.md`](docs/domain/glossary.md) — 10 термінів Ubiquitous Language.
- [`docs/domain/context_map.png`](docs/domain/context_map.png) — контекстна діаграма.
- [`domain/`](domain/) — прототипи `User`, `Task`, `Category` (без БД та HTTP).
- [`defense/practice-03/DEMO.md`](defense/practice-03/DEMO.md) — сценарій захисту.

Перевірка: `npm test` (після встановлення залежностей). **GET /items залишається без змін**; повний CRUD Task планується у №4. Робота ведеться індивідуально; командні вимоги Git з методички потребують погодження з викладачем.


## Практична №4: модульний моноліт, OpenAPI, CRUD

- Стиль: **модульний моноліт**. Реалізовано `src/api/` (HTTP), `src/service/` (бізнес-операції), `domain/` (моделі), `src/tasksRepository.js` (SQL).
- Повний CRUD для `/tasks`: `POST /tasks`, `GET /tasks`, `GET /tasks/:id`, `PATCH /tasks/:id`, `DELETE /tasks/:id`.
- `GET /health` повертає `{ "status": "ok" }`.
- DTO та узгоджені помилки: `error`, `code`, `details`. Дані `tasks` зберігаються у SQLite. Для навчальної версії `ownerId=1`.
- [OpenAPI YAML](docs/api/openapi.yaml), [процедура Swagger Editor](docs/api/README.md) і [справжній скриншот Swagger](docs/api/swagger_screenshot.png), [маршрути](docs/api/swagger_default.png) та [схеми](docs/api/swagger_schemas.png).
- [ADR 0001](docs/adr/0001-architecture-style.md), [ADR 0002](docs/adr/0002-layered-architecture.md), [ADR 0003](docs/adr/0003-api-style-and-error-model.md).
- [Сценарій захисту](defense/practice-04/DEMO.md) та [чекліст](defense/practice-04/CHECKLIST.md).

Після `npm install` запустіть `npm test` та `npm start`, потім відкрийте `http://localhost:3000/`. Перевірка `GET /items` із №1 залишається доступною. **Застосунок не містить Swagger UI**, згідно методички.

PowerShell приклад створення:

```powershell
$body = @{title='Нове завдання'} | ConvertTo-Json
Invoke-RestMethod http://localhost:3000/tasks -Method Post -ContentType 'application/json' -Headers @{ 'Idempotency-Key' = [guid]::NewGuid().ToString() } -Body $body
```

Обмеження: Express HTTP інтеграцію й браузерний Swagger слід підтвердити локально.


---

## Практична №5: відмовостійкість API та інтерфейсу

Усі можливості практичних №1–4 збережено. Для п'ятої практичної додано:

- **`POST /tasks` із `Idempotency-Key`:** повтор того самого запиту повертає той самий ресурс і статус 201. SQLite-таблиця `idempotency_keys` зберігає результат між перезапусками.
- **`X-Request-Id`:** присутній у кожній HTTP-відповіді. Кожна JSON-помилка містить `error`, `code`, `details`, `requestId`.
- **Rate limit:** стандартно 8 запитів `POST /tasks` за 10 секунд з однієї IP-адреси. Перевищення → 429 + `Retry-After`.
- **Клієнтський retry:** для GET та захищеного POST при 5xx, 429 або мережевій помилці; максимум 2 повтори за замовчуванням, експоненційна затримка з jitter.
- **Таймаут:** `AbortController` скасовує надто довгі запити (демонстрація `/health` з лімітом 1 секунда).
- **Degraded mode:** після 3 послідовних невдалих операцій CRUD-кнопки блокуються на 8 секунд і показується попередження.
- **Виправлено Edit/Delete:** редагування і підтвердження видалення відбуваються в інтерфейсі, без `prompt()`/`confirm()`.

### Запуск у Windows (PowerShell)

```powershell
cd C:\Users\user\Downloads\WebLabs\TaskFlow
npm install
npm test
$env:DEMO_FAILURES='1'
npm start
```

Відкрий `http://localhost:3000/`. Після `npm start` залиш термінал відкритим.

У розділі «Відмовостійкість» працюють демонстрації:

- `503 → retry`: перша відповідь 503, друга — 200.
- `429 → Retry-After`: перша відповідь 429, очікування 1 секунду, друга — 200.
- `Timeout 1с`: `/health` затримується на 1.6 секунди, клієнт перериває запит через 1 секунду.
- `3 помилки → degraded`: три збої 503, попереджувальний банер і блокування основних кнопок на 8 секунд.

**Увага:** без `DEMO_FAILURES=1` демонстраційні кнопки вимкнені. На звичайній роботі застосунку це не позначається. Fault injection працює лише для локального доступу до сервера.

У другому терміналі перевір стан:

```powershell
Invoke-RestMethod http://localhost:3000/health
```

Має повернути `status: ok`.

### Ідемпотентність у PowerShell

```powershell
$key = [guid]::NewGuid().ToString()
$headers = @{ 'Idempotency-Key' = $key }
$body = @{ title = 'Repeat demo' } | ConvertTo-Json
$a = Invoke-RestMethod http://localhost:3000/tasks -Method Post -ContentType 'application/json' -Headers $headers -Body $body
$b = Invoke-RestMethod http://localhost:3000/tasks -Method Post -ContentType 'application/json' -Headers $headers -Body $body
$a.id
$b.id
```

Обидва значення `id` мають збігатися. Ключ має бути новим для нової логічної операції.

### Зміни у структурі

```text
src/middleware/resilience.js         HTTP кореляція, rate limit, opt-in demo
src/service/idempotencyService.js    SQL-транзакції для ідемпотентних POST
public/lib/http.js                   Retry, backoff, Retry-After, AbortController
public/app.js                        CRUD з inline-редагуванням та degraded mode
public/index.html                    Демонстраційна панель
src/db.js                            Таблиця idempotency_keys
src/app.js                           Middleware + єдина форма помилок
tests/idempotency.test.js            Сценарії ідемпотентності
tests/httpResilience.test.js         Поведінка retry/timeout
tests/middleware.test.js             Тести HTTP middleware
tests/httpIntegration.test.js        Реальні HTTP-тести (за наявності Express)
defense/practice-05/                Матеріали захисту для Google Meet
```

**Статус перевірок практичної №5:** її 4 демонстраційні сценарії перевірив студент у браузері; у середовищі складання №5 пройшло **27 локальних тестів**. Два HTTP-інтеграційні тести були **пропущені**, тому що npm registry недоступний і Express там не встановлений. У твоєму Windows-середовищі після `npm install` ці два тести мають запуститися; їхню успішність треба перевірити, а не припускати.

Для Google Meet використовуй [`defense/practice-05/DEMO.md`](defense/practice-05/DEMO.md), [`CHECKLIST.md`](defense/practice-05/CHECKLIST.md) та [`QUESTIONS.md`](defense/practice-05/QUESTIONS.md).

Після змін перевір `docs/api/openapi.yaml` через https://editor.swagger.io/ та зафіксуй новий реальний скриншот для актуальної версії контракту API.


---

## Практична №6: Docker, Docker Compose та PostgreSQL (нове)

**Локальний режим не змінився:** `npm install`, `npm test`, `npm start` працюють із SQLite, як у №1–5. **Docker Compose** натомість запускає три пов'язані контейнери: Nginx (`web`) → Express (`api`) → PostgreSQL (`db`). Дані в PostgreSQL зберігаються в іменованому томі `postgres_data` між звичайними `docker compose down` і `up`.

- [Детальна інструкція Docker](docs/docker/README.md): всі рівні 60 / 75–89 / 90–100 балів, порти, команди PowerShell, перевірка БД, усунення помилок.
- [`Dockerfile`](Dockerfile) — образ бекенду Node.js, `frontend/Dockerfile` — образ Nginx.
- [`.dockerignore`](.dockerignore) — виключає `node_modules`, `.git`, локальні БД, секрети та непотрібні файли.
- [`docker-compose.yml`](docker-compose.yml) — три сервіси `web`, `api`, `db` з healthchecks, startup order, томом даних.
- [Швидка перевірка API](scripts/check-docker.ps1) — сценарій перевірки контейнерів, `/items`, CRUD, ідемпотентності та записів PostgreSQL.
- [Захист №6](defense/practice-06/DEMO.md), [питання](defense/practice-06/QUESTIONS.md), [чекліст](defense/practice-06/CHECKLIST.md).

### Швидкий старт (Windows PowerShell)

Переконайся, що **Docker Desktop відкритий**, працює Linux Engine, а `docker run hello-world` завершується успішно.

```powershell
Copy-Item .env.docker.example .env
notepad .env     # заміни приклад пароля на власний пароль для локальної БД

docker compose up -d --build
docker compose ps
Invoke-RestMethod http://localhost:8080/health
Invoke-RestMethod http://localhost:8080/items
```

- **Frontend + проксі API:** http://localhost:3000
- **API безпосередньо:** http://localhost:8080
- **База PostgreSQL:** лише всередині мережі Docker за адресою `db:5432`.

```powershell
.\scripts\check-docker.ps1
docker compose down  # НЕ видаляє PostgreSQL volume
```

> Якщо локально вже запущений `npm start` на 3000, зупини його через Ctrl+C перед Docker Compose, інакше порт 3000 буде зайнятий. Дані старої локальної SQLite **автоматично не переносяться** у PostgreSQL: це окреме навчальне середовище.

**Важливо:** тут, у середовищі створення файлів, Docker Engine і npm registry недоступні. Отже, результат реального `docker build`, `docker compose up` і скріншоти треба підтвердити у Windows. Усі попередні тести SQLite пройдені, а PostgreSQL перевірено mock-тестами. Статус перевірок див. `PROGRESS.md`.


---

## Практична №7: GitHub Actions CI/CD

<!-- CI_BADGE_START -->
[![TaskFlow CI](https://github.com/V-Icie/TaskFlow/actions/workflows/ci.yml/badge.svg)](https://github.com/V-Icie/TaskFlow/actions/workflows/ci.yml)
<!-- CI_BADGE_END -->

> Перед пушем замініть `YOUR_OWNER` автоматично: `node scripts/set-ci-badge.js`.

**Рішення для 90–100 балів:** власний GitHub-репозиторій, CI на `push`/`pull_request`, запуск lint-синтаксису, unit + HTTP тестів, HTTP smoke test, Docker збірки `api` і `web`. Публікація обох власних образів у GHCR при запуску `workflow_dispatch` або push тега `v*`. Готовий образ PostgreSQL є сторонньою залежністю, не власним сервісом для публікації.

- Workflow: `.github/workflows/ci.yml`
- Dependabot: `.github/dependabot.yml`
- Локальний синтаксичний lint: `npm run lint` (це `node --check`, не ESLint).
- Тести: `npm test`
- Docker: використовується наявний Dockerfile (`api`) та `frontend/Dockerfile` (`web`).
- Test log artifact: `taskflow-ci-logs` у GitHub Actions → конкретний run → Artifacts.
- Пакети GHCR: `ghcr.io/<owner>/<repo>-api` та `ghcr.io/<owner>/<repo>-web` у нижньому регістрі. Теги: `sha-<commit>` та `vX.Y.Z` для version-tag запусків.
- **Style points**: семантичне тегування, Dependabot, мінімальні права та concurrency, Job Summary.

### Перший запуск (Windows PowerShell, один раз)

```powershell
npm install
node scripts/set-ci-badge.js
npm run check:lock
npm run lint
npm test
git status
```

**ВАЖЛИВО:** у вихідному ZIP попередньої практичної №6 не було `package-lock.json`, хоча у вашому Git-клоні він може існувати. `npm install` повинен створити або оновити lock-файл під актуальні `express` і `pg`. Обов'язково закомітьте `package-lock.json` разом із workflow. GitHub Actions використовує `npm ci` та npm cache, тому без актуального lock-файлу CI зупиниться на кроці встановлення залежностей. Файл `node_modules` у Git не додавайте.

```powershell
git add .github package.json package-lock.json README.md PROGRESS.md scripts defense/practice-07 docs/ci
git commit -m "Complete practice 07: CI CD and GHCR delivery"
git push origin main
```

Відкрийте на GitHub: **Actions → TaskFlow CI/CD → останній запуск**. На звичайний push у main буде запуск CI та збірок `api` й `web`, а `publish` залишиться `skipped` (це нормально).

### Публікація образів для захисту

Спершу дочекайтеся зеленого запуску CI. Далі виконайте з кореня репозиторію (перевірте `git tag -l` перед створенням нового):

```powershell
git tag v1.0.0
git push origin v1.0.0
```

Тег спричинить новий workflow, який збере й опублікує **обидва** образи в GHCR з тегами `v1.0.0` і `sha-...`. Альтернатива: на вкладці GitHub Actions вручну натиснути **Run workflow**, тоді будуть образи з `sha-...`, але без semver-тега.

Після успішного запуску перевірте **Packages** у профілі/репозиторії. Якщо викладач має бачити образи без авторизації, виставте їм visibility `Public` (за потреби). Особистий PAT для публікації у власний репозиторій не потрібен: використовується `GITHUB_TOKEN` із `packages: write`.

Після кожного запуску покажіть URL workflow run, скриншот зелених jobs, вкладку Artifacts, URL пакетів GHCR і Job Summary. Це **потрібно зробити у GitHub**: локальна генерація workflow не підтверджує його успішне виконання.

**Захист:** `defense/practice-07/DEMO.md`, `QUESTIONS.md`, `CHECKLIST.md`. Докладно: `docs/ci/README.md`.
