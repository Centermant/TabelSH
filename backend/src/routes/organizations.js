import { verifyTimesheetRole } from '../middleware/timesheetMiddleware.js';
import { getOrganizations, createOrganization, updateOrganization, deleteOrganization, getOrganizationById } from '../services/organizationService.js';

export default async function organizationRoutes(fastify, options) {
  fastify.addHook('preHandler', verifyTimesheetRole);
  
  // GET /api/timesheet/organizations - Получить все организации
  fastify.get('/organizations', async (request, reply) => {
    try {
      const orgs = await getOrganizations(fastify.pg);
      return orgs;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Не удалось загрузить организации' });
    }
  });
  
  // GET /api/timesheet/organizations/:id - Получить одну организацию по ID
  fastify.get('/organizations/:id', async (request, reply) => {
    const { id } = request.params;
    try {
      const organization = await getOrganizationById(fastify.pg, id);
      if (!organization) {
        return reply.code(404).send({ error: 'Организация не найдена' });
      }
      return organization;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Не удалось загрузить организацию' });
    }
  });
  
  // POST /api/timesheet/organizations - Создать новую организацию
  fastify.post('/organizations', async (request, reply) => {
    const orgData = request.body;
    try {
      const newOrg = await createOrganization(fastify.pg, orgData);
      return reply.code(201).send(newOrg);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Не удалось создать организацию' });
    }
  });
  
  // PUT /api/timesheet/organizations/:id - Обновить организацию
  fastify.put('/organizations/:id', async (request, reply) => {
    const { id } = request.params;
    const orgData = request.body;
    try {
      const updatedOrg = await updateOrganization(fastify.pg, id, orgData);
      return reply.send(updatedOrg);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Не удалось обновить организацию' });
    }
  });
  
  // DELETE /api/timesheet/organizations/:id - Удалить организацию
  fastify.delete('/organizations/:id', async (request, reply) => {
    const { id } = request.params;
    try {
      await deleteOrganization(fastify.pg, id);
      return reply.send({ message: 'Организация успешно удалена' });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Не удалось удалить организацию' });
    }
  });
}