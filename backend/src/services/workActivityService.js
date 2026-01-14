/**
 * Получает все рабочие активности для конкретного пользователя из базы данных.
 * @param {Object} db - Клиент Fastify Postgres.
 * @param {number} userId - ID пользователя, чьи активности нужно получить.
 * @returns {Promise<Array>} Массив рабочих активностей.
 */
export async function getWorkActivities(db, userId) {
  try {
    const query = `
      SELECT wa.id, wa.date, wa.work_time, wa.activity_type, wa.description, wa.has_signed_timesheet, wa.organization_id, o.short_name AS organization_name
      FROM work_activities wa
      LEFT JOIN organizations o ON wa.organization_id = o.id
      WHERE wa.user_id = $1
      ORDER BY wa.date DESC, wa.id
    `;
    const values = [userId];
    const result = await db.query(query, values);
    return result.rows;
  } catch (error) {
    throw new Error('Не удалось загрузить рабочие активности из базы данных');
  }
}

/**
 * Получает рабочие активности для конкретного пользователя и периода (месяц/год).
 * @param {Object} db - Клиент Fastify Postgres.
 * @param {number} month - Месяц (1-12).
 * @param {number} year - Год.
 * @param {number} userId - ID пользователя, чьи активности нужно получить.
 * @returns {Promise<Array>} Массив рабочих активностей за период.
 */
export async function getWorkActivitiesByPeriod(db, month, year, userId) {
  try {
    const query = `
      SELECT wa.id, wa.date, wa.work_time, wa.activity_type, wa.description, wa.has_signed_timesheet, wa.organization_id, o.short_name AS organization_name
      FROM work_activities wa
      LEFT JOIN organizations o ON wa.organization_id = o.id
      WHERE wa.user_id = $1 AND EXTRACT(MONTH FROM wa.date) = $2 AND EXTRACT(YEAR FROM wa.date) = $3
      ORDER BY wa.date DESC, wa.id
    `;
    const values = [userId, month, year];
    const result = await db.query(query, values);
    return result.rows;
  } catch (error) {
    throw new Error('Не удалось загрузить рабочие активности за период из базы данных');
  }
}

/**
 * Получает одну рабочую активность по ID из базы данных, убедившись, что она принадлежит пользователю.
 * @param {Object} db - Клиент Fastify Postgres.
 * @param {number} id - ID рабочей активности.
 * @param {number} userId - ID пользователя, пытающегося получить активность.
 * @returns {Promise<Object|null>} Объект рабочей активности или null, если не найден или не принадлежит пользователю.
 */
export async function getWorkActivityById(db, id, userId) {
  try {
    const query = `
      SELECT wa.id, wa.date, wa.work_time, wa.activity_type, wa.description, wa.has_signed_timesheet, wa.organization_id
      FROM work_activities wa
      WHERE wa.id = $1 AND wa.user_id = $2
    `;
    const values = [id, userId];
    const result = await db.query(query, values);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    throw new Error('Не удалось загрузить рабочую активность из базы данных');
  }
}

/**
 * Создает новую рабочую активность для указанного пользователя.
 * @param {Object} db - Клиент Fastify Postgres.
 * @param {Object} activityData - Данные для новой рабочей активности.
 * @param {number} userId - ID пользователя, создающего активность.
 * @returns {Promise<Object>} Созданный объект рабочей активности.
 */
export async function createWorkActivity(db, activityData, userId) {
  try {
    const query = `
      INSERT INTO work_activities (date, work_time, activity_type, description, has_signed_timesheet, organization_id, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, date, work_time, activity_type, description, has_signed_timesheet, organization_id
    `;
    const values = [
      activityData.date,
      parseFloat(activityData.workTime) || 0,
      activityData.activityType,
      activityData.description || '',
      activityData.hasSignedTimesheet || false,
      activityData.organizationId || null,
      userId // Присваиваем активности ID текущего пользователя
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  } catch (error) {
    throw new Error('Не удалось создать рабочую активность в базе данных');
  }
}

/**
 * Обновляет существующую рабочую активность, убедившись, что она принадлежит пользователю.
 * @param {Object} db - Клиент Fastify Postgres.
 * @param {number} id - ID рабочей активности для обновления.
 * @param {Object} activityData - Новые данные для рабочей активности.
 * @param {number} userId - ID пользователя, пытающегося обновить активность.
 * @returns {Promise<Object>} Обновленный объект рабочей активности или null, если не найден или не принадлежит пользователю.
 */
export async function updateWorkActivity(db, id, activityData, userId) {
  try {
    const query = `
      UPDATE work_activities
      SET date = COALESCE($1, date),
          work_time = COALESCE($2, work_time),
          activity_type = COALESCE($3, activity_type),
          description = COALESCE($4, description),
          has_signed_timesheet = COALESCE($5, has_signed_timesheet),
          organization_id = COALESCE($6, organization_id)
      WHERE id = $7 AND user_id = $8
      RETURNING id, date, work_time, activity_type, description, has_signed_timesheet, organization_id
    `;
    const values = [
      activityData.date,
      parseFloat(activityData.workTime),
      activityData.activityType,
      activityData.description,
      activityData.hasSignedTimesheet,
      activityData.organizationId,
      id,
      userId
    ];
    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      // Либо активность не найдена, либо она не принадлежит пользователю
      return null;
    }
    return result.rows[0];
  } catch (error) {
    throw new Error('Не удалось обновить рабочую активность в базе данных');
  }
}

/**
 * Удаляет рабочую активность по ID, убедившись, что она принадлежит пользователю.
 * @param {Object} db - Клиент Fastify Postgres.
 * @param {number} id - ID рабочей активности для удаления.
 * @param {number} userId - ID пользователя, пытающегося удалить активность.
 * @returns {Promise<boolean>} true, если удаление прошло успешно, false, если активность не найдена или не принадлежит пользователю.
 */
export async function deleteWorkActivity(db, id, userId) {
  try {
    const query = 'DELETE FROM work_activities WHERE id = $1 AND user_id = $2';
    const values = [id, userId];
    const result = await db.query(query, values);
    return result.rowCount > 0; // Возвращаем true, если была удалена 1 строка
  } catch (error) {
    throw new Error('Не удалось удалить рабочую активность из базы данных');
  }
}