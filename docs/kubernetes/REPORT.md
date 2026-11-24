# Практична робота №10. Kubernetes

**Статус:** розгортання та функціональні перевірки виконано 24.11.2026.

- Репозиторій TaskFlow: https://github.com/V-Icie/TaskFlow
- Fork k8s-demo: https://github.com/V-Icie/k8s-demo (коміт `3ca58ab` — Configure local Kubernetes deployment).
- Середовище: Windows 11, Docker Desktop, Minikube v1.39.0, kubectl v1.36.1, Kubernetes v1.37.0, containerd.

## 60 балів — локальний сервіс, Docker, Minikube

### Локальний запуск

```powershell
git clone https://github.com/V-Icie/k8s-demo.git
cd k8s-demo
npm ci
npm run dev
```

Встановлено 92 пакети. npm audit повідомив про 7 вразливостей залежностей; демонстрація виконувалася локально. Застосунок запустився на порту 8080 у режимі dev.

| Запит | Фактичний результат | Призначення |
|---|---|---|
| GET /api/status | HTTP 200, status=ok, appMode=dev, version=1.0.0 | Стан і конфігурація сервісу |
| GET /api/items?filter=a | HTTP 200, Item A | Фільтрація елементів |
| GET /api/slow | HTTP 200, delayMs=2000 | Імітація затримки |
| GET /api/error | HTTP 200, message=No error | Демонстраційна точка помилок; примусовий режим помилок не ввімкнено |
| GET /healthz | HTTP 200, ok | Перевірка життєздатності |
| GET /ready | HTTP 200, status=ready | Перевірка готовності |

[Клонування та npm ci](../../defense/practice-10/evidence/00-k8s-demo-clone-npm-ci.png) · [Локальні endpoint-и](../../defense/practice-10/evidence/01-local-endpoints.png)

### Docker

```powershell
docker build -t k8s-demo-app:1.0.0 .
docker run --rm --name k8s-demo-local -p 127.0.0.1:8080:8080 -e SECRET_TOKEN=local k8s-demo-app:1.0.0
```

У другому терміналі перевірено `/api/status` та `/healthz`. Отримано status=ok, appMode=dev, version=1.0.0 та відповідь `ok` відповідно. Контейнер `k8s-demo-local` відображався у `docker ps`.

[Docker build/run та відповіді API](../../defense/practice-10/evidence/02-docker-demo.png)

### Minikube та розгортання

```powershell
minikube start --memory=4096 --cpus=2 --driver=docker
minikube profile list
kubectl config current-context
kubectl wait --for=condition=Ready node/minikube --timeout=180s
kubectl get nodes
kubectl get pods -A
minikube image load k8s-demo-app:1.0.0
```

Профіль і контекст — minikube, драйвер docker, runtime containerd. Спочатку вузол був NotReady під час ініціалізації. Після очікування отримано `node/minikube condition met`, вузол Ready, усі 8 системних pod-ів Running 1/1. Локальний образ доступний у кластері. У Deployment встановлено `image: k8s-demo-app:1.0.0` та `imagePullPolicy: Never`.

```powershell
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl get deployment,rs,pods,svc -n k8s-demo
kubectl port-forward svc/k8s-demo-api -n k8s-demo 8080:80
```

ReplicaSet `k8s-demo-api-69779f94f` мав DESIRED/CURRENT/READY 2/2/2. Обидва pod-и (`...-j4tsh`, `...-p6z9b`) мали 1/1 Running, 0 рестартів. Service `k8s-demo-api` — ClusterIP `10.98.100.200`, 80/TCP. Port-forward прокинув локальний порт 8080 до порту контейнера 8080 через Service.

Фрагменти відповідей через port-forward (timestamp опущено):

```json
{"status":"ok","appMode":"prod","version":"1.0.0"}
```

```json
[{"id":1,"name":"Item A"},{"id":2,"name":"Item B"},{"id":3,"name":"Item C"}]
```

[Ініціалізація](../../defense/practice-10/evidence/03-minikube-initialization.png) · [Ready та образ](../../defense/practice-10/evidence/03-minikube-nodes.png) · [Ресурси та port-forward](../../defense/practice-10/evidence/04-05-demo-resources-port-forward.png)

## 75 балів — конфігурація та probes

### ConfigMap та rollout

Початковий режим у кластері — prod. У `k8s/configmap.yaml` змінено APP_MODE на dev, виконано apply. Уже запущений контейнер продовжував повертати prod через `printenv APP_MODE` та `/api/status`. Після перезапуску Deployment створено новий ReplicaSet.

```powershell
kubectl apply -f k8s/configmap.yaml
kubectl rollout restart deployment/k8s-demo-api -n k8s-demo
kubectl rollout status deployment/k8s-demo-api -n k8s-demo
kubectl get pods -n k8s-demo
kubectl exec -n k8s-demo deployment/k8s-demo-api -- printenv APP_MODE
```

Фактичний результат: `deployment "k8s-demo-api" successfully rolled out`. Старі pod-и `...-j4tsh` та `...-p6z9b` завершували роботу, нові `k8s-demo-api-69cc5fc95d-cszb8` та `k8s-demo-api-69cc5fc95d-scnkp` були Running. Під час переходу вибір першого pod-а ще повертав prod, оскільки старий pod залишався в списку. Подальша перевірка через Deployment підтвердила `dev`; API через Ingress також повернув `appMode=dev`.

Фактичний кінцевий вміст data ConfigMap:

```yaml
APP_MODE: dev
ERROR_MODE: "off"
READINESS_DELAY_MS: "5000"
SLOW_MS: "1500"
```

[ConfigMap та APP_MODE](../../defense/practice-10/evidence/06-configmap-current.png) · [Rollout](../../defense/practice-10/evidence/07-08-config-rollout.png)

### Secret, probes та logs

```powershell
kubectl describe secret k8s-demo-secret -n k8s-demo
kubectl describe pod k8s-demo-api-69cc5fc95d-cszb8 -n k8s-demo
kubectl logs deployment/k8s-demo-api -n k8s-demo --tail=30
```

Secret `k8s-demo-secret`: тип Opaque, ключ SECRET_TOKEN — 11 bytes. Значення не виводилося. Pod отримує змінні через envFrom із `k8s-demo-config` та `k8s-demo-secret`.

| Probe | Шлях | initialDelaySeconds | periodSeconds | timeoutSeconds | failureThreshold |
|---|---|---:|---:|---:|---:|
| Liveness | /healthz | 5 | 10 | 1 | 3 |
| Readiness | /ready | 3 | 5 | 1 | 3 |

Обидві перевірки використовують HTTP на порту 8080, successThreshold=1. У describe pod умови Ready та ContainersReady — True. У logs зафіксовано регулярні HTTP 200 від `/healthz` і `/ready`. У events було також тимчасове readiness 503 під час запуску, після чого pod став готовим.

[Secret без значення](../../defense/practice-10/evidence/09-secret-describe.png) · [Probes](../../defense/practice-10/evidence/10-pod-probes.png) · [Logs та events](../../defense/practice-10/evidence/14-debug.png)

## 90 балів — Ingress, діагностика, самовідновлення

```powershell
minikube addons enable ingress
kubectl get pods -n ingress-nginx
kubectl get svc -n ingress-nginx
kubectl apply -f k8s/ingress.yaml
kubectl get ingress -n k8s-demo
kubectl describe ingress -n k8s-demo
```

Ingress `k8s-demo-ingress`, клас nginx, host `k8s-demo.local`, path `/`, backend `k8s-demo-api:80`; на момент перевірки endpoints `10.244.0.5:8080` та `10.244.0.6:8080`.

Перші запити завершилися `curl: (6) Could not resolve host: k8s-demo.local`. У Windows hosts запис був закоментований. Для локального доступу виправлено запис на `127.0.0.1 k8s-demo.local`, використано minikube tunnel. Після виправлення:

```powershell
curl.exe http://k8s-demo.local/api/status
curl.exe http://k8s-demo.local/api/items
```

Отримано status=ok, appMode=dev, version=1.0.0 та масив із трьох елементів Item A, Item B, Item C.

[Ingress addon](../../defense/practice-10/evidence/12-ingress-addon.png) · [Початкова діагностика](../../defense/practice-10/evidence/12-ingress-debug.png) · [Hosts](../../defense/practice-10/evidence/14-hosts-debug.png) · [Успішний API через Ingress](../../defense/practice-10/evidence/13-ingress-api.png)

### Самовідновлення

```powershell
kubectl get pods -n k8s-demo
$pod = kubectl get pods -n k8s-demo -l app=k8s-demo-api -o jsonpath='{.items[0].metadata.name}'
kubectl delete pod $pod -n k8s-demo
kubectl get pods -n k8s-demo -w
```

До видалення: `k8s-demo-api-69cc5fc95d-cszb8` і `k8s-demo-api-69cc5fc95d-scnkp`, обидва Running 1/1. Видалено `...-cszb8`. ReplicaSet створив `k8s-demo-api-69cc5fc95d-rf5rf`. Після відновлення `...-rf5rf` та `...-scnkp` — Running 1/1. Повторні запити через Ingress успішні. У events зафіксовано SuccessfulCreate та Started для нового pod-а.

```powershell
kubectl logs deployment/k8s-demo-api -n k8s-demo --tail=20
kubectl describe svc k8s-demo-api -n k8s-demo
kubectl get events -n k8s-demo --sort-by=.metadata.creationTimestamp
```

[Самовідновлення](../../defense/practice-10/evidence/15-16-self-healing.png) · [Діагностика](../../defense/practice-10/evidence/14-debug.png)

## 100 балів — власний сервіс TaskFlow

TaskFlow — REST-сервіс для керування завданнями користувача. Підтримує `/health`, `/items`, CRUD `/tasks` та ідемпотентний POST. Локальний контейнер працює з SQLite за замовчуванням; у Kubernetes використовується PostgreSQL із StatefulSet та PVC, окремий API Deployment і ClusterIP Service.

### Dockerfile

Фактичний [Dockerfile](../../Dockerfile):

```dockerfile
# syntax=docker/dockerfile:1
# Backend: Node.js/Express (Linux container). Node 22 matches node:sqlite tests.
FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
# npm install supports a previously generated package-lock that has not yet
# been updated for the new pg dependency; commit the regenerated lock after
# running npm install locally. The versions are pinned in package.json.
RUN npm install --omit=dev --no-audit --no-fund
COPY src/ ./src/
COPY domain/ ./domain/
# Allow a standalone API container to create its local SQLite database.
RUN mkdir -p /app/data && chown -R node:node /app/data
USER node
EXPOSE 8080
CMD ["node", "src/server.js"]
```

```powershell
docker build -t taskflow-api:lab10 .
docker run --rm -p 127.0.0.1:8081:8080 -e PORT=8080 taskflow-api:lab10
```

У локальному контейнері `/health` повернув `{"status":"ok"}`, `/items` — чотири початкові записи (див. нижче). Після перевірки контейнер зупинено, образ завантажено до Minikube.

### Kubernetes-ресурси

```powershell
minikube image load taskflow-api:lab10
kubectl apply -f k8s/taskflow/namespace.yaml
kubectl apply -f k8s/taskflow/configmap.yaml
```

Створено Secret `taskflow-db-secret` із локально згенерованим паролем, без публікації значення. ConfigMap задає DB_CLIENT=postgres, DB_HOST=taskflow-db, DB_PORT=5432 та інші неконфіденційні параметри.

```powershell
kubectl apply -f k8s/taskflow/postgres.yaml
kubectl rollout status statefulset/taskflow-db -n taskflow
kubectl apply -f k8s/taskflow/deployment.yaml
kubectl apply -f k8s/taskflow/service.yaml
kubectl rollout status deployment/taskflow-api -n taskflow
kubectl scale deployment/taskflow-api -n taskflow --replicas=2
kubectl rollout status deployment/taskflow-api -n taskflow
```

Спочатку API запущено з однією реплікою для ініціалізації БД, потім масштабовано до двох. Маніфести: [k8s/taskflow](../../k8s/taskflow/).

[Образ та Secret](../../defense/practice-10/evidence/17-taskflow-image-secret.png) · [Namespace, ConfigMap, Secret](../../defense/practice-10/evidence/17-taskflow-namespace-config-secret.png) · [PVC](../../defense/practice-10/evidence/18-taskflow-pvc.png)

### Функціональні перевірки

```powershell
kubectl port-forward -n taskflow svc/taskflow-api 8082:80
```

В іншому терміналі виконано `curl.exe http://localhost:8082/health`, `curl.exe http://localhost:8082/items` та `./scripts/lab10-check-taskflow.ps1`.

Фактичний вивід скрипта:

```text
PASS: health
PASS: 4 items
PASS: create and replay (id=1)
PASS: update
PASS: delete
All TaskFlow Kubernetes checks passed
```

Перевірено доступність API, початкові записи, створення завдання, повтор ідемпотентного запиту з тим самим ID, оновлення та видалення. [Результати перевірок](../../defense/practice-10/evidence/19-20-21-taskflow-checks.png).

### Діагностика після перезапуску Minikube

Після `minikube start` демо Deployment відновився до 2/2. У TaskFlow тимчасово спостерігалися Error та CrashLoopBackOff, хоча PVC залишався Bound. Для діагностики використано:

```powershell
kubectl get pods -n taskflow
kubectl logs -n taskflow deployment/taskflow-api --tail=50
kubectl logs -n taskflow deployment/taskflow-api --previous --tail=50
kubectl logs -n taskflow statefulset/taskflow-db --tail=30
```

У попередніх логах API: `Error: Connection terminated due to connection timeout` у PostgreSQL-адаптері. Це підтверджує тимчасову проблему встановлення з'єднання з БД під час відновлення; точну першопричину мережевої затримки окремо не встановлено. У логах PostgreSQL зафіксовано `PostgreSQL Database directory appears to contain a database; Skipping initialization` та `database system is ready to accept connections`. API автоматично повернувся до Running після повторного запуску контейнерів Kubernetes.

[Перезапуск Minikube](../../defense/practice-10/evidence/03-minikube-restart.png) · [Початковий збій](../../defense/practice-10/evidence/22-taskflow-restart-debug.png) · [Автовідновлення](../../defense/practice-10/evidence/23-taskflow-autorecovery.png) · [Логи PostgreSQL](../../defense/practice-10/evidence/24-taskflow-postgres-debug.png)

Підсумковий стан `kubectl get deployment,rs,statefulset,pods,svc,pvc -n taskflow`:

| Ресурс | Фактичний стан |
|---|---|
| Deployment taskflow-api | 2/2 Ready, 2 up-to-date, 2 available |
| ReplicaSet taskflow-api-77778cffd6 | 2 desired, 2 current, 2 ready |
| StatefulSet taskflow-db | 1/1 Ready |
| Pod taskflow-api-77778cffd6-4h7xx | 1/1 Running, 2 restarts |
| Pod taskflow-api-77778cffd6-wbcx4 | 1/1 Running, 2 restarts |
| Pod taskflow-db-0 | 1/1 Running, 1 restart |
| Service taskflow-api | ClusterIP 10.109.65.231, 80/TCP |
| Service taskflow-db | Headless (ClusterIP None), 5432/TCP |
| PVC data-taskflow-db-0 | Bound, 1Gi, RWO, standard |

Після відновлення API повторно повернув:

```json
{"status":"ok"}
```

```json
[
  {"id":1,"name":"Підготувати практичну №1"},
  {"id":2,"name":"Налаштувати Git та GitHub"},
  {"id":3,"name":"Продемонструвати GET /items"},
  {"id":4,"name":"Підготуватися до Google Meet"}
]
```

Повторний запуск port-forward повідомив, що порт 8082 вже зайнято; наявний доступ до API працював. PVC зберігся після перезапуску, а PostgreSQL використав наявний каталог даних. Окремий тест збереження новоствореного завдання між перезапусками не проводився.

[Фінальний стан ресурсів](../../defense/practice-10/evidence/18-taskflow-resources-current.png) · [API після відновлення](../../defense/practice-10/evidence/25-taskflow-api-after-restart.png)

Додатковий Ingress TaskFlow та зміна RATE_LIMIT_MAX не демонструвалися в наведених результатах.

## Контрольні запитання

**ConfigMap vs Secret.** ConfigMap зберігає неконфіденційні налаштування. Secret призначений для конфіденційних значень, але base64 не є шифруванням; потрібні обмеження RBAC і налаштування захисту даних.

**Liveness vs readiness.** Liveness визначає, чи контейнер треба перезапустити. Readiness визначає, чи pod готовий отримувати трафік; неготовий pod вилучається з готових endpoints сервісу без обов'язкового перезапуску. Startup probe дає час для початкової ініціалізації.

**Шлях запиту.** Port-forward до Service вибирає pod за селектором та прокидає локальний порт через Kubernetes API до цього pod-а. Для Ingress: локальне визначення домену → тунель → Ingress controller → Service / його endpoints → готовий pod.

**Зміна ConfigMap.** Змінні середовища вже запущеного процесу не оновлюються після `kubectl apply`. Для envFrom застосовано rollout restart Deployment, після чого нові pod-и отримали актуальне значення dev.

**Самовідновлення.** Deployment через ReplicaSet підтримує бажану кількість реплік. Після видалення pod-а контролер створює новий. Перезапуск контейнера після завершення процесу здійснює kubelet відповідно до restartPolicy. Це не гарантує доступність при відмові єдиної ноди.

**Міграція TaskFlow.** На відміну від демо зі статичними items, TaskFlow використовує БД, має CRUD та ідемпотентність. Розгорнуто API Deployment, ClusterIP Service, ConfigMap, Secret та PostgreSQL StatefulSet з PVC. API масштабовано до двох реплік, функціональні перевірки успішні. Після перезапуску кластера виявлено тимчасову проблему з підключенням до БД та підтверджено відновлення сервісу.

## Висновок

Перевірено локальний запуск, контейнеризацію, розгортання в Kubernetes, конфігурацію через ConfigMap і Secret, probes, port-forward, Ingress та самовідновлення. Власний сервіс TaskFlow розгорнуто з двома репліками API та PostgreSQL із постійним сховищем. Підтверджено CRUD, ідемпотентність і доступність API після перезапуску Minikube.

