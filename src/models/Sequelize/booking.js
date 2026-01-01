/**
 * Booking Model
 * Sequelize model for ticket bookings
 */

module.exports = (sequelize, DataTypes) => {
  const Booking = sequelize.define('Booking', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      comment: 'Primary key'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Foreign key to users table'
    },
    eventId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'event_id',
      comment: 'MongoDB Event ObjectId reference'
    },
    eventName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'event_name',
      comment: 'Denormalized event name for quick access'
    },
    ticketCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: 'ticket_count',
      validate: {
        min: {
          args: [1],
          msg: 'Ticket count must be at least 1'
        },
        max: {
          args: [10],
          msg: 'Cannot book more than 10 tickets at once'
        }
      },
      comment: 'Number of tickets booked'
    },
    status: {
      type: DataTypes.ENUM('confirmed', 'cancelled'),
      defaultValue: 'confirmed',
      allowNull: false,
      comment: 'Booking status'
    }
  }, {
    tableName: 'bookings',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_bookings_user_id',
        fields: ['user_id']
      },
      {
        name: 'idx_bookings_event_id',
        fields: ['event_id']
      },
      {
        name: 'idx_bookings_status',
        fields: ['status']
      },
      {
        name: 'idx_bookings_user_status',
        fields: ['user_id', 'status']
      }
    ]
  });

  /**
   * Define associations
   * @param {Object} models - All models
   */
  Booking.associate = function(models) {
    // Booking belongs to User
    Booking.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE'
    });
  };

  return Booking;
};