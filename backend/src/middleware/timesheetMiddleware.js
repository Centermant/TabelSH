import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.SECRET_KEY;

/**
 * Проверяет, имеет ли пользователь доступ к приложению 'timesheet' с использованием JWT токена.
 * @param {Object} request - Объект запроса Fastify.
 * @param {Object} reply - Объект ответа Fastify.
 * @throws Отправит ошибку 403, если проверка не пройдена.
 */
export async function verifyTimesheetRole(request, reply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.code(403).send({ error: 'Требуется аутентификация' });
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.application !== 'timesheet') {
      return reply.code(403).send({ error: 'Требуется доступ к табелю' });
    }
    
    // Прикрепляем информацию о пользователе к запросу для последующего использования, включая userId
    request.user = decoded;
  } catch (error) {
    return reply.code(403).send({ error: 'Неверный или просроченный токен' });
  }
}