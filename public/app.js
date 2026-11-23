import { fetchWithResilience } from './lib/http.js';

const button = document.querySelector('#load-button');
const list = document.querySelector('#items');
const itemsStatus = document.querySelector('#status');
const counter = document.querySelector('#counter');
const taskForm = document.querySelector('#task-form');
const taskInput = document.querySelector('#task-title');
const taskFeedback = document.querySelector('#task-feedback');
const taskList = document.querySelector('#task-list');
const degradedBanner = document.querySelector('#degraded-banner');
const retryLog = document.querySelector('#retry-log');
const demoStatus = document.querySelector('#demo-status');
const demoButtons = [...document.querySelectorAll('[data-demo]')];

const FAILURE_THRESHOLD = 3;
const COOLDOWN_MS = 8000;
let consecutiveFailures = 0;
let degraded = false;
let recoveryTimer;

function recordRetry({ attempt, delayMs, reason }) {
  const line = document.createElement('li');
  line.textContent = `Повтор №${attempt}: ${reason}, очікування ${delayMs} мс`;
  retryLog.prepend(line);
  while (retryLog.children.length > 6) retryLog.lastElementChild.remove();
}

function setControlsDisabled(disabled) {
  button.disabled = disabled;
  for (const field of taskForm.querySelectorAll('button, input')) field.disabled = disabled;
  for (const field of taskList.querySelectorAll('button, input')) field.disabled = disabled;
}

function markSuccess() {
  consecutiveFailures = 0;
  if (degraded) {
    degraded = false;
    clearTimeout(recoveryTimer);
    degradedBanner.hidden = true;
    setControlsDisabled(false);
  }
}

function markFailure() {
  consecutiveFailures += 1;
  if (consecutiveFailures < FAILURE_THRESHOLD || degraded) return;
  degraded = true;
  degradedBanner.hidden = false;
  setControlsDisabled(true);
  clearTimeout(recoveryTimer);
  recoveryTimer = setTimeout(() => {
    degraded = false;
    consecutiveFailures = 0;
    degradedBanner.hidden = true;
    setControlsDisabled(false);
    taskFeedback.textContent = 'Можна повторити дію. Перевірте стан сервера.';
  }, COOLDOWN_MS);
}

async function apiCall(url, { retry, idempotencyKey, ...options } = {}) {
  try {
    const response = await fetchWithResilience(url, {
      ...options,
      idempotencyKey,
      retry: retry ?? { retries: 2, baseDelayMs: 300, timeoutMs: 3000 },
      onRetry: recordRetry
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const error = new Error(`${body.code || `HTTP ${response.status}`} (requestId: ${body.requestId || response.headers.get('X-Request-Id') || '?'})`);
      error.httpStatus = response.status;
      throw error;
    }
    const result = response.status === 204 ? null : await response.json();
    markSuccess();
    return result;
  } catch (error) {
    markFailure();
    throw error;
  }
}

async function loadItems() {
  button.disabled = true;
  itemsStatus.textContent = 'Завантаження даних із сервера…';
  itemsStatus.className = 'status';
  list.replaceChildren();
  try {
    const items = await apiCall('/items');
    if (!Array.isArray(items)) throw new Error('Невірний формат відповіді API');
    counter.textContent = String(items.length);
    for (const item of items) {
      const row = document.createElement('li');
      row.className = 'item';
      const badge = document.createElement('span');
      badge.className = 'item-number';
      badge.textContent = String(item.id).padStart(2, '0');
      const name = document.createElement('span');
      name.textContent = item.name;
      row.append(badge, name);
      list.append(row);
    }
    itemsStatus.textContent = items.length ? `Успішно завантажено ${items.length} запис(ів).` : 'Таблиця порожня.';
    itemsStatus.className = 'status success';
  } catch (error) {
    counter.textContent = '0';
    itemsStatus.textContent = `Помилка завантаження: ${error.message}`;
    itemsStatus.className = 'status error';
  } finally {
    button.disabled = degraded;
  }
}
button.addEventListener('click', loadItems);

async function renderTasks() {
  const tasks = await apiCall('/tasks');
  taskList.replaceChildren();
  for (const task of tasks) {
    const li = document.createElement('li');
    const title = document.createElement('span');
    title.textContent = `${task.status === 'done' ? '✓' : '○'} ${task.title} `;
    li.append(title);

    const completeBtn = document.createElement('button');
    completeBtn.type = 'button';
    completeBtn.textContent = task.status === 'done' ? 'Reopen' : 'Complete';
    completeBtn.addEventListener('click', async () => {
      try {
        await apiCall(`/tasks/${task.id}`, {
          method: 'PATCH', body: JSON.stringify({ status: task.status === 'done' ? 'open' : 'done' }), retry: { retries: 0 }
        });
        await renderTasks();
        taskFeedback.textContent = 'Статус завдання змінено';
      } catch (e) { taskFeedback.textContent = `Помилка: ${e.message}`; }
    });

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => {
      if (li.querySelector('.edit-input')) return;
      const editInput = document.createElement('input');
      editInput.type = 'text';
      editInput.className = 'edit-input';
      editInput.value = task.title;
      editInput.maxLength = 120;
      const saveBtn = document.createElement('button');
      saveBtn.type = 'button'; saveBtn.textContent = 'Save';
      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button'; cancelBtn.textContent = 'Cancel';
      const closeEditor = () => {
        editInput.remove(); saveBtn.remove(); cancelBtn.remove();
        title.hidden = false; completeBtn.hidden = false;
        editBtn.hidden = false; deleteBtn.hidden = false;
      };
      const saveChanges = async () => {
        const nextTitle = editInput.value.trim();
        if (!nextTitle) { taskFeedback.textContent = 'Назва не може бути порожньою'; return; }
        saveBtn.disabled = true;
        try {
          await apiCall(`/tasks/${task.id}`, { method: 'PATCH', body: JSON.stringify({ title: nextTitle }), retry: { retries: 0 } });
          await renderTasks();
          taskFeedback.textContent = 'Завдання відредаговано';
        } catch (e) {
          taskFeedback.textContent = `Помилка: ${e.message}`;
          saveBtn.disabled = degraded;
        }
      };
      saveBtn.addEventListener('click', saveChanges);
      cancelBtn.addEventListener('click', closeEditor);
      editInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') { event.preventDefault(); void saveChanges(); }
        if (event.key === 'Escape') closeEditor();
      });
      title.hidden = true; completeBtn.hidden = true; editBtn.hidden = true; deleteBtn.hidden = true;
      li.prepend(editInput); li.append(saveBtn, cancelBtn);
      editInput.focus(); editInput.select();
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button'; deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => {
      if (li.querySelector('.confirm-delete')) return;
      const confirmBtn = document.createElement('button');
      confirmBtn.type = 'button'; confirmBtn.textContent = 'Confirm delete';
      confirmBtn.className = 'confirm-delete';
      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button'; cancelBtn.textContent = 'Cancel';
      confirmBtn.addEventListener('click', async () => {
        confirmBtn.disabled = true;
        try {
          await apiCall(`/tasks/${task.id}`, { method: 'DELETE', retry: { retries: 0 } });
          await renderTasks();
          taskFeedback.textContent = 'Завдання видалено';
        } catch (e) { taskFeedback.textContent = `Помилка: ${e.message}`; confirmBtn.disabled = degraded; }
      });
      cancelBtn.addEventListener('click', () => {
        confirmBtn.remove(); cancelBtn.remove(); deleteBtn.hidden = false;
      });
      deleteBtn.hidden = true;
      li.append(confirmBtn, cancelBtn);
    });
    li.append(completeBtn, editBtn, deleteBtn);
    taskList.append(li);
  }
  if (degraded) setControlsDisabled(true);
}

function pendingKey(payload) {
  const fingerprint = JSON.stringify(payload);
  let saved;
  try { saved = JSON.parse(sessionStorage.getItem('taskflow:pending-create') || 'null'); } catch { /* ignore */ }
  if (saved?.fingerprint === fingerprint && typeof saved.key === 'string') return saved.key;
  const key = crypto.randomUUID();
  try { sessionStorage.setItem('taskflow:pending-create', JSON.stringify({ key, fingerprint })); } catch { /* private mode */ }
  return key;
}

taskForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (degraded) return;
  const title = taskInput.value.trim();
  if (!title) { taskFeedback.textContent = 'Введіть назву завдання'; return; }
  const payload = { title };
  const key = pendingKey(payload);
  const submit = taskForm.querySelector('button[type="submit"]');
  submit.disabled = true;
  try {
    const created = await apiCall('/tasks', {
      method: 'POST', body: JSON.stringify(payload), idempotencyKey: key
    });
    try { sessionStorage.removeItem('taskflow:pending-create'); } catch { /* ignore */ }
    taskInput.value = '';
    await renderTasks();
    taskFeedback.textContent = `Завдання #${created.id} створено (захист від дублікатів активний)`;
  } catch (e) { taskFeedback.textContent = `Помилка: ${e.message}`; }
  finally { submit.disabled = degraded; }
});

async function runDemo(scenario) {
  const retry = scenario === 'slow' || scenario === 'fail-always'
    ? { retries: 0, timeoutMs: 1000 }
    : { retries: 2, timeoutMs: 1000, baseDelayMs: 200, jitter: false };
  return apiCall('/health', { headers: { 'X-Demo-Scenario': scenario }, retry });
}

for (const btn of demoButtons) {
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    const scenario = btn.dataset.demo;
    demoStatus.textContent = 'Діагностика виконується…';
    try {
      if (scenario === 'fail-three') {
        for (let n = 0; n < 3; n++) {
          try { await runDemo('fail-always'); } catch { /* intentional for degraded mode */ }
        }
        demoStatus.textContent = 'Три збої поспіль: активовано degraded mode на 8 секунд.';
      } else {
        const result = await runDemo(scenario);
        demoStatus.textContent = `Демонстрація завершена: ${result.status}`;
      }
    } catch (e) { demoStatus.textContent = `Очікувана помилка: ${e.message}`; }
    finally { btn.disabled = false; }
  });
}

async function initializeDemo() {
  try {
    const response = await fetch('/demo/config');
    const config = await response.json();
    demoStatus.textContent = config.enabled
      ? 'Демо-режим активний. Спробуй сценарії 503, 429, timeout та degraded mode.'
      : 'Демо вимкнено. Для запуску встанови DEMO_FAILURES=1 перед npm start.';
    for (const btn of demoButtons) btn.disabled = !config.enabled;
  } catch {
    demoStatus.textContent = 'Не вдалося перевірити демо-режим.';
    for (const btn of demoButtons) btn.disabled = true;
  }
}

renderTasks().catch(e => { taskFeedback.textContent = `Не вдалося завантажити завдання: ${e.message}`; });
initializeDemo();
