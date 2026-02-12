const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Deal = sequelize.define('Deal', {
  deal_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  property_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  agent_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Agent managing the deal (User)',
  },
  seller_person_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Real person who is selling/leasing',
  },
  buyer_person_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Real person who is buying/renting',
  },
  deal_type: {
    type: DataTypes.ENUM('SALE', 'RENT'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'canceled'),
    defaultValue: 'active',
  },
  price: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true,
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // Snapshots for legal/history reasons
  seller_name_snapshot: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  buyer_name_snapshot: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  seller_phone_snapshot: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  buyer_phone_snapshot: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  deal_completed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'deals',
  timestamps: true,
});

module.exports = Deal;
