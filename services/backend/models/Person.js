const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Person = sequelize.define('Person', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  full_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  national_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true,
  },
  id_card_path: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Path to uploaded ID card photo or file',
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Optional link to a system User account',
  },
}, {
  tableName: 'persons',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Person;
