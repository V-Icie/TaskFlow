# Практична №10 — Kubernetes (Windows / PowerShell)

Мета: виконати навчальний k8s-demo (60–90 балів), потім розгорнути API TaskFlow з PostgreSQL (100 балів). Усі дії локальні. Маніфести TaskFlow не змінюють код, Docker Compose або Grafana. Реальні результати потрібно зафіксувати у REPORT.md; наведені нижче очікування не є доказами виконання.

## 0. Підготовка

У корені TaskFlow зупинити стенд №8 та Compose, не видаляючи томи:

```powershell
docker compose -p lab08-observability -f .lab08-demo/docker-compose.yml -f .lab08-demo/compose.taskflow.yml stop
docker compose -f docker-compose.yml -f docker-compose.observability.yml stop
```

Якщо `.lab08-demo` відсутня, пропустити першу команду. Зупинити локальний `npm start`, якщо працює. Не використовувати `down -v`. Docker Desktop має залишатися запущеним у режимі Linux containers. Зберегти докази №8 перед зупинкою. 

```powershell
winget install -e --id Kubernetes.minikube
winget install -e --id Kubernetes.kubectl
```

Якщо вже встановлено, пропустити відповідну команду. Перезапустити VS Code після встановлення; `minikube version`, `kubectl version --client`, `docker version`. Якщо kubectl несумісний із сервером (різниця понад одну minor-версію), використовувати `minikube kubectl --` замість `kubectl` або встановити сумісний клієнт.

## 1. Рівень 60: навчальний сервіс

1. Відкрити https://github.com/vivalafit/k8s-demo, натиснути Fork і створити власний fork. Клонувати його ПОРУЧ із TaskFlow, а не всередину. У прикладі `YOUR_LOGIN` замінити на власний GitHub login.

```powershell
cd ..
git clone https://github.com/YOUR_LOGIN/k8s-demo.git
cd k8s-demo
npm ci
npm run dev
```

У другому терміналі:

```powershell
curl.exe -i http://localhost:8080/api/status
curl.exe -i 'http://localhost:8080/api/items?filter=a'
curl.exe -i http://localhost:8080/api/slow
curl.exe -i http://localhost:8080/api/error
curl.exe -i http://localhost:8080/healthz
curl.exe -i http://localhost:8080/ready
```

`/api/status` містить appMode, версію і час; `/api/items` повертає відфільтрований список; `/api/slow` відповідає із затримкою; `/api/error` залежить від ERROR_MODE (за замовчуванням off, тож 200 нормальний); `/healthz` перевіряє, чи процес живий; `/ready` відповідає 503 до завершення стартової затримки, потім 200. Зберегти вивід. Зупинити dev через Ctrl+C.

```powershell
docker build -t k8s-demo-app:1.0.0 .
docker run --rm -p 127.0.0.1:8080:8080 -e SECRET_TOKEN=local k8s-demo-app:1.0.0
```

У другому терміналі перевірити `/api/status` і `/healthz` як вище, зберегти вивід, зупинити docker run через Ctrl+C.

```powershell
minikube start --memory=4096 --cpus=2 --driver=docker
minikube profile list
kubectl config get-contexts
kubectl config use-context minikube
kubectl config current-context
kubectl get nodes
minikube image load k8s-demo-app:1.0.0
```

У fork відкрити `k8s/deployment.yaml`, замінити тільки `image: maxnavrotsky/k8s-demo-app:1.0.0` на `image: k8s-demo-app:1.0.0` і `imagePullPolicy: IfNotPresent` на `imagePullPolicy: Never`. Так використовується щойно зібраний локальний образ. Перевірити, що `k8s/configmap.yaml` містить `APP_MODE: "dev"` для початкової демонстрації (upstream може мати prod). У `k8s/ingress.yaml` додати `ingressClassName: nginx` під `spec:` на рівні `rules:`. Не змінювати назви ресурсів. Secret з upstream — лише навчальний приклад; не вставляти особисті паролі й не виводити його значення у звіт.

```powershell
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl rollout status deployment/k8s-demo-api -n k8s-demo --timeout=180s
kubectl get ns k8s-demo
kubectl get configmap,secret -n k8s-demo
kubectl get deployment,rs,pods,svc -n k8s-demo
```

В окремому терміналі залишити запущеним:

```powershell
kubectl port-forward -n k8s-demo svc/k8s-demo-api 8080:80
```

В іншому перевірити `/api/status` та `/api/items` через curl.exe. Зберегти докази. Port-forward до Service вибирає pod та прокидає порт до нього (це не звичайна балансована передача через ClusterIP).

## 2. Рівень 75: ConfigMap, Secret, probes

У `k8s-demo` перевірити стан:

```powershell
kubectl get configmap k8s-demo-config -n k8s-demo -o yaml
kubectl get pods -n k8s-demo
$pod = kubectl get pods -n k8s-demo -l app=k8s-demo-api -o jsonpath='{.items[0].metadata.name}'
kubectl exec -n k8s-demo $pod -- printenv APP_MODE
curl.exe http://localhost:8080/api/status
kubectl describe secret k8s-demo-secret -n k8s-demo
```

`describe secret` показує імена ключів та розмір, не їхній вміст. Змінити `APP_MODE` у файлі `k8s/configmap.yaml` з dev на prod, застосувати лише ConfigMap:

```powershell
kubectl apply -f k8s/configmap.yaml
kubectl get configmap k8s-demo-config -n k8s-demo -o yaml
kubectl exec -n k8s-demo $pod -- printenv APP_MODE
curl.exe http://localhost:8080/api/status
```

Очікування: файл ConfigMap вже prod, але середовище старого pod-а та відповідь API залишаються dev. Зупинити port-forward через Ctrl+C перед рестартом:

```powershell
kubectl rollout restart deployment/k8s-demo-api -n k8s-demo
kubectl rollout status deployment/k8s-demo-api -n k8s-demo --timeout=180s
$pod = kubectl get pods -n k8s-demo -l app=k8s-demo-api -o jsonpath='{.items[0].metadata.name}'
kubectl exec -n k8s-demo $pod -- printenv APP_MODE
kubectl describe pod -n k8s-demo $pod
kubectl logs -n k8s-demo $pod --tail=30
```

Знову запустити port-forward (окремий термінал) та перевірити `/api/status`. Очікування: prod. Зберегти реальні значення probes (delay, period, failure threshold), logs і результати до/після. За типовим upstream liveness `/healthz` delay 5s, period 10s; readiness `/ready` delay 3s, period 5s; failureThreshold за відсутності поля = 3. Звірити з фактичним describe. Зупинити port-forward.

## 3. Рівень 90: Ingress, debug, self-healing

```powershell
minikube addons enable ingress
kubectl rollout status deployment/ingress-nginx-controller -n ingress-nginx --timeout=240s
kubectl apply -f k8s/ingress.yaml
kubectl get ingress -n k8s-demo
kubectl describe ingress k8s-demo-ingress -n k8s-demo
```

У новому терміналі (якщо потрібні права адміністратора, використати окреме вікно) запустити `minikube tunnel` і залишити його відкритим. Для Docker Desktop на Windows адреса зазвичай 127.0.0.1, а IP ноди може бути недоступний з Windows. Спочатку перевірити маршрутизацію без редагування hosts:

```powershell
curl.exe --resolve k8s-demo.local:80:127.0.0.1 http://k8s-demo.local/api/status
curl.exe --resolve k8s-demo.local:80:127.0.0.1 http://k8s-demo.local/api/items
```

Для доступу через браузер додати лише рядок `127.0.0.1 k8s-demo.local` до `C:\Windows\System32\drivers\etc\hosts` у редакторі, запущеному від адміністратора (не перезаписувати інші записи). Відкрити http://k8s-demo.local/api/status. Якщо порт 80 недоступний, перевірити tunnel, зайнятість порту та controller. Для діагностики можна тимчасово зробити port-forward controller `kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8088:80` і перевірити `curl.exe -H 'Host: k8s-demo.local' http://127.0.0.1:8088/api/status`. Це запасний спосіб перевірити Ingress, не заміна підтвердженню доступу на домені:80.

```powershell
kubectl get pods -n k8s-demo -o wide
kubectl describe svc k8s-demo-api -n k8s-demo
kubectl describe ingress k8s-demo-ingress -n k8s-demo
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller --tail=30
kubectl get events -n k8s-demo --sort-by=.metadata.creationTimestamp
```

Видалити один навчальний pod та дочекатися повернення двох реплік:

```powershell
kubectl get pods -n k8s-demo
$pod = kubectl get pods -n k8s-demo -l app=k8s-demo-api -o jsonpath='{.items[0].metadata.name}'
kubectl delete pod -n k8s-demo $pod
kubectl get pods -n k8s-demo -w
```

Коли з'явиться новий pod і обидва READY 1/1, Ctrl+C, потім `kubectl get deployment,rs,pods -n k8s-demo`. Зберегти вивід до/після. Зафіксувати зміни fork через Git (не додавати реальні секрети).

## 4. Рівень 100: TaskFlow API у Kubernetes

Повернутися в корінь власного TaskFlow. Зібрати актуальний Dockerfile з практичної №6:

```powershell
cd ../TaskFlow
npm install
npm test
docker build -t taskflow-api:lab10 .
docker run --rm -p 127.0.0.1:8081:8080 -e PORT=8080 taskflow-api:lab10
```

У другому терміналі `curl.exe http://localhost:8081/health` і `curl.exe http://localhost:8081/items`. Це standalone SQLite (тимчасова база контейнера). Зберегти вивід і зупинити через Ctrl+C. У Kubernetes буде спільна PostgreSQL.

```powershell
minikube image load taskflow-api:lab10
kubectl apply -f k8s/taskflow/namespace.yaml
kubectl apply -f k8s/taskflow/configmap.yaml
```

Створити Secret **один раз**. Випадкове значення генерується локально та не записується у Git. Якщо Secret уже існує, не змінювати пароль без узгодження з існуючою БД.

```powershell
kubectl get secret taskflow-db-secret -n taskflow
# Лише якщо NotFound:
$dbPassword = [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
kubectl create secret generic taskflow-db-secret -n taskflow "--from-literal=DB_PASSWORD=$dbPassword"
Remove-Variable dbPassword
```

```powershell
kubectl apply -f k8s/taskflow/postgres.yaml
kubectl rollout status statefulset/taskflow-db -n taskflow --timeout=240s
kubectl apply -f k8s/taskflow/deployment.yaml
kubectl apply -f k8s/taskflow/service.yaml
kubectl rollout status deployment/taskflow-api -n taskflow --timeout=240s
kubectl get deployment,rs,pods,svc,pvc -n taskflow
```

Початкова одна репліка безпечно ініціалізує БД; після готовності масштабувати до двох (як у теоретичній схемі №9):

```powershell
kubectl scale deployment/taskflow-api -n taskflow --replicas=2
kubectl rollout status deployment/taskflow-api -n taskflow --timeout=180s
kubectl get pods -n taskflow
```

Для повторного застосування deployment.yaml пам'ятати, що він повертає replicas: 1. У новому терміналі:

```powershell
kubectl port-forward -n taskflow svc/taskflow-api 8082:80
```

У головному терміналі:

```powershell
curl.exe http://localhost:8082/health
curl.exe http://localhost:8082/items
curl.exe http://localhost:8082/tasks
.\scripts\lab10-check-taskflow.ps1
```

Перевірка створює тестову задачу, повторює POST з тим самим ключем, змінює статус і видаляє задачу. Якщо PowerShell не дозволяє запуск скрипта, перевірити його вміст; для цього конкретного довіреного завантаженого файлу можна виконати `Unblock-File .\scripts\lab10-check-taskflow.ps1` за політики RemoteSigned, або вручну виконати його команди. Не послаблювати глобальну політику системи.

Додатково (не обов'язково для 100): застосувати `kubectl apply -f k8s/taskflow/ingress.yaml`, з активним tunnel перевірити `curl.exe --resolve taskflow.local:80:127.0.0.1 http://taskflow.local/health`. ConfigMap/Secret уже використані через envFrom. Для демонстрації зміни конфігурації можна змінити RATE_LIMIT_MAX у configmap.yaml з 8 на 12, застосувати, перевірити старий env та після rollout restart новий env (`kubectl exec -n taskflow deployment/taskflow-api -- printenv RATE_LIMIT_MAX`). Не показувати повний env, бо там пароль. /health є простим endpoint, який підтверджує доступність API, але не виконує SELECT до БД; /items перевіряє фактичний доступ до PostgreSQL. Це лабораторна, не production HA: одна нода, одна репліка БД, rate limiter локальний для кожного pod-а.

## 5. Завершення

Зберегти докази й заповнити REPORT.md фактичним виводом. Не комітити `.env`, реальні секрети чи kubeconfig. `git status`, `git add k8s/taskflow docs/kubernetes/LAB10.md docs/kubernetes/REPORT.md defense/practice-10 scripts/lab10-check-taskflow.ps1`, `git diff --cached`, `git commit -m "Complete practice 10: Kubernetes"`, `git push origin main`. У fork окремо закомітити тільки змінені навчальні маніфести та копію REPORT.md/посилання на звіт TaskFlow. Зупинити port-forward і tunnel через Ctrl+C, потім `minikube stop` (не delete). Для повернення попередньої практики в корені TaskFlow `docker compose up -d --build` після зупинки стенда №8; для Grafana див. docs/observability/README.md.

Джерела: методичка практичної №10; https://github.com/vivalafit/k8s-demo ; https://minikube.sigs.k8s.io/docs/start/ ; https://kubernetes.io/docs/tasks/tools/install-kubectl-windows/ .
