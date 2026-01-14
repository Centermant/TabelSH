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
  window.location.href = '/';
  exit();
}

const authHeaders = {
  'Authorization': `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json'
};

// Обработчик выхода из системы
document.getElementById('logoutLink').addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.removeItem('authToken');
  localStorage.removeItem('userInfo');
  window.location.href = '/';
});

// Обработчики для мобильного меню
document.querySelector('.menu-toggle').addEventListener('click', () => {
  document.querySelector('.mobile-menu').classList.add('open');
});

document.querySelector('.close-menu').addEventListener('click', () => {
  document.querySelector('.mobile-menu').classList.remove('open');
});

document.getElementById('mobile-logoutLink').addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.removeItem('authToken');
  localStorage.removeItem('userInfo');
  window.location.href = '/';
});

// Обработчики кликов по пунктам мобильного меню
document.getElementById('mobile-timesheetLink').addEventListener('click', (e) => {
  e.preventDefault();
  loadPanel('timesheet');
  document.querySelector('.mobile-menu').classList.remove('open');
});

document.getElementById('mobile-organizationsLink').addEventListener('click', (e) => {
  e.preventDefault();
  loadPanel('organizations');
  document.querySelector('.mobile-menu').classList.remove('open');
});

document.getElementById('mobile-employeesLink').addEventListener('click', (e) => {
  e.preventDefault();
  loadPanel('employees');
  document.querySelector('.mobile-menu').classList.remove('open');
});

document.getElementById('mobile-activitiesLink').addEventListener('click', (e) => {
  e.preventDefault();
  loadPanel('activities');
  document.querySelector('.mobile-menu').classList.remove('open');
});

document.getElementById('mobile-consultationsLink').addEventListener('click', (e) => {
  e.preventDefault();
  loadPanel('consultations');
  document.querySelector('.mobile-menu').classList.remove('open');
});

document.getElementById('mobile-galarReportLink').addEventListener('click', (e) => {
  e.preventDefault();
  loadPanel('galar-report');
  document.querySelector('.mobile-menu').classList.remove('open');
});

document.getElementById('mobile-clientsReportLink').addEventListener('click', (e) => {
  e.preventDefault();
  loadPanel('clients-report');
  document.querySelector('.mobile-menu').classList.remove('open');
});

// Обработчики кликов по пунктам основного меню
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

document.getElementById('galarReportLink').addEventListener('click', (e) => {
  e.preventDefault();
  loadPanel('galar-report');
});

document.getElementById('clientsReportLink').addEventListener('click', (e) => {
  e.preventDefault();
  loadPanel('clients-report');
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