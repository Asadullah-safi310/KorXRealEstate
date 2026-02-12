const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  username: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },

  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
    validate: {
      isEmail: true,
    },
  },

  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },

  full_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },

  phone: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },

  profile_picture: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },

  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  address: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },

  national_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },

  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },

  role: {
    type: DataTypes.ENUM('admin', 'user', 'agent'),
    defaultValue: 'user',
  }

}, {
  tableName: 'users',
  timestamps: true,

  hooks: {
    beforeCreate: async (user) => {
      if (user.password_hash) {
        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(user.password_hash, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password_hash')) {
        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(user.password_hash, salt);
      }
    },
  },
});

User.prototype.validatePassword = async function(password) {
  return bcrypt.compare(password, this.password_hash);
};

module.exports = User;
