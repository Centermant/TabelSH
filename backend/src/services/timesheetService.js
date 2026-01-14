import { generateTimesheetEntries } from './timesheetGenerationService.js';
import { getUserById } from './authService.js';

export async function getTimesheetEntries(db, month, year, userId) {
  try {
    const checkQuery = `
      SELECT id FROM timesheets WHERE user_id = $1 AND month = $2 AND year = $3
    `;
    const checkValues = [userId, month, year];
    const checkResult = await db.query(checkQuery, checkValues);

    if (checkResult.rows.length === 0) {
      return [];
    }

    const timesheetId = checkResult.rows[0].id;

    const query = `
      SELECT entry_date, work_hours, description
      FROM timesheet_entries
      WHERE timesheet_id = $1
      ORDER BY entry_date
    `;
    const values = [timesheetId];
    const result = await db.query(query, values);
    return result.rows;
  } catch (error) {
    throw new Error('Failed to fetch timesheet entries from database');
  }
}

export async function generateAndSaveTimesheet(db, month, year, userId) {
  try {
    const existingCheckQuery = `
      SELECT id FROM timesheets WHERE user_id = $1 AND month = $2 AND year = $3
    `;
    const existingCheckValues = [userId, month, year];
    const existingCheckResult = await db.query(existingCheckQuery, existingCheckValues);

    let timesheetId;
    if (existingCheckResult.rows.length > 0) {
      timesheetId = existingCheckResult.rows[0].id;
      const deleteEntriesQuery = 'DELETE FROM timesheet_entries WHERE timesheet_id = $1';
      await db.query(deleteEntriesQuery, [timesheetId]);
    } else {
      const insertTimesheetQuery = `
        INSERT INTO timesheets (user_id, month, year, period_start, period_end)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `;
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      const insertTimesheetValues = [userId, month, year, startDate, endDate];
      const insertResult = await db.query(insertTimesheetQuery, insertTimesheetValues);
      timesheetId = insertResult.rows[0].id;
    }

    const newEntries = await generateTimesheetEntries(db, month, year, userId);

    if (newEntries.length > 0) {
      const insertEntryQuery = `
        INSERT INTO timesheet_entries (timesheet_id, entry_date, work_hours, description)
        VALUES ($1, $2, $3, $4)
      `;
      for (const entry of newEntries) {
        const workHoursNum = parseFloat(entry.work_hours);
        if (isNaN(workHoursNum)) {
          throw new Error(`Invalid work_hours value: ${entry.work_hours}`);
        }
        const insertEntryValues = [timesheetId, entry.entry_date, workHoursNum, entry.description];
        await db.query(insertEntryQuery, insertEntryValues);
      }
    }
  } catch (error) {
    throw new Error(`Failed to generate and save timesheet: ${error.message}`);
  }
}