import { authenticateUser } from '../services/authService.js';

export default async function authRoutes(fastify, options) {
  fastify.post('/login', async (request, reply) => {
    const { login, password, application } = request.body;
    
    try {
      // Передаем клиент БД в сервис аутентификации
      const result = await authenticateUser(fastify.pg, login, password, application);
      
      if (result.success) {
        return reply.send(result);
      } else {
        return reply.code(401).send({ error: result.message });
      }
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Внутренняя ошибка сервера' });
    }
  });
  
  fastify.post('/logout', async (request, reply) => {
    return reply.send({ message: 'Выход выполнен успешно' });
  });
}