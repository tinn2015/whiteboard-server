export default {
  DATABASE_USER: 'postgres',
  DATABASE_PASSWORD: 'pass123',
  DATABASE_NAME: 'qnwhiteboard',

  /* 本地服务 */
  // DATABASE_PORT: 5432,
  // DATABASE_HOST: 'localhost',

  /* 测试环境 dev */
  // DATABASE_PORT: 5433, // dev
  // DATABASE_HOST: '172.25.9.11',

  /* 生产环境 */
  // DATABASE_PORT: 5432,
  // DATABASE_HOST: '172.25.9.11',
  DATABASE_SYNC: true,
  DATABASE_LOGGING: false,

  /* 集群服务环境 */
  DATABASE_PORT: 5435,
  DATABASE_HOST: '172.25.9.11',
  REDIS_HOST: '172.25.9.11',
  REDIS_PORT: 5379,
  REDIS_PASSWORD: 'qnwbredis123',
};
