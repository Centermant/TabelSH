const API_BASE = '/api/timesheet';
const AUTH_TOKEN = localStorage.getItem('authToken');

if (!AUTH_TOKEN) {
  window.location.href = '/';
  exit();
}

const authHeaders = {
  'Authorization': `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json'
};

let editingActId = null;

/**
 * Загружает панель рабочих активностей в область #contentArea
 */
export async function loadWorkActivitiesPanel() {
  const contentArea = document.getElementById('contentArea');
  contentArea.innerHTML = `
  <h2>Рабочая активность</h2>
  <div class="form-section">
    <h3 id="activityFormTitle">Добавить рабочую активность</h3>
    <form id="activityForm">
      <input type="hidden" id="activityId">
      <div class="form-group">
        <label for="activityDate">Дата:</label>
        <input type="date" id="activityDate" name="date" required>
      </div>
      <div class="form-group">
        <label for="activityWorkTime">Рабочее время (ч):</label>
        <input type="number" id="activityWorkTime" name="workTime" step="0.01" min="0" required>
      </div>
      <div class="form-group">
        <label for="activityType">Тип работ:</label>
        <select id="activityType" name="activityType" required>
          <option value="Консультация">Консультация</option>
          <option value="Настройка">Настройка</option>
        </select>
      </div>
      <div class="form-group">
        <label for="activityDescription">Описание работ:</label>
        <textarea id="activityDescription" name="description" rows="3"></textarea>
      </div>
      <div class="form-group">
        <label><input type="checkbox" id="activityHasSignedTimesheet" name="hasSignedTimesheet"> Имеется подписанный табель?</label>
      </div>
      <div class="form-group">
        <label for="activityOrganization">Организация:</label>
        <select id="activityOrganization" name="organizationId">
          <option value="">-- Не выбрана --</option>
          <!-- Опции будут загружены сюда -->
        </select>
      </div>
      <button type="submit" class="btn btn-primary">Сохранить</button>
      <button type="button" id="cancelEditActBtn" class="btn btn-danger hidden">Отмена</button>
    </form>
  </div>
  <div class="form-section">
    <div class="filter-section">
      <h3>Фильтр по периоду</h3>
      <div class="form-group">
        <label for="activityMonth">Месяц:</label>
        <select id="activityMonth" name="month">
          <option value="1">Январь</option>
          <option value="2">Февраль</option>
          <option value="3">Март</option>
          <option value="4">Апрель</option>
          <option value="5">Май</option>
          <option value="6">Июнь</option>
          <option value="7">Июль</option>
          <option value="8">Август</option>
          <option value="9">Сентябрь</option>
          <option value="10">Октябрь</option>
          <option value="11">Ноябрь</option>
          <option value="12">Декабрь</option>
        </select>
      </div>
      <div class="form-group">
        <label for="activityYear">Год:</label>
        <input type="number" id="activityYear" name="year" min="2000" max="2100" step="1" value="">
      </div>
      <button id="filterActivitiesBtn" class="btn btn-secondary">Показать</button>
    </div>
    <div class="table-container">
      <table id="workActivitiesTable">
        <thead>
          <tr>
            <th>Дата</th>
            <th>Рабочее время (ч)</th>
            <th>Тип работ</th>
            <th>Описание работ</th>
            <th>Имеется подписанный табель?</th>
            <th>Организация</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody id="workActivitiesTableBody">
          <!-- Данные будут загружены сюда -->
        </tbody>
      </table>
    </div>
  </div>
  `;

  attachEventListeners();
  await loadOrganizationsForSelect();
}

/**
 * Привязывает обработчики событий к элементам интерфейса
 */
function attachEventListeners() {
  document.getElementById('activityForm').addEventListener('submit', handleFormSubmit);
  document.getElementById('cancelEditActBtn').addEventListener('click', resetForm);
  document.getElementById('filterActivitiesBtn').addEventListener('click', handleFilter);
}

/**
 * Загружает список организаций для выпадающего списка
 */
async function loadOrganizationsForSelect() {
  try {
    const response = await fetch(`${API_BASE}/organizations`, {
      headers: authHeaders
    });

    if (response.ok) {
      const orgs = await response.json();
      const selectElement = document.getElementById('activityOrganization');
      selectElement.innerHTML = '<option value="">-- Не выбрана --</option>';

      orgs.forEach(org => {
        const option = document.createElement('option');
        option.value = org.id;
        option.textContent = org.short_name;
        selectElement.appendChild(option);
      });
    } else {
      const errorData = await response.json();
      console.error('Ошибка загрузки организаций для селекта:', errorData.error);
    }
  } catch (error) {
    console.error('Ошибка загрузки организаций для селекта:', error);
  }
}

/**
 * Обрабатывает фильтрацию по периоду
 */
async function handleFilter() {
  const month = document.getElementById('activityMonth').value;
  const year = document.getElementById('activityYear').value;

  if (!month || !year) {
    alert('Пожалуйста, выберите месяц и год для фильтрации.');
    return;
  }

  await loadWorkActivities(parseInt(month), parseInt(year));
}

/**
 * Обрабатывает отправку формы рабочей активности
 * @param {Event} e - Событие отправки формы
 */
async function handleFormSubmit(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const activityData = Object.fromEntries(formData.entries());

  activityData.hasSignedTimesheet = !!activityData.hasSignedTimesheet;

  let url, method;
  if (editingActId) {
    url = `${API_BASE}/work-activities/${editingActId}`;
    method = 'PUT';
  } else {
    url = `${API_BASE}/work-activities`;
    method = 'POST';
  }

  try {
    const response = await fetch(url, {
      method: method,
      headers: authHeaders,
      body: JSON.stringify(activityData)
    });

    if (response.ok) {
      resetForm();
      // После сохранения, перезагрузить с тем же фильтром
      const monthInput = document.getElementById('activityMonth');
      const yearInput = document.getElementById('activityYear');
      const selectedMonth = monthInput.value;
      const selectedYear = yearInput.value;
      if (selectedMonth && selectedYear) {
        await loadWorkActivities(parseInt(selectedMonth), parseInt(selectedYear));
      } else {
        // Если фильтр не применялся, очистить таблицу
        document.getElementById('workActivitiesTableBody').innerHTML = '';
      }
    } else {
      const errorData = await response.json();
      alert(`Ошибка: ${errorData.error}`);
    }
  } catch (error) {
    console.error('Ошибка сохранения рабочей активности:', error);
    alert('Произошла ошибка при сохранении рабочей активности.');
  }
}

/**
 * Сбрасывает форму в начальное состояние
 */
function resetForm() {
  document.getElementById('activityForm').reset();
  document.getElementById('activityId').value = '';
  document.getElementById('activityFormTitle').textContent = 'Добавить рабочую активность';
  editingActId = null;
  document.getElementById('cancelEditActBtn').classList.add('hidden');
}

/**
 * Загружает список рабочих активностей из API
 * @param {number} [month] - Месяц для фильтрации (опционально)
 * @param {number} [year] - Год для фильтрации (опционально)
 */
async function loadWorkActivities(month, year) {
  try {
    let url = `${API_BASE}/work-activities`;
    if (month && year) {
      url += `?month=${month}&year=${year}`;
    }
    const response = await fetch(url, {
      headers: authHeaders
    });

    if (response.ok) {
      const acts = await response.json();
      // Сортировка по дате
      acts.sort((a, b) => new Date(a.date) - new Date(b.date));

      const tbody = document.getElementById('workActivitiesTableBody');
      tbody.innerHTML = '';

      acts.forEach(act => {
        let formattedDate = '';
        if (act.date) {
          const dateObj = new Date(act.date);
          formattedDate = `${String(dateObj.getDate()).padStart(2, '0')}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${dateObj.getFullYear()}`;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${formattedDate}</td>
          <td>${act.work_time}</td>
          <td>${act.activity_type}</td>
          <td>${act.description || ''}</td>
          <td>${act.has_signed_timesheet ? 'Да' : 'Нет'}</td>
          <td>${act.organization_name || ''}</td>
          <td>
            <button class="btn btn-primary edit-act-btn" data-id="${act.id}">Изменить</button>
            <button class="btn btn-danger delete-act-btn" data-id="${act.id}">Удалить</button>
          </td>
        `;
        tbody.appendChild(row);
      });

      document.querySelectorAll('.edit-act-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.getAttribute('data-id');
          editWorkActivity(id);
        });
      });

      document.querySelectorAll('.delete-act-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.getAttribute('data-id');
          deleteWorkActivity(id);
        });
      });
    } else {
      const errorData = await response.json();
      alert(`Ошибка загрузки рабочих активностей: ${errorData.error}`);
    }
  } catch (error) {
    console.error('Ошибка загрузки рабочих активностей:', error);
    alert('Произошла ошибка при загрузке рабочих активностей.');
  }
}

/**
 * Заполняет форму данными рабочей активности для редактирования
 * @param {string} id - ID рабочей активности
 */
async function editWorkActivity(id) {
  try {
    const response = await fetch(`${API_BASE}/work-activities/${id}`, {
      headers: authHeaders
    });

    if (response.ok) {
      const act = await response.json();
      document.getElementById('activityId').value = act.id;
      document.getElementById('activityDate').value = act.date;
      document.getElementById('activityWorkTime').value = act.work_time;
      document.getElementById('activityType').value = act.activity_type;
      document.getElementById('activityDescription').value = act.description || '';
      document.getElementById('activityHasSignedTimesheet').checked = act.has_signed_timesheet;
      document.getElementById('activityOrganization').value = act.organization_id || '';

      document.getElementById('activityFormTitle').textContent = 'Изменить рабочую активность';

      editingActId = act.id;
      document.getElementById('cancelEditActBtn').classList.remove('hidden');
    } else {
      const errorData = await response.json();
      alert(`Ошибка получения данных рабочей активности: ${errorData.error}`);
    }
  } catch (error) {
    console.error('Ошибка редактирования рабочей активности:', error);
    alert('Произошла ошибка при получении данных рабочей активности.');
  }
}

/**
 * Удаляет рабочую активность по ID
 * @param {string} id - ID рабочей активности
 */
async function deleteWorkActivity(id) {
  if (!confirm('Вы уверены, что хотите удалить эту рабочую активность?')) return;

  try {
    const response = await fetch(`${API_BASE}/work-activities/${id}`, {
      method: 'DELETE',
      headers: authHeaders
    });

    if (response.ok) {
      const monthInput = document.getElementById('activityMonth');
      const yearInput = document.getElementById('activityYear');
      const selectedMonth = monthInput.value;
      const selectedYear = yearInput.value;
      if (selectedMonth && selectedYear) {
        await loadWorkActivities(parseInt(selectedMonth), parseInt(selectedYear));
      } else {
        document.getElementById('workActivitiesTableBody').innerHTML = '';
      }
    } else {
      const errorData = await response.json();
      alert(`Ошибка удаления рабочей активности: ${errorData.error}`);
    }
  } catch (error) {
    console.error('Ошибка удаления рабочей активности:', error);
    alert('Произошла ошибка при удалении рабочей активности.');
  }
}