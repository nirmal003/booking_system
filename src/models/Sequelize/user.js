const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      comment: 'Primary key'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Name cannot be empty'
        },
        len: {
          args: [2, 100],
          msg: 'Name must be between 2 and 100 characters'
        }
      },
      comment: 'User full name'
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: {
        msg: 'Email address already exists'
      },
      validate: {
        isEmail: {
          msg: 'Please provide a valid email address'
        },
        notEmpty: {
          msg: 'Email cannot be empty'
        }
      },
      comment: 'User email address (unique)'
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Password cannot be empty'
        },
        len: {
          args: [6, 255],
          msg: 'Password must be at least 6 characters'
        }
      },
      comment: 'Hashed password (bcrypt)'
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      defaultValue: 'user',
      allowNull: false,
      comment: 'User role for authorization'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
      /**
       * Hash password before creating user
       */
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      /**
       * Hash password before updating if password changed
       */
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  /**
   * Instance method to compare password
   * @param {string} candidatePassword - Password to compare
   * @returns {Promise<boolean>} True if password matches
   */
  User.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };

  // Class method to find user with specific attributes
  User.findByEmail = async function(email) {
    return await this.findOne({ where: { email } });
  };

  /**
   * Override toJSON to exclude password from response
   * @returns {Object} User object without password
   */
  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password;
    return values;
  };

  /**
   * Define associations
   * @param {Object} models - All models
   */
  User.associate = function(models) {
    // User has many Bookings
    User.hasMany(models.Booking, {
      foreignKey: 'userId',
      as: 'bookings',
      onDelete: 'CASCADE'
    });
  };

  return User;
};