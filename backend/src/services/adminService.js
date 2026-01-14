// Имитация базы данных пользователей админки
let usersDB = [
  { id: 1, login: 'admin', password: 'adminpass', role: 'admin', applications: ['admin', 'timesheet'] },
  { id: 2, login: 'user1', password: 'userpass', role: 'user', applications: ['timesheet'] },
];

let nextUserId = 3;

/**
 * Fetches all users from the database.
 * @returns {Promise<Array>} Array of users.
 */
export async function getUsers() {
  // В реальном приложении это будет запрос к БД
  return [...usersDB]; // Return a copy to prevent direct mutation
}

/**
 * Creates a new user.
 * @param {Object} userData - Data for the new user.
 * @returns {Promise<Object>} Created user object.
 */
export async function createUser(userData) {
  const newUser = {
    id: nextUserId++,
    ...userData
  };
  usersDB.push(newUser);
  return newUser;
}

/**
 * Updates an existing user.
 * @param {number} id - ID of the user to update.
 * @param {Object} userData - New data for the user.
 * @returns {Promise<Object>} Updated user object.
 */
export async function updateUser(id, userData) {
  const index = usersDB.findIndex(user => user.id === id);
  if (index !== -1) {
    usersDB[index] = { ...usersDB[index], ...userData };
    return usersDB[index];
  }
  throw new Error('User not found');
}

/**
 * Deletes a user by ID.
 * @param {number} id - ID of the user to delete.
 * @returns {Promise<void>}
 */
export async function deleteUser(id) {
  const initialLength = usersDB.length;
  usersDB = usersDB.filter(user => user.id !== id);
  if (usersDB.length === initialLength) {
    throw new Error('User not found');
  }
}