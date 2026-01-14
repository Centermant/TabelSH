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

/**
 * Загружает основную панель табеля в область #contentArea
 */
export async function loadTimesheetPanel() {
  const contentArea = document.getElementById('contentArea');
  contentArea.innerHTML = `
  <h2>Табель</h2>
  <div class="filter-section">
    <h3>Просмотр табеля за период</h3>
    <div class="form-group">
      <label for="timesheetMonth">Месяц:</label>
      <select id="timesheetMonth" name="month">
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
      <label for="timesheetYear">Год:</label>
      <input type="number" id="timesheetYear" name="year" min="2000" max="2100" step="1" value="">
    </div>
    <button id="viewTimesheetBtn" class="btn btn-primary">Просмотреть</button>
    <button id="generateTimesheetBtn" class="btn btn-secondary">Сформировать</button>
  </div>
  <div class="table-container">
    <table id="timesheetTable">
      <thead>
        <tr>
          <th>Дата</th>
          <th>Рабочее время (ч)</th>
          <th>Описание</th>
        </tr>
      </thead>
      <tbody id="timesheetTableBody">
        <!-- Данные будут загружены сюда -->
      </tbody>
    </table>
  </div>
  `;
  
  // Привязка обработчиков событий после загрузки DOM
  attachEventListeners();
  
  // Загрузка табеля за текущий месяц по умолчанию
  const now = new Date();
  document.getElementById('timesheetMonth').value = now.getMonth() + 1;
  document.getElementById('timesheetYear').value = now.getFullYear();
  await viewTimesheet(now.getMonth() + 1, now.getFullYear());
}

/**
 * Привязывает обработчики событий к элементам интерфейса
 */
function attachEventListeners() {
  document.getElementById('viewTimesheetBtn').addEventListener('click', handleView);
  document.getElementById('generateTimesheetBtn').addEventListener('click', handleGenerate);
}

/**
 * Обрабатывает нажатие кнопки "Просмотреть"
 */
async function handleView() {
  const month = document.getElementById('timesheetMonth').value;
  const year = document.getElementById('timesheetYear').value;
  
  if (!month || !year) {
    alert('Пожалуйста, выберите месяц и год для просмотра табеля.');
    return;
  }
  
  await viewTimesheet(parseInt(month), parseInt(year));
}

/**
 * Обрабатывает нажатие кнопки "Сформировать"
 */
async function handleGenerate() {
  const month = document.getElementById('timesheetMonth').value;
  const year = document.getElementById('timesheetYear').value;
  
  if (!month || !year) {
    alert('Пожалуйста, выберите месяц и год для формирования табеля.');
    return;
  }
  
  if (!confirm(`Вы уверены, что хотите сформировать табель за ${month}.${year}? Это перезапишет существующий табель за этот период.`)) {
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ month: parseInt(month), year: parseInt(year) })
    });
    
    if (response.ok) {
      alert('Табель успешно сформирован!');
      // После формирования, автоматически загрузить обновленный табель
      await viewTimesheet(parseInt(month), parseInt(year));
    } else {
      const errorData = await response.json();
      alert(`Ошибка формирования табеля: ${errorData.error}`);
    }
  } catch (error) {
    console.error('Ошибка формирования табеля:', error);
    alert('Произошла ошибка при формировании табеля.');
  }
}

/**
 * Загружает табель за указанный месяц и год
 * @param {number} month - Месяц (1-12)
 * @param {number} year - Год
 */
async function viewTimesheet(month, year) {
  try {
    const response = await fetch(`${API_BASE}/entries?month=${month}&year=${year}`, {
      headers: authHeaders
    });
    
    if (response.ok) {
      const entries = await response.json();
      const tbody = document.getElementById('timesheetTableBody');
      tbody.innerHTML = '';
      
      if (entries.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="3">Табель за ${month}.${year} не сформирован или пуст.</td>`;
        tbody.appendChild(row);
      } else {
        entries.forEach(entry => {
          // Форматирование даты
          let formattedDate = '';
          if (entry.entry_date) {
            const dateObj = new Date(entry.entry_date);
            formattedDate = `${String(dateObj.getDate()).padStart(2, '0')}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${dateObj.getFullYear()}`;
          }
          
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${entry.work_hours}</td>
            <td>${entry.description || ''}</td>
          `;
          tbody.appendChild(row);
        });
      }
    } else {
      const errorData = await response.json();
      alert(`Ошибка загрузки табеля: ${errorData.error}`);
    }
  } catch (error) {
    console.error('Ошибка загрузки табеля:', error);
    alert('Произошла ошибка при загрузке табеля.');
  }
}