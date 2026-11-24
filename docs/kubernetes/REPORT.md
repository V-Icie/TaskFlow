# Практична робота №10. Kubernetes

Статус: шаблон звіту, фактичні результати ще не внесено.
Репозиторій TaskFlow: https://github.com/V-Icie/TaskFlow
Fork k8s-demo: [вставити адресу власного fork]

## 60 балів — локальний сервіс, Docker, Minikube
- [Вставити вивід шести endpoint-ів локального k8s-demo, коротко пояснити кожен.]
- [Додати команди docker build/run та відповідь /api/status у контейнері.]
- [Додати minikube profile list, kubectl config current-context, kubectl get nodes.]
- [Додати kubectl get deployment,rs,pods,svc -n k8s-demo, відповіді API через port-forward.]

## 75 балів — конфігурація та probes
- [Вивід ConfigMap до/після зміни; APP_MODE і /api/status до зміни, після apply без рестарту, після rollout restart.]
- [Вивід describe secret без значень; logs; describe pod.]
- [Зафіксувати шлях, initialDelaySeconds, periodSeconds, failureThreshold для обох probes.]

## 90 балів — Ingress, діагностика, самовідновлення
- [Host з Ingress, результат kubectl get/describe ingress, відповіді /api/status і /api/items через k8s-demo.local.]
- [Вивід pod/Service/Ingress debug-команд, опис фактичних проблем або відсутності проблем.]
- [Вивід списку pod-ів до видалення, після видалення і після відновлення; імена старого й нового pod-а.]

## 100 балів — власний сервіс TaskFlow
TaskFlow — REST-сервіс для керування завданнями користувача. Має `/health`, `/items`, CRUD `/tasks` і підтримку ідемпотентного POST. У кластері планується використати існуючий Dockerfile та PostgreSQL у StatefulSet з PVC; API отримує конфігурацію з ConfigMap та пароль через Secret.
- [Вставити фактичний Dockerfile TaskFlow, команди build/run, відповідь API в контейнері.]
- [Вивід kubectl get deployment,rs,pods,svc,pvc -n taskflow; відповіді API через порт 8082; результат lab10-check-taskflow.ps1.]
- [За наявності — демонстрація зміни RATE_LIMIT_MAX та Ingress.]

## Контрольні запитання

**ConfigMap vs Secret.** ConfigMap зберігає неконфіденційні налаштування. Secret призначений для конфіденційних значень, але base64 не є шифруванням; потрібні обмеження RBAC і налаштування захисту даних.

**Liveness vs readiness.** Liveness визначає, чи контейнер треба перезапустити. Readiness визначає, чи pod готовий отримувати трафік; неготовий pod вилучається з готових endpoints сервісу без обов'язкового перезапуску. Startup probe дає час для початкової ініціалізації.

**Шлях запиту.** Port-forward до Service вибирає pod за селектором та прокидає локальний порт через Kubernetes API до цього pod-а. Для Ingress: локальне визначення домену → тунель → Ingress controller → Service / його endpoints → готовий pod.

**Зміна ConfigMap.** Змінні середовища вже запущеного процесу не оновлюються після `kubectl apply`. Для envFrom застосовується rollout restart Deployment, після чого нові pod-и отримують актуальне значення.

**Самовідновлення.** Deployment через ReplicaSet підтримує бажану кількість реплік. Після видалення pod-а контролер створює новий. Це не гарантує доступність при відмові єдиної ноди.

**Міграція TaskFlow.** На відміну від демо зі статичними items, TaskFlow використовує БД, має CRUD та ідемпотентність. Передбачено окремі Deployment, ClusterIP Service, ConfigMap, Secret та PostgreSQL StatefulSet з PVC. [Уточнити опис після фактичної перевірки.]
