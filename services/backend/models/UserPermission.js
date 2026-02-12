const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const UserPermission = sequelize.define('UserPermission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'user_id',
    },
  },
  permission_key: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
}, {
  tableName: 'user_permissions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'permission_key'],
    },
  ],
});

module.exports = UserPermission;
