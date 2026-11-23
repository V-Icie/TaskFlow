# Сценарій Google Meet: практична №5

**Тема:** Error-handling bottlenecks (ідемпотентність, ретраї, таймаути, 429, кореляція запитів, degraded mode).

## 0. Підготовка (до демонстрації екрана)

Відкрий PowerShell у **головному каталозі твого клону TaskFlow**:

```powershell
npm install
npm test
$env:DEMO_FAILURES='1'
npm start
```

Не закривай цей термінал. У браузері відкрий `http://localhost:3000/`. Для інших команд використовуй **другий** термінал.

## 1. Непорушність попередніх практичних (30–60 секунд)

- Натисни `Load items`, покажи список із SQLite.
- Створи завдання у CRUD, перейменуй через `Edit → Save`, натисни `Complete`, потім `Reopen`.
- Розкажи, що `POST /tasks` тепер потребує заголовок `Idempotency-Key`; фронтенд додає його автоматично.

## 2. Ідемпотентність POST (1 хвилина)

У другому PowerShell:

```powershell
$key = [guid]::NewGuid().ToString()
$body = @{ title = 'Demo idempotency' } | ConvertTo-Json
$headers = @{ 'Idempotency-Key' = $key; 'X-Request-Id' = 'demo-01' }
$a = Invoke-WebRequest 'http://localhost:3000/tasks' -Method Post -ContentType 'application/json' -Headers $headers -Body $body
$headers['X-Request-Id'] = 'demo-02'
$b = Invoke-WebRequest 'http://localhost:3000/tasks' -Method Post -ContentType 'application/json' -Headers $headers -Body $body
$a.Content
$b.Content
$a.Headers['X-Request-Id']
$b.Headers['X-Request-Id']
```

Очікування: однаковий `id` та тіло відповіді в обох викликах; заголовки `X-Request-Id` відображають `demo-01` і `demo-02`. У списку `/tasks` лише **один** доданий запис `Demo idempotency`.

> Якщо PowerShell `Invoke-WebRequest` має нюанси з заголовками, можна використати `Invoke-RestMethod` для тіл і окремий `Invoke-WebRequest` для заголовків.

## 3. Автоматичні повтори та rate limiting (1 хвилина)

У браузері в розділі «Відмовостійкість»:

1. Натисни `503 → retry`. У «Історії повторів» буде `HTTP 503`, а потім успішна відповідь.
2. Натисни `429 → Retry-After`. Клієнт побачить `429`, зачекає **1 секунду** згідно `Retry-After` та повторить.

Пояснення: клієнт повторює GET і тільки POST, захищені ідемпотентним ключем; 429 і 5xx не створюють безмежних повторів.

## 4. AbortController та degraded mode (1 хвилина)

1. Натисни `Timeout 1с`: сервер навмисно затримує `/health` на ~1.6 с; браузер скасовує запит після ~1 с.
2. Натисни `3 помилки → degraded`: три контрольовані помилки 503 переводять інтерфейс у режим перевантаження.
3. Покажи банер і заблоковані CRUD-кнопки; через 8 секунд вони автоматично розблоковуються.

## 5. Єдиний формат помилки (30 секунд)

Виконай у PowerShell (створить помилку 400):

```powershell
$body = @{ title = 'Without key' } | ConvertTo-Json
try {
  Invoke-RestMethod 'http://localhost:3000/tasks' -Method Post -ContentType 'application/json' -Body $body
} catch {
  $_.ErrorDetails.Message
}
```

Покажи поля `error`, `code`, `details`, `requestId`. Поясни призначення `X-Request-Id` для діагностики.

## 6. Завершення

- Покажи `tests/idempotency.test.js`, `tests/httpResilience.test.js`, `tests/middleware.test.js`.
- Покажи `src/middleware/resilience.js`, `src/service/idempotencyService.js`, `public/lib/http.js`.
- Поясни, чому зберігаємо ідемпотентність у SQLite-транзакції та не робимо автоматичних ретраїв для PATCH/DELETE.
- При потребі покажи OpenAPI та GitHub.

Зупинка сервера: Ctrl+C. Деморежим вимкнути: `Remove-Item Env:DEMO_FAILURES`.
