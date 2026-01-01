'use strict';
/**
 * Seeder: Demo Users
 *
 * Creates sample user accounts for testing
 * All passwords: password123
 */

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    up: async (queryInterface, Sequelize) => {
        try{
            const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10);
            const hashedPassword = await bcrypt.hash('password123', salt);

            const users = [
              {
                name: 'John Doe',
                email: 'john@example.com',
                password: hashedPassword,
                role: 'user',
                created_at: new Date(),
                updated_at: new Date()
              },
              {
                name: 'Jane Smith',
                email: 'jane@example.com',
                password: hashedPassword,
                role: 'user',
                created_at: new Date(),
                updated_at: new Date()
              },
              {
                name: 'Bob Johnson',
                email: 'bob@example.com',
                password: hashedPassword,
                role: 'user',
                created_at: new Date(),
                updated_at: new Date()
              },
              {
                name: 'Alice Williams',
                email: 'alice@example.com',
                password: hashedPassword,
                role: 'user',
                created_at: new Date(),
                updated_at: new Date()
              }
            ];

            await queryInterface.bulkInsert('users', users, {});

            console.log('✅ Demo users created (password: password123):');
            return;
        }catch(err){
            console.log(err)
        }
    },
    down: async (queryInterface, Sequelize) => {
        return null;
    },
};



