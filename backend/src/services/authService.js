import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.SECRET_KEY;

/**
 * Аутентифицирует пользователя на основе логина, пароля и выбранного приложения.
 * @param {Object} db - Клиент Fastify Postgres.
 * @param {string} login - Логин пользователя.
 * @param {string} password - Пароль пользователя.
 * @param {string} application - Выбранное приложение ('admin' или 'timesheet').
 * @returns {Promise<Object>} Объект результата, содержащий статус успешности, токен и информацию о пользователе.
 */
export async function authenticateUser(db, login, password, application) {
  try {
    // Параметризованный запрос для безопасности
    const query = `
      SELECT id, login, role, applications
      FROM users
      WHERE login = $1 AND password = $2
    `;
    const values = [login, password];
    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return { success: false, message: 'Неверные учетные данные' };
    }
    
    const user = result.rows[0];
    
    // Проверка доступа к приложению
    if (!user.applications.includes(application)) {
      return { success: false, message: 'Доступ к выбранному приложению запрещен' };
    }
    
    const token = jwt.sign(
      { userId: user.id, login: user.login, role: user.role, application },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    return {
      success: true,
      token,
      user: { id: user.id, login: user.login, role: user.role }
    };
  } catch (error) {
    throw new Error('Ошибка базы данных при аутентификации');
  }
}

/**
 * Получает пользователя по ID из базы данных.
 * @param {Object} db - Клиент Fastify Postgres.
 * @param {number} id - ID пользователя.
 * @returns {Promise<Object|null>} Объект пользователя или null, если не найден.
 */
export async function getUserById(db, id) {
  try {
    const query = 'SELECT id, login, role FROM users WHERE id = $1';
    const values = [id];
    const result = await db.query(query, values);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    throw new Error('Ошибка базы данных при получении пользователя по ID');
  }
}