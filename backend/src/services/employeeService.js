/**
 * Получает всех сотрудников из базы данных.
 * @param {Object} db - Клиент Fastify Postgres.
 * @returns {Promise<Array>} Массив сотрудников.
 */
export async function getEmployees(db) {
  try {
    const query = `
      SELECT e.id, e.fio, e.phone_number, e.position, e.notes, e.organization_id, o.short_name AS organization_name
      FROM employees e
      LEFT JOIN organizations o ON e.organization_id = o.id
      ORDER BY e.id
    `;
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    throw new Error('Не удалось загрузить сотрудников из базы данных');
  }
}

/**
 * Получает одного сотрудника по ID из базы данных.
 * @param {Object} db - Клиент Fastify Postgres.
 * @param {number} id - ID сотрудника.
 * @returns {Promise<Object|null>} Объект сотрудника или null, если не найден.
 */
export async function getEmployeeById(db, id) {
  try {
    const query = `
      SELECT e.id, e.fio, e.phone_number, e.position, e.notes, e.organization_id
      FROM employees e
      WHERE e.id = $1
    `;
    const values = [id];
    const result = await db.query(query, values);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    throw new Error('Не удалось загрузить сотрудника из базы данных');
  }
}

/**
 * Создает нового сотрудника.
 * @param {Object} db - Клиент Fastify Postgres.
 * @param {Object} empData - Данные для нового сотрудника.
 * @returns {Promise<Object>} Созданный объект сотрудника.
 */
export async function createEmployee(db, empData) {
  try {
    const query = `
      INSERT INTO employees (fio, phone_number, position, notes, organization_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, fio, phone_number, position, notes, organization_id
    `;
    const values = [
      empData.fio,
      empData.phoneNumber || null,
      empData.position || null,
      empData.notes || null,
      empData.organizationId || null
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  } catch (error) {
    throw new Error('Не удалось создать сотрудника в базе данных');
  }
}

/**
 * Обновляет существующего сотрудника.
 * @param {Object} db - Клиент Fastify Postgres.
 * @param {number} id - ID сотрудника для обновления.
 * @param {Object} empData - Новые данные для сотрудника.
 * @returns {Promise<Object>} Обновленный объект сотрудника.
 */
export async function updateEmployee(db, id, empData) {
  try {
    const query = `
      UPDATE employees
      SET fio = COALESCE($1, fio),
          phone_number = COALESCE($2, phone_number),
          position = COALESCE($3, position),
          notes = COALESCE($4, notes),
          organization_id = COALESCE($5, organization_id)
      WHERE id = $6
      RETURNING id, fio, phone_number, position, notes, organization_id
    `;
    const values = [
      empData.fio,
      empData.phoneNumber || null,
      empData.position || null,
      empData.notes || null,
      empData.organizationId || null,
      id
    ];
    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      throw new Error('Сотрудник не найден');
    }
    return result.rows[0];
  } catch (error) {
    throw new Error('Не удалось обновить сотрудника в базе данных');
  }
}

/**
 * Удаляет сотрудника по ID.
 * @param {Object} db - Клиент Fastify Postgres.
 * @param {number} id - ID сотрудника для удаления.
 * @returns {Promise<void>}
 */
export async function deleteEmployee(db, id) {
  try {
    const query = 'DELETE FROM employees WHERE id = $1';
    const values = [id];
    const result = await db.query(query, values);
    if (result.rowCount === 0) {
      throw new Error('Сотрудник не найден');
    }
  } catch (error) {
    throw new Error('Не удалось удалить сотрудника из базы данных');
  }
}