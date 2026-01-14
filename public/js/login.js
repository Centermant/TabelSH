document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const loginData = Object.fromEntries(formData.entries());
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      // Сохраняем токен и информацию о пользователе
      localStorage.setItem('authToken', result.token);
      localStorage.setItem('userInfo', JSON.stringify(result.user));
      
      // Перенаправляем на соответствующую страницу в зависимости от выбранного приложения
      if (loginData.application === 'admin') {
        window.location.href = '/app/admin.html';
      } else {
        window.location.href = '/app/index.html';
      }
    } else {
      document.getElementById('errorMessage').textContent = result.error;
      document.getElementById('errorMessage').style.display = 'block';
    }
  } catch (error) {
    console.error('Ошибка входа:', error);
    document.getElementById('errorMessage').textContent = 'Произошла ошибка при входе.';
    document.getElementById('errorMessage').style.display = 'block';
  }
});