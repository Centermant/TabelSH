/**
 * Получает все телефонные консультации для конкретного пользователя из базы данных.
 * @param {Object} db - Клиент Fastify Postgres.
 * @param {number} userId - ID пользователя, чьи консультации нужно получить.
 * @returns {Promise<Array>} Массив телефонных консультаций.
 */
export async function getPhoneConsultations(db, userId) {
  try {
    // Добавляем JOIN с employees и organizations для получения organization_name
    const query = `
      SELECT pc.id, pc.date, pc.spent_time, pc.client_fio, pc.description, o.short_name AS organization_name
      FROM phone_consultations pc
      LEFT JOIN employees e ON pc.client_fio = e.fio -- Сопоставление по ФИО
      LEFT JOIN organizations o ON e.organization_id = o.id
      WHERE pc.user_id = $1
      ORDER BY pc.date DESC, pc.id
    `;
    const values = [userId];
    const result = await db.query(query, values);
    return result.rows;
  } catch (error) {
    throw new Error('Не удалось загрузить телефонные консультации из базы данных');
  }
}

/**
 * Получает телефонные консультации для конкретного пользователя и периода (месяц/год).
 * @param {Object} db - Клиент Fastify Postgres.
 * @param {number} month - Месяц (1-12).
 * @param {number} year - Год.
 * @param {number} userId - ID пользователя, чьи консультации нужно получить.
 * @returns {Promise<Array>} Массив телефонных консультаций за период.
 */
export async function getPhoneConsultationsByPeriod(db, month, year, userId) {
  try {
    // Добавляем JOIN с employees и organizations для получения organization_name
    const query = `
      SELECT pc.id, pc.date, pc.spent_time, pc.client_fio, pc.description, o.short_name AS organization_name
      FROM phone_consultations pc
      LEFT JOIN employees e ON pc.client_fio = e.fio -- Сопоставление по ФИО
      LEFT JOIN organizations o ON e.organization_id = o.id
      WHERE pc.user_id = $1 AND EXTRACT(MONTH FROM pc.date) = $2 AND EXTRACT(YEAR FROM pc.date) = $3
      ORDER BY pc.date DESC, pc.id
    `;
    const values = [userId, month, year];
    const result = await db.query(query, values);
    return result.rows;
  } catch (error) {
    throw new Error('Не удалось загрузить телефонные консультации за период из базы данных');
  }
}

/**
 * Получает одну телефонную консультацию по ID из базы данных, убедившись, что она принадлежит пользователю.
 * @param {Object} db - Клиент Fastify Postgres.
 * @param {number} id - ID телефонной консультации.
 * @param {number} userId - ID пользователя, пытающегося получить консультацию.
 * @returns {Promise<Object|null>} Объект телефонной консультации или null, если не найден или не принадлежит пользователю.
 */
export async function getPhoneConsultationById(db, id, userId) {
  try {
    // Добавляем JOIN с employees и organizations для получения organization_name
    const query = `
      SELECT pc.id, pc.date, pc.spent_time, pc.client_fio, pc.description, o.short_name AS organization_name
      FROM phone_consultations pc
      LEFT JOIN employees e ON pc.client_fio = e.fio -- Сопоставление по ФИО
      LEFT JOIN organizations o ON e.organization_id = o.id
      WHERE pc.id = $1 AND pc.user_id = $2
    `;
    const values = [id, userId];
    const result = await db.query(query, values);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    throw new Error('Не удалось загрузить телефонную консультацию из базы данных');
  }
}

/**
 * Создает новую телефонную консультацию для указанного пользователя.
 * @param {Object} db - Клиент Fastify Postgres.
 * @param {Object} consultationData - Данные для новой телефонной консультации.
 * @param {number} userId - ID пользователя, создающего консультацию.
 * @returns {Promise<Object>} Созданный объект телефонной консультации.
 */
export async function createPhoneConsultation(db, consultationData, userId) {
  try {
    // Конвертация минут в часы с округлением
    const spentTimeHours = convertMinutesToHours(parseFloat(consultationData.spentTimeMinutes) || 0);
    
    const query = `
      INSERT INTO phone_consultations (date, spent_time, client_fio, description, user_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, date, spent_time, client_fio, description
    `;
    const values = [
      consultationData.date, // Формат даты: YYYY-MM-DD
      spentTimeHours,
      consultationData.clientFio,
      consultationData.description || '',
      userId // Присваиваем консультации ID текущего пользователя
    ];
    const result = await db.query(query, values);
    // Возвращаем данные без organization_name, так как она не вставляется
    return result.rows[0];
  } catch (error) {
    throw new Error('Не удалось создать телефонную консультацию в базе данных');
  }
}

/**
 * Обновляет существующую телефонную консультацию, убедившись, что она принадлежит пользователю.
 * @param {Object} db - Клиент Fastify Postgres.
 * @param {number} id - ID телефонной консультации для обновления.
 * @param {Object} consultationData - Новые данные для телефонной консультации.
 * @param {number} userId - ID пользователя, пытающегося обновить консультацию.
 * @returns {Promise<Object>} Обновленный объект телефонной консультации или null, если не найден или не принадлежит пользователю.
 */
export async function updatePhoneConsultation(db, id, consultationData, userId) {
  try {
    // Конвертация минут в часы с округлением
    const spentTimeHours = convertMinutesToHours(parseFloat(consultationData.spentTimeMinutes) || 0);
    
    const query = `
      UPDATE phone_consultations
      SET date = COALESCE($1, date),
          spent_time = COALESCE($2, spent_time),
          client_fio = COALESCE($3, client_fio),
          description = COALESCE($4, description)
      WHERE id = $5 AND user_id = $6
      RETURNING id, date, spent_time, client_fio, description
    `;
    const values = [
      consultationData.date,
      spentTimeHours,
      consultationData.clientFio,
      consultationData.description,
      id,
      userId
    ];
    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      // Либо консультация не найдена, либо она не принадлежит пользователю
      return null;
    }
    // Возвращаем данные без organization_name, так как она не обновляется
    return result.rows[0];
  } catch (error) {
    throw new Error('Не удалось обновить телефонную консультацию в базе данных');
  }
}

/**
 * Удаляет телефонную консультацию по ID, убедившись, что она принадлежит пользователю.
 * @param {Object} db - Клиент Fastify Postgres.
 * @param {number} id - ID телефонной консультации для удаления.
 * @param {number} userId - ID пользователя, пытающегося удалить консультацию.
 * @returns {Promise<boolean>} true, если удаление прошло успешно, false, если консультация не найдена или не принадлежит пользователю.
 */
export async function deletePhoneConsultation(db, id, userId) {
  try {
    const query = 'DELETE FROM phone_consultations WHERE id = $1 AND user_id = $2';
    const values = [id, userId];
    const result = await db.query(query, values);
    return result.rowCount > 0; // Возвращаем true, если была удалена 1 строка
  } catch (error) {
    throw new Error('Не удалось удалить телефонную консультацию из базы данных');
  }
}

/**
 * Конвертирует минуты в часы с округлением до ближайшего числа, кратного 0.125.
 * @param {number} minutes - Время в минутах.
 * @returns {number} Время в часах, округленное.
 */
function convertMinutesToHours(minutes) {
  if (minutes <= 0) return 0;
  const hours = minutes / 60;
  // Округление к ближайшему большему числу, делящемуся на 0.125
  return Math.ceil(hours / 0.125) * 0.125;
}