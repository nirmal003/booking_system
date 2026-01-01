'use strict';
const { isEmpty } = require("../../src/utils/dataValidator");

module.exports = {
    up: async (queryInterface, Sequelize) => {
        try{
            let columns = await queryInterface.sequelize.queryInterface.describeTable('users');
            if (isEmpty(columns.role)) {
                await queryInterface.addColumn('users', 'role', {
                    type: DataTypes.ENUM('user', 'admin'), defaultValue: 'user', allowNull: false,  after: 'password'
                });
            }
            return;
        }catch(err){
            console.log(err)
        }
    },
    down: async (queryInterface, Sequelize) => {
        return null;
    }
};