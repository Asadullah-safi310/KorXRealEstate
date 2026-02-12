const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Area = sequelize.define('Area', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  district_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'districts',
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
  tableName: 'areas',
  timestamps: true,
});

module.exports = Area;
