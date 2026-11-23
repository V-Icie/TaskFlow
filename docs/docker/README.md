# Практична №6 — Docker та Docker Compose

## Мета

Згідно з методичкою: встановити Docker, запустити офіційний `hello-world`, контейнеризувати власний застосунок і, на 90–100 балів, однією командою підняти **frontend + api + db (PostgreSQL)**.

**Для чого це:** TaskFlow можна переносити між комп'ютерами без ручного налаштування Node.js, Nginx і PostgreSQL у системі. Docker забезпечує середовище виконання, Compose запускає групу взаємозалежних контейнерів.

## Що встановити

1. Docker Desktop для Windows 11, Linux containers, WSL 2.
2. Docker Desktop має бути **запущений** до будь-яких `docker ...` команд.
3. PostgreSQL та Nginx окремо встановлювати **не потрібно**.
4. Для локального `npm test` знадобиться Node.js 22.13+.

Перевірка:

```powershell
docker version
docker compose version
docker run hello-world
```

Очікується повідомлення `Hello from Docker!` від `hello-world`. **Зроби скриншот/збережи лог** для базового рівня (60 балів). Якщо в `docker version` є `Client`, але немає `Server`, Docker Engine не працює.

## 60 балів: Docker hello-world

```powershell
docker version
docker run hello-world
```

Збережи справжній скриншот `defense/practice-06/evidence/hello-world.png` і коротко опиши команди в README (цей файл уже містить опис). Не додавати вигадані скриншоти.

## 75–89 балів: Dockerfile власного застосунку

Файли:

- `.dockerignore` у корені.
- `Dockerfile` у корені для API (Node.js).
- `frontend/Dockerfile` для Nginx-фронтенду.

Збірка API:

```powershell
docker build -t taskflow-api:1.0.0 -f Dockerfile .
docker run --name taskflow-standalone --rm -d -p 8080:8080 -e PORT=8080 taskflow-api:1.0.0
Invoke-RestMethod http://localhost:8080/health
Invoke-RestMethod http://localhost:8080/items
docker logs taskflow-standalone
docker stop taskflow-standalone
```

**Увага:** standalone-контейнер використовує SQLite. Його база видаляється разом із контейнером, якщо спеціально не підключати volume. Для повного Compose-варіанта дані постійно зберігаються у PostgreSQL-томі. Порт 8080 має бути вільним. Standalone-контейнер потрібно зупинити **перед** Compose, щоб звільнити порт.

Скріншоти: зібраний образ (`docker images`), запущений контейнер (`docker ps`), відповідь API (`Invoke-RestMethod`).

## 90–100 балів: повний Docker Compose

### Перед запуском

У корені TaskFlow (PowerShell):

```powershell
Copy-Item .env.docker.example .env
notepad .env
```

Заміни `replace_this_with_a_local_demo_password` на власний локальний пароль. Файл `.env` **не додавай в GitHub**. `docker-compose.yml` бере пароль із `.env` і передає його в `api` та `db`; сам пароль не зберігається у YAML.

Зупини локальний `npm start` на порту 3000, а також сторонні сервіси на порту 8080.

### Запуск

```powershell
docker compose config --quiet
docker compose up -d --build
docker compose ps
docker compose logs --tail=50 api
docker compose logs --tail=50 web
```

Має бути три сервіси:

| Сервіс | Технологія | Порт та призначення |
|---|---|---|
| `web` | Nginx | `http://localhost:3000` — статична HTML-сторінка і reverse proxy до API |
| `api` | Node.js / Express | `http://localhost:8080` — REST API, `DB_CLIENT=postgres` |
| `db` | PostgreSQL 16 | Внутрішня адреса `db:5432`, без публікації порту |

`web` чекає, доки API стане здоровим; `api` чекає на готову БД. Nginx перенаправляє `/items`, `/tasks`, `/health`, `/demo/` до `api:8080`, тож фронтенд і API працюють з одним origin без CORS.

### Перевірка

```powershell
Invoke-RestMethod http://localhost:8080/health
Invoke-RestMethod http://localhost:8080/items
Invoke-RestMethod http://localhost:3000/health
.\scripts\check-docker.ps1
```

Відкрий `http://localhost:3000`, натисни **Load items**, створи й відредагуй завдання. Для PostgreSQL перевір кількість рядків:

```powershell
docker compose exec -T db psql -U taskflow -d taskflow -c 'SELECT id, title, status FROM tasks ORDER BY id;'
```

### Перевірка збереження даних

1. Створи завдання з інтерфейсу або PowerShell.
2. Виконай `docker compose down` (**без `-v`**).
3. Запусти `docker compose up -d`.
4. Перевір, що завдання залишилося: PostgreSQL використовує том `postgres_data`.

### Зупинка

```powershell
docker compose down
```

⚠️ `docker compose down -v` видаляє PostgreSQL volume з навчальними даними. Для звичайного завершення лабораторної **не використовуй `-v`**.

## Обмеження і особливості

- Звичайний `npm start` використовує SQLite з файлом `data/taskflow.sqlite`. Docker Compose використовує окремий PostgreSQL. **Дані автоматично не мігрують** між цими двома базами.
- `GET /items`, `/tasks` CRUD і idempotency повинні працювати в обох режимах.
- Режим моделювання помилок №5 вимкнено всередині Docker (`DEMO_FAILURES=0`); для захисту №5 зручно використовувати окремий локальний `npm start`.
- Для повторюваності залежностей версії в `package.json` зафіксовані. Після `npm install` на Windows закоміть оновлений `package-lock.json` (Dockerfile виконує `npm install`, щоби працювати і зі старим lock-файлом).
- PostgreSQL 16 у Compose використовує `postgres_data:/var/lib/postgresql/data`. Образ `postgres:16-alpine` сумісний із цим шляхом.
- Сервіси будуються через мережу Docker, тому для **першої збірки** необхідний інтернет (образи Docker Hub і пакети npm).

## Типові проблеми

| Симптом | Перевірка / дія |
|---|---|
| `failed to connect to Docker API ... dockerDesktopLinuxEngine` | Запусти Docker Desktop, перевір `docker version` (секція Server), WSL 2, режим Linux containers |
| `Bind for 0.0.0.0:3000 failed` | Завершити локальний `npm start` або іншу програму на 3000 |
| Порт `8080` зайнятий | Зупинити standalone-контейнер через `docker stop taskflow-standalone` |
| API не стартує | `docker compose logs api --tail=100`, `docker compose ps` |
| База недоступна | `docker compose logs db --tail=100`, перевір `.env` |
| Nginx 502 | Перевір стан `api` і `docker compose logs api` |
| Не збирається через мережу | Перевір інтернет для Docker Hub/npm, повтори `docker compose up -d --build` |
| Після зміни пароля не підключається БД | Пароль PostgreSQL збережений у наявному томі; поверни старий пароль або узгоджено мігруй облікові дані. **Не видаляй том навмання** |

## Що здати

- `.dockerignore`, `Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml`.
- Посилання на один основний GitHub-репозиторій TaskFlow.
- README з командами `docker build`, `docker run`, `docker compose up -d` та `docker compose down`.
- Реальні скриншоти: `hello-world`, три контейнери у `docker compose ps`, браузер `http://localhost:3000`, API та за можливості SQL-запит до PostgreSQL.
- `defense/practice-06/DEMO.md` для Google Meet.

**Статус:** Docker збірку, Compose і браузерну перевірку необхідно виконати на твоєму Windows-комп'ютері. У середовищі створення ZIP Docker Engine відсутній; не видаємо неперевірене за підтверджений запуск.
