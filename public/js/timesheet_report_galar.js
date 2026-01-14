// /public/js/timesheet_report_galar.js

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

export async function loadReportGalarPanel() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <h2>Отчёт Табель Галар</h2>
        <div class="filter-section">
            <h3>Выберите период отчета</h3>
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
            <button id="saveReportBtn" class="btn btn-primary">Сохранить отчет</button>
        </div>
    `;

    document.getElementById('saveReportBtn').addEventListener('click', handleSaveReport);
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (window.XLSX) {
      console.log("XLSX already available globally.");
      resolve(window.XLSX);
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.type = 'text/javascript';
    script.async = true; // Загружаем асинхронно

    script.onload = () => {
      console.log("Script loaded successfully:", src);
      // Проверяем, доступен ли XLSX в глобальной области
      if (window.XLSX) {
        resolve(window.XLSX);
      } else {
        console.error("XLSX object not found on window after script load.");
        reject(new Error('XLSX library did not attach to window'));
      }
    };

    script.onerror = (event) => {
      console.error("Failed to load script:", src, event);
      reject(new Error(`Failed to load script: ${src}`));
    };

    document.head.appendChild(script);
  });
}

async function handleSaveReport() {
    const month = document.getElementById('reportMonth').value;
    const year = document.getElementById('reportYear').value;

    if (!month || !year) {
        alert('Пожалуйста, выберите месяц и год для отчета.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/report-data?month=${month}&year=${year}`, {
            headers: authHeaders
        });

        if (response.ok) {
            const reportData = await response.json();

            const XLSX = await loadScript('/assets/js/libs/xlsx.mini.min.js');

            generateExcelReport(reportData, month, year, XLSX);
        } else {
            const errorData = await response.json();
            alert(`Error loading report  ${errorData.error}`);
        }
    } catch (error) {
        console.error('Fetch report data error or xlsx script load error:', error);
        alert('An error occurred while fetching report data or loading the report library.');
    }
}

function generateExcelReport(data, month, year, XLSX) {
    const wb = XLSX.utils.book_new();

    const periodName = getMonthName(parseInt(month)) + ' ' + year;
    const headerData = [
        [`Табель`, ``, ``],
        [`Период:`, periodName, ``],
        [``, ``, ``],
        [`Дата`, `Рабочее время`, `Описание`]
    ];

    const entriesData = data.entries.map(entry => {
        let formattedDate = '';
        if (entry.entry_date) {
            const dateObj = new Date(entry.entry_date);
            formattedDate = `${String(dateObj.getDate()).padStart(2, '0')}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${dateObj.getFullYear()}`;
        }
        const workHoursValue = parseFloat(entry.work_hours);
        return [formattedDate, workHoursValue, entry.description];
    });

    // Итоговая строка с общим количеством часов
    const totalHours = data.entries.reduce((sum, entry) => sum + parseFloat(entry.work_hours), 0).toFixed(3);
    const totalRow = [`Всего:`, totalHours, ``];

    const wsData = [...headerData, ...entriesData, totalRow];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    const colWidths = [
        { wch: 12 },
        { wch: 15 },
        { wch: 80 }
    ];
    ws['!cols'] = colWidths;

    for (let i = 3; i < wsData.length; i++) { // Начинаем с 4-й строки (индекс 3), где начинаются данные, включая итог
        const cellAddress = XLSX.utils.encode_cell({ r: i, c: 2 });
        if (ws[cellAddress]) {
            if (!ws[cellAddress].s) {
                ws[cellAddress].s = {};
            }
            ws[cellAddress].s.wrapText = true;
        }
    }

    XLSX.utils.book_append_sheet(wb, ws, "Табель");

    const fileName = `Табель_${data.userInfo.login}_${month.padStart(2, '0')}${year}.xlsx`;

    XLSX.writeFile(wb, fileName);
}

function getMonthName(monthNum) {
    const months = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    return months[monthNum - 1];
}