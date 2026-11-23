
const button = document.querySelector('#load-button');
const list = document.querySelector('#items');
const itemsStatus = document.querySelector('#status');
const counter = document.querySelector('#counter');

async function loadItems() {
  button.disabled = true;
  itemsStatus.textContent = 'Завантаження даних із сервера…';
  itemsStatus.className = 'status';
  list.replaceChildren();

  try {
    const response = await fetch('/items', {
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const items = await response.json();
    if (!Array.isArray(items)) {
      throw new Error('Невірний формат відповіді API');
    }

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

    itemsStatus.textContent = items.length
      ? `Успішно завантажено ${items.length} запис(ів).`
      : 'Таблиця порожня.';

    itemsStatus.className = 'status success';
  } catch (error) {
    counter.textContent = '0';
    itemsStatus.textContent = `Помилка завантаження: ${error.message}`;
    itemsStatus.className = 'status error';
  } finally {
    button.disabled = false;
  }
}

button.addEventListener('click', loadItems);


// Practice 4: CRUD interface

const taskForm = document.querySelector('#task-form');
const taskInput = document.querySelector('#task-title');
const taskFeedback = document.querySelector('#task-feedback');
const taskList = document.querySelector('#task-list');

async function taskApi(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: options.body
      ? { 'Content-Type': 'application/json', ...options.headers }
      : options.headers
  });

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
    title.textContent =
      `${task.status === 'done' ? '✓' : '○'} ${task.title} `;

    li.append(title);

    // Complete / Reopen
    const completeBtn = document.createElement('button');
    completeBtn.type = 'button';
    completeBtn.textContent =
      task.status === 'done' ? 'Reopen' : 'Complete';

    completeBtn.addEventListener('click', async () => {
      try {
        await taskApi(`/tasks/${task.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            status: task.status === 'done' ? 'open' : 'done'
          })
        });

        await renderTasks();
        taskFeedback.textContent = 'Статус завдання змінено';
      } catch (error) {
        taskFeedback.textContent = `Помилка: ${error.message}`;
      }
    });

    // Edit
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.textContent = 'Edit';

    editBtn.addEventListener('click', () => {
      // Prevent opening multiple editors
      if (li.querySelector('.edit-input')) return;

      const editInput = document.createElement('input');
      editInput.type = 'text';
      editInput.className = 'edit-input';
      editInput.value = task.title;
      editInput.maxLength = 200;

      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.textContent = 'Save';

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.textContent = 'Cancel';

      const closeEditor = () => {
        editInput.remove();
        saveBtn.remove();
        cancelBtn.remove();
        title.hidden = false;
        completeBtn.hidden = false;
        editBtn.hidden = false;
        deleteBtn.hidden = false;
      };

      const saveChanges = async () => {
        const newTitle = editInput.value.trim();

        if (!newTitle) {
          taskFeedback.textContent = 'Назва не може бути порожньою';
          return;
        }

        saveBtn.disabled = true;

        try {
          await taskApi(`/tasks/${task.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ title: newTitle })
          });

          await renderTasks();
          taskFeedback.textContent = 'Завдання відредаговано';
        } catch (error) {
          taskFeedback.textContent = `Помилка: ${error.message}`;
          saveBtn.disabled = false;
        }
      };

      saveBtn.addEventListener('click', saveChanges);
      cancelBtn.addEventListener('click', closeEditor);

      editInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') saveChanges();
        if (event.key === 'Escape') closeEditor();
      });

      title.hidden = true;
      completeBtn.hidden = true;
      editBtn.hidden = true;
      deleteBtn.hidden = true;

      li.prepend(editInput);
      li.append(saveBtn, cancelBtn);
      editInput.focus();
      editInput.select();
    });

    // Delete with inline confirmation
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.textContent = 'Delete';

    deleteBtn.addEventListener('click', () => {
      if (li.querySelector('.confirm-delete')) return;

      const confirmBtn = document.createElement('button');
      confirmBtn.type = 'button';
      confirmBtn.textContent = 'Confirm delete';
      confirmBtn.className = 'confirm-delete';

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.textContent = 'Cancel';

      confirmBtn.addEventListener('click', async () => {
        confirmBtn.disabled = true;

        try {
          await taskApi(`/tasks/${task.id}`, {
            method: 'DELETE'
          });

          await renderTasks();
          taskFeedback.textContent = 'Завдання видалено';
        } catch (error) {
          taskFeedback.textContent = `Помилка: ${error.message}`;
          confirmBtn.disabled = false;
        }
      });

      cancelBtn.addEventListener('click', () => {
        confirmBtn.remove();
        cancelBtn.remove();
        deleteBtn.hidden = false;
      });

      deleteBtn.hidden = true;
      li.append(confirmBtn, cancelBtn);
    });

    li.append(completeBtn, editBtn, deleteBtn);
    taskList.append(li);
  }
}

taskForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const title = taskInput.value.trim();

  if (!title) {
    taskFeedback.textContent = 'Введіть назву завдання';
    return;
  }

  try {
    await taskApi('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title })
    });

    taskInput.value = '';
    await renderTasks();
    taskFeedback.textContent = 'Завдання створено';
  } catch (error) {
    taskFeedback.textContent = `Помилка: ${error.message}`;
  }
});

renderTasks().catch((error) => {
  taskFeedback.textContent =
    `Не вдалося завантажити завдання: ${error.message}`;
});
