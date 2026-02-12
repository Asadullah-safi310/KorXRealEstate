const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PropertyHistory = sequelize.define('PropertyHistory', {
  history_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  property_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  previous_owner_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  new_owner_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  change_type: {
    type: DataTypes.ENUM('CREATED', 'TRANSFERRED_SALE', 'RENTED', 'RETURN'),
    allowNull: false,
  },
  change_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  details: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  tableName: 'property_history',
  timestamps: false,
});

module.exports = PropertyHistory;
