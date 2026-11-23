# Демо для Google Meet: практика №4

1. Запустіть `npm install`, `npm test`, `npm start` (PowerShell, у корені проєкту).
2. Відкрийте `http://localhost:3000/`: спочатку покажіть, що стара кнопка **Load items** залишилася робочою.
3. У секції Tasks створіть завдання, натисніть **Complete**, **Edit**, **Delete**.
4. У другому PowerShell покажіть:

```powershell
Invoke-RestMethod http://localhost:3000/health
Invoke-RestMethod http://localhost:3000/tasks
$body = @{title='Захист практичної 4'} | ConvertTo-Json
$task = Invoke-RestMethod http://localhost:3000/tasks -Method Post -ContentType 'application/json' -Body $body
$task
Invoke-RestMethod "http://localhost:3000/tasks/$($task.id)"
$update = @{status='done'} | ConvertTo-Json
Invoke-RestMethod "http://localhost:3000/tasks/$($task.id)" -Method Patch -ContentType 'application/json' -Body $update
Invoke-RestMethod "http://localhost:3000/tasks/$($task.id)" -Method Delete
```

5. Відкрийте `docs/api/openapi.yaml` і справжній скрин Swagger Editor.
6. Покажіть файли `docs/adr/0001...`, `0002...`, `0003...` та `src/api`, `src/service`, `domain`.
7. Продемонструйте `npm test`. Скажіть, що в домені інваріанти, у сервісі валідація, у репозиторії SQL, у HTTP маршрути.
8. Перевірте помилки 400/404, наприклад створення без назви або звернення до неіснуючого ID.

Зверніть увагу: `Invoke-RestMethod` для DELETE із порожньою відповіддю може нічого не вивести, це очікувано (204).
