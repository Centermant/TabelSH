import { verifyTimesheetRole } from '../middleware/timesheetMiddleware.js';
import { getTimesheetEntries, generateAndSaveTimesheet } from '../services/timesheetService.js';
import { getUserById } from '../services/authService.js';

export default async function timesheetEntriesRoutes(fastify, options) {
  fastify.addHook('preHandler', verifyTimesheetRole);

  fastify.get('/entries', async (request, reply) => {
    try {
      const { month, year } = request.query;

      if (!month || !year) {
        return reply.code(400).send({ error: 'Month and year are required' });
      }

      const userId = request.user.userId;

      const entries = await getTimesheetEntries(fastify.pg, parseInt(month), parseInt(year), userId);
      return entries;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch timesheet entries' });
    }
  });

  fastify.post('/generate', async (request, reply) => {
    try {
      const { month, year } = request.body;

      if (!month || !year) {
        return reply.code(400).send({ error: 'Month and year are required in body' });
      }

      const userId = request.user.userId;

      await generateAndSaveTimesheet(fastify.pg, parseInt(month), parseInt(year), userId);
      return reply.send({ message: 'Timesheet generated and saved successfully' });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: `Failed to generate timesheet: ${error.message}` });
    }
  });

  fastify.get('/report-data', async (request, reply) => {
    try {
      const { month, year } = request.query;

      if (!month || !year) {
        return reply.code(400).send({ error: 'Month and year are required' });
      }

      const userId = request.user.userId;

      const entries = await getTimesheetEntries(fastify.pg, parseInt(month), parseInt(year), userId);

      const user = await getUserById(fastify.pg, userId);

      return {
        entries,
        userInfo: { id: user.id, login: user.login, role: user.role }
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch report data' });
    }
  });
}