'use strict';
/**
 * Seeder: Admin User
 *
 * Creates default admin user for system management
 * Email: admin@eventticket.com
 * Password: admin123
 */

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    up: async (queryInterface, Sequelize) => {
        try{
            const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10);
            const hashedPassword = await bcrypt.hash('admin123', salt);

            await queryInterface.bulkInsert('users', [
              { name: 'System Administrator', email: 'admin@eventticket.com', password: hashedPassword, role: 'admin', created_at: new Date(), updated_at: new Date() }
            ], {});

            console.log('✅ Admin user created: admin@eventticket.com / admin123');
            return;
        }catch(err){
            console.log(err)
        }
    },
    down: async (queryInterface, Sequelize) => {
        return null;
    },
};
