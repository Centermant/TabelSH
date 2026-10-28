import { loadTimesheetPanel } from './timesheet_main.js';
import { loadOrganizationsPanel } from './timesheet_organizations.js';
import { loadEmployeesPanel } from './timesheet_employees.js';
import { loadWorkActivitiesPanel } from './timesheet_work_activities.js';
import { loadPhoneConsultationsPanel } from './timesheet_phone_consultations.js';
import { loadReportGalarPanel } from './timesheet_report_galar.js';
import { loadReportClientsPanel } from './timesheet_report_clients.js';

const API_BASE = '/api/timesheet';
const AUTH_TOKEN = localStorage.getItem('authToken');

// Проверка авторизации пользователя
if (!AUTH_TOKEN) {
  window.location.replace('/');
  throw new Error('Не авторизован'); // останавливаем выполнение модуля (exit() в браузере не существует)
}

const authHeaders = {
  'Authorization': `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json'
};

// Обработчики для мобильного меню
const mobileMenu = document.querySelector('.mobile-menu');
const menuBackdrop = document.getElementById('menuBackdrop');

function openMobileMenu() {
  if (!mobileMenu) return;
  mobileMenu.classList.add('open');
  if (menuBackdrop) menuBackdrop.classList.add('show');
}

function closeMobileMenu() {
  if (mobileMenu) mobileMenu.classList.remove('open');
  if (menuBackdrop) menuBackdrop.classList.remove('show');
}

document.querySelector('.menu-toggle')?.addEventListener('click', openMobileMenu);
document.querySelector('.close-menu')?.addEventListener('click', closeMobileMenu);

// Закрытие по клику на затемнение фона и по клавише Esc
if (menuBackdrop) menuBackdrop.addEventListener('click', closeMobileMenu);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeMobileMenu();
    closeAllDropdowns();
  }
});

/* ---------- Выпадающие подменю верхней навигации ----------
   Пункт подменю можно выбрать СРАЗУ при наведении: подменю
   удерживается CSS-правилом .dropdown:hover + невидимым «мостиком»
   над списком (см. theme.css). Клик по кнопке меню дополнительно
   «пиннит» подменю классом .open — удобно на планшетах/тач-экранах,
   где наведения нет. */
function closeAllDropdowns(exceptEl) {
  document.querySelectorAll('.main-nav .dropdown.open').forEach((d) => {
    if (d !== exceptEl) d.classList.remove('open');
  });
}

document.querySelectorAll('.main-nav .dropdown').forEach((dd) => {
  const btn = dd.querySelector(':scope > button');
  if (!btn) return;
  btn.setAttribute('aria-haspopup', 'true');
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const willOpen = !dd.classList.contains('open');
    closeAllDropdowns(dd);
    dd.classList.toggle('open', willOpen);
    btn.setAttribute('aria-expanded', String(willOpen));
  });
  // При уходе курсора сбрасываем «пинн», чтобы состояние не залипало
  dd.addEventListener('mouseleave', () => {
    dd.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  });
});

// Клик мимо выпадающего меню закрывает его
document.addEventListener('click', () => closeAllDropdowns());

// Подсветка активного раздела в обоих меню
function setActiveLink(id) {
  document.querySelectorAll('.main-nav a.active, .mobile-menu a.active')
    .forEach((el) => el.classList.remove('active'));
  const desktop = document.getElementById(id);
  if (desktop) desktop.classList.add('active');
  const mobile = document.getElementById('mobile-' + id);
  if (mobile) mobile.classList.add('active');
}

const logoutBtn = document.getElementById('logoutLink');
if (logoutBtn) {
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    window.location.href = '/';
  });
}

const mobileLogoutBtn = document.getElementById('mobile-logoutLink');
if (mobileLogoutBtn) {
  mobileLogoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    window.location.href = '/';
  });
}

// Обработчики кликов по пунктам меню (десктоп + мобильное)
const NAV_ITEMS = [
  ['timesheetLink', 'timesheet'],
  ['organizationsLink', 'organizations'],
  ['employeesLink', 'employees'],
  ['activitiesLink', 'activities'],
  ['consultationsLink', 'consultations'],
  ['galarReportLink', 'galar-report'],
  ['clientsReportLink', 'clients-report'],
];

NAV_ITEMS.forEach(([id, panel]) => {
  document.getElementById(id)?.addEventListener('click', (e) => {
    e.preventDefault();
    loadPanel(panel);
    setActiveLink(id);
    closeAllDropdowns();
  });
  document.getElementById('mobile-' + id)?.addEventListener('click', (e) => {
    e.preventDefault();
    loadPanel(panel);
    setActiveLink(id);
    closeMobileMenu();
  });
});

/**
 * Загружает указанную панель в область контента
 * @param {string} panelName - Название панели для загрузки
 */
async function loadPanel(panelName) {
  const contentArea = document.getElementById('contentArea');
  
  switch (panelName) {
    case 'timesheet':
      await loadTimesheetPanel();
      break;
    case 'organizations':
      await loadOrganizationsPanel();
      break;
    case 'employees':
      await loadEmployeesPanel();
      break;
    case 'activities':
      await loadWorkActivitiesPanel();
      break;
    case 'consultations':
      await loadPhoneConsultationsPanel();
      break;
    case 'galar-report':
      await loadReportGalarPanel();
      break;
    case 'clients-report':
      await loadReportClientsPanel();
      break;
    default:
      contentArea.innerHTML = `<h2>Панель "${panelName}"</h2><p>Раздел в разработке.</p>`;
  }
}