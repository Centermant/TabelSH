import { verifyAdminRole } from '../middleware/adminMiddleware.js';
import { getUsers, createUser, updateUser, deleteUser, getUserById } from '../services/adminService.js';

export default async function adminRoutes(fastify, options) {
  fastify.addHook('preHandler', verifyAdminRole);
  
  // GET /api/admin/users - Получить всех пользователей
  fastify.get('/users', async (request, reply) => {
    try {
      const users = await getUsers(fastify.pg);
      return users;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Не удалось загрузить пользователей' });
    }
  });
  
  // GET /api/admin/users/:id - Получить одного пользователя по ID
  fastify.get('/users/:id', async (request, reply) => {
    const { id } = request.params;
    try {
      const user = await getUserById(fastify.pg, id);
      if (!user) {
        return reply.code(404).send({ error: 'Пользователь не найден' });
      }
      return user;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Не удалось загрузить пользователя' });
    }
  });
  
  // POST /api/admin/users - Создать нового пользователя
  fastify.post('/users', async (request, reply) => {
    const userData = request.body;
    try {
      const newUser = await createUser(fastify.pg, userData);
      return reply.code(201).send(newUser);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Не удалось создать пользователя' });
    }
  });
  
  // PUT /api/admin/users/:id - Обновить пользователя
  fastify.put('/users/:id', async (request, reply) => {
    const { id } = request.params;
    const userData = request.body;
    try {
      const updatedUser = await updateUser(fastify.pg, id, userData);
      return reply.send(updatedUser);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Не удалось обновить пользователя' });
    }
  });
  
  // DELETE /api/admin/users/:id - Удалить пользователя
  fastify.delete('/users/:id', async (request, reply) => {
    const { id } = request.params;
    try {
      await deleteUser(fastify.pg, id);
      return reply.send({ message: 'Пользователь успешно удален' });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Не удалось удалить пользователя' });
    }
  });
}