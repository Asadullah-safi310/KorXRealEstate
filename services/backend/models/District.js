const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const District = sequelize.define('District', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  province_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'provinces',
      key: 'id',
    },
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
  tableName: 'districts',
  timestamps: true,
});

module.exports = District;
