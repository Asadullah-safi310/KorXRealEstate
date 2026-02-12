const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Province = sequelize.define('Province', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  native_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
}, {
  tableName: 'provinces',
  timestamps: true,
});

module.exports = Province;
