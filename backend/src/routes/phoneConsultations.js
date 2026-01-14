import { verifyTimesheetRole } from '../middleware/timesheetMiddleware.js';
import { getPhoneConsultations, createPhoneConsultation, updatePhoneConsultation, deletePhoneConsultation, getPhoneConsultationsByPeriod, getPhoneConsultationById } from '../services/phoneConsultationService.js';

export default async function phoneConsultationRoutes(fastify, options) {
  fastify.addHook('preHandler', verifyTimesheetRole);
  
  // GET /api/timesheet/phone-consultations - Получить все консультации текущего пользователя (опционально по периоду)
  fastify.get('/phone-consultations', async (request, reply) => {
    try {
      const { month, year } = request.query; // Период передается в query params
      
      // Извлекаем userId из JWT токена (предполагается, что verifyTimesheetRole устанавливает request.user)
      const userId = request.user.userId;
      
      let consultations;
      if (month && year) {
        consultations = await getPhoneConsultationsByPeriod(fastify.pg, parseInt(month), parseInt(year), userId);
      } else {
        consultations = await getPhoneConsultations(fastify.pg, userId); // Получить все для текущего пользователя
      }
      
      return consultations;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Не удалось загрузить телефонные консультации' });
    }
  });
  
  // GET /api/timesheet/phone-consultations/:id - Получить одну консультацию по ID (если принадлежит пользователю)
  fastify.get('/phone-consultations/:id', async (request, reply) => {
    const { id } = request.params;
    // Извлекаем userId из JWT токена
    const userId = request.user.userId;
    
    try {
      const consultation = await getPhoneConsultationById(fastify.pg, id, userId);
      if (!consultation) {
        return reply.code(404).send({ error: 'Телефонная консультация не найдена или не принадлежит пользователю' });
      }
      return consultation;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Не удалось загрузить телефонную консультацию' });
    }
  });
  
  // POST /api/timesheet/phone-consultations - Создать новую консультацию для текущего пользователя
  fastify.post('/phone-consultations', async (request, reply) => {
    const consultationData = request.body;
    // Извлекаем userId из JWT токена
    const userId = request.user.userId;
    
    try {
      const newConsultation = await createPhoneConsultation(fastify.pg, consultationData, userId);
      return reply.code(201).send(newConsultation);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Не удалось создать телефонную консультацию' });
    }
  });
  
  // PUT /api/timesheet/phone-consultations/:id - Обновить консультацию (если принадлежит пользователю)
  fastify.put('/phone-consultations/:id', async (request, reply) => {
    const { id } = request.params;
    const consultationData = request.body;
    // Извлекаем userId из JWT токена
    const userId = request.user.userId;
    
    try {
      const updatedConsultation = await updatePhoneConsultation(fastify.pg, id, consultationData, userId);
      if (!updatedConsultation) {
        return reply.code(404).send({ error: 'Телефонная консультация не найдена или не принадлежит пользователю' });
      }
      return reply.send(updatedConsultation);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Не удалось обновить телефонную консультацию' });
    }
  });
  
  // DELETE /api/timesheet/phone-consultations/:id - Удалить консультацию (если принадлежит пользователю)
  fastify.delete('/phone-consultations/:id', async (request, reply) => {
    const { id } = request.params;
    // Извлекаем userId из JWT токена
    const userId = request.user.userId;
    
    try {
      const deleted = await deletePhoneConsultation(fastify.pg, id, userId);
      if (!deleted) {
        return reply.code(404).send({ error: 'Телефонная консультация не найдена или не принадлежит пользователю' });
      }
      return reply.send({ message: 'Телефонная консультация успешно удалена' });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Не удалось удалить телефонную консультацию' });
    }
  });
}