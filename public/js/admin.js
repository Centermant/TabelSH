const API_BASE = '/api/admin';
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

const userForm = document.getElementById('userForm');
const cancelEditBtn = document.getElementById('cancelEditBtn');
let editingUserId = null;

userForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(userForm);
    let userData = Object.fromEntries(formData.entries());

    // Handle multiple checkboxes for applications
    const appCheckboxes = userForm.querySelectorAll('input[name="applications"]:checked');
    userData.applications = Array.from(appCheckboxes).map(cb => cb.value);

    // Remove password from payload if it's empty (for updates)
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
            alert(`Error: ${errorData.error}`);
        }
    } catch (error) {
        console.error('Save user error:', error);
        alert('An error occurred while saving the user.');
    }
});

cancelEditBtn.addEventListener('click', resetForm);

function resetForm() {
    userForm.reset();
    document.getElementById('userId').value = '';
    editingUserId = null;
    cancelEditBtn.classList.add('hidden');
}

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
            alert(`Error loading users: ${errorData.error}`);
        }
    } catch (error) {
        console.error('Load users error:', error);
        alert('An error occurred while loading users.');
    }
}

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
            // Reset and check application checkboxes
            const appCheckboxes = userForm.querySelectorAll('input[name="applications"]');
            appCheckboxes.forEach(cb => {
                cb.checked = user.applications.includes(cb.value);
            });

            editingUserId = user.id;
            cancelEditBtn.classList.remove('hidden');
        } else {
            const errorData = await response.json();
            alert(`Error fetching user: ${errorData.error}`);
        }
    } catch (error) {
        console.error('Edit user error:', error);
        alert('An error occurred while fetching user data.');
    }
}

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
            alert(`Error deleting user: ${errorData.error}`);
        }
    } catch (error) {
        console.error('Delete user error:', error);
        alert('An error occurred while deleting the user.');
    }
}

// Load users on page load
loadUsers();