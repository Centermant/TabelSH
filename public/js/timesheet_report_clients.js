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

export async function loadReportClientsPanel() {
  const contentArea = document.getElementById('contentArea');
  contentArea.innerHTML = `
  <h2>Отчёт табель по клиентам</h2>
  <div class="filter-section">
    <h3>Выберите параметры отчета</h3>
    <div class="form-group">
      <label for="reportMonth">Месяц:</label>
      <select id="reportMonth" name="month">
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
      <label for="reportYear">Год:</label>
      <input type="number" id="reportYear" name="year" min="2000" max="2100" step="1" value="">
    </div>
    <div class="form-group">
      <label for="reportResponsibleFIO">ФИО ответственного:</label>
      <input type="text" id="reportResponsibleFIO" name="responsibleFIO" value="" placeholder="Введите ФИО">
    </div>
    <div class="form-group">
      <label for="reportOrganization">Организация:</label>
      <select id="reportOrganization" name="organizationId" required>
        <option value="">-- Выберите организацию --</option>
        <!-- Опции будут загружены сюда -->
      </select>
    </div>
    <button id="saveClientReportBtn" class="btn btn-primary">Сохранить отчет</button>
  </div>
  `;
  
  document.getElementById('saveClientReportBtn').addEventListener('click', handleSaveReport);
  await loadOrganizationsForSelect();
}

async function loadOrganizationsForSelect() {
  try {
    const response = await fetch(`${API_BASE}/organizations`, {
      headers: authHeaders
    });
    
    if (response.ok) {
      const orgs = await response.json();
      const selectElement = document.getElementById('reportOrganization');
      selectElement.innerHTML = '<option value="">-- Выберите организацию --</option>';
      
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

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (window.XLSX) {
      console.log("XLSX уже доступен глобально.");
      resolve(window.XLSX);
      return;
    }
    
    const script = document.createElement('script');
    script.src = src;
    script.type = 'text/javascript';
    script.async = true;
    
    script.onload = () => {
      console.log("Скрипт успешно загружен:", src);
      if (window.XLSX) {
        resolve(window.XLSX);
      } else {
        console.error("Объект XLSX не найден в window после загрузки скрипта.");
        reject(new Error('Библиотека XLSX не была прикреплена к window'));
      }
    };
    
    script.onerror = (event) => {
      console.error("Ошибка загрузки скрипта:", src, event);
      reject(new Error(`Ошибка загрузки скрипта: ${src}`));
    };
    
    document.head.appendChild(script);
  });
}

async function handleSaveReport() {
  const month = document.getElementById('reportMonth').value;
  const year = document.getElementById('reportYear').value;
  const responsibleFIO = document.getElementById('reportResponsibleFIO').value.trim();
  const organizationId = document.getElementById('reportOrganization').value;
  
  if (!month || !year || !organizationId) {
    alert('Пожалуйста, выберите месяц, год и организацию для отчета.');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/client-report-data?month=${month}&year=${year}&organizationId=${organizationId}`, {
      headers: authHeaders
    });
    
    if (response.ok) {
      const reportData = await response.json();
      const XLSX = await loadScript('/assets/js/libs/xlsx.mini.min.js');
      generateExcelClientReport(reportData, month, year, responsibleFIO, XLSX);
    } else {
      const errorData = await response.json();
      alert(`Ошибка загрузки данных отчета по клиентам: ${errorData.error}`);
    }
  } catch (error) {
    console.error('Ошибка загрузки данных отчета по клиентам или скрипта xlsx:', error);
    alert('Произошла ошибка при загрузке данных отчета по клиентам или библиотеки отчетов.');
  }
}

/**
 * Генерирует Excel-файл отчета по клиентам
 * @param {Object} data - Данные для отчета
 * @param {string} month - Месяц отчета
 * @param {string} year - Год отчета
 * @param {string} responsibleFIO - ФИО ответственного
 * @param {Object} XLSX - Библиотека XLSX
 */
function generateExcelClientReport(data, month, year, responsibleFIO, XLSX) {
  const wb = XLSX.utils.book_new();
  const periodName = getMonthName(parseInt(month)) + ' ' + year;

  const allEntriesByDate = {};

  data.activities.forEach(activity => {
    const dateObj = new Date(activity.date);
    const dateStr = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD

    if (!allEntriesByDate[dateStr]) {
      allEntriesByDate[dateStr] = { date: dateObj, activities: [], consultations: [] };
    }

    allEntriesByDate[dateStr].activities.push({
      work_time: activity.work_time,
      description: `${activity.activity_type} ${activity.description}`
    });
  });

  for (const dateStr in data.phoneConsultations) {
    const dateObj = new Date(dateStr);

    if (!allEntriesByDate[dateStr]) {
      allEntriesByDate[dateStr] = { date: dateObj, activities: [], consultations: [] };
    }

    allEntriesByDate[dateStr].consultations.push(...data.phoneConsultations[dateStr]);
  }

  const rowData = [];
  const sortedDates = Object.keys(allEntriesByDate).sort();

  for (const dateStr of sortedDates) {
    const entry = allEntriesByDate[dateStr];
    const formattedDate = `${String(entry.date.getDate()).padStart(2, '0')}.${String(entry.date.getMonth() + 1).padStart(2, '0')}.${entry.date.getFullYear()}`;

    for (const act of entry.activities) {
      const workHoursValue = parseFloat(act.work_time);
      const description = act.description;
      rowData.push([formattedDate, workHoursValue, description]);
    }

    if (entry.consultations.length > 0) {
      let totalConsultationHours = 0;
      entry.consultations.forEach(c => {
          const spentTimeNum = parseFloat(c.spent_time);
          if (isNaN(spentTimeNum)) {
              console.error("Invalid spent_time value:", c.spent_time);
              return;
          }
          totalConsultationHours += spentTimeNum + 0.125;
          //Добавление 0,125 ч к каждой консультации - особенность организации
      });

      const allClientNames = entry.consultations.map(c => c.client_fio).join(', ');
      const consultationDescription = `Телефонные консультации - ${totalConsultationHours.toFixed(3).replace(/\.?0+$/, '')} ч. - ${allClientNames}`;

      rowData.push([formattedDate, totalConsultationHours, consultationDescription]);
  }
  }

  const totalHours = rowData.reduce((sum, row) => sum + row[1], 0).toFixed(3);

  const wsData = [];

  wsData.push([], [], []);

  wsData.push([
    data.organizationName,
    '',
    '',
    '',
    '',
    'ООО «ГАЛАР»' //Название организации-исполнителя в отчёте
  ]);

  wsData.push([
    '',
    '',
    'Исполнитель:',
    responsibleFIO,
    '',
    ''
  ]);

  wsData.push([
    'График консультаций по использованию ПП «Парус-Бюджет» за',
    'График консультаций по использованию ПП «Парус-Бюджет» за',
    'График консультаций по использованию ПП «Парус-Бюджет» за',
    'График консультаций по использованию ПП «Парус-Бюджет» за',
    periodName,
    periodName
  ]);

  wsData.push([], []);

  wsData.push([
    'Число',
    'Часы',
    'Направление работы',
    'Направление работы',
    'Направление работы',
    'Направление работы'
  ]);

  for (const row of rowData) {
    wsData.push([
      row[0],
      row[1],
      row[2],
      row[2],
      row[2],
      row[2]
    ]);
  }

  const lastRow = wsData.length;
  wsData.push([
    'Итого:',
    `${totalHours} ч.`,
    '',
    '',
    '',
    ''
  ]);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  const colWidths = [
    { wch: 12 },
    { wch: 10 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 }
  ];
  ws['!cols'] = colWidths;

  for (let i = 5; i < wsData.length; i++) {
    for (let colIndex = 2; colIndex <= 5; colIndex++) {
      const cellAddress = XLSX.utils.encode_cell({ r: i, c: colIndex });
      if (ws[cellAddress]) {
        if (!ws[cellAddress].s) {
          ws[cellAddress].s = {};
        }
        ws[cellAddress].s.wrapText = true;
      }
    }
  }

  if (!ws['!merges']) {
    ws['!merges'] = [];
  }

  ws['!merges'].push({
    s: { r: 5, c: 0 },
    e: { r: 5, c: 3 }
  });

  ws['!merges'].push({
    s: { r: 5, c: 4 },
    e: { r: 5, c: 5 }
  });

  ws['!merges'].push({
    s: { r: 8, c: 2 },
    e: { r: 8, c: 5 }
  });

  for (let rowIndex = 9; rowIndex <= lastRow; rowIndex++) {
    ws['!merges'].push({
      s: { r: rowIndex, c: 2 },
      e: { r: rowIndex, c: 5 }
    });
  }

  XLSX.utils.book_append_sheet(wb, ws, "Отчет");

  const fileName = `Отчет_по_клиентам_${data.organizationName}_${month.padStart(2, '0')}${year}.xlsx`;

  XLSX.writeFile(wb, fileName);
}

function getMonthName(monthNum) {
  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  return months[monthNum - 1];
}