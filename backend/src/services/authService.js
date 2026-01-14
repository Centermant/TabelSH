import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.SECRET_KEY;

// Имитация базы данных пользователей
const usersDB = [
  { id: 1, login: 'admin', password: 'adminpass', role: 'admin', applications: ['admin', 'timesheet'] },
  { id: 2, login: 'user1', password: 'userpass', role: 'user', applications: ['timesheet'] },
];

/**
 * Authenticates a user based on login, password, and selected application.
 * @param {string} login - User's login.
 * @param {string} password - User's password.
 * @param {string} application - Selected application ('admin' or 'timesheet').
 * @returns {Promise<Object>} Result object containing success status, token, and user info.
 */
export async function authenticateUser(login, password, application) {
  const user = usersDB.find(u => u.login === login && u.password === password);

  if (!user) {
    return { success: false, message: 'Invalid credentials' };
  }

  if (!user.applications.includes(application)) {
    return { success: false, message: 'Access denied for selected application' };
  }

  const token = jwt.sign(
    { userId: user.id, login: user.login, role: user.role, application },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  return {
    success: true,
    token,
    user: { id: user.id, login: user.login, role: user.role }
  };
}