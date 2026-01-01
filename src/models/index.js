const { db : mysqlModels } = require('./Sequelize');
const mongodbModels = require('./Mongoose');

// ✅ EXPLICIT exports for VS Code IntelliSense
module.exports = {
  // MySQL Models
  User: mysqlModels.User,
  Booking: mysqlModels.Booking,

  // MongoDB Models
  Event: mongodbModels.Event,
  SystemLog: mongodbModels.SystemLog,

  // Database instances
  sequelize: mysqlModels.sequelize,
  Sequelize: mysqlModels.Sequelize
};

// Log loaded models in development
// if (process.env.NODE_ENV === 'development') {
//   const mysqlModelNames = Object.keys(mysqlModels).filter(k => !['sequelize', 'Sequelize'].includes(k));
//   const mongodbModelNames = Object.keys(mongodbModels);

//   console.log('📦 Loaded MySQL models:', mysqlModelNames);
//   console.log('🍃 Loaded MongoDB models:', mongodbModelNames);
// }