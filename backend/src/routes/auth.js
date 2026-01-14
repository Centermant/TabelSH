import { authenticateUser } from '../services/authService.js';

export default async function authRoutes(fastify, options) {
  fastify.post('/login', async (request, reply) => {
    const { login, password, application } = request.body;

    try {
      const result = await authenticateUser(login, password, application);
      if (result.success) {
        return reply.send(result);
      } else {
        return reply.code(401).send({ error: result.message });
      }
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  fastify.post('/logout', async (request, reply) => {
    // Здесь можно добавить логику инвалидации токена, если используется
    return reply.send({ message: 'Logged out successfully' });
  });
}