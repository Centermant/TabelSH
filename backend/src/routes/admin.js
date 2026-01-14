import { verifyAdminRole } from '../middleware/adminMiddleware.js';
import { getUsers, createUser, updateUser, deleteUser } from '../services/adminService.js';

export default async function adminRoutes(fastify, options) {
  fastify.addHook('preHandler', verifyAdminRole);

  fastify.get('/users', async (request, reply) => {
    try {
      const users = await getUsers();
      return users;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch users' });
    }
  });

  fastify.post('/users', async (request, reply) => {
    const userData = request.body;
    try {
      const newUser = await createUser(userData);
      return reply.code(201).send(newUser);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Failed to create user' });
    }
  });

  fastify.put('/users/:id', async (request, reply) => {
    const { id } = request.params;
    const userData = request.body;
    try {
      const updatedUser = await updateUser(id, userData);
      return reply.send(updatedUser);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Failed to update user' });
    }
  });

  fastify.delete('/users/:id', async (request, reply) => {
    const { id } = request.params;
    try {
      await deleteUser(id);
      return reply.send({ message: 'User deleted successfully' });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Failed to delete user' });
    }
  });
}