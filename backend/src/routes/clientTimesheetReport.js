import { verifyTimesheetRole } from '../middleware/timesheetMiddleware.js';
import { getClientTimesheetReportData } from '../services/clientTimesheetReportService.js';

export default async function clientTimesheetReportRoutes(fastify, options) {
  fastify.addHook('preHandler', verifyTimesheetRole);
  
  // GET /api/timesheet/client-report-data - Получить данные отчета за конкретный месяц, год и организацию
  fastify.get('/client-report-data', async (request, reply) => {
    try {
      const { month, year, organizationId } = request.query;
      
      if (!month || !year || !organizationId) {
        return reply.code(400).send({ error: 'Требуются месяц, год и ID организации' });
      }
      
      // Извлекаем userId из JWT токена
      const userId = request.user.userId;
      
      const reportData = await getClientTimesheetReportData(
        fastify.pg, 
        parseInt(month), 
        parseInt(year), 
        parseInt(organizationId), 
        userId
      );
      
      return reportData;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Не удалось загрузить данные отчета по клиентам' });
    }
  });
}