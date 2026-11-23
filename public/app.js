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
