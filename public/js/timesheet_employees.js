const API_BASE = '/api/timesheet';
const AUTH_TOKEN = localStorage.getItem('authToken');

// Проверка авторизации пользователя
if (!AUTH_TOKEN) {
  window.location.href = '/';
  exit();
}

const authHeaders = {
  'Authorization': `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json'
};

let editingEmpId = null;

/**
 * Загружает контент панели сотрудников в область #contentArea
 */
export async function loadEmployeesPanel() {
  const contentArea = document.getElementById('contentArea');
  contentArea.innerHTML = `
  <h2>Сотрудники организаций</h2>
  <div class="form-section">
    <h3 id="employeeFormTitle">Добавить сотрудника</h3>
    <form id="employeeForm">
      <input type="hidden" id="employeeId">
      <div class="form-group">
        <label for="employeeFIO">ФИО:</label>
        <input type="text" id="employeeFIO" name="fio" required>
      </div>
      <div class="form-group">
        <label for="employeePhoneNumber">Номер телефона:</label>
        <input type="text" id="employeePhoneNumber" name="phoneNumber">
      </div>
      <div class="form-group">
        <label for="employeePosition">Должность:</label>
        <input type="text" id="employeePosition" name="position">
      </div>
      <div class="form-group">
        <label for="employeeNotes">Примечание:</label>
        <textarea id="employeeNotes" name="notes" rows="3"></textarea>
      </div>
      <div class="form-group">
        <label for="employeeOrganization">Организация:</label>
        <select id="employeeOrganization" name="organizationId">
          <option value="">-- Не выбрана --</option>
          <!-- Опции будут загружены сюда -->
        </select>
      </div>
      <button type="submit" class="btn btn-primary">Сохранить</button>
      <button type="button" id="cancelEditEmpBtn" class="btn btn-danger hidden">Отмена</button>
    </form>
  </div>
  <div class="table-container">
    <table id="employeesTable">
      <thead>
        <tr>
          <th>ФИО</th>
          <th>Номер телефона</th>
          <th>Должность</th>
          <th>Примечание</th>
          <th>Организация</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody id="employeesTableBody">
        <!-- Данные будут загружены сюда -->
      </tbody>
    </table>
  </div>
  `;

  // Привязка обработчиков событий после загрузки DOM
  attachEventListeners();
  // Загрузка организаций для селекта и списка сотрудников
  await loadOrganizationsForSelect();
  await loadEmployees();
}

/**
 * Привязывает обработчики событий к элементам формы
 */
function attachEventListeners() {
  document.getElementById('employeeForm').addEventListener('submit', handleFormSubmit);
  document.getElementById('cancelEditEmpBtn').addEventListener('click', resetForm);
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
      const selectElement = document.getElementById('employeeOrganization');
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
 * Обрабатывает отправку формы сотрудника
 * @param {Event} e - Событие отправки формы
 */
async function handleFormSubmit(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const empData = Object.fromEntries(formData.entries());

  let url, method;
  if (editingEmpId) {
    url = `${API_BASE}/employees/${editingEmpId}`;
    method = 'PUT';
  } else {
    url = `${API_BASE}/employees`;
    method = 'POST';
  }

  try {
    const response = await fetch(url, {
      method: method,
      headers: authHeaders,
      body: JSON.stringify(empData)
    });

    if (response.ok) {
      resetForm();
      await loadEmployees(); // Перезагружаем список после сохранения
    } else {
      const errorData = await response.json();
      alert(`Ошибка: ${errorData.error}`);
    }
  } catch (error) {
    console.error('Ошибка сохранения сотрудника:', error);
    alert('Произошла ошибка при сохранении сотрудника.');
  }
}

/**
 * Сбрасывает форму в начальное состояние
 */
function resetForm() {
  document.getElementById('employeeForm').reset();
  document.getElementById('employeeId').value = '';
  document.getElementById('employeeFormTitle').textContent = 'Добавить сотрудника';
  editingEmpId = null;
  document.getElementById('cancelEditEmpBtn').classList.add('hidden');
}

/**
 * Загружает список сотрудников из API
 */
async function loadEmployees() {
  try {
    const response = await fetch(`${API_BASE}/employees`, {
      headers: authHeaders
    });

    if (response.ok) {
      const emps = await response.json();
      // Сортировка по ФИО
      emps.sort((a, b) => a.fio.localeCompare(b.fio));

      const tbody = document.getElementById('employeesTableBody');
      tbody.innerHTML = '';

      emps.forEach(emp => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${emp.fio}</td>
          <td>${emp.phone_number || ''}</td>
          <td>${emp.position || ''}</td>
          <td>${emp.notes || ''}</td>
          <td>${emp.organization_name || ''}</td>
          <td>
            <button class="btn btn-primary edit-emp-btn" data-id="${emp.id}">Изменить</button>
            <button class="btn btn-danger delete-emp-btn" data-id="${emp.id}">Удалить</button>
          </td>
        `;
        tbody.appendChild(row);
      });

      document.querySelectorAll('.edit-emp-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.getAttribute('data-id');
          editEmployee(id);
        });
      });

      document.querySelectorAll('.delete-emp-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.getAttribute('data-id');
          deleteEmployee(id);
        });
      });
    } else {
      const errorData = await response.json();
      alert(`Ошибка загрузки сотрудников: ${errorData.error}`);
    }
  } catch (error) {
    console.error('Ошибка загрузки сотрудников:', error);
    alert('Произошла ошибка при загрузке сотрудников.');
  }
}

/**
 * Заполняет форму данными сотрудника для редактирования
 * @param {string} id - ID сотрудника
 */
async function editEmployee(id) {
  try {
    const response = await fetch(`${API_BASE}/employees/${id}`, {
      headers: authHeaders
    });

    if (response.ok) {
      const emp = await response.json();
      document.getElementById('employeeId').value = emp.id;
      document.getElementById('employeeFIO').value = emp.fio;
      document.getElementById('employeePhoneNumber').value = emp.phone_number || '';
      document.getElementById('employeePosition').value = emp.position || '';
      document.getElementById('employeeNotes').value = emp.notes || '';
      document.getElementById('employeeOrganization').value = emp.organization_id || '';

      document.getElementById('employeeFormTitle').textContent = 'Изменить сотрудника';

      editingEmpId = emp.id;
      document.getElementById('cancelEditEmpBtn').classList.remove('hidden');
    } else {
      const errorData = await response.json();
      alert(`Ошибка получения данных сотрудника: ${errorData.error}`);
    }
  } catch (error) {
    console.error('Ошибка редактирования сотрудника:', error);
    alert('Произошла ошибка при получении данных сотрудника.');
  }
}

/**
 * Удаляет сотрудника по ID
 * @param {string} id - ID сотрудника
 */
async function deleteEmployee(id) {
  if (!confirm('Вы уверены, что хотите удалить этого сотрудника?')) return;

  try {
    const response = await fetch(`${API_BASE}/employees/${id}`, {
      method: 'DELETE',
      headers: authHeaders
    });

    if (response.ok) {
      await loadEmployees(); // Перезагружаем список после удаления
    } else {
      const errorData = await response.json();
      alert(`Ошибка удаления сотрудника: ${errorData.error}`);
    }
  } catch (error) {
    console.error('Ошибка удаления сотрудника:', error);
    alert('Произошла ошибка при удалении сотрудника.');
  }
}