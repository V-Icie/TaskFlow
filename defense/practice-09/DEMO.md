# Демонстрація в Google Meet (приблизно 2–3 хвилини)

1. Відкрити `docs/kubernetes/architecture.png` та коротко описати призначення TaskFlow API.
2. Показати верхню частину схеми: клієнт використовує DNS для визначення адреси, підключається до Load Balancer, а Ingress Controller маршрутизує трафік за Host і Path.
3. Показати namespace `taskflow`, Service `taskflow-api` та два Pod-и. Service передає запити готовим реплікам на порт 8080; обидві працюють зі спільною PostgreSQL.
4. Пояснити роль Deployment: він задає кількість реплік і образ, ReplicaSet відновлює потрібну кількість Pod-ів. Node-и показані умовно.
5. Показати фіолетовий маршрут GitHub → GitHub Actions → GHCR. У №7 перевірено публікацію образів; у цій схемі kubelet отримує відповідний образ при старті Pod-а. CI/CD не виконує автоматичний deploy до Kubernetes.
6. Відкрити `docs/kubernetes/README.md` з коротким описом. Підкреслити, що це проєктована архітектура, а реальний кластер належить до №10.

Для №9 Docker, Grafana та Minikube запускати не потрібно.
