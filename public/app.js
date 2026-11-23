const button = document.querySelector('#load-button');
const list = document.querySelector('#items');
const status = document.querySelector('#status');
const counter = document.querySelector('#counter');

async function loadItems() {
  button.disabled = true;
  status.textContent = 'Завантаження даних із сервера…';
  status.className = 'status';
  list.replaceChildren();

  try {
    const response = await fetch('/items', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const items = await response.json();
    if (!Array.isArray(items)) throw new Error('Невірний формат відповіді API');
    counter.textContent = String(items.length);

    for (const item of items) {
      const row = document.createElement('li');
      row.className = 'item';
      const badge = document.createElement('span');
      badge.className = 'item-number';
      badge.textContent = String(item.id).padStart(2, '0');
      const name = document.createElement('span');
      name.textContent = item.name; // textContent захищає від HTML-ін'єкцій
      row.append(badge, name);
      list.append(row);
    }
    status.textContent = items.length ? `Успішно завантажено ${items.length} запис(ів).` : 'Таблиця порожня.';
    status.className = 'status success';
  } catch (error) {
    counter.textContent = '0';
    status.textContent = `Помилка завантаження: ${error.message}`;
    status.className = 'status error';
  } finally {
    button.disabled = false;
  }
}

button.addEventListener('click', loadItems);


// Practice 4: a minimal CRUD interface independent from the Lab 1 /items button.
const taskForm = document.querySelector('#task-form');
const taskInput = document.querySelector('#task-title');
const taskFeedback = document.querySelector('#task-feedback');
const taskList = document.querySelector('#task-list');
async function taskApi(url, options) {
  const res = await fetch(url, { ...options, headers: options?.body ? { 'Content-Type': 'application/json' } : undefined });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.code || `HTTP ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}
async function renderTasks() {
  const tasks = await taskApi('/tasks');
  taskList.replaceChildren();
  for (const task of tasks) {
    const li = document.createElement('li');
    const title = document.createElement('span');
    title.textContent = `${task.status === 'done' ? '✓' : '○'} ${task.title} `;
    li.append(title);
    for (const [label, action] of [
      [task.status === 'done' ? 'Reopen' : 'Complete', async () => taskApi(`/tasks/${task.id}`, { method: 'PATCH', body: JSON.stringify({ status: task.status === 'done' ? 'open' : 'done' }) })],
      ['Edit', async () => { const next = prompt('Нова назва:', task.title); if (next !== null) await taskApi(`/tasks/${task.id}`, { method: 'PATCH', body: JSON.stringify({ title: next }) }); }],
      ['Delete', async () => { if (confirm(`Видалити «${task.title}»?`)) await taskApi(`/tasks/${task.id}`, { method: 'DELETE' }); }]
    ]) {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.textContent = label;
      btn.addEventListener('click', async () => {
        try { await action(); await renderTasks(); taskFeedback.textContent = 'Операцію виконано'; }
        catch (e) { taskFeedback.textContent = `Помилка: ${e.message}`; }
      });
      li.append(btn);
    }
    taskList.append(li);
  }
}
taskForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await taskApi('/tasks', { method: 'POST', body: JSON.stringify({ title: taskInput.value }) });
    taskInput.value = '';
    await renderTasks();
    taskFeedback.textContent = 'Завдання створено';
  } catch (e) { taskFeedback.textContent = `Помилка: ${e.message}`; }
});
renderTasks().catch(e => { taskFeedback.textContent = `Не вдалося завантажити завдання: ${e.message}`; });
