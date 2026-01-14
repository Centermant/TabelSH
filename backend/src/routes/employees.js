import { verifyTimesheetRole } from '../middleware/timesheetMiddleware.js';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, getEmployeeById } from '../services/employeeService.js';

export default async function employeeRoutes(fastify, options) {
  fastify.addHook('preHandler', verifyTimesheetRole);
  
  // GET /api/timesheet/employees - Получить всех сотрудников
  fastify.get('/employees', async (request, reply) => {
    try {
      const emps = await getEmployees(fastify.pg);
      return emps;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Не удалось загрузить сотрудников' });
    }
  });
  
  // GET /api/timesheet/employees/:id - Получить одного сотрудника по ID
  fastify.get('/employees/:id', async (request, reply) => {
    const { id } = request.params;
    try {
      const employee = await getEmployeeById(fastify.pg, id);
      if (!employee) {
        return reply.code(404).send({ error: 'Сотрудник не найден' });
      }
      return employee;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Не удалось загрузить сотрудника' });
    }
  });
  
  // POST /api/timesheet/employees - Создать нового сотрудника
  fastify.post('/employees', async (request, reply) => {
    const empData = request.body;
    try {
      const newEmp = await createEmployee(fastify.pg, empData);
      return reply.code(201).send(newEmp);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Не удалось создать сотрудника' });
    }
  });
  
  // PUT /api/timesheet/employees/:id - Обновить сотрудника
  fastify.put('/employees/:id', async (request, reply) => {
    const { id } = request.params;
    const empData = request.body;
    try {
      const updatedEmp = await updateEmployee(fastify.pg, id, empData);
      return reply.send(updatedEmp);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Не удалось обновить сотрудника' });
    }
  });
  
  // DELETE /api/timesheet/employees/:id - Удалить сотрудника
  fastify.delete('/employees/:id', async (request, reply) => {
    const { id } = request.params;
    try {
      await deleteEmployee(fastify.pg, id);
      return reply.send({ message: 'Сотрудник успешно удален' });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Не удалось удалить сотрудника' });
    }
  });
}