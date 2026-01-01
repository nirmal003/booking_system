/**
 * Models Index
 * Auto-loads all Sequelize models and sets up associations
 *
 * This file:
 * 1. Automatically discovers all model files in this directory
 * 2. Initializes each model by passing (sequelize, DataTypes)
 * 3. Calls associate() method on each model to set up relationships
 * 4. Exports all models and sequelize instance
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { DataTypes } = require('sequelize');
const { sequelize, Sequelize } = require('../../config/mysqldb');

const basename = path.basename(__filename);
const db = {};

// Auto-load all model files
fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&        // ✅ Just basic checks
      file !== basename &&
      file.slice(-3) === '.js'
    );
  })
  .forEach(file => {
    const model = require('./' + file)(sequelize, DataTypes);
    db[model.name] = model;
  });


// Call associate method on each model to set up relationships
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Add sequelize instance and Sequelize library to db object
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Sync database (create tables if they don't exist)
const syncDatabase = async () => {
  try {
    await sequelize.sync();
    // await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('✅ Database synchronized successfully');
  } catch (error) {
    console.error('❌ Database sync failed:', error.message);
  }
};


module.exports = { db, syncDatabase };