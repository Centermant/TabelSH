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

document.getElementById('logoutLink').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    window.location.href = '/';
});

// Заглушка для загрузки панелей
document.getElementById('timesheetLink').addEventListener('click', (e) => {
    e.preventDefault();
    loadPanel('timesheet');
});

document.getElementById('organizationsLink').addEventListener('click', (e) => {
    e.preventDefault();
    loadPanel('organizations');
});

document.getElementById('employeesLink').addEventListener('click', (e) => {
    e.preventDefault();
    loadPanel('employees');
});

document.getElementById('activitiesLink').addEventListener('click', (e) => {
    e.preventDefault();
    loadPanel('activities');
});

document.getElementById('consultationsLink').addEventListener('click', (e) => {
    e.preventDefault();
    loadPanel('consultations');
});

async function loadPanel(panelName) {
    // В реальном приложении здесь будет подгрузка соответствующего HTML/CSS/JS
    // для каждой панели. Пока просто покажем сообщение.
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `<h2>Панель "${panelName}"</h2><p>Раздел в разработке.</p>`;
    // Пример подгрузки внешнего JS для панели
    // await loadScript(`/js/timesheet_${panelName}.js`);
}

// async function loadScript(src) {
//     return new Promise((resolve, reject) => {
//         const script = document.createElement('script');
//         script.src = src;
//         script.onload = resolve;
//         script.onerror = reject;
//         document.head.appendChild(script);
//     });
// }