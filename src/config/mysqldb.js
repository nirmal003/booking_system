/**
 * Database Configuration
 * Sequelize connection setup with environment-based config
 */

const { Sequelize } = require('sequelize');
const config = require('../../config/database.json');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Replace environment variables in production config
if (env === 'production') {
  dbConfig.username = process.env.MYSQL_USER || dbConfig.username;
  dbConfig.password = process.env.MYSQL_PASSWORD || dbConfig.password;
  dbConfig.database = process.env.MYSQL_DATABASE || dbConfig.database;
  dbConfig.host = process.env.MYSQL_HOST || dbConfig.host;
  dbConfig.port = process.env.MYSQL_PORT || dbConfig.port;
}

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging ? console.log : false,
    pool: dbConfig.pool,
    define: dbConfig.define,
    dialectOptions: dbConfig.dialectOptions || {}
  }
);

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL Database connected successfully (Sequelize)');
  } catch (error) {
    console.error('❌ MySQL Database connection failed:', error.message);
  }
};

testConnection();

module.exports = { sequelize, Sequelize };
