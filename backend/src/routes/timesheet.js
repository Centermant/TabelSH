import { verifyTimesheetRole } from '../middleware/timesheetMiddleware.js';

export default async function timesheetRoutes(fastify, options) {
  fastify.addHook('preHandler', verifyTimesheetRole);
  
  // GET /api/timesheet/ - Приветственное сообщение для API табельного учета
  fastify.get('/', async (request, reply) => {
    return { message: 'Добро пожаловать в API Табельного учета' };
  });
}