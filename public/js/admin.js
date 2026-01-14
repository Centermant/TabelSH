const API_BASE = '/api/admin';
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

let editingUserId = null;
const userForm = document.getElementById('userForm');
const cancelEditBtn = document.getElementById('cancelEditBtn');

// Обработчик отправки формы пользователя
userForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(userForm);
  let userData = Object.fromEntries(formData.entries());
  
  // Обработка нескольких чекбоксов для приложений
  const appCheckboxes = userForm.querySelectorAll('input[name="applications"]:checked');
  userData.applications = Array.from(appCheckboxes).map(cb => cb.value);
  
  // Удаление пароля из payload, если он пустой (для обновлений)
  if (!userData.password) {
    delete userData.password;
  }
  
  let url, method;
  if (editingUserId) {
    url = `${API_BASE}/users/${editingUserId}`;
    method = 'PUT';
  } else {
    url = `${API_BASE}/users`;
    method = 'POST';
  }
  
  try {
    const response = await fetch(url, {
      method: method,
      headers: authHeaders,
      body: JSON.stringify(userData)
    });
    
    if (response.ok) {
      resetForm();
      loadUsers();
    } else {
      const errorData = await response.json();
      alert(`Ошибка: ${errorData.error}`);
    }
  } catch (error) {
    console.error('Ошибка сохранения пользователя:', error);
    alert('Произошла ошибка при сохранении пользователя.');
  }
});

// Обработчик клика на кнопку отмены редактирования
cancelEditBtn.addEventListener('click', resetForm);

// Обработчик выхода из системы
document.getElementById('logoutLink').addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.removeItem('authToken');
  localStorage.removeItem('userInfo');
  window.location.href = '/';
});

/**
 * Сбрасывает форму в начальное состояние
 */
function resetForm() {
  userForm.reset();
  document.getElementById('userId').value = '';
  editingUserId = null;
  cancelEditBtn.classList.add('hidden');
}

/**
 * Загружает список пользователей из API
 */
async function loadUsers() {
  try {
    const response = await fetch(`${API_BASE}/users`, {
      headers: authHeaders
    });
    
    if (response.ok) {
      const users = await response.json();
      const tbody = document.getElementById('usersTableBody');
      tbody.innerHTML = '';
      
      users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${user.id}</td>
          <td>${user.login}</td>
          <td>${user.role}</td>
          <td>${user.applications.join(', ')}</td>
          <td>
            <button class="btn btn-primary edit-user-btn" data-id="${user.id}">Изменить</button>
            <button class="btn btn-danger delete-user-btn" data-id="${user.id}">Удалить</button>
          </td>
        `;
        tbody.appendChild(row);
      });
      
      // Привязка обработчиков для кнопок редактирования и удаления
      document.querySelectorAll('.edit-user-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.getAttribute('data-id');
          editUser(id);
        });
      });
      
      document.querySelectorAll('.delete-user-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.getAttribute('data-id');
          deleteUser(id);
        });
      });
    } else {
      const errorData = await response.json();
      alert(`Ошибка загрузки пользователей: ${errorData.error}`);
    }
  } catch (error) {
    console.error('Ошибка загрузки пользователей:', error);
    alert('Произошла ошибка при загрузке пользователей.');
  }
}

/**
 * Заполняет форму данными пользователя для редактирования
 * @param {string} id - ID пользователя
 */
async function editUser(id) {
  try {
    const response = await fetch(`${API_BASE}/users/${id}`, {
      headers: authHeaders
    });
    
    if (response.ok) {
      const user = await response.json();
      document.getElementById('userId').value = user.id;
      document.getElementById('userLogin').value = user.login;
      document.getElementById('userRole').value = user.role;
      
      // Сброс и установка чекбоксов для приложений
      const appCheckboxes = userForm.querySelectorAll('input[name="applications"]');
      appCheckboxes.forEach(cb => {
        cb.checked = user.applications.includes(cb.value);
      });
      
      editingUserId = user.id;
      cancelEditBtn.classList.remove('hidden');
    } else {
      const errorData = await response.json();
      alert(`Ошибка получения данных пользователя: ${errorData.error}`);
    }
  } catch (error) {
    console.error('Ошибка редактирования пользователя:', error);
    alert('Произошла ошибка при получении данных пользователя.');
  }
}

/**
 * Удаляет пользователя по ID
 * @param {string} id - ID пользователя
 */
async function deleteUser(id) {
  if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) return;
  
  try {
    const response = await fetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    
    if (response.ok) {
      loadUsers();
    } else {
      const errorData = await response.json();
      alert(`Ошибка удаления пользователя: ${errorData.error}`);
    }
  } catch (error) {
    console.error('Ошибка удаления пользователя:', error);
    alert('Произошла ошибка при удалении пользователя.');
  }
}

// Загрузка пользователей при загрузке страницы
loadUsers();