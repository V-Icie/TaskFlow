# Демонстрація №10 через Google Meet

1. Показати fork k8s-demo, Dockerfile, маніфести й контекст minikube.
2. Показати `kubectl get deployment,rs,pods,svc -n k8s-demo`, port-forward і відповідь `/api/status`.
3. Пояснити ConfigMap та Secret, показати докази dev → prod після rollout restart, probes і logs.
4. Показати `k8s-demo.local/api/status` через Ingress; пояснити debug-команди й продемонструвати самовідновлення pod-а (або збережені докази).
5. Показати `kubectl get deployment,rs,pods,svc,pvc -n taskflow`, Dockerfile, власні маніфести, port-forward на 8082, `/items` та скрипт CRUD.
6. Відкрити звіт `docs/kubernetes/REPORT.md` з фактичними результатами. Не показувати пароль, kubeconfig або значення Secret.

Команди для підготовки: `docs/kubernetes/LAB10.md`. Якщо кластер зупинено, `minikube start` відновить профіль; знову запустити tunnel/port-forward за потреби.
