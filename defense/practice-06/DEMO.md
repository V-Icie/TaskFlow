# Захист практичної №6 через Google Meet

**Підготовка:** відкрий у VS Code `TaskFlow` з GitHub-клону, перевір `.env`, запусти Docker Desktop (Linux Engine), залиш браузер відкритим на `http://localhost:3000`.

1. **Мета (20 секунд):** «У шостій практичній я встановив Docker, перевірив hello-world, контейнеризував Express та Nginx, а через Docker Compose запускаю фронтенд, API та PostgreSQL».
2. **60 балів:** виведи `docker version`, потім `docker run hello-world`. Покажи успішне повідомлення.
3. **75–89 балів:** покажи `.dockerignore`, `Dockerfile` і `frontend/Dockerfile`; поясни, що `node_modules` не копіюється, а пакети встановлюються всередині образу. Покажи `docker images` і `docker ps`.
4. **90–100 балів:** відкрий `docker-compose.yml`, покажи три сервіси `web`, `api`, `db`, залежності за healthcheck і `postgres_data`. Виконай `docker compose up -d --build`, після цього `docker compose ps`.
5. **Робота:** відкрий `http://localhost:3000`, натисни Load items. Створи завдання, зміни назву, познач його виконаним, потім видали. Поясни шлях браузер → Nginx → Express → PostgreSQL.
6. **Доказ PostgreSQL:** `docker compose exec -T db psql -U taskflow -d taskflow -c 'SELECT id, title, status FROM tasks ORDER BY id;'` (на момент показу залиш хоча б одне тестове завдання, після показу можеш видалити).
7. **API:** `Invoke-RestMethod http://localhost:8080/health`, `Invoke-RestMethod http://localhost:8080/items`. Якщо є час, `./scripts/check-docker.ps1` перевіряє API та ідемпотентність.
8. **Зупинка:** `docker compose down` і поясни, що іменований том зберігається, оскільки команда без `-v`.

### Якщо щось не працює

- Docker daemon: перевір, що Docker Desktop відкритий.
- Порт зайнятий: зупини локальний `npm start` або standalone контейнер.
- Не готовий API: `docker compose logs --tail=80 api` і `docker compose ps`.
- Nginx 502: перевір, чи API `healthy`.
- Для повної діагностики див. `docs/docker/README.md`.

**Не демонструй вигадані команди або скриншоти.** Повідомлення від викладача: для оцінки понад 60 потрібно захистити практичну, тому домовся про час заздалегідь.
