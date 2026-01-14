import { verifyTimesheetRole } from '../middleware/timesheetMiddleware.js';
import { getWorkActivities, createWorkActivity, updateWorkActivity, deleteWorkActivity, getWorkActivityById, getWorkActivitiesByPeriod } from '../services/workActivityService.js';

export default async function workActivityRoutes(fastify, options) {
  fastify.addHook('preHandler', verifyTimesheetRole);
  
  // GET /api/timesheet/work-activities - Получить все активности текущего пользователя (опционально по периоду)
  fastify.get('/work-activities', async (request, reply) => {
    try {
      const { month, year } = request.query;
      // Извлекаем userId из JWT токена (предполагается, что verifyTimesheetRole устанавливает request.user)
      const userId = request.user.userId;
      
      let activities;
      if (month && year) {
        // Передаем userId в сервис
        activities = await getWorkActivitiesByPeriod(fastify.pg, parseInt(month), parseInt(year), userId);
      } else {
        // Передаем userId в сервис
        activities = await getWorkActivities(fastify.pg, userId);
      }
      
      return activities;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Не удалось загрузить рабочие активности' });
    }
  });
  
  // GET /api/timesheet/work-activities/:id - Получить одну активность по ID (если принадлежит пользователю)
  fastify.get('/work-activities/:id', async (request, reply) => {
    const { id } = request.params;
    // Извлекаем userId из JWT токена
    const userId = request.user.userId;
    
    try {
      // Передаем userId в сервис
      const activity = await getWorkActivityById(fastify.pg, id, userId);
      if (!activity) {
        return reply.code(404).send({ error: 'Рабочая активность не найдена или не принадлежит пользователю' });
      }
      return activity;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Не удалось загрузить рабочую активность' });
    }
  });
  
  // POST /api/timesheet/work-activities - Создать новую активность для текущего пользователя
  fastify.post('/work-activities', async (request, reply) => {
    const activityData = request.body;
    // Извлекаем userId из JWT токена
    const userId = request.user.userId;
    
    try {
      // Передаем userId в сервис
      const newActivity = await createWorkActivity(fastify.pg, activityData, userId);
      return reply.code(201).send(newActivity);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Не удалось создать рабочую активность' });
    }
  });
  
  // PUT /api/timesheet/work-activities/:id - Обновить активность (если принадлежит пользователю)
  fastify.put('/work-activities/:id', async (request, reply) => {
    const { id } = request.params;
    const activityData = request.body;
    // Извлекаем userId из JWT токена
    const userId = request.user.userId;
    
    try {
      // Передаем userId в сервис
      const updatedActivity = await updateWorkActivity(fastify.pg, id, activityData, userId);
      if (!updatedActivity) {
        return reply.code(404).send({ error: 'Рабочая активность не найдена или не принадлежит пользователю' });
      }
      return reply.send(updatedActivity);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Не удалось обновить рабочую активность' });
    }
  });
  
  // DELETE /api/timesheet/work-activities/:id - Удалить активность (если принадлежит пользователю)
  fastify.delete('/work-activities/:id', async (request, reply) => {
    const { id } = request.params;
    // Извлекаем userId из JWT токена
    const userId = request.user.userId;
    
    try {
      // Передаем userId в сервис
      const deleted = await deleteWorkActivity(fastify.pg, id, userId);
      if (!deleted) {
        return reply.code(404).send({ error: 'Рабочая активность не найдена или не принадлежит пользователю' });
      }
      return reply.send({ message: 'Рабочая активность успешно удалена' });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Не удалось удалить рабочую активность' });
    }
  });
}