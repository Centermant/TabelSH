/**
 * Получает все организации из базы данных.
 * @param {Object} db - Клиент Fastify Postgres.
 * @returns {Promise<Array>} Массив организаций.
 */
export async function getOrganizations(db) {
  try {
    // Убираем алиасы, используем оригинальные имена столбцов
    const query = 'SELECT id, short_name, full_name FROM organizations ORDER BY id';
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    throw new Error('Не удалось загрузить организации из базы данных');
  }
}

/**
 * Создает новую организацию.
 * @param {Object} db - Клиент Fastify Postgres.
 * @param {Object} orgData - Данные для новой организации.
 * @returns {Promise<Object>} Созданный объект организации.
 */
export async function createOrganization(db, orgData) {
  try {
    const query = `
      INSERT INTO organizations (short_name, full_name)
      VALUES ($1, $2)
      RETURNING id, short_name, full_name
    `;
    const values = [orgData.shortName, orgData.fullName];
    const result = await db.query(query, values);
    return result.rows[0];
  } catch (error) {
    throw new Error('Не удалось создать организацию в базе данных');
  }
}

/**
 * Получает одну организацию по ID из базы данных.
 * @param {Object} db - Клиент Fastify Postgres.
 * @param {number} id - ID организации.
 * @returns {Promise<Object|null>} Объект организации или null, если не найдена.
 */
export async function getOrganizationById(db, id) {
  try {
    const query = 'SELECT id, short_name, full_name FROM organizations WHERE id = $1';
    const values = [id];
    const result = await db.query(query, values);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    throw new Error('Не удалось загрузить организацию из базы данных');
  }
}

/**
 * Обновляет существующую организацию.
 * @param {Object} db - Клиент Fastify Postgres.
 * @param {number} id - ID организации для обновления.
 * @param {Object} orgData - Новые данные для организации.
 * @returns {Promise<Object>} Обновленный объект организации.
 */
export async function updateOrganization(db, id, orgData) {
  try {
    const query = `
      UPDATE organizations
      SET short_name = COALESCE($1, short_name), full_name = COALESCE($2, full_name)
      WHERE id = $3
      RETURNING id, short_name, full_name
    `;
    const values = [orgData.shortName, orgData.fullName, id];
    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      throw new Error('Организация не найдена');
    }
    return result.rows[0];
  } catch (error) {
    throw new Error('Не удалось обновить организацию в базе данных');
  }
}

/**
 * Удаляет организацию по ID.
 * @param {Object} db - Клиент Fastify Postgres.
 * @param {number} id - ID организации для удаления.
 * @returns {Promise<void>}
 */
export async function deleteOrganization(db, id) {
  try {
    const query = 'DELETE FROM organizations WHERE id = $1';
    const values = [id];
    const result = await db.query(query, values);
    if (result.rowCount === 0) {
      throw new Error('Организация не найдена');
    }
  } catch (error) {
    throw new Error('Не удалось удалить организацию из базы данных');
  }
}