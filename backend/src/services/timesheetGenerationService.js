export async function generateTimesheetEntries(db, month, year, userId) {
  try {
    const activities = await getWorkActivitiesByPeriod(db, month, year, userId);
    const consultations = await getPhoneConsultationsByPeriod(db, month, year, userId);

    const groupedByDate = {};

    for (const act of activities) {
      const dateStr = act.date.toISOString().split('T')[0];
      if (!groupedByDate[dateStr]) {
        groupedByDate[dateStr] = { date: act.date, activities: [], consultations: [] };
      }
      groupedByDate[dateStr].activities.push(act);
    }

    for (const cons of consultations) {
      const dateStr = cons.date.toISOString().split('T')[0];
      if (!groupedByDate[dateStr]) {
        groupedByDate[dateStr] = { date: cons.date, activities: [], consultations: [] };
      }
      groupedByDate[dateStr].consultations.push(cons);
    }

    const entriesToSave = [];
    for (const dateStr in groupedByDate) {
      const dayData = groupedByDate[dateStr];

      const consultationGroups = groupConsultationsByOrganization(dayData.consultations);
      let totalConsultationHours = 0;
      const consultationParts = [];
      for (const orgName in consultationGroups) {
        const orgCons = consultationGroups[orgName];
        const orgTotalHours = orgCons.reduce((sum, c) => sum + parseFloat(c.spent_time), 0) + (orgCons.length * 0.25);
        totalConsultationHours += orgTotalHours;

        const clientNames = orgCons.map(c => c.client_fio).join(', ');
        consultationParts.push(`Телефонные консультации ${orgName} (${orgTotalHours.toFixed(3)} ч. - ${clientNames})`);
      }

      const signedActivities = dayData.activities.filter(a => a.has_signed_timesheet);
      const unsignedActivities = dayData.activities.filter(a => !a.has_signed_timesheet);
      let totalActivityHours = 0;
      const activityParts = [];

      for (const act of signedActivities) {
        totalActivityHours += parseFloat(act.work_time);
        activityParts.push(`Табель: ${act.organization_name} ${parseFloat(act.work_time).toFixed(3)} ч. (Описание: ${act.activity_type} ${act.description})`);
      }

      for (const act of unsignedActivities) {
        totalActivityHours += parseFloat(act.work_time);
        activityParts.push(`${parseFloat(act.work_time).toFixed(3)} ч. (${act.organization_name} ${act.activity_type} ${act.description})`);
      }

      const totalHours = totalConsultationHours + totalActivityHours;
      const descriptionParts = [...consultationParts, ...activityParts];
      const description = descriptionParts.join(', ');

      entriesToSave.push({
        entry_date: dayData.date,
        work_hours: totalHours,
        description: description
      });
    }

    return entriesToSave;

  } catch (error) {
    throw new Error(`Failed to generate timesheet entries: ${error.message}`);
  }
}

function groupConsultationsByOrganization(consultations) {
  const groups = {};
  for (const cons of consultations) {
    const orgKey = cons.organization_name || 'Клиенты (без организации)';
    if (!groups[orgKey]) {
        groups[orgKey] = [];
    }
    groups[orgKey].push(cons);
  }
  return groups;
}

async function getWorkActivitiesByPeriod(db, month, year, userId) {
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
    throw new Error('Failed to fetch work activities by period from database');
  }
}

async function getPhoneConsultationsByPeriod(db, month, year, userId) {
  try {
    const query = `
      SELECT pc.id, pc.date, pc.spent_time, pc.client_fio, pc.description, o.short_name AS organization_name
      FROM phone_consultations pc
      LEFT JOIN employees e ON pc.client_fio = e.fio
      LEFT JOIN organizations o ON e.organization_id = o.id
      WHERE pc.user_id = $1 AND EXTRACT(MONTH FROM pc.date) = $2 AND EXTRACT(YEAR FROM pc.date) = $3
      ORDER BY pc.date DESC, pc.id
    `;
    const values = [userId, month, year];
    const result = await db.query(query, values);
    return result.rows;
  } catch (error) {
    throw new Error('Failed to fetch phone consultations by period from database');
  }
}