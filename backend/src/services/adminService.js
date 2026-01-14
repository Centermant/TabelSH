/**
 * Получает всех пользователей из базы данных.
 * @param {Object} db - Клиент Fastify Postgres.
 * @returns {Promise<Array>} Массив пользователей.
 */
export async function getUsers(db) {
  try {
    const query = 'SELECT id, login, role, applications FROM users ORDER BY id';
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    throw new Error('Не удалось загрузить пользователей из базы данных');
  }
}

/**
 * Получает одного пользователя по ID из базы данных.
 * @param {Object} db - Клиент Fastify Postgres.
 * @param {number} id - ID пользователя.
 * @returns {Promise<Object|null>} Объект пользователя или null, если не найден.
 */
export async function getUserById(db, id) {
  try {
    const query = 'SELECT id, login, role, applications FROM users WHERE id = $1';
    const values = [id];
    const result = await db.query(query, values);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    throw new Error('Не удалось загрузить пользователя из базы данных');
  }
}

/**
 * Создает нового пользователя.
 * @param {Object} db - Клиент Fastify Postgres.
 * @param {Object} userData - Данные для нового пользователя.
 * @returns {Promise<Object>} Созданный объект пользователя.
 */
export async function createUser(db, userData) {
  try {
    const query = `
      INSERT INTO users (login, password, role, applications)
      VALUES ($1, $2, $3, $4)
      RETURNING id, login, role, applications
    `;
    const values = [
      userData.login,
      userData.password || '', // Пароль может быть пустым при создании
      userData.role,
      userData.applications || ['timesheet'] // По умолчанию
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  } catch (error) {
    throw new Error('Не удалось создать пользователя в базе данных');
  }
}

/**
 * Обновляет существующего пользователя.
 * @param {Object} db - Клиент Fastify Postgres.
 * @param {number} id - ID пользователя для обновления.
 * @param {Object} userData - Новые данные для пользователя.
 * @returns {Promise<Object>} Обновленный объект пользователя.
 */
export async function updateUser(db, id, userData) {
  try {
    let query = 'UPDATE users SET ';
    const values = [];
    const setClauses = [];
    
    if (userData.login !== undefined) {
      setClauses.push(`login = $${values.length + 1}`);
      values.push(userData.login);
    }
    
    if (userData.password !== undefined) {
      setClauses.push(`password = $${values.length + 1}`);
      values.push(userData.password);
    }
    
    if (userData.role !== undefined) {
      setClauses.push(`role = $${values.length + 1}`);
      values.push(userData.role);
    }
    
    if (userData.applications !== undefined) {
      setClauses.push(`applications = $${values.length + 1}`);
      values.push(userData.applications);
    }
    
    if (setClauses.length === 0) {
      throw new Error('Нет полей для обновления');
    }
    
    query += setClauses.join(', ') + ` WHERE id = $${values.length + 1} RETURNING id, login, role, applications`;
    values.push(id);
    
    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      throw new Error('Пользователь не найден');
    }
    return result.rows[0];
  } catch (error) {
    throw new Error('Не удалось обновить пользователя в базе данных');
  }
}

/**
 * Удаляет пользователя по ID.
 * @param {Object} db - Клиент Fastify Postgres.
 * @param {number} id - ID пользователя для удаления.
 * @returns {Promise<void>}
 */
export async function deleteUser(db, id) {
  try {
    const query = 'DELETE FROM users WHERE id = $1';
    const values = [id];
    const result = await db.query(query, values);
    if (result.rowCount === 0) {
      throw new Error('Пользователь не найден');
    }
  } catch (error) {
    throw new Error('Не удалось удалить пользователя из базы данных');
  }
}