# Чекліст перед здачею №6

- [ ] `docker version` показує Client **і** Server; Docker Desktop Linux Engine працює.
- [ ] `docker run hello-world` виконується без помилок, збережено справжній скриншот або лог.
- [ ] `.dockerignore`, Dockerfile для API та фронтенду на GitHub.
- [ ] `docker build -t taskflow-api:1.0.0 -f Dockerfile .` успішний.
- [ ] Standalone API доступний на 8080 після `docker run`; перевірено `GET /health`.
- [ ] `.env` створений локально з власним паролем і **не потрапив до Git**.
- [ ] `docker compose config --quiet` без помилок.
- [ ] `docker compose up -d --build` успішний.
- [ ] `docker compose ps` показує web, api, db; API/DB healthy.
- [ ] У браузері `http://localhost:3000` працює Load items та CRUD.
- [ ] `Invoke-RestMethod http://localhost:8080/items` повертає записи з PostgreSQL.
- [ ] `./scripts/check-docker.ps1` проходить перевірку.
- [ ] Через `docker compose exec -T db psql ...` видно тестові завдання.
- [ ] Після down/up із PostgreSQL volume завдання зберігаються (перевірити з окремим завданням).
- [ ] Реальні логи/скрини збережені у `defense/practice-06/evidence/`.
- [ ] `npm test` пройшов на Windows без регресії практичних №1–5.
- [ ] Коміт та push у головний GitHub-репозиторій TaskFlow.
- [ ] Прочитано `QUESTIONS.md`; погоджено час захисту з викладачем.
