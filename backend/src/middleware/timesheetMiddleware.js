import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.SECRET_KEY;

/**
 * Verifies if the user has access to 'timesheet' application using the JWT token.
 * @param {Object} request - Fastify request object.
 * @param {Object} reply - Fastify reply object.
 * @throws Will send a 403 error if verification fails.
 */
export async function verifyTimesheetRole(request, reply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.code(403).send({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.application !== 'timesheet') {
      return reply.code(403).send({ error: 'Timesheet access required' });
    }
    // Optionally attach user info to request for later use
    request.user = decoded;
  } catch (error) {
    return reply.code(403).send({ error: 'Invalid or expired token' });
  }
}