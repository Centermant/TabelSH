/**
 * Получает данные для отчета табеля по клиентам за конкретный период и организацию.
 * Исключает рабочие активности, отмеченные как "подписанный табель".
 * @param {Object} db - Клиент Fastify Postgres.
 * @param {number} month - Месяц (1-12).
 * @param {number} year - Год.
 * @param {number} organizationId - ID организации для фильтрации.
 * @param {number} userId - ID аутентифицированного пользователя (может использоваться для проверки прав).
 * @returns {Promise<Object>} Объект, содержащий данные отчета и связанную информацию (например, название организации).
 */
export async function getClientTimesheetReportData(db, month, year, organizationId, userId) {
  try {
    // Получить название организации
    const orgQuery = 'SELECT short_name FROM organizations WHERE id = $1';
    const orgResult = await db.query(orgQuery, [organizationId]);
    if (orgResult.rows.length === 0) {
      throw new Error('Организация не найдена');
    }
    const organizationName = orgResult.rows[0].short_name;
    
    // Получить неподписанные рабочие активности для организации за период
    const activitiesQuery = `
      SELECT date, work_time, activity_type, description
      FROM work_activities
      WHERE organization_id = $1 AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3
      AND has_signed_timesheet = FALSE
      ORDER BY date
    `;
    const activitiesValues = [organizationId, month, year];
    const activitiesResult = await db.query(activitiesQuery, activitiesValues);
    const activities = activitiesResult.rows.map(act => {
      // Преобразуем строку даты в объект Date
      return {
        ...act,
        date: new Date(act.date)
      };
    });
    
    // Получить телефонные консультации для сотрудников организации за период
    // Сначала получим список ФИО сотрудников из организации
    const employeesQuery = 'SELECT fio FROM employees WHERE organization_id = $1';
    const employeesResult = await db.query(employeesQuery, [organizationId]);
    const employeeFios = employeesResult.rows.map(emp => emp.fio);
    
    if (employeeFios.length === 0) {
      // Если сотрудников нет, то и консультаций быть не может
      return {
        organizationName,
        activities,
        phoneConsultations: []
      };
    }
    
    // Используем UNNEST с ARRAY для IN-клаузы
    const consultationsQuery = `
      SELECT date, spent_time, client_fio, description
      FROM phone_consultations
      WHERE client_fio = ANY($1::text[]) AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3
      ORDER BY date, client_fio
    `;
    const consultationsValues = [employeeFios, month, year]; // Передаем массив как первый параметр
    const consultationsResult = await db.query(consultationsQuery, consultationsValues);
    const consultations = consultationsResult.rows.map(cons => {
      // Преобразуем строку даты в объект Date
      return {
        ...cons,
        date: new Date(cons.date)
      };
    });
    
    // Сгруппировать консультации по дате
    const groupedConsultations = {};
    for (const cons of consultations) {
      const dateStr = cons.date.toISOString().split('T')[0]; // YYYY-MM-DD
      if (!groupedConsultations[dateStr]) {
        groupedConsultations[dateStr] = [];
      }
      groupedConsultations[dateStr].push(cons);
    }
    
    return {
      organizationName,
      activities,
      phoneConsultations: groupedConsultations
    };
  } catch (error) {
    throw new Error('Не удалось загрузить данные отчета по клиентам из базы данных: ' + error.message);
  }
}