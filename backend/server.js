import Fastify from 'fastify';
import FastifyStatic from '@fastify/static';
import fastifyPostgres from '@fastify/postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Импортируем файлы с роутами
import authRoutes from './src/routes/auth.js';
import adminRoutes from './src/routes/admin.js';
import timesheetRoutes from './src/routes/timesheet.js';

// Получаем __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Создаем экземпляр Fastify
const fastify = Fastify({ logger: true });

// Загружаем конфиг из .env
dotenv.config();

// Подключаем базу данных
fastify.register(fastifyPostgres, {
  connectionString: process.env.DATABASE_URL
});

// Регистрируем плагин для отдачи статических файлов
fastify.register(FastifyStatic, {
  root: path.join(__dirname, '..', 'public'),
});

// Регистрируем API-роуты
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(adminRoutes, { prefix: '/api/admin' });
fastify.register(timesheetRoutes, { prefix: '/api/timesheet' });

// Запускаем сервер
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
