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
let editingConId = null;

/**
 * Загружает панель телефонных консультаций в область #contentArea
 */
export async function loadPhoneConsultationsPanel() {
  const contentArea = document.getElementById('contentArea');
  contentArea.innerHTML = `
  <h2>Телефонные консультации</h2>
  <div class="form-section">
    <h3 id="consultationFormTitle">Добавить телефонную консультацию</h3>
    <form id="consultationForm">
      <input type="hidden" id="consultationId">
      <div class="form-group">
        <label for="consultationDate">Дата:</label>
        <input type="date" id="consultationDate" name="date" required>
      </div>
      <div class="form-group">
        <label for="consultationSpentTimeMinutes">Затраченное время (мин):</label>
        <input type="number" id="consultationSpentTimeMinutes" name="spentTimeMinutes" step="1" min="0" required>
      </div>
      <div class="form-group">
        <label for="consultationClientFIO">ФИО клиента:</label>
        <div class="input-with-button">
          <input type="text" id="consultationClientFIO" name="clientFio" readonly>
          <button type="button" id="openClientSelectorBtn" class="btn btn-secondary selector-btn">...</button>
        </div>
        <!-- Модальное окно для выбора клиента -->
        <div id="clientSelectorModal" class="modal hidden">
          <div class="modal-content">
            <h3>Выберите клиента</h3>
            <div class="form-group search-container">
              <input type="text" id="clientSearchInput" placeholder="Введите начало ФИО...">
              <button type="button" id="searchClientBtn" class="btn btn-secondary search-btn">Найти</button>
              <button type="button" id="clearSearchBtn" class="btn btn-secondary clear-btn">Очистить</button>
            </div>
            <ul id="clientList" class="client-list">
              <!-- Список клиентов будет загружен сюда -->
            </ul>
            <button type="button" id="closeClientSelectorBtn" class="btn btn-danger">Закрыть</button>
          </div>
        </div>
      </div>
      <div class="form-group">
        <label for="consultationDescription">Описание:</label>
        <textarea id="consultationDescription" name="description" rows="3"></textarea>
      </div>
      <button type="submit" class="btn btn-primary">Сохранить</button>
      <button type="button" id="cancelEditConBtn" class="btn btn-danger hidden">Отмена</button>
    </form>
  </div>
  <div class="form-section">
    <div class="filter-section">
      <h3>Фильтр по периоду</h3>
      <div class="form-group">
        <label for="consultationMonth">Месяц:</label>
        <select id="consultationMonth" name="month">
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
        <label for="consultationYear">Год:</label>
        <input type="number" id="consultationYear" name="year" min="0" max="2999" step="1" value="">
      </div>
      <button type="button" id="filterConsultationsBtn" class="btn btn-secondary">Показать</button>
    </div>
    <div class="table-container hidden" id="consultationsTableContainer">
      <table id="phoneConsultationsTable">
        <thead>
          <tr>
            <th>Дата</th>
            <th>Затраченное время (ч)</th>
            <th>ФИО клиента</th>
            <th>Описание</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody id="phoneConsultationsTableBody">
          <!-- Данные будут загружены сюда -->
        </tbody>
      </table>
    </div>
  </div>
  `;
  
  // Привязка обработчиков событий после загрузки DOM
  attachEventListeners();
  await loadPhoneConsultations(); // Загрузить все консультации по умолчанию
}

/**
 * Привязывает обработчики событий к элементам интерфейса
 */
function attachEventListeners() {
  document.getElementById('consultationForm').addEventListener('submit', handleFormSubmit);
  document.getElementById('cancelEditConBtn').addEventListener('click', resetForm);
  document.getElementById('filterConsultationsBtn').addEventListener('click', handleFilter);
  document.getElementById('openClientSelectorBtn').addEventListener('click', openClientSelector);
  document.getElementById('closeClientSelectorBtn').addEventListener('click', closeClientSelector);
  document.getElementById('searchClientBtn').addEventListener('click', filterClients);
  document.getElementById('clearSearchBtn').addEventListener('click', clearClientFilter);
  
  // Добавляем обработчик для поля поиска, чтобы предотвратить отправку формы при нажатии Enter
  document.getElementById('clientSearchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      filterClients();
    }
  });
}

/**
 * Открывает модальное окно для выбора клиента
 */
async function openClientSelector() {
  const modal = document.getElementById('clientSelectorModal');
  const clientList = document.getElementById('clientList');
  clientList.innerHTML = '';
  try {
    const response = await fetch(`${API_BASE}/employees`, {
      headers: authHeaders
    });
    if (response.ok) {
      const emps = await response.json();
      emps.sort((a, b) => a.fio.localeCompare(b.fio));
      emps.forEach(emp => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `<button class="client-select-btn" data-fio="${emp.fio}">${emp.fio}</button>`;
        listItem.classList.add('client-item');
        clientList.appendChild(listItem);
      });
      
      // Добавляем обработчики для кнопок выбора клиента
      document.querySelectorAll('.client-select-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          document.getElementById('consultationClientFIO').value = e.target.getAttribute('data-fio');
          closeClientSelector();
        });
      });
    } else {
      const errorData = await response.json();
      console.error('Ошибка загрузки сотрудников для выбора клиента:', errorData.error);
      alert(`Ошибка загрузки сотрудников: ${errorData.error}`);
    }
  } catch (error) {
    console.error('Ошибка загрузки сотрудников для выбора клиента:', error);
    alert('Произошла ошибка при загрузке сотрудников.');
  }
  modal.classList.remove('hidden');
}

/**
 * Закрывает модальное окно для выбора клиента
 */
function closeClientSelector() {
  const modal = document.getElementById('clientSelectorModal');
  modal.classList.add('hidden');
}

/**
 * Фильтрует список клиентов в модальном окне
 */
function filterClients() {
  const searchInput = document.getElementById('clientSearchInput');
  const searchTerm = searchInput.value.toLowerCase();
  const clientItems = document.querySelectorAll('#clientList .client-item');
  clientItems.forEach(item => {
    const text = item.textContent.toLowerCase();
    if (text.includes(searchTerm)) {
      item.style.display = 'block';
    } else {
      item.style.display = 'none';
    }
  });
}

/**
 * Очищает фильтр списка клиентов в модальном окне
 */
function clearClientFilter() {
  const searchInput = document.getElementById('clientSearchInput');
  searchInput.value = '';
  const clientItems = document.querySelectorAll('#clientList .client-item');
  clientItems.forEach(item => {
    item.style.display = 'block';
  });
}

/**
 * Обрабатывает фильтрацию консультаций по периоду
 */
async function handleFilter() {
  const month = document.getElementById('consultationMonth').value;
  const year = document.getElementById('consultationYear').value;
  
  if (!month || !year) {
    alert('Пожалуйста, выберите месяц и год для фильтрации.');
    return;
  }
  
  // Показываем таблицу только после нажатия кнопки "Показать"
  document.getElementById('consultationsTableContainer').classList.remove('hidden');
  await loadPhoneConsultations(parseInt(month), parseInt(year));
}

/**
 * Обрабатывает отправку формы телефонной консультации
 * @param {Event} e - Событие отправки формы
 */
async function handleFormSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const consultationData = Object.fromEntries(formData.entries());
  
  // Проверяем, что поле ФИО клиента заполнено
  if (!consultationData.clientFio) {
    alert('Пожалуйста, выберите клиента из списка.');
    return;
  }
  
  let url, method;
  if (editingConId) {
    url = `${API_BASE}/phone-consultations/${editingConId}`;
    method = 'PUT';
  } else {
    url = `${API_BASE}/phone-consultations`;
    method = 'POST';
  }
  
  try {
    const response = await fetch(url, {
      method: method,
      headers: authHeaders,
      body: JSON.stringify(consultationData)
    });
    
    if (response.ok) {
      resetForm();
      // После сохранения, перезагрузить с тем же фильтром
      const monthInput = document.getElementById('consultationMonth');
      const yearInput = document.getElementById('consultationYear');
      const selectedMonth = monthInput.value;
      const selectedYear = yearInput.value;
      if (selectedMonth && selectedYear) {
        // Показываем таблицу при загрузке данных с фильтром
        document.getElementById('consultationsTableContainer').classList.remove('hidden');
        await loadPhoneConsultations(parseInt(selectedMonth), parseInt(selectedYear));
      } else {
        await loadPhoneConsultations(); // Загрузить все, если фильтр не применялся
      }
    } else {
      const errorData = await response.json();
      alert(`Ошибка: ${errorData.error}`);
    }
  } catch (error) {
    console.error('Ошибка сохранения телефонной консультации:', error);
    alert('Произошла ошибка при сохранении телефонной консультации.');
  }
}

/**
 * Сбрасывает форму в начальное состояние
 */
function resetForm() {
  document.getElementById('consultationForm').reset();
  document.getElementById('consultationId').value = '';
  document.getElementById('consultationFormTitle').textContent = 'Добавить телефонную консультацию';
  editingConId = null;
  document.getElementById('cancelEditConBtn').classList.add('hidden');
}

/**
 * Загружает список телефонных консультаций из API
 * @param {number} [month] - Месяц для фильтрации (опционально)
 * @param {number} [year] - Год для фильтрации (опционально)
 */
async function loadPhoneConsultations(month, year) {
  try {
    let url = `${API_BASE}/phone-consultations`;
    if (month && year) {
      url += `?month=${month}&year=${year}`;
    }
    
    const response = await fetch(url, {
      headers: authHeaders
    });
    
    if (response.ok) {
      const cons = await response.json();
      cons.sort((a, b) => new Date(a.date) - new Date(b.date));
      const tbody = document.getElementById('phoneConsultationsTableBody');
      tbody.innerHTML = '';
      
      if (cons.length === 0) {
        // Если нет данных, показываем сообщение
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="5">Нет данных за выбранный период</td>`;
        tbody.appendChild(row);
      } else {
        cons.forEach(con => {
          let formattedDate = '';
          if (con.date) {
            const dateObj = new Date(con.date);
            formattedDate = `${String(dateObj.getDate()).padStart(2, '0')}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${dateObj.getFullYear()}`;
          }
          
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${con.spent_time}</td>
            <td>${con.client_fio}</td>
            <td>${con.description || ''}</td>
            <td>
              <button class="btn btn-primary edit-con-btn" data-id="${con.id}">Изменить</button>
              <button class="btn btn-danger delete-con-btn" data-id="${con.id}">Удалить</button>
            </td>
          `;
          tbody.appendChild(row);
        });
        
        // Привязка обработчиков для кнопок редактирования и удаления
        document.querySelectorAll('.edit-con-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            editPhoneConsultation(id);
          });
        });
        
        document.querySelectorAll('.delete-con-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            deletePhoneConsultation(id);
          });
        });
      }
    } else {
      const errorData = await response.json();
      alert(`Ошибка загрузки телефонных консультаций: ${errorData.error}`);
    }
  } catch (error) {
    console.error('Ошибка загрузки телефонных консультаций:', error);
    alert('Произошла ошибка при загрузке телефонных консультаций.');
  }
}

/**
 * Заполняет форму данными телефонной консультации для редактирования
 * @param {string} id - ID телефонной консультации
 */
async function editPhoneConsultation(id) {
  try {
    const response = await fetch(`${API_BASE}/phone-consultations/${id}`, {
      headers: authHeaders
    });
    
    if (response.ok) {
      const con = await response.json();
      document.getElementById('consultationId').value = con.id;
      document.getElementById('consultationDate').value = con.date;
      document.getElementById('consultationSpentTimeMinutes').value = Math.round(con.spent_time * 60);
      document.getElementById('consultationClientFIO').value = con.client_fio;
      document.getElementById('consultationDescription').value = con.description || '';
      
      document.getElementById('consultationFormTitle').textContent = 'Изменить телефонную консультацию';
      editingConId = con.id;
      document.getElementById('cancelEditConBtn').classList.remove('hidden');
    } else {
      const errorData = await response.json();
      alert(`Ошибка получения данных телефонной консультации: ${errorData.error}`);
    }
  } catch (error) {
    console.error('Ошибка редактирования телефонной консультации:', error);
    alert('Произошла ошибка при получении данных телефонной консультации.');
  }
}

/**
 * Удаляет телефонную консультацию по ID
 * @param {string} id - ID телефонной консультации
 */
async function deletePhoneConsultation(id) {
  if (!confirm('Вы уверены, что хотите удалить эту телефонную консультацию?')) return;
  
  try {
    const response = await fetch(`${API_BASE}/phone-consultations/${id}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    
    if (response.ok) {
      const monthInput = document.getElementById('consultationMonth');
      const yearInput = document.getElementById('consultationYear');
      const selectedMonth = monthInput.value;
      const selectedYear = yearInput.value;
      if (selectedMonth && selectedYear) {
        await loadPhoneConsultations(parseInt(selectedMonth), parseInt(selectedYear));
      } else {
        await loadPhoneConsultations();
      }
    } else {
      const errorData = await response.json();
      alert(`Ошибка удаления телефонной консультации: ${errorData.error}`);
    }
  } catch (error) {
    console.error('Ошибка удаления телефонной консультации:', error);
    alert('Произошла ошибка при удалении телефонной консультации.');
  }
}