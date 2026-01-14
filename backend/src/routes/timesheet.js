import { verifyTimesheetRole } from '../middleware/timesheetMiddleware.js';

export default async function timesheetRoutes(fastify, options) {
  fastify.addHook('preHandler', verifyTimesheetRole);

  // Роуты для Табельного учета будут добавлены позже
  fastify.get('/', async (request, reply) => {
    return { message: 'Welcome to Timesheet API' };
  });
}