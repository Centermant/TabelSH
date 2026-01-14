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

let editingOrgId = null;

/**
 * Загружает панель организаций в область #contentArea
 */
export async function loadOrganizationsPanel() {
  const contentArea = document.getElementById('contentArea');
  contentArea.innerHTML = `
  <h2>Организации</h2>
  <div class="table-container">
    <table id="organizationsTable">
      <thead>
        <tr>
          <th>ID</th>
          <th>Сокращенное наименование</th>
          <th>Полное наименование</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody id="organizationsTableBody">
        <!-- Данные будут загружены сюда -->
      </tbody>
    </table>
  </div>
  <div class="form-section">
    <h3 id="organizationFormTitle">Добавить организацию</h3>
    <form id="organizationForm">
      <input type="hidden" id="organizationId">
      <div class="form-group">
        <label for="organizationShortName">Сокращенное наименование:</label>
        <input type="text" id="organizationShortName" name="shortName" required>
      </div>
      <div class="form-group">
        <label for="organizationFullName">Полное наименование:</label>
        <input type="text" id="organizationFullName" name="fullName">
      </div>
      <button type="submit" class="btn btn-primary">Сохранить</button>
      <button type="button" id="cancelEditOrgBtn" class="btn btn-danger hidden">Отмена</button>
    </form>
  </div>
  `;
  
  // Привязка обработчиков событий после загрузки DOM
  attachEventListeners();
  await loadOrganizations();
}

/**
 * Привязывает обработчики событий к элементам интерфейса
 */
function attachEventListeners() {
  document.getElementById('organizationForm').addEventListener('submit', handleFormSubmit);
  document.getElementById('cancelEditOrgBtn').addEventListener('click', resetForm);
}

/**
 * Обрабатывает отправку формы организации
 * @param {Event} e - Событие отправки формы
 */
async function handleFormSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const orgData = Object.fromEntries(formData.entries());
  
  let url, method;
  if (editingOrgId) {
    url = `${API_BASE}/organizations/${editingOrgId}`;
    method = 'PUT';
  } else {
    url = `${API_BASE}/organizations`;
    method = 'POST';
  }
  
  try {
    const response = await fetch(url, {
      method: method,
      headers: authHeaders,
      body: JSON.stringify(orgData)
    });
    
    if (response.ok) {
      resetForm();
      await loadOrganizations();
    } else {
      const errorData = await response.json();
      alert(`Ошибка: ${errorData.error}`);
    }
  } catch (error) {
    console.error('Ошибка сохранения организации:', error);
    alert('Произошла ошибка при сохранении организации.');
  }
}

/**
 * Сбрасывает форму в начальное состояние
 */
function resetForm() {
  document.getElementById('organizationForm').reset();
  document.getElementById('organizationId').value = '';
  document.getElementById('organizationFormTitle').textContent = 'Добавить организацию';
  editingOrgId = null;
  document.getElementById('cancelEditOrgBtn').classList.add('hidden');
}

/**
 * Загружает список организаций из API
 */
async function loadOrganizations() {
  try {
    const response = await fetch(`${API_BASE}/organizations`, {
      headers: authHeaders
    });
    
    if (response.ok) {
      const orgs = await response.json();
      const tbody = document.getElementById('organizationsTableBody');
      tbody.innerHTML = '';
      
      orgs.forEach(org => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${org.id}</td>
          <td>${org.short_name}</td>
          <td>${org.full_name}</td>
          <td>
            <button class="btn btn-primary edit-org-btn" data-id="${org.id}">Изменить</button>
            <button class="btn btn-danger delete-org-btn" data-id="${org.id}">Удалить</button>
          </td>
        `;
        tbody.appendChild(row);
      });
      
      // Привязка обработчиков для кнопок редактирования и удаления
      document.querySelectorAll('.edit-org-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.getAttribute('data-id');
          editOrganization(id);
        });
      });
      
      document.querySelectorAll('.delete-org-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.getAttribute('data-id');
          deleteOrganization(id);
        });
      });
    } else {
      const errorData = await response.json();
      alert(`Ошибка загрузки организаций: ${errorData.error}`);
    }
  } catch (error) {
    console.error('Ошибка загрузки организаций:', error);
    alert('Произошла ошибка при загрузке организаций.');
  }
}

/**
 * Заполняет форму данными организации для редактирования
 * @param {string} id - ID организации
 */
async function editOrganization(id) {
  try {
    const response = await fetch(`${API_BASE}/organizations/${id}`, {
      headers: authHeaders
    });
    
    if (response.ok) {
      const org = await response.json();
      document.getElementById('organizationId').value = org.id;
      document.getElementById('organizationShortName').value = org.short_name;
      document.getElementById('organizationFullName').value = org.full_name || '';
      
      document.getElementById('organizationFormTitle').textContent = 'Изменить организацию';
      editingOrgId = org.id;
      document.getElementById('cancelEditOrgBtn').classList.remove('hidden');
    } else {
      const errorData = await response.json();
      alert(`Ошибка получения данных организации: ${errorData.error}`);
    }
  } catch (error) {
    console.error('Ошибка редактирования организации:', error);
    alert('Произошла ошибка при получении данных организации.');
  }
}

/**
 * Удаляет организацию по ID
 * @param {string} id - ID организации
 */
async function deleteOrganization(id) {
  if (!confirm('Вы уверены, что хотите удалить эту организацию?')) return;
  
  try {
    const response = await fetch(`${API_BASE}/organizations/${id}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    
    if (response.ok) {
      await loadOrganizations();
    } else {
      const errorData = await response.json();
      alert(`Ошибка удаления организации: ${errorData.error}`);
    }
  } catch (error) {
    console.error('Ошибка удаления организации:', error);
    alert('Произошла ошибка при удалении организации.');
  }
}